import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Loader2 } from 'lucide-react';

interface GenerateComplianceReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (reportType: string, period: string) => Promise<void>;
  isGenerating?: boolean;
}

const GenerateComplianceReportDialog: React.FC<GenerateComplianceReportDialogProps> = ({
  open,
  onOpenChange,
  onGenerate,
  isGenerating = false,
}) => {
  const [reportType, setReportType] = useState('HIPAA');
  const [period, setPeriod] = useState('Q1 2025');

  const reportTypes = [
    { value: 'HIPAA', label: 'HIPAA Compliance' },
    { value: 'RGPD', label: 'RGPD' },
    { value: 'HDS', label: 'HDS (Hébergement Données Santé)' },
    { value: 'ISO27001', label: 'ISO 27001' },
    { value: 'Data Protection Audit', label: 'Audit Protection des Données' },
    { value: 'Security Audit', label: 'Audit de Sécurité Général' },
  ];

  const periods = [
    'Q1 2025',
    'Q4 2024',
    'Q3 2024',
    'Q2 2024',
    'Janvier 2025',
    'Décembre 2024',
    'Novembre 2024',
    'Année 2024',
  ];

  const handleGenerate = async () => {
    await onGenerate(reportType, period);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Générer un Rapport de Conformité
          </DialogTitle>
          <DialogDescription>
            Sélectionnez le type de rapport et la période à couvrir
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="report-type">Type de rapport</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="period">Période</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              Le rapport sera généré en arrière-plan et disponible dans quelques minutes. 
              Vous recevrez une notification une fois terminé.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Annuler
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Générer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateComplianceReportDialog;
