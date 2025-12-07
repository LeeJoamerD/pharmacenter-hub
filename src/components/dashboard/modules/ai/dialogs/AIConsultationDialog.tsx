import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Send, Loader2, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';

interface AIConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAsk: (question: string, type: string, context?: any) => Promise<{ response: string; confidence: number } | null>;
}

const AIConsultationDialog: React.FC<AIConsultationDialogProps> = ({
  open,
  onOpenChange,
  onAsk
}) => {
  const [question, setQuestion] = useState('');
  const [consultationType, setConsultationType] = useState('general');
  const [response, setResponse] = useState<{ text: string; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim() || loading) return;
    
    setLoading(true);
    setResponse(null);
    
    try {
      const result = await onAsk(question, consultationType);
      if (result) {
        setResponse({
          text: result.response,
          confidence: result.confidence
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuestion('');
    setResponse(null);
    onOpenChange(false);
  };

  const consultationTypes = [
    { value: 'general', label: 'Question générale' },
    { value: 'drug_info', label: 'Information médicament' },
    { value: 'interaction', label: 'Vérification interaction' },
    { value: 'dosage', label: 'Conseil posologique' },
    { value: 'contraindication', label: 'Contre-indication' },
    { value: 'recommendation', label: 'Recommandation thérapeutique' }
  ];

  const quickQuestions = [
    "Quelle est la posologie du paracétamol chez l'adulte ?",
    "Peut-on associer aspirine et anticoagulants ?",
    "Quels sont les effets secondaires des AINS ?",
    "Traitement de première intention pour une rhinite allergique ?"
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Consultation IA Pharmaceutique
          </DialogTitle>
          <DialogDescription>
            Posez une question à l'expert IA en pharmacologie
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type de consultation */}
          <div className="space-y-2">
            <Label>Type de consultation</Label>
            <Select value={consultationType} onValueChange={setConsultationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {consultationTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick questions */}
          {!response && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Questions rapides</Label>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, index) => (
                  <Badge 
                    key={index}
                    variant="outline" 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => setQuestion(q)}
                  >
                    {q.substring(0, 40)}...
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Question input */}
          <div className="space-y-2">
            <Label htmlFor="question">Votre question</Label>
            <Textarea
              id="question"
              placeholder="Posez votre question pharmaceutique..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Submit button */}
          <Button 
            onClick={handleAsk} 
            disabled={!question.trim() || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer la question
              </>
            )}
          </Button>

          {/* Response */}
          {response && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">Réponse de l'IA</span>
                </div>
                <Badge variant="outline">
                  Confiance: {Math.round(response.confidence * 100)}%
                </Badge>
              </div>
              
              <ScrollArea className="h-[200px] w-full rounded-lg border p-4 bg-muted/30">
                <div className="prose prose-sm max-w-none">
                  {response.text.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-2 text-sm">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </ScrollArea>

              {/* Feedback buttons */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cette réponse vous a-t-elle été utile ?</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Oui
                  </Button>
                  <Button variant="outline" size="sm">
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    Non
                  </Button>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700">
                  <strong>Avertissement:</strong> Ces informations sont fournies à titre indicatif 
                  et ne remplacent pas l'avis d'un professionnel de santé. Vérifiez toujours 
                  les sources officielles (RCP, Vidal, ANSM).
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIConsultationDialog;
