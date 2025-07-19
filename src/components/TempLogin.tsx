import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const TempLogin = () => {
  const [email, setEmail] = useState('admin@test-pharmacie.fr');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté"
        });
        // Recharger la page pour mettre à jour le contexte
        window.location.reload();
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestUser = async () => {
    setLoading(true);
    try {
      // Créer l'utilisateur d'authentification
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) {
        toast({
          title: "Erreur création auth",
          description: authError.message,
          variant: "destructive"
        });
        return;
      }

      if (authData.user) {
        // Créer d'abord la pharmacie avec tenant_id
        const pharmacyId = crypto.randomUUID();
        const { data: pharmacyData, error: pharmacyError } = await supabase
          .from('pharmacies')
          .insert({
            id: pharmacyId,
            tenant_id: pharmacyId,
            name: 'Test Pharmacie',
            code: 'TEST001',
            email: 'test@pharmacie.fr',
            telephone_appel: '0123456789',
            address: '123 Rue Test',
            city: 'Test City',
            region: 'Test Region',
            pays: 'Cameroun'
          })
          .select()
          .single();

        if (pharmacyError) {
          toast({
            title: "Erreur création pharmacie",
            description: pharmacyError.message,
            variant: "destructive"
          });
          return;
        }

        // Ensuite créer le personnel
        const { error: personnelError } = await supabase
          .from('personnel')
          .insert({
            auth_user_id: authData.user.id,
            tenant_id: pharmacyData.id,
            noms: 'ADMIN',
            prenoms: 'Test',
            email: email,
            reference_agent: 'TEST_ADM_001',
            role: 'Admin',
            is_active: true
          });

        if (personnelError) {
          toast({
            title: "Erreur création personnel",
            description: personnelError.message,
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Compte créé avec succès",
          description: "Vous pouvez maintenant vous connecter"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connexion temporaire pour tests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mot de passe</label>
          <Input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Button 
            onClick={handleLogin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
          <Button 
            onClick={createTestUser} 
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Création...' : 'Créer compte test'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TempLogin;