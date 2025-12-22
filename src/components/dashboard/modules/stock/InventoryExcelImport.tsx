import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { ExcelInventoryImportService } from '@/services/ExcelInventoryImportService';
import type { InventoryParseResult, InventoryValidationResult } from '@/types/inventoryImport';
import { useTenant } from '@/contexts/TenantContext';
import { useStockSettings } from '@/hooks/useStockSettings';

export const InventoryExcelImport = () => {
  const { tenantId } = useTenant();
  const { settings: stockSettings } = useStockSettings();
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<InventoryParseResult | null>(null);
  const [validationResult, setValidationResult] = useState<InventoryValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseResult(null);
    setValidationResult(null);

    try {
      toast.info('Lecture du fichier Excel...');
      const result = await ExcelInventoryImportService.parseInventoryFile(selectedFile, {
        auto_generate_lots: stockSettings.auto_generate_lots,
        requireLotNumbers: stockSettings.requireLotNumbers
      });
      setParseResult(result);

      if (result.success) {
        toast.success(`${result.lines.length} lignes lues avec succès`);
      } else {
        toast.error(`Erreurs détectées dans le fichier`);
      }
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      toast.error('Erreur lors de la lecture du fichier');
    }
  };

  const handleValidate = async () => {
    if (!parseResult || !tenantId) return;

    setIsProcessing(true);
    try {
      toast.info('Validation des données...');
      const result = await ExcelInventoryImportService.validateInventoryData(
        parseResult.lines,
        tenantId
      );
      setValidationResult(result);

      if (result.isValid) {
        toast.success(`${result.validLines.length} lignes valides prêtes à importer`);
      } else {
        toast.warning(
          `${result.validLines.length} lignes valides, ${result.errors.length} erreurs`
        );
      }
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!validationResult || !tenantId) return;

    setIsProcessing(true);
    try {
      toast.info('Import des lots en cours...');
      const result = await ExcelInventoryImportService.importInventoryLots(
        validationResult.validLines,
        tenantId
      );

      if (result.errors.length === 0) {
        toast.success(
          `Import terminé: ${result.lotsCreated} lots créés, ${result.lotsUpdated} lots mis à jour`
        );
        
        // Réinitialiser
        setFile(null);
        setParseResult(null);
        setValidationResult(null);
      } else {
        toast.error(
          `Import terminé avec erreurs: ${result.lotsCreated} lots créés, ${result.lotsUpdated} mis à jour, ${result.errors.length} erreurs`
        );
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast.error('Erreur lors de l\'import');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Import Inventaire Excel
          {stockSettings.auto_generate_lots && (
            <span className="flex items-center gap-1 text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              <Zap className="h-3 w-3" />
              Lots auto
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Importez un fichier Excel d'inventaire. Le système recherchera les produits par nom.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload */}
        <div className="space-y-4">
          <label
            htmlFor="inventory-file"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Cliquez pour sélectionner</span> ou glissez-déposez
              </p>
              <p className="text-xs text-muted-foreground">Fichier Excel (.xls, .xlsx)</p>
            </div>
            <input
              id="inventory-file"
              type="file"
              className="hidden"
              accept=".xls,.xlsx"
              onChange={handleFileSelect}
            />
          </label>

          {file && (
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                <strong>Fichier sélectionné:</strong> {file.name}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Résultats du parsing */}
        {parseResult && (
          <div className="space-y-4">
            <Alert variant={parseResult.success ? 'default' : 'destructive'}>
              {parseResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <strong>Parsing:</strong> {parseResult.lines.length} lignes lues
                {parseResult.errors.length > 0 && `, ${parseResult.errors.length} erreurs`}
              </AlertDescription>
            </Alert>

            {parseResult.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
                {parseResult.errors.slice(0, 10).map((error, idx) => (
                  <div key={idx} className="text-destructive">
                    Ligne {error.rowNumber}: {error.message}
                  </div>
                ))}
                {parseResult.errors.length > 10 && (
                  <div className="text-muted-foreground">
                    ... et {parseResult.errors.length - 10} autres erreurs
                  </div>
                )}
              </div>
            )}

            {parseResult.success && !validationResult && (
              <Button onClick={handleValidate} disabled={isProcessing}>
                Valider les données
              </Button>
            )}
          </div>
        )}

        {/* Résultats de la validation */}
        {validationResult && (
          <div className="space-y-4">
            <Alert variant={validationResult.isValid ? 'default' : 'destructive'}>
              {validationResult.isValid ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <strong>Validation:</strong> {validationResult.validLines.length} lignes valides
                {validationResult.errors.length > 0 &&
                  `, ${validationResult.errors.length} erreurs`}
                {validationResult.warnings.length > 0 &&
                  `, ${validationResult.warnings.length} avertissements`}
              </AlertDescription>
            </Alert>

            {validationResult.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
                {validationResult.errors.slice(0, 10).map((error, idx) => (
                  <div key={idx} className="text-destructive">
                    Ligne {error.rowNumber} - {error.nomProduit}: {error.message}
                  </div>
                ))}
                {validationResult.errors.length > 10 && (
                  <div className="text-muted-foreground">
                    ... et {validationResult.errors.length - 10} autres erreurs
                  </div>
                )}
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
                {validationResult.warnings.slice(0, 5).map((warning, idx) => (
                  <div key={idx} className="text-yellow-600">
                    Ligne {warning.rowNumber} - {warning.nomProduit}: {warning.message}
                  </div>
                ))}
                {validationResult.warnings.length > 5 && (
                  <div className="text-muted-foreground">
                    ... et {validationResult.warnings.length - 5} autres avertissements
                  </div>
                )}
              </div>
            )}

            {validationResult.validLines.length > 0 && (
              <Button onClick={handleImport} disabled={isProcessing} className="w-full">
                Importer {validationResult.validLines.length} lots
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
