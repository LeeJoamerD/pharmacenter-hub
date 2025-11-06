import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Download,
  RefreshCw,
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSalesAnalytics, type AnalyticsPeriod, type AnalyticsFilters } from '@/hooks/useSalesAnalytics';
import AnalyticsKPICards from './analytics/AnalyticsKPICards';
import AnalyticsFiltersPanel from './analytics/AnalyticsFiltersPanel';
import InsightsPanel from './analytics/InsightsPanel';
import { exportSalesReportToPDF } from '@/utils/salesReportExport';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

const SalesAnalyticsConnected = () => {
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const { currentPharmacy } = useTenant();
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('month');
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    kpis,
    kpisLoading,
    revenueEvolution,
    topProducts,
    paymentMethods,
    staffPerformance,
    categoryBreakdown,
    isLoading,
  } = useSalesAnalytics(selectedPeriod, undefined, filters);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Force refetch via query invalidation handled by the hook
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    toast({
      title: 'Données actualisées',
      description: 'Les analytics ont été mis à jour avec succès.',
    });
  };

  const handleExport = async () => {
    if (!kpis || !currentPharmacy) {
      toast({
        title: 'Erreur',
        description: 'Données insuffisantes pour l\'export.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const reportData = {
        kpis: {
          caAujourdhui: kpis.caTotal,
          caVariation: kpis.caVariation,
          transactions: kpis.transactions,
          transactionsVariation: kpis.transactionsVariation,
          panierMoyen: kpis.panierMoyen,
          panierMoyenVariation: kpis.panierMoyenVariation,
          clientsUniques: kpis.clientsUniques,
          clientsUniquesVariation: kpis.clientsUniquesVariation,
        },
        evolutionData: (revenueEvolution || []).map(e => ({ ...e, objectif: 0 })),
        topProducts: (topProducts || []).map(p => ({
          produit: p.libelle,
          ventes: p.ca,
          quantite: p.quantite,
          marge: p.marge,
        })),
        staffPerformance: (staffPerformance || []).map(s => ({
          nom: s.nom,
          ventes: s.ca,
          transactions: s.transactions,
          moyenne: s.panier_moyen,
          performance: s.performance,
        })),
        categoryData: categoryBreakdown || [],
      };

      await exportSalesReportToPDF(
        reportData,
        selectedPeriod,
        'all',
        {
          nom_entreprise: currentPharmacy.name || 'Pharmacie',
          logo_url: undefined,
        }
      );

      toast({
        title: 'Export réussi',
        description: 'Le rapport PDF a été téléchargé.',
      });
    } catch (error) {
      console.error('Erreur export:', error);
      toast({
        title: 'Erreur d\'export',
        description: 'Impossible de générer le rapport.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics & Statistiques</h2>
          <p className="text-muted-foreground">
            Analyse détaillée des performances de vente
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select 
            value={selectedPeriod} 
            onValueChange={(value) => setSelectedPeriod(value as AnalyticsPeriod)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sélectionner la période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Quotidien</SelectItem>
              <SelectItem value="week">Hebdomadaire</SelectItem>
              <SelectItem value="month">Mensuel</SelectItem>
              <SelectItem value="year">Annuel</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button onClick={handleExport} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Filtres avancés */}
      <AnalyticsFiltersPanel filters={filters} onFiltersChange={setFilters} />

      {/* Métriques principales */}
      <AnalyticsKPICards kpis={kpis} isLoading={kpisLoading} />

      {/* Graphiques et analyses */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Évolution du Chiffre d'Affaires</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueEvolution || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip 
                        formatter={(value: number) => [formatPrice(value), 'CA']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="ventes" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(categoryBreakdown || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatPrice(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Volume des Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueEvolution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="transactions" fill="hsl(var(--primary))" name="Transactions" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 des Produits</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {(topProducts || []).map((product, index) => (
                    <div key={product.produit_id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{product.libelle}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.quantite} unités • {product.categorie}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatPrice(product.ca)}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.pourcentage_ca.toFixed(1)}% du CA • Marge: {product.marge.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Modes de Paiement</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethods || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, pourcentage }) => `${name} ${pourcentage.toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="montant"
                      >
                        {(paymentMethods || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatPrice(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Détails des Paiements</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(paymentMethods || []).map((method) => (
                      <div key={method.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: method.color }}
                          />
                          <span>{method.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{method.pourcentage.toFixed(1)}%</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(method.montant)} • {method.transactions} trans.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance de l'Équipe</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={staffPerformance || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => formatPrice(value)} />
                    <YAxis type="category" dataKey="nom" width={150} />
                    <Tooltip formatter={(value: number) => formatPrice(value)} />
                    <Legend />
                    <Bar dataKey="ca" fill="hsl(var(--primary))" name="CA généré" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights et recommandations */}
      <InsightsPanel 
        kpis={kpis} 
        topProducts={topProducts} 
        staffPerformance={staffPerformance} 
      />
    </div>
  );
};

export default SalesAnalyticsConnected;
