import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Save } from 'lucide-react';
import { AlertRule } from '@/hooks/useAlertRules';

interface AlertRuleDialogProps {
  rule?: AlertRule;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave: (rule: Partial<AlertRule>) => Promise<void>;
  isUpdating?: boolean;
}

const AlertRuleDialog: React.FC<AlertRuleDialogProps> = ({
  rule,
  isOpen,
  onOpenChange,
  onSave,
  isUpdating = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'stock_faible',
    threshold_value: 10,
    threshold_operator: 'less_than',
    notification_channels: ['dashboard'] as string[],
    recipients: { email: [], sms: [], whatsapp: [] },
    priority: 'medium',
    is_active: true,
  });

  const [dialogOpen, setDialogOpen] = useState(isOpen || false);

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description || '',
        rule_type: rule.rule_type,
        threshold_value: rule.threshold_value || 10,
        threshold_operator: rule.threshold_operator,
        notification_channels: rule.notification_channels,
        recipients: rule.recipients || { email: [], sms: [], whatsapp: [] },
        priority: rule.priority,
        is_active: rule.is_active,
      });
    }
  }, [rule]);

  useEffect(() => {
    if (isOpen !== undefined) {
      setDialogOpen(isOpen);
    }
  }, [isOpen]);

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    onOpenChange?.(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    handleOpenChange(false);
    // Reset form
    if (!rule) {
      setFormData({
        name: '',
        description: '',
        rule_type: 'stock_faible',
        threshold_value: 10,
        threshold_operator: 'less_than',
        notification_channels: ['dashboard'],
        recipients: { email: [], sms: [], whatsapp: [] },
        priority: 'medium',
        is_active: true,
      });
    }
  };

  const handleChannelChange = (channel: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        notification_channels: [...prev.notification_channels, channel]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        notification_channels: prev.notification_channels.filter(c => c !== channel)
      }));
    }
  };

  const ruleTypes = [
    { value: 'stock_faible', label: 'Stock Faible' },
    { value: 'peremption', label: 'Péremption' },
    { value: 'rupture', label: 'Rupture de Stock' },
    { value: 'stock_excessif', label: 'Stock Excessif' },
    { value: 'rotation_lente', label: 'Rotation Lente' },
  ];

  const operators = [
    { value: 'less_than', label: 'Inférieur à' },
    { value: 'greater_than', label: 'Supérieur à' },
    { value: 'equals', label: 'Égal à' },
    { value: 'less_equal', label: 'Inférieur ou égal à' },
    { value: 'greater_equal', label: 'Supérieur ou égal à' },
  ];

  const priorities = [
    { value: 'low', label: 'Faible', color: 'bg-gray-500' },
    { value: 'medium', label: 'Moyen', color: 'bg-yellow-500' },
    { value: 'high', label: 'Élevé', color: 'bg-orange-500' },
    { value: 'critical', label: 'Critique', color: 'bg-red-500' },
  ];

  const channels = [
    { value: 'dashboard', label: 'Tableau de bord' },
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'whatsapp', label: 'WhatsApp' },
  ];

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {!rule && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Règle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Modifier la Règle d\'Alerte' : 'Nouvelle Règle d\'Alerte'}
          </DialogTitle>
          <DialogDescription>
            Configurez les conditions qui déclenchent une alerte automatique.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la règle *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Stock critique médicaments"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rule_type">Type de règle *</Label>
              <Select 
                value={formData.rule_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, rule_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ruleTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description optionnelle de la règle..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="threshold_operator">Condition</Label>
              <Select 
                value={formData.threshold_operator} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, threshold_operator: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map(op => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="threshold_value">Seuil</Label>
              <Input
                id="threshold_value"
                type="number"
                value={formData.threshold_value}
                onChange={(e) => setFormData(prev => ({ ...prev, threshold_value: parseInt(e.target.value) || 0 }))}
                min="0"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priorité</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${priority.color}`} />
                      {priority.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Canaux de notification</Label>
            <div className="grid grid-cols-2 gap-3">
              {channels.map(channel => (
                <div key={channel.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={channel.value}
                    checked={formData.notification_channels.includes(channel.value)}
                    onCheckedChange={(checked) => handleChannelChange(channel.value, checked as boolean)}
                  />
                  <Label 
                    htmlFor={channel.value} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {channel.label}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.notification_channels.map(channel => (
                <Badge key={channel} variant="secondary" className="text-xs">
                  {channels.find(c => c.value === channel)?.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
            />
            <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
              Règle active
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isUpdating}>
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AlertRuleDialog;