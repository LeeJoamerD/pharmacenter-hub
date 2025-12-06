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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Folder } from 'lucide-react';
import type { CollaborativeWorkspace } from '@/hooks/useCollaborativeProductivity';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (workspace: Partial<CollaborativeWorkspace>) => Promise<void>;
  isSubmitting?: boolean;
}

const WORKSPACE_ICONS = [
  { value: 'folder', label: 'Dossier' },
  { value: 'target', label: 'Objectif' },
  { value: 'trending-up', label: 'Croissance' },
  { value: 'users', label: 'Équipe' },
  { value: 'briefcase', label: 'Business' },
  { value: 'book', label: 'Documentation' },
  { value: 'star', label: 'Important' },
  { value: 'zap', label: 'Projet' }
];

const WORKSPACE_COLORS = [
  { value: 'primary', label: 'Bleu', class: 'bg-primary' },
  { value: 'green', label: 'Vert', class: 'bg-green-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'purple', label: 'Violet', class: 'bg-purple-500' },
  { value: 'red', label: 'Rouge', class: 'bg-red-500' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' }
];

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false
}: CreateWorkspaceDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('folder');
  const [color, setColor] = useState('primary');
  const [isNetworkWorkspace, setIsNetworkWorkspace] = useState(false);
  const [goals, setGoals] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [newGoal, setNewGoal] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      icon,
      color,
      is_network_workspace: isNetworkWorkspace,
      goals,
      milestones: [],
      settings: {}
    });
    
    // Reset form
    setName('');
    setDescription('');
    setIcon('folder');
    setColor('primary');
    setIsNetworkWorkspace(false);
    setGoals([]);
    onOpenChange(false);
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, {
        id: crypto.randomUUID(),
        title: newGoal.trim(),
        completed: false
      }]);
      setNewGoal('');
    }
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Nouvel Espace de Travail
            </DialogTitle>
            <DialogDescription>
              Créer un espace collaboratif pour vos projets
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom de l'espace *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Projet Qualité 2024"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Objectifs et description du projet..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Icône</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKSPACE_ICONS.map((ic) => (
                      <SelectItem key={ic.value} value={ic.value}>
                        {ic.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Couleur</Label>
                <div className="flex gap-2 flex-wrap">
                  {WORKSPACE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`w-8 h-8 rounded-full ${c.class} ${
                        color === c.value ? 'ring-2 ring-offset-2 ring-primary' : ''
                      }`}
                      onClick={() => setColor(c.value)}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Objectifs initiaux</Label>
              <div className="flex gap-2">
                <Input
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Ajouter un objectif"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                />
                <Button type="button" variant="outline" size="icon" onClick={addGoal}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {goals.length > 0 && (
                <div className="space-y-2 mt-2">
                  {goals.map((goal) => (
                    <div key={goal.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <span className="flex-1 text-sm">{goal.title}</span>
                      <button type="button" onClick={() => removeGoal(goal.id)}>
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Espace réseau</Label>
                <p className="text-xs text-muted-foreground">
                  Permet d'inviter des membres d'autres officines
                </p>
              </div>
              <Switch
                checked={isNetworkWorkspace}
                onCheckedChange={setIsNetworkWorkspace}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Création...' : 'Créer l\'espace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
