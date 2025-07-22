import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2, Phone, MapPin, Mail, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { FadeIn } from '@/components/FadeIn';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

interface PharmacyCreationResult {
  success: boolean;
  pharmacy_id?: string;
  error?: string;
  message?: string;
}

interface AdminCreationResult {
  success: boolean;
  personnel_id?: string;
  error?: string;
  message?: string;
}

export default function PharmacyCreation() {
  // États du formulaire
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    quartier: '',
    arrondissement: '',
    city: '',
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
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  });

  const navigate = useNavigate();
  const { toast } = useToast();
  const { connectPharmacy, signOut } = useAuth();

  // Pré-remplir avec les données Google si disponibles
  useEffect(() => {
    console.log('PHARMACY-CREATION: Initialisation du composant');
    
    const fillFormWithGoogleData = (user: any) => {
      if (!user) {
        console.log('PHARMACY-CREATION: Aucun utilisateur fourni');
        return;
      }
      
      console.log('PHARMACY-CREATION: Utilisateur Google détecté:', user);
      console.log('PHARMACY-CREATION: user.email:', user.email);
      console.log('PHARMACY-CREATION: user.user_metadata:', user.user_metadata);
      
      // Extraire les données Google selon les différents formats possibles
      const metadata = user.user_metadata || {};
      const fullName = metadata.full_name || metadata.name || '';
      const firstName = metadata.given_name || fullName.split(' ')[0] || '';
      const lastName = metadata.family_name || fullName.split(' ').slice(1).join(' ') || '';
      
      console.log('PHARMACY-CREATION: Extraction - fullName:', fullName, 'firstName:', firstName, 'lastName:', lastName);

      // Mettre à jour les champs avec les données Google
      setFormData(prev => {
        const updatedData = { ...prev };
        
        // Email obligatoire depuis Google
        if (user.email) {
          updatedData.email = user.email;
        }
        
        // Prénom depuis Google
        if (firstName) {
          updatedData.prenoms = firstName;
        }
        
        // Nom depuis Google
        if (lastName) {
          updatedData.noms = lastName;
        }
        
        // Téléphone (rarement disponible depuis Google)
        if (user.phone || metadata.phone_number) {
          const phone = user.phone || metadata.phone_number;
          updatedData.telephone_appel = phone;
          updatedData.telephone = phone;
        }
        
        console.log('PHARMACY-CREATION: FormData mis à jour avec Google:', updatedData);
        return updatedData;
      });
    };

    // Vérifier immédiatement la session
    const checkSession = async () => {
      try {
        console.log('PHARMACY-CREATION: Vérification de la session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('PHARMACY-CREATION: Session trouvée, préremplissage...');
          fillFormWithGoogleData(session.user);
        } else {
          console.log('PHARMACY-CREATION: Aucune session trouvée');
        }
      } catch (error) {
        console.error('PHARMACY-CREATION: Erreur vérification session:', error);
      }
    };

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('PHARMACY-CREATION: Auth event:', event, 'has session:', !!session);
      
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        console.log('PHARMACY-CREATION: Préremplissage depuis auth listener');
        fillFormWithGoogleData(session.user);
      }
    });

    // Vérifier immédiatement
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Validation du mot de passe en temps réel
  const validatePassword = (password: string): PasswordValidation => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validation spéciale pour le mot de passe
    if (field === 'password') {
      setPasswordValidation(validatePassword(value));
    }
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      toast({
        title: "Mot de passe invalide",
        description: "Veuillez respecter tous les critères de sécurité",
        variant: "destructive"
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: "Mots de passe différents",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Déconnecter l'utilisateur s'il est connecté
      await signOut();

      // Étape 1: Créer l'utilisateur via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (authError || !authData.user) {
        console.error('Erreur lors de la création de l\'utilisateur:', authError);
        toast({
          title: "Erreur",
          description: authError?.message || "Erreur lors de la création du compte utilisateur",
          variant: "destructive",
        });
        return;
      }

      // Étape 2: Créer la pharmacie
      const { data: pharmacyData, error: pharmacyError } = await supabase.rpc('create_pharmacy_for_user', {
        pharmacy_data: {
          name: formData.name,
          code: formData.code || `PH${Date.now()}`,
          address: formData.address,
          quartier: formData.quartier,
          arrondissement: formData.arrondissement,
          city: formData.city,
          telephone_appel: formData.telephone_appel,
          telephone_whatsapp: formData.telephone_whatsapp,
          email: formData.email,
          departement: formData.departement,
          type: formData.type,
          region: 'Cameroun',
          pays: 'Cameroun'
        }
      });

      const typedPharmacyData = pharmacyData as unknown as PharmacyCreationResult;

      if (pharmacyError || !typedPharmacyData?.success) {
        console.error('Erreur lors de la création de la pharmacie:', pharmacyError);
        toast({
          title: "Erreur",
          description: typedPharmacyData?.error || pharmacyError?.message || "Erreur lors de la création de la pharmacie",
          variant: "destructive",
        });
        return;
      }

      // Étape 3: Lier l'utilisateur comme admin de la pharmacie
      const { data, error } = await supabase.rpc('create_admin_personnel', {
        pharmacy_id: typedPharmacyData.pharmacy_id,
        admin_data: {
          noms: formData.noms,
          prenoms: formData.prenoms,
          reference_agent: formData.reference_agent,
          telephone: formData.telephone
        }
      });

      const typedAdminData = data as unknown as AdminCreationResult;

      if (error || !typedAdminData?.success) {
        console.error('Erreur lors de la création de l\'admin:', error);
        toast({
          title: "Erreur",
          description: typedAdminData?.error || error?.message || "Erreur lors de la création de l'administrateur",
          variant: "destructive",
        });
        return;
      }

      // Déconnecter l'utilisateur automatiquement créé pour forcer une connexion manuelle
      await supabase.auth.signOut();

      // Connexion automatique après création
      const { error: connectError } = await connectPharmacy(formData.email, formData.password);
      
      if (connectError) {
        toast({
          title: "Pharmacie créée",
          description: "Votre pharmacie a été créée. Veuillez vous connecter.",
        });
        navigate('/pharmacy-connection');
        return;
      }

      toast({
        title: "Pharmacie créée avec succès",
        description: `Bienvenue ${formData.name} !`,
      });

      // Rediriger vers la page d'accueil
      navigate('/');
      
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ValidationIcon = ({ isValid }: { isValid: boolean }) => (
    isValid ? 
      <Check className="w-4 h-4 text-green-500" /> : 
      <X className="w-4 h-4 text-red-500" />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8 px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations de la pharmacie */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Informations de la pharmacie</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nom de la pharmacie *
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Pharmacie Centrale"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="pl-10 h-11"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telephone_appel" className="text-sm font-medium">
                        Téléphone * {formData.telephone_appel && <span className="text-xs text-muted-foreground">(depuis Google)</span>}
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="telephone_appel"
                          type="tel"
                          placeholder="+237 6XX XX XX XX"
                          value={formData.telephone_appel}
                          onChange={(e) => handleInputChange('telephone_appel', e.target.value)}
                          className="pl-10 h-11"
                          required
                          disabled={!!(formData.telephone_appel && formData.telephone_appel.length > 0)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">
                      Adresse complète *
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="address"
                        type="text"
                        placeholder="123 Avenue de la Paix"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quartier" className="text-sm font-medium">
                        Quartier
                      </Label>
                      <Input
                        id="quartier"
                        type="text"
                        placeholder="Centre-ville"
                        value={formData.quartier}
                        onChange={(e) => handleInputChange('quartier', e.target.value)}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">
                        Ville *
                      </Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="Douala"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="h-11"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Informations de connexion */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Informations de connexion</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Adresse email * {formData.email && <span className="text-xs text-muted-foreground">(depuis Google)</span>}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="contact@pharmacie.fr"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10 h-11"
                        required
                        disabled={!!(formData.email && formData.email.length > 0)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Mot de passe *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-10 pr-10 h-11"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {/* Validation du mot de passe */}
                    {formData.password && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="text-sm font-medium text-foreground">Critères de sécurité :</div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm">
                            <ValidationIcon isValid={passwordValidation.minLength} />
                            <span className={passwordValidation.minLength ? "text-green-700" : "text-red-700"}>
                              Au moins 8 caractères
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <ValidationIcon isValid={passwordValidation.hasUppercase} />
                            <span className={passwordValidation.hasUppercase ? "text-green-700" : "text-red-700"}>
                              Une majuscule
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <ValidationIcon isValid={passwordValidation.hasLowercase} />
                            <span className={passwordValidation.hasLowercase ? "text-green-700" : "text-red-700"}>
                              Une minuscule
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <ValidationIcon isValid={passwordValidation.hasNumber} />
                            <span className={passwordValidation.hasNumber ? "text-green-700" : "text-red-700"}>
                              Un chiffre
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <ValidationIcon isValid={passwordValidation.hasSpecial} />
                            <span className={passwordValidation.hasSpecial ? "text-green-700" : "text-red-700"}>
                              Un caractère spécial
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirmation du mot de passe *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="pl-10 pr-10 h-11"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {formData.confirmPassword && (
                      <div className="flex items-center space-x-2 text-sm mt-1">
                        <ValidationIcon isValid={passwordsMatch} />
                        <span className={passwordsMatch ? "text-green-700" : "text-red-700"}>
                          Les mots de passe correspondent
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations de l'administrateur */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Informations de l'administrateur</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prenoms" className="text-sm font-medium">
                        Prénoms * {formData.prenoms && <span className="text-xs text-muted-foreground">(depuis Google)</span>}
                      </Label>
                      <Input
                        id="prenoms"
                        type="text"
                        placeholder="Jean"
                        value={formData.prenoms}
                        onChange={(e) => handleInputChange('prenoms', e.target.value)}
                        className="h-11"
                        required
                        disabled={!!(formData.prenoms && formData.prenoms.length > 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="noms" className="text-sm font-medium">
                        Noms * {formData.noms && <span className="text-xs text-muted-foreground">(depuis Google)</span>}
                      </Label>
                      <Input
                        id="noms"
                        type="text"
                        placeholder="Dupont"
                        value={formData.noms}
                        onChange={(e) => handleInputChange('noms', e.target.value)}
                        className="h-11"
                        required
                        disabled={!!(formData.noms && formData.noms.length > 0)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telephone" className="text-sm font-medium">
                        Téléphone personnel *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="telephone"
                          type="tel"
                          placeholder="+237 6XX XX XX XX"
                          value={formData.telephone}
                          onChange={(e) => handleInputChange('telephone', e.target.value)}
                          className="pl-10 h-11"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reference_agent" className="text-sm font-medium">
                        Référence agent
                      </Label>
                      <Input
                        id="reference_agent"
                        type="text"
                        placeholder="REF001"
                        value={formData.reference_agent}
                        onChange={(e) => handleInputChange('reference_agent', e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-medium"
                  disabled={isLoading || !isPasswordValid || !passwordsMatch}
                >
                  {isLoading ? "Création en cours..." : "Créer ma pharmacie"}
                </Button>
              </form>

              <div className="text-center space-y-4">
                <div className="text-sm text-muted-foreground">
                  Vous avez déjà un compte ?
                </div>
                <Link to="/pharmacy-connection">
                  <Button variant="outline" className="w-full h-11 font-medium">
                    Se connecter
                  </Button>
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