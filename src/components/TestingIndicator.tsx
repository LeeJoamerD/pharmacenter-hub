import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export const TestingIndicator = () => {
  const { user, personnel, pharmacy } = useAuth();
  const { currentTenant, currentUser } = useTenant();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [showTests, setShowTests] = useState(false);

  useEffect(() => {
    // Ne pas afficher les tests en production
    if (process.env.NODE_ENV === 'production') return;

    const runTests = () => {
      const results: TestResult[] = [];

      // Test 1: Auth Context
      if (user) {
        results.push({
          name: 'Authentification',
          status: 'success',
          message: `Utilisateur connecté: ${user.email}`
        });
      } else {
        results.push({
          name: 'Authentification',
          status: 'warning',
          message: 'Aucun utilisateur connecté'
        });
      }

      // Test 2: Personnel Data
      if (personnel) {
        results.push({
          name: 'Données Personnel',
          status: 'success',
          message: `Personnel: ${personnel.prenoms} ${personnel.noms} (${personnel.role})`
        });
      } else if (user) {
        results.push({
          name: 'Données Personnel',
          status: 'error',
          message: 'Utilisateur connecté mais données personnel manquantes'
        });
      }

      // Test 3: Pharmacy Data
      if (pharmacy) {
        results.push({
          name: 'Données Pharmacie',
          status: 'success',
          message: `Pharmacie: ${pharmacy.name} (${pharmacy.code})`
        });
      } else if (user) {
        results.push({
          name: 'Données Pharmacie',
          status: 'error',
          message: 'Utilisateur connecté mais données pharmacie manquantes'
        });
      }

      // Test 4: Tenant Context Sync
      if (user && currentTenant && currentUser) {
        if (currentTenant.id === pharmacy?.id && currentUser.id === personnel?.id) {
          results.push({
            name: 'Synchronisation Tenant',
            status: 'success',
            message: 'Contextes Auth et Tenant synchronisés'
          });
        } else {
          results.push({
            name: 'Synchronisation Tenant',
            status: 'warning',
            message: 'Désynchronisation détectée entre Auth et Tenant'
          });
        }
      }

      // Test 5: Route Protection
      const currentPath = window.location.pathname;
      if (currentPath.includes('/tableau-de-bord') || currentPath.includes('/dashboard')) {
        if (user) {
          results.push({
            name: 'Protection Route',
            status: 'success',
            message: 'Accès autorisé à la route protégée'
          });
        } else {
          results.push({
            name: 'Protection Route',
            status: 'error',
            message: 'Route protégée accessible sans authentification'
          });
        }
      }

      setTests(results);
    };

    runTests();
    
    // Re-tester toutes les 5 secondes en mode développement
    const interval = setInterval(runTests, 5000);
    return () => clearInterval(interval);
  }, [user, personnel, pharmacy, currentTenant, currentUser]);

  // Ne pas afficher en production
  if (process.env.NODE_ENV === 'production') return null;

  const hasErrors = tests.some(t => t.status === 'error');
  const hasWarnings = tests.some(t => t.status === 'warning');

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div 
        className="cursor-pointer"
        onClick={() => setShowTests(!showTests)}
      >
        <Badge 
          variant={hasErrors ? 'destructive' : hasWarnings ? 'secondary' : 'default'}
          className="mb-2"
        >
          Tests: {tests.filter(t => t.status === 'success').length}/{tests.length}
          {hasErrors && ' (Erreurs)'}
          {!hasErrors && hasWarnings && ' (Avertissements)'}
        </Badge>
      </div>

      {showTests && (
        <Alert className="bg-background/95 backdrop-blur">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Tests d'Intégration</div>
              {tests.map((test, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  {test.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />}
                  {test.status === 'error' && <XCircle className="h-4 w-4 text-red-500 mt-0.5" />}
                  {test.status === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                  <div>
                    <div className="font-medium">{test.name}</div>
                    <div className="text-muted-foreground text-xs">{test.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};