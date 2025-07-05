import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  Package, 
  DollarSign, 
  Users, 
  Target, 
  FileText, 
  MapPin, 
  Smartphone, 
  Brain, 
  Settings,
  TrendingUp,
  Cog,
  RefreshCw,
  Calendar,
  Download,
  Star,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
// import { useSalesMetrics } from '@/hooks/useSalesMetrics';
// import { useStockMetrics } from '@/hooks/useStockMetrics';
import { useToast } from '@/hooks/use-toast';

const ReportsDashboard = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // const salesMetrics = useSalesMetrics();
  // const stockMetrics = useStockMetrics();

  const reportGroups = [
    { id: 'ventes', name: 'Ventes', icon: BarChart3, color: 'text-blue-600', bgColor: 'bg-blue-50', reports: 25 },
    { id: 'stock', name: 'Stock', icon: Package, color: 'text-green-600', bgColor: 'bg-green-50', reports: 18 },
    { id: 'financier', name: 'Financier', icon: DollarSign, color: 'text-yellow-600', bgColor: 'bg-yellow-50', reports: 15 },
    { id: 'clients', name: 'Clients', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-50', reports: 12 },
    { id: 'bi', name: 'Business Intelligence', icon: Target, color: 'text-indigo-600', bgColor: 'bg-indigo-50', reports: 20 },
    { id: 'reglementaire', name: 'Réglementaire', icon: FileText, color: 'text-red-600', bgColor: 'bg-red-50', reports: 8 },
    { id: 'geospatial', name: 'Géospatial', icon: MapPin, color: 'text-orange-600', bgColor: 'bg-orange-50', reports: 10 },
    { id: 'mobile', name: 'Mobile', icon: Smartphone, color: 'text-pink-600', bgColor: 'bg-pink-50', reports: 6 },
    { id: 'ia', name: 'IA/Prédictif', icon: Brain, color: 'text-cyan-600', bgColor: 'bg-cyan-50', reports: 14 },
    { id: 'generateur', name: 'Générateur', icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-50', reports: 5 },
    { id: 'comparatif', name: 'Comparatif', icon: TrendingUp, color: 'text-emerald-600', bgColor: 'bg-emerald-50', reports: 9 },
    { id: 'configuration', name: 'Configuration', icon: Cog, color: 'text-slate-600', bgColor: 'bg-slate-50', reports: 4 }
  ];

  const dashboardMetrics = [
    {
      title: 'CA Aujourd\'hui',
      value: '2 850 000',
      unit: 'FCFA',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Stock Critique',
      value: '23',
      unit: 'produits',
      change: '-5 produits',
      trend: 'down',
      icon: Package,
      color: 'text-orange-600'
    },
    {
      title: 'Clients Actifs',
      value: '1 547',
      unit: 'clients',
      change: '+8.2%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Taux Conformité',
      value: '98.5',
      unit: '%',
      change: 'Stable',
      trend: 'stable',
      icon: Target,
      color: 'text-green-600'
    }
  ];

  const recentReports = [
    { name: 'Rapport Ventes Journalier', date: 'Aujourd\'hui 08:30', status: 'completed', format: 'PDF' },
    { name: 'Analyse Stock Critique', date: 'Hier 18:45', status: 'completed', format: 'Excel' },
    { name: 'KPI Dashboard Mensuel', date: 'Hier 16:20', status: 'completed', format: 'PDF' },
    { name: 'Rapport Conformité', date: '29/01 14:30', status: 'pending', format: 'PDF' },
    { name: 'Analyse Clients VIP', date: '28/01 11:15', status: 'completed', format: 'Excel' }
  ];

  const favoriteReports = [
    { name: 'Dashboard Exécutif', category: 'BI', frequency: 'Quotidien' },
    { name: 'Ventes par Produit', category: 'Ventes', frequency: 'Hebdomadaire' },
    { name: 'Alertes Stock', category: 'Stock', frequency: 'Temps réel' },
    { name: 'Registre Stupéfiants', category: 'Réglementaire', frequency: 'Mensuel' }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Données actualisées",
        description: "Le tableau de bord a été mis à jour avec les dernières données",
      });
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'pending': return 'En cours';
      case 'error': return 'Erreur';
      default: return 'Inconnu';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Centre de Reporting</h2>
          <p className="text-muted-foreground">
            Vue d'ensemble des rapports et analyses PharmaSoft
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="animate-fade-in"
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="hover-scale animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <IconComponent className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metric.value} <span className="text-sm font-normal text-muted-foreground">{metric.unit}</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : metric.trend === 'down' ? (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  ) : (
                    <div className="h-3 w-3 bg-gray-400 rounded-full mr-1" />
                  )}
                  {metric.change}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="reports">Modules Rapports</TabsTrigger>
          <TabsTrigger value="recent">Rapports Récents</TabsTrigger>
          <TabsTrigger value="favorites">Favoris</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Activité de Reporting
                </CardTitle>
                <CardDescription>Génération de rapports sur les 30 derniers jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rapports générés</span>
                    <span className="font-bold">247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Exports PDF</span>
                    <span className="font-bold">189</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Exports Excel</span>
                    <span className="font-bold">128</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rapports programmés</span>
                    <span className="font-bold">23</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendances d'Usage
                </CardTitle>
                <CardDescription>Modules les plus utilisés cette semaine</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Rapports Ventes', usage: 89, color: 'bg-blue-500' },
                    { name: 'Analyses Stock', usage: 76, color: 'bg-green-500' },
                    { name: 'Business Intelligence', usage: 65, color: 'bg-indigo-500' },
                    { name: 'Rapports Financiers', usage: 43, color: 'bg-yellow-500' }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span>{item.usage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${item.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${item.usage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {reportGroups.map((group, index) => {
              const IconComponent = group.icon;
              return (
                <Card key={group.id} className="hover-scale animate-fade-in cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className={`w-12 h-12 ${group.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                      <IconComponent className={`h-6 w-6 ${group.color}`} />
                    </div>
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {group.reports} rapports disponibles
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Badge variant="secondary" className="text-xs">
                      {group.reports} rapports
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Rapports Récents
              </CardTitle>
              <CardDescription>
                Derniers rapports générés et leurs statuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports.map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(report.status)}`} />
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <p className="text-sm text-muted-foreground">{report.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{report.format}</Badge>
                      <Badge 
                        variant={report.status === 'completed' ? 'default' : 
                                report.status === 'pending' ? 'secondary' : 'destructive'}
                      >
                        {getStatusText(report.status)}
                      </Badge>
                      {report.status === 'completed' && (
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Rapports Favoris
              </CardTitle>
              <CardDescription>
                Vos rapports les plus consultés et programmés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {favoriteReports.map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <p className="text-sm text-muted-foreground">{report.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{report.frequency}</Badge>
                      <Button size="sm" variant="outline">
                        Générer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsDashboard;