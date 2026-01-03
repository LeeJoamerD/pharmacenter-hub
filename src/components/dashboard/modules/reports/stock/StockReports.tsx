import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Package, 
  AlertTriangle, 
  TrendingDown,
  TrendingUp, 
  Calendar, 
  Truck,
  BarChart3,
  Clock,
  DollarSign,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useStockReports } from '@/hooks/useStockReports';
import { exportStockReportToPDF } from '@/utils/stockReportExport';
import { usePharmaciesQuery } from '@/hooks/useTenantQuery';
import { useToast } from '@/hooks/use-toast';
import type { StockReportPeriod, StockReportCategory } from '@/types/stockReports';

const StockReports = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<StockReportPeriod>('month');
  const [selectedCategory, setSelectedCategory] = useState<StockReportCategory>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: pharmacyInfo } = usePharmaciesQuery();
  const { 
    kpis, 
    stockLevels, 
    criticalStock, 
    expiryAlerts, 
    movementHistory, 
    isLoading, 
    error, 
    refetch 
  } = useStockReports(selectedPeriod, selectedCategory);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Données actualisées",
        description: "Les analyses de stock ont été mises à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur d'actualisation",
        description: "Impossible de rafraîchir les données",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async (format: string) => {
    if (format === 'PDF') {
      try {
        await exportStockReportToPDF(
          { kpis, stockLevels, criticalStock, expiryAlerts, movementHistory, isLoading, error, refetch },
          selectedPeriod,
          selectedCategory,
          pharmacyInfo || { name: 'Pharmacie' }
        );
        toast({
          title: "Export réussi",
          description: "Le rapport PDF a été téléchargé",
        });
      } catch (error) {
        toast({
          title: "Erreur d'export",
          description: "Impossible de générer le rapport PDF",
          variant: "destructive"
        });
      }
    }
  };

  const getStockStatus = (actuel: number, critique: number, faible: number, limite: number) => {
    if (actuel === 0 || actuel <= critique) return { status: 'critique', color: 'text-red-600', bg: 'bg-red-50' };
    if (actuel <= faible) return { status: 'attention', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (actuel > limite) return { status: 'surstock', color: 'text-blue-600', bg: 'bg-blue-50' };
    return { status: 'normal', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const getUrgencyColor = (urgence: string) => {
    switch (urgence) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'attention': return 'text-orange-600 bg-orange-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analyses de Stock</h2>
          <p className="text-muted-foreground">
            Suivi des niveaux de stock, alertes et mouvements
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as StockReportCategory)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="medicines">Médicaments</SelectItem>
              <SelectItem value="parapharmacy">Parapharmacie</SelectItem>
              <SelectItem value="medical">Matériel médical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as StockReportPeriod)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button onClick={() => handleExport('PDF')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPIs de stock */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Stock Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(kpis.valeurStockTotal / 1000000).toFixed(1)}M{' '}
                  <span className="text-sm font-normal text-muted-foreground">FCFA</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {kpis.valeurStockVariation >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 inline mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 inline mr-1" />
                  )}
                  {kpis.valeurStockVariation >= 0 ? '+' : ''}{kpis.valeurStockVariation.toFixed(1)}% vs période précédente
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits en Stock</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold">{kpis.produitsEnStock.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Dans {kpis.referencesActives} références actives
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold">{kpis.alertesCritiques}</div>
                <p className="text-xs text-muted-foreground">
                  {kpis.ruptures} ruptures + {kpis.peremptions} péremptions
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Rotation</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold">{kpis.tauxRotation.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  Rotations par an (moyenne)
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="levels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="levels">Niveaux Stock</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="expiry">Péremptions</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
        </TabsList>

        <TabsContent value="levels" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Niveaux de Stock par Catégorie
              </CardTitle>
              <CardDescription>
                Situation actuelle vs seuils minimum et maximum
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : stockLevels.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune donnée de stock disponible
                </p>
              ) : (
                <div className="space-y-6">
                  {stockLevels.map((item, index) => {
                    const status = getStockStatus(item.stock_actuel, item.stock_critique, item.stock_faible, item.stock_limite);
                    
                    return (
                      <div key={index} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.categorie}</p>
                            <p className="text-sm text-muted-foreground">
                              Valorisation: {item.valorisation.toLocaleString()} FCFA
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{item.stock_actuel} unités</p>
                            <Badge className={`${status.color} ${status.bg} border-0`}>
                              {status.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Critique: {item.stock_critique}</span>
                            <span>Faible: {item.stock_faible}</span>
                            <span>Limite: {item.stock_limite}</span>
                          </div>
                          <Progress value={item.pourcentage} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertes Stock Critique
              </CardTitle>
              <CardDescription>
                Produits nécessitant un réapprovisionnement urgent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : criticalStock.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune alerte critique
                </p>
              ) : (
                <div className="space-y-4">
                  {criticalStock.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50">
                          {item.statut === 'critique' ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.produit}</p>
                          <p className="text-sm text-muted-foreground">
                            Stock: {item.stock_actuel} / Limite: {item.stock_limite}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={item.statut === 'critique' ? 'destructive' : 'secondary'}
                        >
                          {item.statut === 'critique' ? 'Critique' : 'Attention'}
                        </Badge>
                        {item.expiration && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Exp: {new Date(item.expiration).toLocaleDateString('fr-FR')}
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

        <TabsContent value="expiry" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Alertes de Péremption
              </CardTitle>
              <CardDescription>
                Produits arrivant à expiration dans les prochains jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : expiryAlerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune alerte de péremption
                </p>
              ) : (
                <div className="space-y-4">
                  {expiryAlerts.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getUrgencyColor(item.urgence)}`}>
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{item.produit}</p>
                          <p className="text-sm text-muted-foreground">
                            Lot: {item.lot} • {item.quantite} unités
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{item.jours_restants} jours</p>
                        <p className="text-sm text-muted-foreground">
                          Exp: {new Date(item.expiration).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Mouvements de Stock - 7 derniers jours
              </CardTitle>
              <CardDescription>
                Entrées, sorties et évolution de la valorisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={movementHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value} unités`, 
                        name === 'entrees' ? 'Entrées' : name === 'sorties' ? 'Sorties' : 'Solde'
                      ]}
                    />
                    <Bar dataKey="entrees" fill="#10b981" name="entrees" />
                    <Bar dataKey="sorties" fill="#ef4444" name="sorties" />
                    <Bar dataKey="solde" fill="#3b82f6" name="solde" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Évolution de la Valorisation</CardTitle>
              <CardDescription>Valeur totale du stock sur la période</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={movementHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toLocaleString()} FCFA`, 'Valorisation']}
                    />
                    <Area
                      type="monotone" 
                      dataKey="valorisation" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.2}
                    />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockReports;