import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Shield, LogIn as LogInIcon, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdvancedAuth } from "@/hooks/useAdvancedAuth";
import { toast } from "sonner";

const UserLogin = () => {
  const navigate = useNavigate();
  const { connectedPharmacy } = useAuth();
  const { enhancedSignIn } = useAdvancedAuth();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [loading, setLoading] = useState(false);
const [forgotOpen, setForgotOpen] = useState(false);
const [forgotEmail, setForgotEmail] = useState("");
const [resetSending, setResetSending] = useState(false);
  // SEO
  useEffect(() => {
    document.title = "Connexion utilisateur | PharmaSoft";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Connexion utilisateur – Accédez à votre compte PharmaSoft");
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", `${window.location.origin}/user-login`);
      document.head.appendChild(link);
    }
  }, []);


  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Veuillez renseigner l'email et le mot de passe");
      return;
    }

    setLoading(true);
    try {
      // Vérifier que ce compte a déjà été authentifié par Google (sans déclencher OAuth)
      const { data: checkData, error: checkError } = await supabase.rpc("check_google_verified", {
        tenant_id: connectedPharmacy.id,
        email,
      });

      if (checkError) throw checkError;

      const found = (checkData as any)?.found;
      const googleVerified = (checkData as any)?.google_verified;

      if (!found || !googleVerified) {
        toast.error("Première connexion requise via Google. Utilisez 'Continuer avec Google'.");
        setLoading(false);
        return;
      }

      const { error } = await enhancedSignIn(email, password);
      if (error) {
        toast.error(error.message || "Échec de la connexion");
        setLoading(false);
        return;
      }

      toast.success("Connexion réussie");
      navigate("/");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erreur inattendue lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

const handleGoogle = async () => {
  setLoading(true);
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/user-login`,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });
    if (error) throw error;
    // OAuth redirigera vers cette page; un effet ci-dessous gère la suite
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || "Erreur OAuth Google");
    setLoading(false);
  }
};

const handleForgotPassword = async () => {
  if (!forgotEmail) {
    toast.error("Veuillez saisir votre email");
    return;
  }
  setResetSending(true);
  try {
    const redirectUrl = `${window.location.origin}/password-reset`;
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: redirectUrl,
    });
    if (error) throw error;
    toast.success("Email de réinitialisation envoyé");
    setForgotOpen(false);
  } catch (e: any) {
    console.error(e);
    toast.error(e.message || "Erreur lors de l'envoi");
  } finally {
    setResetSending(false);
  }
};

  // Au retour d'OAuth Google: si session active -> résoudre le statut et rediriger
  useEffect(() => {
    let mounted = true;
    (async () => {
      // 1) Capturer une éventuelle erreur OAuth dans l'URL et l'afficher
      try {
        const url = new URL(window.location.href);
        const searchErr = url.searchParams.get("error") || url.searchParams.get("error_description");
        const hash = url.hash ? new URLSearchParams(url.hash.replace(/^#/, "")) : null;
        const hashErr = hash?.get("error") || hash?.get("error_description");
        const oauthError = searchErr || hashErr;
        if (oauthError) {
          const decoded = decodeURIComponent(oauthError);
          const friendly = decoded.includes('server_error')
            ? "Échec de l'authentification Google (server_error). Réessayez ou créez un compte par email."
            : decoded;
          toast.error(friendly);
          // Nettoyer l'URL pour éviter de réafficher le message au refresh
          url.searchParams.delete("error");
          url.searchParams.delete("error_description");
          window.history.replaceState({}, document.title, url.pathname + url.search);
        }
      } catch (e) {
        // ignore parsing errors
      }

      // 2) Vérifier la session et résoudre le lien personnel
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!mounted || !session) return;

      setLoading(true);
      try {
        // Marquer le compte comme vérifié Google pour la pharmacie connectée
        const markGoogleVerified = async () => {
          try {
            if (!connectedPharmacy?.id) return;
            await supabase.rpc("mark_personnel_google_verified", { p_tenant_id: connectedPharmacy.id });
          } catch (e) {
            console.error(e);
          }
        };

        // S'assurer qu'un profil personnel existe pour la pharmacie connectée
        const ensurePersonnelInConnectedPharmacy = async (session: any) => {
          if (!connectedPharmacy?.id) {
            toast.error("Aucune pharmacie connectée. Veuillez d'abord vous connecter à une pharmacie.");
            return false;
          }
          const { data: fpData, error: fpErr } = await supabase.rpc("find_personnel_for_current_user", {
            tenant_id: connectedPharmacy.id,
          });
          if (fpErr) throw fpErr;
          if ((fpData as any)?.exists) return true;

          const meta: any = session.user.user_metadata || {};
          const fullName: string | undefined = meta.name;
          const prenoms = meta.given_name || meta.first_name || (fullName ? fullName.split(" ")[0] : "");
          const noms = meta.family_name || meta.last_name || (fullName ? fullName.split(" ").slice(1).join(" ") : "");

          const payload = {
            noms,
            prenoms,
            email: session.user.email,
            telephone: meta.phone_number || null,
            google_verified: true,
            google_user_id: session.user.id,
            google_phone: meta.phone_number || null,
          };

          const { data: cpData, error: cpErr } = await supabase.rpc("create_personnel_for_user", {
            pharmacy_id: connectedPharmacy.id,
            data: payload,
          });
          if (cpErr) throw cpErr;
          if (!(cpData as any)?.success) {
            throw new Error((cpData as any)?.error || "Création du profil utilisateur échouée");
          }
          return true;
        };

const { data: resolveData, error } = await supabase.rpc("resolve_oauth_personnel_link");
if (error) throw error;
const status = (resolveData as any)?.status;
const hasEmailIdentity = Array.isArray((session.user as any)?.identities)
  ? (session.user as any).identities.some((i: any) => i.provider === "email")
  : false;

switch (status) {
  case "active":
  case "linked_and_activated":
    await markGoogleVerified();
    await ensurePersonnelInConnectedPharmacy(session);
    toast.success("Connexion réussie");
    if (!hasEmailIdentity) {
      toast.info("Définissez un mot de passe pour activer la connexion email");
      navigate("/set-password");
    } else {
      navigate("/");
    }
    break;
  case "inactive_linked":
    toast.error("Votre compte est inactif. Contactez l’administrateur.");
    await supabase.auth.signOut();
    navigate("/");
    break;
  case "new_user":
    await markGoogleVerified();
    await ensurePersonnelInConnectedPharmacy(session);
    toast.success("Compte créé et connecté");
    if (!hasEmailIdentity) {
      toast.info("Définissez un mot de passe pour activer la connexion email");
      navigate("/set-password");
    } else {
      navigate("/");
    }
    break;
  default:
    toast.error("Connexion Google incomplète. Réessayez.");
    break;
}

      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Erreur lors de la résolution de l'authentification");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate, connectedPharmacy?.id]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </button>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display">Connexion</CardTitle>
            <p className="text-sm text-muted-foreground">Accédez à votre espace utilisateur</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    disabled={loading}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    disabled={loading}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
<Button type="submit" className="w-full" disabled={loading}>
  <LogInIcon className="mr-2 h-4 w-4" /> Se connecter
</Button>
<div className="mt-2 text-right">
  <button
    type="button"
    onClick={() => setForgotOpen(true)}
    className="text-sm text-primary hover:underline"
  >
    Mot de passe oublié ?
  </button>
</div>
            </form>

            <div className="my-4 text-center text-sm text-muted-foreground">Ou</div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogle}
              disabled={loading}
            >
              Continuer avec Google
            </Button>

            <div className="mt-6 text-center text-sm">
              Vous n'avez pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => navigate("/user-register")}
                className="text-primary hover:underline"
              >
                Créez-en-un
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <a href="#" className="hover:underline">Conditions d'utilisations</a>
              <span>|</span>
              <a href="#" className="hover:underline">Politique de confidentialité</a>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={forgotOpen} onOpenChange={setForgotOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Réinitialiser le mot de passe</AlertDialogTitle>
              <AlertDialogDescription>
                Entrez votre adresse email et nous vous enverrons un lien de réinitialisation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="nom@exemple.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={resetSending}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleForgotPassword} disabled={resetSending}>
                Envoyer le lien
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
};

export default UserLogin;
