import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart,
  Download, Filter, Calendar, Eye, BarChart3, PieChart as PieChartIcon,
  LineChart as LineChartIcon, FileText
} from 'lucide-react';

const AnalyticsModule = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedView, setSelectedView] = useState('overview');

  // Mock data pour les graphiques
  const salesData = [
    { month: 'Jan', ventes: 45000, couts: 25000, profit: 20000 },
    { month: 'Fév', ventes: 52000, couts: 28000, profit: 24000 },
    { month: 'Mar', ventes: 48000, couts: 26000, profit: 22000 },
    { month: 'Avr', ventes: 61000, couts: 32000, profit: 29000 },
    { month: 'Mai', ventes: 55000, couts: 30000, profit: 25000 },
    { month: 'Jun', ventes: 67000, couts: 35000, profit: 32000 },
  ];

  const productData = [
    { name: 'Médicaments', value: 45, count: 1250 },
    { name: 'Cosmétiques', value: 25, count: 690 },
    { name: 'Parapharmacie', value: 20, count: 550 },
    { name: 'Homéopathie', value: 10, count: 275 },
  ];

  const stockData = [
    { category: 'Antibiotiques', stock: 85, alerte: 90 },
    { category: 'Antalgiques', stock: 92, alerte: 80 },
    { category: 'Vitamines', stock: 78, alerte: 85 },
    { category: 'Cosmétiques', stock: 95, alerte: 70 },
    { category: 'Homéopathie', stock: 88, alerte: 90 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const kpiCards = [
    {
      title: 'Chiffre d\'Affaires',
      value: '€127,450',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      description: 'vs mois précédent'
    },
    {
      title: 'Nombre de Ventes',
      value: '2,847',
      change: '+8.2%',
      trend: 'up',
      icon: ShoppingCart,
      description: 'transactions ce mois'
    },
    {
      title: 'Produits en Stock',
      value: '12,459',
      change: '-3.1%',
      trend: 'down',
      icon: Package,
      description: 'unités disponibles'
    },
    {
      title: 'Clients Actifs',
      value: '1,892',
      change: '+15.3%',
      trend: 'up',
      icon: Users,
      description: 'clients ce mois'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analyses et Reporting</h2>
          <p className="text-muted-foreground">
            Tableaux de bord et analyses détaillées de votre activité
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Badge 
                  variant={kpi.trend === 'up' ? 'default' : 'destructive'}
                  className="mr-1"
                >
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {kpi.change}
                </Badge>
                {kpi.description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="inventory">Inventaire</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Graphique des ventes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Évolution des Ventes
                </CardTitle>
                <CardDescription>Ventes, coûts et profits sur 6 mois</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ventes" fill="#8884d8" name="Ventes" />
                    <Bar dataKey="couts" fill="#82ca9d" name="Coûts" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Répartition par catégorie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="mr-2 h-4 w-4" />
                  Répartition des Ventes
                </CardTitle>
                <CardDescription>Ventes par catégorie de produits</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {productData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Alertes et indicateurs */}
          <Card>
            <CardHeader>
              <CardTitle>Indicateurs Clés</CardTitle>
              <CardDescription>Suivi des métriques importantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Taux de rotation stock</span>
                    <span className="text-sm">8.2x/an</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Marge brute moyenne</span>
                    <span className="text-sm">42.5%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '42.5%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Satisfaction client</span>
                    <span className="text-sm">94%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analyses des ventes */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChartIcon className="mr-2 h-4 w-4" />
                  Tendance des Profits
                </CardTitle>
                <CardDescription>Évolution des profits sur 6 mois</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                      name="Profit"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top produits */}
            <Card>
              <CardHeader>
                <CardTitle>Top Produits</CardTitle>
                <CardDescription>Produits les plus vendus ce mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Paracétamol 1000mg', sales: 245, revenue: '€1,225' },
                    { name: 'Vitamine C', sales: 189, revenue: '€945' },
                    { name: 'Crème hydratante', sales: 156, revenue: '€780' },
                    { name: 'Sirop pour la toux', sales: 134, revenue: '€670' },
                  ].map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.sales} unités vendues</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{product.revenue}</div>
                        <div className="text-sm text-muted-foreground">Revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analyse inventaire */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Niveaux de Stock par Catégorie</CardTitle>
              <CardDescription>Comparaison stock actuel vs seuil d'alerte</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stockData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="stock" fill="#8884d8" name="Stock actuel %" />
                  <Bar dataKey="alerte" fill="#ff8042" name="Seuil d'alerte %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Alertes stock */}
          <Card>
            <CardHeader>
              <CardTitle>Alertes de Stock</CardTitle>
              <CardDescription>Produits nécessitant une attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Aspirine 500mg', level: 15, status: 'critique' },
                  { name: 'Antibiotique XYZ', level: 25, status: 'bas' },
                  { name: 'Vitamine D', level: 35, status: 'moyen' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.level} unités restantes</div>
                    </div>
                    <Badge 
                      variant={
                        item.status === 'critique' ? 'destructive' : 
                        item.status === 'bas' ? 'default' : 'secondary'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rapports */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: 'Rapport Mensuel Ventes', desc: 'Analyse complète des ventes du mois', icon: FileText },
              { name: 'Bilan Inventaire', desc: 'État détaillé des stocks et mouvements', icon: Package },
              { name: 'Analyse Clientèle', desc: 'Segmentation et comportement clients', icon: Users },
              { name: 'Performance Financière', desc: 'Indicateurs financiers et rentabilité', icon: DollarSign },
            ].map((report, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <report.icon className="mr-2 h-5 w-5" />
                    {report.name}
                  </CardTitle>
                  <CardDescription>{report.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Dernière mise à jour: Aujourd'hui</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsModule;