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
  DollarSign, 
  TrendingUp, 
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
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { useAccountingDashboard } from '@/hooks/useAccountingDashboard';
import { Skeleton } from '@/components/ui/skeleton';

const AccountingDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  const {
    isLoading,
    isRefreshing,
    regionalParams,
    formatAmount,
    kpis,
    monthlyEvolution,
    expenseCategories,
    treasuryEvolution,
    balanceSheet,
    incomeStatement,
    financialRatios,
    topClients,
    quarterlyCA,
    pendingTasks,
    alerts,
    upcomingDeadlines,
    refresh
  } = useAccountingDashboard(selectedPeriod);

  const currency = (regionalParams as any)?.symbole_devise || 'FCFA';

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

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return AlertTriangle;
      case 'warning': return Clock;
      case 'success': return CheckCircle;
      default: return FileText;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return { bg: 'bg-red-50', border: 'border-l-red-500', text: 'text-red-700', textMuted: 'text-red-600' };
      case 'warning': return { bg: 'bg-yellow-50', border: 'border-l-yellow-500', text: 'text-yellow-700', textMuted: 'text-yellow-600' };
      case 'success': return { bg: 'bg-green-50', border: 'border-l-green-500', text: 'text-green-700', textMuted: 'text-green-600' };
      default: return { bg: 'bg-blue-50', border: 'border-l-blue-500', text: 'text-blue-700', textMuted: 'text-blue-600' };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Tableau de Bord Comptable</h2>
            <p className="text-muted-foreground">Chargement des données...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
            onClick={refresh}
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
                  <BarChart data={monthlyEvolution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${formatAmount(Number(value))} ${currency}`, '']}
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
                      formatter={(value) => [`${formatAmount(Number(value))} ${currency}`, '']}
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
                        <span className="font-medium">{formatAmount(category.value)} {currency}</span>
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
                <AreaChart data={treasuryEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${formatAmount(Number(value))} ${currency}`, 'Solde']}
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
                <CardDescription>Situation patrimoniale actuelle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span className="font-medium">ACTIF</span>
                    <span className="font-bold">{formatAmount(balanceSheet.actif.total)} {currency}</span>
                  </div>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between">
                      <span>Immobilisations</span>
                      <span>{formatAmount(balanceSheet.actif.immobilisations)} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stocks</span>
                      <span>{formatAmount(balanceSheet.actif.stocks)} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Créances</span>
                      <span>{formatAmount(balanceSheet.actif.creances)} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Disponibilités</span>
                      <span>{formatAmount(balanceSheet.actif.disponibilites)} {currency}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span className="font-medium">PASSIF</span>
                    <span className="font-bold">{formatAmount(balanceSheet.passif.total)} {currency}</span>
                  </div>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between">
                      <span>Capitaux propres</span>
                      <span>{formatAmount(balanceSheet.passif.capitaux_propres)} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Emprunts</span>
                      <span>{formatAmount(balanceSheet.passif.emprunts)} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dettes fournisseurs</span>
                      <span>{formatAmount(balanceSheet.passif.dettes_fournisseurs)} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Autres dettes</span>
                      <span>{formatAmount(balanceSheet.passif.autres_dettes)} {currency}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compte de résultat */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Compte de Résultat</CardTitle>
                <CardDescription>Résultats cumulés de l'exercice en cours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="font-medium text-green-700">Produits</span>
                    <span className="font-bold text-green-700">{formatAmount(incomeStatement.produits.total)} {currency}</span>
                  </div>
                  <div className="space-y-1 pl-4 text-sm">
                    <div className="flex justify-between">
                      <span>Ventes de marchandises</span>
                      <span>{formatAmount(incomeStatement.produits.ventes_marchandises)} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prestations de services</span>
                      <span>{formatAmount(incomeStatement.produits.prestations_services)} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Autres produits</span>
                      <span>{formatAmount(incomeStatement.produits.autres_produits)} {currency}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="font-medium text-red-700">Charges</span>
                    <span className="font-bold text-red-700">{formatAmount(incomeStatement.charges.total)} {currency}</span>
                  </div>
                  <div className="space-y-1 pl-4 text-sm">
                    <div className="flex justify-between">
                      <span>Achats de marchandises</span>
                      <span>{formatAmount(incomeStatement.charges.achats_marchandises)} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Charges de personnel</span>
                      <span>{formatAmount(incomeStatement.charges.charges_personnel)} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Autres charges</span>
                      <span>{formatAmount(incomeStatement.charges.autres_charges)} {currency}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="font-bold text-blue-700">Résultat Net</span>
                  <span className="font-bold text-blue-700">{formatAmount(incomeStatement.resultat_net)} {currency}</span>
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
                    <span className="text-sm font-bold text-green-600">{financialRatios.marge_brute.toFixed(1)}%</span>
                  </div>
                  <Progress value={financialRatios.marge_brute} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Marge Nette</span>
                    <span className="text-sm font-bold text-blue-600">{financialRatios.marge_nette.toFixed(1)}%</span>
                  </div>
                  <Progress value={financialRatios.marge_nette} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Ratio d'Endettement</span>
                    <span className="text-sm font-bold text-orange-600">{financialRatios.ratio_endettement.toFixed(1)}%</span>
                  </div>
                  <Progress value={financialRatios.ratio_endettement} className="h-2" />
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
                  <LineChart data={quarterlyCA}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="trimestre" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${formatAmount(Number(value))} ${currency}`, 'CA']} />
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
                  {topClients.length > 0 ? (
                    topClients.map((client, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatAmount(client.amount)} {currency}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">{client.percentage}%</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune donnée de vente disponible</p>
                  )}
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
                {pendingTasks.length > 0 ? (
                  pendingTasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
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
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune tâche en attente</p>
                )}
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
                  {alerts.length > 0 ? (
                    alerts.map((alert, index) => {
                      const AlertIcon = getAlertIcon(alert.type);
                      const colors = getAlertColor(alert.type);
                      return (
                        <div key={index} className={`flex items-start gap-3 p-3 ${colors.bg} border-l-4 ${colors.border} rounded`}>
                          <AlertIcon className={`h-5 w-5 ${colors.text} mt-0.5`} />
                          <div>
                            <p className={`font-medium ${colors.text}`}>{alert.title}</p>
                            <p className={`text-sm ${colors.textMuted}`}>
                              {alert.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune alerte pour le moment</p>
                  )}
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
                {upcomingDeadlines.map((item, index) => (
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