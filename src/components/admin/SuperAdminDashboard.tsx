import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, 
  Users, 
  AlertTriangle, 
  Activity, 
  DollarSign, 
  TrendingUp,
  Shield,
  Clock,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  // Charger toutes les pharmacies
  const { data: pharmacies, isLoading: loadingPharmacies } = useQuery({
    queryKey: ['all-pharmacies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Charger les statistiques globales
  const { data: globalStats } = useQuery({
    queryKey: ['global-stats'],
    queryFn: async () => {
      const [pharmaciesCount, personnelCount, alertsCount] = await Promise.all([
        supabase.from('pharmacies').select('id', { count: 'exact' }),
        supabase.from('personnel').select('id', { count: 'exact' }),
        supabase.from('security_alerts').select('id', { count: 'exact' }).eq('resolved', false)
      ]);

      return {
        totalPharmacies: pharmaciesCount.count || 0,
        totalPersonnel: personnelCount.count || 0,
        activeAlerts: alertsCount.count || 0
      };
    }
  });

  // Charger les alertes récentes
  const { data: recentAlerts } = useQuery({
    queryKey: ['recent-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_alerts')
        .select(`
          *,
          pharmacy:pharmacies(name, code)
        `)
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  // Charger l'activité récente
  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          pharmacy:pharmacies(name, code),
          personnel:personnel(noms, prenoms)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'maintenance': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Super Admin</h2>
          <p className="text-muted-foreground">
            Vue d'ensemble du réseau PharmaSoft
          </p>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pharmacies Actives</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats?.totalPharmacies || 0}</div>
            <p className="text-xs text-muted-foreground">
              +2 depuis le mois dernier
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats?.totalPersonnel || 0}</div>
            <p className="text-xs text-muted-foreground">
              +15 cette semaine
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Actives</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{globalStats?.activeAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Mensuel</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€4,500</div>
            <p className="text-xs text-muted-foreground">
              +12% vs mois précédent
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pharmacies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pharmacies">
            <Building2 className="mr-2 h-4 w-4" />
            Pharmacies
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Shield className="mr-2 h-4 w-4" />
            Alertes Sécurité
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            Activité Récente
          </TabsTrigger>
          <TabsTrigger value="billing">
            <DollarSign className="mr-2 h-4 w-4" />
            Facturation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pharmacies">
          <Card>
            <CardHeader>
              <CardTitle>Pharmacies du Réseau</CardTitle>
              <CardDescription>
                Gestion et monitoring des pharmacies connectées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPharmacies ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : pharmacies?.map((pharmacy) => (
                    <TableRow key={pharmacy.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{pharmacy.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Créée le {new Date(pharmacy.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{pharmacy.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {pharmacy.city}, {pharmacy.region}
                          </div>
                          {pharmacy.quartier && (
                            <div className="text-muted-foreground">
                              {pharmacy.quartier}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {pharmacy.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {pharmacy.email}
                            </div>
                          )}
                          {pharmacy.telephone_appel && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {pharmacy.telephone_appel}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {pharmacy.type || 'Standard'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(pharmacy.status || 'active')}>
                          {pharmacy.status || 'Actif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Gérer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertes de Sécurité</CardTitle>
              <CardDescription>
                Incidents de sécurité nécessitant une attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAlerts?.map((alert) => (
                  <Alert key={alert.id} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{alert.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {alert.pharmacy?.name} ({alert.pharmacy?.code}) - {new Date(alert.created_at).toLocaleString('fr-FR')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Résoudre
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
                {(!recentAlerts || recentAlerts.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    Aucune alerte de sécurité active
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
              <CardDescription>
                Dernières actions effectuées dans le système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity?.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          {activity.action} sur {activity.table_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activity.personnel?.prenoms} {activity.personnel?.noms} - {activity.pharmacy?.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>
                ))}
                {(!recentActivity || recentActivity.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    Aucune activité récente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Gestion de la Facturation</CardTitle>
              <CardDescription>
                Suivi des abonnements et revenus par pharmacie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Module de facturation en développement
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminDashboard;