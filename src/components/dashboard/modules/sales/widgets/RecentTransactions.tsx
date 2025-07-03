import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock,
  Eye,
  Printer,
  MoreVertical,
  Receipt
} from 'lucide-react';
import useSalesMetrics from '@/hooks/useSalesMetrics';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const RecentTransactions = () => {
  const { recentTransactions } = useSalesMetrics();
  const { formatPrice } = useCurrency();

  const getPaymentTypeColor = (paymentType: string) => {
    switch (paymentType) {
      case 'Espèces':
        return 'bg-green-100 text-green-800';
      case 'Carte':
        return 'bg-blue-100 text-blue-800';
      case 'Mobile Money':
        return 'bg-purple-100 text-purple-800';
      case 'Assureur':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Transactions Récentes
          </CardTitle>
          <Button variant="ghost" size="sm">
            Voir tout
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentTransactions.map((transaction) => (
            <div 
              key={transaction.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium">{transaction.invoice_number}</h4>
                  <Badge 
                    variant="outline" 
                    className={getPaymentTypeColor(transaction.payment_type)}
                  >
                    {transaction.payment_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{transaction.customer_name}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{format(transaction.timestamp, 'HH:mm', { locale: fr })}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(transaction.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(transaction.timestamp, 'dd/MM', { locale: fr })}
                  </p>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {recentTransactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune transaction récente</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;