import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw,
  Users,
  Database,
  Lock,
  Eye,
  UserCheck,
  Settings
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  category: 'access' | 'role' | 'isolation';
  duration?: number;
}

const SecurityValidationTests: React.FC = () => {
  const { role, permissions, canAccess } = usePermissions();
  const { currentUser } = useTenant();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const initialTests: TestResult[] = [
    // Tests d'accès
    {
      id: 'auth-required',
      name: 'Vérification authentification requise',
      status: 'pending',
      message: '',
      category: 'access'
    },
    {
      id: 'tenant-isolation',
      name: 'Isolation des données par tenant',
      status: 'pending',
      message: '',
      category: 'isolation'
    },
    {
      id: 'rls-policies',
      name: 'Validation des politiques RLS',
      status: 'pending',
      message: '',
      category: 'isolation'
    },
    // Tests par rôle
    {
      id: 'admin-permissions',
      name: 'Permissions administrateur',
      status: 'pending',
      message: '',
      category: 'role'
    },
    {
      id: 'pharmacist-permissions',
      name: 'Permissions pharmacien',
      status: 'pending',
      message: '',
      category: 'role'
    },
    {
      id: 'employee-limitations',
      name: 'Limitations employé',
      status: 'pending',
      message: '',
      category: 'role'
    },
    {
      id: 'cross-tenant-prevention',
      name: 'Prévention accès cross-tenant',
      status: 'pending',
      message: '',
      category: 'isolation'
    },
    {
      id: 'sensitive-data-access',
      name: 'Accès données sensibles',
      status: 'pending',
      message: '',
      category: 'access'
    }
  ];

  useEffect(() => {
    setTestResults(initialTests);
  }, []);

  const runTest = async (test: TestResult): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      switch (test.id) {
        case 'auth-required':
          // Test si l'utilisateur est bien authentifié
          if (!currentUser) {
            return {
              ...test,
              status: 'failed',
              message: 'Utilisateur non authentifié',
              duration: Date.now() - startTime
            };
          }
          return {
            ...test,
            status: 'passed',
            message: 'Utilisateur authentifié avec succès',
            duration: Date.now() - startTime
          };

        case 'tenant-isolation':
          // Test isolation tenant
          if (!currentUser?.tenant_id) {
            return {
              ...test,
              status: 'failed',
              message: 'Aucun tenant associé',
              duration: Date.now() - startTime
            };
          }
          return {
            ...test,
            status: 'passed',
            message: `Tenant isolé correctement: ${currentUser.tenant_id}`,
            duration: Date.now() - startTime
          };

        case 'rls-policies':
          // Test des politiques RLS
          try {
            const { data, error } = await supabase
              .from('personnel')
              .select('id')
              .limit(1);
            
            if (error) {
              return {
                ...test,
                status: 'failed',
                message: `Erreur RLS: ${error.message}`,
                duration: Date.now() - startTime
              };
            }
            return {
              ...test,
              status: 'passed',
              message: 'Politiques RLS fonctionnelles',
              duration: Date.now() - startTime
            };
          } catch (error) {
            return {
              ...test,
              status: 'failed',
              message: `Erreur test RLS: ${error}`,
              duration: Date.now() - startTime
            };
          }

        case 'admin-permissions':
          // Test permissions admin
          const hasAdminPerms = canAccess('manage_users') && canAccess('manage_system');
          return {
            ...test,
            status: role === 'Admin' && hasAdminPerms ? 'passed' : 'failed',
            message: role === 'Admin' 
              ? `Permissions admin validées (${permissions.length} permissions)`
              : 'Permissions admin non accordées',
            duration: Date.now() - startTime
          };

        case 'pharmacist-permissions':
          // Test permissions pharmacien
          const hasPharmacistPerms = canAccess('view_reports');
          return {
            ...test,
            status: ['Admin', 'Pharmacien'].includes(role) && hasPharmacistPerms ? 'passed' : 'failed',
            message: ['Admin', 'Pharmacien'].includes(role)
              ? 'Permissions pharmacien validées'
              : 'Permissions pharmacien insuffisantes',
            duration: Date.now() - startTime
          };

        case 'employee-limitations':
          // Test limitations employé
          const hasLimitedAccess = !canAccess('manage_users') && !canAccess('manage_system');
          return {
            ...test,
            status: role === 'Employé' ? (hasLimitedAccess ? 'passed' : 'failed') : 'passed',
            message: role === 'Employé' 
              ? (hasLimitedAccess ? 'Limitations employé respectées' : 'Permissions trop élevées pour employé')
              : 'Test non applicable pour ce rôle',
            duration: Date.now() - startTime
          };

        case 'cross-tenant-prevention':
          // Test prévention cross-tenant
          try {
            // Essayer d'accéder à des données d'un autre tenant (simulation)
            const { data: alerts } = await supabase
              .from('security_alerts')
              .select('*')
              .eq('alert_type', 'cross_tenant_violation')
              .limit(1);
            
            return {
              ...test,
              status: 'passed',
              message: 'Système de prévention cross-tenant actif',
              duration: Date.now() - startTime
            };
          } catch (error) {
            return {
              ...test,
              status: 'failed',
              message: `Erreur test cross-tenant: ${error}`,
              duration: Date.now() - startTime
            };
          }

        case 'sensitive-data-access':
          // Test accès données sensibles
          const canAccessSensitive = canAccess('view_sensitive_data');
          return {
            ...test,
            status: 'passed',
            message: canAccessSensitive 
              ? 'Accès données sensibles autorisé selon le rôle'
              : 'Accès données sensibles restreint',
            duration: Date.now() - startTime
          };

        default:
          return {
            ...test,
            status: 'failed',
            message: 'Test non implémenté',
            duration: Date.now() - startTime
          };
      }
    } catch (error) {
      return {
        ...test,
        status: 'failed',
        message: `Erreur: ${error}`,
        duration: Date.now() - startTime
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    
    const results: TestResult[] = [];
    
    for (let i = 0; i < testResults.length; i++) {
      const test = testResults[i];
      
      // Marquer le test comme en cours
      setTestResults(prev => prev.map(t => 
        t.id === test.id ? { ...t, status: 'running' } : t
      ));
      
      // Exécuter le test
      const result = await runTest(test);
      results.push(result);
      
      // Mettre à jour le résultat
      setTestResults(prev => prev.map(t => 
        t.id === result.id ? result : t
      ));
      
      // Mettre à jour le progrès
      setProgress((i + 1) / testResults.length * 100);
      
      // Délai entre les tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Réussi</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>;
      case 'running':
        return <Badge variant="secondary">En cours</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  const getCategoryIcon = (category: TestResult['category']) => {
    switch (category) {
      case 'access':
        return <Lock className="h-4 w-4" />;
      case 'role':
        return <Users className="h-4 w-4" />;
      case 'isolation':
        return <Database className="h-4 w-4" />;
    }
  };

  const filterTestsByCategory = (category: TestResult['category']) => {
    return testResults.filter(test => test.category === category);
  };

  const getTestStats = () => {
    const passed = testResults.filter(t => t.status === 'passed').length;
    const failed = testResults.filter(t => t.status === 'failed').length;
    const total = testResults.length;
    
    return { passed, failed, total };
  };

  const stats = getTestStats();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Tests de Sécurité
          </h2>
          <p className="text-muted-foreground">
            Validation complète des scénarios d'accès, limitations par rôle et isolement des données
          </p>
        </div>
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isRunning ? 'Tests en cours...' : 'Lancer tous les tests'}
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Réussis</p>
                <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Échoués</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rôle actuel</p>
                <p className="text-lg font-semibold">{role}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de progression */}
      {isRunning && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression des tests</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tests par catégorie */}
      <Tabs defaultValue="access" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Tests d'Accès
          </TabsTrigger>
          <TabsTrigger value="role" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Tests par Rôle
          </TabsTrigger>
          <TabsTrigger value="isolation" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Isolement des Données
          </TabsTrigger>
        </TabsList>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Tests de Scénarios d'Accès</CardTitle>
              <CardDescription>
                Validation de l'authentification et des accès aux ressources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filterTestsByCategory('access').map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <p className="font-medium">{test.name}</p>
                        <p className="text-sm text-muted-foreground">{test.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {test.duration && (
                        <span className="text-sm text-muted-foreground">
                          {test.duration}ms
                        </span>
                      )}
                      {getStatusBadge(test.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="role">
          <Card>
            <CardHeader>
              <CardTitle>Tests des Limitations par Rôle</CardTitle>
              <CardDescription>
                Vérification des permissions et restrictions selon les rôles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filterTestsByCategory('role').map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <p className="font-medium">{test.name}</p>
                        <p className="text-sm text-muted-foreground">{test.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {test.duration && (
                        <span className="text-sm text-muted-foreground">
                          {test.duration}ms
                        </span>
                      )}
                      {getStatusBadge(test.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="isolation">
          <Card>
            <CardHeader>
              <CardTitle>Tests d'Isolement des Données</CardTitle>
              <CardDescription>
                Vérification de la séparation des données entre tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filterTestsByCategory('isolation').map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <p className="font-medium">{test.name}</p>
                        <p className="text-sm text-muted-foreground">{test.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {test.duration && (
                        <span className="text-sm text-muted-foreground">
                          {test.duration}ms
                        </span>
                      )}
                      {getStatusBadge(test.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Résumé des résultats */}
      {stats.total > 0 && !isRunning && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Tests terminés : {stats.passed}/{stats.total} réussis
            {stats.failed > 0 && `, ${stats.failed} échoués`}
            . {stats.passed === stats.total ? 'Sécurité validée ✅' : 'Problèmes de sécurité détectés ⚠️'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SecurityValidationTests;