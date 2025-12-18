import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User2, Phone, Mail, Lock, CheckCircle2, Eye, EyeOff, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdvancedAuth } from "@/hooks/useAdvancedAuth";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { toast } from "sonner";

const UserRegister = () => {
  const navigate = useNavigate();
  const { connectedPharmacy } = useAuth();
  const { validatePassword, getPasswordPolicy } = useAdvancedAuth();
  const [hasSession, setHasSession] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState<any>(null);

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

  // Récupérer la politique de mot de passe une seule fois au chargement
  useEffect(() => {
    if (connectedPharmacy) {
      getPasswordPolicy().then(setPasswordPolicy).catch(console.error);
    }
  }, [connectedPharmacy?.id]); // Dépendre uniquement de l'ID, pas de la fonction

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
    }, 500); // Debounce 500ms pour réduire les appels
    
    return () => clearTimeout(timer);
  }, [password, connectedPharmacy?.id]); // Dépendre de l'ID, pas de la fonction

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

    setLoading(true);
    try {
      const res = await validatePassword(password);
      setValidation(res);
      if (!res.isValid) {
        // Afficher les détails spécifiques des erreurs de validation
        const errorMessage = res.errors && res.errors.length > 0 
          ? `Mot de passe non conforme: ${res.errors.join(', ')}`
          : "Mot de passe non conforme à la politique de sécurité";
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      // Inscription email classique
        // Tenter signUp classique puis fallback OTP si GoTrue renvoie une 500 (Database error finding user)
        const currentUrl = `${window.location.protocol}//${window.location.host}/user-register`;
        try {
          // Essai 1: signUp standard sans redirectTo (évite erreurs liées aux URLs non whitelists)
          const { data, error } = await supabase.auth.signUp({
            email: normEmail,
            password
          });
          if (error) throw error;

          let activeSession = data.session;

          // Si pas de session immédiate, tenter une connexion directe
          // (fonctionne si "Confirm email" est désactivé dans Supabase)
          if (!activeSession) {
            console.log("Pas de session immédiate après signUp, tentative de connexion...");
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: normEmail,
              password
            });
            
            if (signInError) {
              // La connexion échoue = confirmation email probablement requise
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
              noms,
              prenoms,
              email: normEmail,
              telephone: phone || "",
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
            
            toast.success("Compte créé et connecté à la pharmacie");
            navigate("/");
            return;
          }
        } catch (innerErr: any) {
          // Fallback: si signUp ou signIn échoue, rediriger vers login
          console.error("Erreur lors de l'inscription:", innerErr);
          toast.error(innerErr.message || "Erreur lors de l'inscription");
        }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erreur lors de la création du compte");
    } finally {
      setLoading(false);
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
                    <Input id="prenoms" value={prenoms} onChange={(e) => setPrenoms(e.target.value)} className="pl-9" required disabled={loading || !!disabledReason} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noms">Noms *</Label>
                  <div className="relative">
                    <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="noms" value={noms} onChange={(e) => setNoms(e.target.value)} className="pl-9" required disabled={loading || !!disabledReason} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Adresse Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required disabled={loading || !!disabledReason} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="telephone" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" required disabled={loading || !!disabledReason} />
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
                    disabled={loading || !!disabledReason} 
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
                    disabled={loading || !!disabledReason} 
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

              <Button type="submit" className="w-full" disabled={loading || !!disabledReason}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Créer mon compte
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
    </main>
  );
};

export default UserRegister;
