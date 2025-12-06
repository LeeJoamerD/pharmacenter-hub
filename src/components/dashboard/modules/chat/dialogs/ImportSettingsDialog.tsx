import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileJson, Check, X, AlertTriangle } from 'lucide-react';
import { parseImportedSettings, validateImportedSettings, FullCustomizationExportData } from '@/utils/customizationExportUtils';

interface ImportSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSettings: (file: File) => Promise<void>;
}

export const ImportSettingsDialog: React.FC<ImportSettingsDialogProps> = ({
  open,
  onOpenChange,
  onImportSettings
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<FullCustomizationExportData | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrors([]);
    setParsedData(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const validation = validateImportedSettings(data);

      if (!validation.valid) {
        setErrors(validation.errors);
      } else {
        setParsedData(data);
      }
    } catch (error) {
      setErrors(['Fichier JSON invalide']);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      await onImportSettings(selectedFile);
      onOpenChange(false);
      resetState();
    } catch (error) {
      setErrors(['Erreur lors de l\'import']);
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setParsedData(null);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importer les Paramètres
          </DialogTitle>
          <DialogDescription>
            Importez un fichier de configuration JSON
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File input */}
          <div className="space-y-2">
            <Label>Fichier de configuration</Label>
            <div 
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileJson className="h-8 w-8 text-orange-500" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} Ko
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Cliquez ou déposez un fichier JSON
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {parsedData && (
            <div className="space-y-2">
              <Label>Aperçu des données</Label>
              <div className="p-3 bg-muted rounded-lg text-sm space-y-2">
                <div className="flex items-center gap-2">
                  {parsedData.preferences ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>Préférences utilisateur</span>
                </div>
                
                {parsedData.preferences && (
                  <div className="pl-6 text-muted-foreground">
                    <p>Thème: {parsedData.preferences.theme_id}</p>
                    <p>Langue: {parsedData.preferences.language}</p>
                    <p>Taille police: {parsedData.preferences.font_size}px</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {parsedData.notifications.length > 0 ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>{parsedData.notifications.length} paramètres de notifications</span>
                </div>

                {parsedData.exportedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Exporté le: {new Date(parsedData.exportedAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Warning */}
          {parsedData && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                L'import remplacera vos paramètres actuels. Cette action est irréversible.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!parsedData || loading || errors.length > 0}
          >
            {loading ? (
              'Import en cours...'
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportSettingsDialog;
