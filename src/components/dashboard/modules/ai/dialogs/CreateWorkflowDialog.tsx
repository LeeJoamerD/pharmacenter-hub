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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Zap } from 'lucide-react';
import type { WorkflowFormData } from '@/hooks/useAIAutomation';

interface CreateWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: WorkflowFormData) => Promise<boolean>;
  triggerTypes: { value: string; label: string; icon: string }[];
  actionTypes: { value: string; label: string; icon: string }[];
  categories: string[];
}

const CreateWorkflowDialog: React.FC<CreateWorkflowDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  triggerTypes,
  actionTypes,
  categories
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    description: '',
    category: 'general',
    trigger_type: 'manual',
    trigger_config: {},
    conditions: [],
    actions: [{ type: 'send_alert', config: { channel: 'dashboard' } }],
    priority: 5,
    is_active: true
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const success = await onSubmit(formData);
      if (success) {
        resetForm();
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'general',
      trigger_type: 'manual',
      trigger_config: {},
      conditions: [],
      actions: [{ type: 'send_alert', config: { channel: 'dashboard' } }],
      priority: 5,
      is_active: true
    });
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: 'send_notification', config: {} }]
    });
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  };

  const updateAction = (index: number, type: string) => {
    const newActions = [...formData.actions];
    newActions[index] = { type, config: {} };
    setFormData({ ...formData, actions: newActions });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Nouveau Workflow
          </DialogTitle>
          <DialogDescription>
            Créez un workflow d'automatisation personnalisé
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="wf-name">Nom du workflow *</Label>
            <Input
              id="wf-name"
              placeholder="Ex: Alerte stock critique..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="wf-desc">Description</Label>
            <Textarea
              id="wf-desc"
              placeholder="Décrivez le but de ce workflow..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Priorité (1-10)</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })}
              />
            </div>
          </div>

          {/* Trigger */}
          <div className="space-y-2">
            <Label>Déclencheur</Label>
            <Select 
              value={formData.trigger_type} 
              onValueChange={(v) => setFormData({ ...formData, trigger_type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {triggerTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Actions</Label>
              <Button type="button" variant="outline" size="sm" onClick={addAction}>
                <Plus className="h-3 w-3 mr-1" />
                Ajouter
              </Button>
            </div>
            <div className="space-y-2">
              {formData.actions.map((action, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                  <Badge variant="secondary">{index + 1}</Badge>
                  <Select 
                    value={action.type} 
                    onValueChange={(v) => updateAction(index, v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionTypes.map(a => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.actions.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeAction(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Active */}
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <Label>Activer immédiatement</Label>
              <p className="text-xs text-muted-foreground">Le workflow sera exécuté selon son déclencheur</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim() || isSubmitting}>
            {isSubmitting ? 'Création...' : 'Créer le workflow'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkflowDialog;
