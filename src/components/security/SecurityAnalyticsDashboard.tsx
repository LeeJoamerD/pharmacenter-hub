import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import type { Database } from "@/integrations/supabase/types";

type SecurityAlert = Database['public']['Tables']['security_alerts']['Row'];

const SecurityAnalyticsDashboard = () => {
  const { personnel } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!personnel) return;

      try {
        const { data } = await supabase
          .from('security_alerts')
          .select('*')
          .eq('tenant_id', personnel.tenant_id)
          .order('created_at', { ascending: false });

        setAlerts(data || []);
      } catch (error) {
        console.error('Erreur chargement analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [personnel]);

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  const totalAlerts = alerts.length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length;
  const resolutionRate = totalAlerts > 0 ? Math.round((resolvedAlerts / totalAlerts) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Analytics de Sécurité
        </h2>
        <p className="text-muted-foreground">
          Analyse des incidents et performances de sécurité
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alertes</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlerts}</div>
            <p className="text-xs text-muted-foreground">Toutes périodes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">Haute priorité</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Résolution</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">{resolvedAlerts} résolues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">État Système</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {criticalAlerts === 0 ? '✓' : '⚠'}
            </div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts === 0 ? 'Sécurisé' : 'Attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aperçu des Alertes</CardTitle>
          <CardDescription>Répartition par niveau de sévérité</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['critical', 'high', 'medium', 'low'].map(severity => {
              const count = alerts.filter(a => a.severity === severity).length;
              const percentage = totalAlerts > 0 ? (count / totalAlerts) * 100 : 0;
              
              return (
                <div key={severity} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      severity === 'critical' || severity === 'high' ? 'destructive' : 
                      severity === 'medium' ? 'secondary' : 'outline'
                    }>
                      {severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold">{count}</div>
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityAnalyticsDashboard;