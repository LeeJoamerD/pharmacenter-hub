import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { 
  MessageSquare, 
  Globe,
  Lock,
  Building,
  Users,
  Truck,
  Server
} from 'lucide-react';

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateChannel: (data: {
    name: string;
    description: string;
    type: string;
    category: string;
    isPublic: boolean;
    isSystem: boolean;
    autoArchiveDays?: number;
  }) => Promise<void>;
  loading?: boolean;
}

const CHANNEL_TYPES = [
  { value: 'public', label: 'Public', icon: Globe, description: 'Visible par tous les membres' },
  { value: 'private', label: 'Privé', icon: Lock, description: 'Accès sur invitation uniquement' },
  { value: 'direct', label: 'Direct', icon: Users, description: 'Conversation directe entre utilisateurs' }
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

const CreateChannelDialog = ({
  open,
  onOpenChange,
  onCreateChannel,
  loading = false
}: CreateChannelDialogProps) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('public');
  const [category, setCategory] = useState('general');
  const [isPublic, setIsPublic] = useState(true);
  const [isSystem, setIsSystem] = useState(false);
  const [autoArchive, setAutoArchive] = useState(false);
  const [autoArchiveDays, setAutoArchiveDays] = useState(90);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du canal est requis.",
        variant: "destructive"
      });
      return;
    }

    try {
      await onCreateChannel({
        name: name.trim(),
        description: description.trim(),
        type,
        category,
        isPublic,
        isSystem,
        autoArchiveDays: autoArchive ? autoArchiveDays : undefined
      });

      toast({
        title: "Canal créé",
        description: `Le canal "${name}" a été créé avec succès.`
      });

      // Reset form
      setName('');
      setDescription('');
      setType('public');
      setCategory('general');
      setIsPublic(true);
      setIsSystem(false);
      setAutoArchive(false);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le canal.",
        variant: "destructive"
      });
    }
  };

  const selectedType = CHANNEL_TYPES.find(t => t.value === type);
  const TypeIcon = selectedType?.icon || MessageSquare;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Créer un Nouveau Canal
          </DialogTitle>
          <DialogDescription>
            Créez un canal de communication pour le réseau de pharmacies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nom du canal */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom du canal *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Urgences Régionales"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'objectif de ce canal..."
              rows={2}
            />
          </div>

          {/* Type de canal */}
          <div className="space-y-2">
            <Label>Type de canal</Label>
            <div className="grid gap-2 grid-cols-2">
              {CHANNEL_TYPES.map(({ value, label, icon: Icon, description }) => (
                <div
                  key={value}
                  onClick={() => setType(value)}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    type === value
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs text-muted-foreground">{description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Catégorie */}
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

          {/* Options */}
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
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Canal système</Label>
                <p className="text-xs text-muted-foreground">
                  Réservé aux notifications automatiques
                </p>
              </div>
              <Switch checked={isSystem} onCheckedChange={setIsSystem} />
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            <TypeIcon className="h-4 w-4 mr-2" />
            Créer le canal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChannelDialog;
