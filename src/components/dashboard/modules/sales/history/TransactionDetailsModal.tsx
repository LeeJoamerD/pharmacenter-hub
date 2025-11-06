import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Transaction } from '@/hooks/useTransactionHistory';
import { Printer, X, Calendar, User, CreditCard, Receipt, ShoppingCart } from 'lucide-react';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel?: (id: string) => void;
}

const TransactionDetailsModal = ({ transaction, open, onOpenChange, onCancel }: TransactionDetailsModalProps) => {
  const { formatPrice } = useCurrency();

  if (!transaction) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Détails de la transaction</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-1" />
                Imprimer
              </Button>
              {transaction.statut !== 'Annulée' && onCancel && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    onCancel(transaction.id);
                    onOpenChange(false);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Numéro de transaction
                </Label>
                <p className="text-lg font-semibold">{transaction.numero_vente}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date et heure
                </Label>
                <p className="font-medium">
                  {new Date(transaction.date_vente).toLocaleString('fr-FR', {
                    dateStyle: 'full',
                    timeStyle: 'short'
                  })}
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground">Statut</Label>
                <div className="mt-1">
                  {getStatusBadge(transaction.statut)}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client
                </Label>
                <p className="font-medium">
                  {transaction.client?.nom_complet || 'Client anonyme'}
                </p>
                {transaction.client?.telephone && (
                  <p className="text-sm text-muted-foreground">{transaction.client.telephone}</p>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Mode de paiement
                </Label>
                <p className="font-medium">{transaction.mode_paiement || '-'}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Caissier</Label>
                <p className="font-medium">
                  {transaction.agent ? `${transaction.agent.noms} ${transaction.agent.prenoms}` : '-'}
                </p>
              </div>

              {transaction.caisse && (
                <div>
                  <Label className="text-muted-foreground">Caisse</Label>
                  <p className="font-medium">{transaction.caisse.nom_caisse}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Articles vendus */}
          <div>
            <Label className="text-lg font-semibold flex items-center gap-2 mb-4">
              <ShoppingCart className="h-5 w-5" />
              Articles vendus
            </Label>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                    <TableHead className="text-right">Prix unitaire</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaction.lignes_ventes && transaction.lignes_ventes.length > 0 ? (
                    transaction.lignes_ventes.map((ligne, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {ligne.produit?.libelle_produit || 'Produit'}
                        </TableCell>
                        <TableCell className="text-right">{ligne.quantite}</TableCell>
                        <TableCell className="text-right">
                          {formatPrice(ligne.prix_unitaire_ttc)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(ligne.montant_ligne_ttc)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Aucun article trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          {/* Totaux */}
          <div className="bg-muted/30 p-6 rounded-lg space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sous-total HT</span>
              <span className="font-medium">{formatPrice(transaction.montant_total_ht)}</span>
            </div>
            
            {transaction.montant_tva && transaction.montant_tva > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVA (18%)</span>
                <span className="font-medium">{formatPrice(transaction.montant_tva)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total TTC</span>
              <span className="font-medium">{formatPrice(transaction.montant_total_ttc)}</span>
            </div>

            {transaction.remise_globale && transaction.remise_globale > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Remise</span>
                <span className="font-medium">- {formatPrice(transaction.remise_globale)}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Montant net</span>
              <span className="text-primary">{formatPrice(transaction.montant_net)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailsModal;
