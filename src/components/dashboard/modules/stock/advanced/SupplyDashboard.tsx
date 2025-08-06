import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Package,
  Users,
  BarChart3,
  Target,
  Bell,
  RefreshCw
} from 'lucide-react';
import { useSupplyAnalytics } from '@/hooks/useSupplyAnalytics';
import { useSupplyAutomation } from '@/hooks/useSupplyAutomation';

const SupplyDashboard = () => {
  const {
    supplierPerformance,
    deliveryAnalytics,
    qualityMetrics,
    supplyKPIs,
    loading: analyticsLoading,
    getTopSuppliers,
    getProblematicSuppliers,
    getDeliveryTrend,
    getOverallPerformanceScore,
    refresh: refreshAnalytics
  } = useSupplyAnalytics();

  const {
    stockAlerts,
    supplyNeeds,
    lateDeliveries,
    loading: automationLoading,
    refresh: refreshAutomation
  } = useSupplyAutomation();

  const [activeTab, setActiveTab] = useState('overview');

  const loading = analyticsLoading || automationLoading;

  // Métriques principales
  const overallScore = getOverallPerformanceScore();
  const topSuppliers = getTopSuppliers(3);
  const problematicSuppliers = getProblematicSuppliers();
  const deliveryTrend = getDeliveryTrend();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'worsening': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <BarChart3 className="h-4 w-4 text-blue-600" />;
    }
  };

  const getUrgencyColor = (urgence: string) => {
    switch (urgence) {
      case 'critique': return 'text-red-600 bg-red-50';
      case 'eleve': case 'haute': return 'text-orange-600 bg-orange-50';
      case 'moyen': case 'moyenne': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refreshAnalytics(), refreshAutomation()]);
  };

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tableau de Bord Approvisionnement</h2>
          <p className="text-muted-foreground">Vue d'ensemble des performances et automatisations</p>
        </div>
        <Button onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Performance Globale</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{overallScore}%</p>
                  {getTrendIcon(deliveryTrend)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Fournisseurs Actifs</p>
                <p className="text-2xl font-bold">{supplyKPIs.nombre_fournisseurs_actifs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Délai Moyen</p>
                <p className="text-2xl font-bold">
                  {deliveryAnalytics.length > 0 ? deliveryAnalytics[deliveryAnalytics.length - 1]?.delai_moyen || 0 : 0}j
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Coût Moyen Commande</p>
                <p className="text-2xl font-bold">{(supplyKPIs.cout_moyen_commande / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="automation">Automatisation</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Alertes et notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Alertes Stock ({stockAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stockAlerts.slice(0, 5).map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 ${getUrgencyColor(alert.niveau_urgence).split(' ')[0]}`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alert.message}</p>
                        <Badge className={`${getUrgencyColor(alert.niveau_urgence)} text-xs mt-1`}>
                          {alert.niveau_urgence}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {stockAlerts.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p>Aucune alerte de stock</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Besoins d'Approvisionnement ({supplyNeeds.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supplyNeeds.slice(0, 5).map((need, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{need.nom_produit}</p>
                        <p className="text-xs text-muted-foreground">
                          Stock: {need.quantite_actuelle} / Min: {need.quantite_minimale}
                        </p>
                      </div>
                      <Badge className={getUrgencyColor(need.urgence)}>
                        {need.quantite_recommandee} unités
                      </Badge>
                    </div>
                  ))}
                  {supplyNeeds.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p>Tous les stocks sont suffisants</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance vs Objectifs */}
          <Card>
            <CardHeader>
              <CardTitle>Performance vs Objectifs</CardTitle>
              <CardDescription>Comparaison avec les objectifs fixés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Délais de Livraison</span>
                    <span className="text-sm text-muted-foreground">{supplyKPIs.performance_vs_objectifs.delais}%</span>
                  </div>
                  <Progress value={supplyKPIs.performance_vs_objectifs.delais} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Objectif: {supplyKPIs.objectifs.delai_livraison_cible} jours
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Qualité/Conformité</span>
                    <span className="text-sm text-muted-foreground">{supplyKPIs.performance_vs_objectifs.qualite}%</span>
                  </div>
                  <Progress value={supplyKPIs.performance_vs_objectifs.qualite} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Objectif: {supplyKPIs.objectifs.taux_conformite_cible}%
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Contrôle des Coûts</span>
                    <span className="text-sm text-muted-foreground">{supplyKPIs.performance_vs_objectifs.cout}%</span>
                  </div>
                  <Progress 
                    value={Math.min(100, supplyKPIs.performance_vs_objectifs.cout)} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Budget: {(supplyKPIs.objectifs.cout_cible / 1000000).toFixed(1)}M F CFA/mois
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Fournisseurs</CardTitle>
                <CardDescription>Meilleurs performances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topSuppliers.map((supplier, index) => (
                    <div key={supplier.fournisseur_id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{supplier.nom_fournisseur}</p>
                        <p className="text-sm text-muted-foreground">
                          Note: {supplier.note_moyenne}/5 • {supplier.delai_moyen_livraison}j délai
                        </p>
                      </div>
                      <Badge variant="secondary">{supplier.taux_conformite}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fournisseurs à Surveiller</CardTitle>
                <CardDescription>Performances dégradées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {problematicSuppliers.map((supplier) => (
                    <div key={supplier.fournisseur_id} className="flex items-center gap-3 p-3 border border-orange-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <div className="flex-1">
                        <p className="font-medium">{supplier.nom_fournisseur}</p>
                        <p className="text-sm text-muted-foreground">{supplier.recommandation}</p>
                      </div>
                      <Badge variant="destructive">{supplier.note_moyenne}/5</Badge>
                    </div>
                  ))}
                  {problematicSuppliers.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p>Tous les fournisseurs performent bien</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Livraisons en Retard</CardTitle>
                <CardDescription>{lateDeliveries.length} commande(s) en retard</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lateDeliveries.map((late, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-red-200 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Commande #{late.orderId.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">{late.supplierName}</p>
                      </div>
                      <Badge variant="destructive">
                        {late.daysLate} jour{late.daysLate > 1 ? 's' : ''} de retard
                      </Badge>
                    </div>
                  ))}
                  {lateDeliveries.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p>Toutes les livraisons sont à jour</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automatisations Actives</CardTitle>
                <CardDescription>Processus automatisés en cours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Alertes de Stock</p>
                      <p className="text-sm text-muted-foreground">Surveillance continue des niveaux</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Calcul des Besoins</p>
                      <p className="text-sm text-muted-foreground">Recommandations automatiques</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Suivi des Retards</p>
                      <p className="text-sm text-muted-foreground">Vérification quotidienne</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Validation Réceptions</p>
                      <p className="text-sm text-muted-foreground">Contrôle qualité automatique</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Délais</CardTitle>
                <CardDescription>Tendance des délais de livraison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deliveryAnalytics.slice(-6).map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{data.periode}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{data.delai_moyen}j</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (data.delai_moyen / 20) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{data.taux_respect_delais}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Qualité par Fournisseur</CardTitle>
                <CardDescription>Taux de refus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qualityMetrics.taux_refus_par_fournisseur.slice(0, 5).map((supplier, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{supplier.nom_fournisseur}</span>
                        <span className="text-sm text-muted-foreground">{supplier.taux_refus}%</span>
                      </div>
                      <Progress value={supplier.taux_refus} className="h-2" />
                      {supplier.principales_causes.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Causes: {supplier.principales_causes.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupplyDashboard;