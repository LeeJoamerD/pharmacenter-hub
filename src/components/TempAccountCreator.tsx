import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copy, CheckCircle } from 'lucide-react';

const TempAccountCreator = () => {
  const [email, setEmail] = useState('test.temp@pharmacie.cm');
  const [password, setPassword] = useState('TempPassword123!');
  const [loading, setLoading] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<any>(null);
  const { toast } = useToast();

  const generateRandomId = () => crypto.randomUUID();

  const createTempAccount = async () => {
    setLoading(true);
    try {
      // 1. Créer l'utilisateur d'authentification
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
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
        // 2. Créer la pharmacie avec tenant_id = id (contrainte requise)
        const pharmacyId = generateRandomId();
        const { data: pharmacyData, error: pharmacyError } = await supabase
          .from('pharmacies')
          .insert({
            id: pharmacyId,
            tenant_id: pharmacyId, // Important: tenant_id doit égaler id
            name: 'Pharmacie Test Temporaire',
            code: `TEMP_${Date.now()}`,
            email: email,
            telephone_appel: '+237670000000',
            address: '123 Rue de Test Temporaire',
            quartier: 'Quartier Test',
            arrondissement: 'Arrondissement Test',
            city: 'Yaoundé',
            region: 'Centre',
            pays: 'Cameroun',
            departement: 'Test Department',
            type: 'Pharmacie',
            status: 'active'
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

        // 3. Créer le personnel administrateur
        const { error: personnelError } = await supabase
          .from('personnel')
          .insert({
            auth_user_id: authData.user.id,
            tenant_id: pharmacyData.id,
            noms: 'ADMIN',
            prenoms: 'Temporaire',
            email: email,
            reference_agent: `TEMP_ADM_${Date.now()}`,
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

        // Succès
        const accountInfo = {
          email: email,
          password: password,
          pharmacyName: pharmacyData.name,
          pharmacyCode: pharmacyData.code,
          pharmacyId: pharmacyData.id
        };

        setCreatedAccount(accountInfo);
        setAccountCreated(true);

        toast({
          title: "Compte temporaire créé avec succès",
          description: "Les informations de connexion sont affichées ci-dessous"
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Le texte a été copié dans le presse-papiers"
    });
  };

  if (accountCreated && createdAccount) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Compte temporaire créé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-green-800">Informations de connexion :</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Email :</span>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded text-sm">{createdAccount.email}</code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(createdAccount.email)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Mot de passe :</span>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded text-sm">{createdAccount.password}</code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(createdAccount.password)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Pharmacie :</span>
                <span className="text-sm">{createdAccount.pharmacyName}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Code :</span>
                <span className="text-sm">{createdAccount.pharmacyCode}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Procédure de connexion :</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li>Aller sur la page d'authentification</li>
              <li>Utiliser l'email : <code>{createdAccount.email}</code></li>
              <li>Utiliser le mot de passe : <code>{createdAccount.password}</code></li>
              <li>Cliquer sur "Se connecter"</li>
            </ol>
          </div>
          
          <div className="flex justify-center">
            <Button onClick={() => window.location.href = '/auth'}>
              Aller à la Connexion
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Créer un compte temporaire</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@pharmacie.cm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mot de passe</label>
          <Input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe sécurisé"
          />
        </div>
        <Button 
          onClick={createTempAccount} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Création en cours...' : 'Créer le compte temporaire'}
        </Button>
        
        <div className="text-xs text-muted-foreground">
          <p>Ce compte temporaire sera créé avec :</p>
          <ul className="list-disc list-inside mt-1">
            <li>Une pharmacie de test</li>
            <li>Un administrateur avec tous les droits</li>
            <li>Accès complet au système</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TempAccountCreator;