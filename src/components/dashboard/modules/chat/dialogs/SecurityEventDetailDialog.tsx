import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Clock, User, Globe, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SecurityEvent } from '@/hooks/useNetworkSecurity';

interface SecurityEventDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: SecurityEvent | null;
  onResolve: (eventId: string) => void;
  isResolving?: boolean;
}

const SecurityEventDetailDialog: React.FC<SecurityEventDetailDialogProps> = ({
  open,
  onOpenChange,
  event,
  onResolve,
  isResolving = false,
}) => {
  if (!event) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      return format(new Date(ts), 'dd MMMM yyyy à HH:mm:ss', { locale: fr });
    } catch {
      return 'Date inconnue';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Détails de l'Événement de Sécurité
          </DialogTitle>
          <DialogDescription>
            Informations détaillées et actions disponibles
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Header with badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={getSeverityColor(event.severity)}>
                {event.severity.toUpperCase()}
              </Badge>
              <Badge className={getStatusColor(event.status)}>
                {event.status === 'resolved' ? 'Résolu' : 
                 event.status === 'investigating' ? 'En investigation' : 'En attente'}
              </Badge>
              <span className="text-sm text-muted-foreground capitalize">
                {event.event_type.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                {event.description}
              </p>
            </div>

            <Separator />

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date et heure</p>
                  <p className="text-sm font-medium">{formatTimestamp(event.timestamp)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Utilisateur</p>
                  <p className="text-sm font-medium">{event.user}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Globe className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Adresse IP</p>
                  <p className="text-sm font-medium">{event.ip_address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type d'événement</p>
                  <p className="text-sm font-medium capitalize">{event.event_type.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </div>

            {/* Metadata if available */}
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Métadonnées</h4>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </div>
              </>
            )}

            {/* Recommendations */}
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Actions Recommandées</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                {event.severity === 'critical' && (
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Intervention immédiate requise - Vérifier les accès utilisateur
                  </li>
                )}
                {event.severity === 'high' && (
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Investigation prioritaire recommandée
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  Documenter les actions prises pour référence future
                </li>
              </ul>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {event.status !== 'resolved' && (
            <Button 
              onClick={() => onResolve(event.id)} 
              disabled={isResolving}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marquer comme résolu
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SecurityEventDetailDialog;
