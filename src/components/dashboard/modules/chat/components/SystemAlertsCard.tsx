import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Eye, 
  Archive,
  Bell,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface SystemAlert {
  id: string;
  action_type: string;
  action_category: string;
  target_type?: string;
  target_name?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  is_reviewed: boolean;
  created_at: string;
  details?: any;
}

interface SystemAlertsCardProps {
  alerts: SystemAlert[];
  onMarkAsReviewed: (alertId: string) => Promise<void>;
  onArchive?: (alertId: string) => Promise<void>;
  loading?: boolean;
}

const SystemAlertsCard = ({
  alerts,
  onMarkAsReviewed,
  onArchive,
  loading = false
}: SystemAlertsCardProps) => {
  const [filter, setFilter] = useState<string>('all');
  const [processing, setProcessing] = useState<string | null>(null);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      critical: { bg: 'bg-red-100', text: 'text-red-800' },
      error: { bg: 'bg-red-50', text: 'text-red-700' },
      warning: { bg: 'bg-orange-100', text: 'text-orange-800' },
      info: { bg: 'bg-blue-100', text: 'text-blue-800' }
    };
    const style = variants[severity] || variants.info;
    return (
      <Badge className={`${style.bg} ${style.text} border-0`}>
        {severity}
      </Badge>
    );
  };

  const handleMarkReviewed = async (alertId: string) => {
    setProcessing(alertId);
    try {
      await onMarkAsReviewed(alertId);
    } finally {
      setProcessing(null);
    }
  };

  const handleArchive = async (alertId: string) => {
    if (!onArchive) return;
    setProcessing(alertId);
    try {
      await onArchive(alertId);
    } finally {
      setProcessing(null);
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !alert.is_reviewed;
    if (filter === 'critical') return alert.severity === 'critical' || alert.severity === 'error';
    return alert.severity === filter;
  });

  // Count by severity
  const criticalCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'error').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const unreadCount = alerts.filter(a => !a.is_reviewed).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertes Système
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} non lues
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="unread">Non lues</SelectItem>
                <SelectItem value="critical">Critiques</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-500" />
            {criticalCount} critiques
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-orange-500" />
            {warningCount} warnings
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          <div className="space-y-2">
            {filteredAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                  !alert.is_reviewed ? 'bg-muted/50' : ''
                }`}
              >
                <div className="mt-0.5">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{alert.action_type}</span>
                    {getSeverityBadge(alert.severity)}
                    {!alert.is_reviewed && (
                      <Badge variant="outline" className="text-xs">Nouveau</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {alert.action_category}
                    {alert.target_name && ` • ${alert.target_name}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(alert.created_at), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </p>
                </div>
                <div className="flex gap-1">
                  {!alert.is_reviewed && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleMarkReviewed(alert.id)}
                      disabled={processing === alert.id}
                      title="Marquer comme lu"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  {onArchive && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleArchive(alert.id)}
                      disabled={processing === alert.id}
                      title="Archiver"
                    >
                      <Archive className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {filteredAlerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>Aucune alerte à afficher</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SystemAlertsCard;
