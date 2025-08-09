import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Shield, LogIn as LogInIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [loading, setLoading] = useState(false);

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

  const disabledReason = useMemo(() => {
    if (!connectedPharmacy) return "Veuillez d'abord connecter votre pharmacie";
    return null;
  }, [connectedPharmacy]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedPharmacy) {
      toast.error("Aucune pharmacie connectée. Connectez-la avant de vous connecter.");
      return;
    }

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
    if (!connectedPharmacy) {
      toast.error("Aucune pharmacie connectée. Connectez-la avant de vous connecter.");
      return;
    }
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

  // Au retour d'OAuth Google: si session active -> vérifier existence de personnel
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!mounted || !session || !connectedPharmacy) return;

      try {
        const { data: existsData, error } = await supabase.rpc("find_personnel_for_current_user", {
          tenant_id: connectedPharmacy.id,
        });
        if (error) throw error;
        const exists = (existsData as any)?.exists;
        if (exists) {
          toast.success("Connexion réussie");
          navigate("/");
        } else {
          // Rediriger vers l'inscription utilisateur
          navigate("/user-register");
        }
      } catch (e) {
        console.error(e);
        // En cas d'erreur, rester sur place
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [connectedPharmacy, navigate]);

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
            {disabledReason && (
              <div className="mb-4 text-sm text-destructive">{disabledReason}</div>
            )}
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
                    disabled={!!disabledReason || loading}
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
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    disabled={!!disabledReason || loading}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={!!disabledReason || loading}>
                <LogInIcon className="mr-2 h-4 w-4" /> Se connecter
              </Button>
            </form>

            <div className="my-4 text-center text-sm text-muted-foreground">Ou</div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogle}
              disabled={!!disabledReason || loading}
            >
              Continuer avec Google
            </Button>

            <div className="mt-6 text-center text-sm">
              Vous n'avez pas encore de compte ?{" "}
              <button
                type="button"
                onClick={handleGoogle}
                className="text-primary hover:underline"
                disabled={!!disabledReason || loading}
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
      </div>
    </main>
  );
};

export default UserLogin;
