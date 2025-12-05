import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Package, Users, DollarSign, Eye, Download, 
  TrendingUp, BarChart3, ShoppingCart, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import type { AdminKPI, TopProduct, StockAlert, CategoryDistribution } from '@/hooks/useAdminAnalytics';

interface ReportType {
  id: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  color: string;
}

interface AnalyticsReportsProps {
  kpis?: AdminKPI;
  topProducts: TopProduct[];
  stockAlerts: StockAlert[];
  categoryDistribution: CategoryDistribution[];
  period: string;
  tenantName: string;
  onExportPDF: (reportType: string) => void;
  onExportExcel: (reportType: string) => void;
  isExporting: boolean;
}

const REPORTS: ReportType[] = [
  { 
    id: 'sales', 
    name: 'Rapport Mensuel Ventes', 
    desc: 'Analyse complète des ventes du mois',
    icon: FileText,
    color: 'bg-blue-500'
  },
  { 
    id: 'inventory', 
    name: 'Bilan Inventaire', 
    desc: 'État détaillé des stocks et mouvements',
    icon: Package,
    color: 'bg-green-500'
  },
  { 
    id: 'clients', 
    name: 'Analyse Clientèle', 
    desc: 'Segmentation et comportement clients',
    icon: Users,
    color: 'bg-purple-500'
  },
  { 
    id: 'financial', 
    name: 'Performance Financière', 
    desc: 'Indicateurs financiers et rentabilité',
    icon: DollarSign,
    color: 'bg-orange-500'
  },
];

const AnalyticsReports: React.FC<AnalyticsReportsProps> = ({
  kpis,
  topProducts,
  stockAlerts,
  categoryDistribution,
  period,
  tenantName,
  onExportPDF,
  onExportExcel,
  isExporting,
}) => {
  const { formatAmount } = useCurrencyFormatting();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleViewReport = (reportId: string) => {
    setSelectedReport(reportId);
    setViewDialogOpen(true);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois';
      case 'quarter': return 'Ce trimestre';
      case 'year': return 'Cette année';
      default: return period;
    }
  };

  const renderReportContent = () => {
    if (!selectedReport) return null;

    switch (selectedReport) {
      case 'sales':
        return (
          <div className="space-y-6">
            {/* KPIs de vente */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                Indicateurs de Performance
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Chiffre d'Affaires</p>
                  <p className="text-2xl font-bold">{formatAmount(kpis?.chiffreAffaires || 0)}</p>
                  <Badge variant={kpis?.chiffreAffairesVariation && kpis.chiffreAffairesVariation >= 0 ? 'default' : 'destructive'}>
                    {kpis?.chiffreAffairesVariation?.toFixed(1) || 0}%
                  </Badge>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Nombre de Ventes</p>
                  <p className="text-2xl font-bold">{kpis?.nombreVentes || 0}</p>
                  <Badge variant={kpis?.nombreVentesVariation && kpis.nombreVentesVariation >= 0 ? 'default' : 'destructive'}>
                    {kpis?.nombreVentesVariation?.toFixed(1) || 0}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Top Produits */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Top 5 Produits
              </h4>
              <div className="space-y-2">
                {topProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="font-medium">{index + 1}. {product.name}</span>
                    <span>{formatAmount(product.revenue)}</span>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Aucun produit vendu</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-6">
            {/* Stats stock */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <Package className="mr-2 h-4 w-4" />
                État des Stocks
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Produits en Stock</p>
                  <p className="text-2xl font-bold">{kpis?.produitsEnStock || 0}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Alertes Actives</p>
                  <p className="text-2xl font-bold text-destructive">{stockAlerts.length}</p>
                </div>
              </div>
            </div>

            {/* Alertes */}
            <div>
              <h4 className="font-semibold mb-3">Produits en Alerte</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stockAlerts.slice(0, 8).map((alert, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span>{alert.name}</span>
                    <Badge variant={alert.status === 'critique' ? 'destructive' : 'default'}>
                      {alert.level} unités
                    </Badge>
                  </div>
                ))}
                {stockAlerts.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Aucune alerte active</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'clients':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Statistiques Clients
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Clients Actifs</p>
                  <p className="text-2xl font-bold">{kpis?.clientsActifs || 0}</p>
                  <Badge variant={kpis?.clientsActifsVariation && kpis.clientsActifsVariation >= 0 ? 'default' : 'destructive'}>
                    {kpis?.clientsActifsVariation?.toFixed(1) || 0}%
                  </Badge>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Panier Moyen</p>
                  <p className="text-2xl font-bold">
                    {kpis && kpis.nombreVentes > 0 
                      ? formatAmount(kpis.chiffreAffaires / kpis.nombreVentes)
                      : formatAmount(0)
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Répartition */}
            <div>
              <h4 className="font-semibold mb-3">Répartition des Achats par Catégorie</h4>
              <div className="space-y-2">
                {categoryDistribution.map((cat, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </div>
                    <span>{cat.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" />
                Performance Financière
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Chiffre d'Affaires</p>
                  <p className="text-2xl font-bold">{formatAmount(kpis?.chiffreAffaires || 0)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Marge Estimée (40%)</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatAmount((kpis?.chiffreAffaires || 0) * 0.4)}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold">{kpis?.nombreVentes || 0}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">CA par Transaction</p>
                  <p className="text-2xl font-bold">
                    {kpis && kpis.nombreVentes > 0 
                      ? formatAmount(kpis.chiffreAffaires / kpis.nombreVentes)
                      : formatAmount(0)
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {REPORTS.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className={`p-2 rounded-lg ${report.color} text-white mr-3`}>
                  <report.icon className="h-5 w-5" />
                </div>
                {report.name}
              </CardTitle>
              <CardDescription>{report.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-1 h-4 w-4" />
                  Dernière mise à jour: {format(new Date(), 'dd/MM/yyyy', { locale: fr })}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewReport(report.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => onExportPDF(report.id)}
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de visualisation */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedReport && (
                <>
                  {React.createElement(
                    REPORTS.find(r => r.id === selectedReport)?.icon || FileText,
                    { className: 'h-5 w-5' }
                  )}
                  {REPORTS.find(r => r.id === selectedReport)?.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {tenantName} - {getPeriodLabel()}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {renderReportContent()}
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => selectedReport && onExportExcel(selectedReport)}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter Excel
            </Button>
            <Button 
              onClick={() => selectedReport && onExportPDF(selectedReport)}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AnalyticsReports;
