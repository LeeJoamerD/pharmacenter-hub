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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Package, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, X, Target, Minus } from 'lucide-react';
import type { StockPrediction } from '@/hooks/useAdvancedForecasting';

interface AIStockPredictionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prediction: StockPrediction | null;
  onCreateOrder: (predictionId: string) => void;
  onDismiss: (predictionId: string) => void;
}

const AIStockPredictionDetailDialog: React.FC<AIStockPredictionDetailDialogProps> = ({
  open,
  onOpenChange,
  prediction,
  onCreateOrder,
  onDismiss
}) => {
  if (!prediction) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Critique';
      case 'medium': return 'Moyen';
      case 'low': return 'Faible';
      default: return priority;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-destructive" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'seasonal_peak': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Minus className="h-4 w-4 text-primary" />;
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'Demande croissante';
      case 'decreasing': return 'Demande décroissante';
      case 'stable': return 'Demande stable';
      case 'seasonal_peak': return 'Pic saisonnier';
      default: return trend;
    }
  };

  const getConfidenceDescription = (confidence: number) => {
    if (confidence >= 90) return 'Très haute fiabilité - Données abondantes';
    if (confidence >= 75) return 'Haute fiabilité - Bonne base de données';
    if (confidence >= 60) return 'Fiabilité modérée - Données partielles';
    return 'Fiabilité faible - Vérification recommandée';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Détails de la Prédiction IA
          </DialogTitle>
          <DialogDescription>
            Analyse prédictive et recommandations pour ce produit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product info */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg">{prediction.product_name || 'Produit inconnu'}</h3>
            {prediction.product_code && (
              <p className="text-sm text-muted-foreground">Code CIP: {prediction.product_code}</p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <Badge className={getPriorityColor(prediction.priority)}>
                {getPriorityLabel(prediction.priority)}
              </Badge>
              <div className="flex items-center gap-1.5 text-sm">
                {getTrendIcon(prediction.trend)}
                <span className="text-muted-foreground">{getTrendLabel(prediction.trend)}</span>
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg text-center bg-card">
              <div className="text-3xl font-bold text-foreground">{prediction.current_stock}</div>
              <div className="text-sm text-muted-foreground mt-1">Stock Actuel</div>
            </div>
            <div className="p-4 border rounded-lg text-center bg-card">
              <div className="text-3xl font-bold text-primary">
                {prediction.predicted_demand_daily?.toFixed(1) || 0}/jour
              </div>
              <div className="text-sm text-muted-foreground mt-1">Demande Prévue</div>
            </div>
            <div className="p-4 border rounded-lg text-center bg-card">
              <div className={`text-3xl font-bold ${
                prediction.days_until_stockout <= 3 ? 'text-destructive' : 
                prediction.days_until_stockout <= 7 ? 'text-orange-500' : 'text-green-500'
              }`}>
                {prediction.days_until_stockout} jours
              </div>
              <div className="text-sm text-muted-foreground mt-1">Avant Rupture</div>
            </div>
            <div className="p-4 border rounded-lg text-center bg-card">
              <div className="text-3xl font-bold text-green-600">{prediction.recommended_order_qty}</div>
              <div className="text-sm text-muted-foreground mt-1">Commande Suggérée</div>
            </div>
          </div>

          {/* Confidence */}
          <div className="space-y-3 p-4 border rounded-lg bg-card">
            <div className="flex justify-between items-center">
              <span className="font-medium">Confiance de la prédiction</span>
              <span className="text-lg font-bold text-primary">{prediction.confidence}%</span>
            </div>
            <Progress value={prediction.confidence} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {getConfidenceDescription(prediction.confidence)}
            </p>
          </div>

          {/* Order status */}
          {prediction.order_created && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              <span className="text-green-800 dark:text-green-300">
                Une commande a déjà été initiée pour ce produit
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => {
            onDismiss(prediction.id);
            onOpenChange(false);
          }}>
            <X className="h-4 w-4 mr-2" />
            Ignorer
          </Button>
          {!prediction.order_created && prediction.recommended_order_qty > 0 && (
            <Button onClick={() => {
              onCreateOrder(prediction.id);
              onOpenChange(false);
            }}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Commander {prediction.recommended_order_qty} unités
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIStockPredictionDetailDialog;
