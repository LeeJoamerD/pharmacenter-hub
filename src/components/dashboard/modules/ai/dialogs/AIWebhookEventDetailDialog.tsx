import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { AIWebhookEvent } from '@/hooks/useAIIntegrations';

interface AIWebhookEventDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: AIWebhookEvent | null;
}

export function AIWebhookEventDetailDialog({ open, onOpenChange, event }: AIWebhookEventDetailDialogProps) {
  if (!event) return null;

  const getStatusIcon = () => {
    switch (event.status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (event.status) {
      case 'success':
        return <Badge className="bg-green-500">Succès</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">En attente</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">En cours</Badge>;
      default:
        return <Badge variant="secondary">{event.status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Détails de l'événement
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 py-4">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type d'événement</p>
                <p className="font-medium">{event.event_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="font-medium">{event.source}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Direction</p>
                <div className="flex items-center gap-1">
                  {event.direction === 'inbound' ? (
                    <ArrowDownLeft className="h-4 w-4 text-blue-500" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  )}
                  <span className="font-medium">
                    {event.direction === 'inbound' ? 'Entrant' : 'Sortant'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                {getStatusBadge()}
              </div>
            </div>

            {/* Technical Details */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              {event.status_code && (
                <div>
                  <p className="text-sm text-muted-foreground">Code HTTP</p>
                  <p className="font-mono font-medium">{event.status_code}</p>
                </div>
              )}
              {event.latency_ms && (
                <div>
                  <p className="text-sm text-muted-foreground">Latence</p>
                  <p className="font-mono font-medium">{event.latency_ms}ms</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Créé le</p>
                <p className="font-medium">
                  {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {event.error_message && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Message d'erreur</p>
                <div className="bg-destructive/10 text-destructive p-3 rounded-md font-mono text-sm">
                  {event.error_message}
                </div>
              </div>
            )}

            {/* Payload */}
            {event.payload && Object.keys(event.payload).length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Payload</p>
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-xs font-mono overflow-x-auto">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Response */}
            {event.response && Object.keys(event.response).length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Réponse</p>
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-xs font-mono overflow-x-auto">
                    {JSON.stringify(event.response, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-4 border-t grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Créé le</p>
                <p className="font-medium">
                  {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                </p>
              </div>
              {event.processed_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Traité le</p>
                  <p className="font-medium">
                    {format(new Date(event.processed_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
