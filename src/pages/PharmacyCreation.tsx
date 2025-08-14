import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2, Phone, MapPin, Mail, Shield, Loader2, CheckCircle } from 'lucide-react';
import { FadeIn } from '@/components/FadeIn';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function PharmacyCreation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // États du formulaire simplifié
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
    telephone: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [googleDataLoaded, setGoogleDataLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fonction pour extraire et formater les données Google
  const extractGoogleData = (user: any) => {
    if (!user) {
      console.log('PHARMACY-CREATION: Aucun utilisateur fourni');
      return null;
    }
    
    console.log('PHARMACY-CREATION: Extraction des données Google:', user);
    
    const metadata = user.user_metadata || {};
    
    // Différentes sources pour les données
    const email = user.email || metadata.email;
    const firstName = metadata.given_name || metadata.first_name || '';
    const lastName = metadata.family_name || metadata.last_name || '';
    const phone = user.phone || metadata.phone_number || metadata.phone || '';
    
    const googleData = {
      email: email || '',
      prenoms: firstName || '',
      noms: lastName || '',
      telephone_appel: phone || '',
      telephone: phone || ''
    };
    
    console.log('PHARMACY-CREATION: Données Google extraites:', googleData);
    return googleData;
  };

  // État pour tracker les champs préremplis par Google
  const [googleFilledFields, setGoogleFilledFields] = useState<Set<string>>(new Set());

  // Fonction pour préremplir le formulaire
  const fillFormWithGoogleData = (user: any) => {
    const googleData = extractGoogleData(user);
    
    if (!googleData) {
      console.log('PHARMACY-CREATION: Aucune données Google à préremplir');
      return;
    }
    
    console.log('PHARMACY-CREATION: Début du préremplissage avec:', googleData);
    
    const filledFields = new Set<string>();
    
    setFormData(prev => {
      const newData = { ...prev };
      
      if (googleData.email) {
        newData.email = googleData.email;
        filledFields.add('email');
      }
      
      if (googleData.prenoms) {
        newData.prenoms = googleData.prenoms;
        filledFields.add('prenoms');
      }
      
      if (googleData.noms) {
        newData.noms = googleData.noms;
        filledFields.add('noms');
      }
      
      if (googleData.telephone_appel) {
        newData.telephone_appel = googleData.telephone_appel;
        filledFields.add('telephone_appel');
      }
      
      if (googleData.telephone) {
        newData.telephone = googleData.telephone;
        filledFields.add('telephone');
      }
      
      return newData;
    });
    
    setGoogleFilledFields(filledFields);
    setGoogleDataLoaded(true);
    console.log('PHARMACY-CREATION: Préremplissage terminé');
  };

  // Préremplir depuis les paramètres URL ou Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const prenomsParam = params.get('prenoms');
    const nomsParam = params.get('noms');
    const telephoneParam = params.get('telephone');
    const googleVerified = params.get('google_verified') === 'true';

    if (emailParam && googleVerified) {
      console.log('PHARMACY-CREATION: Pré-remplissage depuis paramètres URL...');
      setIsAuthenticated(true);
      setFormData(prev => ({
        ...prev,
        email: emailParam || '',
        prenoms: prenomsParam || '',
        noms: nomsParam || '',
        telephone: telephoneParam || '',
        telephone_appel: telephoneParam || ''
      }));
      setGoogleDataLoaded(true);
    } else if (user?.email) {
      console.log('PHARMACY-CREATION: Utilisateur Google détecté, préremplissage...');
      setIsAuthenticated(true);
      fillFormWithGoogleData(user);
    } else {
      setIsAuthenticated(false);
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Déterminer si un champ est prérempli par Google
  const isFieldFromGoogle = (field: string) => {
    return googleFilledFields.has(field);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentification requise",
        description: "Veuillez vous authentifier avec Google avant de continuer",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('PHARMACY-CREATION: Début de la création avec utilisateur Google:', user.email);

      // Utiliser la fonction RPC unifiée register_pharmacy_with_admin
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
        admin_email: user.email,
        admin_password: '' // Pas besoin de mot de passe pour les utilisateurs Google
      });

      const result = data as any;
      if (error || !result?.success) {
        console.error('PHARMACY-CREATION: Erreur lors de la création:', error);
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
              {/* Status d'authentification */}
              {isAuthenticated && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Authentifié avec Google</span>
                  </div>
                </div>
              )}
              
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
                           disabled={!isAuthenticated}
                           required
                         />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telephone_appel" className="text-sm font-medium">
                        Téléphone * {isFieldFromGoogle('telephone_appel') && <span className="text-xs text-green-600 font-medium">(depuis Google)</span>}
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                         <Input
                           id="telephone_appel"
                           type="tel"
                           placeholder="+242 XX XXX XX XX"
                           value={formData.telephone_appel}
                           onChange={(e) => handleInputChange('telephone_appel', e.target.value)}
                           className={`pl-10 h-11 ${isFieldFromGoogle('telephone_appel') ? 'bg-green-50 border-green-200' : ''}`}
                           disabled={!isAuthenticated}
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
                         disabled={!isAuthenticated}
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
                         disabled={!isAuthenticated}
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
                         disabled={!isAuthenticated}
                         required
                       />
                    </div>
                  </div>
                </div>

                {/* Informations de connexion simplifiées */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Informations de connexion</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Adresse email * {isFieldFromGoogle('email') && <span className="text-xs text-green-600 font-medium">(depuis Google)</span>}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                       <Input
                         id="email"
                         type="email"
                         placeholder="djl.computersciences@gmail.com"
                         value={formData.email}
                         onChange={(e) => handleInputChange('email', e.target.value)}
                         className={`pl-10 h-11 ${isFieldFromGoogle('email') ? 'bg-green-50 border-green-200' : ''}`}
                         disabled={!isAuthenticated}
                         required
                       />
                    </div>
                  </div>

                  {/* Section sécurité automatique */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">Sécurité automatique</span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      Votre authentification Google sécurise automatiquement votre compte.
                    </p>
                  </div>
                </div>

                {/* Informations de l'administrateur */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Informations de l'administrateur</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prenoms" className="text-sm font-medium">
                        Prénoms * {isFieldFromGoogle('prenoms') && <span className="text-xs text-green-600 font-medium">(depuis Google)</span>}
                      </Label>
                       <Input
                         id="prenoms"
                         type="text"
                         placeholder="Lee Joamer"
                         value={formData.prenoms}
                         onChange={(e) => handleInputChange('prenoms', e.target.value)}
                         className={`h-11 ${isFieldFromGoogle('prenoms') ? 'bg-green-50 border-green-200' : ''}`}
                         disabled={!isAuthenticated}
                         required
                       />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="noms" className="text-sm font-medium">
                        Noms * {isFieldFromGoogle('noms') && <span className="text-xs text-green-600 font-medium">(depuis Google)</span>}
                      </Label>
                       <Input
                         id="noms"
                         type="text"
                         placeholder="DIAMBOMBA"
                         value={formData.noms}
                         onChange={(e) => handleInputChange('noms', e.target.value)}
                         className={`h-11 ${isFieldFromGoogle('noms') ? 'bg-green-50 border-green-200' : ''}`}
                         disabled={!isAuthenticated}
                         required
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telephone" className="text-sm font-medium">
                        Téléphone personnel * {isFieldFromGoogle('telephone') && <span className="text-xs text-green-600 font-medium">(depuis Google)</span>}
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                         <Input
                           id="telephone"
                           type="tel"
                           placeholder="+242 XX XXX XX XX"
                           value={formData.telephone}
                           onChange={(e) => handleInputChange('telephone', e.target.value)}
                           className={`pl-10 h-11 ${isFieldFromGoogle('telephone') ? 'bg-green-50 border-green-200' : ''}`}
                           disabled={!isAuthenticated}
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
                         disabled={!isAuthenticated}
                       />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90"
                  disabled={!isAuthenticated || isLoading}
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