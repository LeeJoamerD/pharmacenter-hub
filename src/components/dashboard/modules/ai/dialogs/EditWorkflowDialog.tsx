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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Settings } from 'lucide-react';
import type { AutomationWorkflow, WorkflowFormData } from '@/hooks/useAIAutomation';

interface EditWorkflowDialogProps {
  workflow: AutomationWorkflow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: Partial<WorkflowFormData>) => Promise<boolean>;
  triggerTypes: { value: string; label: string; icon: string }[];
  actionTypes: { value: string; label: string; icon: string }[];
  categories: string[];
}

const EditWorkflowDialog: React.FC<EditWorkflowDialogProps> = ({
  workflow,
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
    actions: [],
    priority: 5,
    is_active: true
  });

  useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name,
        description: workflow.description || '',
        category: workflow.category,
        trigger_type: workflow.trigger_type,
        trigger_config: workflow.trigger_config,
        conditions: workflow.conditions,
        actions: workflow.actions,
        priority: workflow.priority,
        is_active: workflow.is_active
      });
    }
  }, [workflow]);

  const handleSubmit = async () => {
    if (!workflow || !formData.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const success = await onSubmit(workflow.id, formData);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
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

  if (!workflow) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Modifier le Workflow
          </DialogTitle>
          <DialogDescription>
            Modifiez les paramètres du workflow "{workflow.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="edit-wf-name">Nom du workflow *</Label>
            <Input
              id="edit-wf-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-wf-desc">Description</Label>
            <Textarea
              id="edit-wf-desc"
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
              <Label>Workflow actif</Label>
              <p className="text-xs text-muted-foreground">Activer ou désactiver ce workflow</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          {/* Stats */}
          <div className="bg-muted/50 p-3 rounded-md">
            <div className="text-sm text-muted-foreground">
              <p>Exécutions: {workflow.execution_count} | Succès: {workflow.success_count} | Échecs: {workflow.failure_count}</p>
              <p>Temps moyen: {workflow.avg_execution_time_ms}ms</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim() || isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditWorkflowDialog;
