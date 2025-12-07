import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Brain, Send, Loader2, User, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIBIConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultationType: 'predictive' | 'pattern_discovery' | 'segmentation' | 'optimization';
  onConsult: (
    type: 'predictive' | 'pattern_discovery' | 'segmentation' | 'optimization',
    question: string,
    onChunk: (chunk: string) => void
  ) => Promise<string>;
}

export const AIBIConsultationDialog: React.FC<AIBIConsultationDialogProps> = ({
  open,
  onOpenChange,
  consultationType,
  onConsult
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getTypeLabel = () => {
    switch (consultationType) {
      case 'predictive': return 'Analyse Prédictive';
      case 'pattern_discovery': return 'Découverte de Patterns';
      case 'segmentation': return 'Segmentation Clients';
      case 'optimization': return 'Optimisation Processus';
      default: return 'Consultation IA';
    }
  };

  const getPlaceholder = () => {
    switch (consultationType) {
      case 'predictive': 
        return 'Ex: Quels clients sont les plus susceptibles de partir ? Comment améliorer la rétention ?';
      case 'pattern_discovery': 
        return 'Ex: Quels patterns devrais-je exploiter en priorité ? Y a-t-il des corrélations cachées ?';
      case 'segmentation': 
        return 'Ex: Comment mieux cibler le segment "À Risque" ? Quelles actions pour les clients Premium ?';
      case 'optimization': 
        return 'Ex: Comment optimiser le processus de réception ? Quel impact sur la productivité ?';
      default:
        return 'Posez votre question...';
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      setMessages([{
        role: 'assistant',
        content: `Bonjour ! Je suis votre assistant BI spécialisé en ${getTypeLabel().toLowerCase()}. Comment puis-je vous aider aujourd'hui ?`
      }]);
    }
  }, [open, consultationType]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Add empty assistant message that will be streamed
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      await onConsult(consultationType, userMessage, (chunk) => {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content += chunk;
          }
          return [...newMessages];
        });
      });
    } catch (error) {
      console.error('Error consulting AI:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = 'Désolé, une erreur est survenue. Veuillez réessayer.';
        }
        return [...newMessages];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Consultation IA - {getTypeLabel()}
          </DialogTitle>
          <DialogDescription>
            Posez vos questions pour obtenir des insights personnalisés
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            <div className="space-y-4 py-4">
              {messages.map((message, idx) => (
                <div 
                  key={idx}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.role === 'assistant' && message.content === '' && isLoading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="pt-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                className="resize-none"
                rows={2}
                disabled={isLoading}
              />
              <Button 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading}
                className="self-end"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="mt-2 flex gap-2">
              <Badge variant="outline" className="text-xs">
                {getTypeLabel()}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Shift+Enter pour nouvelle ligne
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
