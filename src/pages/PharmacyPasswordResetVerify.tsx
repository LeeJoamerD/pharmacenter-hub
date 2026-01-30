import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeft, Building2, CheckCircle2, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { FadeIn } from '@/components/FadeIn';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://pzsoeapzuijhgemjzydo.supabase.co";

export default function PharmacyPasswordResetVerify() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [code, setCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!email) {
      toast({
        title: "Erreur",
        description: "Email manquant. Veuillez recommencer le processus.",
        variant: "destructive"
      });
      navigate('/pharmacy-password-reset');
    }
  }, [email, navigate, toast]);

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      toast({
        title: "Code invalide",
        description: "Le code doit contenir 6 chiffres",
        variant: "destructive"
      });
      return;
    }

    setIsVerifyingCode(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, type: 'email' })
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Erreur de vérification",
          description: result.error || "Code invalide ou expiré",
          variant: "destructive"
        });
        return;
      }

      setIsCodeVerified(true);
      toast({
        title: "Code vérifié",
        description: "Vous pouvez maintenant définir un nouveau mot de passe",
      });

    } catch (error) {
      console.error('Erreur vérification code:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la vérification",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Mots de passe différents",
        description: "Les deux mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      // Récupérer l'ID de la pharmacie via l'email
      const { data: pharmacyId, error: idError } = await supabase.rpc('get_pharmacy_id_by_email', {
        p_email: email
      });

      if (idError || !pharmacyId) {
        toast({
          title: "Erreur",
          description: "Pharmacie non trouvée",
          variant: "destructive"
        });
        return;
      }

      // Mettre à jour le mot de passe
      const { data, error } = await supabase.rpc('update_pharmacy_password', {
        p_pharmacy_id: pharmacyId,
        p_new_password: newPassword
      });

      if (error) {
        console.error('Erreur update password:', error);
        toast({
          title: "Erreur",
          description: error.message || "Erreur lors de la mise à jour du mot de passe",
          variant: "destructive"
        });
        return;
      }

      const result = data as { success: boolean; message?: string };
      
      if (!result?.success) {
        toast({
          title: "Erreur",
          description: result?.message || "Erreur lors de la mise à jour",
          variant: "destructive"
        });
        return;
      }

      setIsSuccess(true);
      toast({
        title: "Mot de passe mis à jour",
        description: "Votre nouveau mot de passe a été enregistré",
      });

    } catch (error) {
      console.error('Erreur mise à jour mot de passe:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Écran de succès
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
                <CardTitle className="text-2xl font-bold text-green-800">Mot de passe modifié !</CardTitle>
                <CardDescription className="text-muted-foreground mt-2">
                  Vous pouvez maintenant vous connecter avec votre nouveau mot de passe
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <Button 
                onClick={() => navigate('/pharmacy-connection')}
                className="w-full h-11 font-medium"
              >
                Se connecter
              </Button>

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
              {isCodeVerified ? (
                <ShieldCheck className="w-8 h-8 text-primary" />
              ) : (
                <Building2 className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {isCodeVerified ? "Nouveau mot de passe" : "Vérification du code"}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                {isCodeVerified 
                  ? "Définissez votre nouveau mot de passe" 
                  : `Saisissez le code reçu à ${email}`}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {!isCodeVerified ? (
              // Étape 1: Vérification du code OTP
              <div className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP
                    value={code}
                    onChange={setCode}
                    maxLength={6}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerifyCode}
                  className="w-full h-11 font-medium"
                  disabled={isVerifyingCode || code.length !== 6}
                >
                  {isVerifyingCode ? "Vérification..." : "Vérifier le code"}
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                  Vous n'avez pas reçu le code ?{' '}
                  <Link to="/pharmacy-password-reset" className="text-primary hover:underline">
                    Renvoyer
                  </Link>
                </p>
              </div>
            ) : (
              // Étape 2: Définition du nouveau mot de passe
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Code vérifié avec succès
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium">
                    Nouveau mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Minimum 8 caractères"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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
                      placeholder="Répétez le mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleUpdatePassword}
                  className="w-full h-11 font-medium"
                  disabled={isUpdatingPassword || !newPassword || !confirmPassword}
                >
                  {isUpdatingPassword ? "Mise à jour..." : "Définir le mot de passe"}
                </Button>
              </div>
            )}

            <div className="pt-4 border-t border-border/50">
              <Link to="/pharmacy-password-reset" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Link>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
