import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CreditTransaction {
  id: string;
  type: 'purchase' | 'payment';
  date: string;
  client_name?: string;
  client_id?: string;
  amount: number;
  reference?: string;
  description: string;
}

interface CreditTransactionsTabProps {
  transactions: CreditTransaction[];
  loading?: boolean;
}

export const CreditTransactionsTab = ({ transactions, loading }: CreditTransactionsTabProps) => {
  const { formatPrice } = useCurrency();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: fr });
    } catch {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des Transactions</CardTitle>
        <p className="text-sm text-muted-foreground">
          {transactions.length} transaction{transactions.length > 1 ? 's' : ''} récente{transactions.length > 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aucune transaction trouvée</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-sm">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>
                      {transaction.type === 'payment' ? (
                        <Badge variant="default" className="bg-green-600">
                          <ArrowUp className="h-3 w-3 mr-1" />
                          Paiement
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <ArrowDown className="h-3 w-3 mr-1" />
                          Achat
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.client_name || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {transaction.description}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {transaction.reference || '-'}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}
                      {formatPrice(Math.abs(transaction.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
