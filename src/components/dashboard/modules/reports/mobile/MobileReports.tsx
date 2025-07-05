import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Smartphone, 
  Tablet, 
  Download, 
  Bell,
  Wifi,
  WifiOff,
  Zap,
  Eye,
  Settings,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Battery,
  Signal,
  Share,
  BookOpen,
  Calendar
} from 'lucide-react';

const MobileReports = () => {
  const [syncStatus, setSyncStatus] = useState('online');
  const [pushNotifications, setPushNotifications] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  // KPIs Mobile
  const mobileKPIs = [
    {
      title: 'Utilisateurs Mobile',
      value: '847',
      change: '+23.5%',
      icon: Smartphone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Sessions Tablette',
      value: '156',
      change: '+12.8%',
      icon: Tablet,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Rapports Consultés',
      value: '2,847',
      change: '+18.9%',
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Notifications Envoyées',
      value: '1,245',
      change: '+8.7%',
      icon: Bell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  // Notifications KPI
  const kpiNotifications = [
    {
      id: 1,
      type: 'alert',
      title: 'Stock Critique',
      message: 'Doliprane 1000mg - Stock inférieur à 50 unités',
      timestamp: '09:15',
      priority: 'high',
      read: false
    },
    {
      id: 2,
      type: 'success',
      title: 'Objectif Atteint',
      message: 'Ventes journalières: 105% de l\'objectif',
      timestamp: '08:30',
      priority: 'medium',
      read: true
    },
    {
      id: 3,
      type: 'info',
      title: 'Nouveau Client VIP',
      message: 'Client premium détecté - Panier 45,000 FCFA',
      timestamp: '07:45',
      priority: 'medium',
      read: false
    },
    {
      id: 4,
      type: 'warning',
      title: 'Péremption Proche',
      message: '8 lots expirent dans les 30 jours',
      timestamp: '07:00',
      priority: 'medium',
      read: true
    }
  ];

  // Dashboard Mobile Widgets
  const mobileWidgets = [
    {
      id: 'sales-summary',
      name: 'Résumé Ventes',
      description: 'CA, transactions, panier moyen',
      enabled: true,
      priority: 1,
      size: 'large'
    },
    {
      id: 'stock-alerts',
      name: 'Alertes Stock',
      description: 'Ruptures et niveaux critiques',
      enabled: true,
      priority: 2,
      size: 'medium'
    },
    {
      id: 'top-products',
      name: 'Top Produits',
      description: 'Meilleures ventes du jour',
      enabled: true,
      priority: 3,
      size: 'medium'
    },
    {
      id: 'customer-activity',
      name: 'Activité Clients',
      description: 'Nouveaux clients et fidélité',
      enabled: false,
      priority: 4,
      size: 'small'
    },
    {
      id: 'financial-kpis',
      name: 'KPIs Financiers',
      description: 'Marges et rentabilité',
      enabled: true,
      priority: 5,
      size: 'large'
    }
  ];

  // Rapports Offline
  const offlineReports = [
    {
      id: 1,
      name: 'Dashboard Exécutif',
      lastSync: '2024-01-05 08:30',
      size: '2.4 MB',
      status: 'available',
      validity: '24h'
    },
    {
      id: 2,
      name: 'Rapport Ventes Journalier',
      lastSync: '2024-01-05 09:00',
      size: '1.8 MB',
      status: 'available',
      validity: '12h'
    },
    {
      id: 3,
      name: 'Analyse Stock',
      lastSync: '2024-01-04 18:00',
      size: '3.2 MB',
      status: 'expired',
      validity: '24h'
    },
    {
      id: 4,
      name: 'Métriques Clients',
      lastSync: '2024-01-05 07:15',
      size: '1.1 MB',
      status: 'syncing',
      validity: '48h'
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'info': return <Bell className="h-4 w-4 text-blue-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-50';
      case 'syncing': return 'text-blue-600 bg-blue-50';
      case 'expired': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'expired': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reporting Mobile</h2>
          <p className="text-muted-foreground">
            Interface optimisée pour appareils mobiles et tablettes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {syncStatus === 'online' ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">{syncStatus === 'online' ? 'En ligne' : 'Hors ligne'}</span>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* KPIs Mobile */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mobileKPIs.map((kpi, index) => {
          const IconComponent = kpi.icon;
          return (
            <Card key={index} className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  {kpi.change} vs mois précédent
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="offline">Mode Offline</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications KPI
              </CardTitle>
              <CardDescription>Alertes en temps réel sur les métriques importantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {kpiNotifications.map((notification) => (
                  <div key={notification.id} className={`p-3 border-l-4 rounded-lg ${getPriorityColor(notification.priority)} ${!notification.read ? 'bg-blue-50/30' : 'bg-gray-50/30'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <p className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                        {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                  <span className="text-sm">Notifications Push</span>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Configuration Dashboard Mobile
              </CardTitle>
              <CardDescription>Personnalisez l'affichage pour appareils mobiles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-3">Widgets Disponibles</h4>
                    <div className="space-y-3">
                      {mobileWidgets.map((widget) => (
                        <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{widget.name}</p>
                            <p className="text-sm text-muted-foreground">{widget.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">
                                {widget.size}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Priorité {widget.priority}
                              </span>
                            </div>
                          </div>
                          <Switch checked={widget.enabled} />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Aperçu Mobile</h4>
                    <div className="aspect-[9/16] max-w-[200px] bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl border p-4 relative">
                      <div className="text-center mb-4">
                        <div className="w-12 h-1 bg-gray-400 rounded-full mx-auto mb-2"></div>
                        <p className="text-xs font-semibold">PharmaSoft Mobile</p>
                      </div>
                      
                      <div className="space-y-2">
                        {mobileWidgets.filter(w => w.enabled).slice(0, 4).map((widget, index) => (
                          <div key={index} className={`bg-white rounded p-2 shadow-sm ${
                            widget.size === 'large' ? 'h-16' : 
                            widget.size === 'medium' ? 'h-12' : 'h-8'
                          }`}>
                            <p className="text-xs font-medium truncate">{widget.name}</p>
                            {widget.size !== 'small' && (
                              <div className="flex items-center gap-1 mt-1">
                                <div className="w-6 h-1 bg-blue-200 rounded"></div>
                                <div className="w-4 h-1 bg-green-200 rounded"></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                        <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Consultation Hors Ligne
              </CardTitle>
              <CardDescription>Accédez aux rapports sans connexion internet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <WifiOff className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Mode Hors Ligne</p>
                      <p className="text-sm text-muted-foreground">
                        Synchronise automatiquement les rapports essentiels
                      </p>
                    </div>
                  </div>
                  <Switch checked={offlineMode} onCheckedChange={setOfflineMode} />
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Rapports Téléchargés</h4>
                  <div className="space-y-3">
                    {offlineReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(report.status)}
                          <div>
                            <p className="font-medium">{report.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Dernière sync: {report.lastSync} • {report.size}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(report.status)}>
                            {report.status === 'available' ? 'Disponible' :
                             report.status === 'syncing' ? 'Sync...' : 'Expiré'}
                          </Badge>
                          <Button size="sm" variant="outline">
                            {report.status === 'available' ? <Eye className="h-4 w-4" /> :
                             report.status === 'syncing' ? <RefreshCw className="h-4 w-4 animate-spin" /> :
                             <Download className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Battery className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Espace Stockage</span>
                    </div>
                    <Progress value={35} className="h-2 mb-2" />
                    <p className="text-sm text-muted-foreground">8.7 MB / 25 MB utilisés</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Signal className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Dernière Sync</span>
                    </div>
                    <p className="text-lg font-bold">09:15</p>
                    <p className="text-sm text-muted-foreground">Il y a 25 minutes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres d'Affichage
                </CardTitle>
                <CardDescription>Configuration pour mobiles et tablettes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mode Sombre</p>
                      <p className="text-sm text-muted-foreground">Interface adaptée faible luminosité</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Graphiques Simplifiés</p>
                      <p className="text-sm text-muted-foreground">Optimisé pour petit écran</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Vibrations</p>
                      <p className="text-sm text-muted-foreground">Retour haptique notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Économie de Données</p>
                      <p className="text-sm text-muted-foreground">Réduit l'usage de données</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>Gestion des alertes mobiles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Alertes Stock</p>
                      <p className="text-sm text-muted-foreground">Niveaux critiques et ruptures</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Objectifs Ventes</p>
                      <p className="text-sm text-muted-foreground">Progression et atteinte</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Clients VIP</p>
                      <p className="text-sm text-muted-foreground">Détection nouveau client premium</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Maintenance Système</p>
                      <p className="text-sm text-muted-foreground">Mises à jour et maintenances</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MobileReports;