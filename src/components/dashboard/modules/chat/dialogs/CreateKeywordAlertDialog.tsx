import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bell, Tag, Hash, Mail, X } from 'lucide-react';
import type { ChannelWithMetrics } from '@/hooks/useNetworkChannelManagement';

interface CreateKeywordAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channels: ChannelWithMetrics[];
  onSubmit: (data: {
    keyword: string;
    channel_ids: string[];
    alert_type: 'immediate' | 'daily' | 'weekly';
    recipients: string[];
  }) => Promise<any>;
}

const CreateKeywordAlertDialog = ({ 
  open, 
  onOpenChange, 
  channels,
  onSubmit 
}: CreateKeywordAlertDialogProps) => {
  const [keyword, setKeyword] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [alertType, setAlertType] = useState<'immediate' | 'daily' | 'weekly'>('immediate');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChannelToggle = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleSelectAllChannels = () => {
    if (selectedChannels.length === channels.length) {
      setSelectedChannels([]);
    } else {
      setSelectedChannels(channels.map(c => c.id));
    }
  };

  const addRecipient = () => {
    if (newRecipient.trim() && !recipients.includes(newRecipient.trim())) {
      setRecipients([...recipients, newRecipient.trim()]);
      setNewRecipient('');
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleSubmit = async () => {
    if (!keyword.trim() || selectedChannels.length === 0) return;

    setLoading(true);
    await onSubmit({
      keyword: keyword.trim(),
      channel_ids: selectedChannels,
      alert_type: alertType,
      recipients
    });
    setLoading(false);

    // Reset form
    setKeyword('');
    setSelectedChannels([]);
    setAlertType('immediate');
    setRecipients([]);
    onOpenChange(false);
  };

  const activeChannels = channels.filter(c => c.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Nouvelle Alerte Mot-clé
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Keyword */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Mot-clé à surveiller
            </Label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Ex: urgent, rupture, péremption..."
            />
            <p className="text-xs text-muted-foreground">
              Une alerte sera déclenchée chaque fois que ce mot apparaît dans un message
            </p>
          </div>

          {/* Channel Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Canaux à surveiller
              </Label>
              <Button variant="ghost" size="sm" onClick={handleSelectAllChannels}>
                {selectedChannels.length === activeChannels.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </Button>
            </div>
            <ScrollArea className="h-40 border rounded-lg p-3">
              <div className="space-y-2">
                {activeChannels.map(channel => (
                  <div key={channel.id} className="flex items-center gap-3">
                    <Checkbox
                      id={channel.id}
                      checked={selectedChannels.includes(channel.id)}
                      onCheckedChange={() => handleChannelToggle(channel.id)}
                    />
                    <label htmlFor={channel.id} className="flex-1 cursor-pointer text-sm">
                      <span className="font-medium">{channel.name}</span>
                      {channel.is_public && (
                        <Badge variant="secondary" className="ml-2 text-xs">Public</Badge>
                      )}
                    </label>
                  </div>
                ))}
                {activeChannels.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun canal actif disponible
                  </p>
                )}
              </div>
            </ScrollArea>
            {selectedChannels.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedChannels.length} canal(aux) sélectionné(s)
              </p>
            )}
          </div>

          {/* Alert Type */}
          <div className="space-y-2">
            <Label>Type d'alerte</Label>
            <Select value={alertType} onValueChange={(v) => setAlertType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immédiat (notification en temps réel)</SelectItem>
                <SelectItem value="daily">Quotidien (résumé journalier)</SelectItem>
                <SelectItem value="weekly">Hebdomadaire (résumé de la semaine)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Destinataires (optionnel)
            </Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="email@exemple.com"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
              />
              <Button variant="outline" onClick={addRecipient}>Ajouter</Button>
            </div>
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recipients.map(email => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeRecipient(email)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!keyword.trim() || selectedChannels.length === 0 || loading}
          >
            {loading ? 'Création...' : 'Créer l\'alerte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateKeywordAlertDialog;
