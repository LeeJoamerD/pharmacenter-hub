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
import { Package, TrendingUp, AlertTriangle, ShoppingCart, X, Target } from 'lucide-react';
import type { StockPrediction } from '@/hooks/useAdvancedForecasting';

interface StockPredictionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prediction: StockPrediction | null;
  onCreateOrder: (predictionId: string) => void;
  onDismiss: (predictionId: string) => void;
}

const StockPredictionDetailDialog: React.FC<StockPredictionDetailDialogProps> = ({
  open,
  onOpenChange,
  prediction,
  onCreateOrder,
  onDismiss
}) => {
  if (!prediction) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800';
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
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'decreasing': return <TrendingUp className="h-4 w-4 text-green-600 rotate-180" />;
      case 'seasonal_peak': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Target className="h-4 w-4 text-blue-600" />;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Détails de la Prédiction
          </DialogTitle>
          <DialogDescription>
            Analyse prédictive et recommandations pour ce produit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Produit */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg">{prediction.product_name || 'Produit inconnu'}</h3>
            {prediction.product_code && (
              <p className="text-sm text-muted-foreground">Code: {prediction.product_code}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getPriorityColor(prediction.priority)}>
                {getPriorityLabel(prediction.priority)}
              </Badge>
              <div className="flex items-center gap-1 text-sm">
                {getTrendIcon(prediction.trend)}
                <span>{getTrendLabel(prediction.trend)}</span>
              </div>
            </div>
          </div>

          {/* Métriques */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold">{prediction.current_stock}</div>
              <div className="text-sm text-muted-foreground">Stock Actuel</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{prediction.predicted_demand_daily}/jour</div>
              <div className="text-sm text-muted-foreground">Demande Prévue</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className={`text-2xl font-bold ${prediction.days_until_stockout <= 3 ? 'text-red-600' : prediction.days_until_stockout <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                {prediction.days_until_stockout} jours
              </div>
              <div className="text-sm text-muted-foreground">Avant Rupture</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{prediction.recommended_order_qty}</div>
              <div className="text-sm text-muted-foreground">Commande Suggérée</div>
            </div>
          </div>

          {/* Confiance */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Confiance de la prédiction</span>
              <span className="text-sm font-bold">{prediction.confidence}%</span>
            </div>
            <Progress value={prediction.confidence} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {prediction.confidence >= 90 ? 'Très haute fiabilité' :
               prediction.confidence >= 75 ? 'Haute fiabilité' :
               prediction.confidence >= 60 ? 'Fiabilité modérée' :
               'Fiabilité faible - à vérifier'}
            </p>
          </div>

          {/* Statut commande */}
          {prediction.order_created && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-green-600" />
              <span className="text-green-800 text-sm">Une commande a déjà été initiée pour ce produit</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onDismiss(prediction.id)}>
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

export default StockPredictionDetailDialog;
