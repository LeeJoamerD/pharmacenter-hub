import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// --- UI Components ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FadeIn } from '@/components/FadeIn';

// --- Icons ---
import { 
  ArrowLeft, Building2, Phone, MapPin, Mail, Lock, Eye, EyeOff, 
  Check, X, ShieldCheck, Chrome 
} from 'lucide-react';


// --- Interfaces (inchangées) ---
interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}
// ... Autres interfaces si vous en avez

export default function PharmacyCreation() {
  const navigate = useNavigate();
  const { signInWithGoogle, signOut } = useAuth();
  const { toast } = useToast();

  // --- États du composant ---
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    quartier: '',
    arrondissement: '',
    city: 'Brazzaville',
    telephone_appel: '',
    telephone_whatsapp: '',
    email: '',
    departement: '',
    type: 'Pharmacie',
    noms: '',
    prenoms: '',
    reference_agent: '',
    telephone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSpecial: false
  });

  const [googleFilledFields, setGoogleFilledFields] = useState<Set<string>>(new Set());
  const [isPrefilled, setIsPrefilled] = useState(false); // Pour masquer le bouton Google après utilisation

  // --- Fonctions métier ---

  const extractGoogleData = (user: User) => {
    if (!user) return null;
    
    console.log('Extraction des données Google:', user);
    const metadata = user.user_metadata || {};
    
    const email = user.email || metadata.email || '';
    const fullName = metadata.full_name || metadata.name || '';
    const firstName = metadata.given_name || '';
    const lastName = metadata.family_name || '';
    
    let extractedFirstName = firstName;
    let extractedLastName = lastName;
    
    if (!firstName && !lastName && fullName) {
      const nameParts = fullName.trim().split(' ');
      extractedFirstName = nameParts.shift() || '';
      extractedLastName = nameParts.join(' ') || '';
    }
    
    return {
      email,
      prenoms: extractedFirstName,
      noms: extractedLastName,
      telephone: user.phone || '' // Souvent vide, mais on essaie quand même
    };
  };

  const handleGooglePrefill = async () => {
    console.log("Lancement de l'authentification Google...");
    const { user, error } = await signInWithGoogle();

    if (error) {
      toast({ title: "Erreur d'authentification", description: error.message, variant: "destructive" });
      return;
    }

    if (user) {
      console.log("Utilisateur Google récupéré, pré-remplissage...");
      const googleData = extractGoogleData(user);
      if (!googleData) return;

      const filledFields = new Set<string>();
      
      setFormData(prev => {
        const newData = { ...prev };
        if (googleData.email) { newData.email = googleData.email; filledFields.add('email'); }
        if (googleData.prenoms) { newData.prenoms = googleData.prenoms; filledFields.add('prenoms'); }
        if (googleData.noms) { newData.noms = googleData.noms; filledFields.add('noms'); }
        if (googleData.telephone) { 
          newData.telephone = googleData.telephone; 
          newData.telephone_appel = googleData.telephone; 
          filledFields.add('telephone'); 
          filledFields.add('telephone_appel'); 
        }
        return newData;
      });

      setGoogleFilledFields(filledFields);
      setIsPrefilled(true); // On masque la section Google
      toast({ title: "Informations récupérées", description: "Veuillez compléter le reste du formulaire." });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'password') {
      setPasswordValidation(validatePassword(value));
    }
  };

  const validatePassword = (password: string) => ({
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  });
  
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid || !passwordsMatch) {
      toast({ title: "Mot de passe invalide", description: "Veuillez vérifier les critères de sécurité et la correspondance.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await signOut(); // Déconnecte la session Google temporaire
      // ... Reste de la logique de soumission...
      // (cette partie est inchangée et fonctionnelle)
      toast({ title: "Pharmacie créée !", description: "Vous allez être redirigé." });
      navigate('/pharmacy-connection');
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const isFieldFromGoogle = (field: string) => googleFilledFields.has(field);
  const ValidationIcon = ({ isValid }: { isValid: boolean }) => isValid ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto relative z-10">
        <FadeIn>
          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Créer votre pharmacie</CardTitle>
                <CardDescription className="text-muted-foreground mt-2">
                  Rejoignez notre réseau de pharmacies connectées
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* --- SECTION GOOGLE --- */}
              {!isPrefilled && (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Alert variant="default" className="border-0 p-0 bg-transparent">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <AlertTitle className="font-semibold text-blue-800 dark:text-blue-300">Authentification sécurisée</AlertTitle>
                    <AlertDescription className="text-blue-700 dark:text-blue-400">
                      Utilisez Google pour un pré-remplissage rapide et sécurisé de vos informations.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    type="button" 
                    onClick={handleGooglePrefill}
                  >
                    <Chrome className="mr-2 h-5 w-5" />
                    Continuer avec Google
                  </Button>
                </div>
              )}

              {/* --- SÉPARATEUR --- */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {isPrefilled ? "Veuillez compléter les informations" : "Ou remplissez manuellement"}
                  </span>
                </div>
              </div>
              
              {/* --- FORMULAIRE --- */}
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Section Informations de la pharmacie */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Informations de la pharmacie</h3>
                  {/* ... Vos champs: Nom, Téléphone, Adresse, etc. ... */}
                </div>

                {/* Section Informations de connexion */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Informations de connexion</h3>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Adresse email * {isFieldFromGoogle('email') && <span className="text-xs text-green-600 font-medium">(depuis Google)</span>}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input id="email" type="email" placeholder="votre.email@exemple.com" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required className={`pl-10 h-11 ${isFieldFromGoogle('email') ? 'bg-green-50 border-green-200' : ''}`} />
                    </div>
                  </div>
                  {/* ... Vos champs Mot de passe et Confirmation ... */}
                </div>
                
                {/* Section Informations de l'administrateur */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Informations de l'administrateur</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prenoms">
                        Prénoms * {isFieldFromGoogle('prenoms') && <span className="text-xs text-green-600 font-medium">(depuis Google)</span>}
                      </Label>
                      <Input id="prenoms" type="text" placeholder="Lee Joamer" value={formData.prenoms} onChange={(e) => handleInputChange('prenoms', e.target.value)} required className={`h-11 ${isFieldFromGoogle('prenoms') ? 'bg-green-50 border-green-200' : ''}`} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="noms">
                        Noms * {isFieldFromGoogle('noms') && <span className="text-xs text-green-600 font-medium">(depuis Google)</span>}
                      </Label>
                      <Input id="noms" type="text" placeholder="DIAMBOMBA" value={formData.noms} onChange={(e) => handleInputChange('noms', e.target.value)} required className={`h-11 ${isFieldFromGoogle('noms') ? 'bg-green-50 border-green-200' : ''}`} />
                    </div>
                  </div>
                  {/* ... Vos autres champs admin ... */}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-medium"
                  disabled={isLoading || !isPasswordValid || !passwordsMatch}
                >
                  {isLoading ? "Création en cours..." : "Créer ma pharmacie"}
                </Button>
              </form>

              {/* Liens en bas de page */}
              <div className="text-center space-y-4">
                <div className="text-sm text-muted-foreground">Vous avez déjà un compte ?</div>
                <Link to="/pharmacy-connection">
                  <Button variant="outline" className="w-full h-11 font-medium">Se connecter</Button>
                </Link>
              </div>
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
    </div>
  );
}