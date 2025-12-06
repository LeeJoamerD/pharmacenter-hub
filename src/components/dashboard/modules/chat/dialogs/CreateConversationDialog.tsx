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
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Bot, Loader2 } from 'lucide-react';
import type { AIModel } from '@/hooks/useNetworkConversationalAI';

interface CreateConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiModels: AIModel[];
  onCreateConversation: (
    title: string,
    context: string,
    modelId: string | null,
    participants: string[]
  ) => Promise<any>;
}

const contexts = [
  { value: 'general', label: 'Général' },
  { value: 'gestion_stock', label: 'Gestion de Stock' },
  { value: 'ventes', label: 'Ventes et Performance' },
  { value: 'formation', label: 'Formation' },
  { value: 'reglementation', label: 'Réglementation' },
  { value: 'support', label: 'Support Technique' },
  { value: 'analytics', label: 'Analytics et Rapports' },
];

const CreateConversationDialog = ({
  open,
  onOpenChange,
  aiModels,
  onCreateConversation,
}: CreateConversationDialogProps) => {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('general');
  const [modelId, setModelId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const activeModels = aiModels.filter(m => m.status === 'active');
  const defaultModel = activeModels.find(m => m.is_default) || activeModels[0];

  const handleSubmit = async () => {
    if (!title.trim()) return;
    
    setLoading(true);
    try {
      const result = await onCreateConversation(
        title.trim(),
        context,
        modelId || defaultModel?.id || null,
        []
      );
      
      if (result) {
        setTitle('');
        setContext('general');
        setModelId('');
        setDescription('');
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Nouvelle Conversation IA
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle conversation avec l'assistant IA du réseau
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la conversation *</Label>
            <Input
              id="title"
              placeholder="Ex: Optimisation des stocks janvier"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Contexte</Label>
            <Select value={context} onValueChange={setContext}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contexts.map((ctx) => (
                  <SelectItem key={ctx.value} value={ctx.value}>
                    {ctx.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modèle IA</Label>
            <Select value={modelId || defaultModel?.id || ''} onValueChange={setModelId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un modèle" />
              </SelectTrigger>
              <SelectContent>
                {activeModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <span>{model.name}</span>
                      {model.is_default && (
                        <span className="text-xs text-muted-foreground">(par défaut)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Décrivez brièvement l'objectif de cette conversation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Créer la conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateConversationDialog;
