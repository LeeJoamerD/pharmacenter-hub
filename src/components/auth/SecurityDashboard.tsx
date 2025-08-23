import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Clock, 
  Computer, 
  Lock,
  TrendingUp
} from 'lucide-react';

interface SecurityStats {
  activeSessions: number;
  recentAttempts: number;
  securityAlerts: number;
  riskScore: number;
}

interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  failure_reason?: string;
  ip_address?: string;
  created_at: string;
}

interface UserSession {
  id: string;
  ip_address?: string;
  user_agent?: string;
  risk_score: number;
  security_level: string;
  last_activity: string;
  created_at: string;
}

export const SecurityDashboard: React.FC = () => {
  const { personnel, pharmacy } = useAuth();
  const [stats, setStats] = useState<SecurityStats>({
    activeSessions: 0,
    recentAttempts: 0,
    securityAlerts: 0,
    riskScore: 0
  });
  const [recentAttempts, setRecentAttempts] = useState<LoginAttempt[]>([]);
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (personnel?.id && pharmacy?.id) {
      loadSecurityData();
    }
  }, [personnel?.id, pharmacy?.id]);

  const loadSecurityData = async () => {
    if (!personnel?.id || !pharmacy?.id) return;

    try {
      setLoading(true);

      // Charger les statistiques de sécurité
      const [sessionsResult, attemptsResult, alertsResult] = await Promise.all([
        supabase
          .from('user_sessions')
          .select('*')
          .eq('personnel_id', personnel.id)
          .eq('is_active', true),
        
        supabase
          .from('login_attempts')
          .select('*')
          .eq('tenant_id', pharmacy.id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('security_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', pharmacy.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      if (sessionsResult.data) {
        setActiveSessions(sessionsResult.data);
        setStats(prev => ({
          ...prev,
          activeSessions: sessionsResult.data.length,
          riskScore: Math.max(...sessionsResult.data.map(s => s.risk_score), 0)
        }));
      }

      if (attemptsResult.data) {
        setRecentAttempts(attemptsResult.data);
        setStats(prev => ({
          ...prev,
          recentAttempts: attemptsResult.data.length
        }));
      }

      if (alertsResult.count !== null) {
        setStats(prev => ({
          ...prev,
          securityAlerts: alertsResult.count || 0
        }));
      }

    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeVariant = (score: number) => {
    if (score < 20) return 'default';
    if (score < 40) return 'secondary';
    if (score < 60) return 'destructive';
    return 'destructive';
  };

  const getRiskLabel = (score: number) => {
    if (score < 20) return 'Faible';
    if (score < 40) return 'Modéré';
    if (score < 60) return 'Élevé';
    return 'Critique';
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'basic': return 'bg-green-100 text-green-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'elevated': return 'bg-orange-100 text-orange-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);
      
      if (error) {
        console.error('RLS Error:', error);
        // Vérifier si c'est une erreur RLS
        if (error.message.includes('row-level security')) {
          alert('Vous devez être Admin ou Pharmacien pour terminer les sessions.');
          return;
        }
        throw error;
      }
      
      alert('Session terminée avec succès');
      loadSecurityData();
    } catch (error) {
      console.error('Error terminating session:', error);
      alert('Erreur lors de la terminaison de la session');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques de sécurité */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Computer className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sessions actives</p>
                <p className="text-2xl font-bold">{stats.activeSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tentatives récentes</p>
                <p className="text-2xl font-bold">{stats.recentAttempts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertes sécurité</p>
                <p className="text-2xl font-bold">{stats.securityAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score de risque</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold">{stats.riskScore}</p>
                  <Badge variant={getRiskBadgeVariant(stats.riskScore)}>
                    {getRiskLabel(stats.riskScore)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions actives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sessions actives
          </CardTitle>
          <CardDescription>
            Gérez vos sessions de connexion actives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucune session active
              </p>
            ) : (
              activeSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Computer className="h-4 w-4" />
                      <span className="font-medium">
                        {session.user_agent?.split(' ')[0] || 'Navigateur inconnu'}
                      </span>
                      <Badge className={getSecurityLevelColor(session.security_level)}>
                        {session.security_level}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      IP: {session.ip_address || 'Non disponible'} • 
                      Risque: {session.risk_score} • 
                      Dernière activité: {new Date(session.last_activity).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => terminateSession(session.id)}
                  >
                    Terminer
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tentatives de connexion récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Tentatives de connexion récentes
          </CardTitle>
          <CardDescription>
            Activité de connexion des dernières 24 heures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAttempts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucune tentative récente
              </p>
            ) : (
              recentAttempts.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${attempt.success ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-medium">{attempt.email}</span>
                      <Badge variant={attempt.success ? 'default' : 'destructive'}>
                        {attempt.success ? 'Succès' : 'Échec'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {attempt.ip_address && `IP: ${attempt.ip_address} • `}
                      {new Date(attempt.created_at).toLocaleString()}
                      {attempt.failure_reason && ` • ${attempt.failure_reason}`}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alertes de sécurité */}
      {stats.riskScore > 40 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Votre score de risque est élevé ({stats.riskScore}). 
            Considérez l'activation de l'authentification à deux facteurs 
            et la vérification de vos sessions actives.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};