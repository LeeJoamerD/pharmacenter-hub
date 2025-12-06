import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, Loader2 } from 'lucide-react';
import type { SecurityEvent } from '@/hooks/useNetworkSecurity';

interface ResolveSecurityEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: SecurityEvent | null;
  onResolve: (eventId: string, notes: string) => Promise<void>;
  isResolving?: boolean;
}

const ResolveSecurityEventDialog: React.FC<ResolveSecurityEventDialogProps> = ({
  open,
  onOpenChange,
  event,
  onResolve,
  isResolving = false,
}) => {
  const [notes, setNotes] = useState('');
  const [resolution, setResolution] = useState('resolved');
  const [notifyAdmins, setNotifyAdmins] = useState(false);

  const handleResolve = async () => {
    if (!event) return;

    const fullNotes = `[${resolution}] ${notes}${notifyAdmins ? ' (Admins notifiés)' : ''}`;
    await onResolve(event.id, fullNotes);
    
    // Reset form
    setNotes('');
    setResolution('resolved');
    setNotifyAdmins(false);
    onOpenChange(false);
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Résoudre l'Événement
          </DialogTitle>
          <DialogDescription>
            Documenter la résolution de cet événement de sécurité
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">{event.event_type}</p>
            <p className="text-muted-foreground">{event.description.slice(0, 100)}...</p>
          </div>

          <div>
            <Label htmlFor="resolution">Type de résolution</Label>
            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resolved">Résolu</SelectItem>
                <SelectItem value="false_positive">Faux positif</SelectItem>
                <SelectItem value="escalated">Escaladé</SelectItem>
                <SelectItem value="acknowledged">Reconnu (sans action)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes de résolution</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Décrivez les actions prises pour résoudre cet événement..."
              rows={4}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Notifier les administrateurs</Label>
              <p className="text-xs text-muted-foreground">
                Envoyer un email aux admins
              </p>
            </div>
            <Switch
              checked={notifyAdmins}
              onCheckedChange={setNotifyAdmins}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isResolving}>
            Annuler
          </Button>
          <Button onClick={handleResolve} disabled={isResolving}>
            {isResolving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Résolution...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Marquer résolu
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResolveSecurityEventDialog;
