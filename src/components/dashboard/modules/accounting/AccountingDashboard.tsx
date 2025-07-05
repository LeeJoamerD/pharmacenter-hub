import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  CreditCard, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Banknote,
  Building2,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AccountingDashboard = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Données pour les graphiques
  const monthlyRevenue = [
    { month: 'Jan', recettes: 850000, depenses: 650000, resultat: 200000 },
    { month: 'Fév', recettes: 920000, depenses: 680000, resultat: 240000 },
    { month: 'Mar', recettes: 780000, depenses: 720000, resultat: 60000 },
    { month: 'Avr', recettes: 1100000, depenses: 750000, resultat: 350000 },
    { month: 'Mai', recettes: 950000, depenses: 700000, resultat: 250000 },
    { month: 'Jun', recettes: 1050000, depenses: 780000, resultat: 270000 }
  ];

  const expenseCategories = [
    { name: 'Achats Marchandises', value: 2500000, color: '#0088FE' },
    { name: 'Charges Personnel', value: 800000, color: '#00C49F' },
    { name: 'Charges Locatives', value: 350000, color: '#FFBB28' },
    { name: 'Services Extérieurs', value: 280000, color: '#FF8042' },
    { name: 'Autres Charges', value: 150000, color: '#8884D8' }
  ];

  const treasuryData = [
    { date: '01/01', solde: 2500000 },
    { date: '08/01', solde: 2200000 },
    { date: '15/01', solde: 2800000 },
    { date: '22/01', solde: 2600000 },
    { date: '29/01', solde: 3100000 }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Données actualisées",
        description: "Le tableau de bord a été mis à jour avec les dernières données",
      });
    }, 2000);
  };

  // Indicateurs clés
  const kpis = [
    {
      title: 'Chiffre d\'Affaires',
      value: '5 650 000',
      unit: 'FCFA',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Résultat Net',
      value: '1 370 000',
      unit: 'FCFA',
      change: '+18.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Charges Totales',
      value: '4 280 000',
      unit: 'FCFA',
      change: '+8.1%',
      trend: 'up',
      icon: CreditCard,
      color: 'text-orange-600'
    },
    {
      title: 'Trésorerie',
      value: '3 100 000',
      unit: 'FCFA',
      change: '+15.8%',
      trend: 'up',
      icon: Banknote,
      color: 'text-blue-600'
    }
  ];

  // Tâches en attente
  const pendingTasks = [
    { task: 'Lettrage automatique', count: 15, priority: 'high', icon: AlertTriangle },
    { task: 'Validation écritures', count: 8, priority: 'medium', icon: CheckCircle },
    { task: 'Rapprochement bancaire', count: 3, priority: 'high', icon: Building2 },
    { task: 'Déclaration TVA', count: 1, priority: 'urgent', icon: FileText }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'Élevée';
      case 'medium': return 'Moyenne';
      default: return 'Faible';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tableau de Bord Comptable</h2>
          <p className="text-muted-foreground">
            Vue d'ensemble des indicateurs financiers et comptables
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="animate-fade-in"
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => {
          const IconComponent = kpi.icon;
          return (
            <Card key={index} className="hover-scale animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <IconComponent className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpi.value} <span className="text-sm font-normal text-muted-foreground">{kpi.unit}</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {kpi.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  {kpi.change} par rapport au mois dernier
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="financial">États Financiers</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Graphique Recettes vs Dépenses */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Évolution Mensuelle
                </CardTitle>
                <CardDescription>
                  Recettes, dépenses et résultat sur 6 mois
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value.toLocaleString()} FCFA`, '']}
                    />
                    <Bar dataKey="recettes" fill="#10b981" name="Recettes" />
                    <Bar dataKey="depenses" fill="#ef4444" name="Dépenses" />
                    <Bar dataKey="resultat" fill="#3b82f6" name="Résultat" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Répartition des charges */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Répartition des Charges
                </CardTitle>
                <CardDescription>
                  Distribution des principales catégories de charges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      dataKey="value"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value.toLocaleString()} FCFA`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {expenseCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </div>
                      <span className="font-medium">{category.value.toLocaleString()} FCFA</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Évolution de la trésorerie */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Évolution de la Trésorerie
              </CardTitle>
              <CardDescription>
                Suivi quotidien des liquidités disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={treasuryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value.toLocaleString()} FCFA`, 'Solde']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="solde" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Bilan synthétique */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Bilan Synthétique</CardTitle>
                <CardDescription>Situation patrimoniale au 31/01/2024</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span className="font-medium">ACTIF</span>
                    <span className="font-bold">15 250 000 FCFA</span>
                  </div>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between">
                      <span>Immobilisations</span>
                      <span>8 500 000 FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stocks</span>
                      <span>4 650 000 FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Créances</span>
                      <span>1 200 000 FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Disponibilités</span>
                      <span>900 000 FCFA</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span className="font-medium">PASSIF</span>
                    <span className="font-bold">15 250 000 FCFA</span>
                  </div>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between">
                      <span>Capitaux propres</span>
                      <span>9 800 000 FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Emprunts</span>
                      <span>3 200 000 FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dettes fournisseurs</span>
                      <span>1 850 000 FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Autres dettes</span>
                      <span>400 000 FCFA</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compte de résultat */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Compte de Résultat</CardTitle>
                <CardDescription>Résultats cumulés depuis le 01/01/2024</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="font-medium text-green-700">Produits</span>
                    <span className="font-bold text-green-700">5 650 000 FCFA</span>
                  </div>
                  <div className="space-y-1 pl-4 text-sm">
                    <div className="flex justify-between">
                      <span>Ventes de marchandises</span>
                      <span>5 200 000 FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prestations de services</span>
                      <span>350 000 FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Autres produits</span>
                      <span>100 000 FCFA</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="font-medium text-red-700">Charges</span>
                    <span className="font-bold text-red-700">4 280 000 FCFA</span>
                  </div>
                  <div className="space-y-1 pl-4 text-sm">
                    <div className="flex justify-between">
                      <span>Achats de marchandises</span>
                      <span>3 200 000 FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Charges de personnel</span>
                      <span>680 000 FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Autres charges</span>
                      <span>400 000 FCFA</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="font-bold text-blue-700">Résultat Net</span>
                  <span className="font-bold text-blue-700">1 370 000 FCFA</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ratios financiers */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Ratios Financiers Clés
              </CardTitle>
              <CardDescription>
                Indicateurs de performance et santé financière
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Marge Brute</span>
                    <span className="text-sm font-bold text-green-600">38.5%</span>
                  </div>
                  <Progress value={38.5} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Marge Nette</span>
                    <span className="text-sm font-bold text-blue-600">24.2%</span>
                  </div>
                  <Progress value={24.2} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Ratio d'Endettement</span>
                    <span className="text-sm font-bold text-orange-600">35.8%</span>
                  </div>
                  <Progress value={35.8} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Évolution du CA par Trimestre</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { trimestre: 'T1 2023', ca: 3200000 },
                    { trimestre: 'T2 2023', ca: 3800000 },
                    { trimestre: 'T3 2023', ca: 3500000 },
                    { trimestre: 'T4 2023', ca: 4200000 },
                    { trimestre: 'T1 2024', ca: 5650000 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="trimestre" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toLocaleString()} FCFA`, 'CA']} />
                    <Line type="monotone" dataKey="ca" stroke="#3b82f6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Top 5 Clients</CardTitle>
                <CardDescription>Par chiffre d'affaires généré</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Hôpital Général', amount: 850000, percentage: 15 },
                    { name: 'Clinique du Plateau', amount: 650000, percentage: 12 },
                    { name: 'Centre Médical Cocody', amount: 480000, percentage: 8 },
                    { name: 'Cabinet Dr. Kouassi', amount: 320000, percentage: 6 },
                    { name: 'Pharmacie Riviera', amount: 280000, percentage: 5 }
                  ].map((client, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.amount.toLocaleString()} FCFA
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{client.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Tâches en attente */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Tâches en Attente
                </CardTitle>
                <CardDescription>
                  Actions comptables nécessitant une intervention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingTasks.map((task, index) => {
                  const IconComponent = task.icon;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{task.task}</p>
                          <p className="text-sm text-muted-foreground">
                            {task.count} élément(s) en attente
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`text-white ${getPriorityColor(task.priority)}`}
                        >
                          {getPriorityText(task.priority)}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Traiter
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Alertes et notifications */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertes & Notifications
                </CardTitle>
                <CardDescription>
                  Surveillances automatiques et rappels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-red-50 border-l-4 border-l-red-500 rounded">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-700">Déclaration TVA à échéance</p>
                      <p className="text-sm text-red-600">
                        La déclaration TVA de janvier doit être déposée avant le 15/02/2024
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-yellow-50 border-l-4 border-l-yellow-500 rounded">
                    <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-700">Rapprochement bancaire en retard</p>
                      <p className="text-sm text-yellow-600">
                        Le rapprochement du compte BQ1 n'a pas été effectué depuis 5 jours
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 border-l-4 border-l-blue-500 rounded">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-700">Sauvegarde automatique effectuée</p>
                      <p className="text-sm text-blue-600">
                        Sauvegarde complète réalisée le 15/01/2024 à 02:00
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 border-l-4 border-l-green-500 rounded">
                    <FileText className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-700">Export FEC généré</p>
                      <p className="text-sm text-green-600">
                        Le fichier FEC 2023 a été généré et transmis à l'expert-comptable
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prochaines échéances */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Prochaines Échéances
              </CardTitle>
              <CardDescription>
                Calendrier des obligations comptables et fiscales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: '15/02/2024', task: 'Déclaration TVA Janvier', status: 'urgent' },
                  { date: '28/02/2024', task: 'Clôture mensuelle Février', status: 'normal' },
                  { date: '15/03/2024', task: 'Déclaration TVA Février', status: 'normal' },
                  { date: '31/03/2024', task: 'Arrêté trimestriel Q1', status: 'important' },
                  { date: '15/04/2024', task: 'Déclaration TVA Mars', status: 'normal' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-sm font-medium">{item.date.split('/')[0]}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.date.split('/')[1]}/{item.date.split('/')[2]}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{item.task}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={item.status === 'urgent' ? 'destructive' : 
                              item.status === 'important' ? 'secondary' : 'outline'}
                    >
                      {item.status === 'urgent' ? 'Urgent' :
                       item.status === 'important' ? 'Important' : 'Normal'}
                    </Badge>
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

export default AccountingDashboard;