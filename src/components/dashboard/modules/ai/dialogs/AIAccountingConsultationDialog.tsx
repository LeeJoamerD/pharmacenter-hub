import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, ThumbsUp, ThumbsDown, Loader2, Calculator, FileText, TrendingUp, Shield, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AIAccountingConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAsk: (question: string, type: string) => Promise<{ response: string; confidence: number } | null>;
  onRate: (id: string, isUseful: boolean) => Promise<boolean>;
  consultations: any[];
  isLoading: boolean;
}

const AIAccountingConsultationDialog: React.FC<AIAccountingConsultationDialogProps> = ({
  open,
  onOpenChange,
  onAsk,
  onRate,
  consultations,
  isLoading,
}) => {
  const [question, setQuestion] = React.useState('');
  const [consultationType, setConsultationType] = React.useState('general');
  const [currentResponse, setCurrentResponse] = React.useState<{ response: string; confidence: number } | null>(null);
  const [lastConsultationId, setLastConsultationId] = React.useState<string | null>(null);

  const consultationTypes = [
    { value: 'general', label: 'Général', icon: <Bot className="h-4 w-4" /> },
    { value: 'accounting', label: 'Comptabilité', icon: <Calculator className="h-4 w-4" /> },
    { value: 'fiscal', label: 'Fiscalité', icon: <FileText className="h-4 w-4" /> },
    { value: 'tax_optimization', label: 'Optimisation fiscale', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'compliance', label: 'Conformité', icon: <Shield className="h-4 w-4" /> },
    { value: 'audit', label: 'Audit', icon: <Search className="h-4 w-4" /> },
  ];

  const suggestedQuestions = [
    'Comment équilibrer une écriture comptable déséquilibrée ?',
    'Quelles sont les échéances de TVA ce trimestre ?',
    'Comment optimiser la déduction des charges ?',
    'Quels documents conserver pour un contrôle fiscal ?',
    'Comment enregistrer une immobilisation amortissable ?',
  ];

  const handleAsk = async () => {
    if (!question.trim() || isLoading) return;
    const result = await onAsk(question, consultationType);
    if (result) {
      setCurrentResponse(result);
      // Get the latest consultation ID for rating
      if (consultations.length > 0) {
        setLastConsultationId(consultations[0].id);
      }
    }
    setQuestion('');
  };

  const handleRate = async (isUseful: boolean) => {
    if (lastConsultationId) {
      await onRate(lastConsultationId, isUseful);
      setCurrentResponse(null);
      setLastConsultationId(null);
    }
  };

  const handleSuggestedQuestion = (q: string) => {
    setQuestion(q);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Expert Comptable IA - Consultation
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Zone de réponse actuelle */}
          {currentResponse && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <span className="font-medium">Réponse de l'Expert IA</span>
                </div>
                <Badge variant="outline">
                  Confiance: {(currentResponse.confidence * 100).toFixed(0)}%
                </Badge>
              </div>
              <ScrollArea className="h-48">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {currentResponse.response}
                </div>
              </ScrollArea>
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">Cette réponse vous a-t-elle été utile ?</span>
                <Button size="sm" variant="outline" onClick={() => handleRate(true)}>
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Oui
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRate(false)}>
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  Non
                </Button>
              </div>
            </div>
          )}

          {/* Historique des consultations */}
          {!currentResponse && consultations.length > 0 && (
            <div className="space-y-2">
              <Label>Consultations récentes</Label>
              <ScrollArea className="h-48 border rounded-lg">
                <div className="p-3 space-y-3">
                  {consultations.slice(0, 5).map((c) => (
                    <div key={c.id} className="border-b pb-2 last:border-0">
                      <p className="text-sm font-medium truncate">{c.question}</p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {c.ai_response?.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Questions suggérées */}
          {!currentResponse && (
            <div className="space-y-2">
              <Label>Questions suggérées</Label>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuestion(q)}
                    className="text-xs"
                  >
                    {q.length > 40 ? q.substring(0, 40) + '...' : q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Formulaire de question */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Select value={consultationType} onValueChange={setConsultationType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {consultationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Textarea
                placeholder="Posez votre question comptable ou fiscale..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
              />
              <Button
                onClick={handleAsk}
                disabled={!question.trim() || isLoading}
                className="self-end"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIAccountingConsultationDialog;
