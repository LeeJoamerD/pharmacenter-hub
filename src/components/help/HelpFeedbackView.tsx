import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, AlertTriangle, Lightbulb, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type FeedbackType = 'compliment' | 'problem' | 'suggestion' | null;

const feedbackOptions = [
  {
    type: 'compliment' as const,
    icon: Heart,
    title: 'Complimenter',
    description: 'Dites-nous ce que vous aimez',
    color: 'text-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800',
    hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-950/20',
  },
  {
    type: 'problem' as const,
    icon: AlertTriangle,
    title: 'Signaler un problème',
    description: 'Quelque chose ne fonctionne pas ?',
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
    hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-950/20',
  },
  {
    type: 'suggestion' as const,
    icon: Lightbulb,
    title: 'Faire une suggestion',
    description: 'Proposez une amélioration',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-950/20',
  },
];

export function HelpFeedbackView() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<FeedbackType>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!feedback.trim()) {
      toast({ title: 'Veuillez saisir votre commentaire', variant: 'destructive' });
      return;
    }
    setSubmitted(true);
    toast({ title: 'Merci pour votre retour !' });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-base font-semibold mb-2">Merci pour votre retour !</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Votre commentaire nous aide à améliorer PharmaSoft.
        </p>
        <Button variant="outline" size="sm" onClick={() => { setSubmitted(false); setSelectedType(null); setFeedback(''); }}>
          Envoyer un autre commentaire
        </Button>
      </div>
    );
  }

  if (selectedType) {
    const option = feedbackOptions.find(o => o.type === selectedType)!;
    return (
      <ScrollArea className="h-full">
        <div className="px-4 py-5 space-y-4">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 h-8 text-xs" onClick={() => setSelectedType(null)}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Button>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${option.bg}`}>
              <option.icon className={`h-5 w-5 ${option.color}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{option.title}</h3>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
          </div>
          <Textarea
            placeholder="Écrivez votre commentaire ici..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="text-sm min-h-[160px] resize-none"
            autoFocus
          />
          <Button className="w-full gap-2" onClick={handleSubmit}>
            <Send className="h-4 w-4" />
            Envoyer
          </Button>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="px-4 py-5 space-y-4">
        <div className="text-center space-y-1">
          <h3 className="text-base font-semibold">Vos commentaires</h3>
          <p className="text-sm text-muted-foreground">
            Aidez-nous à améliorer PharmaSoft en partageant votre expérience.
          </p>
        </div>

        <div className="space-y-2">
          {feedbackOptions.map((option) => (
            <button
              key={option.type}
              className={`w-full flex items-center gap-3 p-4 rounded-lg border border-border transition-colors ${option.hoverBg} text-left`}
              onClick={() => setSelectedType(option.type)}
            >
              <div className={`p-2.5 rounded-lg ${option.bg}`}>
                <option.icon className={`h-5 w-5 ${option.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{option.title}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          Vos commentaires sont anonymes et nous aident à prioriser les améliorations.
        </p>
      </div>
    </ScrollArea>
  );
}
