import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Shield, FileX, UserX } from 'lucide-react';

const AlertsWidget = () => {
  const alerts = [
    {
      icon: Clock,
      type: 'warning',
      title: 'Certifications expirantes',
      message: '3 certifications expirent dans les 30 jours',
      time: 'Il y a 2h',
      severity: 'medium'
    },
    {
      icon: Shield,
      type: 'error',
      title: 'Tentative de connexion suspecte',
      message: 'Plusieurs échecs de connexion détectés',
      time: 'Il y a 15min',
      severity: 'high'
    },
    {
      icon: FileX,
      type: 'warning',
      title: 'Documents manquants',
      message: '5 dossiers personnel incomplets',
      time: 'Il y a 1h',
      severity: 'medium'
    },
    {
      icon: UserX,
      type: 'info',
      title: 'Session expirée',
      message: 'Utilisateur Dr. Martin déconnecté automatiquement',
      time: 'Il y a 3h',
      severity: 'low'
    },
    {
      icon: AlertTriangle,
      type: 'warning',
      title: 'Sauvegarde en retard',
      message: 'Dernière sauvegarde il y a 25h',
      time: 'Il y a 30min',
      severity: 'medium'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-amber-500';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Alertes Système
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {alerts.map((alert, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
              <alert.icon className={`h-4 w-4 mt-0.5 ${getAlertIcon(alert.severity)}`} />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <Badge variant={getSeverityColor(alert.severity) as any} className="text-xs">
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
                <p className="text-xs text-muted-foreground">{alert.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertsWidget;