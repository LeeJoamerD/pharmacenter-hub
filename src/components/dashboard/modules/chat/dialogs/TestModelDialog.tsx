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
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Play, Loader2, Clock, Zap, Bot } from 'lucide-react';
import type { AIModel } from '@/hooks/useNetworkConversationalAI';

interface TestModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: AIModel | null;
  onTest: (modelId: string, prompt: string) => Promise<string | null>;
}

const TestModelDialog = ({
  open,
  onOpenChange,
  model,
  onTest,
}: TestModelDialogProps) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<{
    responseTime: number;
    tokens: number;
  } | null>(null);

  const handleTest = async () => {
    if (!model || !prompt.trim()) return;
    
    setLoading(true);
    setResponse('');
    setMetrics(null);
    
    const startTime = Date.now();
    
    try {
      const result = await onTest(model.id, prompt);
      const endTime = Date.now();
      
      if (result) {
        setResponse(result);
        setMetrics({
          responseTime: endTime - startTime,
          tokens: Math.ceil(result.length / 4), // Approximation
        });
      }
    } catch (error) {
      setResponse('Erreur lors du test: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = [
    "Quels sont les médicaments les plus vendus en pharmacie ?",
    "Comment optimiser la rotation des stocks ?",
    "Explique les interactions médicamenteuses courantes",
    "Quelles sont les tendances du marché pharmaceutique ?",
  ];

  if (!model) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Tester le Modèle IA
          </DialogTitle>
          <DialogDescription>
            Testez les capacités de {model.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Modèle:</span>
            <Badge variant="outline">{model.model_identifier}</Badge>
            <Badge variant="secondary">{model.specialization}</Badge>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt de test</label>
            <Textarea
              placeholder="Entrez votre question ou instruction..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs text-muted-foreground">Suggestions:</span>
              {suggestedPrompts.map((suggestion, idx) => (
                <button
                  key={idx}
                  className="text-xs text-primary hover:underline"
                  onClick={() => setPrompt(suggestion)}
                >
                  "{suggestion.substring(0, 30)}..."
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleTest}
            disabled={!prompt.trim() || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Lancer le test
              </>
            )}
          </Button>

          {response && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Réponse</label>
                {metrics && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {(metrics.responseTime / 1000).toFixed(2)}s
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      ~{metrics.tokens} tokens
                    </span>
                  </div>
                )}
              </div>
              <ScrollArea className="h-48 w-full rounded-md border p-4">
                <p className="text-sm whitespace-pre-wrap">{response}</p>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestModelDialog;
