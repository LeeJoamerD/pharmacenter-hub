import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import type { AIProviderConnection } from '@/hooks/useAIIntegrations';

interface AIProviderConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: AIProviderConnection | null;
  onSave: (provider: Partial<AIProviderConnection>) => void;
  mode: 'create' | 'edit';
}

const PROVIDER_TYPES = [
  { value: 'ai_gateway', label: 'Lovable AI Gateway' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'custom', label: 'Custom API' },
];

const DEFAULT_MODELS: Record<string, string[]> = {
  ai_gateway: ['google/gemini-2.5-flash', 'google/gemini-2.5-pro', 'openai/gpt-5', 'openai/gpt-5-mini'],
  openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  gemini: ['gemini-pro', 'gemini-pro-vision', 'gemini-ultra'],
  anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  custom: [],
};

export function AIProviderConfigDialog({ open, onOpenChange, provider, onSave, mode }: AIProviderConfigDialogProps) {
  const [formData, setFormData] = useState<Partial<AIProviderConnection>>({
    provider_name: '',
    provider_type: 'ai_gateway',
    api_endpoint: '',
    api_key_encrypted: '',
    model_name: 'google/gemini-2.5-flash',
    is_active: true,
    is_default: false,
    max_tokens: 4096,
    temperature: 0.7,
    config: {},
  });

  useEffect(() => {
    if (provider && mode === 'edit') {
      setFormData({
        provider_name: provider.provider_name,
        provider_type: provider.provider_type,
        api_endpoint: provider.api_endpoint || '',
        api_key_encrypted: provider.api_key_encrypted || '',
        model_name: provider.model_name || '',
        is_active: provider.is_active,
        is_default: provider.is_default,
        max_tokens: provider.max_tokens,
        temperature: provider.temperature,
        config: provider.config || {},
      });
    } else {
      setFormData({
        provider_name: '',
        provider_type: 'ai_gateway',
        api_endpoint: '',
        api_key_encrypted: '',
        model_name: 'google/gemini-2.5-flash',
        is_active: true,
        is_default: false,
        max_tokens: 4096,
        temperature: 0.7,
        config: {},
      });
    }
  }, [provider, mode, open]);

  const handleSave = () => {
    if (!formData.provider_name) return;
    onSave(formData);
    onOpenChange(false);
  };

  const availableModels = DEFAULT_MODELS[formData.provider_type || 'ai_gateway'] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Ajouter un Connecteur IA' : 'Modifier le Connecteur'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="provider_name">Nom du fournisseur *</Label>
            <Input
              id="provider_name"
              value={formData.provider_name}
              onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
              placeholder="Ex: Mon API OpenAI"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider_type">Type de fournisseur</Label>
            <Select
              value={formData.provider_type}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                provider_type: value,
                model_name: DEFAULT_MODELS[value]?.[0] || '',
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableModels.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="model_name">Modèle</Label>
              <Select
                value={formData.model_name || ''}
                onValueChange={(value) => setFormData({ ...formData, model_name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un modèle" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.provider_type === 'custom' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="api_endpoint">Endpoint API</Label>
                <Input
                  id="api_endpoint"
                  value={formData.api_endpoint || ''}
                  onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                  placeholder="https://api.example.com/v1/chat"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model_name_custom">Nom du modèle</Label>
                <Input
                  id="model_name_custom"
                  value={formData.model_name || ''}
                  onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                  placeholder="my-custom-model"
                />
              </div>
            </>
          )}

          {formData.provider_type !== 'ai_gateway' && (
            <div className="space-y-2">
              <Label htmlFor="api_key">Clé API</Label>
              <Input
                id="api_key"
                type="password"
                value={formData.api_key_encrypted || ''}
                onChange={(e) => setFormData({ ...formData, api_key_encrypted: e.target.value })}
                placeholder="sk-..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Max Tokens: {formData.max_tokens}</Label>
            <Slider
              value={[formData.max_tokens || 4096]}
              onValueChange={([value]) => setFormData({ ...formData, max_tokens: value })}
              min={256}
              max={128000}
              step={256}
            />
          </div>

          <div className="space-y-2">
            <Label>Temperature: {formData.temperature?.toFixed(2)}</Label>
            <Slider
              value={[formData.temperature || 0.7]}
              onValueChange={([value]) => setFormData({ ...formData, temperature: value })}
              min={0}
              max={2}
              step={0.1}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Actif</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_default">Fournisseur par défaut</Label>
            <Switch
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!formData.provider_name}>
            {mode === 'create' ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
