import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User2, Phone, Mail, Lock, CheckCircle2, Eye, EyeOff, Building2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdvancedAuth } from "@/hooks/useAdvancedAuth";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { useVerification } from "@/hooks/useVerification";
import { VerificationDialog } from "@/components/verification/VerificationDialog";
import { toast } from "sonner";

interface FormData {
  noms: string;
  prenoms: string;
  email: string;
  phone: string;
  password: string;
}

const UserRegister = () => {
  const navigate = useNavigate();
  const { connectedPharmacy } = useAuth();
  const { validatePassword, getPasswordPolicy } = useAdvancedAuth();
  const [hasSession, setHasSession] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState<any>(null);

  // États du formulaire
  const [noms, setNoms] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[]; policy: any } | undefined>();
  const [loading, setLoading] = useState(false);

  // États pour la vérification
  const [step, setStep] = useState<'form' | 'email-verify' | 'phone-verify'>('form');
  const [formData, setFormData] = useState<FormData | null>(null);

  // Masquer le numéro de téléphone
  const maskPhone = (phoneNum: string) => {
    if (!phoneNum || phoneNum.length < 4) return phoneNum;
    return phoneNum.slice(-4).padStart(phoneNum.length, '*');
  };

  // Créer le compte après vérifications réussies
  const proceedWithAccountCreation = async () => {
    if (!formData || !connectedPharmacy) return;

    setLoading(true);
    try {
      const currentUrl = `${window.location.protocol}//${window.location.host}/user-register`;
      
      // Essai signUp standard
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });
      if (error) throw error;

      let activeSession = data.session;

      // Si pas de session immédiate, tenter une connexion directe
      if (!activeSession) {
        console.log("Pas de session immédiate après signUp, tentative de connexion...");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        
        if (signInError) {
          console.error("Connexion impossible après signUp:", signInError.message);
          toast.info("Un email de confirmation a été envoyé. Confirmez votre email puis connectez-vous.");
          navigate("/user-login");
          return;
        }
        
        activeSession = signInData.session;
      }

      // Maintenant on a une session active, créer le personnel
      if (activeSession) {
        const payload = {
          noms: formData.noms,
          prenoms: formData.prenoms,
          email: formData.email,
          telephone: formData.phone || "",
          reference_agent: `AG-${Date.now()}`,
        };
        
        const { data: created, error: cpErr } = await supabase.rpc("create_personnel_for_user" as any, {
          pharmacy_id: connectedPharmacy.id,
          data: payload as any,
        });
        
        if (cpErr) throw cpErr;
        if (!(created as any)?.success) {
          throw new Error((created as any)?.error || "Échec de la création du profil utilisateur");
        }
        
        toast.success("Compte créé avec succès !");
        navigate("/");
        return;
      }
    } catch (err: any) {
      console.error("Erreur lors de la création du compte:", err);
      toast.error(err.message || "Erreur lors de la création du compte");
      // Revenir au formulaire en cas d'erreur
      setStep('form');
      verification.reset();
    } finally {
      setLoading(false);
    }
  };

  // Hook de vérification avec callbacks
  const verification = useVerification({
    onEmailVerified: () => {
      toast.success("Email vérifié !");
      // Passer à la vérification téléphone
      setStep('phone-verify');
      if (formData?.phone && formData?.email) {
        verification.sendPhoneCode(formData.email, formData.phone);
      }
    },
    onPhoneVerified: () => {
      toast.success("Téléphone vérifié !");
      // Les deux vérifications sont réussies, créer le compte
      proceedWithAccountCreation();
    },
  });

  // Récupérer la politique de mot de passe une seule fois au chargement
  useEffect(() => {
    if (connectedPharmacy) {
      getPasswordPolicy().then(setPasswordPolicy).catch(console.error);
    }
  }, [connectedPharmacy?.id]);

  // Validation en temps réel du mot de passe avec debounce
  useEffect(() => {
    if (!password) {
      setValidation(undefined);
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        const res = await validatePassword(password);
        setValidation(res);
      } catch (error) {
        console.error('Erreur validation:', error);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [password, connectedPharmacy?.id]);

  // SEO
  useEffect(() => {
    document.title = "Création de compte utilisateur | PharmaSoft";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Créez votre compte utilisateur PharmaSoft");
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", `${window.location.origin}/user-register`);
      document.head.appendChild(link);
    }
  }, []);

  const disabledReason = useMemo(() => {
    if (!connectedPharmacy) return "Aucune pharmacie connectée. Veuillez connecter votre pharmacie avant de créer un compte utilisateur.";
    return null;
  }, [connectedPharmacy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedPharmacy) {
      toast.error("Aucune pharmacie connectée.");
      return;
    }

    const normEmail = email.trim().toLowerCase();

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    // Valider le mot de passe avant de lancer les vérifications
    setLoading(true);
    try {
      const res = await validatePassword(password);
      setValidation(res);
      if (!res.isValid) {
        const errorMessage = res.errors && res.errors.length > 0 
          ? `Mot de passe non conforme: ${res.errors.join(', ')}`
          : "Mot de passe non conforme à la politique de sécurité";
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      // Stocker les données du formulaire pour après vérification
      setFormData({
        noms,
        prenoms,
        email: normEmail,
        phone,
        password
      });

      // Passer à l'étape de vérification email
      setStep('email-verify');
      
      // Envoyer le code de vérification email
      const result = await verification.sendEmailCode(normEmail);
      if (!result.success) {
        toast.error(result.error || "Erreur lors de l'envoi du code");
        setStep('form');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erreur lors de la validation");
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  // Gérer la fermeture des dialogs
  const handleEmailDialogClose = (open: boolean) => {
    if (!open && step === 'email-verify' && !verification.emailVerified) {
      setStep('form');
      verification.reset();
    }
  };

  const handlePhoneDialogClose = (open: boolean) => {
    if (!open && step === 'phone-verify' && !verification.phoneVerified) {
      // Permettre de revenir à l'étape email
      setStep('email-verify');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </button>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display">Créer mon compte</CardTitle>
            <p className="text-sm text-muted-foreground">Complétez vos informations pour finaliser l'inscription</p>
          </CardHeader>
          <CardContent>
            {/* Indicateur de progression des vérifications */}
            {step !== 'form' && (
              <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-3 text-center">Vérification en cours</p>
                <div className="flex items-center justify-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                    verification.emailVerified 
                      ? 'bg-green-100 text-green-700' 
                      : step === 'email-verify' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {verification.emailVerified ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="h-5 w-5 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">1</span>
                    )}
                    <span className="text-sm font-medium">Email</span>
                  </div>
                  <div className="w-8 h-0.5 bg-border" />
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                    verification.phoneVerified 
                      ? 'bg-green-100 text-green-700' 
                      : step === 'phone-verify' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {verification.phoneVerified ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="h-5 w-5 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">2</span>
                    )}
                    <span className="text-sm font-medium">Téléphone</span>
                  </div>
                </div>
              </div>
            )}

            {disabledReason && (
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive mb-2">{disabledReason}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/pharmacy-connection')}
                  className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Connecter ma pharmacie
                </Button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenoms">Prénoms *</Label>
                  <div className="relative">
                    <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="prenoms" value={prenoms} onChange={(e) => setPrenoms(e.target.value)} className="pl-9" required disabled={loading || !!disabledReason || step !== 'form'} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noms">Noms *</Label>
                  <div className="relative">
                    <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="noms" value={noms} onChange={(e) => setNoms(e.target.value)} className="pl-9" required disabled={loading || !!disabledReason || step !== 'form'} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Adresse Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required disabled={loading || !!disabledReason || step !== 'form'} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="telephone" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" required disabled={loading || !!disabledReason || step !== 'form'} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="pl-9 pr-10" 
                    required 
                    disabled={loading || !!disabledReason || step !== 'form'} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={password} validation={validation} />
                
                {/* Affichage de la politique de mot de passe complète */}
                {passwordPolicy && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
                    <h4 className="text-sm font-medium mb-2">Exigences de sécurité :</h4>
                    <div className="space-y-1 text-xs">
                      <div>• Longueur: {passwordPolicy.min_length || 8}-{passwordPolicy.max_length || 128} caractères</div>
                      {passwordPolicy.require_uppercase && <div>• Au moins une majuscule</div>}
                      {passwordPolicy.require_lowercase && <div>• Au moins une minuscule</div>}
                      {passwordPolicy.require_numbers && <div>• Au moins un chiffre</div>}
                      {passwordPolicy.require_special_chars && <div>• Au moins un caractère spécial</div>}
                      {passwordPolicy.restrict_common_passwords && <div>• Mots de passe communs interdits</div>}
                      {passwordPolicy.min_complexity_score && <div>• Score de complexité minimum: {passwordPolicy.min_complexity_score}</div>}
                    </div>
                  </div>
                )}
                
                {/* Debugging: Comparaison validation client vs serveur */}
                {validation && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Détail de la validation :</h4>
                    <div className="text-xs space-y-1">
                      <div>✅ Validation serveur: {validation.isValid ? 'VALIDE' : 'INVALIDE'}</div>
                      <div>📝 Erreurs serveur: {validation.errors.join(', ') || 'Aucune'}</div>
                      <div>📊 Score complexité: {validation.policy?.complexity_score || 'N/A'}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="pl-9 pr-10" 
                    required 
                    disabled={loading || !!disabledReason || step !== 'form'} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !!disabledReason || step !== 'form'}>
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span> Vérification...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Créer mon compte
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <a href="#" className="hover:underline">Conditions d'utilisations</a>
              <span>|</span>
              <a href="#" className="hover:underline">Politique de confidentialité</a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de vérification Email */}
      <VerificationDialog
        open={step === 'email-verify' && !verification.emailVerified}
        onOpenChange={handleEmailDialogClose}
        type="email"
        target={formData?.email || email}
        onVerify={(code) => verification.verifyEmailCode(formData?.email || email, code)}
        onResend={() => verification.sendEmailCode(formData?.email || email)}
        isVerifying={verification.isVerifyingEmail}
        isSending={verification.isSendingEmail}
        expiresAt={verification.emailExpiresAt}
        isVerified={verification.emailVerified}
      />

      {/* Dialog de vérification Téléphone */}
      <VerificationDialog
        open={step === 'phone-verify' && !verification.phoneVerified}
        onOpenChange={handlePhoneDialogClose}
        type="phone"
        target={maskPhone(formData?.phone || phone)}
        onVerify={(code) => verification.verifyPhoneCode(formData?.email || email, code)}
        onResend={() => verification.sendPhoneCode(formData?.email || email, formData?.phone || phone)}
        isVerifying={verification.isVerifyingPhone}
        isSending={verification.isSendingPhone}
        expiresAt={verification.phoneExpiresAt}
        isVerified={verification.phoneVerified}
      />
    </main>
  );
};

export default UserRegister;
