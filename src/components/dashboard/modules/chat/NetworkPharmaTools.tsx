import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  Pill,
  Heart,
  Brain,
  Thermometer,
  Shield,
  AlertTriangle,
  CheckCircle,
  Search,
  BookOpen,
  FileText,
  Database,
  Zap,
  Users,
  Share2,
  Download,
  Barcode,
  Calculator,
  Settings,
  Info,
  Award,
  Stethoscope,
  Globe,
  Plus,
  RefreshCw,
  Eye,
  ExternalLink
} from 'lucide-react';
import { useNetworkPharmaTools } from '@/hooks/useNetworkPharmaTools';
import { exportDrugsToExcel, exportDrugsToPDF, exportAlertsToExcel, exportAlertsToPDF, exportInteractionsToExcel, exportSpecialtiesToExcel } from '@/utils/pharmaToolsExportUtils';
import DrugDetailDialog from './dialogs/DrugDetailDialog';
import CreateInteractionDialog from './dialogs/CreateInteractionDialog';
import InteractionResultDialog from './dialogs/InteractionResultDialog';
import CreateAlertDialog from './dialogs/CreateAlertDialog';
import CreateSpecialtyDialog from './dialogs/CreateSpecialtyDialog';
import ToolConfigDialog from './dialogs/ToolConfigDialog';

