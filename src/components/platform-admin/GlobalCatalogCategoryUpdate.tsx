import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
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
import { Upload, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

interface GlobalCatalogCategoryUpdateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface UpdateResult {
  totalLines: number;
  updated: number;
  notFound: string[];
  errors: string[];
}

interface ExcelRow {
  CodeCIP?: string;
  Catégorie?: string;
  PrixAchat?: string | number;
  PrixVente?: string | number;
}

const BATCH_SIZE = 50;

const GlobalCatalogCategoryUpdate: React.FC<GlobalCatalogCategoryUpdateProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<UpdateResult | null>(null);
  const [showNotFound, setShowNotFound] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!file) return;

    setIsProcessing(true);
    setResult(null);

    try {
      // Read Excel file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

      const validRows = rows.filter(row => {
        if (!row.CodeCIP) return false;
        const hasCategorie = !!row.Catégorie;
        const hasPrixAchat = row.PrixAchat !== undefined && row.PrixAchat !== null && row.PrixAchat !== '';
        const hasPrixVente = row.PrixVente !== undefined && row.PrixVente !== null && row.PrixVente !== '';
        return hasCategorie || hasPrixAchat || hasPrixVente;
      });
      
      if (validRows.length === 0) {
        toast.error("Aucune ligne valide trouvée. Vérifiez les colonnes 'CodeCIP' et au moins 'Catégorie', 'PrixAchat' ou 'PrixVente'.");
        setIsProcessing(false);
        return;
      }

      setProgress({ current: 0, total: validRows.length });

      const updateResult: UpdateResult = {
        totalLines: validRows.length,
        updated: 0,
        notFound: [],
        errors: [],
      };

      // Process in batches
      for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
        const batch = validRows.slice(i, i + BATCH_SIZE);
        
        await Promise.all(
          batch.map(async (row) => {
            const codeCip = String(row.CodeCIP).trim();

            try {
              // Search by code_cip OR ancien_code_cip
              const { data: products, error: searchError } = await supabase
                .from('catalogue_global_produits')
                .select('id')
                .or(`code_cip.eq.${codeCip},ancien_code_cip.eq.${codeCip}`)
                .limit(1);

              if (searchError) {
                updateResult.errors.push(`${codeCip}: ${searchError.message}`);
                return;
              }

              if (!products || products.length === 0) {
                updateResult.notFound.push(codeCip);
                return;
              }

              // Build dynamic update object
              const updateData: Record<string, any> = {};
              if (row.Catégorie) {
                updateData.libelle_categorie_tarification = String(row.Catégorie).trim();
              }
              const prixAchat = Number(row.PrixAchat);
              if (!isNaN(prixAchat) && row.PrixAchat !== undefined && row.PrixAchat !== null && row.PrixAchat !== '') {
                updateData.prix_achat_reference = prixAchat;
              }
              const prixVente = Number(row.PrixVente);
              if (!isNaN(prixVente) && row.PrixVente !== undefined && row.PrixVente !== null && row.PrixVente !== '') {
                updateData.prix_vente_reference = prixVente;
              }

              if (Object.keys(updateData).length === 0) return;

              const { error: updateError } = await supabase
                .from('catalogue_global_produits')
                .update(updateData)
                .eq('id', products[0].id);

              if (updateError) {
                updateResult.errors.push(`${codeCip}: ${updateError.message}`);
                return;
              }

              updateResult.updated++;
            } catch (err) {
              updateResult.errors.push(`${codeCip}: Erreur inattendue`);
            }
          })
        );

        setProgress({ current: Math.min(i + BATCH_SIZE, validRows.length), total: validRows.length });
      }

      setResult(updateResult);
      
      if (updateResult.updated > 0) {
        toast.success(`${updateResult.updated} produit(s) mis à jour avec succès`);
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
            Mise à jour en masse (Catégories & Prix)
          </DialogTitle>
          <DialogDescription>
            Importez un fichier Excel pour mettre à jour les catégories de tarification, les prix d'achat et/ou les prix de vente des produits.
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
                  <li>Colonne <code className="bg-muted px-1 rounded">CodeCIP</code> : Code CIP du produit (obligatoire)</li>
                  <li>Colonne <code className="bg-muted px-1 rounded">Catégorie</code> : Nouvelle catégorie de tarification (optionnel)</li>
                  <li>Colonne <code className="bg-muted px-1 rounded">PrixAchat</code> : Prix d'achat de référence (optionnel)</li>
                  <li>Colonne <code className="bg-muted px-1 rounded">PrixVente</code> : Prix de vente de référence (optionnel)</li>
                </ul>
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
                Mise à jour terminée
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">{result.updated}</p>
                  <p className="text-xs text-muted-foreground">Produits mis à jour</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-orange-500">{result.notFound.length}</p>
                  <p className="text-xs text-muted-foreground">Codes non trouvés</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {result.errors.length} erreur(s) rencontrée(s)
                </div>
              )}

              {result.notFound.length > 0 && (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotFound(!showNotFound)}
                    className="w-full justify-between"
                  >
                    <span>Voir les codes non trouvés ({result.notFound.length})</span>
                    <Badge variant="secondary">{showNotFound ? '▲' : '▼'}</Badge>
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

export default GlobalCatalogCategoryUpdate;
