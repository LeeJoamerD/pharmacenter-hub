import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { Package, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface ProductDetailsModalProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailsModal = ({ productId, isOpen, onClose }: ProductDetailsModalProps) => {
  const { useTenantQueryWithCache } = useTenantQuery();

  // Fetch product details
  const { data: product, isLoading: productLoading } = useTenantQueryWithCache(
    ['product-details', productId],
    'produits',
    `
      id, libelle_produit, code_cip, prix_achat, prix_vente_ttc,
      stock_limite, stock_alerte, famille_id, rayon_id, laboratoires_id,
      famille_produit(libelle_famille),
      rayons_produits(libelle_rayon),
      laboratoires(libelle)
    `,
    { id: productId },
    { enabled: !!productId }
  );

  // Fetch lots for this product
  const { data: lots = [], isLoading: lotsLoading } = useTenantQueryWithCache(
    ['product-lots', productId],
    'lots',
    `
      id, numero_lot, date_peremption, date_fabrication,
      quantite_initiale, quantite_restante, prix_achat_unitaire,
      statut, emplacement, created_at
    `,
    { produit_id: productId },
    { enabled: !!productId, orderBy: { column: 'date_peremption', ascending: true } }
  );

  // Fetch recent movements
  const { data: movements = [], isLoading: movementsLoading } = useTenantQueryWithCache(
    ['product-movements', productId],
    'stock_mouvements',
    `
      id, type_mouvement, quantite, date_mouvement,
      reference_document, notes, created_at,
      personnel(noms, prenoms)
    `,
    { produit_id: productId },
    { enabled: !!productId, limit: 30, orderBy: { column: 'created_at', ascending: false } }
  );

  const currentProduct = product?.[0];
  const totalStock = lots.reduce((sum: number, lot: any) => sum + (lot.quantite_restante || 0), 0);
  const totalValue = lots.reduce((sum: number, lot: any) => 
    sum + ((lot.quantite_restante || 0) * (lot.prix_achat_unitaire || 0)), 0
  );

  if (!productId || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {currentProduct?.libelle_produit || 'Détails du produit'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="lots">Lots ({lots.length})</TabsTrigger>
            <TabsTrigger value="movements">Mouvements ({movements.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Informations Générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Code CIP:</span>
                    <p className="font-medium">{currentProduct?.code_cip}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Famille:</span>
                    <p className="font-medium">{currentProduct?.famille_produit?.libelle_famille}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Rayon:</span>
                    <p className="font-medium">{currentProduct?.rayons_produits?.libelle_rayon}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Laboratoire:</span>
                    <p className="font-medium">{currentProduct?.laboratoires?.libelle}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Stock & Valorisation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Stock Actuel:</span>
                    <p className="text-2xl font-bold">{totalStock}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Valorisation:</span>
                    <p className="text-xl font-semibold">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(totalValue)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Stock Limite:</span>
                    <p className="font-medium">{currentProduct?.stock_limite}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Stock Alerte:</span>
                    <p className="font-medium">{currentProduct?.stock_alerte}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Prix</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Prix d'Achat:</span>
                  <p className="font-medium">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(currentProduct?.prix_achat || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Prix de Vente TTC:</span>
                  <p className="font-medium">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(currentProduct?.prix_vente_ttc || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lots" className="space-y-4">
            {lotsLoading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : lots.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Aucun lot disponible
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {lots.map((lot: any) => (
                  <Card key={lot.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lot.numero_lot}</span>
                            <Badge variant={lot.statut === 'Disponible' ? 'default' : 'secondary'}>
                              {lot.statut}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {lot.emplacement && `Emplacement: ${lot.emplacement}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{lot.quantite_restante}</p>
                          <p className="text-xs text-muted-foreground">sur {lot.quantite_initiale}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Péremption:</span>
                          <p className="font-medium">
                            {lot.date_peremption ? new Date(lot.date_peremption).toLocaleDateString('fr-FR') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prix Unitaire:</span>
                          <p className="font-medium">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(lot.prix_achat_unitaire || 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            {movementsLoading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : movements.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Aucun mouvement enregistré
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {movements.map((movement: any) => (
                  <Card key={movement.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={movement.type_mouvement === 'entree' ? 'default' : 'destructive'}>
                              {movement.type_mouvement}
                            </Badge>
                            <span className="text-sm font-medium">
                              {movement.quantite} unités
                            </span>
                          </div>
                          {movement.notes && (
                            <p className="text-xs text-muted-foreground">{movement.notes}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Par: {movement.personnel?.prenoms} {movement.personnel?.noms}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {new Date(movement.date_mouvement).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
