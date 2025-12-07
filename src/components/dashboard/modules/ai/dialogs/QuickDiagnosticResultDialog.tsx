import React from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  Users, 
  AlertTriangle,
  Target,
  FileText,
  CheckCircle
} from 'lucide-react';
import { exportDiagnosticReportToPDF } from '@/utils/aiDashboardExportUtils';
import type { DiagnosticResult } from '@/hooks/useAIDashboard';

interface QuickDiagnosticResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: DiagnosticResult | null;
  pharmacyName?: string;
}

export const QuickDiagnosticResultDialog: React.FC<QuickDiagnosticResultDialogProps> = ({
  open,
  onOpenChange,
  result,
  pharmacyName = 'PharmaSoft'
}) => {
  if (!result) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', icon: CheckCircle, color: 'text-green-600' };
    if (score >= 60) return { label: 'Moyen', icon: AlertTriangle, color: 'text-yellow-600' };
    return { label: 'Critique', icon: AlertTriangle, color: 'text-red-600' };
  };

  const globalStatus = getScoreStatus(result.globalScore);

  const sectors = [
    { name: 'Ventes', score: result.salesScore, icon: TrendingUp, color: 'text-blue-500' },
    { name: 'Stock', score: result.stockScore, icon: Package, color: 'text-green-500' },
    { name: 'Marge', score: result.marginScore, icon: DollarSign, color: 'text-yellow-500' },
    { name: 'Clients', score: result.customerScore, icon: Users, color: 'text-purple-500' },
  ];

  const handleExportPDF = () => {
    exportDiagnosticReportToPDF(result, pharmacyName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Résultat du Diagnostic IA
          </DialogTitle>
          <DialogDescription>
            Analyse complète de la performance de votre pharmacie
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Global Score */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(result.globalScore)}`}>
                  {result.globalScore}%
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <globalStatus.icon className={`h-5 w-5 ${globalStatus.color}`} />
                  <span className={`font-medium ${globalStatus.color}`}>
                    {globalStatus.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Score Global</p>
              </div>
            </CardContent>
          </Card>

          {/* Sectoral Scores */}
          <div className="grid grid-cols-2 gap-4">
            {sectors.map((sector) => (
              <Card key={sector.name}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <sector.icon className={`h-4 w-4 ${sector.color}`} />
                    <span className="text-sm font-medium">{sector.name}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-lg font-bold ${getScoreColor(sector.score)}`}>
                      {sector.score}%
                    </span>
                  </div>
                  <Progress 
                    value={sector.score} 
                    className="h-2"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <AlertTriangle className="h-6 w-6 text-orange-500 mx-auto" />
                <div className="text-2xl font-bold mt-2">{result.anomaliesDetected}</div>
                <p className="text-xs text-muted-foreground">Anomalies</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Target className="h-6 w-6 text-red-500 mx-auto" />
                <div className="text-2xl font-bold mt-2">{result.bottlenecksFound}</div>
                <p className="text-xs text-muted-foreground">Goulots</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <TrendingUp className="h-6 w-6 text-green-500 mx-auto" />
                <div className="text-2xl font-bold mt-2">{result.improvementPotential}%</div>
                <p className="text-xs text-muted-foreground">Potentiel</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickDiagnosticResultDialog;
