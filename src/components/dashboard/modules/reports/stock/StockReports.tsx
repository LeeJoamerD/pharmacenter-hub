import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  Calendar, 
  Truck,
  BarChart3,
  Clock,
  DollarSign,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useStockMetrics } from '@/hooks/useStockMetrics';
import { useToast } from '@/hooks/use-toast';

const StockReports = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const stockMetrics = useStockMetrics();

  // Données simulées pour les analyses de stock
  const stockLevelsData = [
    { categorie: 'Médicaments Génériques', stock_actuel: 1250, stock_minimum: 800, stock_maximum: 2000, valorisation: 8500000 },
    { categorie: 'Médicaments Spécialisés', stock_actuel: 450, stock_minimum: 300, stock_maximum: 800, valorisation: 12000000 },
    { categorie: 'Parapharmacie', stock_actuel: 780, stock_minimum: 500, stock_maximum: 1200, valorisation: 3200000 },
    { categorie: 'Matériel Médical', stock_actuel: 320, stock_minimum: 200, stock_maximum: 500, valorisation: 2800000 },
    { categorie: 'Produits Cosmétiques', stock_actuel: 890, stock_minimum: 600, stock_maximum: 1500, valorisation: 1900000 }
  ];

  const criticalStockData = [
    { produit: 'Doliprane 1000mg', stock_actuel: 12, stock_minimum: 50, statut: 'critique', expiration: '15/03/2024' },
    { produit: 'Amoxicilline 500mg', stock_actuel: 8, stock_minimum: 30, statut: 'critique', expiration: '22/04/2024' },
    { produit: 'Spasfon Lyoc', stock_actuel: 25, stock_minimum: 40, statut: 'attention', expiration: '10/05/2024' },
    { produit: 'Efferalgan 500mg', stock_actuel: 35, stock_minimum: 60, statut: 'attention', expiration: '28/03/2024' },
    { produit: 'Dafalgan Codéine', stock_actuel: 5, stock_minimum: 25, statut: 'critique', expiration: '05/04/2024' }
  ];

  const expiryAlertsData = [
    { produit: 'Aspirine 100mg', lot: 'LOT2024-001', quantite: 48, expiration: '15/02/2024', jours_restants: 8, urgence: 'urgent' },
    { produit: 'Ventoline Spray', lot: 'LOT2024-015', quantite: 12, expiration: '20/02/2024', jours_restants: 13, urgence: 'urgent' },
    { produit: 'Smecta Sachet', lot: 'LOT2024-023', quantite: 156, expiration: '28/02/2024', jours_restants: 21, urgence: 'attention' },
    { produit: 'Paracétamol 500mg', lot: 'LOT2024-034', quantite: 240, expiration: '10/03/2024', jours_restants: 32, urgence: 'attention' },
    { produit: 'Ibuprofène 200mg', lot: 'LOT2024-041', quantite: 72, expiration: '15/03/2024', jours_restants: 37, urgence: 'normal' }
  ];

  const movementHistoryData = [
    { date: '01/02', entrees: 2400, sorties: 1850, solde: 550, valorisation: 8500000 },
    { date: '02/02', entrees: 1200, sorties: 2100, solde: -900, valorisation: 8200000 },
    { date: '03/02', entrees: 3200, sorties: 1750, solde: 1450, valorisation: 8800000 },
    { date: '04/02', entrees: 800, sorties: 2200, solde: -1400, valorisation: 8300000 },
    { date: '05/02', entrees: 2800, sorties: 1650, solde: 1150, valorisation: 8650000 },
    { date: '06/02', entrees: 1500, sorties: 1950, solde: -450, valorisation: 8450000 },
    { date: '07/02', entrees: 2200, sorties: 1800, solde: 400, valorisation: 8550000 }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Données actualisées",
        description: "Les analyses de stock ont été mises à jour",
      });
    }, 2000);
  };

  const handleExport = (format: string) => {
    toast({
      title: `Export ${format}`,
      description: "Le rapport de stock est en cours de génération...",
    });
  };

  const getStockStatus = (actuel: number, minimum: number, maximum: number) => {
    if (actuel < minimum) return { status: 'critique', color: 'text-red-600', bg: 'bg-red-50' };
    if (actuel < minimum * 1.2) return { status: 'attention', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (actuel > maximum) return { status: 'surstock', color: 'text-blue-600', bg: 'bg-blue-50' };
    return { status: 'normal', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const getUrgencyColor = (urgence: string) => {
    switch (urgence) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'attention': return 'text-orange-600 bg-orange-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analyses de Stock</h2>
          <p className="text-muted-foreground">
            Suivi des niveaux de stock, alertes et mouvements
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="medicines">Médicaments</SelectItem>
              <SelectItem value="parapharmacy">Parapharmacie</SelectItem>
              <SelectItem value="medical">Matériel médical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button onClick={() => handleExport('PDF')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPIs de stock */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Stock Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28.4M <span className="text-sm font-normal text-muted-foreground">FCFA</span></div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-red-500 inline mr-1" />
              -2.3% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits en Stock</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 690</div>
            <p className="text-xs text-muted-foreground">
              Dans 847 références actives
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              15 ruptures + 8 péremptions
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Rotation</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2</div>
            <p className="text-xs text-muted-foreground">
              Rotations par an (moyenne)
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="levels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="levels">Niveaux Stock</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="expiry">Péremptions</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
        </TabsList>

        <TabsContent value="levels" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Niveaux de Stock par Catégorie
              </CardTitle>
              <CardDescription>
                Situation actuelle vs seuils minimum et maximum
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stockLevelsData.map((item, index) => {
                  const status = getStockStatus(item.stock_actuel, item.stock_minimum, item.stock_maximum);
                  const percentage = (item.stock_actuel / item.stock_maximum) * 100;
                  
                  return (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.categorie}</p>
                          <p className="text-sm text-muted-foreground">
                            Valorisation: {item.valorisation.toLocaleString()} FCFA
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{item.stock_actuel} unités</p>
                          <Badge className={`${status.color} ${status.bg} border-0`}>
                            {status.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Min: {item.stock_minimum}</span>
                          <span>Max: {item.stock_maximum}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertes Stock Critique
              </CardTitle>
              <CardDescription>
                Produits nécessitant un réapprovisionnement urgent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {criticalStockData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50">
                        {item.statut === 'critique' ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{item.produit}</p>
                        <p className="text-sm text-muted-foreground">
                          Stock: {item.stock_actuel} / Min: {item.stock_minimum}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={item.statut === 'critique' ? 'destructive' : 'secondary'}
                      >
                        {item.statut === 'critique' ? 'Critique' : 'Attention'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Exp: {item.expiration}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiry" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Alertes de Péremption
              </CardTitle>
              <CardDescription>
                Produits arrivant à expiration dans les prochains jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expiryAlertsData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getUrgencyColor(item.urgence)}`}>
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{item.produit}</p>
                        <p className="text-sm text-muted-foreground">
                          Lot: {item.lot} • {item.quantite} unités
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{item.jours_restants} jours</p>
                      <p className="text-sm text-muted-foreground">
                        Exp: {item.expiration}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Mouvements de Stock - 7 derniers jours
              </CardTitle>
              <CardDescription>
                Entrées, sorties et évolution de la valorisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={movementHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value} unités`, 
                      name === 'entrees' ? 'Entrées' : name === 'sorties' ? 'Sorties' : 'Solde'
                    ]}
                  />
                  <Bar dataKey="entrees" fill="#10b981" name="entrees" />
                  <Bar dataKey="sorties" fill="#ef4444" name="sorties" />
                  <Bar dataKey="solde" fill="#3b82f6" name="solde" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Évolution de la Valorisation</CardTitle>
              <CardDescription>Valeur totale du stock sur la période</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={movementHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value.toLocaleString()} FCFA`, 'Valorisation']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="valorisation" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockReports;