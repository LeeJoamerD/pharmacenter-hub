import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Chrome, Shield, User, Building, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface GoogleAccount {
  id: string;
  email: string;
  name: string;
  picture: string;
}

const PharmacyLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'selection' | 'user-auth' | 'pharmacy-auth' | 'google-selection'>('selection');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<GoogleAccount | null>(null);
  
  // Form states
  const [userCredentials, setUserCredentials] = useState({
    email: '',
    password: ''
  });
  
  const [pharmacyCredentials, setPharmacyCredentials] = useState({
    email: '',
    password: ''
  });

  // Mock Google accounts for demonstration (in real app, this would come from Google API)
  const mockGoogleAccounts: GoogleAccount[] = [
    {
      id: '1',
      email: 'admin@pharmacie.com',
      name: 'Administrateur Pharmacie',
      picture: 'https://via.placeholder.com/40'
    },
    {
      id: '2', 
      email: 'user@example.com',
      name: 'Utilisateur Test',
      picture: 'https://via.placeholder.com/40'
    }
  ];

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/tableau-de-bord');
    }
  }, [user, navigate]);

  const handleGoogleAuth = async (step: 'user' | 'pharmacy') => {
    setIsLoading(true);
    setError('');
    
    try {
      localStorage.setItem('pharmacyAuthType', step);
      setCurrentStep('google-selection');
    } catch (error: any) {
      console.error('Erreur authentification Google:', error);
      toast({
        title: 'Erreur d\'authentification',
        description: error.message || 'Impossible de se connecter avec Google',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAccountSelection = async (account: GoogleAccount) => {
    setSelectedAccount(account);
    setIsLoading(true);
    
    try {
      const authType = localStorage.getItem('pharmacyAuthType');
      
      if (authType === 'user') {
        setUserCredentials(prev => ({ ...prev, email: account.email }));
        setCurrentStep('user-auth');
      } else if (authType === 'pharmacy') {
        setPharmacyCredentials(prev => ({ ...prev, email: account.email }));
        setCurrentStep('pharmacy-auth');
      }
    } catch (error) {
      setError('Erreur lors de la sélection du compte');
    } finally {
      setIsLoading(false);
    }
  };

  const validateUserRole = async (email: string, password: string): Promise<{ isAdmin: boolean; user?: any }> => {
    // Simulate user role validation
    // In real app, this would check against Supabase
    const mockUsers = [
      { email: 'admin@pharmacie.com', role: 'Admin', password: 'admin123' },
      { email: 'user@example.com', role: 'Employé', password: 'user123' }
    ];
    
    const user = mockUsers.find(u => u.email === email && u.password === password);
    return {
      isAdmin: user?.role === 'Admin',
      user
    };
  };

  const handleUserAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { isAdmin, user } = await validateUserRole(userCredentials.email, userCredentials.password);
      
      if (!isAdmin) {
        setError('Seul un administrateur peut ouvrir un compte pharmacie.');
        setIsLoading(false);
        return;
      }

      // Store user data and proceed to pharmacy auth
      localStorage.setItem('authenticatedUser', JSON.stringify(user));
      setCurrentStep('selection');
      toast({
        title: 'Authentification réussie',
        description: 'Vous pouvez maintenant procéder à l\'authentification de la pharmacie.',
      });
    } catch (error) {
      setError('Erreur lors de l\'authentification utilisateur');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePharmacyAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { isAdmin } = await validateUserRole(pharmacyCredentials.email, pharmacyCredentials.password);
      
      if (!isAdmin) {
        setError('Seul un administrateur peut accéder au compte pharmacie.');
        setIsLoading(false);
        return;
      }

      // Check if pharmacy account exists
      const pharmacyExists = pharmacyCredentials.email === 'admin@pharmacie.com';
      
      if (pharmacyExists) {
        // Login successful
        toast({
          title: 'Connexion réussie',
          description: 'Redirection vers le tableau de bord...',
        });
        navigate('/tableau-de-bord');
      } else {
        // Redirect to pharmacy registration
        toast({
          title: 'Compte pharmacie non trouvé',
          description: 'Redirection vers le formulaire d\'inscription...',
        });
        navigate('/pharmacy-registration');
      }
    } catch (error) {
      setError('Erreur lors de l\'authentification de la pharmacie');
    } finally {
      setIsLoading(false);
    }
  };

  const renderGoogleAccountSelection = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Chrome className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl">Choisir un compte</CardTitle>
        <CardDescription>
          Sélectionnez le compte Google à utiliser pour l'authentification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockGoogleAccounts.map((account) => (
          <Button
            key={account.id}
            variant="outline"
            className="w-full p-4 h-auto flex items-center justify-start space-x-3"
            onClick={() => handleGoogleAccountSelection(account)}
            disabled={isLoading}
          >
            <img 
              src={account.picture} 
              alt={account.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="text-left">
              <div className="font-medium">{account.name}</div>
              <div className="text-sm text-muted-foreground">{account.email}</div>
            </div>
          </Button>
        ))}
        
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => handleGoogleAuth(localStorage.getItem('pharmacyAuthType') as 'user' | 'pharmacy')}
        >
          Utiliser un autre compte
        </Button>
        
        <Button
          variant="ghost"
          onClick={() => setCurrentStep('selection')}
          className="w-full text-muted-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </CardContent>
    </Card>
  );

  const renderUserAuth = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-50 rounded-full">
            <User className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-xl">Compte Utilisateur</CardTitle>
        <CardDescription>
          Authentifiez-vous avec votre compte utilisateur administrateur
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleUserAuth}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={userCredentials.email}
              onChange={(e) => setUserCredentials(prev => ({ ...prev, email: e.target.value }))}
              placeholder="votre@email.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="user-password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="user-password"
                type={showPassword ? "text" : "password"}
                value={userCredentials.password}
                onChange={(e) => setUserCredentials(prev => ({ ...prev, password: e.target.value }))}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={() => setCurrentStep('selection')}
            className="w-full text-muted-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </CardContent>
      </form>
    </Card>
  );

  const renderPharmacyAuth = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-green-50 rounded-full">
            <Building className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <CardTitle className="text-xl">Compte Pharmacie</CardTitle>
        <CardDescription>
          Authentifiez-vous avec le compte de votre pharmacie
        </CardDescription>
      </CardHeader>
      <form onSubmit={handlePharmacyAuth}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="pharmacy-email">Email</Label>
            <Input
              id="pharmacy-email"
              type="email"
              value={pharmacyCredentials.email}
              onChange={(e) => setPharmacyCredentials(prev => ({ ...prev, email: e.target.value }))}
              placeholder="pharmacie@email.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pharmacy-password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="pharmacy-password"
                type={showPassword ? "text" : "password"}
                value={pharmacyCredentials.password}
                onChange={(e) => setPharmacyCredentials(prev => ({ ...prev, password: e.target.value }))}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={() => setCurrentStep('selection')}
            className="w-full text-muted-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </CardContent>
      </form>
    </Card>
  );

  const renderSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Connexion Pharmacie</h1>
        <p className="text-muted-foreground">Authentifiez-vous pour accéder à votre espace pharmacie</p>
      </div>

      {/* Bloc Compte Utilisateur */}
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-xl">Compte Utilisateur</CardTitle>
          <CardDescription>
            Authentifiez-vous en tant qu'administrateur pour continuer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => handleGoogleAuth('user')}
            disabled={isLoading}
            className="w-full h-12 text-base"
            size="lg"
          >
            <Chrome className="mr-2 h-5 w-5" />
            Continuer avec Google
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setCurrentStep('user-auth')}
            className="w-full"
          >
            Utiliser email/mot de passe
          </Button>
        </CardContent>
      </Card>

      {/* Bloc Compte Pharmacie */}
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-50 rounded-full">
              <Building className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-xl">Compte Pharmacie</CardTitle>
          <CardDescription>
            Connectez-vous au compte de votre pharmacie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => handleGoogleAuth('pharmacy')}
            disabled={isLoading}
            className="w-full h-12 text-base"
            size="lg"
          >
            <Chrome className="mr-2 h-5 w-5" />
            Continuer avec Google
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setCurrentStep('pharmacy-auth')}
            className="w-full"
          >
            Utiliser email/mot de passe
          </Button>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="text-muted-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-md">
        {currentStep === 'selection' && renderSelection()}
        {currentStep === 'user-auth' && renderUserAuth()}
        {currentStep === 'pharmacy-auth' && renderPharmacyAuth()}
        {currentStep === 'google-selection' && renderGoogleAccountSelection()}
      </div>
    </div>
  );
};

export default PharmacyLogin;