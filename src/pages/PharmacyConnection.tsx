import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Lock, Building2, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { FadeIn } from '@/components/FadeIn';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useVerification } from '@/hooks/useVerification';
import { VerificationDialog } from '@/components/verification/VerificationDialog';
import { supabase } from '@/integrations/supabase/client';

export default function PharmacyConnection() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'credentials' | 'email-verify' | 'phone-verify'>('credentials');
  const [pharmacyPhone, setPharmacyPhone] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { connectPharmacy } = useAuth();

  const verification = useVerification({
    onEmailVerified: () => {
      // Après vérification email, passer à la vérification téléphone
      setStep('phone-verify');
      // Envoyer le code SMS
      if (pharmacyPhone) {
        verification.sendPhoneCode(email, pharmacyPhone);
      }
    },
    onPhoneVerified: () => {
      // Après vérification téléphone, procéder à la connexion
      proceedWithLogin();
    },
  });

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // D'abord, récupérer le téléphone de la pharmacie
      const { data: phone, error: phoneError } = await supabase.rpc('get_pharmacy_phone_by_email', {
        p_email: email
      });

      if (phoneError) {
        console.error('Erreur récupération téléphone:', phoneError);
      }
      
      setPharmacyPhone(phone || '');

      // Vérifier les credentials via la nouvelle RPC authenticate_pharmacy
      // (sans se connecter effectivement)
      const { data: authCheck, error: authError } = await supabase.rpc('authenticate_pharmacy', {
        p_email: email,
        p_password: password
      });

      const authResult = authCheck as { success: boolean; error?: string } | null;

      if (authError || !authResult?.success) {
        toast({
          title: "Erreur de connexion",
          description: authResult?.error || "Email ou mot de passe incorrect",
          variant: "destructive"
        });
        return;
      }

      // Les credentials sont valides, passer à la vérification
      setStep('email-verify');
      
      // Envoyer le code email
      await verification.sendEmailCode(email);

    } catch (error: any) {
      console.error('Erreur lors de la vérification:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const proceedWithLogin = async () => {
    setIsLoading(true);
    try {
      // Utiliser connectPharmacy qui n'utilise plus supabase.auth
      const { error } = await connectPharmacy(email, password);

      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans votre pharmacie",
      });

      // Rediriger vers l'accueil (pas le tableau de bord car aucun utilisateur connecté)
      navigate('/');
      
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 4) return phone;
    return phone.slice(-4).padStart(phone.length, '*');
  };

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
              <CardTitle className="text-2xl font-bold">Connexion Pharmacie</CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                {step === 'credentials' && 'Connectez-vous à votre compte pharmacie'}
                {step === 'email-verify' && 'Vérifiez votre adresse email'}
                {step === 'phone-verify' && 'Vérifiez votre numéro de téléphone'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Indicateur de progression */}
            {step !== 'credentials' && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className={`flex items-center gap-2 ${verification.emailVerified ? 'text-green-600' : 'text-primary'}`}>
                  {verification.emailVerified ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center text-xs">1</div>
                  )}
                  <span className="text-sm font-medium">Email</span>
                </div>
                <div className="w-8 h-0.5 bg-border" />
                <div className={`flex items-center gap-2 ${verification.phoneVerified ? 'text-green-600' : step === 'phone-verify' ? 'text-primary' : 'text-muted-foreground'}`}>
                  {verification.phoneVerified ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center text-xs">2</div>
                  )}
                  <span className="text-sm font-medium">Téléphone</span>
                </div>
              </div>
            )}

            {step === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Adresse email
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Mot de passe
                    </Label>
                    <Link 
                      to="/pharmacy-password-reset" 
                      className="text-sm text-primary hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
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

                <Button
                  type="submit"
                  className="w-full h-11 font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    "Continuer"
                  )}
                </Button>
              </form>
            )}

            {/* Dialog de vérification Email */}
            <VerificationDialog
              open={step === 'email-verify' && !verification.emailVerified}
              onOpenChange={(open) => !open && step === 'email-verify' && setStep('credentials')}
              type="email"
              target={email}
              onVerify={(code) => verification.verifyEmailCode(email, code)}
              onResend={() => verification.sendEmailCode(email)}
              isVerifying={verification.isVerifyingEmail}
              isSending={verification.isSendingEmail}
              expiresAt={verification.emailExpiresAt}
              isVerified={verification.emailVerified}
            />

            {/* Dialog de vérification Téléphone */}
            <VerificationDialog
              open={step === 'phone-verify' && !verification.phoneVerified}
              onOpenChange={(open) => !open && step === 'phone-verify' && setStep('email-verify')}
              type="phone"
              target={maskPhone(pharmacyPhone)}
              onVerify={(code) => verification.verifyPhoneCode(email, code)}
              onResend={() => verification.sendPhoneCode(email, pharmacyPhone)}
              isVerifying={verification.isVerifyingPhone}
              isSending={verification.isSendingPhone}
              expiresAt={verification.phoneExpiresAt}
              isVerified={verification.phoneVerified}
            />

            {step === 'credentials' && (
              <>
                <div className="text-center space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Vous n'avez pas encore de compte ?
                  </div>
                  <Link to="/pharmacy-creation">
                    <Button variant="outline" className="w-full h-11 font-medium">
                      Créez-en un
                    </Button>
                  </Link>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour à l'accueil
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
