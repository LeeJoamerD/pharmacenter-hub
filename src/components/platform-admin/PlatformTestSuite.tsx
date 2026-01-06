import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Zap, 
  Database, 
  TestTube, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Lock,
  Building
} from 'lucide-react';
import SecurityTestSuite from './SecurityTestSuite';
import PerformanceTestSuite from './PerformanceTestSuite';
import TestDataManager from './TestDataManager';

const PlatformTestSuite = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');

  // Charger la liste des tenants (pharmacies)
  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['all-tenants-for-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const testSuites = [
    {
      id: 'security',
      name: 'Tests de Sécurité',
      description: 'Validation des entrées, protection contre l\'injection SQL, isolation multi-tenant',
      icon: Shield,
      color: 'bg-red-100 text-red-800',
      status: 'ready',
      tests: 15,
      category: 'Sécurité'
    },
    {
      id: 'performance',
      name: 'Tests de Performance',
      description: 'Temps de réponse, gestion de charge, optimisation des requêtes',
      icon: Zap,
      color: 'bg-yellow-100 text-yellow-800',
      status: 'ready',
      tests: 8,
      category: 'Performance'
    },
    {
      id: 'data-manager',
      name: 'Gestionnaire de Données',
      description: 'Génération et gestion des données de test pour validation',
      icon: Database,
      color: 'bg-blue-100 text-blue-800',
      status: 'ready',
      tests: 5,
      category: 'Données'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running': return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TestTube className="h-8 w-8 text-blue-600" />
            Suite de Tests Plateforme
          </h1>
          <p className="text-muted-foreground mt-2">
            Tests complets de sécurité, performance et validation des données
          </p>
        </div>
      </div>

      {/* Sélecteur de tenant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Sélection du Tenant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un tenant pour les tests..." />
                </SelectTrigger>
                <SelectContent>
                  {tenantsLoading ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Chargement...
                    </div>
                  ) : tenants && tenants.length > 0 ? (
                    tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Aucun tenant disponible
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedTenantId && (
              <Badge variant="default" className="font-mono text-xs">
                {selectedTenantId.slice(0, 8)}...
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedTenantId && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <h4 className="font-medium text-amber-900">Tenant requis</h4>
                <p className="text-sm text-amber-800">
                  Veuillez sélectionner un tenant pour exécuter les tests.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="data-manager" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Données de Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testSuites.map((suite) => {
              const IconComponent = suite.icon;
              return (
                <Card key={suite.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${suite.color.replace('text-', 'bg-').replace('800', '100')}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{suite.name}</CardTitle>
                          <Badge className={suite.color} variant="secondary">
                            {suite.category}
                          </Badge>
                        </div>
                      </div>
                      {getStatusIcon(suite.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {suite.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">{suite.tests}</span> tests disponibles
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setActiveTab(suite.id)}
                        disabled={!selectedTenantId}
                      >
                        Ouvrir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Informations système */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Informations Système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Multi-tenant</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Isolation des données par tenant
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Sécurisé</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Protection contre les injections
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Optimisé</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Requêtes haute performance
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TestTube className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Testé</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Couverture de tests complète
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guide d'utilisation */}
          <Card>
            <CardHeader>
              <CardTitle>Guide d'Utilisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Sélectionner un Tenant</h4>
                    <p className="text-sm text-muted-foreground">
                      Choisissez la pharmacie sur laquelle vous souhaitez exécuter les tests.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Tests de Sécurité</h4>
                    <p className="text-sm text-muted-foreground">
                      Validez la protection contre les injections SQL, la validation des entrées et l'isolation multi-tenant.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Tests de Performance</h4>
                    <p className="text-sm text-muted-foreground">
                      Mesurez les temps de réponse et validez les optimisations avec différents scénarios de charge.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <SecurityTestSuite tenantId={selectedTenantId} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceTestSuite tenantId={selectedTenantId} />
        </TabsContent>

        <TabsContent value="data-manager">
          <TestDataManager tenantId={selectedTenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlatformTestSuite;
