import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock,
  Eye,
  Printer,
  MoreVertical,
  Receipt,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSalesMetricsDB } from '@/hooks/useSalesMetricsDB';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const RecentTransactions = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  const { 
    recentTransactions, 
    totalTransactions, 
    totalTransactionsPages,
    currentTransactionsPage,
    loading 
  } = useSalesMetricsDB(page, limit);
  
  const { formatPrice } = useCurrency();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Transactions Récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

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
          <div className="text-sm text-muted-foreground">
            {totalTransactions} transaction(s) au total
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune transaction récente</p>
          </div>
        ) : (
          <>
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
                      {transaction.cash_register && (
                        <span className="text-xs">• {transaction.cash_register}</span>
                      )}
                      {transaction.agent_name && (
                        <span className="text-xs">• {transaction.agent_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true, locale: fr })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(transaction.amount)}</p>
                      {transaction.discount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Remise: {formatPrice(transaction.discount)}
                        </p>
                      )}
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
            </div>
            
            {/* Pagination Controls */}
            {totalTransactionsPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {currentTransactionsPage} sur {totalTransactionsPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalTransactionsPages}
                    onClick={() => setPage(p => Math.min(totalTransactionsPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
