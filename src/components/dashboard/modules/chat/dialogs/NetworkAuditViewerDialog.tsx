import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Search,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Clock
} from 'lucide-react';

interface AuditLog {
  id: string;
  tenant_id?: string;
  user_id?: string;
  action_type: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  created_at: string;
}

interface NetworkAuditViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditLogs: AuditLog[];
  pharmacyName?: (tenantId: string) => string;
  loading?: boolean;
}

const SEVERITY_CONFIG = {
  info: { icon: Info, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Info' },
  warning: { icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Attention' },
  error: { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200', label: 'Erreur' },
  critical: { icon: XCircle, color: 'bg-red-200 text-red-900 border-red-300', label: 'Critique' }
};

const ACTION_LABELS: Record<string, string> = {
  'channel_create': 'Création de canal',
  'channel_delete': 'Suppression de canal',
  'channel_update': 'Modification de canal',
  'member_add': 'Ajout de membre',
  'member_remove': 'Retrait de membre',
  'permission_grant': 'Permission accordée',
  'permission_revoke': 'Permission révoquée',
  'partner_invite': 'Invitation partenaire',
  'partner_remove': 'Retrait partenaire',
  'config_change': 'Modification configuration',
  'security_alert': 'Alerte sécurité',
  'login': 'Connexion',
  'logout': 'Déconnexion',
  'backup_create': 'Sauvegarde créée',
  'backup_restore': 'Restauration effectuée'
};

const NetworkAuditViewerDialog = ({
  open,
  onOpenChange,
  auditLogs,
  pharmacyName,
  loading = false
}: NetworkAuditViewerDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesAction = actionFilter === 'all' || log.action_type === actionFilter;
    return matchesSearch && matchesSeverity && matchesAction;
  });

  // Get unique action types for filter
  const actionTypes = [...new Set(auditLogs.map(l => l.action_type))];

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Type', 'Action', 'Sévérité', 'Détails', 'IP'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toISOString(),
        log.target_type || '',
        ACTION_LABELS[log.action_type] || log.action_type,
        log.severity,
        JSON.stringify(log.details || {}).replace(/,/g, ';'),
        log.ip_address || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Journal d'Audit Réseau
          </DialogTitle>
          <DialogDescription>
            Historique complet des actions et événements du réseau.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtres */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Attention</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type d'action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                {actionTypes.map(action => (
                  <SelectItem key={action} value={action}>
                    {ACTION_LABELS[action] || action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Liste des logs */}
          <ScrollArea className="h-[400px] border rounded-lg">
            <div className="p-2 space-y-2">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const severityConfig = SEVERITY_CONFIG[log.severity];
                  const SeverityIcon = severityConfig.icon;
                  return (
                    <div key={log.id} className="p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <SeverityIcon className={`h-4 w-4 mt-0.5 ${
                            log.severity === 'info' ? 'text-blue-600' :
                            log.severity === 'warning' ? 'text-yellow-600' :
                            log.severity === 'error' ? 'text-red-600' :
                            'text-red-800'
                          }`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {ACTION_LABELS[log.action_type] || log.action_type}
                              </span>
                              <Badge variant="outline" className={`text-xs ${severityConfig.color}`}>
                                {severityConfig.label}
                              </Badge>
                            </div>
                            {log.target_type && (
                              <div className="text-sm text-muted-foreground">
                                Cible: {log.target_type}
                                {log.target_id && ` (${log.target_id.slice(0, 8)}...)`}
                              </div>
                            )}
                            {log.details && Object.keys(log.details).length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded p-1.5">
                                {Object.entries(log.details).map(([key, value]) => (
                                  <span key={key} className="mr-3">
                                    <span className="font-medium">{key}:</span> {String(value)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.created_at).toLocaleString('fr-FR')}
                          </div>
                          {log.ip_address && (
                            <div className="mt-1">IP: {log.ip_address}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p>Aucun log correspondant aux filtres</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Résumé */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredLogs.length} entrée{filteredLogs.length !== 1 ? 's' : ''} 
              {filteredLogs.length !== auditLogs.length && ` (sur ${auditLogs.length} total)`}
            </span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Info: {auditLogs.filter(l => l.severity === 'info').length}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                Attention: {auditLogs.filter(l => l.severity === 'warning').length}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Erreur: {auditLogs.filter(l => l.severity === 'error').length}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleExport} disabled={filteredLogs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NetworkAuditViewerDialog;
