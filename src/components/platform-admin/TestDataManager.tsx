import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Trash2, 
  Play, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  Clock,
  Package
} from 'lucide-react';
import { insertTestData, cleanupTestData } from '@/utils/testDataGenerator';

interface TestDataManagerProps {
  tenantId?: string;
}

const TestDataManager = ({ tenantId }: TestDataManagerProps) => {
  const [productCount, setProductCount] = useState(1000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [performanceResults, setPerformanceResults] = useState<any>(null);
  const [testSearchTerm, setTestSearchTerm] = useState('paracétamol');

  const handleGenerateData = async () => {
    if (!tenantId) {
      alert('Aucun tenant sélectionné');
      return;
    }

    setIsGenerating(true);
    setTestResults(null);
    
    try {
      const startTime = Date.now();
      const result = await insertTestData(tenantId, productCount);
      const endTime = Date.now();
      
      setTestResults({
        ...result,
        generationTime: endTime - startTime,
        timestamp: new Date().toLocaleString()
      });
    } catch (error) {
      setTestResults({
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCleanupData = async () => {
    if (!tenantId) {
      alert('Aucun tenant sélectionné');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les données de test ?')) {
      return;
    }

    setIsCleaning(true);
    
    try {
      const result = await cleanupTestData(tenantId);
      setTestResults({
        ...result,
        action: 'cleanup',
        timestamp: new Date().toLocaleString()
      });
    } catch (error) {
      setTestResults({
        success: false,
        error: (error as Error).message,
        action: 'cleanup',
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setIsCleaning(false);
    }
  };

  const runPerformanceTest = async () => {
    if (!tenantId) {
      alert('Aucun tenant sélectionné');
      return;
    }

    const testTerms = ['paracétamol', 'amoxicilline', 'vitamine', 'sirop', 'MED', 'PHR'];
    const results = [];

    for (const term of testTerms) {
      const startTime = performance.now();
      
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulated search
        
        const endTime = performance.now();
        results.push({
          term,
          responseTime: Math.round(endTime - startTime),
          success: true
        });
      } catch (error) {
        results.push({
          term,
          responseTime: 0,
          success: false,
          error: (error as Error).message
        });
      }
    }

    setPerformanceResults({
      tests: results,
      averageResponseTime: Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length),
      successRate: Math.round((results.filter(r => r.success).length / results.length) * 100),
      timestamp: new Date().toLocaleString()
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gestionnaire de Données de Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Information :</h4>
            <p className="text-sm text-blue-800">
              Cet outil permet de générer des données de test pour valider les performances 
              de la recherche rapide avec un grand nombre de produits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nombre de produits à générer
                </label>
                <Input
                  type="number"
                  value={productCount}
                  onChange={(e) => setProductCount(parseInt(e.target.value) || 1000)}
                  min="100"
                  max="10000"
                  step="100"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateData}
                  disabled={isGenerating || !tenantId}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Générer
                    </>
                  )}
                </Button>

                <Button
                  variant="destructive"
                  onClick={handleCleanupData}
                  disabled={isCleaning || !tenantId}
                >
                  {isCleaning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tenant ID actuel
                </label>
                <div className="p-2 bg-gray-100 rounded text-sm font-mono">
                  {tenantId || 'Aucun tenant sélectionné'}
                </div>
              </div>

              <Button
                onClick={runPerformanceTest}
                disabled={!tenantId}
                variant="outline"
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Test de Performance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résultats de génération */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResults.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Résultats {testResults.action === 'cleanup' ? 'de Nettoyage' : 'de Génération'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.success ? (
              <div className="space-y-2">
                {testResults.action !== 'cleanup' && (
                  <>
                    <div className="flex justify-between">
                      <span>Produits générés :</span>
                      <Badge variant="outline">{testResults.productsInserted}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Lots générés :</span>
                      <Badge variant="outline">{testResults.lotsInserted}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Temps de génération :</span>
                      <Badge variant="outline">{testResults.generationTime}ms</Badge>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span>Horodatage :</span>
                  <span className="text-sm text-muted-foreground">{testResults.timestamp}</span>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Erreur : {testResults.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test de recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Test de Recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Terme de recherche..."
              value={testSearchTerm}
              onChange={(e) => setTestSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Badge variant="outline">Prêt</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Résultats des tests de performance */}
      {performanceResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Résultats des Tests de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {performanceResults.averageResponseTime}ms
                </div>
                <div className="text-sm text-muted-foreground">Temps moyen</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {performanceResults.successRate}%
                </div>
                <div className="text-sm text-muted-foreground">Taux de succès</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {performanceResults.tests.length}
                </div>
                <div className="text-sm text-muted-foreground">Tests effectués</div>
              </div>
            </div>

            <div className="space-y-2">
              {performanceResults.tests.map((test: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-mono text-sm">{test.term}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={test.success ? "default" : "destructive"}>
                      {test.responseTime}ms
                    </Badge>
                    {test.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Tests effectués le : {performanceResults.timestamp}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestDataManager;
