import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Send, Clock } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

interface UpcomingPayment {
  id: string;
  numero_echeance: number;
  date_echeance: string;
  montant_echeance: number;
  montant_restant: number;
  statut: string;
  echeancier_id: string;
  echeanciers_paiements?: {
    libelle: string;
    client_id?: string;
    clients?: { nom_complet: string; telephone?: string; email?: string };
  };
}

interface CreditAlertsTabProps {
  overduePayments: UpcomingPayment[];
  loading?: boolean;
  onSendReminder?: (payment: UpcomingPayment) => void;
}

export const CreditAlertsTab = ({
  overduePayments,
  loading,
  onSendReminder
}: CreditAlertsTabProps) => {
  const { formatPrice } = useCurrency();
  const [selectedPayment, setSelectedPayment] = useState<UpcomingPayment | null>(null);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
    } catch {
      return dateString;
    }
  };

  const getDaysOverdue = (dateString: string) => {
    const today = new Date();
    const dueDate = new Date(dateString);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSeverityBadge = (days: number) => {
    if (days >= 30) {
      return <Badge variant="destructive">Critique ({days}j)</Badge>;
    } else if (days >= 15) {
      return <Badge className="bg-orange-600">Urgent ({days}j)</Badge>;
    } else {
      return <Badge className="bg-yellow-600">Attention ({days}j)</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalOverdue = overduePayments.reduce((sum, p) => sum + p.montant_restant, 0);

  return (
    <div className="space-y-6">
      {/* Résumé des Alertes */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Échéances en Retard
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overduePayments.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nécessitent une action immédiate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Montant Total en Retard
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatPrice(totalOverdue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              À recouvrer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Retard Moyen
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {overduePayments.length > 0
                ? Math.round(
                    overduePayments.reduce((sum, p) => sum + getDaysOverdue(p.date_echeance), 0) /
                      overduePayments.length
                  )
                : 0}{' '}
              jours
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Durée moyenne du retard
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des Échéances en Retard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Échéances en Retard
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {overduePayments.length} paiement{overduePayments.length > 1 ? 's' : ''} en retard
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {overduePayments.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-green-600 opacity-50" />
              <p className="text-muted-foreground">
                Aucune échéance en retard
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Tous les paiements sont à jour
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date Échéance</TableHead>
                    <TableHead>Retard</TableHead>
                    <TableHead>N° Échéance</TableHead>
                    <TableHead className="text-right">Montant Dû</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overduePayments.map((payment) => {
                    const daysOverdue = getDaysOverdue(payment.date_echeance);
                    return (
                      <TableRow key={payment.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div>
                            <div>{payment.echeanciers_paiements?.clients?.nom_complet || 'N/A'}</div>
                            {payment.echeanciers_paiements?.clients?.telephone && (
                              <div className="text-xs text-muted-foreground">
                                {payment.echeanciers_paiements.clients.telephone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {payment.echeanciers_paiements?.libelle || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-red-600">
                            <Clock className="h-4 w-4" />
                            {formatDate(payment.date_echeance)}
                          </div>
                        </TableCell>
                        <TableCell>{getSeverityBadge(daysOverdue)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            Échéance #{payment.numero_echeance}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          {formatPrice(payment.montant_restant)}
                        </TableCell>
                        <TableCell className="text-right">
                          {onSendReminder && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onSendReminder(payment)}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Relancer
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