const NetworkPharmaTools = () => {
  const {
    loading,
    metrics,
    drugDatabase,
    drugsPagination,
    interactions,
    clinicalAlerts,
    specialties,
    toolConfigs,
    loadDrugDatabase,
    loadInteractions,
    checkInteraction,
    createInteraction,
    loadClinicalAlerts,
    createAlert,
    acknowledgeAlert,
    loadSpecialties,
    createSpecialty,
    loadToolConfigs,
    updateToolConfig,
    refreshAllData
  } = useNetworkPharmaTools();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [alertTypeFilter, setAlertTypeFilter] = useState('all');
  const [alertSeverityFilter, setAlertSeverityFilter] = useState('all');
  
  // Dialog states
  const [selectedDrug, setSelectedDrug] = useState<any>(null);
  const [drugDetailOpen, setDrugDetailOpen] = useState(false);
  const [createInteractionOpen, setCreateInteractionOpen] = useState(false);
  const [interactionResultOpen, setInteractionResultOpen] = useState(false);
  const [interactionResults, setInteractionResults] = useState<any[]>([]);
  const [createAlertOpen, setCreateAlertOpen] = useState(false);
  const [createSpecialtyOpen, setCreateSpecialtyOpen] = useState(false);
  const [toolConfigOpen, setToolConfigOpen] = useState(false);

  // Interaction check state
  const [drug1Id, setDrug1Id] = useState('');
  const [drug2Id, setDrug2Id] = useState('');

  // Debounced search for drugs
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDrugDatabase(searchTerm, selectedCategory, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory]);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return clinicalAlerts.filter(alert => {
      const matchesType = alertTypeFilter === 'all' || alert.alert_type === alertTypeFilter;
      const matchesSeverity = alertSeverityFilter === 'all' || alert.severity === alertSeverityFilter;
      return matchesType && matchesSeverity;
    });
  }, [clinicalAlerts, alertTypeFilter, alertSeverityFilter]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': case 'contraindicated': case 'major': return 'bg-destructive text-destructive-foreground';
      case 'warning': case 'moderate': return 'bg-orange-500 text-white';
      case 'info': case 'minor': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': case 'contraindicated': case 'major': return 'destructive';
      case 'warning': case 'moderate': return 'secondary';
      default: return 'outline';
    }
  };

  const getDrug1Name = () => drugDatabase.find(d => d.id === drug1Id)?.name || '';
  const getDrug2Name = () => drugDatabase.find(d => d.id === drug2Id)?.name || '';

  const handleCheckInteraction = async () => {
    if (!drug1Id || !drug2Id) {
      return;
    }
    
    const results = await checkInteraction(drug1Id, drug2Id, getDrug1Name(), getDrug2Name());
    setInteractionResults(results);
    setInteractionResultOpen(true);
  };

  const handleCreateInteraction = async (data: any) => {
    await createInteraction(data);
    setCreateInteractionOpen(false);
  };

  const handleCreateAlert = async (data: any) => {
    await createAlert(data);
    setCreateAlertOpen(false);
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    await acknowledgeAlert(alertId, 'current_user');
  };

  const handleCreateSpecialty = async (data: any) => {
    await createSpecialty(data);
    setCreateSpecialtyOpen(false);
  };

  const handleSaveToolConfig = (config: any) => {
    // Save configuration (would update via updateToolConfig if we had the config ID)
    setToolConfigOpen(false);
  };

  const handleExportDrugs = (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      exportDrugsToExcel(drugDatabase);
    } else {
      exportDrugsToPDF(drugDatabase);
    }
  };

  const handleExportAlerts = (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      exportAlertsToExcel(filteredAlerts);
    } else {
      exportAlertsToPDF(filteredAlerts);
    }
  };

  if (loading && drugDatabase.length === 0 && interactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Pill className="h-8 w-8 animate-pulse mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Chargement des outils pharmaceutiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Pill className="h-8 w-8 text-primary" />
            Pharma Tools Réseau Spécialisés
          </h1>
          <p className="text-muted-foreground">
            Outils pharmaceutiques avancés et spécialisés pour le réseau multi-officines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refreshAllData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={() => setToolConfigOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
        </div>
      </div>

      {/* Métriques pharmaceutiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base Médicaments</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDrugs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Références disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Actives</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.criticalAlerts} critiques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
            <Zap className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.interactionsCount}</div>
            <p className="text-xs text-muted-foreground">
              Vérifications disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spécialités</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{specialties.length}</div>
            <p className="text-xs text-muted-foreground">
              Domaines d'expertise
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="drugs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="drugs">Base Médicaments</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="specialties">Spécialités</TabsTrigger>
          <TabsTrigger value="tools">Outils</TabsTrigger>
        </TabsList>

        {/* Base de données médicaments */}
        <TabsContent value="drugs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Base de Données Médicaments
                  </CardTitle>
                  <CardDescription>
                    {drugsPagination.total.toLocaleString()} références • Page {drugsPagination.page}/{drugsPagination.totalPages || 1}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportDrugs('excel')}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExportDrugs('pdf')}>
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom, DCI, ou code CIP..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    <SelectItem value="prescription">Sur prescription</SelectItem>
                    <SelectItem value="otc">Automédication</SelectItem>
                    <SelectItem value="generic">Génériques</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {drugDatabase.map((drug) => (
                      <div key={drug.id} className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{drug.name}</h4>
                              {drug.prescription_required && (
                                <Badge variant="outline" className="text-xs">
                                  Prescription
                                </Badge>
                              )}
                              {drug.is_generic && (
                                <Badge variant="secondary" className="text-xs">
                                  Générique
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              DCI: {drug.dci || 'N/A'} • {drug.therapeutic_class || 'Non classé'}
                            </p>
                            <div className="grid gap-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-4">
                                <span>CIP: {drug.cip_code || 'N/A'}</span>
                                <span>Prix: {drug.price?.toLocaleString()} FCFA</span>
                                <span>Forme: {drug.form || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedDrug(drug);
                                setDrugDetailOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Détails
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <Barcode className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{drug.atc_code || drug.cip_code}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {drug.manufacturer && (
                              <Badge variant="secondary" className="text-xs">
                                {drug.manufacturer}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Pagination */}
              {drugsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Affichage {((drugsPagination.page - 1) * 50) + 1} - {Math.min(drugsPagination.page * 50, drugsPagination.total)} sur {drugsPagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={drugsPagination.page <= 1}
                      onClick={() => loadDrugDatabase(searchTerm, selectedCategory, drugsPagination.page - 1)}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={drugsPagination.page >= drugsPagination.totalPages}
                      onClick={() => loadDrugDatabase(searchTerm, selectedCategory, drugsPagination.page + 1)}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interactions médicamenteuses */}
        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Vérificateur d'Interactions
                  </CardTitle>
                  <CardDescription>
                    Analyse des interactions médicamenteuses potentielles
                  </CardDescription>
                </div>
                <Button onClick={() => setCreateInteractionOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle interaction
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Premier médicament</Label>
                    <Select value={drug1Id} onValueChange={setDrug1Id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un médicament" />
                      </SelectTrigger>
                      <SelectContent>
                        {drugDatabase.map((drug) => (
                          <SelectItem key={drug.id} value={drug.id}>
                            {drug.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Deuxième médicament</Label>
                    <Select value={drug2Id} onValueChange={setDrug2Id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un médicament" />
                      </SelectTrigger>
                      <SelectContent>
                        {drugDatabase.map((drug) => (
                          <SelectItem key={drug.id} value={drug.id}>
                            {drug.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button className="w-full" onClick={handleCheckInteraction} disabled={!drug1Id || !drug2Id}>
                  <Search className="h-4 w-4 mr-2" />
                  Vérifier les interactions
                </Button>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Interactions connues ({interactions.length})</h4>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => exportInteractionsToExcel(interactions)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ScrollArea className="h-80">
                      <div className="space-y-3">
                        {interactions.map((interaction) => (
                          <div key={interaction.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getSeverityColor(interaction.severity)}`}>
                                  <AlertTriangle className="h-4 w-4" />
                                </div>
                                <div>
                                  <h5 className="font-medium">
                                    {interaction.drug1_name} + {interaction.drug2_name}
                                  </h5>
                                  <Badge variant={getSeverityBadge(interaction.severity) as any} className="text-xs mt-1">
                                    {interaction.severity}
                                  </Badge>
                                </div>
                              </div>
                              {interaction.is_network_shared && (
                                <Badge variant="outline" className="text-xs">
                                  <Share2 className="h-3 w-3 mr-1" />
                                  Réseau
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Mécanisme:</span> {interaction.mechanism}
                              </div>
                              <div>
                                <span className="font-medium">Effet clinique:</span> {interaction.clinical_effect}
                              </div>
                              <div>
                                <span className="font-medium">Conduite à tenir:</span> {interaction.management}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertes cliniques */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Alertes et Vigilances
                  </CardTitle>
                  <CardDescription>
                    Alertes sanitaires et informations de sécurité ({filteredAlerts.length} alertes)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportAlerts('excel')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={() => setCreateAlertOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle alerte
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <Select value={alertTypeFilter} onValueChange={setAlertTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Type d'alerte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="drug_alert">Alerte médicament</SelectItem>
                    <SelectItem value="interaction">Interaction</SelectItem>
                    <SelectItem value="recall">Rappel</SelectItem>
                    <SelectItem value="shortage">Rupture</SelectItem>
                    <SelectItem value="regulatory">Réglementaire</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={alertSeverityFilter} onValueChange={setAlertSeverityFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sévérité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes sévérités</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                    <SelectItem value="warning">Attention</SelectItem>
                    <SelectItem value="info">Information</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {filteredAlerts.map((alert) => (
                      <div key={alert.id} className={`p-4 border rounded-lg ${alert.is_acknowledged ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getSeverityColor(alert.severity)}`}>
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="font-medium">{alert.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {alert.alert_type.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {alert.source || 'PharmaSoft'}
                                </Badge>
                                {alert.is_acknowledged && (
                                  <Badge variant="secondary" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Acquittée
                                  </Badge>
                                )}
                                {alert.is_network_alert && (
                                  <Badge variant="outline" className="text-xs">
                                    <Share2 className="h-3 w-3 mr-1" />
                                    Réseau
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div>{alert.date_issued ? new Date(alert.date_issued).toLocaleDateString('fr-FR') : 'N/A'}</div>
                            {alert.expiry_date && (
                              <div className="text-xs">Expire: {new Date(alert.expiry_date).toLocaleDateString('fr-FR')}</div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
                        
                        {alert.affected_drugs && alert.affected_drugs.length > 0 && (
                          <div className="mb-3">
                            <h5 className="font-medium text-sm mb-2">Médicaments concernés:</h5>
                            <div className="flex flex-wrap gap-1">
                              {alert.affected_drugs.map((drug: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {drug}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {alert.actions_required && alert.actions_required.length > 0 && (
                          <div className="mb-3">
                            <h5 className="font-medium text-sm mb-2">Actions requises:</h5>
                            <ul className="text-sm list-disc list-inside space-y-1">
                              {alert.actions_required.map((action: string, idx: number) => (
                                <li key={idx}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {!alert.is_acknowledged && (
                          <div className="flex justify-end mt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Acquitter
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spécialités pharmaceutiques */}
        <TabsContent value="specialties" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Spécialités Pharmaceutiques
                  </CardTitle>
                  <CardDescription>
                    Domaines d'expertise et protocoles spécialisés
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportSpecialtiesToExcel(specialties)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={() => setCreateSpecialtyOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle spécialité
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {specialties.map((specialty) => (
                    <div key={specialty.id} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Stethoscope className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{specialty.name}</h4>
                            {specialty.is_active && (
                              <Badge variant="secondary" className="text-xs">Actif</Badge>
                            )}
                            {specialty.is_network_shared && (
                              <Badge variant="outline" className="text-xs">
                                <Share2 className="h-3 w-3 mr-1" />
                                Réseau
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{specialty.description}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {specialty.certifications && specialty.certifications.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">Certifications requises</h5>
                            <div className="flex flex-wrap gap-1">
                              {specialty.certifications.map((cert: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {specialty.protocols && specialty.protocols.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">Protocoles</h5>
                            <ul className="text-xs text-muted-foreground list-disc list-inside">
                              {specialty.protocols.slice(0, 2).map((protocol: string, idx: number) => (
                                <li key={idx}>{protocol}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {specialty.equipment && specialty.equipment.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">Équipement</h5>
                            <ul className="text-xs text-muted-foreground list-disc list-inside">
                              {specialty.equipment.slice(0, 2).map((equip: string, idx: number) => (
                                <li key={idx}>{equip}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-4">
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Protocoles
                          </Button>
                          <Button variant="outline" size="sm">
                            <Users className="h-4 w-4 mr-2" />
                            Formation
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outils supplémentaires */}
        <TabsContent value="tools" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calculateurs Cliniques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start" onClick={() => window.open('https://www.mdcalc.com/gfr-calculator-cockcroft-gault', '_blank')}>
                  <Heart className="h-4 w-4 mr-2" />
                  Calcul DFG (Cockcroft, MDRD)
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.open('https://www.peditools.org', '_blank')}>
                  <Pill className="h-4 w-4 mr-2" />
                  Posologie pédiatrique
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.open('https://www.unitconverters.net', '_blank')}>
                  <Thermometer className="h-4 w-4 mr-2" />
                  Conversion d'unités
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.open('https://www.americangeriatrics.org/beers-criteria', '_blank')}>
                  <Brain className="h-4 w-4 mr-2" />
                  Score de Beers (médicaments gériatriques)
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Ressources Externes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start" onClick={() => window.open('https://ansm.sante.fr/tableau-iam/', '_blank')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Thesaurus ANSM
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.open('https://www.bcbdexther.fr', '_blank')}>
                  <Database className="h-4 w-4 mr-2" />
                  Base Claude Bernard
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.open('https://base-donnees-publique.medicaments.gouv.fr', '_blank')}>
                  <FileText className="h-4 w-4 mr-2" />
                  RCP et notices
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.open('https://signalement.social-sante.gouv.fr', '_blank')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Portail de signalement ANSM
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Tool Configurations */}
          {toolConfigs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration des Outils
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {toolConfigs.map((config) => (
                    <div 
                      key={config.id} 
                      className="p-4 border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setToolConfigOpen(true)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{config.tool_name}</h5>
                        <Badge variant={config.is_enabled ? 'secondary' : 'outline'}>
                          {config.is_enabled ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{config.tool_type}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DrugDetailDialog
        open={drugDetailOpen}
        onOpenChange={setDrugDetailOpen}
        drug={selectedDrug}
      />

      <CreateInteractionDialog
        open={createInteractionOpen}
        onOpenChange={setCreateInteractionOpen}
        drugs={drugDatabase}
        onSubmit={handleCreateInteraction}
      />

      <InteractionResultDialog
        open={interactionResultOpen}
        onOpenChange={setInteractionResultOpen}
        drug1Name={getDrug1Name()}
        drug2Name={getDrug2Name()}
        interactions={interactionResults}
      />

      <CreateAlertDialog
        open={createAlertOpen}
        onOpenChange={setCreateAlertOpen}
        onSubmit={handleCreateAlert}
      />

      <CreateSpecialtyDialog
        open={createSpecialtyOpen}
        onOpenChange={setCreateSpecialtyOpen}
        onSubmit={handleCreateSpecialty}
      />

      <ToolConfigDialog
        open={toolConfigOpen}
        onOpenChange={setToolConfigOpen}
        onSave={handleSaveToolConfig}
      />
    </div>
  );
};

export default NetworkPharmaTools;
