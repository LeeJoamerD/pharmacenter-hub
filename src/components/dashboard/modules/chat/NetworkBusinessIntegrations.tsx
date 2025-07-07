import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Link,
  ShoppingCart,
  Package,
  AlertTriangle,
  Bell,
  FileText,
  Users,
  Activity,
  Database,
  Settings,
  Search,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  Download,
  Upload,
  Zap,
  Calendar,
  Stethoscope,
  Pill,
  Heart,
  Shield,
  Target,
  Truck,
  Building,
  Phone,
  Mail,
  Globe,
  Server,
  Key,
  Lock,
  Save,
  Filter,
  BarChart3,
  TrendingUp
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  code: string;
  type: string;
  price: number;
  stock: number;
  interactions: string[];
  prescriptionRequired: boolean;
  status: 'available' | 'low_stock' | 'out_of_stock';
}

interface Order {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  date: string;
  pharmacy: string;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  lastVisit: string;
  prescriptions: number;
  allergies: string[];
  chronicConditions: string[];
  pharmacy: string;
}

interface StockAlert {
  id: string;
  product: string;
  currentStock: number;
  minThreshold: number;
  type: 'low_stock' | 'expiry' | 'rupture';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  pharmacy: string;
  created_at: string;
}

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  description: string;
  features: string[];
}

