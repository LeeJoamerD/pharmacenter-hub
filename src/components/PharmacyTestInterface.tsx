
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, TestTube, Key, Building2, User } from 'lucide-react';

interface TestAccount {
  id: string;
  email: string;
  pharmacy_name: string;
  personnel_name: string;
  role: string;
  created_at: string;
}

const PharmacyTestInterface = () => {
  const { connectPharmacy, createPharmacySession, user, pharmacy } = useAuth();
  const { toast } = useToast();
  const [testAccounts, setTestAccounts] = useState<TestAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Formulaire de test de connexion
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  
  // Formulaire de création de compte test
  const [newAccount, setNewAccount] = useState({
    email: '',
    password: '',
    pharmacyName: '',
    personnelName: '',
    personnelPrenom: ''
  });

  useEffect(() => {
    loadTestAccounts();
  }, []);

  const loadTestAccounts = async () => {
    try {
      const { data: accounts, error } = await supabase
        .from('personnel')
        .select(`
          id,
          email,
          noms,
          prenoms,
          role,
          created_at,
          pharmacies!inner(name)
        `)
        .eq('role', 'Admin')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading test accounts:', error);
        return;
      }

      const formattedAccounts = accounts?.map(account => ({
        id: account.id,
        email: account.email,
        pharmacy_name: (account as any).pharmacies?.name || 'N/A',
        personnel_name: `${account.prenoms} ${account.noms}`,
        role: account.role,
        created_at: account.created_at
      })) || [];

      setTestAccounts(formattedAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleTestConnection = async () => {
    if (!testEmail || !testPassword) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir l'email et le mot de passe",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await connectPharmacy(testEmail, testPassword);
      
      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté à la pharmacie"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!user || !pharmacy) {
      toast({
        title: "Conditions non remplies",
        description: "Vous devez être connecté avec une pharmacie",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await createPharmacySession();
      
      if (error) {
        toast({
          title: "Erreur création session",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Session créée",
          description: "Session pharmacie créée avec succès"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestAccount = async () => {
    if (!newAccount.email || !newAccount.password || !newAccount.pharmacyName || !newAccount.personnelName) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Créer l'utilisateur d'authentification
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAccount.email,
        password: newAccount.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        toast({
          title: "Erreur création utilisateur",
          description: authError.message,
          variant: "destructive"
        });
        return;
      }

      if (authData.user) {
        // Créer la pharmacie
        const pharmacyId = crypto.randomUUID();
        const { error: pharmacyError } = await supabase
          .from('pharmacies')
          .insert({
            id: pharmacyId,
            tenant_id: pharmacyId,
            name: newAccount.pharmacyName,
            code: `TEST_${Date.now()}`,
            email: newAccount.email,
            telephone_appel: '0123456789',
            address: 'Adresse test',
            city: 'Ville test',
            region: 'Région test',
            pays: 'Cameroun',
            status: 'active'
          });

        if (pharmacyError) {
          toast({
            title: "Erreur création pharmacie",
            description: pharmacyError.message,
            variant: "destructive"
          });
          return;
        }

        // Créer le personnel admin
        const { error: personnelError } = await supabase
          .from('personnel')
          .insert({
            auth_user_id: authData.user.id,
            tenant_id: pharmacyId,
            noms: newAccount.personnelName,
            prenoms: newAccount.personnelPrenom,
            email: newAccount.email,
            reference_agent: `TEST_${Date.now()}`,
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
          description: "Le compte test a été créé avec succès"
        });

        // Réinitialiser le formulaire
        setNewAccount({
          email: '',
          password: '',
          pharmacyName: '',
          personnelName: '',
          personnelPrenom: ''
        });

        // Recharger la liste des comptes
        await loadTestAccounts();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Interface de Test - Connexions Pharmacies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test de connexion */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Key className="h-4 w-4" />
              Test de Connexion
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testEmail">Email</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="admin@test-pharmacie.fr"
                />
              </div>
              <div>
                <Label htmlFor="testPassword">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="testPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    placeholder="password123"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleTestConnection} disabled={loading}>
                {loading ? 'Test en cours...' : 'Tester Connexion'}
              </Button>
              <Button onClick={handleCreateSession} disabled={loading} variant="outline">
                Créer Session Pharmacie
              </Button>
            </div>
          </div>

          {/* Création de compte test */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Créer un Compte Test
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newEmail">Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newAccount.email}
                  onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                  placeholder="test@nouvelle-pharmacie.fr"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newAccount.password}
                  onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                  placeholder="motdepasse123"
                />
              </div>
              <div>
                <Label htmlFor="pharmacyName">Nom Pharmacie</Label>
                <Input
                  id="pharmacyName"
                  value={newAccount.pharmacyName}
                  onChange={(e) => setNewAccount({...newAccount, pharmacyName: e.target.value})}
                  placeholder="Pharmacie Test"
                />
              </div>
              <div>
                <Label htmlFor="personnelName">Nom Personnel</Label>
                <Input
                  id="personnelName"
                  value={newAccount.personnelName}
                  onChange={(e) => setNewAccount({...newAccount, personnelName: e.target.value})}
                  placeholder="DUPONT"
                />
              </div>
              <div>
                <Label htmlFor="personnelPrenom">Prénom Personnel</Label>
                <Input
                  id="personnelPrenom"
                  value={newAccount.personnelPrenom}
                  onChange={(e) => setNewAccount({...newAccount, personnelPrenom: e.target.value})}
                  placeholder="Jean"
                />
              </div>
            </div>
            <Button onClick={createTestAccount} disabled={loading}>
              {loading ? 'Création...' : 'Créer Compte Test'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des comptes existants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Comptes Existants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {testAccounts.length === 0 ? (
              <p className="text-muted-foreground">Aucun compte trouvé</p>
            ) : (
              testAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{account.email}</div>
                    <div className="text-sm text-muted-foreground">
                      {account.personnel_name} - {account.pharmacy_name}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {account.role} - {new Date(account.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PharmacyTestInterface;
