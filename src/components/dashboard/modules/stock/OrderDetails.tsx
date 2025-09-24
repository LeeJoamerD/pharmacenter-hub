import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Calendar, 
  User, 
  FileText, 
  Truck,
  ArrowLeft,
  Download
} from 'lucide-react';
import { useOrderLines } from '@/hooks/useOrderLines';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { OrderPDFService } from '@/services/OrderPDFService';
import { useToast } from '@/hooks/use-toast';

interface OrderDetailsProps {
  order: any;
  onBack: () => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onBack }) => {
  const { orderLines, loading: loadingLines } = useOrderLines();
  const { settings } = useSystemSettings();
  const { toast } = useToast();
  const [calculatedTotals, setCalculatedTotals] = useState({
    subtotalHT: 0,
    centimeAdditionnel: 0,
    tva: 0,
    totalTTC: 0,
    totalQuantity: 0
  });

  // Get dynamic rates from system settings
  const tauxTVA = settings?.taux_tva ? parseFloat(settings.taux_tva.toString()) / 100 : 0.18;
  const tauxCentimeAdditionnel = settings?.taux_centime_additionnel ? parseFloat(settings.taux_centime_additionnel.toString()) / 100 : 0.05;

  useEffect(() => {
    // Order lines are automatically loaded, no need to fetch manually
  }, [order?.id]);

  useEffect(() => {
    if (orderLines.length > 0) {
      // Calculate real totals from order lines
      const subtotalHT = orderLines.reduce((sum, line) => {
        const lineTotal = (line.quantite_commandee || 0) * (line.prix_achat_unitaire_attendu || 0);
        const remise = 0; // TODO: Add remise field if needed
        return sum + (lineTotal - (lineTotal * remise));
      }, 0);
      
      const centimeAdditionnel = subtotalHT * tauxCentimeAdditionnel;
      const tva = (subtotalHT + centimeAdditionnel) * tauxTVA;
      const totalTTC = subtotalHT + centimeAdditionnel + tva;
      const totalQuantity = orderLines.reduce((sum, line) => sum + (line.quantite_commandee || 0), 0);

      setCalculatedTotals({
        subtotalHT,
        centimeAdditionnel,
        tva,
        totalTTC,
        totalQuantity
      });
    }
  }, [orderLines, tauxTVA, tauxCentimeAdditionnel]);

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'En cours': return 'bg-gray-100 text-gray-800';
      case 'Confirmé': return 'bg-blue-100 text-blue-800';
      case 'Expédié': return 'bg-yellow-100 text-yellow-800';
      case 'En transit': return 'bg-orange-100 text-orange-800';
      case 'Livré': return 'bg-green-100 text-green-800';
      case 'Annulé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadOrder = async () => {
    try {
      // Convert useOrderLines format to OrderPDFService format
      const pdfOrderLines = orderLines.map(line => ({
        id: line.id,
        produit_id: line.produit_id,
        quantite: line.quantite_commandee || 0,
        prix_unitaire: line.prix_achat_unitaire_attendu || 0,
        remise: 0, // TODO: Add if remise field exists
        produit: line.produit ? {
          libelle_produit: line.produit.libelle_produit,
          code_cip: line.produit.code_cip
        } : undefined,
        commande_id: line.commande_id
      }));
      
      const result = await OrderPDFService.generateOrderPDF(order, pdfOrderLines);
      
      if (result.success && result.downloadUrl) {
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Succès",
          description: `Commande ${order.numero} téléchargée`,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Détails de la commande</h1>
            <p className="text-muted-foreground">{order.numero}</p>
          </div>
        </div>
        <Button onClick={handleDownloadOrder}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Information */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Fournisseur</span>
                  </div>
                  <p className="text-sm">{order.fournisseur?.nom || 'Non spécifié'}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Date de commande</span>
                  </div>
                  <p className="text-sm">
                    {new Date(order.dateCommande || order.date_commande).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Livraison prévue</span>
                  </div>
                  <p className="text-sm">
                    {new Date(order.dateLivraison || Date.now() + 7*24*60*60*1000).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Statut</span>
                  </div>
                  <Badge className={getStatusColor(order.statut)}>
                    {order.statut}
                  </Badge>
                </div>
              </div>

              {order.responsable && (
                <div className="space-y-2">
                  <span className="font-medium">Responsable</span>
                  <p className="text-sm">{order.responsable}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Lines */}
          <Card>
            <CardHeader>
              <CardTitle>Articles commandés</CardTitle>
              <CardDescription>
                {calculatedTotals.totalQuantity} articles au total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLines ? (
                <div className="text-center py-8">
                  <Package className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Chargement des articles...</p>
                </div>
              ) : orderLines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p>Aucun article dans cette commande</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderLines.map((line) => {
                    const lineTotal = (line.quantite_commandee || 0) * (line.prix_achat_unitaire_attendu || 0);
                    const remiseAmount = 0; // TODO: Add remise if field exists
                    const totalLine = lineTotal - remiseAmount;
                    
                    return (
                      <div key={line.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {line.produit?.libelle_produit || 'Produit'}
                          </h4>
                          {line.produit?.code_cip && (
                            <p className="text-sm text-muted-foreground">
                              Code CIP: {line.produit.code_cip}
                            </p>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-medium">
                            {line.quantite_commandee || 0} × {(line.prix_achat_unitaire_attendu || 0).toLocaleString()} F CFA
                          </div>
                          <div className="font-bold">
                            {totalLine.toLocaleString()} F CFA
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Amounts Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Montants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Sous-total HT</span>
                  <span className="font-medium">
                    {calculatedTotals.subtotalHT.toLocaleString()} F CFA
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Centime Additionnel ({(tauxCentimeAdditionnel * 100).toFixed(0)}%)</span>
                  <span className="font-medium">
                    {calculatedTotals.centimeAdditionnel.toLocaleString()} F CFA
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>TVA ({(tauxTVA * 100).toFixed(0)}%)</span>
                  <span className="font-medium">
                    {calculatedTotals.tva.toLocaleString()} F CFA
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total TTC</span>
                  <span>{calculatedTotals.totalTTC.toLocaleString()} F CFA</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Nombre d'articles</span>
                <span className="font-medium">{orderLines.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantité totale</span>
                <span className="font-medium">{calculatedTotals.totalQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span>Prix moyen</span>
                <span className="font-medium">
                  {orderLines.length > 0 
                    ? (calculatedTotals.subtotalHT / calculatedTotals.totalQuantity).toLocaleString() 
                    : 0} F CFA
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;