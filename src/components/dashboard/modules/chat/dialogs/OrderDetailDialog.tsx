import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, Package, Calendar, User, CreditCard, Download, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import type { NetworkOrder } from '@/hooks/useNetworkBusinessIntegrations';

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: NetworkOrder | null;
  onUpdateStatus?: (orderId: string, status: string) => void;
  isUpdating?: boolean;
}

interface OrderLine {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export function OrderDetailDialog({ open, onOpenChange, order, onUpdateStatus, isUpdating }: OrderDetailDialogProps) {
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && order) {
      loadOrderLines();
    }
  }, [open, order]);

  const loadOrderLines = async () => {
    if (!order) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('lignes_ventes')
        .select(`
          id,
          quantite,
          prix_unitaire,
          montant_total,
          produit:produit_id(libelle_produit)
        `)
        .eq('vente_id', order.id);

      if (error) throw error;

      setLines((data as any)?.map((l: any) => ({
        id: l.id,
        productName: l.produit?.libelle_produit || 'Produit',
        quantity: l.quantite,
        unitPrice: l.prix_unitaire || 0,
        total: l.montant_total || 0
      })) || []);
    } catch (error) {
      console.error('Error loading order lines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'processing': return 'En cours';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Détails de la commande #{order.numero_vente}
          </DialogTitle>
          <DialogDescription>
            Informations complètes sur la commande
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{order.customer}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{format(new Date(order.date), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-medium">{order.total.toFixed(0)} FCFA</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`} />
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <p className="font-medium">{getStatusLabel(order.status)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Lines */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Articles ({order.items})
            </h4>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {lines.map(line => (
                    <div key={line.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{line.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {line.quantity} x {line.unitPrice.toFixed(0)} FCFA
                        </p>
                      </div>
                      <p className="font-medium">{line.total.toFixed(0)} FCFA</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              {order.status === 'pending' && onUpdateStatus && (
                <Button 
                  variant="outline" 
                  onClick={() => onUpdateStatus(order.id, 'En cours')}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Traiter
                </Button>
              )}
              {order.status === 'processing' && onUpdateStatus && (
                <Button 
                  onClick={() => onUpdateStatus(order.id, 'Validée')}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Valider
                </Button>
              )}
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Télécharger facture
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
