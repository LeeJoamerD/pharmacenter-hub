import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Pill, AlertTriangle, Shield, Search, Book, FileText, Target, CheckCircle, XCircle, 
  Clock, Brain, Zap, Eye, Info, Settings, Plus, Trash2, Download, RefreshCw
} from 'lucide-react';
import { usePharmaceuticalExpert } from '@/hooks/usePharmaceuticalExpert';
import { useTenant } from '@/contexts/TenantContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import PharmaExpertConfigDialog from './dialogs/PharmaExpertConfigDialog';
import DrugDetailDialog from './dialogs/DrugDetailDialog';
import InteractionCheckDialog from './dialogs/InteractionCheckDialog';
import TherapeuticRecommendationDialog from './dialogs/TherapeuticRecommendationDialog';
import ComplianceReportDialog from './dialogs/ComplianceReportDialog';
import AIConsultationDialog from './dialogs/AIConsultationDialog';
import { exportDrugDatabasePDF, exportInteractionsPDF, exportRecommendationsPDF, exportPharmacovigilancePDF } from '@/utils/pharmaExpertExportUtils';

const PharmaceuticalExpert = () => {
  const { currentTenant } = useTenant();
  const {
    loading, metrics, drugDatabase, interactions, recommendations,
    pharmacovigilanceAlerts, complianceChecks, config,
    loadDrugs, checkInteraction, createInteraction, deleteInteraction,
    createRecommendation, updateRecommendation, deleteRecommendation,
    acknowledgeAlert, runComplianceCheck, askAI, saveConfig, drugsPagination
  } = usePharmaceuticalExpert();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrug, setSelectedDrug] = useState<any>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [drugDetailOpen, setDrugDetailOpen] = useState(false);
  const [interactionCheckOpen, setInteractionCheckOpen] = useState(false);
  const [recommendationDialogOpen, setRecommendationDialogOpen] = useState(false);
  const [editingRecommendation, setEditingRecommendation] = useState<any>(null);
  const [complianceReportOpen, setComplianceReportOpen] = useState(false);
  const [selectedCompliance, setSelectedCompliance] = useState<any>(null);
  const [aiConsultationOpen, setAiConsultationOpen] = useState(false);

  const pharmacyName = currentTenant?.name || 'Pharmacie';

  const handleSearch = () => {
    loadDrugs(searchQuery);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'major': case 'contraindicated': case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate': case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Système Expert Pharmaceutique</h2>
          <p className="text-muted-foreground">
            Intelligence artificielle spécialisée en pharmacologie et thérapeutique
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => exportRecommendationsPDF(recommendations, pharmacyName)}>
            <Book className="h-4 w-4 mr-2" />
            Guide Thérapeutique
          </Button>
          <Button size="sm" onClick={() => setAiConsultationOpen(true)}>
            <Brain className="h-4 w-4 mr-2" />
            Consultation IA
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setConfigOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-4"><div className="flex justify-between"><div><p className="text-sm text-muted-foreground">Médicaments</p><p className="text-2xl font-bold">{metrics.drugsCount}</p></div><Pill className="h-8 w-8 text-blue-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex justify-between"><div><p className="text-sm text-muted-foreground">Interactions</p><p className="text-2xl font-bold">{metrics.interactionsCount}</p></div><Shield className="h-8 w-8 text-orange-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex justify-between"><div><p className="text-sm text-muted-foreground">Alertes Actives</p><p className="text-2xl font-bold">{metrics.activeAlerts}</p></div><AlertTriangle className="h-8 w-8 text-red-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex justify-between"><div><p className="text-sm text-muted-foreground">Score Conformité</p><p className="text-2xl font-bold">{metrics.complianceScore}%</p></div><CheckCircle className="h-8 w-8 text-green-500" /></div></CardContent></Card>
      </div>

      {/* Recherche rapide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" />Recherche Médicament</CardTitle>
          <CardDescription>Recherchez des informations complètes sur les médicaments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input placeholder="Nom du médicament ou DCI..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            <Button onClick={handleSearch} disabled={loading}><Search className="h-4 w-4 mr-2" />Rechercher</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="knowledge-base" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="knowledge-base">Base Médicaments</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          <TabsTrigger value="pharmacovigilance">Pharmacovigilance</TabsTrigger>
          <TabsTrigger value="compliance">Conformité</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge-base" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{drugsPagination.total} médicaments trouvés</p>
            <Button variant="outline" size="sm" onClick={() => exportDrugDatabasePDF(drugDatabase, pharmacyName)}><Download className="h-4 w-4 mr-2" />Exporter</Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {drugDatabase.map((drug) => (
              <Card key={drug.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5" />{drug.name}</CardTitle>
                  <CardDescription>{drug.genericName} • {drug.therapeuticClass}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-50 text-green-600">Remb. {drug.reimbursement}%</Badge>
                      <span className="font-medium">{drug.price.toFixed(2)}€</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedDrug(drug); setDrugDetailOpen(true); }}><Info className="h-4 w-4 mr-2" />Détails</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Vérificateur d'Interactions</CardTitle>
              <CardDescription>Détection automatique des interactions médicamenteuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interactions.slice(0, 10).map((interaction) => (
                  <div key={interaction.id} className={`p-4 border rounded-lg ${getSeverityColor(interaction.severity)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div><h4 className="font-semibold">{interaction.drug1_name} + {interaction.drug2_name}</h4>
                        <Badge className={getSeverityColor(interaction.severity)}>{interaction.severity === 'major' ? 'Majeure' : interaction.severity === 'contraindicated' ? 'Contre-indiquée' : interaction.severity === 'moderate' ? 'Modérée' : 'Mineure'}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteInteraction(interaction.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    {interaction.clinical_effect && <p className="text-sm mb-2">{interaction.clinical_effect}</p>}
                    {interaction.management && <div className="bg-blue-50 p-3 rounded border border-blue-200"><h5 className="font-medium text-blue-800 mb-1">Recommandation:</h5><p className="text-sm text-blue-700">{interaction.management}</p></div>}
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2"><Zap className="h-5 w-5 text-green-600" /><h4 className="font-semibold text-green-800">Vérification Automatique</h4></div>
                <p className="text-sm text-green-700 mb-3">L'IA vérifie automatiquement les interactions lors de chaque prescription</p>
                <Button size="sm" onClick={() => setInteractionCheckOpen(true)}><Search className="h-4 w-4 mr-2" />Vérifier Nouvelle Interaction</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Recommandations Thérapeutiques</CardTitle><CardDescription>Protocoles et guidelines basés sur l'évidence</CardDescription></div>
              <Button size="sm" onClick={() => { setEditingRecommendation(null); setRecommendationDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between"><h4 className="font-semibold text-lg mb-3">{rec.condition_name}</h4>
                      <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => { setEditingRecommendation(rec); setRecommendationDialogOpen(true); }}><Info className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => deleteRecommendation(rec.id)}><Trash2 className="h-4 w-4" /></Button></div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div><h5 className="font-medium text-green-700 mb-2">Première intention</h5><div className="space-y-1">{rec.first_line_treatments.map((drug, i) => <Badge key={i} className="bg-green-50 text-green-700 mr-1">{drug.name}</Badge>)}</div></div>
                      <div><h5 className="font-medium text-blue-700 mb-2">Alternatives</h5><div className="space-y-1">{rec.alternative_treatments.map((alt, i) => <Badge key={i} className="bg-blue-50 text-blue-700 mr-1">{alt.name}</Badge>)}</div></div>
                    </div>
                    {rec.contraindications && <div className="mt-4 flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" /><div><span className="font-medium text-red-700">Contre-indications: </span><span className="text-sm">{rec.contraindications}</span></div></div>}
                    {rec.duration && <div className="flex items-start gap-2"><Clock className="h-4 w-4 text-blue-600 mt-0.5" /><div><span className="font-medium text-blue-700">Durée: </span><span className="text-sm">{rec.duration}</span></div></div>}
                    {rec.monitoring && <div className="flex items-start gap-2"><Eye className="h-4 w-4 text-purple-600 mt-0.5" /><div><span className="font-medium text-purple-700">Surveillance: </span><span className="text-sm">{rec.monitoring}</span></div></div>}
                  </div>
                ))}
                {recommendations.length === 0 && <p className="text-center text-muted-foreground py-8">Aucune recommandation. Cliquez sur "Ajouter" pour en créer.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pharmacovigilance" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Alertes Pharmacovigilance</CardTitle><CardDescription>Informations de sécurité et rappels de produits</CardDescription></div>
              <Button variant="outline" size="sm" onClick={() => exportPharmacovigilancePDF(pharmacovigilanceAlerts, pharmacyName)}><Download className="h-4 w-4 mr-2" />Exporter</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pharmacovigilanceAlerts.map((alert) => (
                  <div key={alert.id} className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div><h4 className="font-semibold">{alert.title}</h4><div className="flex items-center gap-2 mt-1"><Badge className={getSeverityColor(alert.severity)}>{alert.severity === 'critical' ? 'Critique' : alert.severity === 'warning' ? 'Attention' : 'Information'}</Badge><span className="text-xs text-muted-foreground">{alert.source} • {format(new Date(alert.date_issued), 'dd/MM/yyyy', { locale: fr })}</span></div></div>
                      {!alert.is_acknowledged && <Button size="sm" onClick={() => acknowledgeAlert(alert.id)}>Acquitter</Button>}
                    </div>
                    <p className="text-sm mb-2">{alert.description}</p>
                    {alert.affected_drugs.length > 0 && <div className="flex flex-wrap gap-1">{alert.affected_drugs.map((drug, i) => <Badge key={i} variant="outline">{drug}</Badge>)}</div>}
                    {alert.is_acknowledged && <Badge variant="secondary" className="mt-2"><CheckCircle className="h-3 w-3 mr-1" />Acquitté</Badge>}
                  </div>
                ))}
                {pharmacovigilanceAlerts.length === 0 && <p className="text-center text-muted-foreground py-8">Aucune alerte de pharmacovigilance active</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Contrôle de Conformité Réglementaire</CardTitle>
              <CardDescription>Suivi de la conformité des produits réglementés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Stupéfiants', 'Liste I', 'Liste II', 'Produits Froid'].map((category) => {
                  const check = complianceChecks.find(c => c.category === category);
                  return (
                    <div key={category} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">{getComplianceIcon(check?.status || 'pending')}<div><h4 className="font-medium">{category}</h4><p className="text-sm text-muted-foreground">{check ? `${check.items_count} produits, ${check.issues_count} problèmes` : 'Non vérifié'}</p></div></div>
                      <div className="flex items-center gap-2">
                        {check && <Button variant="outline" size="sm" onClick={() => { setSelectedCompliance(check); setComplianceReportOpen(true); }}><FileText className="h-4 w-4 mr-2" />Rapport</Button>}
                        <Button size="sm" onClick={() => runComplianceCheck(category)} disabled={loading}><RefreshCw className="h-4 w-4 mr-2" />Contrôler</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PharmaExpertConfigDialog open={configOpen} onOpenChange={setConfigOpen} config={config} onSave={saveConfig} />
      <DrugDetailDialog open={drugDetailOpen} onOpenChange={setDrugDetailOpen} drug={selectedDrug} />
      <InteractionCheckDialog open={interactionCheckOpen} onOpenChange={setInteractionCheckOpen} onCheck={checkInteraction} />
      <TherapeuticRecommendationDialog open={recommendationDialogOpen} onOpenChange={setRecommendationDialogOpen} recommendation={editingRecommendation} onSave={editingRecommendation ? (data) => updateRecommendation(editingRecommendation.id, data) : createRecommendation} />
      <ComplianceReportDialog open={complianceReportOpen} onOpenChange={setComplianceReportOpen} check={selectedCompliance} allChecks={complianceChecks} pharmacyName={pharmacyName} />
      <AIConsultationDialog open={aiConsultationOpen} onOpenChange={setAiConsultationOpen} onAsk={askAI} />
    </div>
  );
};

export default PharmaceuticalExpert;
