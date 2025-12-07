import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, AlertTriangle, CheckCircle, Package, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ShelfAnalysis } from '@/hooks/useComputerVision';
import { exportShelfAnalysisToPDF } from '@/utils/visionExportUtils';

interface ShelfAnalysisDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: ShelfAnalysis | null;
  onDelete: (id: string) => Promise<void>;
}

export default function ShelfAnalysisDetailDialog({
  open,
  onOpenChange,
  analysis,
  onDelete
}: ShelfAnalysisDetailDialogProps) {
  if (!analysis) return null;

  const getComplianceColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-orange-600';
    return 'text-red-600';
  };

  const conformProducts = analysis.total_products - analysis.stockouts_detected - analysis.misplacements_detected;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Analyse d'Étagère
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Header info */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{analysis.shelf_name}</h3>
              {analysis.shelf_location && (
                <p className="text-sm text-muted-foreground">{analysis.shelf_location}</p>
              )}
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getComplianceColor(analysis.compliance_score)}`}>
                {analysis.compliance_score}%
              </div>
              <div className="text-sm text-muted-foreground">Conformité</div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{conformProducts}</div>
              <div className="text-xs text-green-700">Conformes</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{analysis.stockouts_detected}</div>
              <div className="text-xs text-red-700">Ruptures</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{analysis.misplacements_detected}</div>
              <div className="text-xs text-orange-700">Mal placés</div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Total produits analysés</span>
              <span className="font-medium">{analysis.total_products}</span>
            </div>
            <Progress value={analysis.compliance_score} className="h-2" />
          </div>

          {/* Issues */}
          {analysis.issues && analysis.issues.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4" />
                Problèmes détectés ({analysis.issues.length})
              </h4>
              <ul className="space-y-1">
                {analysis.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-yellow-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.issues?.length === 0 && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Aucun problème détecté</span>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-sm text-muted-foreground">
            Scanné le: {format(new Date(analysis.scanned_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => exportShelfAnalysisToPDF([analysis])}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              onDelete(analysis.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
