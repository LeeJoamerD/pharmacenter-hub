import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BarChart, TrendingUp, TrendingDown, Minus, Building2, Shield, RefreshCw, Clock, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

interface Metric {
  title: string;
  value: string;
  target?: number;
  current?: number;
  description?: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ElementType;
  color: string;
}

const NetworkMetrics = () => {
  const { currentTenant } = useTenant();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [systemOk, setSystemOk] = useState<boolean>(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [currentTenant?.id]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Mesure latence réelle via ping RPC
      const t0 = performance.now();
      const { data: globalStats, error: statsError } = await supabase.rpc('get_network_global_stats');
      const latency = Math.round(performance.now() - t0);

      if (statsError) {
        setSystemOk(false);
        throw statsError;
      }
      setSystemOk(true);

      const s = (globalStats as any) || {};
      const todayMessages = s.today_messages || 0;
      const totalMessages = s.total_messages || 0;
      const activePharmacies = s.active_pharmacies || 0;
      const totalPharmacies = s.total_pharmacies || 0;

      // Vérification réelle de la sécurité (TLS/HTTPS)
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
      const tlsActive = supabaseUrl.startsWith('https://');

      setMetrics([
        {
          title: "Officines Actives",
          value: `${activePharmacies} / ${totalPharmacies}`,
          target: totalPharmacies || 1,
          current: activePharmacies,
          description: totalPharmacies > 0
            ? `${Math.round((activePharmacies / totalPharmacies) * 100)}% du réseau actif`
            : 'Aucune officine enregistrée',
          trend: activePharmacies === totalPharmacies ? 'up' : activePharmacies > 0 ? 'stable' : 'down',
          icon: Building2,
          color: activePharmacies === totalPharmacies ? "text-green-600" : "text-blue-600"
        },
        {
          title: "Latence Réseau",
          value: `${latency} ms`,
          description: latency < 200 ? "Excellente" : latency < 500 ? "Correcte" : "Élevée",
          trend: latency < 200 ? 'up' : latency < 500 ? 'stable' : 'down',
          icon: Zap,
          color: latency < 200 ? "text-green-600" : latency < 500 ? "text-blue-600" : "text-orange-600"
        },
        {
          title: "Messages/Jour",
          value: todayMessages.toLocaleString('fr-FR'),
          description: `Total: ${totalMessages.toLocaleString('fr-FR')}`,
          trend: todayMessages > 0 ? 'up' : 'stable',
          icon: BarChart,
          color: "text-purple-600"
        },
        {
          title: "Sécurité",
          value: tlsActive ? "TLS actif" : "Non sécurisé",
          description: tlsActive ? "Connexion chiffrée HTTPS + RLS" : "Connexion non chiffrée",
          trend: tlsActive ? 'up' : 'down',
          icon: Shield,
          color: tlsActive ? "text-green-600" : "text-red-600"
        }
      ]);

      setLastCheck(new Date());
    } catch (error) {
      console.error('Erreur chargement métriques:', error);
      setSystemOk(false);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />;
      default: return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            <CardTitle>Métriques Réseau</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={loadMetrics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Performance temps réel du réseau PharmaSoft
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-1/4" />
                </div>
                <div className="h-2 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {metrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <metric.icon className={`h-4 w-4 ${metric.color}`} />
                    <span className="text-sm font-medium">{metric.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.trend)}
                    <span className={`text-sm font-bold ${getTrendColor(metric.trend)}`}>
                      {metric.value}
                    </span>
                  </div>
                </div>

                {metric.target && metric.current !== undefined && (
                  <div className="space-y-1">
                    <Progress value={(metric.current / metric.target) * 100} className="h-2" />
                  </div>
                )}

                {metric.description && (
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <div className={`h-2 w-2 rounded-full animate-pulse ${systemOk ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-muted-foreground">
                {systemOk ? 'Système opérationnel' : 'Système indisponible'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {lastCheck.toLocaleTimeString('fr-FR')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkMetrics;
