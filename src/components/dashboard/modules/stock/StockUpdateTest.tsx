import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { StockUpdateService } from '@/services/stockUpdateService';

interface TestResult {
  success: boolean;
  message: string;
  lotsCreated?: number;
  movementsRecorded?: number;
  error?: string;
}

const StockUpdateTest: React.FC = () => {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const runStockUpdateTest = async () => {
    setIsLoading(true);
    
    try {
      // Test data simulating a reception
      const testReceptionData = {
        id: 'test-reception-001',
        commande_id: 'test-order-001',
        fournisseur_id: 'test-supplier-001',
        date_reception: new Date().toISOString(),
        lignes: [
          {
            produit_id: 'test-product-001',
            quantite_acceptee: 50,
            numero_lot: 'LOT-TEST-001',
            date_expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
            prix_achat_reel: 15.50,
            reference: 'PROD-001',
            libelle_produit: 'Produit Test 1'
          },
          {
            produit_id: 'test-product-002',
            quantite_acceptee: 25,
            numero_lot: 'LOT-TEST-002',
            date_expiration: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months from now
            prix_achat_reel: 25.00,
            reference: 'PROD-002',
            libelle_produit: 'Produit Test 2'
          }
        ]
      };

      console.log('🧪 Testing StockUpdateService.processReception...');
      console.log('📋 Test data:', testReceptionData);

      // Call the service
      await StockUpdateService.processReception(testReceptionData);
      
      console.log('✅ Test completed successfully');
      
      setTestResult({
        success: true,
        message: 'Stock update test passed successfully!'
      });

      toast({
        title: 'Test réussi',
        description: 'Service de mise à jour de stock fonctionne correctement',
        variant: 'default'
      });

    } catch (error) {
      console.error('❌ Test failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult({
        success: false,
        message: 'Stock update test failed',
        error: errorMessage
      });

      toast({
        title: 'Test échoué',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Test Stock Update Service
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Ce test vérifie que le service de mise à jour de stock fonctionne correctement.</p>
            <p>Il simule une réception avec 2 produits et crée automatiquement les lots et mouvements de stock.</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Données de test :</h4>
            <ul className="text-sm space-y-1">
              <li>• Produit 1: 50 unités, LOT-TEST-001</li>
              <li>• Produit 2: 25 unités, LOT-TEST-002</li>
              <li>• Prix d'achat réel inclus</li>
              <li>• Dates d'expiration valides</li>
            </ul>
          </div>
        </div>

        <Button 
          onClick={runStockUpdateTest}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Test en cours...' : 'Lancer le test'}
        </Button>

        {testResult && (
          <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h4 className={`font-medium mb-2 ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {testResult.success ? '✅ Succès' : '❌ Échec'}
            </h4>
            <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {testResult.message}
            </p>
            {testResult.success && (
              <div className="mt-2 text-sm text-green-700">
                <p>Le service de mise à jour de stock fonctionne correctement</p>
              </div>
            )}
            {testResult.error && (
              <p className="mt-2 text-sm text-red-600">
                Erreur: {testResult.error}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockUpdateTest;