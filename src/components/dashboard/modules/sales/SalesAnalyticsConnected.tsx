import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
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
  CalendarIcon,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSalesAnalytics, type AnalyticsPeriod, type AnalyticsFilters } from '@/hooks/useSalesAnalytics';
import AnalyticsKPICards from './analytics/AnalyticsKPICards';
import AnalyticsFiltersPanel from './analytics/AnalyticsFiltersPanel';
import InsightsPanel from './analytics/InsightsPanel';
import { exportSalesReportToPDF } from '@/utils/salesReportExport';
import { exportSalesReportToExcel } from '@/utils/salesReportExcelExport';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const SalesAnalyticsConnected = () => {
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('month');
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date }>();

  const {
    kpis,
    kpisLoading,
    revenueEvolution,
    topProducts,
    paymentMethods,
    staffPerformance,
    categoryBreakdown,
    isLoading,
  } = useSalesAnalytics(selectedPeriod, customDateRange, filters);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ 
        queryKey: ['sales-analytics']
      });
      toast({
        title: 'Données actualisées',
        description: 'Les analytics ont été mis à jour avec succès.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'actualiser les données.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!kpis || !currentTenant) {
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
          nom_entreprise: currentTenant.name || 'Pharmacie',
          logo_url: currentTenant.logo,
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
        description: 'Impossible de générer le rapport PDF.',
        variant: 'destructive',
      });
    }
  };

  const handleExportExcel = async () => {
    if (!kpis || !topProducts || !staffPerformance || !categoryBreakdown || !paymentMethods) {
      toast({
        title: 'Erreur',
        description: 'Données insuffisantes pour l\'export Excel.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const reportData = {
        kpis,
        topProducts,
        staffPerformance,
        categoryData: categoryBreakdown,
        paymentMethods,
      };

      await exportSalesReportToExcel(
        reportData,
        selectedPeriod,
        'all',
        {
          companyName: currentTenant?.name || 'Pharmacie',
          logoUrl: currentTenant?.logo,
        }
      );

      toast({
        title: 'Export réussi',
        description: 'Le rapport Excel a été généré avec succès.',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le rapport Excel.',
        variant: 'destructive',
      });
    }
  };

  // Get weekly data for performance chart (last 7 days)
  const weeklyPerformance = React.useMemo(() => {
    if (!revenueEvolution || revenueEvolution.length === 0) return [];
    return revenueEvolution.slice(-7);
  }, [revenueEvolution]);

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics & Statistiques</h2>
          <p className="text-muted-foreground">
            Analyse détaillée des performances de vente
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Select 
            value={selectedPeriod} 
            onValueChange={(value) => {
              setSelectedPeriod(value as AnalyticsPeriod);
              if (value !== 'custom') {
                setCustomDateRange(undefined);
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sélectionner la période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
              <SelectItem value="custom">Période personnalisée</SelectItem>
            </SelectContent>
          </Select>

          {selectedPeriod === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !customDateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange?.start ? (
                    customDateRange.end ? (
                      <>
                        {format(customDateRange.start, "dd MMM yyyy", { locale: fr })} -{" "}
                        {format(customDateRange.end, "dd MMM yyyy", { locale: fr })}
                      </>
                    ) : (
                      format(customDateRange.start, "dd MMM yyyy", { locale: fr })
                    )
                  ) : (
                    <span>Choisir une période</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={customDateRange ? {
                    from: customDateRange.start,
                    to: customDateRange.end,
                  } : undefined}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setCustomDateRange({ start: range.from, end: range.to });
                    }
                  }}
                  numberOfMonths={2}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh} 
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button onClick={handleExportPDF} disabled={isLoading} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>

          <Button onClick={handleExportExcel} disabled={isLoading} variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filtres avancés */}
      <AnalyticsFiltersPanel filters={filters} onFiltersChange={setFilters} />

      {/* Métriques principales */}
      <AnalyticsKPICards kpis={kpis} isLoading={kpisLoading} />

      {/* Graphiques et analyses */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
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
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} className="text-xs" />
                      <Tooltip 
                        formatter={(value: number) => [formatPrice(value), 'CA']}
                        labelFormatter={(label) => `Date: ${label}`}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
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
                <CardTitle>Performance Hebdomadaire</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} className="text-xs" />
                      <Tooltip 
                        formatter={(value: number) => [formatPrice(value), 'CA']}
                        labelFormatter={(label) => `Date: ${label}`}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="ventes" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

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
                      label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                      outerRadius={100}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {(categoryBreakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatPrice(value), 'CA']}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Volume de Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueEvolution || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Transactions']}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="transactions" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
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
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {(topProducts || []).map((product, index) => (
                    <div key={product.produit_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4 flex-1">
                        <Badge variant="outline" className="w-8 h-8 flex items-center justify-center shrink-0">
                          {index + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.libelle}</p>
                          <p className="text-sm text-muted-foreground">{product.categorie || 'Non catégorisé'}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1 ml-4">
                        <p className="font-bold">{formatPrice(product.ca)}</p>
                        <p className="text-sm text-muted-foreground">{product.quantite} unités</p>
                        <p className="text-xs text-muted-foreground">
                          Marge: {formatPrice(product.marge)} • {product.pourcentage_ca.toFixed(1)}% du CA
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!topProducts || topProducts.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune donnée de produit disponible pour cette période
                    </p>
                  )}
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
                        label={(entry) => `${entry.name}: ${entry.pourcentage.toFixed(1)}%`}
                        outerRadius={100}
                        fill="hsl(var(--primary))"
                        dataKey="montant"
                      >
                        {(paymentMethods || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatPrice(value), 'Montant']}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
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
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(paymentMethods || []).map((method, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-4 h-4 rounded-full shrink-0"
                            style={{ backgroundColor: method.color }}
                          />
                          <div>
                            <p className="font-medium">{method.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {method.transactions} transactions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatPrice(method.montant)}</p>
                          <p className="text-sm text-muted-foreground">
                            {method.pourcentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!paymentMethods || paymentMethods.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">
                        Aucune donnée de paiement disponible
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance du Personnel</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={staffPerformance || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} className="text-xs" />
                    <YAxis dataKey="nom" type="category" width={150} className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => [formatPrice(value), 'CA']}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="ca" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
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
