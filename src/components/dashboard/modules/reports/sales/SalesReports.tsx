import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { DatePicker } from '@/components/ui/calendar';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
// import { useSalesMetrics } from '@/hooks/useSalesMetrics';
import { useToast } from '@/hooks/use-toast';

const SalesReports = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // const salesMetrics = useSalesMetrics();

  // Données simulées pour les graphiques
  const dailySalesData = [
    { date: '01/02', ventes: 2850000, objectif: 3000000, transactions: 145 },
    { date: '02/02', ventes: 3200000, objectif: 3000000, transactions: 167 },
    { date: '03/02', ventes: 2950000, objectif: 3000000, transactions: 152 },
    { date: '04/02', ventes: 3450000, objectif: 3000000, transactions: 189 },
    { date: '05/02', ventes: 3100000, objectif: 3000000, transactions: 161 },
    { date: '06/02', ventes: 3380000, objectif: 3000000, transactions: 175 },
    { date: '07/02', ventes: 3650000, objectif: 3000000, transactions: 198 }
  ];

  const topProductsData = [
    { produit: 'Doliprane 1000mg', ventes: 850000, quantite: 342, marge: 25.5 },
    { produit: 'Efferalgan 500mg', ventes: 720000, quantite: 288, marge: 22.3 },
    { produit: 'Spasfon Lyoc', ventes: 680000, quantite: 156, marge: 35.8 },
    { produit: 'Smecta Sachet', ventes: 540000, quantite: 234, marge: 28.2 },
    { produit: 'Dafalgan 500mg', ventes: 460000, quantite: 198, marge: 24.1 }
  ];

  const categoryData = [
    { name: 'Médicaments', value: 12500000, color: '#0088FE', percentage: 65.8 },
    { name: 'Parapharmacie', value: 4200000, color: '#00C49F', percentage: 22.1 },
    { name: 'Matériel Médical', value: 1800000, color: '#FFBB28', percentage: 9.5 },
    { name: 'Autres', value: 500000, color: '#FF8042', percentage: 2.6 }
  ];

  const staffPerformanceData = [
    { nom: 'Marie KOUADIO', ventes: 2850000, transactions: 145, moyenne: 19655, performance: 112 },
    { nom: 'Jean OUATTARA', ventes: 2640000, transactions: 132, moyenne: 20000, performance: 105 },
    { nom: 'Fatou TRAORE', ventes: 2420000, transactions: 128, moyenne: 18906, performance: 98 },
    { nom: 'Paul KONE', ventes: 2180000, transactions: 118, moyenne: 18475, performance: 87 }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Données actualisées",
        description: "Les rapports de ventes ont été mis à jour",
      });
    }, 2000);
  };

  const handleExport = (format: string) => {
    toast({
      title: `Export ${format}`,
      description: "Le rapport est en cours de génération...",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rapports de Ventes</h2>
          <p className="text-muted-foreground">
            Analyses détaillées des performances commerciales
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
              <SelectItem value="day">Aujourd'hui</SelectItem>
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

      {/* KPIs de ventes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Aujourd'hui</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 650 000 <span className="text-sm font-normal text-muted-foreground">FCFA</span></div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 inline mr-1" />
              +21.7% vs hier
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">198</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 inline mr-1" />
              +13.2% vs hier
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18 434 <span className="text-sm font-normal text-muted-foreground">FCFA</span></div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 inline mr-1" />
              +7.5% vs hier
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Uniques</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 inline mr-1" />
              +9.8% vs hier
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="evolution" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="evolution">Évolution</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="staff">Équipe</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>

        <TabsContent value="evolution" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Évolution des Ventes - 7 derniers jours
              </CardTitle>
              <CardDescription>
                Comparaison ventes réalisées vs objectifs fixés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value.toLocaleString()} FCFA`, 
                      name === 'ventes' ? 'Ventes' : 'Objectif'
                    ]}
                  />
                  <Bar dataKey="ventes" fill="#10b981" name="ventes" />
                  <Bar dataKey="objectif" fill="#f59e0b" name="objectif" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Évolution du Nombre de Transactions</CardTitle>
              <CardDescription>Volume des transactions sur la période</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} transactions`, 'Transactions']} />
                  <Line 
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top 5 Produits - Performances
              </CardTitle>
              <CardDescription>
                Classement des produits par chiffre d'affaires généré
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProductsData.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-bold text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.produit}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantite} unités vendues
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{product.ventes.toLocaleString()} FCFA</p>
                      <p className="text-sm text-green-600">Marge: {product.marge}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Performance de l'Équipe
              </CardTitle>
              <CardDescription>
                Résultats individuels des agents de vente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffPerformanceData.map((staff, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {staff.nom.split(' ')[0][0]}{staff.nom.split(' ')[1][0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{staff.nom}</p>
                        <p className="text-sm text-muted-foreground">
                          {staff.transactions} transactions • Moy: {staff.moyenne.toLocaleString()} FCFA
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="font-bold">{staff.ventes.toLocaleString()} FCFA</p>
                        <Badge 
                          variant={staff.performance >= 100 ? "default" : staff.performance >= 90 ? "secondary" : "destructive"}
                        >
                          {staff.performance}% objectif
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Répartition par Catégorie
                </CardTitle>
                <CardDescription>
                  Distribution du chiffre d'affaires par segment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value.toLocaleString()} FCFA`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Détail par Catégorie</CardTitle>
                <CardDescription>
                  Chiffres détaillés et pourcentages de répartition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{category.value.toLocaleString()} FCFA</p>
                        <p className="text-sm text-muted-foreground">{category.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesReports;