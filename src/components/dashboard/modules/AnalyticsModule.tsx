import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart,
  Download, Calendar, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// Import des composants analytics
import AnalyticsOverview from './analytics/AnalyticsOverview';
import AnalyticsSales from './analytics/AnalyticsSales';
import AnalyticsInventory from './analytics/AnalyticsInventory';
import AnalyticsReports from './analytics/AnalyticsReports';

// Import du hook et des utilitaires d'export
import { useAdminAnalytics, type AdminAnalyticsPeriod } from '@/hooks/useAdminAnalytics';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { 
  exportSalesReportPDF, 
  exportInventoryReportPDF, 
  exportClientsReportPDF,
  exportFinancialReportPDF,
  exportAnalyticsToExcel 
} from '@/utils/adminAnalyticsExport';

const AnalyticsModule = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<AdminAnalyticsPeriod>('month');
  const [selectedView, setSelectedView] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);

  // Hook analytics connecté à la base de données
  const {
    kpis,
    kpisLoading,
    salesEvolution,
    salesEvolutionLoading,
    categoryDistribution,
    categoryDistributionLoading,
    keyIndicators,
    keyIndicatorsLoading,
    topProducts,
    topProductsLoading,
    profitTrend,
    profitTrendLoading,
    stockLevels,
    stockLevelsLoading,
    stockAlerts,
    stockAlertsLoading,
    isLoading,
    tenantName,
    refetchAll,
  } = useAdminAnalytics(selectedPeriod);

  const { formatAmount } = useCurrencyFormatting();

  // Configuration des KPI cards
  const kpiCards = [
    {
      title: "Chiffre d'Affaires",
      value: kpis?.chiffreAffaires || 0,
      change: kpis?.chiffreAffairesVariation || 0,
      trend: (kpis?.chiffreAffairesVariation || 0) >= 0 ? 'up' : 'down',
      icon: DollarSign,
      description: 'vs période précédente',
      format: 'currency',
    },
    {
      title: 'Nombre de Ventes',
      value: kpis?.nombreVentes || 0,
      change: kpis?.nombreVentesVariation || 0,
      trend: (kpis?.nombreVentesVariation || 0) >= 0 ? 'up' : 'down',
      icon: ShoppingCart,
      description: 'transactions sur la période',
      format: 'number',
    },
    {
      title: 'Produits en Stock',
      value: kpis?.produitsEnStock || 0,
      change: kpis?.produitsEnStockVariation || 0,
      trend: (kpis?.produitsEnStockVariation || 0) >= 0 ? 'up' : 'down',
      icon: Package,
      description: 'références disponibles',
      format: 'number',
    },
    {
      title: 'Clients Actifs',
      value: kpis?.clientsActifs || 0,
      change: kpis?.clientsActifsVariation || 0,
      trend: (kpis?.clientsActifsVariation || 0) >= 0 ? 'up' : 'down',
      icon: Users,
      description: 'clients sur la période',
      format: 'number',
    },
  ];

  // Fonction d'export PDF
  const handleExportPDF = async (reportType: string) => {
    setIsExporting(true);
    try {
      const exportData = {
        kpis,
        topProducts,
        stockAlerts,
        categoryDistribution,
        stockLevels,
        period: selectedPeriod,
        tenantName,
      };

      switch (reportType) {
        case 'sales':
          await exportSalesReportPDF(exportData);
          break;
        case 'inventory':
          await exportInventoryReportPDF(exportData);
          break;
        case 'clients':
          await exportClientsReportPDF(exportData);
          break;
        case 'financial':
          await exportFinancialReportPDF(exportData);
          break;
        default:
          await exportSalesReportPDF(exportData);
      }
      toast.success('Rapport PDF généré avec succès');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction d'export Excel
  const handleExportExcel = async (reportType: string) => {
    setIsExporting(true);
    try {
      const exportData = {
        kpis,
        topProducts,
        stockAlerts,
        categoryDistribution,
        stockLevels,
        period: selectedPeriod,
        tenantName,
      };

      await exportAnalyticsToExcel(exportData, reportType);
      toast.success('Rapport Excel généré avec succès');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      toast.error('Erreur lors de la génération du fichier Excel');
    } finally {
      setIsExporting(false);
    }
  };

  // Export global
  const handleGlobalExport = async () => {
    setIsExporting(true);
    try {
      const exportData = {
        kpis,
        topProducts,
        stockAlerts,
        categoryDistribution,
        stockLevels,
        period: selectedPeriod,
        tenantName,
      };
      await exportAnalyticsToExcel(exportData, 'global');
      toast.success('Export Excel complet généré');
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  const formatKPIValue = (value: number, format: string) => {
    if (format === 'currency') {
      return formatAmount(value);
    }
    return value.toLocaleString('fr-FR');
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois';
      case 'quarter': return 'Ce trimestre';
      case 'year': return 'Cette année';
      default: return period;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analyses et Reporting</h2>
          <p className="text-muted-foreground">
            Tableaux de bord et analyses détaillées de votre activité - {tenantName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select 
            value={selectedPeriod} 
            onValueChange={(value) => setSelectedPeriod(value as AdminAnalyticsPeriod)}
          >
            <SelectTrigger className="w-[150px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetchAll()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="outline"
            onClick={handleGlobalExport}
            disabled={isExporting || isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatKPIValue(kpi.value, kpi.format)}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Badge 
                      variant={kpi.trend === 'up' ? 'default' : 'destructive'}
                      className="mr-1"
                    >
                      {kpi.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {kpi.change >= 0 ? '+' : ''}{kpi.change.toFixed(1)}%
                    </Badge>
                    {kpi.description}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="inventory">Inventaire</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <AnalyticsOverview
            salesEvolution={salesEvolution}
            salesEvolutionLoading={salesEvolutionLoading}
            categoryDistribution={categoryDistribution}
            categoryDistributionLoading={categoryDistributionLoading}
            keyIndicators={keyIndicators}
            keyIndicatorsLoading={keyIndicatorsLoading}
          />
        </TabsContent>

        {/* Analyses des ventes */}
        <TabsContent value="sales" className="space-y-4">
          <AnalyticsSales
            topProducts={topProducts}
            topProductsLoading={topProductsLoading}
            profitTrend={profitTrend}
            profitTrendLoading={profitTrendLoading}
          />
        </TabsContent>

        {/* Analyse inventaire */}
        <TabsContent value="inventory" className="space-y-4">
          <AnalyticsInventory
            stockLevels={stockLevels}
            stockLevelsLoading={stockLevelsLoading}
            stockAlerts={stockAlerts}
            stockAlertsLoading={stockAlertsLoading}
          />
        </TabsContent>

        {/* Rapports */}
        <TabsContent value="reports" className="space-y-4">
          <AnalyticsReports
            kpis={kpis}
            topProducts={topProducts}
            stockAlerts={stockAlerts}
            categoryDistribution={categoryDistribution}
            period={selectedPeriod}
            tenantName={tenantName}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            isExporting={isExporting}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsModule;
