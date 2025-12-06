import React, { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { 
  exportCustomizationToExcel, 
  exportCustomizationToPDF, 
  downloadCustomizationJSON,
  FullCustomizationExportData 
} from '@/utils/customizationExportUtils';

interface ExportSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportData: FullCustomizationExportData;
  pharmacyName?: string;
}

export const ExportSettingsDialog: React.FC<ExportSettingsDialogProps> = ({
  open,
  onOpenChange,
  exportData,
  pharmacyName
}) => {
  const [format, setFormat] = useState<'json' | 'xlsx' | 'pdf'>('json');
  const [includePreferences, setIncludePreferences] = useState(true);
  const [includeNotifications, setIncludeNotifications] = useState(true);

  const handleExport = () => {
    const dataToExport: FullCustomizationExportData = {
      preferences: includePreferences ? exportData.preferences : null,
      notifications: includeNotifications ? exportData.notifications : [],
      exportedAt: new Date().toISOString(),
      pharmacyName
    };

    switch (format) {
      case 'json':
        downloadCustomizationJSON(dataToExport);
        break;
      case 'xlsx':
        exportCustomizationToExcel(dataToExport);
        break;
      case 'pdf':
        exportCustomizationToPDF(dataToExport);
        break;
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Exporter les Paramètres
          </DialogTitle>
          <DialogDescription>
            Choisissez le format et les données à exporter
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format selection */}
          <div className="space-y-3">
            <Label>Format d'export</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                  <FileJson className="h-4 w-4 text-orange-500" />
                  JSON (Sauvegarde / Import)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 text-green-500" />
                  Excel (Lecture / Analyse)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4 text-red-500" />
                  PDF (Documentation)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Data selection */}
          <div className="space-y-3">
            <Label>Données à inclure</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-prefs"
                  checked={includePreferences}
                  onCheckedChange={(checked) => setIncludePreferences(!!checked)}
                />
                <Label htmlFor="include-prefs" className="cursor-pointer">
                  Préférences utilisateur (thème, langue, interface)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-notifs"
                  checked={includeNotifications}
                  onCheckedChange={(checked) => setIncludeNotifications(!!checked)}
                />
                <Label htmlFor="include-notifs" className="cursor-pointer">
                  Paramètres de notifications
                </Label>
              </div>
            </div>
          </div>

          {/* Preview info */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">Résumé de l'export</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• Format: {format.toUpperCase()}</li>
              {includePreferences && <li>• Préférences utilisateur incluses</li>}
              {includeNotifications && <li>• {exportData.notifications.length} paramètres de notifications</li>}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleExport}
            disabled={!includePreferences && !includeNotifications}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportSettingsDialog;
