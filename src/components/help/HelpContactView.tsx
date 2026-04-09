import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Headphones, Mail, Send, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function HelpContactView() {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: 'Veuillez remplir tous les champs', variant: 'destructive' });
      return;
    }
    setSubmitted(true);
    toast({ title: 'Demande envoyée', description: 'Notre équipe vous répondra dans les plus brefs délais.' });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-base font-semibold mb-2">Demande envoyée !</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Notre équipe de support a bien reçu votre message et vous répondra dans les meilleurs délais.
        </p>
        <Button variant="outline" size="sm" onClick={() => { setSubmitted(false); setSubject(''); setMessage(''); }}>
          Envoyer une autre demande
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="px-4 py-5 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Headphones className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold">Nous sommes là pour vous aider</h3>
          <p className="text-sm text-muted-foreground">
            Décrivez votre problème ou votre question et notre équipe vous répondra rapidement.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="help-subject" className="text-sm">Sujet</Label>
            <Input
              id="help-subject"
              placeholder="Ex : Problème avec l'impression du ticket"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="help-message" className="text-sm">Description détaillée</Label>
            <Textarea
              id="help-message"
              placeholder="Décrivez votre problème en détail. Incluez les étapes pour le reproduire si possible..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-sm min-h-[140px] resize-none"
            />
          </div>
          <Button className="w-full gap-2" onClick={handleSubmit}>
            <Send className="h-4 w-4" />
            Envoyer la demande
          </Button>
        </div>

        {/* Contact info */}
        <div className="rounded-lg border border-border p-3 space-y-2">
          <p className="text-xs font-medium text-foreground">Autres moyens de contact</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            support@pharmacenter.com
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          En envoyant ce formulaire, vous acceptez notre politique de confidentialité.
        </p>
      </div>
    </ScrollArea>
  );
}
