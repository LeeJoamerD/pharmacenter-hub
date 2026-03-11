import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface TestAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TestAccessDialog: React.FC<TestAccessDialogProps> = ({ open, onOpenChange }) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setConnectedPharmacyFromSession } = useAuth();

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Veuillez entrer un email valide');
      return;
    }

    setLoading(true);
    try {
      // Check if email is allowed
      const { data: allowed, error: checkError } = await (supabase as any)
        .from('allowed_test_emails')
        .select('id, is_active')
        .eq('email', trimmed)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!allowed || !allowed.is_active) {
        toast.error("Cet email n'est pas autorisé pour les tests. Contactez l'administrateur.");
        setLoading(false);
        return;
      }

      // Send verification code
      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { email: trimmed, type: 'email', pharmacyName: 'Test PharmaSoft' }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Code envoyé à ${trimmed}`);
      setStep('otp');
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi du code");
    }
    setLoading(false);
  };

  const handleVerifyAndLogin = async () => {
    if (otpCode.length !== 6) {
      toast.error('Veuillez entrer le code à 6 chiffres');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Verify OTP code
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-code', {
        body: { email: email.trim().toLowerCase(), code: otpCode, type: 'email' }
      });

      if (verifyError) throw verifyError;
      if (verifyData?.error) throw new Error(verifyData.error);

      // Step 2: Call auto-login-test to get real tokens
      const { data: loginData, error: loginError } = await supabase.functions.invoke('auto-login-test', {
        body: { email: email.trim().toLowerCase() }
      });

      if (loginError) throw loginError;
      if (loginData?.error) throw new Error(loginData.error);

      // Step 3: Validate all required tokens are present
      if (!loginData?.access_token || !loginData?.refresh_token || !loginData?.session_token) {
        throw new Error('Tokens incomplets reçus du serveur');
      }

      // Step 4: Set Supabase auth session with real tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: loginData.access_token,
        refresh_token: loginData.refresh_token,
      });
      if (sessionError) throw sessionError;

      // Step 5: Verify user is actually authenticated
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error("Échec de l'authentification utilisateur");
      }

      // Step 6: Hydrate pharmacy_session in localStorage (enriched camelCase format)
      const enrichedSession = {
        sessionToken: loginData.session_token,
        expiresAt: loginData.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        pharmacy: {
          id: loginData.pharmacy?.id || '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
          name: loginData.pharmacy?.name || 'Pharmacie TESTS',
          email: loginData.pharmacy?.email || '',
          city: loginData.pharmacy?.city || '',
          status: loginData.pharmacy?.status || 'active',
          address: loginData.pharmacy?.address || '',
          departement: loginData.pharmacy?.departement || '',
          arrondissement: loginData.pharmacy?.arrondissement || '',
        }
      };
      localStorage.setItem('pharmacy_session', JSON.stringify(enrichedSession));

      // Step 7: Sync pharmacy context immediately
      await setConnectedPharmacyFromSession(loginData.session_token);

      // Step 8: Navigate to dashboard
      toast.success('Connexion réussie ! Redirection...');
      onOpenChange(false);
      
      setTimeout(() => {
        navigate('/tableau-de-bord');
      }, 300);
    } catch (err: any) {
      // Rollback on any failure
      console.error('TestAccess: Login failed, rolling back:', err);
      await supabase.auth.signOut().catch(() => {});
      localStorage.removeItem('pharmacy_session');
      toast.error(err.message || 'Erreur lors de la vérification');
    }
    setLoading(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep('email');
      setEmail('');
      setOtpCode('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Tester PharmaSoft
          </DialogTitle>
          <DialogDescription>
            {step === 'email'
              ? "Entrez votre email pour recevoir un code d'accès à la version de démonstration."
              : 'Entrez le code à 6 chiffres envoyé à votre adresse email.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'email' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleSendCode} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Envoyer le code
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={handleVerifyAndLogin} disabled={loading || otpCode.length !== 6} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Vérifier et accéder
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => { setStep('email'); setOtpCode(''); }}>
              Renvoyer le code
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TestAccessDialog;
