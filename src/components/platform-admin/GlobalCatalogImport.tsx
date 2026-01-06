import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface GlobalCatalogImportProps {
  onSuccess?: () => void;
}

// Nouveau mapping des colonnes Excel vers les colonnes de la base de données
const EXCEL_COLUMN_MAPPING: Record<string, string> = {
  'EAN13/CIP': 'code_cip',
  'Ancien EAN13/CIP': 'ancien_code_cip',
  'Libellé produit': 'libelle_produit',
  'Prix de Vente Etablt': 'prix_achat_reference',
  'Prix Public Etablt': 'prix_vente_reference',
  'Prix de Vente Etablt PNR': 'prix_achat_reference_pnr',
  'Prix Public Etablt PNR': 'prix_vente_reference_pnr',
  'TVA': 'tva_value', // Traitement spécial -> boolean tva
  'Libellé Classe Thérapeutique': 'libelle_classe_therapeutique',
  'Libellé Famille': 'libelle_famille',
  'Libellé Forme': 'libelle_forme',
  'Libellé Laboratoire': 'libelle_laboratoire',
  'Libellé Rayon': 'libelle_rayon',
  'Libellé DCI': 'libelle_dci',
  'Libellé Catégorie': 'libelle_categorie_tarification',
  'Libellé Statut': 'libelle_statut'
};

interface ParsedProduct {
  code_cip: string;
  ancien_code_cip?: string;
  libelle_produit: string;
  prix_achat_reference?: number;
  prix_vente_reference?: number;
  prix_achat_reference_pnr?: number;
  prix_vente_reference_pnr?: number;
  tva: boolean;
  libelle_classe_therapeutique?: string;
  libelle_famille?: string;
  libelle_forme?: string;
  libelle_laboratoire?: string;
  libelle_rayon?: string;
  libelle_dci?: string;
  libelle_categorie_tarification?: string;
  libelle_statut?: string;
}

interface SkippedGroup {
  reason: string;
  count: number;
  examples: string[];
}

