import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  Lightbulb, 
  TrendingUp,
  DollarSign,
  Calendar,
  Award,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  ArrowRight,
  BarChart3,
  RefreshCw,
  Download,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useStrategicRecommendations, StrategicRecommendation } from '@/hooks/useStrategicRecommendations';
import { useTenant } from '@/contexts/TenantContext';
import { exportRecommendationsToPDF, exportRecommendationsToExcel } from '@/utils/recommendationExportUtils';
import RecommendationDetailDialog from './dialogs/RecommendationDetailDialog';
import RejectRecommendationDialog from './dialogs/RejectRecommendationDialog';
import ScheduleRecommendationDialog from './dialogs/ScheduleRecommendationDialog';

const StrategicRecommendations = () => {
  const { currentTenant } = useTenant();
  const {
    loading,
    generating,
    recommendations,
    metrics,
    categories,
    filters,
    setFilters,
    generateRecommendations,
    implementRecommendation,
    rejectRecommendation,
    scheduleRecommendation,
    refreshData
  } = useStrategicRecommendations();

  // Dialog states
  const [selectedRecommendation, setSelectedRecommendation] = useState<StrategicRecommendation | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectingTitle, setRejectingTitle] = useState('');
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [schedulingTitle, setSchedulingTitle] = useState('');

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'bg-red-50 text-red-600';
      case 'medium': return 'bg-orange-50 text-orange-600';
      case 'low': return 'bg-green-50 text-green-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-orange-600" />;
      case 'scheduled': return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'implemented': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Eye className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleImplement = (id: string) => {
    implementRecommendation(id);
  };

  const handleOpenReject = (rec: StrategicRecommendation) => {
    setRejectingId(rec.id);
    setRejectingTitle(rec.title);
    setRejectDialogOpen(true);
  };

  const handleOpenSchedule = (rec: StrategicRecommendation) => {
    setSchedulingId(rec.id);
    setSchedulingTitle(rec.title);
    setScheduleDialogOpen(true);
  };

  const handleOpenDetail = (rec: StrategicRecommendation) => {
    setSelectedRecommendation(rec);
    setDetailDialogOpen(true);
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    const pharmacyName = (currentTenant as any)?.nom_pharmacie || currentTenant?.name || 'PharmaSoft';
    if (format === 'pdf') {
      exportRecommendationsToPDF(recommendations, metrics, pharmacyName);
    } else {
      exportRecommendationsToExcel(recommendations, metrics);
    }
  };

  // Sort recommendations based on filter
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    switch (filters.sortBy) {
      case 'priority': return a.priority - b.priority;
      case 'impact': 
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      case 'confidence': return b.confidence - a.confidence;
      default: return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recommandations Stratégiques IA</h2>
          <p className="text-muted-foreground">
            Suggestions d'optimisation personnalisées basées sur l'analyse de vos données
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 border rounded-md text-sm bg-background"
          >
            <option value="all">Toutes catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select 
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as 'priority' | 'impact' | 'confidence' })}
            className="px-3 py-2 border rounded-md text-sm bg-background"
          >
            <option value="priority">Par priorité</option>
            <option value="impact">Par impact</option>
            <option value="confidence">Par confiance</option>
          </select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refreshData()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button 
            size="sm"
            onClick={() => generateRecommendations()}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Générer
          </Button>
          <div className="relative">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <div className="absolute right-0 mt-1 w-32 bg-background border rounded-md shadow-lg z-10 hidden group-hover:block">
              <button 
                className="w-full px-3 py-2 text-sm text-left hover:bg-muted"
                onClick={() => handleExport('pdf')}
              >
                PDF
              </button>
              <button 
                className="w-full px-3 py-2 text-sm text-left hover:bg-muted"
                onClick={() => handleExport('excel')}
              >
                Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommandations</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_recommendations}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.new_recommendations} nouvelles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Potentiel</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.potential_roi}</div>
            <p className="text-xs text-muted-foreground">
              Par mois estimé
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiance Moy.</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avg_confidence}%</div>
            <p className="text-xs text-muted-foreground">
              Fiabilité IA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Implémentées</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.implemented}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.in_progress} en cours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loading state */}
      {loading && recommendations.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Chargement...</h3>
            <p className="text-muted-foreground">
              Récupération des recommandations en cours
            </p>
          </CardContent>
        </Card>
      )}

      {/* Liste des recommandations */}
      <div className="space-y-6">
        {sortedRecommendations.map((recommendation) => (
          <Card key={recommendation.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(recommendation.status)}
                  <div>
                    <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline">{recommendation.category}</Badge>
                      <Badge className={getImpactColor(recommendation.impact)}>
                        Impact {recommendation.impact === 'high' ? 'Élevé' : 
                                recommendation.impact === 'medium' ? 'Moyen' : 'Faible'}
                      </Badge>
                      <Badge className={getEffortColor(recommendation.effort)}>
                        Effort {recommendation.effort === 'high' ? 'Élevé' : 
                               recommendation.effort === 'medium' ? 'Moyen' : 'Faible'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">{recommendation.estimated_roi || '-'}</div>
                  <div className="text-sm text-muted-foreground">{recommendation.timeframe || '-'}</div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{recommendation.description}</p>
              
              {/* Métriques */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Priorité:</span>
                  <Badge variant="outline">#{recommendation.priority}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Confiance:</span>
                  <Progress value={recommendation.confidence} className="w-16 h-2" />
                  <span className="text-sm">{recommendation.confidence}%</span>
                </div>
              </div>

              <Tabs defaultValue="factors" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="factors">Facteurs Clés</TabsTrigger>
                  <TabsTrigger value="actions">Plan d'Action</TabsTrigger>
                </TabsList>
                
                <TabsContent value="factors" className="space-y-2">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Analyse IA - Facteurs déterminants:</h4>
                    <ul className="space-y-1">
                      {recommendation.factors.map((factor, index) => (
                        <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                          <BarChart3 className="h-3 w-3 mt-1 flex-shrink-0" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="actions" className="space-y-2">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Étapes recommandées:</h4>
                    <ul className="space-y-2">
                      {recommendation.actions.map((action, index) => (
                        <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-200 text-green-800 text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                            {index + 1}
                          </div>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  {!['implemented', 'rejected'].includes(recommendation.status) && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => handleImplement(recommendation.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Implémenter
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleOpenReject(recommendation)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Rejeter
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleOpenDetail(recommendation)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Analyser
                  </Button>
                  {!['implemented', 'rejected', 'scheduled'].includes(recommendation.status) && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleOpenSchedule(recommendation)}
                    >
                      Programmer
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedRecommendations.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune recommandation</h3>
            <p className="text-muted-foreground mb-4">
              {filters.category !== 'all' 
                ? 'Aucune recommandation trouvée pour les filtres sélectionnés.'
                : 'Cliquez sur "Générer" pour créer des recommandations basées sur vos données.'}
            </p>
            {filters.category === 'all' && (
              <Button onClick={() => generateRecommendations()} disabled={generating}>
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Générer des recommandations
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <RecommendationDetailDialog
        recommendation={selectedRecommendation}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onImplement={handleImplement}
        onReject={(id) => {
          const rec = recommendations.find(r => r.id === id);
          if (rec) handleOpenReject(rec);
        }}
        onSchedule={(id) => {
          const rec = recommendations.find(r => r.id === id);
          if (rec) handleOpenSchedule(rec);
        }}
      />

      <RejectRecommendationDialog
        recommendationId={rejectingId}
        recommendationTitle={rejectingTitle}
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onReject={rejectRecommendation}
      />

      <ScheduleRecommendationDialog
        recommendationId={schedulingId}
        recommendationTitle={schedulingTitle}
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onSchedule={scheduleRecommendation}
      />
    </div>
  );
};

export default StrategicRecommendations;
