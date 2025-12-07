import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Download,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AutomationExecution } from '@/hooks/useAIAutomation';
import { exportExecutionLogToPDF } from '@/utils/automationExportUtils';

interface ExecutionDetailDialogProps {
  execution: AutomationExecution | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExecutionDetailDialog: React.FC<ExecutionDetailDialogProps> = ({
  execution,
  open,
  onOpenChange
}) => {
  if (!execution) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running': return <Activity className="h-5 w-5 text-blue-600 animate-pulse" />;
      case 'pending': return <Clock className="h-5 w-5 text-orange-600" />;
      default: return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'failed': return 'Échec';
      case 'running': return 'En cours';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'failed': return 'bg-red-50 text-red-700 border-red-200';
      case 'running': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'action': return 'text-purple-600';
      default: return 'text-muted-foreground';
    }
  };

  const handleExportLog = () => {
    exportExecutionLogToPDF(
      execution,
      execution.workflow?.name || 'Workflow',
      'PharmaSoft'
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon(execution.status)}
            <div>
              <DialogTitle>Détails de l'Exécution</DialogTitle>
              <DialogDescription>
                {execution.workflow?.name || 'Workflow'} - {format(new Date(execution.started_at), 'dd MMM yyyy HH:mm', { locale: fr })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Status & Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-muted-foreground">Statut</div>
              <Badge className={getStatusColor(execution.status)}>
                {getStatusLabel(execution.status)}
              </Badge>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-muted-foreground">Durée</div>
              <div className="font-semibold">{execution.duration_ms || 0} ms</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-muted-foreground">Terminé</div>
              <div className="font-semibold text-sm">
                {execution.completed_at 
                  ? format(new Date(execution.completed_at), 'HH:mm:ss', { locale: fr })
                  : '-'
                }
              </div>
            </div>
          </div>

          {/* Error message if any */}
          {execution.error_message && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                <XCircle className="h-4 w-4" />
                Erreur
              </div>
              <p className="text-sm text-red-600">{execution.error_message}</p>
            </div>
          )}

          {/* Execution Log */}
          <div className="border rounded-lg">
            <div className="flex items-center justify-between p-3 border-b bg-muted/50">
              <span className="font-medium">Journal d'exécution</span>
              <Button variant="outline" size="sm" onClick={handleExportLog}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="p-3 space-y-2">
                {execution.execution_log.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune entrée dans le journal
                  </p>
                ) : (
                  execution.execution_log.map((entry, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm p-2 hover:bg-muted/30 rounded">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(entry.timestamp), 'HH:mm:ss', { locale: fr })}
                      </span>
                      <Badge variant="outline" className={`${getLogTypeColor(entry.type)} text-xs`}>
                        {entry.type.toUpperCase()}
                      </Badge>
                      <span className="flex-1">{entry.message}</span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Result if available */}
          {execution.result && Object.keys(execution.result).length > 0 && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium mb-2">Résultat</div>
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(execution.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExecutionDetailDialog;
