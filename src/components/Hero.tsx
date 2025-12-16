import { FadeIn } from '@/components/FadeIn';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowRight, Building2, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { usePharmacyConnection } from '@/hooks/usePharmacyConnection';
import { useHeroMetrics } from '@/hooks/useHeroMetrics';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

export function Hero() {
  const { user, connectedPharmacy, pharmacy, disconnectPharmacy, createPharmacySession } = useAuth();
  // Debug hook pour suivre l'état de connexion
  usePharmacyConnection();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Logique harmonisée : affichage basé sur connectedPharmacy ou pharmacy
  const activePharmacy = connectedPharmacy || pharmacy;
  const isPharmacyConnected = !!connectedPharmacy;

  // Métriques Hero avec support multi-tenant (utilise TenantContext)
  const { metrics, isLoading: metricsLoading } = useHeroMetrics();
  const { formatNumber } = useCurrencyFormatting();

  // Création automatique de session pharmacie si pharmacy existe mais pas connectedPharmacy
  useEffect(() => {
    if (pharmacy && !connectedPharmacy && user) {
      console.log('HERO: Création automatique de la session pharmacie...');
      createPharmacySession().then(({ error }) => {
        if (error) {
          console.error('HERO: Erreur création session pharmacie:', error);
        } else {
          console.log('HERO: Session pharmacie créée automatiquement');
        }
      });
    }
  }, [pharmacy, connectedPharmacy, user, createPharmacySession]);

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

  const handlePharmacyAuthentication = () => {
    console.log('HERO: Redirection vers création de pharmacie...');
    navigate('/pharmacy-creation');
  };

  const handlePharmacyDisconnect = async () => {
    try {
      console.log('HERO: Déconnexion complète de la pharmacie...');
      
      // Déconnecter complètement - session pharmacie et utilisateur
      await disconnectPharmacy();
      await supabase.auth.signOut();
      
      // Forcer le rechargement de l'état
      setCurrentUser(null);
      
      console.log('HERO: Déconnexion réussie, retour à l\'accueil');
      navigate('/');
    } catch (error) {
      console.error('HERO: Erreur lors de la déconnexion:', error);
    }
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
                            Session active
                          </div>
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-white dark:bg-gray-800 border shadow-lg">
                    <DropdownMenuItem onClick={handlePharmacyDisconnect}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Se déconnecter
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
                  <span className="font-medium text-foreground">
                    {metrics.isRealData ? metrics.pharmacyCount : '+500'}
                  </span> pharmacies utilisent déjà PharmaSoft
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
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    metrics.stockStatus === 'Optimal' && "bg-green-100 text-green-800",
                    metrics.stockStatus === 'Attention' && "bg-yellow-100 text-yellow-800",
                    metrics.stockStatus === 'Critique' && "bg-red-100 text-red-800"
                  )}>
                    {metrics.stockStatus}
                  </span>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>{formatNumber(metrics.totalProducts)} produits</span>
                  <span>•</span>
                  <span>{metrics.availabilityRate}% disponibilité</span>
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
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        metrics.salesGrowth >= 0 ? "bg-primary" : "bg-destructive"
                      )}
                      style={{ width: `${Math.min(Math.abs(metrics.salesGrowth), 100)}%` }}
                    ></div>
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    metrics.salesGrowth >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {metrics.salesGrowth >= 0 ? '+' : ''}{metrics.salesGrowth}%
                  </span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
