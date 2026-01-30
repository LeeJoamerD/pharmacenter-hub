import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PasswordReset = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    document.title = "Réinitialiser le mot de passe | PharmaSoft";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Réinitialisez votre mot de passe PharmaSoft");
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", `${window.location.origin}/password-reset`);
      document.head.appendChild(link);
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Mot de passe mis à jour");
      navigate("/user-login");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Impossible de mettre à jour le mot de passe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img src="/images/logo-pharmasoft.png" alt="PharmaSoft" className="h-16 w-16 mx-auto object-contain" />
            </div>
            <CardTitle className="text-2xl">Réinitialiser le mot de passe</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={loading}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={password} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={loading}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                Enregistrer
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/user-login")}>Retour à la connexion</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default PasswordReset;
