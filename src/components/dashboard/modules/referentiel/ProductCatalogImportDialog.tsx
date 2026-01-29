import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalCatalogLookup, PriceRegion } from '@/hooks/useGlobalCatalogLookup';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface ProductCatalogImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ImportResult {
  totalLines: number;
  created: number;
  notFound: string[];
  noCipCode: string[];
  alreadyExists: string[];
  errors: string[];
}

interface ExcelRow {
  CodeCIP?: string | number;
  Catégorie?: string;
}

const BATCH_SIZE = 50;

const ProductCatalogImportDialog: React.FC<ProductCatalogImportDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showNotFound, setShowNotFound] = useState(false);
  const [showNoCip, setShowNoCip] = useState(false);
  const [showAlreadyExists, setShowAlreadyExists] = useState(false);
  const [priceRegion, setPriceRegion] = useState<PriceRegion>('brazzaville');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { personnel } = useAuth();
  const tenantId = personnel?.tenant_id;
  const { 
    searchGlobalCatalogBatch, 
    checkExistingProductsBatch,
    mapToLocalReferences, 
    findOrCreatePricingCategoryByLabel 
  } = useGlobalCatalogLookup();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const resetState = () => {
    setFile(null);
    setIsProcessing(false);
    setProgress({ current: 0, total: 0, phase: '' });
    setResult(null);
    setShowNotFound(false);
    setShowNoCip(false);
    setShowAlreadyExists(false);
    setPriceRegion('brazzaville');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetState();
      onOpenChange(false);
    }
  };

  const processFile = async () => {
    if (!file || !tenantId) return;

    setIsProcessing(true);
    setResult(null);

    try {
      // 1. Read Excel file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

      if (rows.length === 0) {
        toast.error("Le fichier est vide ou le format est incorrect.");
        setIsProcessing(false);
        return;
      }

      const importResult: ImportResult = {
        totalLines: rows.length,
        created: 0,
        notFound: [],
        noCipCode: [],
        alreadyExists: [],
        errors: [],
      };

      // 2. Extract all valid CIP codes and identify rows without CIP
      setProgress({ current: 0, total: rows.length, phase: 'Extraction des codes CIP...' });
      
      const rowsWithCip: { row: ExcelRow; codeCip: string; index: number }[] = [];
      
      rows.forEach((row, index) => {
        const rawCip = row.CodeCIP;
        const categorie = row.Catégorie ? String(row.Catégorie).trim() : null;
        
        if (!rawCip || String(rawCip).trim() === '' || String(rawCip).trim() === '0') {
          importResult.noCipCode.push(categorie || `Ligne ${index + 2}`);
        } else {
          rowsWithCip.push({ 
            row, 
            codeCip: String(rawCip).trim(), 
            index 
          });
        }
      });

      if (rowsWithCip.length === 0) {
        toast.error("Aucun code CIP valide trouvé dans le fichier.");
        setIsProcessing(false);
        setResult(importResult);
        return;
      }

      const allCipCodes = rowsWithCip.map(r => r.codeCip);

      // 3. Phase 1: Batch check for existing products in local catalog
      setProgress({ current: 0, total: rows.length, phase: 'Vérification produits existants...' });
      const existingCodes = await checkExistingProductsBatch(allCipCodes);

      // Filter out already existing products
      const codesToSearch = allCipCodes.filter(code => !existingCodes.has(code));
      existingCodes.forEach(code => {
        importResult.alreadyExists.push(code);
      });

      if (codesToSearch.length === 0) {
        toast.info("Tous les produits existent déjà dans le catalogue.");
        setIsProcessing(false);
        setResult(importResult);
        return;
      }

      // 4. Phase 2: Batch search in global catalog
      setProgress({ current: 0, total: rows.length, phase: 'Recherche catalogue global...' });
      const globalProductsMap = await searchGlobalCatalogBatch(codesToSearch);

      // 5. Phase 3: Pre-create all unique categories from Excel
      setProgress({ current: 0, total: rows.length, phase: 'Préparation des catégories...' });
      const uniqueCategories = [...new Set(
        rowsWithCip
          .map(r => r.row.Catégorie)
          .filter((c): c is string => !!c && c.trim() !== '')
          .map(c => c.trim())
      )];
      
      const categoryMap = new Map<string, string>();
      for (const cat of uniqueCategories) {
        const id = await findOrCreatePricingCategoryByLabel(cat);
        if (id) {
          categoryMap.set(cat.trim().toUpperCase(), id);
        }
      }

      // 6. Phase 4: Process insertions (only rows not already existing and found in global catalog)
      const rowsToInsert = rowsWithCip.filter(
        r => !existingCodes.has(r.codeCip) && globalProductsMap.has(r.codeCip)
      );

      // Mark not found
      rowsWithCip
        .filter(r => !existingCodes.has(r.codeCip) && !globalProductsMap.has(r.codeCip))
        .forEach(r => importResult.notFound.push(r.codeCip));

      setProgress({ current: 0, total: rowsToInsert.length, phase: 'Création des produits...' });

      for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
        const batch = rowsToInsert.slice(i, i + BATCH_SIZE);

        for (const { row, codeCip } of batch) {
          try {
            const globalProduct = globalProductsMap.get(codeCip);
            if (!globalProduct) continue; // Should not happen, but safeguard

            // Map to local references (creates famille, rayon, forme, DCI, etc. if needed)
            // Pass the selected price region to use the correct prices
            const mappedData = await mapToLocalReferences(globalProduct, priceRegion);

            // Override category with Excel value if provided
            let categorie_tarification_id = mappedData.categorie_tarification_id;
            const excelCategorie = row.Catégorie ? String(row.Catégorie).trim().toUpperCase() : null;
            if (excelCategorie && categoryMap.has(excelCategorie)) {
              categorie_tarification_id = categoryMap.get(excelCategorie);
            }

            // Insert product
            const { data: insertedProduct, error: insertError } = await supabase
              .from('produits')
              .insert({
                tenant_id: tenantId,
                code_cip: mappedData.code_cip,
                ancien_code_cip: mappedData.ancien_code_cip || null,
                libelle_produit: mappedData.libelle_produit,
                famille_id: mappedData.famille_id || null,
                rayon_id: mappedData.rayon_id || null,
                forme_id: mappedData.forme_id || null,
                classe_therapeutique_id: mappedData.classe_therapeutique_id || null,
                laboratoires_id: mappedData.laboratoires_id || null,
                categorie_tarification_id: categorie_tarification_id || null,
                prix_achat: mappedData.prix_achat || null,
                prix_vente_ttc: mappedData.prix_vente_ttc || null,
                is_active: true,
              })
              .select('id')
              .single();

            if (insertError) {
              if (insertError.message?.includes('duplicate key')) {
                importResult.alreadyExists.push(codeCip);
              } else {
                importResult.errors.push(`${codeCip}: ${insertError.message}`);
              }
              continue;
            }

            // Insert DCIs if any
            if (insertedProduct && mappedData.dci_ids && mappedData.dci_ids.length > 0) {
              const dciInserts = mappedData.dci_ids.map(dci_id => ({
                tenant_id: tenantId,
                produit_id: insertedProduct.id,
                dci_id,
              }));
              await supabase.from('produits_dci').insert(dciInserts);
            }

            importResult.created++;
          } catch (err) {
            importResult.errors.push(`${codeCip}: Erreur inattendue`);
            console.error(`Erreur pour ${codeCip}:`, err);
          }
        }

        setProgress({ 
          current: Math.min(i + BATCH_SIZE, rowsToInsert.length), 
          total: rowsToInsert.length, 
          phase: 'Création des produits...' 
        });
      }

      setResult(importResult);

      if (importResult.created > 0) {
        toast.success(`${importResult.created} produit(s) créé(s) avec succès`);
        onSuccess();
      } else if (importResult.notFound.length > 0) {
        toast.warning(`Aucun produit créé. ${importResult.notFound.length} code(s) CIP non trouvé(s) dans le catalogue global.`);
      }
    } catch (error) {
      console.error('Erreur lors du traitement:', error);
      toast.error("Erreur lors de la lecture du fichier Excel");
    } finally {
      setIsProcessing(false);
    }
  };

  const progressPercent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import de Produits depuis le Catalogue Global
          </DialogTitle>
          <DialogDescription>
            Importez un fichier Excel pour créer des produits en masse depuis le catalogue global.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!result && (
            <>
              {/* Price region selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Prix à importer</label>
                <RadioGroup
                  value={priceRegion}
                  onValueChange={(value) => setPriceRegion(value as PriceRegion)}
                  className="flex flex-col gap-2"
                  disabled={isProcessing}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="brazzaville" id="price-brazza" />
                    <Label htmlFor="price-brazza" className="font-normal cursor-pointer">
                      Prix Brazzaville
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pointe-noire" id="price-pnr" />
                    <Label htmlFor="price-pnr" className="font-normal cursor-pointer">
                      Prix Pointe-Noire
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Les prix d'achat et de vente seront importés selon la région sélectionnée.
                </p>
              </div>

              {/* File input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Fichier Excel</label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="w-full justify-start"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {file ? file.name : 'Sélectionner un fichier Excel'}
                  </Button>
                </div>
              </div>

              {/* Format info */}
              <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
                <p className="font-medium">Format attendu :</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Colonne <code className="bg-muted px-1 rounded">CodeCIP</code> : Code CIP du produit</li>
                  <li>Colonne <code className="bg-muted px-1 rounded">Catégorie</code> : Catégorie de tarification</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Les produits seront recherchés dans le catalogue global et leurs informations complètes seront importées.
                </p>
              </div>

              {/* Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {progress.phase || 'Traitement en cours...'}
                    </span>
                    <span className="text-muted-foreground">
                      {progress.total > 0 ? `${progress.current} / ${progress.total}` : '...'}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">{progressPercent}%</p>
                </div>
              )}
            </>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-medium">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Import terminé
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{result.created}</p>
                  <p className="text-xs text-muted-foreground">Produits créés</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-orange-500">{result.notFound.length}</p>
                  <p className="text-xs text-muted-foreground">Non trouvés</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-500">{result.alreadyExists.length}</p>
                  <p className="text-xs text-muted-foreground">Déjà existants</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{result.noCipCode.length}</p>
                  <p className="text-xs text-muted-foreground">Sans CIP</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {result.errors.length} erreur(s) rencontrée(s)
                </div>
              )}

              {/* Not found section */}
              {result.notFound.length > 0 && (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotFound(!showNotFound)}
                    className="w-full justify-between"
                  >
                    <span>Voir les codes non trouvés ({result.notFound.length})</span>
                    {showNotFound ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>

                  {showNotFound && (
                    <ScrollArea className="h-32 border rounded-md p-2">
                      <div className="space-y-1 text-sm font-mono">
                        {result.notFound.map((code, index) => (
                          <div key={index} className="text-muted-foreground">
                            {code}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}

              {/* No CIP section */}
              {result.noCipCode.length > 0 && (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNoCip(!showNoCip)}
                    className="w-full justify-between"
                  >
                    <span>Voir les lignes sans CIP ({result.noCipCode.length})</span>
                    {showNoCip ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>

                  {showNoCip && (
                    <ScrollArea className="h-32 border rounded-md p-2">
                      <div className="space-y-1 text-sm">
                        {result.noCipCode.map((label, index) => (
                          <div key={index} className="text-muted-foreground">
                            {label}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}

              {/* Already exists section */}
              {result.alreadyExists.length > 0 && (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAlreadyExists(!showAlreadyExists)}
                    className="w-full justify-between"
                  >
                    <span>Voir les produits existants ({result.alreadyExists.length})</span>
                    {showAlreadyExists ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>

                  {showAlreadyExists && (
                    <ScrollArea className="h-32 border rounded-md p-2">
                      <div className="space-y-1 text-sm font-mono">
                        {result.alreadyExists.map((code, index) => (
                          <div key={index} className="text-muted-foreground">
                            {code}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Annuler
              </Button>
              <Button onClick={processFile} disabled={!file || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importer
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Fermer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductCatalogImportDialog;
