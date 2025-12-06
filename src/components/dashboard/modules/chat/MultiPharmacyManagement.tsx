import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building, MapPin, Phone, Mail, Users, Activity, TrendingUp,
  AlertCircle, CheckCircle, Clock, Filter, Search,
  Network, Globe, Zap, RefreshCw, MessageSquare,
  Download, Plus, Eye, Send
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { useMultiPharmacyManagement } from '@/hooks/useMultiPharmacyManagement';
import PharmacyDetailModal from './dialogs/PharmacyDetailModal';
import CollaborationDetailModal from './dialogs/CollaborationDetailModal';
import ExportOptionsDialog from './dialogs/ExportOptionsDialog';
import CreateCollaborationDialog from './dialogs/CreateCollaborationDialog';
import { 
  exportPharmaciesExcel, 
  exportPharmaciesPDF,
  exportAnalyticsExcel,
  exportAnalyticsPDF,
  exportCollaborationsExcel
} from '@/utils/multiPharmacyExportUtils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const MultiPharmacyManagement = () => {
  const {
    pharmacies,
    collaborations,
    loading,
    networkStats,
    regionStats,
    analyticsData,
    recentActivities,
    loadAllData,
    createCollaboration,
    deleteCollaboration,
    leaveCollaboration,
    startConversationWith,
    tenantId
  } = useMultiPharmacyManagement();

  // Filters
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'activity' | 'messages'>('name');

  // Modals
  const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);
  const [pharmacyModalOpen, setPharmacyModalOpen] = useState(false);
  const [selectedCollaboration, setSelectedCollaboration] = useState<any>(null);
  const [collaborationModalOpen, setCollaborationModalOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<'pharmacies' | 'analytics' | 'collaborations'>('pharmacies');
  const [createCollabDialogOpen, setCreateCollabDialogOpen] = useState(false);

  // Derived data
  const regions = [...new Set(pharmacies.map(p => p.region).filter(Boolean))];
  const types = [...new Set(pharmacies.map(p => p.type).filter(Boolean))];

  const filteredPharmacies = pharmacies.filter(pharmacy => {
    const matchesRegion = selectedRegion === 'all' || pharmacy.region === selectedRegion;
    const matchesType = selectedType === 'all' || pharmacy.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || pharmacy.status === selectedStatus;
    const matchesSearch = searchTerm === '' || 
      pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRegion && matchesType && matchesStatus && matchesSearch;
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

  const handleExport = (format: 'excel' | 'pdf', options: any) => {
    const exportData = sortedPharmacies.map(p => ({
      name: p.name,
      code: p.code,
      city: p.city,
      region: p.region,
      type: p.type,
      status: p.status,
      phone: options.includeContacts ? p.phone : '',
      email: options.includeContacts ? p.email : '',
      messages_sent: options.includeMetrics ? p.metrics.messages_sent : 0,
      active_channels: options.includeMetrics ? p.metrics.active_channels : 0
    }));

    if (exportType === 'pharmacies') {
      format === 'excel' ? exportPharmaciesExcel(exportData) : exportPharmaciesPDF(exportData);
    } else if (exportType === 'analytics') {
      format === 'excel' ? exportAnalyticsExcel(analyticsData, 'all') : exportAnalyticsPDF(analyticsData, 'all');
    } else {
      exportCollaborationsExcel(collaborations.map(c => ({
        name: c.name,
        description: c.description,
        participants_count: c.participants_count,
        status: c.status,
        created_at: c.created_at
      })));
    }
  };

  const handlePharmacyClick = (pharmacy: any) => {
    setSelectedPharmacy(pharmacy);
    setPharmacyModalOpen(true);
  };

  const handleCollaborationClick = (collab: any) => {
    setSelectedCollaboration(collab);
    setCollaborationModalOpen(true);
  };

  const resetFilters = () => {
    setSelectedRegion('all');
    setSelectedType('all');
    setSelectedStatus('all');
    setSearchTerm('');
    setSortBy('name');
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
      {/* Header */}
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
                <div className="text-2xl font-bold">{networkStats.activePharmacies}</div>
                <p className="text-xs text-muted-foreground">Sur {networkStats.totalPharmacies} officines</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages Total</CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{networkStats.totalMessages.toLocaleString('fr-FR')}</div>
                <p className="text-xs text-muted-foreground">+{networkStats.todayMessages} aujourd'hui</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Régions</CardTitle>
                <MapPin className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{networkStats.regionsCount}</div>
                <p className="text-xs text-muted-foreground">Régions couvertes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disponibilité</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{networkStats.networkAvailability}%</div>
                <p className="text-xs text-muted-foreground">Réseau opérationnel</p>
              </CardContent>
            </Card>
          </div>

          {/* Répartition par région */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Répartition par Région
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {regionStats.map((region) => (
                  <div key={region.region} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{region.region}</h4>
                      <Badge variant="outline">{region.pharmacyCount}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {region.pharmacies.slice(0, 3).map(p => (
                        <div key={p.id} className="flex items-center gap-2">
                          {getTypeIcon(p.type)}
                          <span className="truncate">{p.name}</span>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(p.status)}`} />
                        </div>
                      ))}
                      {region.pharmacies.length > 3 && (
                        <p className="text-xs">+{region.pharmacies.length - 3} autres</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {region.messageCount} messages
                    </p>
                  </div>
                ))}
                {regionStats.length === 0 && (
                  <div className="col-span-3 text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune région définie</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activité Récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentActivities.slice(0, 5).map((activity, idx) => (
                  <div key={activity.id || idx} className="flex items-center gap-3 p-2 border rounded">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">Aucune activité récente</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Annuaire */}
        <TabsContent value="directory" className="space-y-4">
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
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Région" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {types.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="activity">Activité récente</SelectItem>
                    <SelectItem value="messages">Messages envoyés</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Annuaire des Officines
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setExportType('pharmacies'); setExportDialogOpen(true); }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {sortedPharmacies.map((pharmacy) => (
                    <div 
                      key={pharmacy.id} 
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handlePharmacyClick(pharmacy)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(pharmacy.type)}
                              <h3 className="font-semibold">{pharmacy.name}</h3>
                            </div>
                            {pharmacy.code && <Badge variant="outline" className="text-xs">{pharmacy.code}</Badge>}
                            {pharmacy.is_inter_tenant && (
                              <Badge variant="secondary" className="text-xs">Inter-réseau</Badge>
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
                              <div className="font-semibold text-blue-600">{pharmacy.metrics.messages_sent}</div>
                              <div className="text-xs text-muted-foreground">Messages</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-green-600">{pharmacy.metrics.active_channels}</div>
                              <div className="text-xs text-muted-foreground">Canaux</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); handlePharmacyClick(pharmacy); }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {pharmacy.id !== tenantId && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); startConversationWith(pharmacy.id); }}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
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
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => { setExportType('analytics'); setExportDialogOpen(true); }}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter Analytics
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Officines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top 10 Officines par Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.topPharmacies} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="messages" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribution par type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Répartition par Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.typeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percentage }) => `${type} (${percentage}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.typeDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Évolution mensuelle */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Évolution Mensuelle de l'Activité</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.monthlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="messages" stroke="#3b82f6" name="Messages" />
                    <Line type="monotone" dataKey="collaborations" stroke="#10b981" name="Collaborations" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tableau comparatif */}
          <Card>
            <CardHeader>
              <CardTitle>Tableau Comparatif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Officine</th>
                      <th className="text-center p-2">Messages</th>
                      <th className="text-center p-2">Canaux</th>
                      <th className="text-center p-2">Type</th>
                      <th className="text-center p-2">Région</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pharmacies.slice(0, 10).map(p => (
                      <tr key={p.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{p.name}</td>
                        <td className="p-2 text-center">{p.metrics.messages_sent}</td>
                        <td className="p-2 text-center">{p.metrics.active_channels}</td>
                        <td className="p-2 text-center"><Badge variant="outline">{p.type}</Badge></td>
                        <td className="p-2 text-center">{p.region}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coordination */}
        <TabsContent value="coordination" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Projets Inter-Officines</h3>
              <p className="text-sm text-muted-foreground">
                {collaborations.length} collaborations actives
              </p>
            </div>
            <Button onClick={() => setCreateCollabDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Projet
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {collaborations.length > 0 ? (
                <div className="space-y-4">
                  {collaborations.map((collab) => (
                    <div 
                      key={collab.id} 
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleCollaborationClick(collab)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{collab.name}</h4>
                        <Badge variant={collab.status === 'active' ? 'default' : 'secondary'}>
                          {collab.status === 'active' ? 'Actif' : collab.status}
                        </Badge>
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
                      {collab.participants && collab.participants.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {collab.participants.slice(0, 3).map((p, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {p.pharmacy_name}
                            </Badge>
                          ))}
                          {collab.participants.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{collab.participants.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun projet inter-officines en cours</p>
                  <p className="text-sm">Créez une collaboration pour démarrer</p>
                  <Button className="mt-4" onClick={() => setCreateCollabDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une collaboration
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PharmacyDetailModal
        open={pharmacyModalOpen}
        onOpenChange={setPharmacyModalOpen}
        pharmacy={selectedPharmacy}
        onStartConversation={startConversationWith}
      />

      <CollaborationDetailModal
        open={collaborationModalOpen}
        onOpenChange={setCollaborationModalOpen}
        collaboration={selectedCollaboration}
        onUpdate={loadAllData}
        onDelete={deleteCollaboration}
        onLeave={leaveCollaboration}
      />

      <ExportOptionsDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        exportType={exportType}
        onExport={handleExport}
      />

      <CreateCollaborationDialog
        open={createCollabDialogOpen}
        onOpenChange={setCreateCollabDialogOpen}
        onSuccess={loadAllData}
      />
    </div>
  );
};

export default MultiPharmacyManagement;
