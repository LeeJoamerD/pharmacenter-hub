import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Eye, 
  Camera,
  Upload,
  Scan,
  Package,
  BarCode,
  Shield,
  Activity,
  CheckCircle,
  AlertTriangle,
  Zap,
  Brain,
  Target,
  Clock,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';

const ComputerVision = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('product-recognition');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Métriques de vision par ordinateur
  const [visionMetrics] = useState({
    imagesProcessed: 1847,
    accuracy: 94.2,
    processingTime: 0.8,
    detectionsToday: 156
  });

  // Détections récentes
  const [recentDetections] = useState([
    {
      id: 1,
      image: '/api/placeholder/150/100',
      product: 'Doliprane 1000mg',
      confidence: 98.5,
      barcode: '3400934633850',
      price: '€8.50',
      stock: 45,
      status: 'verified',
      timestamp: '2025-01-05 14:30'
    },
    {
      id: 2,
      image: '/api/placeholder/150/100',
      product: 'Vitamine D3 2000UI',
      confidence: 92.1,
      barcode: '3401353427896',
      price: '€12.90',
      stock: 23,
      status: 'verified',
      timestamp: '2025-01-05 14:15'
    },
    {
      id: 3,
      image: '/api/placeholder/150/100',
      product: 'Masque FFP2',
      confidence: 87.3,
      barcode: '3401598542187',
      price: '€2.50',
      stock: 156,
      status: 'pending',
      timestamp: '2025-01-05 13:45'
    }
  ]);

  // Analyse des étagères
  const [shelfAnalysis] = useState([
    {
      shelf: 'Étagère A - OTC',
      products: 24,
      stockouts: 2,
      misplacements: 1,
      compliance: 92,
      lastScan: '2025-01-05 12:00',
      issues: [
        'Doliprane 500mg rupture',
        'Produit mal placé section B'
      ]
    },
    {
      shelf: 'Étagère B - Parapharmacie',
      products: 32,
      stockouts: 0,
      misplacements: 0,
      compliance: 100,
      lastScan: '2025-01-05 11:30',
      issues: []
    },
    {
      shelf: 'Étagère C - Prescription',
      products: 18,
      stockouts: 1,
      misplacements: 2,
      compliance: 85,
      lastScan: '2025-01-05 10:45',
      issues: [
        'Antibiotique mal rangé',
        'Étiquette prix manquante',
        'Stock Amoxicilline faible'
      ]
    }
  ]);

  // Reconnaissance de produits par lot
  const [batchRecognition] = useState([
    {
      batch: 'Lot Morning-001',
      totalItems: 45,
      recognized: 42,
      failed: 3,
      duplicates: 2,
      newProducts: 1,
      processingTime: '2.3s',
      accuracy: 93.3
    },
    {
      batch: 'Lot Evening-002',
      totalItems: 38,
      recognized: 37,
      failed: 1,
      duplicates: 0,
      newProducts: 0,
      processingTime: '1.8s',
      accuracy: 97.4
    }
  ]);

  // Contrôle qualité visuel
  const [qualityControls] = useState([
    {
      type: 'Date d\'expiration',
      checked: 156,
      alerts: 8,
      accuracy: 99.2,
      status: 'active'
    },
    {
      type: 'Intégrité emballage',
      checked: 134,
      alerts: 3,
      accuracy: 95.8,
      status: 'active'
    },
    {
      type: 'Code-barres lisible',
      checked: 189,
      alerts: 2,
      accuracy: 98.9,
      status: 'active'
    },
    {
      type: 'Étiquetage prix',
      checked: 145,
      alerts: 12,
      accuracy: 91.7,
      status: 'warning'
    }
  ]);

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    // Simulation traitement image
    setTimeout(() => {
      setIsProcessing(false);
      // Ici on afficherait les résultats de reconnaissance
    }, 3000);
  };

  const startShelfScan = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 5000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-orange-600 bg-orange-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 95) return 'text-green-600';
    if (compliance >= 85) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vision par Ordinateur</h2>
          <p className="text-muted-foreground">
            IA visuelle pour reconnaissance produits et contrôle qualité
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres Vision
          </Button>
          <Button onClick={handleImageUpload} disabled={isProcessing}>
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {isProcessing ? 'Traitement...' : 'Analyser Image'}
          </Button>
        </div>
      </div>

      {/* Input caché pour upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processImage(file);
        }}
      />

      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images Traitées</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visionMetrics.imagesProcessed}</div>
            <p className="text-xs text-muted-foreground">
              Total analysées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Précision</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visionMetrics.accuracy}%</div>
            <p className="text-xs text-muted-foreground">
              Reconnaissance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visionMetrics.processingTime}s</div>
            <p className="text-xs text-muted-foreground">
              Par image
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Détections Aujourd'hui</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visionMetrics.detectionsToday}</div>
            <p className="text-xs text-muted-foreground">
              Produits identifiés
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="product-recognition" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="product-recognition">Reconnaissance</TabsTrigger>
          <TabsTrigger value="shelf-analysis">Étagères</TabsTrigger>
          <TabsTrigger value="quality-control">Contrôle Qualité</TabsTrigger>
          <TabsTrigger value="batch-processing">Traitement Lot</TabsTrigger>
        </TabsList>

        <TabsContent value="product-recognition" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Reconnaissance de Produits
              </CardTitle>
              <CardDescription>IA pour identification automatique des produits pharmaceutiques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDetections.map((detection) => (
                  <div key={detection.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{detection.product}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            <Barcode className="h-3 w-3 mr-1" />
                            {detection.barcode}
                          </Badge>
                          <Badge className={getStatusColor(detection.status)}>
                            {detection.status === 'verified' ? 'Vérifié' :
                             detection.status === 'pending' ? 'En attente' : 'Échec'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{detection.price}</div>
                      <div className="text-sm text-muted-foreground">Stock: {detection.stock}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={detection.confidence} className="w-16 h-2" />
                        <span className="text-xs">{detection.confidence}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">Assistant Reconnaissance</h4>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Glissez-déposez une image ou cliquez pour télécharger et identifier automatiquement vos produits
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleImageUpload}>
                    <Upload className="h-4 w-4 mr-2" />
                    Télécharger Image
                  </Button>
                  <Button size="sm" variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Webcam
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shelf-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Analyse des Étagères
              </CardTitle>
              <CardDescription>Surveillance automatique du merchandising et des stocks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shelfAnalysis.map((shelf, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{shelf.shelf}</h4>
                        <p className="text-sm text-muted-foreground">
                          {shelf.products} produits • Dernier scan: {shelf.lastScan}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getComplianceColor(shelf.compliance)}`}>
                          {shelf.compliance}%
                        </div>
                        <div className="text-sm text-muted-foreground">Conformité</div>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-3 mb-3">
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="text-lg font-bold text-red-600">{shelf.stockouts}</div>
                        <div className="text-xs text-red-700">Ruptures</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="text-lg font-bold text-orange-600">{shelf.misplacements}</div>
                        <div className="text-xs text-orange-700">Mal placés</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-lg font-bold text-green-600">
                          {shelf.products - shelf.stockouts - shelf.misplacements}
                        </div>
                        <div className="text-xs text-green-700">Conformes</div>
                      </div>
                    </div>
                    
                    {shelf.issues.length > 0 && (
                      <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                        <h5 className="font-medium text-yellow-800 mb-1">Problèmes détectés:</h5>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {shelf.issues.map((issue, issueIndex) => (
                            <li key={issueIndex} className="flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={startShelfScan} disabled={isProcessing}>
                        <Scan className="h-4 w-4 mr-2" />
                        Scanner Maintenant
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Rapport
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality-control" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Contrôle Qualité Visuel
              </CardTitle>
              <CardDescription>Vérification automatique de la conformité des produits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {qualityControls.map((control, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{control.type}</h4>
                      <Badge className={
                        control.status === 'active' ? 'bg-green-50 text-green-600' :
                        control.status === 'warning' ? 'bg-orange-50 text-orange-600' :
                        'bg-red-50 text-red-600'
                      }>
                        {control.status === 'active' ? 'Actif' :
                         control.status === 'warning' ? 'Attention' : 'Erreur'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Éléments vérifiés:</span>
                        <span className="font-medium">{control.checked}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Alertes générées:</span>
                        <span className="font-medium text-red-600">{control.alerts}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Précision:</span>
                        <span className="font-medium">{control.accuracy}%</span>
                      </div>
                    </div>
                    
                    <Progress value={control.accuracy} className="mt-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch-processing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Traitement par Lots
              </CardTitle>
              <CardDescription>Reconnaissance en masse pour inventaires et réceptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {batchRecognition.map((batch, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{batch.batch}</h4>
                        <p className="text-sm text-muted-foreground">
                          Traité en {batch.processingTime} • Précision: {batch.accuracy}%
                        </p>
                      </div>
                      <Badge className="bg-blue-50 text-blue-600">
                        {batch.totalItems} items
                      </Badge>
                    </div>
                    
                    <div className="grid gap-2 md:grid-cols-5 mb-3">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-lg font-bold text-green-600">{batch.recognized}</div>
                        <div className="text-xs text-green-700">Reconnus</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="text-lg font-bold text-red-600">{batch.failed}</div>
                        <div className="text-xs text-red-700">Échecs</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="text-lg font-bold text-orange-600">{batch.duplicates}</div>
                        <div className="text-xs text-orange-700">Doublons</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-lg font-bold text-blue-600">{batch.newProducts}</div>
                        <div className="text-xs text-blue-700">Nouveaux</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="text-lg font-bold text-purple-600">{batch.accuracy}%</div>
                        <div className="text-xs text-purple-700">Précision</div>
                      </div>
                    </div>
                    
                    <Progress value={(batch.recognized / batch.totalItems) * 100} />
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-800">Nouveau Lot</h4>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  Prêt à traiter un nouveau lot d'images pour reconnaissance en masse
                </p>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Démarrer Nouveau Lot
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComputerVision;