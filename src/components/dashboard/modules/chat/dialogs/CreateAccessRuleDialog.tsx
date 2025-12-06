import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Key, Plus } from 'lucide-react';
import type { SecurityAccessRule } from '@/hooks/useNetworkSecurity';

interface CreateAccessRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rule: Partial<SecurityAccessRule>) => Promise<void>;
  isSubmitting?: boolean;
}

const CreateAccessRuleDialog: React.FC<CreateAccessRuleDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_type: 'role_based',
    target_resource: '',
    permissions: [] as string[],
    priority: 100,
    is_active: true,
    conditions: '',
  });

  const handleSubmit = async () => {
    if (!formData.rule_name.trim()) return;

    let parsedConditions = {};
    if (formData.conditions.trim()) {
      try {
        parsedConditions = JSON.parse(formData.conditions);
      } catch {
        parsedConditions = { raw: formData.conditions };
      }
    }

    await onSubmit({
      rule_name: formData.rule_name,
      rule_type: formData.rule_type,
      target_resource: formData.target_resource || null,
      permissions: formData.permissions,
      priority: formData.priority,
      is_active: formData.is_active,
      conditions: parsedConditions,
    });

    // Reset form
    setFormData({
      rule_name: '',
      rule_type: 'role_based',
      target_resource: '',
      permissions: [],
      priority: 100,
      is_active: true,
      conditions: '',
    });
    onOpenChange(false);
  };

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const availablePermissions = ['read', 'write', 'delete', 'admin', 'export', 'import'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Nouvelle Règle d'Accès
          </DialogTitle>
          <DialogDescription>
            Créer une règle pour contrôler l'accès aux ressources
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="rule_name">Nom de la règle *</Label>
            <Input
              id="rule_name"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              placeholder="Ex: Accès admins uniquement"
            />
          </div>

          <div>
            <Label htmlFor="rule_type">Type de règle</Label>
            <Select 
              value={formData.rule_type} 
              onValueChange={(v) => setFormData({ ...formData, rule_type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="role_based">Basé sur le rôle</SelectItem>
                <SelectItem value="ip_whitelist">Liste blanche IP</SelectItem>
                <SelectItem value="time_based">Basé sur l'horaire</SelectItem>
                <SelectItem value="geo_location">Géolocalisation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="target_resource">Ressource cible (optionnel)</Label>
            <Input
              id="target_resource"
              value={formData.target_resource}
              onChange={(e) => setFormData({ ...formData, target_resource: e.target.value })}
              placeholder="Ex: /api/patients, chat, documents"
            />
          </div>

          <div>
            <Label>Permissions</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {availablePermissions.map((perm) => (
                <Button
                  key={perm}
                  type="button"
                  variant={formData.permissions.includes(perm) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => togglePermission(perm)}
                >
                  {perm}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="priority">Priorité (plus bas = plus prioritaire)</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
              min={1}
              max={1000}
            />
          </div>

          <div>
            <Label htmlFor="conditions">Conditions (JSON optionnel)</Label>
            <Textarea
              id="conditions"
              value={formData.conditions}
              onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
              placeholder='{"roles": ["Admin", "Manager"], "departments": ["IT"]}'
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Activer immédiatement</Label>
              <p className="text-xs text-muted-foreground">
                La règle sera appliquée dès sa création
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !formData.rule_name.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Créer la règle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAccessRuleDialog;
