import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Activity, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpDown,
  Filter,
  Search,
  Network,
  BarChart3,
  Globe,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNetworkMessaging } from '@/hooks/useNetworkMessaging';

interface PharmacyMetrics {
  messages_sent: number;
  messages_received: number;
  active_channels: number;
  last_activity: string;
}

interface PharmacyWithMetrics {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  region: string;
  type: string;
  status: string;
  phone: string;
  email: string;
  metrics?: PharmacyMetrics;
}

const MultiPharmacyManagement = () => {
  const { pharmacies: basePharmacies, loading } = useNetworkMessaging();
  const [pharmacies, setPharmacies] = useState<PharmacyWithMetrics[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'activity' | 'messages'>('name');

  useEffect(() => {
    if (basePharmacies.length > 0) {
      loadPharmacyMetrics();
    }
  }, [basePharmacies]);

  const loadPharmacyMetrics = async () => {
    try {
      // Simuler des métriques pour chaque pharmacie
      const pharmaciesWithMetrics = basePharmacies.map(pharmacy => ({
        ...pharmacy,
        address: pharmacy.code === 'PH001' ? '15 Place de la République' : 
                pharmacy.code === 'PH002' ? '8 Avenue de la Gare' :
                pharmacy.code === 'PH003' ? '22 Route Nationale' : 'CHU Marseille',
        phone: pharmacy.code === 'PH001' ? '01.42.33.44.55' : 
               pharmacy.code === 'PH002' ? '04.72.56.78.90' :
               pharmacy.code === 'PH003' ? '04.90.12.34.56' : '04.91.38.60.00',
        email: pharmacy.code === 'PH001' ? 'contact@pharmacie-centre.fr' : 
               pharmacy.code === 'PH002' ? 'info@pharmacie-gare.fr' :
               pharmacy.code === 'PH003' ? 'contact@pharmacie-rurale.fr' : 'pharma@chu-marseille.fr',
        metrics: {
          messages_sent: Math.floor(Math.random() * 50) + 10,
          messages_received: Math.floor(Math.random() * 75) + 15,
          active_channels: Math.floor(Math.random() * 5) + 2,
          last_activity: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString()
        }
      }));
      
      setPharmacies(pharmaciesWithMetrics);
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error);
    }
  };

  const regions = [...new Set(pharmacies.map(p => p.region).filter(Boolean))];
  const types = [...new Set(pharmacies.map(p => p.type).filter(Boolean))];

  const filteredPharmacies = pharmacies.filter(pharmacy => {
    const matchesRegion = selectedRegion === 'all' || pharmacy.region === selectedRegion;
    const matchesType = selectedType === 'all' || pharmacy.type === selectedType;
    const matchesSearch = searchTerm === '' || 
      pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.code.toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchesRegion && matchesType && matchesSearch;
  });

  const sortedPharmacies = [...filteredPharmacies].sort((a, b) => {
    switch (sortBy) {
      case 'activity':
        return new Date(b.metrics?.last_activity || 0).getTime() - new Date(a.metrics?.last_activity || 0).getTime();
      case 'messages':
        return (b.metrics?.messages_sent || 0) - (a.metrics?.messages_sent || 0);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'maintenance': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'maintenance': return <AlertCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'centre-ville': return <Building className="h-4 w-4" />;
      case 'grande-surface': return <Network className="h-4 w-4" />;
      case 'rurale': return <Globe className="h-4 w-4" />;
      case 'hospitalière': return <Zap className="h-4 w-4" />;
      default: return <Building className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Chargement des officines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building className="h-8 w-8 text-primary" />
            Gestion Multi-Officines
          </h1>
          <p className="text-muted-foreground">
            Coordination et supervision des {pharmacies.length} officines du réseau
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {filteredPharmacies.length} officines affichées
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="directory">Annuaire</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="coordination">Coordination</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Officines Actives</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pharmacies.filter(p => p.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sur {pharmacies.length} officines
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages Total</CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pharmacies.reduce((sum, p) => sum + (p.metrics?.messages_sent || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Messages envoyés aujourd'hui
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Régions</CardTitle>
                <MapPin className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{regions.length}</div>
                <p className="text-xs text-muted-foreground">
                  Régions couvertes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activité Réseau</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98%</div>
                <p className="text-xs text-muted-foreground">
                  Disponibilité réseau
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Aperçu des régions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Répartition par Région
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {regions.map((region) => {
                  const regionPharmacies = pharmacies.filter(p => p.region === region);
                  return (
                    <div key={region} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{region}</h4>
                        <Badge variant="outline">{regionPharmacies.length}</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {regionPharmacies.map(p => (
                          <div key={p.id} className="flex items-center gap-2">
                            {getTypeIcon(p.type)}
                            <span>{p.name}</span>
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(p.status)}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Annuaire */}
        <TabsContent value="directory" className="space-y-4">
          {/* Filtres et recherche */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres et Recherche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom, ville ou code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Toutes les régions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {types.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: 'name' | 'activity' | 'messages') => setSortBy(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="activity">Activité récente</SelectItem>
                    <SelectItem value="messages">Messages envoyés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liste des pharmacies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Annuaire des Officines
                </span>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {sortedPharmacies.map((pharmacy) => (
                    <div key={pharmacy.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(pharmacy.type)}
                              <h3 className="font-semibold">{pharmacy.name}</h3>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {pharmacy.code}
                            </Badge>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${getStatusColor(pharmacy.status)}`}>
                              {getStatusIcon(pharmacy.status)}
                              {pharmacy.status}
                            </div>
                          </div>
                          
                          <div className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              <span>{pharmacy.address}, {pharmacy.city}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span>{pharmacy.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span>{pharmacy.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Globe className="h-3 w-3" />
                              <span>{pharmacy.region}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-semibold text-blue-600">
                                {pharmacy.metrics?.messages_sent || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Messages</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-green-600">
                                {pharmacy.metrics?.active_channels || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Canaux</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Dernière activité: {new Date(pharmacy.metrics?.last_activity || Date.now()).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Réseau
              </CardTitle>
              <CardDescription>
                Métriques de performance et d'utilisation du réseau
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Analytics Avancées</p>
                <p className="text-sm">Graphiques et métriques détaillées en cours de développement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coordination */}
        <TabsContent value="coordination" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Outils de Coordination
              </CardTitle>
              <CardDescription>
                Transferts inter-officines et coordination réseau
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Outils de Coordination</p>
                <p className="text-sm">Fonctionnalités de transfert et coordination en cours de développement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultiPharmacyManagement;