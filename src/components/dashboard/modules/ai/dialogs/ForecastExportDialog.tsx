import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileText, FileSpreadsheet, Download, BarChart3 } from 'lucide-react';
import {
  exportSalesForecastToPDF,
  exportStockPredictionsToExcel,
  exportCashflowForecastToPDF,
  exportFactorsToExcel,
  exportFullForecastReport
} from '@/utils/forecastExportUtils';
import type {
  SalesForecastData,
  StockPrediction,
  CashflowData,
  InfluentialFactor,
  ForecastMetrics
} from '@/hooks/useAdvancedForecasting';

interface ForecastExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesData: SalesForecastData[];
  stockPredictions: StockPrediction[];
  cashflowData: CashflowData[];
  factors: InfluentialFactor[];
  metrics: ForecastMetrics;
  modelName: string;
}

const ForecastExportDialog: React.FC<ForecastExportDialogProps> = ({
  open,
  onOpenChange,
  salesData,
  stockPredictions,
  cashflowData,
  factors,
  metrics,
  modelName
}) => {
  const [exportType, setExportType] = useState<'full' | 'individual'>('full');
  const [selectedExports, setSelectedExports] = useState({
    sales: true,
    stock: true,
    cashflow: true,
    factors: true
  });
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');

  const handleExport = () => {
    if (exportType === 'full') {
      exportFullForecastReport(
        salesData,
        stockPredictions,
        cashflowData,
        factors,
        metrics,
        modelName
      );
    } else {
      if (selectedExports.sales) {
        if (format === 'pdf') {
          exportSalesForecastToPDF(salesData, metrics, modelName);
        }
      }
      if (selectedExports.stock) {
        exportStockPredictionsToExcel(stockPredictions);
      }
      if (selectedExports.cashflow) {
        if (format === 'pdf') {
          exportCashflowForecastToPDF(cashflowData);
        }
      }
      if (selectedExports.factors) {
        exportFactorsToExcel(factors);
      }
    }
    onOpenChange(false);
  };

  const toggleExport = (key: keyof typeof selectedExports) => {
    setSelectedExports(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exporter les Prévisions
          </DialogTitle>
          <DialogDescription>
            Choisissez le type d'export et les données à inclure
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Type d'export */}
          <div className="space-y-3">
            <Label>Type d'export</Label>
            <RadioGroup value={exportType} onValueChange={(v) => setExportType(v as 'full' | 'individual')}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="flex-1 cursor-pointer">
                  <div className="font-medium">Rapport complet</div>
                  <div className="text-xs text-muted-foreground">
                    Un seul fichier PDF avec toutes les données
                  </div>
                </Label>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="flex-1 cursor-pointer">
                  <div className="font-medium">Export individuel</div>
                  <div className="text-xs text-muted-foreground">
                    Choisir les données à exporter séparément
                  </div>
                </Label>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </RadioGroup>
          </div>

          {/* Options d'export individuel */}
          {exportType === 'individual' && (
            <div className="space-y-3">
              <Label>Données à exporter</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    id="sales"
                    checked={selectedExports.sales}
                    onCheckedChange={() => toggleExport('sales')}
                  />
                  <Label htmlFor="sales" className="flex-1 cursor-pointer">
                    Prévisions de ventes
                  </Label>
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    id="stock"
                    checked={selectedExports.stock}
                    onCheckedChange={() => toggleExport('stock')}
                  />
                  <Label htmlFor="stock" className="flex-1 cursor-pointer">
                    Prédictions de stock
                  </Label>
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    id="cashflow"
                    checked={selectedExports.cashflow}
                    onCheckedChange={() => toggleExport('cashflow')}
                  />
                  <Label htmlFor="cashflow" className="flex-1 cursor-pointer">
                    Prévisions de trésorerie
                  </Label>
                  <FileText className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    id="factors"
                    checked={selectedExports.factors}
                    onCheckedChange={() => toggleExport('factors')}
                  />
                  <Label htmlFor="factors" className="flex-1 cursor-pointer">
                    Facteurs influents
                  </Label>
                  <FileSpreadsheet className="h-4 w-4 text-purple-600" />
                </div>
              </div>

              {/* Format */}
              <div className="pt-2">
                <Label>Format par défaut</Label>
                <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'pdf' | 'excel')} className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf" className="cursor-pointer">PDF</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excel" id="excel" />
                    <Label htmlFor="excel" className="cursor-pointer">Excel</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground mt-1">
                  Note: Stock et Facteurs sont toujours en Excel
                </p>
              </div>
            </div>
          )}

          {/* Résumé */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-1">Données disponibles</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>• {salesData.length} jours de prévisions ventes</div>
              <div>• {stockPredictions.length} prédictions stock</div>
              <div>• {cashflowData.length} mois de trésorerie</div>
              <div>• {factors.length} facteurs influents</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ForecastExportDialog;
