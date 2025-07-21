import { FadeIn } from '@/components/FadeIn';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

export function Hero() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Vérifier la session existante au chargement
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('HERO: Session initiale:', !!session?.user);
      setCurrentUser(session?.user || null);
    };

    checkSession();

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('HERO: Événement auth:', event, 'User:', !!session?.user);
      setCurrentUser(session?.user || null);
      
      // Si l'utilisateur vient de se connecter, rediriger vers l'inscription
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('HERO: Redirection vers pharmacy-registration après authentification');
        window.location.href = '/pharmacy-registration';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePharmacyConnection = async () => {
    console.log('HERO: Clic sur le bouton Connecter votre Pharmacie');
    console.log('HERO: Utilisateur actuel:', currentUser ? currentUser.email : 'aucun');
    
    // Si l'utilisateur n'est pas connecté, lancer l'authentification Google
    if (!currentUser) {
      console.log('HERO: Lancement de l\'authentification Google...');
      setLoading(true);
      
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`
          }
        });

        if (error) {
          console.error('HERO: Erreur authentification Google:', error);
          alert('Erreur lors de l\'authentification: ' + error.message);
        } else {
          console.log('HERO: Authentification Google lancée');
        }
      } catch (error) {
        console.error('HERO: Exception authentification Google:', error);
        alert('Erreur inattendue lors de l\'authentification');
      } finally {
        setLoading(false);
      }
    } else {
      // Si déjà connecté, rediriger directement vers l'inscription
      console.log('HERO: Utilisateur déjà connecté, redirection vers pharmacy-registration');
      window.location.href = '/pharmacy-registration';
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
              <Button 
                size="lg" 
                className="button-hover-effect bg-primary hover:bg-primary/90 text-white"
                onClick={handlePharmacyConnection}
                disabled={loading}
              >
                {loading ? 'Authentification...' : 'Connecter votre Pharmacie'}
              </Button>
              <Link to="/tableau-de-bord">
                <Button size="lg" variant="outline" className="button-hover-effect border-primary/20 text-primary hover:bg-primary/5">
                  <span>Voir la Démo</span>
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </FadeIn>

            {/* Debug info pour voir l'état actuel */}
            {currentUser && (
              <FadeIn delay={0.35} className="mt-4">
                <div className="p-2 bg-green-100 border border-green-300 rounded text-sm text-green-700">
                  ✅ Connecté: {currentUser.email}
                </div>
              </FadeIn>
            )}
            
          
          
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
