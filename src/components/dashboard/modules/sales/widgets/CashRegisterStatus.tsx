import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CreditCard, 
  Clock, 
  Settings,
  AlertCircle
} from 'lucide-react';
import { useSalesMetricsDB } from '@/hooks/useSalesMetricsDB';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const CashRegisterStatus = () => {
  const { cashRegisters, loading } = useSalesMetricsDB();
  const { formatPrice } = useCurrency();

  if (loading) {
    return <Skeleton className="h-64 lg:col-span-2" />;
  }

  const activeCashRegisters = cashRegisters.filter(r => r.status === 'open').length;

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
            {activeCashRegisters} caisse(s) active(s)
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cashRegisters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune caisse configurée</p>
              <Button variant="outline" size="sm" className="mt-2">
                Ajouter une caisse
              </Button>
            </div>
          ) : (
            cashRegisters.map((register) => (
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
                          Ouverte {formatDistanceToNow(new Date(register.openedAt), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                    )}
                    {register.agent_name && (
                      <span>{register.agent_name}</span>
                    )}
                  </div>
                  {register.lastTransaction && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      Dernière transaction {formatDistanceToNow(new Date(register.lastTransaction), { addSuffix: true, locale: fr })}
                    </div>
                  )}
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
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CashRegisterStatus;
