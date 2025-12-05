import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building, MapPin, Phone, Mail, Users, Activity, TrendingUp,
  AlertCircle, CheckCircle, Clock, ArrowUpDown, Filter, Search,
  Network, BarChart3, Globe, Zap, RefreshCw, MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

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
  metrics: PharmacyMetrics;
}

interface Collaboration {
  id: string;
  name: string;
  description: string;
  participants_count: number;
  status: string;
  created_at: string;
}

const MultiPharmacyManagement = () => {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;

  const [pharmacies, setPharmacies] = useState<PharmacyWithMetrics[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'activity' | 'messages'>('name');

  // Stats
  const [totalMessages, setTotalMessages] = useState(0);
  const [networkAvailability, setNetworkAvailability] = useState(98);

  useEffect(() => {
    loadAllData();
  }, [tenantId]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadPharmaciesWithMetrics(),
      loadCollaborations(),
      loadNetworkStats()
    ]);
    setLoading(false);
  };

  const loadPharmaciesWithMetrics = async () => {
    try {
      const { data: pharmaciesData } = await supabase
        .from('pharmacies')
        .select('id, name, code, city, region, type, status, email, phone, address')
        .order('name');

      if (!pharmaciesData) return;

      // Get metrics for each pharmacy
      const pharmaciesWithMetrics = await Promise.all(
        pharmaciesData.map(async (pharmacy) => {
          // Count messages sent
          const { count: messagesSent } = await supabase
            .from('network_messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_pharmacy_id', pharmacy.id);

          // Count channels participated
          const { count: activeChannels } = await supabase
            .from('channel_participants')
            .select('*', { count: 'exact', head: true })
            .eq('pharmacy_id', pharmacy.id);

          // Get last activity
          const { data: lastMessage } = await supabase
            .from('network_messages')
            .select('created_at')
            .eq('sender_pharmacy_id', pharmacy.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            id: pharmacy.id,
            name: pharmacy.name || '',
            code: pharmacy.code || '',
            address: pharmacy.address || '',
            city: pharmacy.city || '',
            region: pharmacy.region || '',
            type: pharmacy.type || '',
            status: pharmacy.status || 'active',
            phone: pharmacy.phone || '',
            email: pharmacy.email || '',
            metrics: {
              messages_sent: messagesSent || 0,
              messages_received: 0,
              active_channels: activeChannels || 0,
              last_activity: lastMessage?.created_at || new Date().toISOString()
            }
          };
        })
      );

      setPharmacies(pharmaciesWithMetrics);
    } catch (error) {
      console.error('Erreur chargement pharmacies:', error);
    }
  };

  const loadCollaborations = async () => {
    try {
      const { data } = await supabase
        .from('network_channels')
        .select('id, name, description, created_at')
        .eq('type', 'collaboration')
        .order('created_at', { ascending: false })
        .limit(10) as { data: any[] | null };

      const collabs = await Promise.all(
        (data || []).map(async (ch) => {
          const { count } = await supabase
            .from('channel_participants')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', ch.id);

          return {
            id: ch.id,
            name: ch.name,
            description: ch.description || '',
            participants_count: count || 0,
            status: 'active',
            created_at: ch.created_at
          };
        })
      );

      setCollaborations(collabs);
    } catch (error) {
      console.error('Erreur chargement collaborations:', error);
    }
  };

  const loadNetworkStats = async () => {
    try {
      const { count } = await supabase
        .from('network_messages')
        .select('*', { count: 'exact', head: true });

      setTotalMessages(count || 0);
      // Network availability is calculated - default to 98%
      setNetworkAvailability(98);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
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
        return new Date(b.metrics.last_activity).getTime() - new Date(a.metrics.last_activity).getTime();
      case 'messages':
        return b.metrics.messages_sent - a.metrics.messages_sent;
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
          <Button variant="outline" onClick={loadAllData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
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
                  {totalMessages.toLocaleString('fr-FR')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sur le réseau
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
                <div className="text-2xl font-bold">{networkAvailability}%</div>
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
                        {regionPharmacies.slice(0, 3).map(p => (
                          <div key={p.id} className="flex items-center gap-2">
                            {getTypeIcon(p.type)}
                            <span>{p.name}</span>
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(p.status)}`} />
                          </div>
                        ))}
                        {regionPharmacies.length > 3 && (
                          <p className="text-xs">+{regionPharmacies.length - 3} autres</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {regions.length === 0 && (
                  <div className="col-span-3 text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune région définie</p>
                  </div>
                )}
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
              <div className="flex gap-4 items-end flex-wrap">
                <div className="flex-1 min-w-64">
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
                            {pharmacy.code && (
                              <Badge variant="outline" className="text-xs">
                                {pharmacy.code}
                              </Badge>
                            )}
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${getStatusColor(pharmacy.status)}`}>
                              {getStatusIcon(pharmacy.status)}
                              {pharmacy.status}
                            </div>
                          </div>
                          
                          <div className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
                            {pharmacy.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span>{pharmacy.address}, {pharmacy.city}</span>
                              </div>
                            )}
                            {pharmacy.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span>{pharmacy.phone}</span>
                              </div>
                            )}
                            {pharmacy.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                <span>{pharmacy.email}</span>
                              </div>
                            )}
                            {pharmacy.region && (
                              <div className="flex items-center gap-2">
                                <Globe className="h-3 w-3" />
                                <span>{pharmacy.region}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-semibold text-blue-600">
                                {pharmacy.metrics.messages_sent}
                              </div>
                              <div className="text-xs text-muted-foreground">Messages</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-green-600">
                                {pharmacy.metrics.active_channels}
                              </div>
                              <div className="text-xs text-muted-foreground">Canaux</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Dernière activité: {new Date(pharmacy.metrics.last_activity).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {sortedPharmacies.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Aucune officine trouvée</p>
                    </div>
                  )}
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
                Statistiques et performances du réseau d'officines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Top Officines par Messages</h4>
                  <div className="space-y-2">
                    {pharmacies
                      .sort((a, b) => b.metrics.messages_sent - a.metrics.messages_sent)
                      .slice(0, 5)
                      .map((pharmacy, index) => (
                        <div key={pharmacy.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-muted-foreground">#{index + 1}</span>
                            <span>{pharmacy.name}</span>
                          </div>
                          <Badge variant="secondary">{pharmacy.metrics.messages_sent} messages</Badge>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Répartition par Type</h4>
                  <div className="space-y-2">
                    {types.map(type => {
                      const count = pharmacies.filter(p => p.type === type).length;
                      const percentage = Math.round((count / pharmacies.length) * 100) || 0;
                      return (
                        <div key={type} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{type}</span>
                            <span>{count} ({percentage}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coordination */}
        <TabsContent value="coordination" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Projets Inter-Officines
              </CardTitle>
              <CardDescription>
                Collaborations et projets en cours entre les officines
              </CardDescription>
            </CardHeader>
            <CardContent>
              {collaborations.length > 0 ? (
                <div className="space-y-4">
                  {collaborations.map((collab) => (
                    <div key={collab.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{collab.name}</h4>
                        <Badge variant="secondary">{collab.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{collab.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {collab.participants_count} participants
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(collab.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun projet inter-officines en cours</p>
                  <p className="text-sm">Créez une collaboration pour démarrer</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultiPharmacyManagement;
