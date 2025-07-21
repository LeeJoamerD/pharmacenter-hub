import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export function GoogleAuthTest() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Vérifier la session existante
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('TEST AUTH: Session initiale:', !!session?.user);
      setUser(session?.user || null);
    };

    checkSession();

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('TEST AUTH: Événement:', event, 'User:', !!session?.user);
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    console.log('TEST AUTH: Lancement de l\'authentification Google...');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('TEST AUTH: Erreur:', error);
      }
    } catch (error) {
      console.error('TEST AUTH: Exception:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    console.log('TEST AUTH: Déconnexion...');
    await supabase.auth.signOut();
  };

  return (
    <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50 max-w-md">
      <h3 className="text-sm font-bold text-red-700 mb-2">🧪 TEST GOOGLE AUTH</h3>
      
      {user ? (
        <div className="space-y-2">
          <p className="text-xs text-green-700">
            ✅ Connecté: {user.email}
          </p>
          <p className="text-xs text-gray-600">
            ID: {user.id}
          </p>
          <Button 
            onClick={handleSignOut}
            size="sm"
            variant="destructive"
            className="text-xs"
          >
            Déconnexion
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-red-700">❌ Non connecté</p>
          <Button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            size="sm"
            className="text-xs"
          >
            {loading ? 'Connexion...' : 'Test Google Auth'}
          </Button>
        </div>
      )}
    </div>
  );
}