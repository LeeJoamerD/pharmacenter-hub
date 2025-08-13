import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, Building2, CheckCircle2 } from 'lucide-react';
import { FadeIn } from '@/components/FadeIn';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function PharmacyPasswordReset() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Vérifier d'abord si l'email existe dans les pharmacies
      const { data: pharmacyCheck, error: checkError } = await supabase.rpc('check_pharmacy_email_exists', {
        email_to_check: email
      });

      if (checkError) {
        toast({
          title: "Erreur",
          description: "Erreur lors de la vérification de l'email",
          variant: "destructive"
        });
        return;
      }

      const result = pharmacyCheck as { exists: boolean; has_auth_account?: boolean };

      if (!result.exists) {
        toast({
          title: "Email non trouvé",
          description: "Aucune pharmacie n'est associée à cette adresse email",
          variant: "destructive"
        });
        return;
      }

      if (!result.has_auth_account) {
        toast({
          title: "Compte non configuré",
          description: "Cette pharmacie n'a pas encore de mot de passe configuré. Veuillez contacter l'administrateur.",
          variant: "destructive"
        });
        return;
      }

      // Envoyer l'email de réinitialisation
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/pharmacy-set-password`
      });

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setIsSuccess(true);
      toast({
        title: "Email envoyé",
        description: "Un email de réinitialisation a été envoyé à votre adresse",
      });

    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de l'email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <FadeIn className="w-full max-w-md relative z-10">
          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-green-800">Email envoyé !</CardTitle>
                <CardDescription className="text-muted-foreground mt-2">
                  Vérifiez votre boîte email pour continuer
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Un email de réinitialisation de mot de passe a été envoyé à <strong>{email}</strong>. 
                  Cliquez sur le lien dans l'email pour définir un nouveau mot de passe.
                </AlertDescription>
              </Alert>

              <div className="text-center space-y-4">
                <Button 
                  onClick={() => navigate('/pharmacy-connection')}
                  className="w-full h-11 font-medium"
                >
                  Retour à la connexion
                </Button>
              </div>

              <div className="pt-4 border-t border-border/50">
                <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Link>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <FadeIn className="w-full max-w-md relative z-10">
        <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Mot de passe oublié</CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Saisissez votre email pour recevoir un lien de réinitialisation
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Adresse email de la pharmacie
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemple@pharmacie.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <Link to="/pharmacy-connection">
                <Button variant="outline" className="w-full h-11 font-medium">
                  Retour à la connexion
                </Button>
              </Link>
            </div>

            <div className="pt-4 border-t border-border/50">
              <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Link>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}