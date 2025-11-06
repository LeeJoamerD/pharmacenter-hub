import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Euro, CheckCircle, XCircle } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface InvoiceStatisticsCardsProps {
  totalInvoices: number;
  totalAmount: number;
  paidInvoices: number;
  overdueInvoices: number;
}

export const InvoiceStatisticsCards: React.FC<InvoiceStatisticsCardsProps> = ({
  totalInvoices,
  totalAmount,
  paidInvoices,
  overdueInvoices,
}) => {
  const { formatPrice } = useCurrency();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInvoices}</div>
          <p className="text-xs text-muted-foreground">Toutes périodes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
          <Euro className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPrice(totalAmount)}</div>
          <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Factures Payées</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{paidInvoices}</div>
          <p className="text-xs text-green-500">
            {totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0}% du total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Retard</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overdueInvoices}</div>
          <p className="text-xs text-red-500">Nécessitent un suivi</p>
        </CardContent>
      </Card>
    </div>
  );
};
