import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, Package, TrendingUp, Clock } from 'lucide-react';
import type { AnalysisResult } from '@/hooks/useAIStockManagement';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AIStockAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: AnalysisResult | null;
  analyzing: boolean;
}

const AIStockAnalysisDialog: React.FC<AIStockAnalysisDialogProps> = ({
  open,
  onOpenChange,
  result,
  analyzing
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Analyse IA du Stock
          </DialogTitle>
          <DialogDescription>
            {analyzing ? 'Analyse en cours...' : 'Résultats de l\'analyse'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {analyzing ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Analyse des données de stock...</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-sm">Analyse des niveaux de stock</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-sm">Calcul des tendances de vente</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-sm">Détection des alertes critiques</span>
                </div>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Success banner */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-300">Analyse terminée</p>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      {format(new Date(result.analyzed_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg text-center bg-card">
                  <div className="text-3xl font-bold text-primary">{result.predictions_created}</div>
                  <div className="text-sm text-muted-foreground mt-1">Prédictions créées</div>
                </div>
                <div className="p-4 border rounded-lg text-center bg-card">
                  <div className={`text-3xl font-bold ${
                    result.critical_alerts > 0 ? 'text-destructive' : 'text-green-600'
                  }`}>
                    {result.critical_alerts}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Alertes critiques</div>
                </div>
              </div>

              {/* Status */}
              {result.critical_alerts > 0 ? (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Attention requise</p>
                      <p className="text-sm text-destructive/80 mt-1">
                        {result.critical_alerts} produit(s) nécessitent une action urgente pour éviter les ruptures de stock.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-300">Stock en bon état</p>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        Aucune alerte critique détectée. Continuez à surveiller les prédictions.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun résultat disponible
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIStockAnalysisDialog;
