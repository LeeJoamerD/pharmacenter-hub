import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft, Chrome } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GoogleAuthStepProps {
  title: string;
  description: string;
  onSuccess: (user: any) => void;
  onBack: () => void;
  stepType: 'pharmacy' | 'admin';
}

export const GoogleAuthStep: React.FC<GoogleAuthStepProps> = ({
  title,
  description,
  onSuccess,
  onBack,
  stepType
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      // Stocker le type d'authentification dans localStorage avant la redirection
      localStorage.setItem('pharmacyAuthType', stepType);
      
      // URL de redirection vers PharmacyLogin après authentification Google
      const redirectUrl = `${window.location.origin}/pharmacy-login`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline'
          }
        }
      });

      if (error) {
        throw error;
      }

      // L'utilisateur sera redirigé vers Google
    } catch (error: any) {
      console.error('Erreur authentification Google:', error);
      toast({
        title: 'Erreur d\'authentification',
        description: error.message || 'Impossible de se connecter avec Google',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        onSuccess(session.user);
      }
    };

    checkSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          onSuccess(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [onSuccess]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl">Connecter votre pharmacie</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Authentification sécurisée</p>
              <p>
                Nous utilisons l'authentification Google pour garantir la sécurité 
                de votre compte. Vos données seront automatiquement récupérées.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full h-12 text-base"
          size="lg"
        >
          <Chrome className="mr-2 h-5 w-5" />
          {isLoading ? 'Connexion en cours...' : 'Continuer avec Google'}
        </Button>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={isLoading}
            className="text-muted-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>En continuant, vous acceptez nos conditions d'utilisation</p>
          <p>Vos données Google ne seront utilisées que pour l'authentification</p>
        </div>
      </CardContent>
    </Card>
  );
};