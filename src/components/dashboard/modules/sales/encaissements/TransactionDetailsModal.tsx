import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, X } from 'lucide-react';
import { TransactionDetails } from '@/hooks/useEncaissements';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface TransactionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
  onFetchDetails: (id: string) => Promise<TransactionDetails | null>;
}

const TransactionDetailsModal = ({
  open,
  onOpenChange,
  transactionId,
  onFetchDetails,
}: TransactionDetailsModalProps) => {
  const [details, setDetails] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && transactionId) {
      setLoading(true);
      onFetchDetails(transactionId)
        .then((data) => {
          setDetails(data);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setDetails(null);
    }
  }, [open, transactionId, onFetchDetails]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      Finalisée: 'default',
      Validée: 'default',
      'En attente': 'secondary',
      Annulée: 'destructive',
      Remboursée: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-CG', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  };

  const { formatAmount } = useCurrencyFormatting();
  const formatCurrency = (amount: number) => formatAmount(amount);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chargement des détails...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!details) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Détails de la Transaction</DialogTitle>
              <DialogDescription>
                Vente N° {details.numero_vente} • {formatDate(details.date_vente)}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-1" />
                Imprimer
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Exporter
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations Générales */}
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <div className="mt-1">{getStatusBadge(details.statut)}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mode de Paiement</p>
              <p className="font-medium">{details.mode_paiement}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Caisse</p>
              <p className="font-medium">{details.caisse?.nom || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Session</p>
              <p className="font-medium">{details.session_caisse?.numero_session || 'N/A'}</p>
            </div>
            {details.reference_paiement && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Référence Paiement</p>
                <p className="font-medium">{details.reference_paiement}</p>
              </div>
            )}
          </div>

          {/* Client */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-3">Client</h3>
            {details.client ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-medium">{details.client.nom_complet}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{details.client.telephone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="outline">{details.client.type_client}</Badge>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Client Ordinaire</p>
            )}
          </div>

          {/* Caissier */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-3">Caissier</h3>
            {details.agent ? (
              <p className="font-medium">
                {details.agent.prenoms} {details.agent.noms}
              </p>
            ) : (
              <p className="text-muted-foreground">N/A</p>
            )}
          </div>

          {/* Articles */}
          <div className="border rounded-lg overflow-hidden">
            <div className="p-4 bg-muted">
              <h3 className="font-semibold">Articles Vendus ({details.lignes_ventes.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Produit</th>
                    <th className="text-left p-3 text-sm font-medium">Code CIP</th>
                    <th className="text-right p-3 text-sm font-medium">Quantité</th>
                    <th className="text-right p-3 text-sm font-medium">Prix Unitaire</th>
                    <th className="text-right p-3 text-sm font-medium">Remise</th>
                    <th className="text-right p-3 text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {details.lignes_ventes.map((ligne) => (
                    <tr key={ligne.id} className="border-t">
                      <td className="p-3">{ligne.produit.libelle_produit}</td>
                      <td className="p-3 text-muted-foreground">{ligne.produit.code_cip || 'N/A'}</td>
                      <td className="p-3 text-right">{ligne.quantite}</td>
                      <td className="p-3 text-right">{formatCurrency(ligne.prix_unitaire)}</td>
                      <td className="p-3 text-right text-destructive">
                        -{formatCurrency(ligne.montant_remise || 0)}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(ligne.montant_ligne)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux */}
          <div className="p-4 border rounded-lg bg-muted/20">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant HT</span>
                <span className="font-medium">{formatCurrency(details.montant_total_ht)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA</span>
                <span className="font-medium">{formatCurrency(details.montant_tva)}</span>
              </div>
              {details.montant_remise > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Remise</span>
                  <span className="font-medium">-{formatCurrency(details.montant_remise)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Montant Net</span>
                <span className="font-bold text-primary">
                  {formatCurrency(details.montant_net)}
                </span>
              </div>
              {details.mode_paiement === 'Assurance' && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Part Assurance</span>
                    <span className="font-medium">
                      {formatCurrency(details.montant_part_assurance || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Part Patient</span>
                    <span className="font-medium">
                      {formatCurrency(details.montant_part_patient || 0)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailsModal;
