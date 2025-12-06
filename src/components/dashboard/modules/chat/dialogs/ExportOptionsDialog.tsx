import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { FileSpreadsheet, FileText, Download, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ExportOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportType: 'pharmacies' | 'analytics' | 'collaborations' | 'all';
  onExport: (format: 'excel' | 'pdf', options: ExportOptions) => void;
}

interface ExportOptions {
  includeMetrics: boolean;
  includeContacts: boolean;
  includeActivity: boolean;
  period?: string;
}

const ExportOptionsDialog = ({
  open,
  onOpenChange,
  exportType,
  onExport
}: ExportOptionsDialogProps) => {
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeContacts, setIncludeContacts] = useState(true);
  const [includeActivity, setIncludeActivity] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport(format, {
        includeMetrics,
        includeContacts,
        includeActivity
      });
      toast.success(`Export ${format.toUpperCase()} réussi`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  const getTitle = () => {
    switch (exportType) {
      case 'pharmacies': return 'Exporter l\'Annuaire';
      case 'analytics': return 'Exporter les Analytics';
      case 'collaborations': return 'Exporter les Collaborations';
      default: return 'Exporter les Données';
    }
  };

  const getDescription = () => {
    switch (exportType) {
      case 'pharmacies': return 'Exportez la liste des officines avec les métriques';
      case 'analytics': return 'Exportez les rapports analytics du réseau';
      case 'collaborations': return 'Exportez la liste des projets inter-officines';
      default: return 'Exportez toutes les données du réseau';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Format d'export</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'excel' | 'pdf')}>
              <div className="grid grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-all ${
                    format === 'excel' ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setFormat('excel')}
                >
                  <CardContent className="flex flex-col items-center p-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="excel" id="excel" />
                      <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    </div>
                    <Label htmlFor="excel" className="mt-2 font-medium cursor-pointer">
                      Excel (.xlsx)
                    </Label>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      Idéal pour l'analyse
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all ${
                    format === 'pdf' ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setFormat('pdf')}
                >
                  <CardContent className="flex flex-col items-center p-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="pdf" id="pdf" />
                      <FileText className="h-8 w-8 text-red-600" />
                    </div>
                    <Label htmlFor="pdf" className="mt-2 font-medium cursor-pointer">
                      PDF
                    </Label>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      Idéal pour impression
                    </p>
                  </CardContent>
                </Card>
              </div>
            </RadioGroup>
          </div>

          {/* Options */}
          {exportType === 'pharmacies' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="metrics" 
                    checked={includeMetrics}
                    onCheckedChange={(checked) => setIncludeMetrics(checked as boolean)}
                  />
                  <Label htmlFor="metrics" className="text-sm cursor-pointer">
                    Inclure les métriques (messages, canaux)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="contacts" 
                    checked={includeContacts}
                    onCheckedChange={(checked) => setIncludeContacts(checked as boolean)}
                  />
                  <Label htmlFor="contacts" className="text-sm cursor-pointer">
                    Inclure les coordonnées (téléphone, email)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="activity" 
                    checked={includeActivity}
                    onCheckedChange={(checked) => setIncludeActivity(checked as boolean)}
                  />
                  <Label htmlFor="activity" className="text-sm cursor-pointer">
                    Inclure l'activité récente
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          <Card className="bg-muted/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>
                  {format === 'excel' 
                    ? 'Le fichier Excel contiendra plusieurs feuilles'
                    : 'Le PDF sera formaté pour l\'impression A4'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              'Export en cours...'
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportOptionsDialog;
