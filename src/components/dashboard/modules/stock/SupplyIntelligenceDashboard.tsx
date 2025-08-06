import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, AlertTriangle, Clock, Package, TrendingDown, Download, RefreshCw } from "lucide-react";
import { SupplyIntelligenceService, type SupplyNotification, type SupplyRecommendation } from "@/services/supplyIntelligenceService";
import { SupplyReportsService, type SupplyReport } from "@/services/supplyReportsService";
import { useToast } from "@/hooks/use-toast";

export const SupplyIntelligenceDashboard = () => {
  const [notifications, setNotifications] = useState<SupplyNotification[]>([]);
  const [recommendations, setRecommendations] = useState<SupplyRecommendation[]>([]);
  const [reports, setReports] = useState<SupplyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadIntelligenceData();
  }, []);

  const loadIntelligenceData = async () => {
    setLoading(true);
    try {
      const [notifs, recs] = await Promise.all([
        SupplyIntelligenceService.generateAutomaticNotifications(),
        SupplyIntelligenceService.generateSupplyRecommendations()
      ]);
      
      setNotifications(notifs);
      setRecommendations(recs);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des données d'intelligence",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type: 'stock_analysis' | 'supplier_performance' | 'cost_analysis') => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      let report: SupplyReport;
      
      switch (type) {
        case 'stock_analysis':
          report = await SupplyReportsService.generateStockAnalysisReport(startDate, endDate);
          break;
        case 'supplier_performance':
          report = await SupplyReportsService.generateSupplierPerformanceReport(startDate, endDate);
          break;
        case 'cost_analysis':
          report = await SupplyReportsService.generateCostAnalysisReport(startDate, endDate);
          break;
      }
      
      setReports(prev => [report, ...prev]);
      toast({
        title: "Succès",
        description: "Rapport généré avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du rapport",
        variant: "destructive",
      });
    }
  };

  const exportReport = (report: SupplyReport, format: 'csv' | 'excel') => {
    try {
      if (format === 'csv') {
        const csv = SupplyReportsService.exportToCSV(report);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.title.replace(/\s+/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = SupplyReportsService.exportToExcel(report);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.title.replace(/\s+/g, '_')}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      toast({
        title: "Succès",
        description: `Rapport exporté en ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'export",
        variant: "destructive",
      });
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Bell className="h-4 w-4 text-yellow-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getUrgencyColor = (urgence: string) => {
    switch (urgence) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Intelligence d'approvisionnement</h2>
          <p className="text-muted-foreground">Analyses automatiques et recommandations</p>
        </div>
        <Button onClick={loadIntelligenceData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">
            Notifications ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            Recommandations ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="reports">
            Rapports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Aucune notification</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card key={notification.id}>
                  <CardContent className="flex items-start gap-3 p-4">
                    {getPriorityIcon(notification.priority)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{notification.title}</h4>
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        <Badge variant="outline">
                          {notification.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <TrendingDown className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Aucune recommandation</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <Card key={rec.produit_id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{rec.nom_produit}</h4>
                      <Badge className={getUrgencyColor(rec.urgence)}>
                        {rec.urgence}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Stock actuel</p>
                        <p className="font-medium">{rec.stock_actuel} unités</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Stock limite</p>
                        <p className="font-medium">{rec.stock_minimum} unités</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quantité suggérée</p>
                        <p className="font-medium text-green-600">{rec.quantite_suggere} unités</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Raison</p>
                        <p className="font-medium">{rec.raison}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => generateReport('stock_analysis')}>
              <CardHeader className="text-center">
                <Package className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <CardTitle className="text-lg">Analyse des stocks</CardTitle>
                <CardDescription>Niveaux, mouvements et valorisation</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => generateReport('supplier_performance')}>
              <CardHeader className="text-center">
                <Clock className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <CardTitle className="text-lg">Performance fournisseurs</CardTitle>
                <CardDescription>Délais, conformité et qualité</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => generateReport('cost_analysis')}>
              <CardHeader className="text-center">
                <TrendingDown className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <CardTitle className="text-lg">Analyse des coûts</CardTitle>
                <CardDescription>Évolution et répartition des coûts</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {reports.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Rapports générés</h3>
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <h4 className="font-medium">{report.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.generated_at).toLocaleString('fr-FR')} • 
                        Période: {report.period.start} au {report.period.end}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => exportReport(report, 'csv')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        CSV
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => exportReport(report, 'excel')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Excel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};