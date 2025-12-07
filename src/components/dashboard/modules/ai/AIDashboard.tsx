import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bot, 
  Brain, 
  TrendingUp, 
  Target, 
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  BarChart3,
  Eye,
  Lightbulb,
  RefreshCw,
  Download,
  Package,
  Clock
} from 'lucide-react';
import { useAIDashboard } from '@/hooks/useAIDashboard';
import { useTenant } from '@/contexts/TenantContext';
import { AIDashboardInsightDialog } from './dialogs/AIDashboardInsightDialog';
import { AIDashboardExportDialog } from './dialogs/AIDashboardExportDialog';
import { QuickDiagnosticResultDialog } from './dialogs/QuickDiagnosticResultDialog';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AIInsightSummary } from '@/hooks/useAIDashboard';

const AIDashboard = () => {
  const { currentTenant } = useTenant();
  const {
    metrics,
    models,
    insights,
    loading,
    loadingDiagnostic,
    diagnosticResult,
    refreshAll,
    runDiagnostic,
    markInsightAsRead,
    applyInsight,
    dismissInsight,
    setDiagnosticResult
  } = useAIDashboard();

  const [selectedInsight, setSelectedInsight] = useState<AIInsightSummary | null>(null);
  const [insightDialogOpen, setInsightDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [diagnosticDialogOpen, setDiagnosticDialogOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'training': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'training': return 'Entraînement';
      case 'inactive': return 'Inactif';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'high': return 'border-orange-200 bg-orange-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'prediction':
      case 'prédiction':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'recommendation':
      case 'recommandation':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'anomaly':
      case 'anomalie':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-primary" />;
    }
  };

  const handleInsightClick = (insight: AIInsightSummary) => {
    setSelectedInsight(insight);
    setInsightDialogOpen(true);
    if (!insight.isRead) {
      markInsightAsRead(insight.id);
    }
  };

  const handleDiagnostic = async () => {
    const result = await runDiagnostic();
    if (result) {
      setDiagnosticDialogOpen(true);
    }
  };

  const handleNavigateToChat = () => {
    // Navigate to Chat IA sub-module via parent component
    window.dispatchEvent(new CustomEvent('navigate-ai-submodule', { detail: 'chat ia' }));
  };

  const handleNavigateToStock = () => {
    window.dispatchEvent(new CustomEvent('navigate-ai-submodule', { detail: 'stocks ia' }));
  };

  const handleNavigateToForecasting = () => {
    window.dispatchEvent(new CustomEvent('navigate-ai-submodule', { detail: 'prévisions' }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assistant IA PharmaSoft</h2>
          <p className="text-muted-foreground">
            Intelligence artificielle pour optimiser votre pharmacie
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshAll()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={handleNavigateToChat}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat IA
          </Button>
          <Button size="sm" onClick={handleDiagnostic} disabled={loadingDiagnostic}>
            <Brain className={`h-4 w-4 mr-2 ${loadingDiagnostic ? 'animate-pulse' : ''}`} />
            {loadingDiagnostic ? 'Analyse...' : 'Diagnostic Auto'}
          </Button>
        </div>
      </div>

      {/* Métriques IA */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modèles Actifs</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.modelsActive}</div>
                <p className="text-xs text-muted-foreground">
                  +{metrics.modelsTraining} en entraînement
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prédictions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.predictionsToday}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.predictionsWeek} cette semaine
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommandations</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.recommendationsTotal}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.recommendationsImplemented} implémentées
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Précision</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {metrics.avgAccuracy > 0 ? `${metrics.avgAccuracy}%` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Moyenne globale
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Réponse</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.avgProcessingTime}s</div>
                <p className="text-xs text-muted-foreground">
                  Temps moyen
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* État des Modèles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              État des Modèles IA
            </CardTitle>
            <CardDescription>Performance et statut des modèles d'apprentissage</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : models.length > 0 ? (
              <div className="space-y-4">
                {models.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{model.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Précision: {model.accuracy}% • {model.specialization || 'Général'}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(model.status)}>
                      {getStatusLabel(model.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun modèle IA configuré</p>
                <p className="text-sm mt-1">Configurez vos modèles dans les paramètres IA</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights Récents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Insights IA Récents
              {metrics.insightsUnread > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {metrics.insightsUnread} non lus
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Dernières découvertes et recommandations</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div 
                    key={insight.id} 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${getImpactColor(insight.impact)}`}
                    onClick={() => handleInsightClick(insight)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(insight.type)}
                        <Badge variant="outline">{insight.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Confiance: {insight.confidence}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {insight.isApplied && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {!insight.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(insight.timestamp), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{insight.description}</p>
                    <Progress value={insight.confidence} className="h-2 mt-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun insight disponible</p>
                <p className="text-sm mt-1">Les insights seront générés automatiquement</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions Rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Actions Intelligentes Recommandées
          </CardTitle>
          <CardDescription>Actions prioritaires suggérées par l'IA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={handleNavigateToForecasting}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">Analyser Tendances</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={handleNavigateToStock}
            >
              <Package className="h-5 w-5" />
              <span className="text-sm">Optimiser Stock</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={handleNavigateToChat}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">Consulter IA</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AIDashboardInsightDialog
        open={insightDialogOpen}
        onOpenChange={setInsightDialogOpen}
        insight={selectedInsight}
        onMarkAsRead={markInsightAsRead}
        onApply={applyInsight}
        onDismiss={dismissInsight}
      />

      <AIDashboardExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        metrics={metrics}
        models={models}
        insights={insights}
        pharmacyName={currentTenant?.name || 'PharmaSoft'}
      />

      <QuickDiagnosticResultDialog
        open={diagnosticDialogOpen}
        onOpenChange={setDiagnosticDialogOpen}
        result={diagnosticResult}
        pharmacyName={currentTenant?.name || 'PharmaSoft'}
      />
    </div>
  );
};

export default AIDashboard;
