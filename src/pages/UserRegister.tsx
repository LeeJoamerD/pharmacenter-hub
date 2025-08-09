import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User2, Phone, Mail, Lock, CheckCircle2 } from "lucide-react";
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
  const { validatePassword } = useAdvancedAuth();

  const [noms, setNoms] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[]; policy: any } | undefined>();
  const [loading, setLoading] = useState(false);

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

  // Pré-remplir depuis la session Google
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!mounted) return;

      if (!session) {
        toast.error("Veuillez d'abord vous authentifier avec Google");
        navigate("/user-login");
        return;
      }

      const u = session.user;
      const displayName = (u.user_metadata as any)?.name || "";
      if (displayName) {
        const parts = displayName.split(" ");
        setPrenoms(parts.slice(0, -1).join(" ") || parts[0] || "");
        setNoms(parts.slice(-1).join(" ") || "");
      }
      setEmail(u.email || "");
      const googleIdentity = u.identities?.find((i: any) => i.provider === "google");
      const metaPhone = (u.user_metadata as any)?.phone_number || (u.user_metadata as any)?.phone || "";
      setPhone(metaPhone || "");
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const disabledReason = useMemo(() => {
    if (!connectedPharmacy) return "Veuillez d'abord connecter votre pharmacie";
    return null;
  }, [connectedPharmacy]);

  // Valider la force en live (optionnel)
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!password) { setValidation(undefined); return; }
      const res = await validatePassword(password);
      if (!ignore) setValidation(res);
    })();
    return () => { ignore = true; };
  }, [password, validatePassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedPharmacy) {
      toast.error("Aucune pharmacie connectée.");
      return;
    }

    setLoading(true);
    try {
      const res = await validatePassword(password);
      if (!res.isValid) {
        setValidation(res);
        toast.error("Mot de passe non conforme à la politique");
        setLoading(false);
        return;
      }

      // Définir un mot de passe pour le compte Google
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // Récup infos Google pour tracer google_user_id/phone
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      const googleIdentity = u?.identities?.find((i: any) => i.provider === "google");
      const googleUserId = (googleIdentity as any)?.id || u?.id || null;
      const googlePhone = (u?.user_metadata as any)?.phone_number || (u?.user_metadata as any)?.phone || phone || null;

      const payload = {
        noms,
        prenoms,
        email,
        telephone: googlePhone || phone || "",
        google_verified: true,
        google_user_id: googleUserId,
        google_phone: googlePhone,
        reference_agent: `AG-${Date.now()}`,
      };

      const { data: created, error } = await supabase.rpc("create_personnel_for_user", {
        pharmacy_id: connectedPharmacy.id,
        data: payload as any,
      });
      if (error) throw error;
      const success = (created as any)?.success;
      if (!success) {
        throw new Error((created as any)?.error || "Échec de la création du profil utilisateur");
      }

      toast.success("Compte créé et connecté");
      navigate("/");
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
              <div className="mb-4 text-sm text-destructive">{disabledReason}</div>
            )}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenoms">Prénoms</Label>
                <div className="relative">
                  <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="prenoms" value={prenoms} onChange={(e) => setPrenoms(e.target.value)} className="pl-9" required disabled={loading || !!disabledReason} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="noms">Noms</Label>
                <div className="relative">
                  <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="noms" value={noms} onChange={(e) => setNoms(e.target.value)} className="pl-9" required disabled={loading || !!disabledReason} />
                </div>
              </div>

              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="email">Adresse Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" value={email} disabled className="pl-9" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="telephone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="telephone" value={phone || "Non fourni par Google"} disabled className="pl-9" />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9" required disabled={loading || !!disabledReason} />
                </div>
                <PasswordStrengthIndicator password={password} validation={validation} />
              </div>

              <div className="md:col-span-2">
                <Button type="submit" className="w-full" disabled={loading || !!disabledReason}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Créer mon compte
                </Button>
              </div>
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
