
import { FadeIn } from '@/components/FadeIn';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowRight, Building2, LogOut, TestTube } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';

export function Hero() {
  const { user, connectedPharmacy, pharmacy, disconnectPharmacy, createPharmacySession } = useAuth();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Logique harmonisée : vérifier pharmacy OU connectedPharmacy
  const activePharmacy = pharmacy || connectedPharmacy;
  const isPharmacyConnected = !!activePharmacy;

  useEffect(() => {
    // Vérifier la session existante au chargement
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('HERO: Session initiale:', !!session?.user, 'Pharmacie via tenant:', !!pharmacy, 'Pharmacie session:', !!connectedPharmacy);
      setCurrentUser(session?.user || null);
    };

    checkSession();

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('HERO: Événement auth:', event, 'User:', !!session?.user, 'Pharmacie via tenant:', !!pharmacy, 'Pharmacie session:', !!connectedPharmacy);
      setCurrentUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [pharmacy, connectedPharmacy]);

  const handlePharmacyAuthentication = async () => {
    console.log('HERO: Lancement de l\'authentification Google pour pharmacie...');
    setLoading(true);
    
    try {
      // Marquer le début d'un flux OAuth pharmacie
      sessionStorage.setItem('oauth_pharmacy_flow', 'true');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        console.error('HERO: Erreur authentification Google:', error);
        sessionStorage.removeItem('oauth_pharmacy_flow');
        alert('Erreur lors de l\'authentification: ' + error.message);
      } else {
        console.log('HERO: Authentification Google lancée');
      }
    } catch (error) {
      console.error('HERO: Exception authentification Google:', error);
      sessionStorage.removeItem('oauth_pharmacy_flow');
      alert('Erreur inattendue lors de l\'authentification');
    } finally {
      setLoading(false);
    }
  };

  // Vérifier l'email pharmacie après OAuth et rediriger
  useEffect(() => {
    const checkPharmacyEmailAndRedirect = async () => {
      // Vérifier si c'est un retour d'OAuth pharmacie
      const isOAuthPharmacyFlow = sessionStorage.getItem('oauth_pharmacy_flow') === 'true';
      
      if (isOAuthPharmacyFlow && currentUser?.email) {
        console.log('HERO: Retour OAuth pharmacie détecté, vérification email...');
        
        // Nettoyer le flag immédiatement pour éviter les re-exécutions
        sessionStorage.removeItem('oauth_pharmacy_flow');
        
        // IMPORTANT: Sauvegarder toutes les données AVANT la déconnexion
        const userEmail = currentUser.email;
        const metadata = currentUser.user_metadata || {};
        const firstName = metadata.given_name || metadata.first_name || '';
        const lastName = metadata.family_name || metadata.last_name || metadata.surname || '';
        const phone = currentUser.phone || metadata.phone_number || metadata.phone || '';
        
        try {
          console.log('HERO: Vérification existence email:', userEmail);
          const { data, error } = await supabase.rpc('check_pharmacy_email_exists', {
            email_to_check: userEmail
          });

          if (error) {
            console.error('HERO: Erreur vérification email pharmacie:', error);
            return;
          }

          const result = data as { exists: boolean; pharmacy_id?: string; google_verified?: boolean };
          console.log('HERO: Résultat vérification:', result);
          
          // Construire les URLs de redirection AVANT la déconnexion
          let redirectUrl: string;
          
          if (result.exists) {
            console.log('HERO: Pharmacie existante trouvée, préparation redirection vers connexion...');
            redirectUrl = `/pharmacy-connection?email=${encodeURIComponent(userEmail)}&google_verified=true`;
          } else {
            console.log('HERO: Nouvelle pharmacie, préparation redirection vers création...');
            const params = new URLSearchParams({
              email: userEmail,
              prenoms: firstName,
              noms: lastName,
              telephone: phone,
              google_verified: 'true'
            });
            redirectUrl = `/pharmacy-creation?${params.toString()}`;
          }
          
          console.log('HERO: URL de redirection construite:', redirectUrl);
          
          // Déconnecter l'utilisateur
          console.log('HERO: Déconnexion utilisateur...');
          await supabase.auth.signOut();
          
          // Utiliser setTimeout pour permettre à la déconnexion de se terminer
          setTimeout(() => {
            console.log('HERO: Navigation vers:', redirectUrl);
            navigate(redirectUrl);
          }, 100);
          
        } catch (error) {
          console.error('HERO: Exception vérification email pharmacie:', error);
        }
      }
    };

    if (currentUser) {
      checkPharmacyEmailAndRedirect();
    }
  }, [currentUser, navigate]);

  const handlePharmacyDisconnect = () => {
    // Si c'est une session pharmacie, utiliser disconnectPharmacy
    if (connectedPharmacy) {
      disconnectPharmacy();
    }
    // Si c'est une pharmacie via tenant, déconnecter l'utilisateur
    else if (pharmacy) {
      supabase.auth.signOut();
    }
    navigate('/');
  };


  return (
    <section className="pt-32 pb-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white -z-10"></div>
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-b from-blue-100/30 to-transparent rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-blue-100/30 to-transparent rounded-full blur-3xl transform -translate-x-1/4 translate-y-1/4 -z-10"></div>
      
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <FadeIn>
              <div className="inline-block px-3 py-1 mb-6 rounded-full bg-pharma-100 border border-pharma-200 text-pharma-800 text-sm font-medium">
                La solution complète pour votre pharmacie
              </div>
            </FadeIn>
            
            <FadeIn delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6">
                <span className="block">Transformez la gestion</span>
                <span className="block text-gradient">de votre officine</span>
              </h1>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed">
                PharmaSoft est une application complète de gestion d'officine pharmaceutique disponible en version web et mobile, conçue pour simplifier tous vos processus.
              </p>
            </FadeIn>
            
            <FadeIn delay={0.3} className="flex flex-col sm:flex-row gap-4">
              {/* Gestion des pharmacies - Logique harmonisée */}
              {!isPharmacyConnected ? (
                <Button 
                  size="lg" 
                  className="button-hover-effect bg-primary hover:bg-primary/90 text-white"
                  disabled={loading}
                  onClick={handlePharmacyAuthentication}
                >
                  <Building2 size={16} className="mr-2" />
                  {loading ? 'Chargement...' : 'Connecter votre Pharmacie'}
                </Button>
              ) : (
                /* État connecté - Affichage unifié */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="button-hover-effect bg-transparent hover:bg-muted/50 text-left justify-start p-4 h-auto"
                    >
                      <div className="flex items-start gap-3">
                        <Building2 size={20} className="mt-1 text-primary" />
                        <div className="flex flex-col items-start">
                          <div className="font-semibold text-base">{activePharmacy.name}</div>
                          <div className="text-sm text-muted-foreground">{activePharmacy.email}</div>
                          <div className="text-xs text-green-600 font-medium">
                            {connectedPharmacy ? 'Session active' : 'Connecté'}
                          </div>
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-white dark:bg-gray-800 border shadow-lg">
                    <DropdownMenuItem onClick={handlePharmacyDisconnect}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {connectedPharmacy ? 'Déconnecter session' : 'Déconnecter pharmacie'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/test-interface')}>
                      <TestTube className="mr-2 h-4 w-4" />
                      Interface de test
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Link to="/tableau-de-bord">
                <Button size="lg" variant="outline" className="button-hover-effect border-primary/20 text-primary hover:bg-primary/5">
                  <span>Voir la Démo</span>
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </FadeIn>

            
            <FadeIn delay={0.4}>
              <div className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 border-white",
                        i === 1 && "bg-pharma-400",
                        i === 2 && "bg-pharma-500",
                        i === 3 && "bg-pharma-600",
                        i === 4 && "bg-pharma-700"
                      )}
                    ></div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">+500</span> pharmacies utilisent déjà PharmaSoft
                </div>
              </div>
            </FadeIn>
          </div>
          
          <div className="order-1 lg:order-2 relative">
            <FadeIn className="relative z-10" delay={0.2}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-primary/5 rounded-2xl transform -rotate-2 scale-[0.98]"></div>
                <div className="glass-card rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1628771065518-0d82f1938462?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                    alt="Pharmacie moderne"
                    className="w-full h-auto aspect-[16/9] object-cover object-center"
                    loading="lazy"
                  />
                </div>
              </div>
            </FadeIn>
            
            <FadeIn
              className="absolute -bottom-6 -left-6 z-20 max-w-[200px]"
              delay={0.5}
            >
              <div className="glass-card p-4 rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Stocks</span>
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                    Optimal
                  </span>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>1,234 produits</span>
                  <span>•</span>
                  <span>98% disponibilité</span>
                </div>
              </div>
            </FadeIn>
            
            <FadeIn
              className="absolute -top-4 -right-4 z-20 max-w-[180px]"
              delay={0.6}
            >
              <div className="glass-card p-4 rounded-lg shadow-lg">
                <div className="text-sm font-medium mb-2">Ventes</div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-4 bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-3/4 rounded-full"></div>
                  </div>
                  <span className="text-xs font-medium">+24%</span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
