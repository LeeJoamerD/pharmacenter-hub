import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Transaction } from '@/hooks/useTransactionHistory';
import { Clock, User, DollarSign, Eye } from 'lucide-react';

interface TransactionTimelineProps {
  transactions: Transaction[];
  onViewDetails: (transaction: Transaction) => void;
}

const TransactionTimeline = ({ transactions, onViewDetails }: TransactionTimelineProps) => {
  const { formatPrice } = useCurrency();

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">-</Badge>;
    
    const variants = {
      'Validée': 'default',
      'Finalisée': 'default',
      'En cours': 'secondary',
      'Annulée': 'destructive',
      'Remboursée': 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const groupByDate = (transactions: Transaction[]) => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      const date = new Date(t.date_vente).toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });
    return groups;
  };

  const groupedTransactions = groupByDate(transactions);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline des transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {Object.entries(groupedTransactions).map(([date, transactions]) => (
            <div key={date}>
              <h3 className="font-semibold text-lg mb-4 text-primary">{date}</h3>
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="relative pb-4 pl-6">
                    <div className="absolute left-0 top-1 -translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-lg">{transaction.numero_vente}</span>
                              {getStatusBadge(transaction.statut)}
                              <span className="text-sm text-muted-foreground">
                                {new Date(transaction.date_vente).toLocaleTimeString('fr-FR')}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{transaction.client?.nom_complet || 'Client anonyme'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">{formatPrice(transaction.montant_net)}</span>
                              </div>
                              <div className="text-muted-foreground">
                                Mode: {transaction.mode_paiement || '-'}
                              </div>
                              <div className="text-muted-foreground">
                                Caissier: {transaction.agent ? `${transaction.agent.noms} ${transaction.agent.prenoms}` : '-'}
                              </div>
                            </div>
                          </div>

                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onViewDetails(transaction)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {transactions.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Aucune transaction trouvée
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionTimeline;
