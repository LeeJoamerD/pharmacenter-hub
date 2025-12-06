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
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Settings, Loader2, X } from 'lucide-react';
import type { AIModel } from '@/hooks/useNetworkConversationalAI';

interface ConfigureModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: AIModel | null;
  onSave: (id: string, updates: Partial<AIModel>) => Promise<void>;
}

const ConfigureModelDialog = ({
  open,
  onOpenChange,
  model,
  onSave,
}: ConfigureModelDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxTokens, setMaxTokens] = useState(2048);
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [newCapability, setNewCapability] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (model) {
      setName(model.name);
      setDescription(model.description || '');
      setMaxTokens(model.max_tokens);
      setTemperature(model.temperature);
      setSystemPrompt(model.system_prompt || '');
      setCapabilities(model.capabilities || []);
    }
  }, [model]);

  const handleSave = async () => {
    if (!model) return;
    
    setLoading(true);
    try {
      await onSave(model.id, {
        name,
        description,
        max_tokens: maxTokens,
        temperature,
        system_prompt: systemPrompt,
        capabilities,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const addCapability = () => {
    if (newCapability.trim() && !capabilities.includes(newCapability.trim())) {
      setCapabilities([...capabilities, newCapability.trim()]);
      setNewCapability('');
    }
  };

  const removeCapability = (cap: string) => {
    setCapabilities(capabilities.filter(c => c !== cap));
  };

  if (!model) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configurer le Modèle IA
          </DialogTitle>
          <DialogDescription>
            Personnalisez les paramètres de {model.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du modèle</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={model.is_system}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              disabled={model.is_system}
            />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Max Tokens: {maxTokens}</Label>
                <span className="text-sm text-muted-foreground">100 - 4000</span>
              </div>
              <Slider
                value={[maxTokens]}
                onValueChange={([value]) => setMaxTokens(value)}
                min={100}
                max={4000}
                step={100}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Temperature: {temperature.toFixed(2)}</Label>
                <span className="text-sm text-muted-foreground">0.0 - 1.0</span>
              </div>
              <Slider
                value={[temperature * 100]}
                onValueChange={([value]) => setTemperature(value / 100)}
                min={0}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Plus bas = plus déterministe, plus haut = plus créatif
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">Prompt Système</Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              placeholder="Instructions système pour le modèle..."
              disabled={model.is_system}
            />
          </div>

          <div className="space-y-2">
            <Label>Capacités</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {capabilities.map((cap) => (
                <Badge key={cap} variant="secondary" className="gap-1">
                  {cap}
                  {!model.is_system && (
                    <button onClick={() => removeCapability(cap)}>
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {!model.is_system && (
              <div className="flex gap-2">
                <Input
                  placeholder="Nouvelle capacité..."
                  value={newCapability}
                  onChange={(e) => setNewCapability(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCapability()}
                />
                <Button variant="outline" onClick={addCapability}>
                  Ajouter
                </Button>
              </div>
            )}
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Informations du modèle</p>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>
                <span className="text-muted-foreground">Provider:</span>{' '}
                <span className="font-medium">{model.provider}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Identifiant:</span>{' '}
                <span className="font-medium">{model.model_identifier}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Spécialisation:</span>{' '}
                <span className="font-medium">{model.specialization}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Système:</span>{' '}
                <span className="font-medium">{model.is_system ? 'Oui' : 'Non'}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigureModelDialog;