const NetworkBusinessIntegrations = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  useEffect(() => {
    loadIntegrationData();
  }, []);

  const loadIntegrationData = () => {
    // Simulation des données produits
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Doliprane 1000mg',
        code: 'DOL1000',
        type: 'Antalgique',
        price: 3.50,
        stock: 45,
        interactions: ['Warfarine', 'Alcohol'],
        prescriptionRequired: false,
        status: 'available'
      },
      {
        id: '2',
        name: 'Amoxicilline 500mg',
        code: 'AMX500',
        type: 'Antibiotique',
        price: 8.20,
        stock: 12,
        interactions: ['Methotrexate', 'Warfarine'],
        prescriptionRequired: true,
        status: 'low_stock'
      },
      {
        id: '3',
        name: 'Aspirine 100mg',
        code: 'ASP100',
        type: 'Antiagrégant',
        price: 2.80,
        stock: 0,
        interactions: ['Warfarine', 'Héparine', 'Clopidogrel'],
        prescriptionRequired: false,
        status: 'out_of_stock'
      }
    ];

    // Simulation des commandes
    const mockOrders: Order[] = [
      {
        id: 'CMD001',
        customer: 'Marie Dupont',
        items: 3,
        total: 45.60,
        status: 'pending',
        date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        pharmacy: 'Pharmacie Central'
      },
      {
        id: 'CMD002',
        customer: 'Jean Martin',
        items: 1,
        total: 15.80,
        status: 'processing',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        pharmacy: 'Pharmacie de la Gare'
      },
      {
        id: 'CMD003',
        customer: 'Sophie Bernard',
        items: 5,
        total: 78.40,
        status: 'completed',
        date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        pharmacy: 'Pharmacie du Centre'
      }
    ];

    // Simulation des patients
    const mockPatients: Patient[] = [
      {
        id: 'PAT001',
        name: 'Alice Durand',
        age: 65,
        lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        prescriptions: 3,
        allergies: ['Pénicilline', 'Iode'],
        chronicConditions: ['Hypertension', 'Diabète Type 2'],
        pharmacy: 'Pharmacie Central'
      },
      {
        id: 'PAT002',
        name: 'Robert Moreau',
        age: 42,
        lastVisit: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        prescriptions: 1,
        allergies: ['Aspirine'],
        chronicConditions: ['Asthme'],
        pharmacy: 'Pharmacie de la Gare'
      }
    ];

    // Simulation des alertes stock
    const mockStockAlerts: StockAlert[] = [
      {
        id: 'ALERT001',
        product: 'Amoxicilline 500mg',
        currentStock: 12,
        minThreshold: 20,
        type: 'low_stock',
        priority: 'medium',
        pharmacy: 'Pharmacie Central',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ALERT002',
        product: 'Aspirine 100mg',
        currentStock: 0,
        minThreshold: 15,
        type: 'rupture',
        priority: 'urgent',
        pharmacy: 'Pharmacie Central',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 'ALERT003',
        product: 'Insulin Rapide',
        currentStock: 8,
        minThreshold: 10,
        type: 'expiry',
        priority: 'high',
        pharmacy: 'Pharmacie de la Gare',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Simulation des intégrations
    const mockIntegrations: Integration[] = [
      {
        id: '1',
        name: 'ERP PharmaSoft',
        type: 'ERP',
        status: 'connected',
        lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        description: 'Système de gestion intégré pour pharmacies',
        features: ['Stock', 'Commandes', 'Facturation', 'Comptabilité']
      },
      {
        id: '2',
        name: 'DMP - Dossier Médical Partagé',
        type: 'Medical',
        status: 'connected',
        lastSync: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        description: 'Accès sécurisé aux dossiers médicaux patients',
        features: ['Historique médical', 'Allergies', 'Traitements', 'Ordonnances']
      },
      {
        id: '3',
        name: 'Base Claude Bernard',
        type: 'Drug Database',
        status: 'connected',
        lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        description: 'Base de données médicamenteuse de référence',
        features: ['Interactions', 'Posologies', 'Contre-indications', 'Effets indésirables']
      },
      {
        id: '4',
        name: 'Réseau de Grossistes',
        type: 'Supply Chain',
        status: 'error',
        lastSync: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        description: 'Connexion aux principaux grossistes pharmaceutiques',
        features: ['Commandes automatiques', 'Prix en temps réel', 'Disponibilité', 'Livraisons']
      }
    ];

    setProducts(mockProducts);
    setOrders(mockOrders);
    setPatients(mockPatients);
    setStockAlerts(mockStockAlerts);
    setIntegrations(mockIntegrations);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      case 'available': return 'bg-green-500';
      case 'low_stock': return 'bg-yellow-500';
      case 'out_of_stock': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'urgent': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Link className="h-8 w-8 text-primary" />
            Intégrations Métiers Réseau
          </h1>
          <p className="text-muted-foreground">
            Connectivité et synchronisation avec les systèmes métiers pharmaceutiques
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Intégration
        </Button>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="products">Fiches Produits</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="patients">Dossiers Patients</TabsTrigger>
          <TabsTrigger value="alerts">Alertes Stock</TabsTrigger>
          <TabsTrigger value="prescriptions">Ordonnances</TabsTrigger>
          <TabsTrigger value="integrations">Intégrations</TabsTrigger>
        </TabsList>

        {/* Fiches Produits */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Catalogue Produits Intégré
                </CardTitle>
                <CardDescription>
                  Accès direct aux informations médicaments depuis le chat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Search className="h-4 w-4" />
                    <Input 
                      placeholder="Rechercher un médicament..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((product) => (
                      <div key={product.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Pill className="h-5 w-5 text-primary" />
                            <div>
                              <h4 className="font-medium">{product.name}</h4>
                              <p className="text-sm text-muted-foreground">{product.code} • {product.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(product.status)}`}></div>
                            <Badge variant="outline">{product.price}€</Badge>
                          </div>
                        </div>

                        <div className="grid gap-2 md:grid-cols-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Stock: </span>
                            <span className="font-medium">{product.stock}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Prescription: </span>
                            <span className="font-medium">{product.prescriptionRequired ? 'Oui' : 'Non'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Interactions: </span>
                            <span className="font-medium">{product.interactions.length}</span>
                          </div>
                        </div>

                        {product.interactions.length > 0 && (
                          <div className="mt-2">
                            <Label className="text-sm">Interactions:</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {product.interactions.map((interaction, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {interaction}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Vérification Interactions
                </CardTitle>
                <CardDescription>
                  Contrôle automatique des interactions médicamenteuses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-2 border-dashed rounded-lg text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Sélectionnez des médicaments pour vérifier les interactions
                  </p>
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Analyser Prescription
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Alertes Actives</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 bg-red-50 border border-red-200 rounded">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <div className="text-sm">
                        <span className="font-medium">Interaction majeure</span>
                        <p className="text-muted-foreground">Warfarine + Aspirine</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <div className="text-sm">
                        <span className="font-medium">Attention dosage</span>
                        <p className="text-muted-foreground">Patient âgé &gt; 75 ans</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Commandes */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Suivi des Commandes Clients
              </CardTitle>
              <CardDescription>
                Consultation et gestion des commandes depuis le chat réseau
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-medium">#{order.id}</h4>
                          <p className="text-sm text-muted-foreground">{order.customer} • {order.pharmacy}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`}></div>
                        <Badge variant="outline">{order.total}€</Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Détails
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Articles: </span>
                        <span className="font-medium">{order.items}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Statut: </span>
                        <span className="font-medium capitalize">{order.status}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date: </span>
                        <span className="font-medium">
                          {new Date(order.date).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Suivre
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Facture
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dossiers Patients */}
        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Dossiers Patients Sécurisés
              </CardTitle>
              <CardDescription>
                Accès contrôlé aux historiques et informations patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patients.map((patient) => (
                  <div key={patient.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Stethoscope className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{patient.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {patient.age} ans • {patient.pharmacy}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Dossier
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Historique
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Dernière visite: </span>
                        <span className="font-medium">
                          {new Date(patient.lastVisit).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Prescriptions actives: </span>
                        <span className="font-medium">{patient.prescriptions}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Allergies: </span>
                        <span className="font-medium">{patient.allergies.length}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm">Allergies connues:</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {patient.allergies.map((allergy, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">Conditions chroniques:</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {patient.chronicConditions.map((condition, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertes Stock */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertes Stock Automatiques
              </CardTitle>
              <CardDescription>
                Notifications automatiques des ruptures et péremptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`h-5 w-5 ${getPriorityColor(alert.priority)}`} />
                        <div>
                          <h4 className="font-medium">{alert.product}</h4>
                          <p className="text-sm text-muted-foreground">{alert.pharmacy}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.priority === 'urgent' ? 'destructive' : 'secondary'}>
                          {alert.priority}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Zap className="h-4 w-4 mr-2" />
                          Traiter
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Stock actuel: </span>
                        <span className="font-medium">{alert.currentStock}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Seuil minimum: </span>
                        <span className="font-medium">{alert.minThreshold}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type: </span>
                        <span className="font-medium capitalize">{alert.type.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Créée: </span>
                        <span className="font-medium">
                          {new Date(alert.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-muted rounded">
                      <div className="flex items-center gap-2 text-sm">
                        <RefreshCw className="h-4 w-4" />
                        <span>Action suggérée: </span>
                        <span className="font-medium">
                          {alert.type === 'rupture' ? 'Commande urgente' : 
                           alert.type === 'expiry' ? 'Écoulement prioritaire' : 
                           'Réapprovisionnement'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ordonnances */}
        <TabsContent value="prescriptions" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Gestion des Ordonnances
                </CardTitle>
                <CardDescription>
                  Consultation et traitement des ordonnances depuis le chat
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-2 border-dashed rounded-lg text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Glissez une ordonnance ici ou cliquez pour sélectionner
                  </p>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Charger Ordonnance
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Ordonnances Récentes</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <span className="font-medium">Dr. Dubois</span>
                          <p className="text-sm text-muted-foreground">Marie Dupont • 07/07/2025</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <span className="font-medium">Dr. Mercier</span>
                          <p className="text-sm text-muted-foreground">Jean Martin • 06/07/2025</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Rappels Automatisés
                </CardTitle>
                <CardDescription>
                  Système de rappels programmables pour patients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Rappels de renouvellement</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Rappels de vaccination</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Rappels de contrôle</Label>
                    <Switch />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Délai avant expiration (jours)</Label>
                  <Input type="number" defaultValue="7" className="mt-2" />
                </div>

                <div>
                  <Label>Fréquence des rappels</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder Configuration
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Intégrations */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                État des Intégrations Système
              </CardTitle>
              <CardDescription>
                Monitoring et configuration des connexions métiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(integration.status)}`}></div>
                        <div>
                          <h4 className="font-medium">{integration.name}</h4>
                          <p className="text-sm text-muted-foreground">{integration.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                          {integration.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Configurer
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Type: </span>
                        <span className="font-medium">{integration.type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dernière sync: </span>
                        <span className="font-medium">
                          {new Date(integration.lastSync).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fonctionnalités: </span>
                        <span className="font-medium">{integration.features.length}</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Fonctionnalités actives:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {integration.features.map((feature, index) => (
                          <Badge key={index} variant="outline">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {integration.status === 'error' && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span>Erreur de connexion - Vérifier la configuration</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkBusinessIntegrations;