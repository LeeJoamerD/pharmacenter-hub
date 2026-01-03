import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  ShoppingCart,
  DollarSign,
  Minus
} from 'lucide-react';
import { useComparativeReports } from '@/hooks/useComparativeReports';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

const ComparativeReports = () => {
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const { metrics, temporal, categories, agents, variance, isLoading, refetch } = useComparativeReports(period);
  const { formatAmount } = useCurrencyFormatting();

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getVarianceColor = (status: 'favorable' | 'unfavorable' | 'neutral') => {
    switch (status) {
      case 'favorable': return 'text-green-600 bg-green-50';
      case 'unfavorable': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analyses Comparatives</h2>
          <p className="text-muted-foreground">
            Comparaisons temporelles, par catégorie et benchmarking
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(v) => setPeriod(v as 'month' | 'quarter' | 'year')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mensuel</SelectItem>
              <SelectItem value="quarter">Trimestriel</SelectItem>
              <SelectItem value="year">Annuel</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Métriques de comparaison principales */}
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric, index) => (
          <Card key={index} className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              {getTrendIcon(metric.trend)}
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {metric.title.includes('Chiffre') || metric.title.includes('Panier') 
                    ? formatAmount(metric.current) 
                    : metric.current.toLocaleString('fr-FR')}
                </span>
                <Badge className={metric.changePercent >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}>
                  {metric.changePercent >= 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>Précédent: {metric.title.includes('Chiffre') || metric.title.includes('Panier')
                  ? formatAmount(metric.previous)
                  : metric.previous.toLocaleString('fr-FR')}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{metric.period}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="temporal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="temporal">Temporel</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="variance">Variance</TabsTrigger>
        </TabsList>

        <TabsContent value="temporal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Évolution Temporelle
              </CardTitle>
              <CardDescription>Comparaison période par période</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {temporal.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{item.period}</h4>
                      <p className="text-sm text-muted-foreground">
                        vs période précédente
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-semibold">{formatAmount(item.currentValue)}</p>
                        <p className="text-xs text-muted-foreground">Actuel</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-muted-foreground">{formatAmount(item.previousValue)}</p>
                        <p className="text-xs text-muted-foreground">Précédent</p>
                      </div>
                      <Badge className={item.variancePercent >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}>
                        {item.variancePercent >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {item.variancePercent >= 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance par Catégorie
              </CardTitle>
              <CardDescription>Comparaison des familles de produits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((cat, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{cat.category}</h4>
                      <Badge className={cat.growth >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}>
                        {cat.growth >= 0 ? '+' : ''}{cat.growth.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Ventes Actuelles</p>
                        <p className="font-semibold">{formatAmount(cat.currentSales)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ventes Précédentes</p>
                        <p className="font-semibold">{formatAmount(cat.previousSales)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Contribution</p>
                        <p className="font-semibold">{cat.contribution.toFixed(1)}%</p>
                      </div>
                    </div>
                    <Progress value={cat.contribution} className="mt-3 h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Performance par Agent
              </CardTitle>
              <CardDescription>Comparaison des vendeurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.map((agent, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{agent.agentName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {agent.transactions} transactions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-semibold">{formatAmount(agent.currentSales)}</p>
                        <p className="text-xs text-muted-foreground">CA Actuel</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatAmount(agent.avgBasket)}</p>
                        <p className="text-xs text-muted-foreground">Panier Moyen</p>
                      </div>
                      <Badge className={agent.growth >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}>
                        {agent.growth >= 0 ? '+' : ''}{agent.growth.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Analyse de Variance
              </CardTitle>
              <CardDescription>Écarts par rapport aux objectifs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {variance.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{item.metric}</h4>
                      <Badge className={getVarianceColor(item.status)}>
                        {item.status === 'favorable' ? 'Favorable' : item.status === 'unfavorable' ? 'Défavorable' : 'Neutre'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-semibold">{item.metric.includes('Transactions') 
                          ? item.budgeted.toFixed(0)
                          : formatAmount(item.budgeted)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Réel</p>
                        <p className="font-semibold">{item.metric.includes('Transactions')
                          ? item.actual.toFixed(0)
                          : formatAmount(item.actual)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Écart</p>
                        <p className={`font-semibold ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.variance >= 0 ? '+' : ''}{item.metric.includes('Transactions')
                            ? item.variance.toFixed(0)
                            : formatAmount(item.variance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">% Écart</p>
                        <p className={`font-semibold ${item.variancePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.variancePercent >= 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%
                        </p>
                      </div>
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

export default ComparativeReports;
