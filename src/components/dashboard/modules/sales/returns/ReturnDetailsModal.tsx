import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, User, Package, DollarSign, FileText, CheckCircle } from 'lucide-react';
import { Return } from '@/hooks/useReturnsExchanges';

interface ReturnDetailsModalProps {
  returnData: Return | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReturnDetailsModal: React.FC<ReturnDetailsModalProps> = ({ 
  returnData, 
  open, 
  onOpenChange 
}) => {
  if (!returnData) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      'En attente': 'secondary',
      'Approuvé': 'default',
      'Rejeté': 'destructive',
      'Terminé': 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const getConditionBadge = (condition: string) => {
    const variants = {
      'Parfait': 'default',
      'Endommagé': 'secondary',
      'Expiré': 'destructive',
      'Non conforme': 'destructive'
    } as const;

    return (
      <Badge variant={variants[condition as keyof typeof variants] || 'outline'} className="text-xs">
        {condition}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Détails du Retour {returnData.numero_retour}</span>
            {getStatusBadge(returnData.statut)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date du retour
                </Label>
                <p className="font-medium">
                  {new Date(returnData.date_retour).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Transaction origine
                </Label>
                <p className="font-medium">{returnData.numero_vente_origine || 'N/A'}</p>
              </div>

              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client
                </Label>
                <p className="font-medium">
                  {(returnData as any).client?.nom_complet || 'N/A'}
                </p>
                {(returnData as any).client?.telephone && (
                  <p className="text-sm text-muted-foreground">
                    {(returnData as any).client.telephone}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Type d'opération
                </Label>
                <p className="font-medium">{returnData.type_operation}</p>
              </div>

              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Montants
                </Label>
                <div className="space-y-1">
                  <p className="font-medium">
                    Total: {returnData.montant_total_retour.toLocaleString('fr-FR')} FCFA
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Remboursé: {returnData.montant_rembourse.toLocaleString('fr-FR')} FCFA
                  </p>
                  {returnData.montant_avoir > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Avoir: {returnData.montant_avoir.toLocaleString('fr-FR')} FCFA
                    </p>
                  )}
                </div>
              </div>

              {returnData.mode_remboursement && (
                <div>
                  <Label className="text-muted-foreground">Mode de remboursement</Label>
                  <p className="font-medium">{returnData.mode_remboursement}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Motif */}
          <div>
            <Label className="text-muted-foreground">Motif du retour</Label>
            <p className="mt-1">{returnData.motif_retour}</p>
            {returnData.notes && (
              <>
                <Label className="text-muted-foreground mt-4 block">Notes</Label>
                <p className="mt-1 text-sm text-muted-foreground">{returnData.notes}</p>
              </>
            )}
          </div>

          {/* Articles retournés - toujours afficher cette section */}
          <Separator />
          <div>
            <Label className="text-muted-foreground mb-3 block">Articles retournés</Label>
            {returnData.lignes && returnData.lignes.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Prix unitaire</TableHead>
                      <TableHead>État</TableHead>
                      <TableHead>Remboursement</TableHead>
                      <TableHead>Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnData.lignes.map((ligne: any) => (
                      <TableRow key={ligne.id}>
                        <TableCell className="font-medium">
                          {ligne.produit?.libelle_produit || 'Produit'}
                        </TableCell>
                        <TableCell>{ligne.quantite_retournee}</TableCell>
                        <TableCell>
                          {ligne.prix_unitaire.toLocaleString('fr-FR')} FCFA
                        </TableCell>
                        <TableCell>
                          {getConditionBadge(ligne.etat_produit)}
                        </TableCell>
                        <TableCell>
                          {ligne.taux_remboursement}% = {ligne.montant_ligne.toLocaleString('fr-FR')} FCFA
                        </TableCell>
                        <TableCell>
                          {ligne.remis_en_stock ? (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Réintégré
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Non réintégré</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm p-4 border rounded-lg bg-muted/30">
                Aucun article détaillé disponible
              </p>
            )}
          </div>

          {/* Informations validation */}
          {(returnData as any).validateur && (
            <>
              <Separator />
              <div className="bg-muted/30 p-4 rounded-lg">
                <Label className="text-muted-foreground">Validé par</Label>
                <p className="font-medium">
                  {(returnData as any).validateur.noms} {(returnData as any).validateur.prenoms}
                </p>
                {(returnData as any).date_validation && (
                  <p className="text-sm text-muted-foreground">
                    Le {new Date((returnData as any).date_validation).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnDetailsModal;
