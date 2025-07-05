import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  Calculator,
  Banknote,
  CreditCard,
  Receipt,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';

const FinancialReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Données financières simulées
  const financialMetrics = [
    {
      title: 'Chiffre d\'Affaires',
      value: '12 450 000',
      unit: 'FCFA',
      change: '+18.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Marge Brute',
      value: '3 890 000',
      unit: 'FCFA',
      change: '+12.3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Charges Exploitation',
      value: '2 180 000',
      unit: 'FCFA',
      change: '+5.2%',
      trend: 'up',
      icon: Calculator,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Résultat Net',
      value: '1 710 000',
      unit: 'FCFA',
      change: '+22.8%',
      trend: 'up',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const revenueAnalysis = [
    { category: 'Médicaments Éthiques', amount: 8500000, percentage: 68.3, margin: 32.5 },
    { category: 'Produits OTC', amount: 2100000, percentage: 16.9, margin: 28.7 },
    { category: 'Parapharmacie', amount: 980000, percentage: 7.9, margin: 45.2 },
    { category: 'Matériel Médical', amount: 870000, percentage: 6.9, margin: 38.9 }
  ];

  const profitabilityTrends = [
    { month: 'Jan', revenue: 9800000, margin: 28.5, costs: 7000000 },
    { month: 'Fév', revenue: 10200000, margin: 29.2, costs: 7200000 },
    { month: 'Mar', revenue: 11100000, margin: 30.1, costs: 7750000 },
    { month: 'Avr', revenue: 10800000, margin: 29.8, costs: 7580000 },
    { month: 'Mai', revenue: 11800000, margin: 31.2, costs: 8120000 },
    { month: 'Jun', revenue: 12450000, margin: 31.8, costs: 8490000 }
  ];

  const cashFlowData = [
    { type: 'Encaissements', amount: 12450000, status: 'positive' },
    { type: 'Décaissements', amount: -9240000, status: 'negative' },
    { type: 'Flux Net', amount: 3210000, status: 'positive' },
    { type: 'Trésorerie Début', amount: 8900000, status: 'neutral' },
    { type: 'Trésorerie Fin', amount: 12110000, status: 'positive' }
  ];

  const ratiosFinanciers = [
    { name: 'Marge Brute', value: 31.8, target: 30, status: 'excellent' },
    { name: 'Marge Nette', value: 13.7, target: 12, status: 'excellent' },
    { name: 'Rotation Stock', value: 8.2, target: 6, status: 'excellent' },
    { name: 'Créances Clients', value: 18.5, target: 20, status: 'good' },
    { name: 'Liquidité Générale', value: 2.8, target: 2, status: 'excellent' },
    { name: 'Endettement', value: 0.35, target: 0.5, status: 'excellent' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rapports Financiers</h2>
          <p className="text-muted-foreground">
            Analyses financières et comptables détaillées
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {financialMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metric.value} <span className="text-sm font-normal text-muted-foreground">{metric.unit}</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  {metric.change} vs mois précédent
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="profitability">Rentabilité</TabsTrigger>
          <TabsTrigger value="costs">Coûts</TabsTrigger>
          <TabsTrigger value="cashflow">Trésorerie</TabsTrigger>
          <TabsTrigger value="ratios">Ratios</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Répartition du CA par Catégorie
                </CardTitle>
                <CardDescription>Analyse des revenus par famille de produits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueAnalysis.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.category}</span>
                        <div className="text-sm text-muted-foreground">
                          {item.percentage}% • Marge: {item.margin}%
                        </div>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {(item.amount / 1000000).toFixed(1)}M FCFA
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Évolution Mensuelle des Revenus
                </CardTitle>
                <CardDescription>Tendance du chiffre d'affaires sur 6 mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profitabilityTrends.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.month}</p>
                        <p className="text-sm text-muted-foreground">
                          Marge: {item.margin}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {(item.revenue / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-xs text-muted-foreground">FCFA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analyse de Rentabilité
              </CardTitle>
              <CardDescription>Évolution des marges et de la profitabilité</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Marge Brute Moyenne</p>
                  <p className="text-2xl font-bold text-green-600">31.8%</p>
                  <p className="text-xs text-muted-foreground">+2.3% vs période précédente</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Marge Nette</p>
                  <p className="text-2xl font-bold text-blue-600">13.7%</p>
                  <p className="text-xs text-muted-foreground">+1.8% vs période précédente</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">ROI</p>
                  <p className="text-2xl font-bold text-purple-600">24.5%</p>
                  <p className="text-xs text-muted-foreground">+3.2% vs période précédente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Analyse des Coûts
              </CardTitle>
              <CardDescription>Décomposition des charges d'exploitation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Coût des Marchandises', amount: 8490000, percentage: 68.2 },
                  { name: 'Charges Personnel', amount: 1250000, percentage: 10.0 },
                  { name: 'Charges Locatives', amount: 650000, percentage: 5.2 },
                  { name: 'Marketing & Communication', amount: 380000, percentage: 3.1 },
                  { name: 'Charges Diverses', amount: 470000, percentage: 3.8 }
                ].map((cost, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{cost.name}</p>
                      <p className="text-sm text-muted-foreground">{cost.percentage}% du CA</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{(cost.amount / 1000000).toFixed(2)}M</p>
                      <p className="text-xs text-muted-foreground">FCFA</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Analyse de Trésorerie
              </CardTitle>
              <CardDescription>Flux de trésorerie et liquidités</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cashFlowData.map((flow, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {flow.status === 'positive' && <ArrowUpRight className="h-4 w-4 text-green-600" />}
                      {flow.status === 'negative' && <ArrowDownRight className="h-4 w-4 text-red-600" />}
                      {flow.status === 'neutral' && <div className="h-4 w-4 bg-gray-400 rounded-full" />}
                      <span className="font-medium">{flow.type}</span>
                    </div>
                    <div className={`text-right font-bold ${
                      flow.status === 'positive' ? 'text-green-600' : 
                      flow.status === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {(flow.amount / 1000000).toFixed(2)}M FCFA
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Ratios Financiers
              </CardTitle>
              <CardDescription>Indicateurs clés de performance financière</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {ratiosFinanciers.map((ratio, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{ratio.name}</span>
                      {getStatusIcon(ratio.status)}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">{ratio.value}</span>
                      <Badge className={getStatusColor(ratio.status)}>
                        {ratio.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Objectif: {ratio.target} • Performance excellente
                    </div>
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

export default FinancialReports;