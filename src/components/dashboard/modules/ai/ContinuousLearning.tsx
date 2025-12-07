import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, RefreshCw, Database, Target, TrendingUp, Settings, CheckCircle,
  Brain, Eye, BarChart3, Clock, Award, Plus, Download, MessageSquare, Loader2
} from 'lucide-react';
import { useContinuousLearning } from '@/hooks/useContinuousLearning';
import { LearningModelDetailDialog } from './dialogs/LearningModelDetailDialog';
import { LearningModelConfigDialog } from './dialogs/LearningModelConfigDialog';
import { LearningFeedbackDialog } from './dialogs/LearningFeedbackDialog';
import { FeedbackImpactDialog } from './dialogs/FeedbackImpactDialog';
import { DatasetConfigDialog } from './dialogs/DatasetConfigDialog';
import { MLConfigDialog } from './dialogs/MLConfigDialog';
import { exportModelsToPDF, exportFeedbackToExcel, exportTrainingReportToPDF, exportTrainingReportToExcel } from '@/utils/learningExportUtils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ContinuousLearning = () => {
  const {
    metrics, models, feedback, datasets, sessions, config,
    isLoading, isStartingTraining, isSyncing,
    createModel, updateModel, deleteModel, startTraining, startAllTraining,
    createFeedback, applyFeedback, createDataset, updateDataset, syncDataset, saveConfig
  } = useContinuousLearning();

  // Dialog states
  const [selectedModel, setSelectedModel] = useState<typeof models[0] | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<typeof feedback[0] | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<typeof datasets[0] | null>(null);
  const [showModelDetail, setShowModelDetail] = useState(false);
  const [showModelConfig, setShowModelConfig] = useState(false);
  const [showNewModel, setShowNewModel] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showFeedbackImpact, setShowFeedbackImpact] = useState(false);
  const [showDatasetConfig, setShowDatasetConfig] = useState(false);
  const [showNewDataset, setShowNewDataset] = useState(false);
  const [showMLConfig, setShowMLConfig] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'training': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFeedbackColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-50 border-green-200';
      case 'mixed': return 'bg-orange-50 border-orange-200';
      case 'negative': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const avgAccuracy = models.length > 0 
    ? (models.reduce((sum, m) => sum + Number(m.accuracy), 0) / models.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Apprentissage Continu</h2>
          <p className="text-muted-foreground">Amélioration automatique des modèles IA par apprentissage machine</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setShowMLConfig(true)}>
            <Settings className="h-4 w-4 mr-2" />Configuration ML
          </Button>
          <Button onClick={() => startAllTraining()} disabled={isStartingTraining || models.filter(m => m.status === 'pending').length === 0}>
            {isStartingTraining ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
            {isStartingTraining ? 'Entraînement...' : 'Former Modèles'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modèles Actifs</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalModels || models.length}</div>
            <p className="text-xs text-muted-foreground">En production</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Formation</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics?.activeTraining || models.filter(m => m.status === 'training').length}</div>
            <p className="text-xs text-muted-foreground">Modèles actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gain Précision</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{metrics?.avgAccuracyGain || 0}%</div>
            <p className="text-xs text-muted-foreground">Moyenne mensuelle</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Données Traitées</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.dataProcessed || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Points de données</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Formation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.trainingHours || 0}h</div>
            <p className="text-xs text-muted-foreground">Ce mois-ci</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models">Modèles</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="data">Données</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />Entraînement des Modèles</CardTitle>
                <CardDescription>Statut et progression de l'apprentissage machine</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportModelsToPDF(models)}><Download className="h-4 w-4 mr-2" />Export</Button>
                <Button size="sm" onClick={() => setShowNewModel(true)}><Plus className="h-4 w-4 mr-2" />Nouveau</Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : models.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Aucun modèle configuré. Créez votre premier modèle.</div>
              ) : (
                <div className="space-y-4">
                  {models.map((model) => (
                    <div key={model.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{model.name}</h4>
                          <p className="text-sm text-muted-foreground">Précision: {model.accuracy}% • {model.data_points} points de données</p>
                        </div>
                        <Badge className={getStatusColor(model.status)}>
                          {model.status === 'training' ? 'Formation' : model.status === 'active' ? 'Actif' : model.status === 'pending' ? 'En attente' : 'Erreur'}
                        </Badge>
                      </div>
                      {model.status === 'training' && (
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1"><span>Progression</span><span>{model.progress}%</span></div>
                          <Progress value={Number(model.progress)} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">Époque {model.current_epoch} en cours</p>
                        </div>
                      )}
                      <div className="grid gap-4 md:grid-cols-2 text-sm">
                        <div><span className="text-muted-foreground">Dernière mise à jour:</span><span className="font-medium ml-2">{model.last_training_at ? format(new Date(model.last_training_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : '-'}</span></div>
                        <div><span className="text-muted-foreground">Prochaine formation:</span><span className="font-medium ml-2">{model.next_training_at ? format(new Date(model.next_training_at), 'dd/MM/yyyy', { locale: fr }) : '-'}</span></div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedModel(model); setShowModelDetail(true); }}><Eye className="h-4 w-4 mr-2" />Détails</Button>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedModel(model); setShowModelConfig(true); }}><Settings className="h-4 w-4 mr-2" />Configurer</Button>
                        {model.status !== 'training' && <Button size="sm" onClick={() => startTraining({ modelId: model.id })}><RefreshCw className="h-4 w-4 mr-2" />Relancer</Button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />Retours Utilisateurs</CardTitle>
                <CardDescription>Feedback pour amélioration continue des modèles</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowFeedbackForm(true)}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
            </CardHeader>
            <CardContent>
              {feedback.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Aucun feedback enregistré.</div>
              ) : (
                <div className="space-y-4">
                  {feedback.map((fb) => (
                    <div key={fb.id} className={`p-4 border rounded-lg ${getFeedbackColor(fb.feedback_type)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{fb.model_name || 'Général'}</h4>
                          <p className="text-sm text-muted-foreground">Par {fb.user_name} • {format(new Date(fb.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                        </div>
                        <Badge className={fb.feedback_type === 'positive' ? 'bg-green-100 text-green-800' : fb.feedback_type === 'mixed' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}>
                          {fb.feedback_type === 'positive' ? 'Positif' : fb.feedback_type === 'mixed' ? 'Mitigé' : 'Négatif'}
                        </Badge>
                      </div>
                      <p className="text-sm italic">"{fb.comment}"</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => applyFeedback(fb.id)} disabled={fb.impact_applied}><CheckCircle className="h-4 w-4 mr-2" />{fb.impact_applied ? 'Intégré' : 'Intégrer'}</Button>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedFeedback(fb); setShowFeedbackImpact(true); }}><Eye className="h-4 w-4 mr-2" />Analyser Impact</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Sources de Données</CardTitle>
                <CardDescription>Gestion et qualité des données d'entraînement</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowNewDataset(true)}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {datasets.map((ds) => (
                  <div key={ds.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{ds.name}</h4>
                      <Badge variant="outline">{ds.sync_frequency}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Enregistrements:</span><span className="font-medium">{ds.records_count.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Qualité:</span><span className="font-medium">{ds.quality_score}%</span></div>
                      <div className="flex justify-between"><span>Source:</span><span className="font-medium">{ds.source_name || ds.source_type}</span></div>
                      <div className="flex justify-between"><span>Dernière MAJ:</span><span className="font-medium">{ds.last_sync_at ? format(new Date(ds.last_sync_at), 'dd/MM/yyyy', { locale: fr }) : '-'}</span></div>
                    </div>
                    <Progress value={Number(ds.quality_score)} className="mt-3" />
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => syncDataset(ds.id)} disabled={isSyncing}><RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />Sync</Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedDataset(ds); setShowDatasetConfig(true); }}><Settings className="h-4 w-4 mr-2" />Config</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Performance des Modèles</CardTitle>
                <CardDescription>Évolution des performances dans le temps</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportTrainingReportToPDF(metrics, models, sessions)}><Download className="h-4 w-4 mr-2" />Export PDF</Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center p-4 bg-green-50 rounded-lg"><div className="text-3xl font-bold text-green-600">{avgAccuracy}%</div><div className="text-sm text-green-700">Précision Moyenne</div><div className="text-xs text-muted-foreground">+{metrics?.avgAccuracyGain || 0}% ce mois</div></div>
                <div className="text-center p-4 bg-blue-50 rounded-lg"><div className="text-3xl font-bold text-blue-600">{models.filter(m => m.status === 'active').length}</div><div className="text-sm text-blue-700">Modèles Actifs</div><div className="text-xs text-muted-foreground">sur {models.length} total</div></div>
                <div className="text-center p-4 bg-purple-50 rounded-lg"><div className="text-3xl font-bold text-purple-600">{sessions.filter(s => s.status === 'completed').length}</div><div className="text-sm text-purple-700">Sessions Terminées</div><div className="text-xs text-muted-foreground">ce mois</div></div>
              </div>
              <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2"><Target className="h-4 w-4 text-orange-600" /><h4 className="font-medium text-orange-800">Recommandations</h4></div>
                <ul className="space-y-1 text-sm text-orange-700">
                  {models.filter(m => Number(m.accuracy) < 85).length > 0 && <li>• {models.filter(m => Number(m.accuracy) < 85).length} modèle(s) sous le seuil de 85%</li>}
                  {datasets.filter(d => Number(d.quality_score) < 80).length > 0 && <li>• Améliorer la qualité des données pour {datasets.filter(d => Number(d.quality_score) < 80).length} dataset(s)</li>}
                  <li>• Planifier les formations pendant les heures creuses</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <LearningModelDetailDialog open={showModelDetail} onOpenChange={setShowModelDetail} model={selectedModel} sessions={sessions} onStartTraining={(id) => startTraining({ modelId: id })} />
      <LearningModelConfigDialog open={showModelConfig} onOpenChange={setShowModelConfig} model={selectedModel} onSave={updateModel} />
      <LearningModelConfigDialog open={showNewModel} onOpenChange={setShowNewModel} model={null} onSave={() => {}} onCreate={createModel} isCreating />
      <LearningFeedbackDialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm} models={models} onSubmit={createFeedback} />
      <FeedbackImpactDialog open={showFeedbackImpact} onOpenChange={setShowFeedbackImpact} feedback={selectedFeedback} onApply={applyFeedback} />
      <DatasetConfigDialog open={showDatasetConfig} onOpenChange={setShowDatasetConfig} dataset={selectedDataset} onSave={updateDataset} />
      <DatasetConfigDialog open={showNewDataset} onOpenChange={setShowNewDataset} dataset={null} onSave={() => {}} onCreate={createDataset} isCreating />
      <MLConfigDialog open={showMLConfig} onOpenChange={setShowMLConfig} config={config} onSave={saveConfig} />
    </div>
  );
};

export default ContinuousLearning;
