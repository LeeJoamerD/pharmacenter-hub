import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  BarChart3, 
  Zap,
  ShoppingCart,
  Calendar,
  Target,
  Calculator
} from 'lucide-react';
import { useIntegratedStock } from '@/hooks/useIntegratedStock';
import { useToast } from '@/hooks/use-toast';

const StockIntegrationDemo = () => {
  const { toast } = useToast();
  const {
    integratedData,
    products,
    settings,
    loading,
    recordMovementWithValidation,
    calculateProductValuation,
    getReorderRecommendation,
    refreshData
  } = useIntegratedStock();

  const [activeDemo, setActiveDemo] = useState<string>('overview');

  const handleTestMovement = async () => {
    if (!products || products.length === 0) {
      toast({
        title: "Aucun produit disponible",
        description: "Ajoutez des produits pour tester les mouvements de stock.",
        variant: "destructive"
      });
      return;
    }

    try {
      const testProduct = products[0];
      await recordMovementWithValidation({
        produit_id: testProduct.id,
        quantite: 10,
        type_mouvement: 'entree',
        description: 'Test d\'intégration - Entrée stock'
      });

      toast({
        title: "Mouvement enregistré",
        description: "Le mouvement de test a été enregistré avec succès."
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCalculateValuation = async () => {
    if (!products || products.length === 0) return;

    try {
      const testProduct = products[0];
      const valuation = await calculateProductValuation(testProduct.id);
      
      if (valuation) {
        toast({
          title: "Valorisation calculée",
          description: `Valeur totale: ${valuation.totalValue.toFixed(2)} FCFA (Méthode: ${settings?.valuation_method})`
        });
      }
    } catch (error) {
      console.error('Error calculating valuation:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getRotationLabel = (rotation: number) => {
    if (rotation >= 2.5) return { label: 'Rapide', color: 'bg-green-500' };
    if (rotation >= 1.5) return { label: 'Normale', color: 'bg-blue-500' };
    return { label: 'Lente', color: 'bg-red-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Chargement de l'intégration stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Démonstration Intégration Stock</h2>
          <p className="text-muted-foreground">
            Fonctionnalités avancées basées sur la configuration des paramètres stock
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline">
            <Package className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={handleTestMovement}>
            <Zap className="h-4 w-4 mr-2" />
            Test Mouvement
          </Button>
        </div>
      </div>

      <Tabs value={activeDemo} onValueChange={setActiveDemo}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="reorder">Réapprovisionnement</TabsTrigger>
          <TabsTrigger value="valuation">Valorisation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notifications Actives</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{integratedData.notifications.length}</div>
                <p className="text-xs text-muted-foreground">
                  {integratedData.notifications.filter(n => n.priority === 'critical').length} critiques
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produits à Réapprovisionner</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{integratedData.reorderSuggestions.length}</div>
                <p className="text-xs text-muted-foreground">
                  Suggestions basées sur les seuils configurés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valeur Stock Totale</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {integratedData.valuationSummary.totalValue.toLocaleString()} FCFA
                </div>
                <p className="text-xs text-muted-foreground">
                  Méthode: {integratedData.valuationSummary.methodUsed}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rotation Moyenne</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getRotationLabel(integratedData.valuationSummary.avgRotation).label}
                </div>
                <Progress 
                  value={(integratedData.valuationSummary.avgRotation / 3) * 100} 
                  className="w-full mt-2"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configuration Actuelle</CardTitle>
              <CardDescription>
                Paramètres de configuration stock utilisés pour les calculs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Méthode de valorisation</p>
                  <Badge variant="outline">{settings?.valuation_method}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Stock négatif autorisé</p>
                  <Badge variant={settings?.allow_negative_stock ? "default" : "secondary"}>
                    {settings?.allow_negative_stock ? 'Oui' : 'Non'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Suivi des dates d'expiration</p>
                  <Badge variant={settings?.track_expiration_dates ? "default" : "secondary"}>
                    {settings?.track_expiration_dates ? 'Activé' : 'Désactivé'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Stock minimum (jours)</p>
                  <Badge variant="outline">{settings?.minimum_stock_days}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Point de commande (jours)</p>
                  <Badge variant="outline">{settings?.reorder_point_days}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Stock de sécurité (%)</p>
                  <Badge variant="outline">{settings?.safety_stock_percentage}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Notifications Stock Intelligentes
              </CardTitle>
              <CardDescription>
                Alertes générées automatiquement basées sur vos paramètres de configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integratedData.notifications.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Aucune notification active. Tous les stocks sont dans les seuils configurés.
                </div>
              ) : (
                <div className="space-y-3">
                  {integratedData.notifications.slice(0, 10).map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {notification.category}
                          </span>
                        </div>
                        <p className="font-medium">{notification.productName}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Stock: {notification.currentStock}</p>
                        {notification.threshold && (
                          <p className="text-xs text-muted-foreground">
                            Seuil: {notification.threshold}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reorder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Suggestions de Réapprovisionnement
              </CardTitle>
              <CardDescription>
                Recommandations calculées automatiquement selon vos paramètres de stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integratedData.reorderSuggestions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Aucun produit ne nécessite de réapprovisionnement actuellement.
                </div>
              ) : (
                <div className="space-y-3">
                  {integratedData.reorderSuggestions.map((suggestion) => (
                    <div key={suggestion.productId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{suggestion.productName}</h4>
                        <Badge variant="outline">{suggestion.category}</Badge>
                      </div>
                      <div className="grid gap-2 md:grid-cols-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Stock actuel:</span>
                          <span className="ml-1 font-medium">{suggestion.currentStock}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Point de commande:</span>
                          <span className="ml-1 font-medium">{suggestion.reorderPoint}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quantité suggérée:</span>
                          <span className="ml-1 font-medium text-primary">{suggestion.suggestedQuantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="valuation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Valorisation Intelligente du Stock
              </CardTitle>
              <CardDescription>
                Calculs automatiques selon la méthode configurée ({settings?.valuation_method})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Résumé de Valorisation</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Nombre de produits:</span>
                        <span className="font-medium">{integratedData.valuationSummary.productCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valeur totale:</span>
                        <span className="font-medium">
                          {integratedData.valuationSummary.totalValue.toLocaleString()} FCFA
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Méthode utilisée:</span>
                        <Badge variant="outline">{integratedData.valuationSummary.methodUsed}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Rotation moyenne:</span>
                        <Badge className={getRotationLabel(integratedData.valuationSummary.avgRotation).color + ' text-white'}>
                          {getRotationLabel(integratedData.valuationSummary.avgRotation).label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Actions Rapides</h4>
                    <div className="space-y-2">
                      <Button onClick={handleCalculateValuation} variant="outline" className="w-full">
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculer Valorisation Test
                      </Button>
                      <Button onClick={refreshData} variant="outline" className="w-full">
                        <Package className="h-4 w-4 mr-2" />
                        Actualiser Données
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockIntegrationDemo;