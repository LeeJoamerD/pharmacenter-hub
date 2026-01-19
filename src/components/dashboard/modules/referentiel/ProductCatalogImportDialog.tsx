import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalCatalogLookup } from '@/hooks/useGlobalCatalogLookup';
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
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showNotFound, setShowNotFound] = useState(false);
  const [showNoCip, setShowNoCip] = useState(false);
  const [showAlreadyExists, setShowAlreadyExists] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { personnel } = useAuth();
  const tenantId = personnel?.tenant_id;
  const { searchGlobalCatalog, mapToLocalReferences, findOrCreatePricingCategoryByLabel } = useGlobalCatalogLookup();

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
    setProgress({ current: 0, total: 0 });
    setResult(null);
    setShowNotFound(false);
    setShowNoCip(false);
    setShowAlreadyExists(false);
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

  const checkProductExists = async (codeCip: string): Promise<boolean> => {
    if (!tenantId) return false;

    const { data } = await supabase
      .from('produits')
      .select('id')
      .eq('tenant_id', tenantId)
      .or(`code_cip.eq.${codeCip},ancien_code_cip.eq.${codeCip}`)
      .maybeSingle();

    return !!data;
  };

  const processFile = async () => {
    if (!file || !tenantId) return;

    setIsProcessing(true);
    setResult(null);

    try {
      // Read Excel file
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

      setProgress({ current: 0, total: rows.length });

      const importResult: ImportResult = {
        totalLines: rows.length,
        created: 0,
        notFound: [],
        noCipCode: [],
        alreadyExists: [],
        errors: [],
      };

      // Process in batches
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);

        for (const row of batch) {
          const rawCip = row.CodeCIP;
          const categorie = row.Catégorie ? String(row.Catégorie).trim() : null;

          // 1. Check if CIP code exists
          if (!rawCip || String(rawCip).trim() === '' || String(rawCip).trim() === '0') {
            importResult.noCipCode.push(categorie || 'Ligne sans catégorie');
            continue;
          }

          const codeCip = String(rawCip).trim();

          try {
            // 2. Check if product already exists in local catalog
            const exists = await checkProductExists(codeCip);
            if (exists) {
              importResult.alreadyExists.push(codeCip);
              continue;
            }

            // 3. Search in global catalog
            const globalProduct = await searchGlobalCatalog(codeCip);
            if (!globalProduct) {
              importResult.notFound.push(codeCip);
              continue;
            }

            // 4. Map to local references
            const mappedData = await mapToLocalReferences(globalProduct);

            // 5. Override category with Excel value if provided
            let categorie_tarification_id = mappedData.categorie_tarification_id;
            if (categorie) {
              const categoryId = await findOrCreatePricingCategoryByLabel(categorie);
              if (categoryId) {
                categorie_tarification_id = categoryId;
              }
            }

            // 6. Insert product into produits table
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

            // 7. Insert DCIs if any
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

        setProgress({ current: Math.min(i + BATCH_SIZE, rows.length), total: rows.length });
      }

      setResult(importResult);

      if (importResult.created > 0) {
        toast.success(`${importResult.created} produit(s) créé(s) avec succès`);
        onSuccess();
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
                      Traitement en cours...
                    </span>
                    <span className="text-muted-foreground">
                      {progress.current} / {progress.total} lignes
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
