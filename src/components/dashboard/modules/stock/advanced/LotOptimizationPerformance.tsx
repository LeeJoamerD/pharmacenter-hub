import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLotOptimizationMetrics } from "@/hooks/useLotOptimizationMetrics";
import { TrendingUp, TrendingDown, CheckCircle, XCircle, Target, DollarSign } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const LotOptimizationPerformance = () => {
  const { useTodayMetrics, useMetricsHistory, useTotalMetrics, useRecentSuggestions } = useLotOptimizationMetrics();
  
  const { data: todayMetrics, isLoading: loadingToday } = useTodayMetrics();
  const { data: historyMetrics, isLoading: loadingHistory } = useMetricsHistory(30);
  const { data: totalMetrics, isLoading: loadingTotal } = useTotalMetrics();
  const { data: recentSuggestions, isLoading: loadingRecent } = useRecentSuggestions();

  if (loadingToday || loadingHistory || loadingTotal || loadingRecent) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">
          Chargement des métriques...
        </div>
      </div>
    );
  }

  // Préparer les données pour les graphiques
  const chartData = historyMetrics?.map(metric => ({
    date: new Date(metric.metric_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    appliquées: metric.suggestions_applied,
    ignorées: metric.suggestions_ignored,
    total: metric.total_suggestions_generated
  })) || [];

  const applicationRate = totalMetrics?.applicationRate || 0;

  return (
    <div className="space-y-6">
      {/* Métriques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suggestions Totales</p>
                <p className="text-2xl font-bold">{totalMetrics?.totalSuggestions || 0}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={(totalMetrics?.totalApplied / (totalMetrics?.totalSuggestions || 1)) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux d'Application</p>
                <p className="text-2xl font-bold">{applicationRate.toFixed(1)}%</p>
              </div>
              {applicationRate >= 70 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-orange-600" />
              )}
            </div>
            <Progress value={applicationRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expirations Évitées</p>
                <p className="text-2xl font-bold">{totalMetrics?.totalExpirationsAvoided || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Corrections FIFO</p>
                <p className="text-2xl font-bold">{totalMetrics?.totalFIFOCorrections || 0}</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métriques d'aujourd'hui */}
      <Card>
        <CardHeader>
          <CardTitle>Performance du Jour</CardTitle>
          <CardDescription>Métriques en temps réel pour aujourd'hui</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Appliquées</p>
                <p className="text-xl font-bold">{todayMetrics?.suggestions_applied || 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <XCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ignorées</p>
                <p className="text-xl font-bold">{todayMetrics?.suggestions_ignored || 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Réappro. Suggérés</p>
                <p className="text-xl font-bold">{todayMetrics?.stock_reorders_suggested || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tendance des 30 Derniers Jours</CardTitle>
            <CardDescription>Évolution des suggestions appliquées vs ignorées</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="appliquées" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="ignorées" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par Type</CardTitle>
            <CardDescription>Distribution des suggestions par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Promotions', value: recentSuggestions?.byType?.promotion || 0 },
                { name: 'Réappro.', value: recentSuggestions?.byType?.reorder || 0 },
                { name: 'Ajustements', value: recentSuggestions?.byType?.adjustment || 0 },
                { name: 'Transferts', value: recentSuggestions?.byType?.transfer || 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Résumé des types d'optimisations */}
      <Card>
        <CardHeader>
          <CardTitle>Impact des Optimisations</CardTitle>
          <CardDescription>Résultats cumulés depuis le début</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Expirations évitées</span>
              <span className="text-lg font-bold text-green-600">
                {totalMetrics?.totalExpirationsAvoided || 0}
              </span>
            </div>
            <Progress 
              value={(totalMetrics?.totalExpirationsAvoided / (totalMetrics?.totalSuggestions || 1)) * 100} 
            />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Réapprovisionnements suggérés</span>
              <span className="text-lg font-bold text-blue-600">
                {totalMetrics?.totalReorders || 0}
              </span>
            </div>
            <Progress 
              value={(totalMetrics?.totalReorders / (totalMetrics?.totalSuggestions || 1)) * 100} 
            />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Corrections FIFO</span>
              <span className="text-lg font-bold text-purple-600">
                {totalMetrics?.totalFIFOCorrections || 0}
              </span>
            </div>
            <Progress 
              value={(totalMetrics?.totalFIFOCorrections / (totalMetrics?.totalSuggestions || 1)) * 100} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};