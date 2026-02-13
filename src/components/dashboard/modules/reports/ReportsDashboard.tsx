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
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { useReportsDashboard } from '@/hooks/useReportsDashboard';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useDashboardVisibility, DashboardVisibilityToggle } from '@/components/dashboard/DashboardVisibilityToggle';

const ReportsDashboard = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const { isVisible, toggleVisibility, hasDashboardPermission } = useDashboardVisibility();
  
  const { 
    metrics, 
    recentReports, 
    favoriteReports, 
    activity, 
    moduleUsage,
    moduleReportCounts,
    isLoading, 
    refetch 
  } = useReportsDashboard(selectedPeriod);

  // Configuration des modules avec compteurs dynamiques
  const getModuleCount = (moduleId: string) => {
    const found = moduleReportCounts.find(m => m.id === moduleId);
    return found?.count || 0;
  };

  const reportGroups = [
    { id: 'ventes', name: 'Ventes', icon: BarChart3, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'stock', name: 'Stock', icon: Package, color: 'text-green-600', bgColor: 'bg-green-50' },
    { id: 'financier', name: 'Financier', icon: DollarSign, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { id: 'clients', name: 'Clients', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 'bi', name: 'Business Intelligence', icon: Target, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { id: 'reglementaire', name: 'Réglementaire', icon: FileText, color: 'text-red-600', bgColor: 'bg-red-50' },
    { id: 'geospatial', name: 'Géospatial', icon: MapPin, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { id: 'mobile', name: 'Mobile', icon: Smartphone, color: 'text-pink-600', bgColor: 'bg-pink-50' },
    { id: 'ia', name: 'IA/Prédictif', icon: Brain, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    { id: 'generateur', name: 'Générateur', icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-50' },
    { id: 'comparatif', name: 'Comparatif', icon: TrendingUp, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { id: 'configuration', name: 'Configuration', icon: Cog, color: 'text-slate-600', bgColor: 'bg-slate-50' }
  ];

  const iconMap: Record<string, any> = {
    DollarSign,
    Package,
    Users,
    Target
  };

  const handleRefresh = async () => {
    refetch();
    toast({
      title: "Données actualisées",
      description: "Le tableau de bord a été mis à jour avec les dernières données",
    });
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

  const metricsIcons = [DollarSign, Package, Users, Target];
  const metricsColors = ['text-green-600', 'text-orange-600', 'text-blue-600', 'text-green-600'];

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
          <Select value={selectedPeriod} onValueChange={(v: any) => setSelectedPeriod(v)}>
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
          {hasDashboardPermission && (
            <Button onClick={toggleVisibility} variant="ghost" size="sm" className="gap-2">
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {isVisible ? 'Masquer' : 'Afficher'}
            </Button>
          )}
          <Button 
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            className="animate-fade-in"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {!hasDashboardPermission || !isVisible ? (
        <DashboardVisibilityToggle>
          <div />
        </DashboardVisibilityToggle>
      ) : (
        <>

      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => {
          const IconComponent = metricsIcons[index];
          return (
            <Card key={index} className="hover-scale animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <IconComponent className={`h-4 w-4 ${metricsColors[index]}`} />
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
                    <span className="font-bold">{activity.totalGenerated}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Exports PDF</span>
                    <span className="font-bold">{activity.pdfExports}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Exports Excel</span>
                    <span className="font-bold">{activity.excelExports}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rapports programmés</span>
                    <span className="font-bold">{activity.scheduledReports}</span>
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
                  {moduleUsage.length > 0 ? (
                    moduleUsage.map((item, index) => (
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
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">Aucune donnée d'usage disponible</p>
                      <p className="text-xs mt-1">Générez des rapports pour voir les tendances</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {reportGroups.map((group, index) => {
              const IconComponent = group.icon;
              const reportCount = getModuleCount(group.id);
              return (
                <Card key={group.id} className="hover-scale animate-fade-in cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className={`w-12 h-12 ${group.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                      <IconComponent className={`h-6 w-6 ${group.color}`} />
                    </div>
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {reportCount} rapport{reportCount !== 1 ? 's' : ''} disponible{reportCount !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Badge variant="secondary" className="text-xs">
                      {reportCount} rapport{reportCount !== 1 ? 's' : ''}
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
              {recentReports.length > 0 ? (
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
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Aucun rapport généré</p>
                  <p className="text-sm mt-1">Les rapports générés apparaîtront ici</p>
                  <Button variant="outline" className="mt-4" size="sm">
                    Générer un rapport
                  </Button>
                </div>
              )}
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
              {favoriteReports.length > 0 ? (
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
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Aucun rapport favori</p>
                  <p className="text-sm mt-1">Ajoutez des modèles de rapports pour y accéder rapidement</p>
                  <Button variant="outline" className="mt-4" size="sm">
                    Configurer les modèles
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </>
      )}
    </div>
  );
};

export default ReportsDashboard;