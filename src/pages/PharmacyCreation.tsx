import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2, Phone, MapPin, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { FadeIn } from '@/components/FadeIn';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function PharmacyCreation() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // États du formulaire complet
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
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des mots de passe
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('PHARMACY-CREATION: Début de la création de pharmacie:', formData.email);

      // 1. Créer d'abord l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.prenoms,
            last_name: formData.noms,
            phone: formData.telephone
          }
        }
      });

      if (authError || !authData.user) {
        console.error('PHARMACY-CREATION: Erreur création utilisateur:', authError);
        toast({
          title: "Erreur",
          description: authError?.message || "Erreur lors de la création du compte utilisateur",
          variant: "destructive"
        });
        return;
      }

      console.log('PHARMACY-CREATION: Utilisateur créé avec succès:', authData.user.id);

      // 2. Créer la pharmacie et le personnel admin
      const { data, error } = await supabase.rpc('register_pharmacy_with_admin', {
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
          region: 'République du Congo',
          pays: 'République du Congo'
        },
        admin_data: {
          noms: formData.noms,
          prenoms: formData.prenoms,
          reference_agent: formData.reference_agent || `AG-${Date.now()}`,
          telephone: formData.telephone
        },
        admin_email: formData.email,
        admin_password: formData.password
      });

      const result = data as any;
      if (error || !result?.success) {
        console.error('PHARMACY-CREATION: Erreur lors de la création:', error);
        
        // En cas d'erreur, supprimer l'utilisateur créé
        await supabase.auth.admin.deleteUser(authData.user.id);
        
        toast({
          title: "Erreur",
          description: result?.error || error?.message || "Erreur lors de la création de la pharmacie",
          variant: "destructive",
        });
        return;
      }

      console.log('PHARMACY-CREATION: Pharmacie et admin créés avec succès:', result);

      // Succès complet
      toast({
        title: "Pharmacie créée avec succès",
        description: `Bienvenue ${formData.name} ! Vous pouvez maintenant accéder à votre tableau de bord.`,
      });

      console.log('PHARMACY-CREATION: Redirection vers le tableau de bord');
      
      // Rediriger vers le tableau de bord
      navigate('/tableau-de-bord');
      
    } catch (error) {
      console.error('PHARMACY-CREATION: Exception lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                          placeholder="DJL - Computer Sciences"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="pl-10 h-11"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telephone_appel" className="text-sm font-medium">
                        Téléphone *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="telephone_appel"
                          type="tel"
                          placeholder="+242 XX XXX XX XX"
                          value={formData.telephone_appel}
                          onChange={(e) => handleInputChange('telephone_appel', e.target.value)}
                          className="pl-10 h-11"
                          required
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
                        placeholder="59 rue Ibaliko CNRTV Djiri"
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
                        placeholder="Nkombo"
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
                        placeholder="Brazzaville"
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
                      Adresse email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="djl.computersciences@gmail.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">
                        Confirmer le mot de passe *
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations de l'administrateur */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Informations de l'administrateur</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prenoms" className="text-sm font-medium">
                        Prénoms *
                      </Label>
                      <Input
                        id="prenoms"
                        type="text"
                        placeholder="Lee Joamer"
                        value={formData.prenoms}
                        onChange={(e) => handleInputChange('prenoms', e.target.value)}
                        className="h-11"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="noms" className="text-sm font-medium">
                        Noms *
                      </Label>
                      <Input
                        id="noms"
                        type="text"
                        placeholder="DIAMBOMBA"
                        value={formData.noms}
                        onChange={(e) => handleInputChange('noms', e.target.value)}
                        className="h-11"
                        required
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
                          placeholder="+242 XX XXX XX XX"
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
                  size="lg"
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Building2 className="mr-2 h-5 w-5" />
                      Créer ma pharmacie
                    </>
                  )}
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
