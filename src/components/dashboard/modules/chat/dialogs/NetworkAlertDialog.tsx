import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Building, Send, Search, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

interface Pharmacy {
  id: string;
  name: string;
  city?: string;
  region?: string;
}

interface NetworkAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NetworkAlertDialog = ({ open, onOpenChange }: NetworkAlertDialogProps) => {
  const { currentTenant, currentUser } = useTenant();
  const tenantId = currentTenant?.id;
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'high' | 'urgent'>('high');
  const [scope, setScope] = useState<'all' | 'region' | 'selected'>('all');
  const [selectedPharmacies, setSelectedPharmacies] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      loadPharmacies();
    }
  }, [open]);

  const loadPharmacies = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('pharmacies')
        .select('id, name, city, region')
        .neq('id', tenantId || '');

      setPharmacies((data || []).map(p => ({
        id: p.id,
        name: p.name || '',
        city: p.city || '',
        region: p.region || ''
      })));
    } catch (error) {
      console.error('Erreur chargement pharmacies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error('Veuillez saisir un titre pour l\'alerte');
      return;
    }

    if (!message.trim()) {
      toast.error('Veuillez saisir le message de l\'alerte');
      return;
    }

    if (scope === 'selected' && selectedPharmacies.length === 0) {
      toast.error('Veuillez sélectionner au moins un destinataire');
      return;
    }

    if (scope === 'region' && !selectedRegion) {
      toast.error('Veuillez sélectionner une région');
      return;
    }

    setSending(true);
    try {
      // Trouver ou créer le canal d'alertes
      let alertChannelId: string | null = null;
      
      const { data: existingChannel } = await supabase
        .from('network_channels')
        .select('id')
        .eq('name', 'Alertes Réseau')
        .eq('is_system', true)
        .single();

      if (existingChannel) {
        alertChannelId = existingChannel.id;
      } else {
        const { data: newChannel } = await supabase
          .from('network_channels')
          .insert({
            name: 'Alertes Réseau',
            description: 'Canal système pour les alertes urgentes',
            type: 'alert',
            is_system: true,
            tenant_id: tenantId
          })
          .select()
          .single();

        alertChannelId = newChannel?.id || null;
      }

      if (!alertChannelId) {
        throw new Error('Impossible de créer le canal d\'alertes');
      }

      // Déterminer les destinataires
      let recipients: string[] = [];
      if (scope === 'all') {
        recipients = pharmacies.map(p => p.id);
      } else if (scope === 'region') {
        recipients = pharmacies.filter(p => p.region === selectedRegion).map(p => p.id);
      } else {
        recipients = selectedPharmacies;
      }

      // Trouver le nom de la pharmacie courante
      const currentPharmacy = pharmacies.find(p => p.id === tenantId);

      // Envoyer l'alerte
      await supabase.from('network_messages').insert({
        channel_id: alertChannelId,
        sender_pharmacy_id: tenantId,
        sender_name: currentPharmacy?.name || currentTenant?.name || 'Système',
        sender_user_id: currentUser?.id,
        content: `🚨 **${title}**\n\n${message}`,
        priority,
        message_type: 'alert',
        tenant_id: tenantId,
        metadata: {
          alert_type: 'network',
          scope,
          recipients,
          region: scope === 'region' ? selectedRegion : null
        }
      });

      // Logger l'action
      await supabase.from('network_audit_logs').insert({
        tenant_id: tenantId,
        action_type: 'alert_sent',
        action_category: 'alert',
        user_id: tenantId,
        severity: priority === 'urgent' ? 'critical' : 'warning',
        is_sensitive: priority === 'urgent',
        is_reviewed: false,
        details: {
          actor_name: 'Utilisateur',
          actor_pharmacy_name: currentPharmacy?.name || '',
          action_description: `Alerte "${title}" diffusée à ${recipients.length} officine(s)`,
          target_name: title,
          scope,
          recipients_count: recipients.length
        }
      });

      toast.success(`Alerte diffusée à ${recipients.length} officine(s)`);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Erreur envoi alerte:', error);
      toast.error('Erreur lors de la diffusion de l\'alerte');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setPriority('high');
    setScope('all');
    setSelectedPharmacies([]);
    setSelectedRegion('');
    setSearchTerm('');
  };

  const regions = [...new Set(pharmacies.map(p => p.region).filter(Boolean))];

  const filteredPharmacies = pharmacies.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const togglePharmacy = (pharmacyId: string) => {
    setSelectedPharmacies(prev =>
      prev.includes(pharmacyId)
        ? prev.filter(id => id !== pharmacyId)
        : [...prev, pharmacyId]
    );
  };

  const getRecipientsCount = () => {
    if (scope === 'all') return pharmacies.length;
    if (scope === 'region') return pharmacies.filter(p => p.region === selectedRegion).length;
    return selectedPharmacies.length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Diffuser une Alerte Réseau
          </DialogTitle>
          <DialogDescription>
            Envoyez une alerte urgente à toutes les officines ou à une sélection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label>Titre de l'alerte *</Label>
            <Input
              placeholder="Ex: Rappel de lot - Médicament X"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <Label>Niveau de priorité</Label>
            <Select value={priority} onValueChange={(v: 'high' | 'urgent') => setPriority(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-orange-500 rounded-full" />
                    Haute priorité
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                    Urgente
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Portée */}
          <div className="space-y-2">
            <Label>Destinataires</Label>
            <Select value={scope} onValueChange={(v: 'all' | 'region' | 'selected') => setScope(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Toutes les officines ({pharmacies.length})
                  </div>
                </SelectItem>
                <SelectItem value="region">Par région</SelectItem>
                <SelectItem value="selected">Sélection personnalisée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sélection région */}
          {scope === 'region' && (
            <div className="space-y-2">
              <Label>Région</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une région" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(region => (
                    <SelectItem key={region} value={region!}>
                      {region} ({pharmacies.filter(p => p.region === region).length} officines)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sélection personnalisée */}
          {scope === 'selected' && (
            <div className="space-y-2">
              <Label>Officines sélectionnées ({selectedPharmacies.length})</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une officine..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <ScrollArea className="h-32 border rounded-md p-2">
                {filteredPharmacies.map(pharmacy => (
                  <div
                    key={pharmacy.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => togglePharmacy(pharmacy.id)}
                  >
                    <Checkbox checked={selectedPharmacies.includes(pharmacy.id)} />
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{pharmacy.name}</span>
                    <span className="text-xs text-muted-foreground">{pharmacy.city}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label>Message de l'alerte *</Label>
            <Textarea
              placeholder="Décrivez l'alerte en détail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          {/* Résumé */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Destinataires:</span>
              <Badge variant={priority === 'urgent' ? 'destructive' : 'secondary'}>
                {getRecipientsCount()} officine(s)
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleSend} 
            disabled={sending || !title.trim() || !message.trim()}
          >
            {sending ? 'Diffusion...' : 'Diffuser l\'alerte'}
            <Send className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NetworkAlertDialog;
