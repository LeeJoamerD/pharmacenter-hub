import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Network, 
  Activity, 
  Clock,
  RefreshCw,
  Power,
  Settings
} from 'lucide-react';
import { SystemComponent } from '@/hooks/useNetworkAdministration';

interface SystemComponentDetailsDialogProps {
  component: SystemComponent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, data: Partial<SystemComponent>) => void;
  loading?: boolean;
}

export const SystemComponentDetailsDialog: React.FC<SystemComponentDetailsDialogProps> = ({
  component,
  open,
  onOpenChange,
  onUpdate,
  loading = false
}) => {
  if (!component) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server className="h-4 w-4" />;
      case 'database': return <HardDrive className="h-4 w-4" />;
      case 'router': case 'firewall': return <Network className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const handleRestart = () => {
    if (onUpdate) {
      onUpdate(component.id, { 
        last_check: new Date().toISOString(),
        status: 'maintenance'
      });
    }
  };

  const handleRefresh = () => {
    if (onUpdate) {
      onUpdate(component.id, { 
        last_check: new Date().toISOString()
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getTypeIcon(component.type)}
            <div>
              <DialogTitle className="flex items-center gap-3">
                {component.name}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(component.status)}`}></div>
                  <Badge variant={component.status === 'online' ? 'default' : component.status === 'warning' ? 'secondary' : 'destructive'}>
                    {component.status}
                  </Badge>
                </div>
              </DialogTitle>
              <DialogDescription>
                Détails et métriques du composant système
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Informations Générales
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Type:</span>
                <p className="font-medium capitalize">{component.type}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Adresse IP:</span>
                <p className="font-medium">{component.ip_address || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Port:</span>
                <p className="font-medium">{component.port || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Uptime:</span>
                <p className="font-medium">{component.uptime}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-muted-foreground">Description:</span>
                <p className="font-medium">{component.description || 'Aucune description disponible'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Métriques de performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Métriques de Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">CPU</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Utilisation</span>
                      <span>{component.cpu_load}%</span>
                    </div>
                    <Progress value={component.cpu_load} className="h-3" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Mémoire</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Utilisation</span>
                      <span>{component.memory_usage}%</span>
                    </div>
                    <Progress value={component.memory_usage} className="h-3" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Stockage</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Utilisation</span>
                      <span>{component.storage_usage}%</span>
                    </div>
                    <Progress value={component.storage_usage} className="h-3" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          {component.configuration && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-3 rounded-md overflow-auto">
                  {JSON.stringify(component.configuration, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Dernière vérification: {new Date(component.last_check).toLocaleString('fr-FR')}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRestart} 
                disabled={loading}
              >
                <Power className="h-4 w-4 mr-2" />
                Redémarrer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};