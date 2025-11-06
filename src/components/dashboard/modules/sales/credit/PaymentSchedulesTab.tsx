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
import { Calendar, Plus, AlertCircle } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PaymentSchedule {
  id: string;
  libelle: string;
  type_echeancier: string;
  montant_total: number;
  montant_paye: number;
  montant_restant: number;
  nombre_echeances: number;
  statut: string;
  date_emission: string;
  date_premiere_echeance: string;
  date_derniere_echeance?: string;
  periodicite?: string;
  client_id?: string;
  clients?: { nom_complet: string; telephone?: string };
  facture_id?: string;
  factures?: { numero: string };
}

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
    clients?: { nom_complet: string; telephone?: string };
  };
}

interface PaymentSchedulesTabProps {
  schedules: PaymentSchedule[];
  upcomingPayments: UpcomingPayment[];
  loading?: boolean;
  onCreateSchedule?: () => void;
  onRecordPayment?: (schedule: PaymentSchedule) => void;
}

export const PaymentSchedulesTab = ({
  schedules,
  upcomingPayments,
  loading,
  onCreateSchedule,
  onRecordPayment
}: PaymentSchedulesTabProps) => {
  const { formatPrice } = useCurrency();

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (statut: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      actif: { variant: "default", label: "Actif" },
      complete: { variant: "secondary", label: "Complété" },
      annule: { variant: "destructive", label: "Annulé" },
      suspendu: { variant: "outline", label: "Suspendu" }
    };

    const status = variants[statut] || { variant: "outline" as const, label: statut };
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  const getPeriodiciteLabel = (periodicite?: string) => {
    const labels: Record<string, string> = {
      hebdomadaire: "Hebdo",
      mensuelle: "Mensuel",
      trimestrielle: "Trimestriel"
    };
    return periodicite ? labels[periodicite] || periodicite : "-";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Échéances à Venir */}
      {upcomingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Échéances à Venir (7 prochains jours)
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {upcomingPayments.length} échéance{upcomingPayments.length > 1 ? 's' : ''} à venir
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>N° Échéance</TableHead>
                    <TableHead className="text-right">Montant Dû</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-orange-600" />
                          {formatDate(payment.date_echeance)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.echeanciers_paiements?.clients?.nom_complet || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {payment.echeanciers_paiements?.libelle || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          Échéance #{payment.numero_echeance}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">
                        {formatPrice(payment.montant_restant)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des Échéanciers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Échéanciers de Paiement</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {schedules.length} échéancier{schedules.length > 1 ? 's' : ''} configuré{schedules.length > 1 ? 's' : ''}
              </p>
            </div>
            {onCreateSchedule && (
              <Button onClick={onCreateSchedule}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel Échéancier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun échéancier de paiement configuré</p>
              {onCreateSchedule && (
                <Button variant="outline" className="mt-4" onClick={onCreateSchedule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le premier échéancier
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead className="text-right">Restant</TableHead>
                    <TableHead className="text-center">Échéances</TableHead>
                    <TableHead>Périodicité</TableHead>
                    <TableHead>Prochaine Échéance</TableHead>
                    <TableHead>Statut</TableHead>
                    {onRecordPayment && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => {
                    const progress = schedule.montant_total > 0 
                      ? (schedule.montant_paye / schedule.montant_total) * 100 
                      : 0;

                    return (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{schedule.clients?.nom_complet || 'N/A'}</div>
                            {schedule.clients?.telephone && (
                              <div className="text-xs text-muted-foreground">
                                {schedule.clients.telephone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{schedule.libelle}</div>
                            {schedule.factures?.numero && (
                              <div className="text-xs text-muted-foreground">
                                Facture: {schedule.factures.numero}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPrice(schedule.montant_total)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatPrice(schedule.montant_paye)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatPrice(schedule.montant_restant)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {schedule.nombre_echeances}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getPeriodiciteLabel(schedule.periodicite)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {schedule.date_premiere_echeance 
                            ? formatDate(schedule.date_premiere_echeance)
                            : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(schedule.statut)}</TableCell>
                        {onRecordPayment && (
                          <TableCell className="text-right">
                            {schedule.statut === 'actif' && schedule.montant_restant > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRecordPayment(schedule)}
                              >
                                Enregistrer paiement
                              </Button>
                            )}
                          </TableCell>
                        )}
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
