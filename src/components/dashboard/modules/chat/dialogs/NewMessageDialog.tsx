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
import { Building, Send, Search, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

interface Pharmacy {
  id: string;
  name: string;
  city?: string;
  type?: string;
}

interface Channel {
  id: string;
  name: string;
  description?: string;
}

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewMessageDialog = ({ open, onOpenChange }: NewMessageDialogProps) => {
  const { currentTenant, currentUser } = useTenant();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [messageType, setMessageType] = useState<'channel' | 'direct'>('channel');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [selectedPharmacies, setSelectedPharmacies] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pharmaciesRes, channelsRes] = await Promise.all([
        supabase.from('pharmacies').select('id, name, city, type').neq('id', currentTenant?.id),
        supabase.from('network_channels').select('id, name, description')
      ]);

      setPharmacies((pharmaciesRes.data || []) as Pharmacy[]);
      setChannels(channelsRes.data || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Veuillez saisir un message');
      return;
    }

    if (messageType === 'channel' && !selectedChannel) {
      toast.error('Veuillez sélectionner un canal');
      return;
    }

    if (messageType === 'direct' && selectedPharmacies.length === 0) {
      toast.error('Veuillez sélectionner au moins un destinataire');
      return;
    }

    setSending(true);
    try {
      if (messageType === 'channel') {
        // Envoyer au canal
        await supabase.from('network_messages').insert({
          channel_id: selectedChannel,
          sender_pharmacy_id: currentTenant?.id,
          sender_name: (currentTenant as any)?.name || (currentTenant as any)?.nom_pharmacie,
          sender_user_id: currentUser?.id,
          content: message,
          priority,
          message_type: 'text',
          tenant_id: currentTenant?.id
        });
      } else {
        // Créer ou trouver un canal direct et envoyer
        for (const pharmacyId of selectedPharmacies) {
          // Chercher un canal direct existant
          let { data: existingChannel } = await supabase
            .from('network_channels')
            .select('id')
            .eq('type', 'direct')
            .contains('metadata', { participants: [currentTenant?.id, pharmacyId] })
            .single() as { data: { id: string } | null };

          if (!existingChannel) {
            // Créer un nouveau canal direct
            const { data: newChannel } = await supabase
              .from('network_channels')
              .insert({
                name: `Direct: ${(currentTenant as any)?.name} - ${pharmacies.find(p => p.id === pharmacyId)?.name}`,
                type: 'direct',
                is_public: false,
                tenant_id: currentTenant?.id,
                metadata: { participants: [currentTenant?.id, pharmacyId] }
              })
              .select()
              .single();

            existingChannel = newChannel;

            // Ajouter les participants
            await supabase.from('channel_participants').insert([
              { channel_id: newChannel.id, pharmacy_id: currentTenant?.id, tenant_id: currentTenant?.id },
              { channel_id: newChannel.id, pharmacy_id: pharmacyId, tenant_id: currentTenant?.id }
            ]);
          }

          // Envoyer le message
          await supabase.from('network_messages').insert({
            channel_id: existingChannel.id,
            sender_pharmacy_id: currentTenant?.id,
            sender_name: (currentTenant as any)?.name,
            sender_user_id: currentUser?.id,
            content: message,
            priority,
            message_type: 'text',
            tenant_id: currentTenant?.id
          });
        }
      }

      toast.success('Message envoyé avec succès');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setMessage('');
    setSelectedChannel('');
    setSelectedPharmacies([]);
    setPriority('normal');
    setSearchTerm('');
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Nouveau Message Réseau
          </DialogTitle>
          <DialogDescription>
            Envoyez un message à un canal ou directement à des officines
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type de message */}
          <div className="space-y-2">
            <Label>Type de message</Label>
            <Select value={messageType} onValueChange={(v: 'channel' | 'direct') => setMessageType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="channel">Envoyer à un canal</SelectItem>
                <SelectItem value="direct">Message direct</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {messageType === 'channel' ? (
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un canal" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map(channel => (
                    <SelectItem key={channel.id} value={channel.id}>
                      #{channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Destinataires ({selectedPharmacies.length} sélectionnés)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une officine..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <ScrollArea className="h-40 border rounded-md p-2">
                {filteredPharmacies.map(pharmacy => (
                  <div
                    key={pharmacy.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => togglePharmacy(pharmacy.id)}
                  >
                    <Checkbox checked={selectedPharmacies.includes(pharmacy.id)} />
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{pharmacy.name}</p>
                      <p className="text-xs text-muted-foreground">{pharmacy.city}</p>
                    </div>
                    {pharmacy.type && (
                      <Badge variant="outline" className="text-xs">{pharmacy.type}</Badge>
                    )}
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {/* Priorité */}
          <div className="space-y-2">
            <Label>Priorité</Label>
            <Select value={priority} onValueChange={(v: 'normal' | 'high' | 'urgent') => setPriority(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normale</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder="Saisissez votre message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={sending || !message.trim()}>
            {sending ? 'Envoi...' : 'Envoyer'}
            <Send className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewMessageDialog;
