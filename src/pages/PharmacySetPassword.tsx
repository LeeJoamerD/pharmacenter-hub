import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Building2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { FadeIn } from '@/components/FadeIn';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function PharmacySetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  useEffect(() => {
    // Vérifier si nous avons les tokens nécessaires
    if (!accessToken || !refreshToken) {
      toast({
        title: "Lien invalide",
        description: "Le lien de réinitialisation est invalide ou a expiré",
        variant: "destructive"
      });
      navigate('/pharmacy-password-reset');
      return;
    }

    // Configurer la session avec les tokens
    const setSession = async () => {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) {
        console.error('Erreur lors de la configuration de la session:', error);
        toast({
          title: "Session invalide",
          description: "Impossible de valider votre session. Veuillez réessayer.",
          variant: "destructive"
        });
        navigate('/pharmacy-password-reset');
      }
    };

    setSession();
  }, [accessToken, refreshToken, navigate, toast]);

  const validatePasswords = () => {
    if (password.length < 8) {
      return "Le mot de passe doit contenir au moins 8 caractères";
    }
    if (password !== confirmPassword) {
      return "Les mots de passe ne correspondent pas";
    }
    return null;
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validatePasswords();
    if (validationError) {
      toast({
        title: "Erreur de validation",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Mot de passe défini",
        description: "Votre mot de passe a été défini avec succès",
      });

      // Rediriger vers la connexion
      navigate('/pharmacy-connection');

    } catch (error) {
      console.error('Erreur lors de la définition du mot de passe:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la définition du mot de passe",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValidation = validatePasswords();

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
              <CardTitle className="text-2xl font-bold">Définir le mot de passe</CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Choisissez un mot de passe sécurisé pour votre compte pharmacie
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Nouveau mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {password && (
                <Alert className={passwordValidation ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                  {passwordValidation ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  <AlertDescription className={passwordValidation ? "text-red-800" : "text-green-800"}>
                    {passwordValidation || "Les mots de passe correspondent et respectent les critères"}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Le mot de passe doit contenir :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Au moins 8 caractères</li>
                  <li>Une majuscule et une minuscule</li>
                  <li>Un chiffre</li>
                  <li>Un caractère spécial</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={isLoading || !!passwordValidation}
              >
                {isLoading ? "Définition en cours..." : "Définir le mot de passe"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}