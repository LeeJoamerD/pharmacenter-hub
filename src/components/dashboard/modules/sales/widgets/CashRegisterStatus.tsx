import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Clock, 
  Settings,
  AlertCircle
} from 'lucide-react';
import useSalesMetrics from '@/hooks/useSalesMetrics';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CashRegisterStatus = () => {
  const { metrics } = useSalesMetrics();
  const { formatPrice } = useCurrency();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'closed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Ouverte';
      case 'closed':
        return 'Fermée';
      default:
        return 'Inconnue';
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            État des Caisses
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            {metrics.activeCashRegisters} caisse(s) active(s)
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.cashRegisters.map((register) => (
            <div 
              key={register.id} 
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{register.name}</h4>
                  <Badge variant={getStatusVariant(register.status)}>
                    {getStatusText(register.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  {register.openedAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        Ouverte depuis {format(register.openedAt, 'HH:mm', { locale: fr })}
                      </span>
                    </div>
                  )}
                  {register.lastTransaction && (
                    <div className="flex items-center gap-1">
                      <span>Dernière transaction: {format(register.lastTransaction, 'HH:mm', { locale: fr })}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">
                  {formatPrice(register.currentAmount)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {metrics.cashRegisters.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune caisse configurée</p>
              <Button variant="outline" size="sm" className="mt-2">
                Ajouter une caisse
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CashRegisterStatus;