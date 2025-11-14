import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart,
  Receipt,
  RotateCcw,
  Calculator,
  Clock,
  Plus,
  AlertTriangle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSalesMetricsDB } from '@/hooks/useSalesMetricsDB';

const QuickActions = () => {
  const { metrics } = useSalesMetricsDB();
  const navigate = useNavigate();

  const actions = [
    {
      icon: ShoppingCart,
      label: 'Nouvelle Vente',
      description: 'Ouvrir POS',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => navigate('/ventes?sub=pos')
    },
    {
      icon: Receipt,
      label: 'Encaissement',
      description: 'Valider paiement',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: () => navigate('/ventes?sub=encaissements')
    },
    {
      icon: RotateCcw,
      label: 'Retour',
      description: 'Gérer retour',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: () => navigate('/ventes?sub=retours')
    },
    {
      icon: Calculator,
      label: 'Rapports',
      description: 'Voir rapports',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: () => navigate('/ventes?sub=rapports')
    }
  ];

  const alerts = [
    ...(metrics?.pendingInvoices ? [
      { 
        icon: Clock, 
        message: `${metrics.pendingInvoices} facture(s) en attente`, 
        type: 'warning' as const 
      }
    ] : []),
    ...(metrics?.activeCashRegisters === 0 ? [
      { 
        icon: AlertCircle, 
        message: 'Aucune caisse ouverte', 
        type: 'error' as const 
      }
    ] : []),
    ...(metrics && metrics.dailyVariation > 15 ? [
      {
        icon: TrendingUp,
        message: `Ventes en hausse (+${metrics.dailyVariation.toFixed(1)}%)`,
        type: 'success' as const
      }
    ] : [])
  ];

  const getAlertColor = (type: 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-orange-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Actions Rapides
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Actions principales */}
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-accent"
                onClick={action.action}
              >
                <div className={`p-2 rounded-lg ${action.bgColor}`}>
                  <IconComponent className={`h-5 w-5 ${action.color}`} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Alertes & notifications */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Alertes</h4>
            {alerts.map((alert, index) => {
              const IconComponent = alert.icon;
              return (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer"
                >
                  <IconComponent className={`h-4 w-4 ${getAlertColor(alert.type)}`} />
                  <span className="text-sm">{alert.message}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
