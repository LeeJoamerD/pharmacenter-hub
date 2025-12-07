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
import { FileText, Table } from 'lucide-react';
import { 
  exportDashboardToPDF, 
  exportDashboardToExcel 
} from '@/utils/aiDashboardExportUtils';
import type { AIDashboardMetrics, AIModelSummary, AIInsightSummary } from '@/hooks/useAIDashboard';

interface AIDashboardExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: AIDashboardMetrics;
  models: AIModelSummary[];
  insights: AIInsightSummary[];
  pharmacyName?: string;
}

export const AIDashboardExportDialog: React.FC<AIDashboardExportDialogProps> = ({
  open,
  onOpenChange,
  metrics,
  models,
  insights,
  pharmacyName = 'PharmaSoft'
}) => {
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      if (format === 'pdf') {
        exportDashboardToPDF(metrics, models, insights, pharmacyName);
      } else {
        exportDashboardToExcel(metrics, models, insights, pharmacyName);
      }
      onOpenChange(false);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Exporter le Dashboard IA</DialogTitle>
          <DialogDescription>
            Choisissez le format d'export pour le rapport du Dashboard IA
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'pdf' | 'excel')}>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer flex-1">
                <FileText className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium">PDF</p>
                  <p className="text-sm text-muted-foreground">
                    Rapport formaté pour impression
                  </p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer mt-2">
              <RadioGroupItem value="excel" id="excel" />
              <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer flex-1">
                <Table className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Excel</p>
                  <p className="text-sm text-muted-foreground">
                    Données exportées en feuilles de calcul
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? 'Export en cours...' : 'Exporter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIDashboardExportDialog;
