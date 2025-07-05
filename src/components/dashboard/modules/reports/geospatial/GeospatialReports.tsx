import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Globe, 
  Navigation, 
  Truck,
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Settings,
  Download,
  RefreshCw,
  Eye,
  Filter,
  Layers,
  Route,
  Building,
  Home,
  ShoppingBag,
  Calendar,
  Clock
} from 'lucide-react';

const GeospatialReports = () => {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [mapView, setMapView] = useState('sales');
  
  // Données géographiques
  const geoMetrics = [
    {
      title: 'Zones Actives',
      value: '847',
      change: '+12.5%',
      icon: MapPin,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Couverture Géographique',
      value: '94.2%',
      change: '+2.8%',
      icon: Globe,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Zones Optimales',
      value: '156',
      change: '+8.7%',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Livraisons Actives',
      value: '1,247',
      change: '+15.3%',
      icon: Truck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  // Analyse par zones
  const geoAnalysis = [
    {
      zone: 'Centre-Ville',
      customers: 2847,
      revenue: 4200000,
      growth: 18.5,
      density: 'Élevée',
      potential: 'Optimal',
      color: 'text-green-600'
    },
    {
      zone: 'Quartiers Résidentiels',
      customers: 1589,
      revenue: 2800000,
      growth: 12.3,
      density: 'Moyenne',
      potential: 'Bon',
      color: 'text-blue-600'
    },
    {
      zone: 'Zone Industrielle',
      customers: 847,
      revenue: 1200000,
      growth: 8.7,
      density: 'Faible',
      potential: 'Modéré',
      color: 'text-yellow-600'
    },
    {
      zone: 'Périphérie',
      customers: 634,
      revenue: 950000,
      growth: 15.2,
      density: 'Faible',
      potential: 'Élevé',
      color: 'text-purple-600'
    }
  ];

  // Routes optimisées
  const optimizedRoutes = [
    {
      id: 'R001',
      name: 'Route Centre',
      stops: 12,
      distance: '28 km',
      duration: '2h15',
      efficiency: 94.5,
      status: 'Active'
    },
    {
      id: 'R002', 
      name: 'Route Nord',
      stops: 8,
      distance: '35 km',
      duration: '2h45',
      efficiency: 89.2,
      status: 'Active'
    },
    {
      id: 'R003',
      name: 'Route Sud',
      stops: 15,
      distance: '42 km',
      duration: '3h20',
      efficiency: 87.8,
      status: 'En cours'
    }
  ];

  // Zones de chalandise
  const catchmentAreas = [
    {
      area: 'Zone Premium',
      population: 45000,
      penetration: 23.8,
      avgSpent: 18750,
      competition: 'Faible',
      opportunity: 'Excellente'
    },
    {
      area: 'Zone Familiale',
      population: 62000,
      penetration: 15.2,
      avgSpent: 12400,
      competition: 'Moyenne',
      opportunity: 'Bonne'
    },
    {
      area: 'Zone Étudiante',
      population: 28000,
      penetration: 8.9,
      avgSpent: 8200,
      competition: 'Élevée',
      opportunity: 'Modérée'
    }
  ];

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'Optimal': return 'text-green-600 bg-green-50';
      case 'Élevé': return 'text-blue-600 bg-blue-50';
      case 'Bon': return 'text-purple-600 bg-purple-50';
      case 'Modéré': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getOpportunityColor = (opportunity: string) => {
    switch (opportunity) {
      case 'Excellente': return 'text-green-600 bg-green-50';
      case 'Bonne': return 'text-blue-600 bg-blue-50';
      case 'Modérée': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analyses Géospatiales</h2>
          <p className="text-muted-foreground">
            Cartographie des ventes et optimisation territoriale
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes zones</SelectItem>
              <SelectItem value="center">Centre-ville</SelectItem>
              <SelectItem value="residential">Résidentiel</SelectItem>
              <SelectItem value="industrial">Industriel</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Métriques géographiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {geoMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  {metric.change} vs mois précédent
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="mapping" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="mapping">Cartographie</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="catchment">Chalandise</TabsTrigger>
          <TabsTrigger value="optimization">Optimisation</TabsTrigger>
        </TabsList>

        <TabsContent value="mapping" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Carte Interactive des Ventes
                  </CardTitle>
                  <CardDescription>Visualisation géographique temps réel</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <MapPin className="h-12 w-12 text-blue-500 mx-auto" />
                      <p className="text-lg font-semibold">Carte Interactive</p>
                      <p className="text-sm text-muted-foreground">
                        Intégration Maps API en cours
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4">
                      <Button size="sm" variant="outline">
                        <Layers className="h-4 w-4 mr-2" />
                        Couches
                      </Button>
                      <Button size="sm" variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtres
                      </Button>
                    </div>
                    <Select value={mapView} onValueChange={setMapView}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Ventes</SelectItem>
                        <SelectItem value="density">Densité</SelectItem>
                        <SelectItem value="growth">Croissance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Légende & Contrôles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Intensité des Ventes</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-sm">Élevée (80-100%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-sm">Moyenne (50-80%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="text-sm">Faible (20-50%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-400 rounded"></div>
                        <span className="text-sm">Très faible (&lt;20%)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Points d'Intérêt</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Concurrents</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Clients VIP</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">Livraisons</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="zones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Analyse par Zones Géographiques
              </CardTitle>
              <CardDescription>Performance et potentiel par secteur</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {geoAnalysis.map((zone, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{zone.zone}</h4>
                      <Badge className={getPotentialColor(zone.potential)}>
                        {zone.potential}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Clients</p>
                        <p className="text-lg font-bold">{zone.customers.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CA</p>
                        <p className="text-lg font-bold">
                          {(zone.revenue / 1000000).toFixed(1)}M FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Croissance</p>
                        <p className={`text-lg font-bold ${zone.color}`}>+{zone.growth}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Densité</p>
                        <p className="text-lg font-bold">{zone.density}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress value={zone.growth * 5} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Optimisation des Routes de Livraison
              </CardTitle>
              <CardDescription>Gestion et optimisation logistique</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizedRoutes.map((route, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Navigation className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{route.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {route.stops} arrêts • {route.distance} • {route.duration}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{route.efficiency}%</p>
                        <p className="text-xs text-muted-foreground">Efficacité</p>
                      </div>
                      <Badge variant={route.status === 'Active' ? 'default' : 'secondary'}>
                        {route.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catchment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Zones de Chalandise
              </CardTitle>
              <CardDescription>Analyse du potentiel commercial par zone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {catchmentAreas.map((area, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{area.area}</h4>
                      <Badge className={getOpportunityColor(area.opportunity)}>
                        {area.opportunity}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Population</p>
                        <p className="text-lg font-bold">{area.population.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pénétration</p>
                        <p className="text-lg font-bold text-blue-600">{area.penetration}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Panier Moyen</p>
                        <p className="text-lg font-bold">{area.avgSpent.toLocaleString()} FCFA</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Concurrence</p>
                        <p className="text-lg font-bold">{area.competition}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress value={area.penetration * 4} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Potentiel de croissance: {(100 - area.penetration).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Recommandations d'Optimisation
                </CardTitle>
                <CardDescription>Suggestions IA pour améliorer la couverture</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="font-medium text-green-800">Expansion Recommandée</p>
                    <p className="text-sm text-green-600">
                      Zone Sud-Est: Potentiel +35% avec 2 points de vente
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-medium text-blue-800">Optimisation Route</p>
                    <p className="text-sm text-blue-600">
                      Réorganiser Route Nord: Économie 25% temps de transport
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="font-medium text-purple-800">Partenariat Stratégique</p>
                    <p className="text-sm text-purple-600">
                      Zone Étudiante: Partenariat campus (+28% pénétration)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Impact Projections
                </CardTitle>
                <CardDescription>Projections ROI des optimisations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span className="font-medium">Extension Zone Sud</span>
                    <span className="text-green-600 font-bold">+42% ROI</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span className="font-medium">Optimisation Routes</span>
                    <span className="text-blue-600 font-bold">-28% Coûts</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span className="font-medium">Marketing Géolocalisé</span>
                    <span className="text-purple-600 font-bold">+18% Conversion</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span className="font-medium">Partenariats Locaux</span>
                    <span className="text-orange-600 font-bold">+25% Notoriété</span>
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

export default GeospatialReports;