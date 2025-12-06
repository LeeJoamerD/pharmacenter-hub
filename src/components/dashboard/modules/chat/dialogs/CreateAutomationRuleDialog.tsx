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
import { Badge } from '@/components/ui/badge';
import { Zap, Route, MessageSquare, AlertTriangle, Clock, ArrowRightLeft } from 'lucide-react';
import type { MultichannelConnector } from '@/hooks/useNetworkMultichannel';

interface CreateAutomationRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RuleFormData) => void;
  connectors: MultichannelConnector[];
}

export interface RuleFormData {
  name: string;
  description: string;
  rule_type: 'routing' | 'auto_response' | 'escalation' | 'schedule' | 'fallback';
  trigger_conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  target_channels: string[];
  is_network_rule: boolean;
}

const ruleTypes = [
  { 
    value: 'routing', 
    label: 'Routage', 
    icon: Route, 
    description: 'Diriger les messages vers des canaux spécifiques selon des critères'
  },
  { 
    value: 'auto_response', 
    label: 'Réponse automatique', 
    icon: MessageSquare, 
    description: 'Envoyer des réponses automatiques aux messages entrants'
  },
  { 
    value: 'escalation', 
    label: 'Escalade', 
    icon: AlertTriangle, 
    description: 'Escalader vers un autre canal si pas de réponse'
  },
  { 
    value: 'schedule', 
    label: 'Planification', 
    icon: Clock, 
    description: 'Activer/désactiver des canaux selon un horaire'
  },
  { 
    value: 'fallback', 
    label: 'Fallback', 
    icon: ArrowRightLeft, 
    description: 'Basculer sur un canal alternatif en cas d\'échec'
  }
];

const CreateAutomationRuleDialog: React.FC<CreateAutomationRuleDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  connectors
}) => {
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    description: '',
    rule_type: 'routing',
    trigger_conditions: {},
    actions: {},
    target_channels: [],
    is_network_rule: false
  });
  const [triggerJson, setTriggerJson] = useState('{}');
  const [actionsJson, setActionsJson] = useState('{}');

  const selectedRuleType = ruleTypes.find(r => r.value === formData.rule_type);
  const RuleIcon = selectedRuleType?.icon || Zap;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const trigger_conditions = JSON.parse(triggerJson);
      const actions = JSON.parse(actionsJson);
      onSubmit({ ...formData, trigger_conditions, actions });
      resetForm();
      onOpenChange(false);
    } catch {
      // Invalid JSON
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rule_type: 'routing',
      trigger_conditions: {},
      actions: {},
      target_channels: [],
      is_network_rule: false
    });
    setTriggerJson('{}');
    setActionsJson('{}');
  };

  const toggleChannel = (channelId: string) => {
    setFormData(prev => ({
      ...prev,
      target_channels: prev.target_channels.includes(channelId)
        ? prev.target_channels.filter(id => id !== channelId)
        : [...prev.target_channels, channelId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RuleIcon className="h-5 w-5 text-primary" />
            Nouvelle Règle d'Automatisation
          </DialogTitle>
          <DialogDescription>
            Créez une règle pour automatiser le comportement des canaux
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la règle</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Routage messages urgents"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description de la règle..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Type de règle</Label>
            <Select 
              value={formData.rule_type} 
              onValueChange={value => setFormData(prev => ({ 
                ...prev, 
                rule_type: value as RuleFormData['rule_type'] 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {ruleTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <span>{type.label}</span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedRuleType && (
              <p className="text-xs text-muted-foreground">{selectedRuleType.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Canaux cibles</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[60px]">
              {connectors.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun canal disponible</p>
              ) : (
                connectors.map(connector => (
                  <Badge
                    key={connector.id}
                    variant={formData.target_channels.includes(connector.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleChannel(connector.id)}
                  >
                    {connector.name}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger">Conditions de déclenchement (JSON)</Label>
            <Textarea
              id="trigger"
              value={triggerJson}
              onChange={e => setTriggerJson(e.target.value)}
              placeholder='{"priority": "high", "keywords": ["urgent"]}'
              rows={3}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actions">Actions (JSON)</Label>
            <Textarea
              id="actions"
              value={actionsJson}
              onChange={e => setActionsJson(e.target.value)}
              placeholder='{"send_to": "sms", "template": "urgent_notification"}'
              rows={3}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Règle réseau</Label>
              <p className="text-xs text-muted-foreground">
                Appliquer cette règle à toutes les pharmacies du réseau
              </p>
            </div>
            <Switch
              checked={formData.is_network_rule}
              onCheckedChange={checked => setFormData(prev => ({ ...prev, is_network_rule: checked }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!formData.name}>
              Créer la règle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAutomationRuleDialog;
