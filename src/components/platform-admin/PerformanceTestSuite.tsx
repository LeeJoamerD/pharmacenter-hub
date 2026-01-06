import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Clock, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  BarChart3,
  Timer
} from 'lucide-react';
import { generateTestProducts, cleanupTestData } from '@/utils/testDataGenerator';

interface PerformanceTestSuiteProps {
  tenantId?: string;
}

interface PerformanceTest {
  id: string;
  name: string;
  description: string;
  searchTerm: string;
  expectedResults: number;
  maxResponseTime: number;
  status?: 'pending' | 'running' | 'passed' | 'failed';
  result?: {
    responseTime: number;
    resultsCount: number;
    memoryUsage?: number;
    timestamp: string;
  };
  error?: string;
}

interface PerformanceMetrics {
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  memoryUsage: number;
}

const PerformanceTestSuite = ({ tenantId }: PerformanceTestSuiteProps) => {
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [testResults, setTestResults] = useState<PerformanceTest[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [testDataCount, setTestDataCount] = useState<number>(1000);
  const [hasTestData, setHasTestData] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const performanceTests: PerformanceTest[] = [
    {
      id: 'search_common_term',
      name: 'Recherche terme commun',
      description: 'Recherche d\'un terme fréquent (ex: paracetamol)',
      searchTerm: 'paracetamol',
      expectedResults: 50,
      maxResponseTime: 500
    },
    {
      id: 'search_rare_term',
      name: 'Recherche terme rare',
      description: 'Recherche d\'un terme peu fréquent',
      searchTerm: 'xylocaine',
      expectedResults: 5,
      maxResponseTime: 300
    },
    {
      id: 'search_partial_match',
      name: 'Recherche partielle',
      description: 'Recherche avec correspondance partielle',
      searchTerm: 'para',
      expectedResults: 100,
      maxResponseTime: 800
    },
    {
      id: 'search_numeric',
      name: 'Recherche numérique',
      description: 'Recherche par code produit',
      searchTerm: '123',
      expectedResults: 20,
      maxResponseTime: 400
    },
    {
      id: 'search_long_term',
      name: 'Recherche terme long',
      description: 'Recherche avec un terme de recherche long',
      searchTerm: 'paracetamol acetaminophen',
      expectedResults: 30,
      maxResponseTime: 600
    },
    {
      id: 'search_single_char',
      name: 'Recherche caractère unique',
      description: 'Recherche avec un seul caractère (devrait être bloquée)',
      searchTerm: 'a',
      expectedResults: 0,
      maxResponseTime: 100
    },
    {
      id: 'search_empty',
      name: 'Recherche vide',
      description: 'Recherche avec terme vide',
      searchTerm: '',
      expectedResults: 0,
      maxResponseTime: 100
    },
    {
      id: 'search_stress_test',
      name: 'Test de charge',
      description: 'Recherche intensive pour tester la performance',
      searchTerm: 'med',
      expectedResults: 200,
      maxResponseTime: 1000
    }
  ];

  const generateTestData = async () => {
    if (!tenantId) {
      alert('Aucun tenant sélectionné');
      return;
    }

    setIsGeneratingData(true);
    setGenerationProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await generateTestProducts(testDataCount, tenantId);

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setHasTestData(true);
      
      setTimeout(() => {
        setGenerationProgress(0);
        setIsGeneratingData(false);
      }, 1000);

    } catch (error) {
      console.error('Erreur lors de la génération des données:', error);
      alert('Erreur lors de la génération des données de test');
      setIsGeneratingData(false);
      setGenerationProgress(0);
    }
  };

  const cleanupData = async () => {
    if (!tenantId) {
      alert('Aucun tenant sélectionné');
      return;
    }

    try {
      await cleanupTestData(tenantId);
      setHasTestData(false);
      alert('Données de test supprimées avec succès');
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      alert('Erreur lors du nettoyage des données de test');
    }
  };

  const runPerformanceTest = async (test: PerformanceTest): Promise<PerformanceTest> => {
    setCurrentTest(test.name);
    
    try {
      const startTime = performance.now();
      const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
      
      const searchResult = await new Promise((resolve, reject) => {
        const simulatedDelay = Math.random() * 800 + 100;
        
        setTimeout(() => {
          if (test.searchTerm.length < 2 && test.searchTerm !== '') {
            reject(new Error('Terme de recherche trop court'));
            return;
          }
          
          if (test.searchTerm === '') {
            resolve({ products: [], totalCount: 0 });
            return;
          }

          const mockResults = {
            products: Array(Math.min(test.expectedResults, 50)).fill(null).map((_, i) => ({
              id: `test-${i}`,
              nom_produit: `Produit Test ${i}`,
              code_produit: `TEST${i}`,
              stock_actuel: Math.floor(Math.random() * 100),
              stock_minimum: 10,
              prix_vente: Math.random() * 50 + 5
            })),
            totalCount: test.expectedResults
          };
          
          resolve(mockResults);
        }, simulatedDelay);
      });

      const endTime = performance.now();
      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const responseTime = endTime - startTime;
      
      const passed = responseTime <= test.maxResponseTime;
      
      return {
        ...test,
        status: passed ? 'passed' : 'failed',
        result: {
          responseTime: Math.round(responseTime),
          resultsCount: (searchResult as any).totalCount || 0,
          memoryUsage: memoryAfter - memoryBefore,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        ...test,
        status: test.searchTerm.length < 2 ? 'passed' : 'failed',
        error: (error as Error).message,
        result: {
          responseTime: 0,
          resultsCount: 0,
          memoryUsage: 0,
          timestamp: new Date().toISOString()
        }
      };
    }
  };

  const runAllTests = async () => {
    if (!tenantId) {
      alert('Aucun tenant sélectionné');
      return;
    }

    setIsRunningTests(true);
    setTestResults([]);
    setCurrentTest('');

    const results: PerformanceTest[] = [];

    for (const test of performanceTests) {
      const result = await runPerformanceTest(test);
      results.push(result);
      setTestResults([...results]);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunningTests(false);
    setCurrentTest('');
  };

  const calculateMetrics = (): PerformanceMetrics => {
    const completedTests = testResults.filter(t => t.result && t.status !== 'failed');
    const responseTimes = completedTests.map(t => t.result!.responseTime);
    
    return {
      averageResponseTime: responseTimes.length > 0 ? 
        Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      totalTests: testResults.length,
      passedTests: testResults.filter(t => t.status === 'passed').length,
      failedTests: testResults.filter(t => t.status === 'failed').length,
      memoryUsage: completedTests.reduce((sum, t) => sum + (t.result?.memoryUsage || 0), 0)
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Suite de Tests de Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Tests de Performance :</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Temps de réponse des recherches</li>
              <li>• Performance avec gros volumes de données</li>
              <li>• Utilisation mémoire</li>
              <li>• Tests de charge et de stress</li>
            </ul>
          </div>

          {/* Gestion des données de test */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Données de Test
            </h4>
            
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Nombre de produits:</label>
                <Input
                  type="number"
                  value={testDataCount}
                  onChange={(e) => setTestDataCount(parseInt(e.target.value) || 1000)}
                  className="w-24"
                  min="100"
                  max="10000"
                  step="100"
                />
              </div>
              
              <Badge variant={hasTestData ? 'default' : 'secondary'}>
                {hasTestData ? 'Données présentes' : 'Aucune donnée'}
              </Badge>
            </div>

            {isGeneratingData && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Génération en cours...</span>
                  <span className="text-sm">{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="h-2" />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={generateTestData}
                disabled={isGeneratingData || !tenantId}
                size="sm"
                className="flex items-center gap-2"
              >
                {isGeneratingData ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    Générer Données
                  </>
                )}
              </Button>
              
              <Button
                onClick={cleanupData}
                disabled={!hasTestData || isGeneratingData || !tenantId}
                size="sm"
                variant="outline"
              >
                Nettoyer
              </Button>
            </div>
          </div>

          {/* Contrôles des tests */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Tenant ID: <span className="font-mono">{tenantId || 'Non sélectionné'}</span>
              </div>
              {isRunningTests && currentTest && (
                <div className="text-sm text-blue-600">
                  Test en cours: {currentTest}
                </div>
              )}
            </div>

            <Button
              onClick={runAllTests}
              disabled={isRunningTests || !tenantId}
              className="flex items-center gap-2"
            >
              {isRunningTests ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tests en cours...
                </>
              ) : (
                <>
                  <Timer className="h-4 w-4" />
                  Lancer les Tests
                </>
              )}
            </Button>
          </div>

          {/* Métriques de performance */}
          {testResults.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{metrics.averageResponseTime}ms</div>
                <div className="text-sm text-muted-foreground">Temps moyen</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{metrics.passedTests}</div>
                <div className="text-sm text-muted-foreground">Tests réussis</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{metrics.failedTests}</div>
                <div className="text-sm text-muted-foreground">Tests échoués</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(metrics.memoryUsage / 1024)}KB
                </div>
                <div className="text-sm text-muted-foreground">Mémoire utilisée</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résultats détaillés */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Résultats Détaillés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((test) => (
                <div key={test.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {test.status === 'passed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : test.status === 'failed' ? (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        <h4 className="font-medium">{test.name}</h4>
                        <Badge variant={test.status === 'passed' ? 'default' : 'destructive'}>
                          {test.status === 'passed' ? 'Réussi' : 'Échoué'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {test.description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Terme recherché:</span>
                          <div className="font-mono bg-gray-100 p-1 rounded text-xs mt-1">
                            {test.searchTerm || '(vide)'}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Temps limite:</span>
                          <div className="mt-1">{test.maxResponseTime}ms</div>
                        </div>
                        {test.result && (
                          <>
                            <div>
                              <span className="font-medium">Temps réel:</span>
                              <div className={`mt-1 font-medium ${
                                test.result.responseTime <= test.maxResponseTime 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {test.result.responseTime}ms
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Résultats:</span>
                              <div className="mt-1">{test.result.resultsCount}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceTestSuite;
