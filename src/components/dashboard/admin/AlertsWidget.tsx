import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Clock, Activity, Info, RefreshCw, Eye, CheckCircle } from 'lucide-react';
import { useSystemAlerts } from '@/hooks/useSystemAlerts';

const AlertsWidget = () => {
  const { 
    alerts, 
    isLoading, 
    resolveAlert, 
    acknowledgeAlert,
    refetch,
    getSeverityColor,
    getAlertStats 
  } = useSystemAlerts();

  const stats = getAlertStats();

  const handleResolveAlert = async (alertId: string, type: 'security_alert' | 'security_incident') => {
    await resolveAlert(alertId, type, 'Résolu depuis le dashboard');
  };

  const handleAcknowledgeAlert = async (alertId: string, type: 'security_alert' | 'security_incident') => {
    await acknowledgeAlert(alertId, type);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertes Système</CardTitle>
          <CardDescription>Surveillance des événements critiques</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 border rounded-lg">
                <div className="h-10 w-10 bg-muted rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Alertes Système</CardTitle>
          <CardDescription>
            {stats.total > 0 
              ? `${stats.total} alerte${stats.total > 1 ? 's' : ''} active${stats.total > 1 ? 's' : ''}`
              : 'Aucune alerte active'
            }
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p>Aucune alerte système active</p>
            <p className="text-sm">Tous les systèmes fonctionnent normalement</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => {
              const IconComponent = alert.icon;
              return (
                <div key={alert.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`p-2 rounded-full bg-muted ${alert.iconColor}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm truncate">{alert.title}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge 
                          variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                          className={`text-xs ${getSeverityColor(alert.severity)}`}
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{alert.time}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleAcknowledgeAlert(alert.id, alert.type as any)}
                        className="h-6 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Acquitter
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id, alert.type as any)}
                        className="h-6 px-2 text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Résoudre
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {alerts.length > 5 && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  ... et {alerts.length - 5} autre{alerts.length - 5 > 1 ? 's' : ''} alerte{alerts.length - 5 > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsWidget;