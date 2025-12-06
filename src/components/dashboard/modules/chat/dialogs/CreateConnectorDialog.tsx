import React, { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Smartphone, Mail, MessageSquare, Video, Zap, Globe, Send } from 'lucide-react';

interface CreateConnectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ConnectorFormData) => void;
}

export interface ConnectorFormData {
  name: string;
  channel_type: 'sms' | 'email' | 'whatsapp' | 'teams' | 'slack' | 'webhook' | 'telegram' | 'messenger';
  provider: string;
  config: Record<string, unknown>;
  is_network_shared: boolean;
}

const channelTypes = [
  { value: 'sms', label: 'SMS', icon: Smartphone, providers: ['twilio', 'nexmo', 'messagebird'] },
  { value: 'email', label: 'Email', icon: Mail, providers: ['sendgrid', 'mailgun', 'smtp'] },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, providers: ['whatsapp_business', 'twilio_whatsapp', '360dialog'] },
  { value: 'teams', label: 'Microsoft Teams', icon: Video, providers: ['microsoft'] },
  { value: 'slack', label: 'Slack', icon: Zap, providers: ['slack_api'] },
  { value: 'webhook', label: 'Webhook', icon: Globe, providers: ['custom'] },
  { value: 'telegram', label: 'Telegram', icon: Send, providers: ['telegram_bot'] },
  { value: 'messenger', label: 'Messenger', icon: MessageSquare, providers: ['facebook'] }
];

const CreateConnectorDialog: React.FC<CreateConnectorDialogProps> = ({
  open,
  onOpenChange,
  onSubmit
}) => {
  const [formData, setFormData] = useState<ConnectorFormData>({
    name: '',
    channel_type: 'email',
    provider: '',
    config: {},
    is_network_shared: false
  });
  const [configJson, setConfigJson] = useState('{}');

  const selectedChannel = channelTypes.find(c => c.value === formData.channel_type);
  const ChannelIcon = selectedChannel?.icon || Mail;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const config = JSON.parse(configJson);
      onSubmit({ ...formData, config });
      setFormData({
        name: '',
        channel_type: 'email',
        provider: '',
        config: {},
        is_network_shared: false
      });
      setConfigJson('{}');
      onOpenChange(false);
    } catch {
      // Invalid JSON - will be handled by UI validation
    }
  };

  const handleChannelTypeChange = (value: string) => {
    const channel = channelTypes.find(c => c.value === value);
    setFormData(prev => ({
      ...prev,
      channel_type: value as ConnectorFormData['channel_type'],
      provider: channel?.providers[0] || ''
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChannelIcon className="h-5 w-5 text-primary" />
            Nouveau Canal de Communication
          </DialogTitle>
          <DialogDescription>
            Configurez un nouveau canal pour la communication multi-canaux
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du canal</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: SMS Principal"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Type de canal</Label>
            <Select value={formData.channel_type} onValueChange={handleChannelTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {channelTypes.map(channel => {
                  const Icon = channel.icon;
                  return (
                    <SelectItem key={channel.value} value={channel.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {channel.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fournisseur</Label>
            <Select 
              value={formData.provider} 
              onValueChange={value => setFormData(prev => ({ ...prev, provider: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {selectedChannel?.providers.map(provider => (
                  <SelectItem key={provider} value={provider}>
                    {provider.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="config">Configuration (JSON)</Label>
            <Textarea
              id="config"
              value={configJson}
              onChange={e => setConfigJson(e.target.value)}
              placeholder='{"api_key": "...", "from_number": "..."}'
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Entrez les paramètres de configuration au format JSON (clés API, numéros, etc.)
            </p>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Partager avec le réseau</Label>
              <p className="text-xs text-muted-foreground">
                Rendre ce canal accessible aux autres pharmacies du réseau
              </p>
            </div>
            <Switch
              checked={formData.is_network_shared}
              onCheckedChange={checked => setFormData(prev => ({ ...prev, is_network_shared: checked }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!formData.name || !formData.provider}>
              Créer le canal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateConnectorDialog;
