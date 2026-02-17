import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Package,
  Truck,
  Calendar,
  MapPin,
  User,
  Clock,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  X,
  ShoppingCart,
  DollarSign,
  FileText
} from 'lucide-react';
import { useOrderLines } from '@/hooks/useOrderLines';
import { useSystemSettings } from '@/hooks/useSystemSettings';
interface OrderDetailsModalProps {
  open: boolean;
  onClose: () => void;
  order: any | null;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  open,
  onClose,
  order
}) => {
  const { orderLines: orderLineItems, loading: linesLoading } = useOrderLines(order?.id);
  const { settings } = useSystemSettings();

  if (!order) return null;

  // Calculer les totaux
  const sousTotal = orderLineItems.reduce((sum, line) => {
    return sum + (line.quantite_commandee * (line.prix_achat_unitaire_attendu || 0));
  }, 0);

  const tauxTVA = settings?.taux_tva || 18;
  const tauxCentimeAdditionnel = settings?.taux_centime_additionnel || 5;

  const montantCentimeAdditionnel = (sousTotal * tauxCentimeAdditionnel) / 100;
  const basePourTVA = sousTotal + montantCentimeAdditionnel;
  const montantTVA = (basePourTVA * tauxTVA) / 100;
  const totalTTC = basePourTVA + montantTVA;

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'preparation': return 'bg-blue-100 text-blue-800';
      case 'expedie': return 'bg-purple-100 text-purple-800';
      case 'en-transit': return 'bg-orange-100 text-orange-800';
      case 'livre': return 'bg-green-100 text-green-800';
      case 'retard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'preparation': return <Package className="h-4 w-4" />;
      case 'expedie': return <Truck className="h-4 w-4" />;
      case 'en-transit': return <RefreshCw className="h-4 w-4" />;
      case 'livre': return <CheckCircle className="h-4 w-4" />;
      case 'retard': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStepStatusColor = (statut: string) => {
    switch (statut) {
      case 'complete': return 'text-green-600';
      case 'en-cours': return 'text-blue-600';
      case 'en-attente': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStepIcon = (statut: string) => {
    switch (statut) {
      case 'complete': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'en-cours': return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'en-attente': return <Clock className="h-5 w-5 text-gray-400" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Détails de la Commande</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Commande {order.numero} - {order.fournisseur}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Numéro</p>
                    <p className="font-medium">{order.numero}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fournisseur</p>
                    <p className="font-medium">{order.fournisseur}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date commande</p>
                    <p className="font-medium">
                      {new Date(order.dateCommande).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(order.statut)}
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge className={`${getStatusColor(order.statut)}`}>
                      {order.statut}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informations transport et livraison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Transporteur
                </h3>
                <div className="space-y-2">
                  <p className="font-medium">{order.transporteur}</p>
                  <p className="text-sm text-muted-foreground">
                    N° Suivi: {order.numeroSuivi}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresse de livraison
                </h3>
                <p className="text-sm">{order.adresseLivraison}</p>
              </CardContent>
            </Card>
          </div>

          {/* Articles de la commande */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Articles commandés
              </h3>
              
              {linesLoading ? (
                <div className="text-center py-4">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Chargement des articles...</p>
                </div>
              ) : orderLineItems.length > 0 ? (
                <div className="space-y-3">
                  {orderLineItems.map((line, index) => (
                    <div key={line.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">
                          {line.produit?.libelle_produit || `Article ${index + 1}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Qté: {line.quantite_commandee} × {line.prix_achat_unitaire_attendu?.toFixed(2)} FCFA
                        </p>
                      </div>
                      <p className="font-medium">
                        {(line.quantite_commandee * (line.prix_achat_unitaire_attendu || 0)).toFixed(2)} FCFA
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun article trouvé pour cette commande</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totaux */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Résumé financier
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total HT:</span>
                  <span className="font-medium">{sousTotal.toFixed(2)} FCFA</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Centime additionnel ({tauxCentimeAdditionnel}%):
                  </span>
                  <span className="font-medium">{montantCentimeAdditionnel.toFixed(2)} FCFA</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    TVA ({tauxTVA}%):
                  </span>
                  <span className="font-medium">{montantTVA.toFixed(2)} FCFA</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total TTC:</span>
                    <span className="font-bold text-green-600">{totalTTC.toFixed(2)} FCFA</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chronologie complète */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Chronologie du suivi
              </h3>
              <div className="space-y-4">
                {(order.etapes || []).map((etape, index) => (
                  <div key={etape.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getStepIcon(etape.statut)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${getStepStatusColor(etape.statut)}`}>
                          {etape.libelle}
                        </p>
                        <span className="text-sm text-muted-foreground">
                          {new Date(etape.date).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      {etape.commentaire && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {etape.commentaire}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;
