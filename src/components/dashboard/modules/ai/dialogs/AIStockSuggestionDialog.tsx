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
import { 
  Package, ShoppingCart, Tag, RotateCcw, CheckCircle, X, 
  Calendar, Banknote, AlertTriangle 
} from 'lucide-react';
import type { AIStockSuggestion } from '@/hooks/useAIStockManagement';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface AIStockSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: AIStockSuggestion | null;
  onApply: (suggestion: AIStockSuggestion) => void;
  onIgnore: (suggestion: AIStockSuggestion) => void;
}

const AIStockSuggestionDialog: React.FC<AIStockSuggestionDialogProps> = ({
  open,
  onOpenChange,
  suggestion,
  onApply,
  onIgnore
}) => {
  const { formatAmount } = useCurrencyFormatting();

  if (!suggestion) return null;

  const getTypeIcon = () => {
    switch (suggestion.type) {
      case 'reorder': return <ShoppingCart className="h-5 w-5 text-primary" />;
      case 'promotion': return <Tag className="h-5 w-5 text-orange-500" />;
      case 'fifo_correction': return <RotateCcw className="h-5 w-5 text-destructive" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (suggestion.type) {
      case 'reorder': return 'Réapprovisionnement';
      case 'promotion': return 'Promotion suggérée';
      case 'fifo_correction': return 'Correction FIFO';
      default: return suggestion.type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive/20 text-destructive';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Critique';
      case 'high': return 'Élevée';
      case 'medium': return 'Moyenne';
      case 'low': return 'Faible';
      default: return priority;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon()}
            {getTypeLabel()}
          </DialogTitle>
          <DialogDescription>
            Suggestion d'optimisation pour votre stock
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Product info */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg">{suggestion.product_name}</h3>
            {suggestion.product_code && (
              <p className="text-sm text-muted-foreground">Code: {suggestion.product_code}</p>
            )}
            <div className="mt-2">
              <Badge className={getPriorityColor(suggestion.priority)}>
                Priorité {getPriorityLabel(suggestion.priority)}
              </Badge>
            </div>
          </div>

          {/* Reason */}
          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium">Raison de la suggestion</p>
                <p className="text-muted-foreground mt-1">{suggestion.reason}</p>
              </div>
            </div>
          </div>

          {/* Type-specific details */}
          {suggestion.type === 'reorder' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg text-center bg-card">
                <div className="text-2xl font-bold text-destructive">{suggestion.current_value}</div>
                <div className="text-sm text-muted-foreground">Stock Actuel</div>
              </div>
              <div className="p-4 border rounded-lg text-center bg-card">
                <div className="text-2xl font-bold text-green-600">{suggestion.recommended_qty}</div>
                <div className="text-sm text-muted-foreground">Qté Recommandée</div>
              </div>
            </div>
          )}

          {suggestion.type === 'promotion' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg text-center bg-card">
                  <div className="text-2xl font-bold">{suggestion.current_value}</div>
                  <div className="text-sm text-muted-foreground">Quantité</div>
                </div>
                <div className="p-4 border rounded-lg text-center bg-card">
                  <div className={`text-2xl font-bold ${
                    (suggestion.days_until_expiry || 0) <= 7 ? 'text-destructive' : 'text-orange-500'
                  }`}>
                    {suggestion.days_until_expiry} jours
                  </div>
                  <div className="text-sm text-muted-foreground">Avant Péremption</div>
                </div>
              </div>
              {suggestion.stock_value && (
                <div className="p-4 border rounded-lg flex items-center justify-between bg-card">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-muted-foreground" />
                    <span>Valeur du stock</span>
                  </div>
                  <span className="font-bold">{formatAmount(suggestion.stock_value)}</span>
                </div>
              )}
              {suggestion.lot_number && (
                <div className="p-4 border rounded-lg flex items-center justify-between bg-card">
                  <span>Numéro de lot</span>
                  <span className="font-mono">{suggestion.lot_number}</span>
                </div>
              )}
            </div>
          )}

          {suggestion.type === 'fifo_correction' && (
            <div className="space-y-3">
              <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                <p className="text-sm font-medium text-destructive mb-2">Lot plus ancien (à vendre en priorité)</p>
                <div className="flex justify-between items-center">
                  <span className="font-mono">{suggestion.older_lot}</span>
                  <span className="text-muted-foreground">
                    Expire: {suggestion.older_expiry ? format(new Date(suggestion.older_expiry), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                  </span>
                </div>
                <p className="text-sm mt-1">Quantité: {suggestion.older_qty}</p>
              </div>
              <div className="p-4 border rounded-lg bg-card">
                <p className="text-sm font-medium text-muted-foreground mb-2">Lot plus récent</p>
                <div className="flex justify-between items-center">
                  <span className="font-mono">{suggestion.newer_lot}</span>
                  <span className="text-muted-foreground">
                    Expire: {suggestion.newer_expiry ? format(new Date(suggestion.newer_expiry), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                  </span>
                </div>
                <p className="text-sm mt-1">Quantité: {suggestion.newer_qty}</p>
              </div>
            </div>
          )}

          {/* Expected benefit */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-300">Bénéfice attendu</p>
                <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                  {suggestion.expected_benefit.description}
                </p>
                {suggestion.expected_benefit.savings && (
                  <p className="text-green-800 dark:text-green-300 font-semibold mt-2">
                    Économies estimées: {formatAmount(suggestion.expected_benefit.savings)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => {
            onIgnore(suggestion);
            onOpenChange(false);
          }}>
            <X className="h-4 w-4 mr-2" />
            Ignorer
          </Button>
          <Button onClick={() => {
            onApply(suggestion);
            onOpenChange(false);
          }}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIStockSuggestionDialog;
