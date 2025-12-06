import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Settings, Globe, Lock, Loader2 } from 'lucide-react';

interface ChannelData {
  id: string;
  name: string;
  description?: string;
  type: string;
  category?: string;
  is_public?: boolean;
  is_system: boolean;
  auto_archive_days?: number;
}

interface EditChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: ChannelData | null;
  onSave: (id: string, updates: Partial<ChannelData>) => Promise<void>;
  loading?: boolean;
}

const CHANNEL_TYPES = [
  { value: 'team', label: 'Équipe' },
  { value: 'function', label: 'Fonction' },
  { value: 'supplier', label: 'Fournisseur' },
  { value: 'system', label: 'Système' }
];

const CHANNEL_CATEGORIES = [
  { value: 'general', label: 'Général' },
  { value: 'urgences', label: 'Urgences' },
  { value: 'commandes', label: 'Commandes' },
  { value: 'stock', label: 'Stock' },
  { value: 'pharmacovigilance', label: 'Pharmacovigilance' },
  { value: 'formation', label: 'Formation' },
  { value: 'administration', label: 'Administration' }
];

const EditChannelDialog = ({
  open,
  onOpenChange,
  channel,
  onSave,
  loading = false
}: EditChannelDialogProps) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('team');
  const [category, setCategory] = useState('general');
  const [isPublic, setIsPublic] = useState(true);
  const [autoArchive, setAutoArchive] = useState(false);
  const [autoArchiveDays, setAutoArchiveDays] = useState(90);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (channel) {
      setName(channel.name || '');
      setDescription(channel.description || '');
      setType(channel.type || 'team');
      setCategory(channel.category || 'general');
      setIsPublic(channel.is_public ?? true);
      setAutoArchive(!!channel.auto_archive_days);
      setAutoArchiveDays(channel.auto_archive_days || 90);
    }
  }, [channel]);

  const handleSubmit = async () => {
    if (!channel || !name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du canal est requis.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      await onSave(channel.id, {
        name: name.trim(),
        description: description.trim(),
        type,
        category,
        is_public: isPublic,
        auto_archive_days: autoArchive ? autoArchiveDays : undefined
      });

      toast({
        title: "Canal mis à jour",
        description: `Le canal "${name}" a été modifié avec succès.`
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le canal.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!channel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Modifier le Canal
          </DialogTitle>
          <DialogDescription>
            Modifiez les paramètres du canal "{channel.name}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nom du canal *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Urgences Régionales"
              disabled={channel.is_system}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'objectif de ce canal..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de canal</Label>
              <Select value={type} onValueChange={setType} disabled={channel.is_system}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 border rounded-lg p-4">
            <h4 className="font-medium text-sm">Options</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Globe className="h-4 w-4 text-green-600" />
                ) : (
                  <Lock className="h-4 w-4 text-orange-600" />
                )}
                <div>
                  <Label>Canal public</Label>
                  <p className="text-xs text-muted-foreground">
                    {isPublic ? 'Visible par toutes les pharmacies' : 'Accès sur invitation uniquement'}
                  </p>
                </div>
              </div>
              <Switch 
                checked={isPublic} 
                onCheckedChange={setIsPublic}
                disabled={channel.is_system}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-archivage</Label>
                <p className="text-xs text-muted-foreground">
                  Archiver automatiquement après inactivité
                </p>
              </div>
              <Switch checked={autoArchive} onCheckedChange={setAutoArchive} />
            </div>

            {autoArchive && (
              <div className="pl-6">
                <Label className="text-xs">Jours d'inactivité avant archivage</Label>
                <Input
                  type="number"
                  value={autoArchiveDays}
                  onChange={(e) => setAutoArchiveDays(Number(e.target.value))}
                  min={7}
                  max={365}
                  className="w-24 mt-1"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving || loading || !name.trim()}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditChannelDialog;