const GlobalCatalogImport: React.FC<GlobalCatalogImportProps> = ({ onSuccess }) => {
  const { platformAdmin } = usePlatformAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [skippedProducts, setSkippedProducts] = useState<SkippedGroup[]>([]);
  const [totalDetected, setTotalDetected] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: number;
    duplicates: number;
    skipped: number;
  } | null>(null);

  // Fonction pour normaliser les en-têtes (gère espaces, NBSP, etc.)
  const normalizeHeader = (header: string): string => {
    return header
      .replace(/\u00A0/g, ' ')  // Remplace les espaces insécables (NBSP)
      .replace(/\s+/g, ' ')     // Collapse multiples espaces
      .trim()                   // Supprime espaces début/fin
      .toLowerCase();           // Minuscules pour comparaison
  };

  // Créer le mapping normalisé une seule fois
  const NORMALIZED_MAPPING: Record<string, string> = Object.fromEntries(
    Object.entries(EXCEL_COLUMN_MAPPING).map(([excelCol, dbCol]) => [
      normalizeHeader(excelCol),
      dbCol
    ])
  );

  // Fonction pour normaliser les codes EAN/CIP (gère la notation scientifique)
  const normalizeEAN = (value: any): string | null => {
    if (value === undefined || value === null || value === '') return null;
    
    if (typeof value === 'number') {
      return Math.round(value).toFixed(0);
    }
    
    const strVal = String(value).trim();
    
    if (strVal.includes('E+') || strVal.includes('e+') || strVal.includes('E-') || strVal.includes('e-')) {
      const num = parseFloat(strVal);
      if (!isNaN(num)) {
        return Math.round(num).toFixed(0);
      }
    }
    
    return strVal;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { raw: true });

      if (jsonData.length === 0) {
        toast.error('Le fichier Excel est vide');
        return;
      }

      const columns = Object.keys(jsonData[0]);
      setExcelColumns(columns);

      // Mapper les données avec suivi des produits ignorés
      setTotalDetected(jsonData.length);
      
      const allMappedData = jsonData.map((row, index) => {
        const product: Record<string, any> = {};
        
        // Normaliser les clés de la ligne Excel
        const normalizedRow: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
          normalizedRow[normalizeHeader(key)] = value;
        }
        
        // Variables temporaires pour les transformations
        let tvaValue = 0;
        let libelleRayon: string | null = null;
        let libelleForme: string | null = null;
        let libelleCategorie: string | null = null;
        
        // Utiliser le mapping normalisé
        for (const [normalizedExcelCol, dbCol] of Object.entries(NORMALIZED_MAPPING)) {
          const value = normalizedRow[normalizedExcelCol];
          
          if (value !== undefined && value !== null && value !== '') {
            // Traitement spécial pour les codes CIP/EAN
            if (dbCol === 'code_cip' || dbCol === 'ancien_code_cip') {
              const normalized = normalizeEAN(value);
              if (normalized && normalized !== '0') {
                product[dbCol] = normalized;
              }
            }
            // Traitement pour TVA -> stocker la valeur pour conversion boolean
            else if (dbCol === 'tva_value') {
              tvaValue = parseFloat(String(value).replace(',', '.')) || 0;
            }
            // Convertir les valeurs numériques de prix
            else if (['prix_achat_reference', 'prix_vente_reference', 'prix_achat_reference_pnr', 'prix_vente_reference_pnr'].includes(dbCol)) {
              product[dbCol] = parseFloat(String(value).replace(',', '.')) || 0;
            }
            // Libellé Rayon
            else if (dbCol === 'libelle_rayon') {
              libelleRayon = String(value).trim();
            }
            // Libellé Forme
            else if (dbCol === 'libelle_forme') {
              libelleForme = String(value).trim();
              product[dbCol] = libelleForme;
            }
            // Libellé Catégorie
            else if (dbCol === 'libelle_categorie_tarification') {
              libelleCategorie = String(value).trim();
            }
            else {
              product[dbCol] = String(value).trim();
            }
          }
        }
        
        // Transformation TVA : Si > 0 alors TRUE, sinon FALSE
        product.tva = tvaValue > 0;
        
        // Transformation libelle_rayon : Si vide, prend libelle_forme
        product.libelle_rayon = libelleRayon || libelleForme || null;
        
        // Transformation libelle_categorie_tarification
        if (libelleCategorie) {
          product.libelle_categorie_tarification = libelleCategorie;
        } else if (!product.tva) {
          product.libelle_categorie_tarification = 'MEDICAMENTS';
        } else {
          product.libelle_categorie_tarification = 'PARAPHARMACIES AVEC TVA';
        }
        
        return {
          product: product as ParsedProduct,
          rowIndex: index + 2, // +2 car Excel commence à 1 et l'en-tête est ligne 1
          rawRow: row
        };
      });

      // Analyser les produits ignorés
      const validProducts: ParsedProduct[] = [];
      const skipped: { reason: string; rowIndex: number; details: string }[] = [];

      allMappedData.forEach(({ product, rowIndex, rawRow }) => {
        if (!product.code_cip) {
          skipped.push({
            reason: 'Code CIP/EAN manquant ou invalide',
            rowIndex,
            details: `Libellé: ${product.libelle_produit || rawRow['Libellé produit'] || 'N/A'}`
          });
        } else if (!product.libelle_produit) {
          skipped.push({
            reason: 'Libellé produit manquant',
            rowIndex,
            details: `CIP: ${product.code_cip}`
          });
        } else {
          validProducts.push(product);
        }
      });

      // Dédoublonner par code_cip - garder la dernière occurrence
      const productsByCode = new Map<string, { product: ParsedProduct; rowIndex: number }>();
      const duplicatesInFile: { reason: string; rowIndex: number; details: string }[] = [];

      validProducts.forEach((product) => {
        const code = product.code_cip;
        // Trouver l'index de ligne original
        const mappedItem = allMappedData.find(d => d.product.code_cip === code);
        const rowIndex = mappedItem?.rowIndex || 0;
        
        if (productsByCode.has(code)) {
          // C'est un doublon - on garde le nouveau et on note l'ancien
          const existing = productsByCode.get(code)!;
          duplicatesInFile.push({
            reason: 'Code CIP en double dans le fichier',
            rowIndex: existing.rowIndex,
            details: `CIP: ${code} - "${existing.product.libelle_produit}" (remplacé par ligne ${rowIndex})`
          });
        }
        productsByCode.set(code, { product, rowIndex });
      });

      // Récupérer les produits uniques
      const uniqueProducts = Array.from(productsByCode.values()).map(v => v.product);

      // Grouper les produits ignorés par raison
      const groupedSkipped = [...skipped, ...duplicatesInFile].reduce((acc, item) => {
        const existing = acc.find(g => g.reason === item.reason);
        if (existing) {
          existing.count++;
          if (existing.examples.length < 5) {
            existing.examples.push(`Ligne ${item.rowIndex}: ${item.details}`);
          }
        } else {
          acc.push({
            reason: item.reason,
            count: 1,
            examples: [`Ligne ${item.rowIndex}: ${item.details}`]
          });
        }
        return acc;
      }, [] as SkippedGroup[]);

      // Afficher un warning si des doublons ont été détectés
      if (duplicatesInFile.length > 0) {
        toast.warning(`${duplicatesInFile.length} produit(s) en double détectés dans le fichier (dernière occurrence conservée)`);
      }

      setSkippedProducts(groupedSkipped);
      setParsedData(uniqueProducts);
      
      if (validProducts.length === 0) {
        const detectedNormalized = columns.map(c => normalizeHeader(c));
        const expectedNormalized = Object.keys(NORMALIZED_MAPPING);
        console.warn('=== DIAGNOSTIC IMPORT ===');
        console.warn('Colonnes détectées (normalisées):', detectedNormalized);
        console.warn('Colonnes attendues (normalisées):', expectedNormalized);
        console.warn('1ère ligne brute:', jsonData[0]);
        toast.error('Aucun produit valide détecté. Vérifiez les colonnes EAN13/CIP et Libellé produit.');
      } else {
        toast.success(`${uniqueProducts.length} produits uniques détectés sur ${jsonData.length}`);
        if (groupedSkipped.length > 0) {
          const totalSkipped = groupedSkipped.reduce((sum, g) => sum + g.count, 0);
          toast.warning(`${totalSkipped} produit(s) ignoré(s) - voir les détails ci-dessous`);
        }
      }
    } catch (error) {
      console.error('Error parsing Excel:', error);
      toast.error('Erreur lors de la lecture du fichier Excel');
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0 || !platformAdmin) return;

    setImporting(true);
    setProgress(0);

    let success = 0;
    let errors = 0;
    let duplicates = 0;
    const batchSize = 50;

    try {
      for (let i = 0; i < parsedData.length; i += batchSize) {
        const batch = parsedData.slice(i, i + batchSize);
        
        const productsToInsert = batch.map(product => ({
          ...product,
          created_by: platformAdmin.id,
          updated_by: platformAdmin.id
        }));

        const { data, error } = await supabase
          .from('catalogue_global_produits')
          .upsert(productsToInsert, {
            onConflict: 'code_cip',
            ignoreDuplicates: false
          })
          .select('id');

        if (error) {
          console.error('Batch error:', error);
          errors += batch.length;
        } else {
          success += data?.length || 0;
          duplicates += batch.length - (data?.length || 0);
        }

        setProgress(Math.round(((i + batch.length) / parsedData.length) * 100));
      }

      const totalSkipped = skippedProducts.reduce((sum, g) => sum + g.count, 0);
      setImportResult({ success, errors, duplicates, skipped: totalSkipped });
      
      if (success > 0) {
        toast.success(`Import terminé: ${success} produits importés`);
        onSuccess?.();
      } else {
        toast.error('Aucun produit n\'a pu être importé');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setParsedData([]);
    setExcelColumns([]);
    setImportResult(null);
    setProgress(0);
    setSkippedProducts([]);
    setTotalDetected(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Zone de téléchargement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importer depuis un fichier Excel
          </CardTitle>
          <CardDescription>
            Importez les produits depuis un fichier Excel (.xlsx, .xls). Les produits existants seront mis à jour.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              {file ? file.name : 'Cliquez pour sélectionner un fichier Excel'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Formats acceptés: .xlsx, .xls
            </p>
          </div>

          {file && (
            <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} Ko • {totalDetected} produits détectés
                    {skippedProducts.length > 0 && (
                      <span className="text-yellow-600 ml-1">
                        ({parsedData.length} valides, {skippedProducts.reduce((sum, g) => sum + g.count, 0)} ignorés)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={resetImport}>
                Supprimer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mapping des colonnes */}
      {excelColumns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Colonnes détectées</CardTitle>
            <CardDescription>
              Les colonnes suivantes ont été détectées dans votre fichier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {excelColumns.map((col, index) => {
                const isMatched = EXCEL_COLUMN_MAPPING[col] || 
                  Object.keys(EXCEL_COLUMN_MAPPING).some(
                    expected => normalizeHeader(expected) === normalizeHeader(col)
                  );
                return (
                  <Badge 
                    key={index} 
                    variant={isMatched ? 'default' : 'secondary'}
                  >
                    {col}
                    {isMatched && (
                      <CheckCircle2 className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prévisualisation */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prévisualisation ({Math.min(10, parsedData.length)} premiers produits)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code CIP</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Forme</TableHead>
                    <TableHead>TVA</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Prix Vente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 10).map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{product.code_cip}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{product.libelle_produit}</TableCell>
                      <TableCell>{product.libelle_forme || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={product.tva ? 'default' : 'secondary'}>
                          {product.tva ? 'Oui' : 'Non'}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.libelle_categorie_tarification || '-'}</TableCell>
                      <TableCell className="text-right">
                        {product.prix_vente_reference?.toLocaleString() || 0} FCFA
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parsedData.length > 10 && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                ... et {parsedData.length - 10} autres produits
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Produits ignorés */}
      {skippedProducts.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              Produits ignorés ({skippedProducts.reduce((sum, g) => sum + g.count, 0)})
            </CardTitle>
            <CardDescription>
              Ces produits ne seront pas importés car ils ne respectent pas les critères requis (Code CIP et Libellé obligatoires)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {skippedProducts.map((group, idx) => (
                <div key={idx} className="p-3 bg-yellow-500/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{group.reason}</span>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      {group.count} produit(s)
                    </Badge>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {group.examples.map((ex, i) => (
                      <li key={i}>• {ex}</li>
                    ))}
                    {group.count > 5 && (
                      <li className="italic">... et {group.count - 5} autres</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progression de l'import */}
      {importing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Import en cours...</span>
                </div>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultat de l'import */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.errors === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              Résultat de l'import
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <p className="text-2xl font-bold text-green-500">{importResult.success}</p>
                <p className="text-sm text-muted-foreground">Importés</p>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                <p className="text-2xl font-bold text-blue-500">{importResult.duplicates}</p>
                <p className="text-sm text-muted-foreground">Mis à jour</p>
              </div>
              <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                <p className="text-2xl font-bold text-yellow-500">{importResult.skipped}</p>
                <p className="text-sm text-muted-foreground">Ignorés</p>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-lg">
                <p className="text-2xl font-bold text-red-500">{importResult.errors}</p>
                <p className="text-sm text-muted-foreground">Erreurs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boutons d'action */}
      {parsedData.length > 0 && !importing && (
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={resetImport}>
            Annuler
          </Button>
          <Button onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Importer {parsedData.length} produits
          </Button>
        </div>
      )}
    </div>
  );
};

export default GlobalCatalogImport;
