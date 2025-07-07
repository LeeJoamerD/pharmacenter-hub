import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Pill,
  Microscope,
  FlaskConical,
  Thermometer,
  Heart,
  Brain,
  Eye,
  Stethoscope,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  BookOpen,
  FileText,
  Database,
  Zap,
  Target,
  TrendingUp,
  Users,
  Share2,
  Download,
  Upload,
  QrCode,
  Barcode,
  Calculator,
  Settings,
  Info,
  Star,
  Award,
  Activity,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Globe,
  Smartphone
} from 'lucide-react';
import { useNetworkMessaging } from '@/hooks/useNetworkMessaging';

interface DrugInfo {
  id: string;
  name: string;
  dci: string;
  therapeutic_class: string;
  form: string;
  dosage: string;
  manufacturer: string;
  atc_code: string;
  cip_code: string;
  price: number;
  reimbursement_rate: number;
  prescription_required: boolean;
  contraindications: string[];
  interactions: string[];
  side_effects: string[];
  storage_conditions: string;
  expiry_monitoring: boolean;
}

interface DrugInteraction {
  id: string;
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  mechanism: string;
  clinical_effect: string;
  management: string;
  references: string[];
}

interface ClinicalAlert {
  id: string;
  type: 'drug_alert' | 'interaction' | 'recall' | 'shortage' | 'regulatory';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  affected_drugs: string[];
  source: string;
  date_issued: string;
  expiry_date?: string;
  actions_required: string[];
}

interface PharmacySpecialty {
  id: string;
  name: string;
  description: string;
  certifications: string[];
  protocols: string[];
  equipment: string[];
  staff_requirements: string[];
  patient_demographics: string;
}

const NetworkPharmaTools = () => {
  const { pharmacies, loading } = useNetworkMessaging();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDrug, setSelectedDrug] = useState<string>('');
  const [drugDatabase, setDrugDatabase] = useState<DrugInfo[]>([]);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [clinicalAlerts, setClinicalAlerts] = useState<ClinicalAlert[]>([]);
  const [specialties, setSpecialties] = useState<PharmacySpecialty[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadPharmaData();
  }, []);

  const loadPharmaData = () => {
    // Base de données médicaments
    const mockDrugs: DrugInfo[] = [
      {
        id: '1',
        name: 'Paracétamol Doliprane 1000mg',
        dci: 'Paracétamol',
        therapeutic_class: 'Antalgique - Antipyrétique',
        form: 'Comprimé',
        dosage: '1000mg',
        manufacturer: 'Sanofi',
        atc_code: 'N02BE01',
        cip_code: '3400935556066',
        price: 2.18,
        reimbursement_rate: 65,
        prescription_required: false,
        contraindications: ['Insuffisance hépatique sévère', 'Allergie au paracétamol'],
        interactions: ['Warfarine (surveillance INR)', 'Alcool (risque hépatotoxique)'],
        side_effects: ['Rares: éruptions cutanées', 'Très rares: troubles hématologiques'],
        storage_conditions: 'Température < 25°C, à l\'abri de l\'humidité',
        expiry_monitoring: true
      },
      {
        id: '2',
        name: 'Amoxicilline Biogaran 1g',
        dci: 'Amoxicilline',
        therapeutic_class: 'Antibiotique bêta-lactamine',
        form: 'Gélule',
        dosage: '1000mg',
        manufacturer: 'Biogaran',
        atc_code: 'J01CA04',
        cip_code: '3400936703869',
        price: 3.45,
        reimbursement_rate: 65,
        prescription_required: true,
        contraindications: ['Allergie aux pénicillines', 'Mononucléose infectieuse'],
        interactions: ['Méthotrexate', 'Anticoagulants oraux'],
        side_effects: ['Troubles digestifs', 'Réactions allergiques', 'Candidoses'],
        storage_conditions: 'Température < 25°C, durée de traitement limitée',
        expiry_monitoring: true
      },
      {
        id: '3',
        name: 'Levothyrox 75µg',
        dci: 'Lévothyroxine',
        therapeutic_class: 'Hormone thyroïdienne',
        form: 'Comprimé sécable',
        dosage: '75µg',
        manufacturer: 'Merck',
        atc_code: 'H03AA01',
        cip_code: '3400930125786',
        price: 2.76,
        reimbursement_rate: 65,
        prescription_required: true,
        contraindications: ['Thyrotoxicose', 'Insuffisance corticosurrénalienne non traitée'],
        interactions: ['Anticoagulants', 'Antidiabétiques', 'Digitaliques'],
        side_effects: ['Signes de surdosage thyroïdien', 'Palpitations', 'Insomnie'],
        storage_conditions: 'À l\'abri de la lumière et de l\'humidité',
        expiry_monitoring: true
      }
    ];

    // Interactions médicamenteuses
    const mockInteractions: DrugInteraction[] = [
      {
        id: '1',
        drug1: 'Warfarine',
        drug2: 'Paracétamol',
        severity: 'moderate',
        mechanism: 'Inhibition enzymatique',
        clinical_effect: 'Augmentation de l\'effet anticoagulant',
        management: 'Surveillance rapprochée de l\'INR, adaptation posologique si nécessaire',
        references: ['Thesaurus ANSM', 'Vidal 2024']
      },
      {
        id: '2',
        drug1: 'Méthotrexate',
        drug2: 'Amoxicilline',
        severity: 'major',
        mechanism: 'Diminution de l\'élimination rénale',
        clinical_effect: 'Risque de toxicité du méthotrexate',
        management: 'Association déconseillée. Si nécessaire, surveillance biologique stricte',
        references: ['RCP Méthotrexate', 'Lexicomp']
      }
    ];

    // Alertes cliniques
    const mockAlerts: ClinicalAlert[] = [
      {
        id: '1',
        type: 'drug_alert',
        title: 'Rappel de lot - Valsartan contaminé',
        description: 'Rappel immédiat des lots de Valsartan contaminés par des impuretés cancérigènes NDMA',
        severity: 'critical',
        affected_drugs: ['Valsartan Mylan', 'Valsartan Zentiva'],
        source: 'ANSM',
        date_issued: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        actions_required: [
          'Retirer immédiatement les lots concernés',
          'Contacter les patients concernés',
          'Proposer une alternative thérapeutique'
        ]
      },
      {
        id: '2',
        type: 'shortage',
        title: 'Rupture de stock - Augmentin sachets',
        description: 'Rupture temporaire des sachets Augmentin 1g/125mg, approvisionnement prévu dans 2 semaines',
        severity: 'warning',
        affected_drugs: ['Augmentin sachets 1g/125mg'],
        source: 'Laboratoire GSK',
        date_issued: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        actions_required: [
          'Orienter vers les alternatives disponibles',
          'Informer les prescripteurs'
        ]
      },
      {
        id: '3',
        type: 'regulatory',
        title: 'Nouvelle réglementation - Codéine pédiatrique',
        description: 'Interdiction de la codéine chez les enfants de moins de 12 ans depuis le 1er avril 2024',
        severity: 'info',
        affected_drugs: ['Tous médicaments contenant de la codéine'],
        source: 'EMA - ANSM',
        date_issued: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        actions_required: [
          'Vérifier l\'âge avant dispensation',
          'Proposer des alternatives adaptées'
        ]
      }
    ];

    // Spécialités pharmaceutiques
    const mockSpecialties: PharmacySpecialty[] = [
      {
        id: '1',
        name: 'Oncologie',
        description: 'Prise en charge des patients cancéreux, chimiothérapies orales, soins de support',
        certifications: ['Diplôme universitaire en oncologie', 'Formation chimiothérapies orales'],
        protocols: ['Protocole de dispensation sécurisée', 'Gestion des effets indésirables'],
        equipment: ['Hotte de préparation', 'Matériel de protection', 'Système de traçabilité'],
        staff_requirements: ['1 pharmacien spécialisé', '2 préparateurs formés'],
        patient_demographics: 'Patients cancéreux sous traitement oral, soins palliatifs'
      },
      {
        id: '2',
        name: 'Pédiatrie',
        description: 'Pharmacie spécialisée dans la prise en charge médicamenteuse des enfants',
        certifications: ['DU Pharmacie clinique pédiatrique', 'Formation préparations magistrales'],
        protocols: ['Calculs de doses pédiatriques', 'Préparations galéniques adaptées'],
        equipment: ['Balance de précision', 'Matériel de préparation stérile'],
        staff_requirements: ['1 pharmacien spécialisé pédiatrie'],
        patient_demographics: 'Nourrissons, enfants, adolescents jusqu\'à 18 ans'
      },
      {
        id: '3',
        name: 'Gériatrie',
        description: 'Optimisation thérapeutique chez la personne âgée, polymédication',
        certifications: ['Formation gérontologie', 'Certification iatrogénie médicamenteuse'],
        protocols: ['Revue de médication', 'Détection interactions', 'Aide à l\'observance'],
        equipment: ['Piluliers hebdomadaires', 'Logiciel d\'aide à la prescription'],
        staff_requirements: ['1 pharmacien gérontologue'],
        patient_demographics: 'Patients de plus de 65 ans, EHPAD, maintien à domicile'
      }
    ];

    setDrugDatabase(mockDrugs);
    setInteractions(mockInteractions);
    setClinicalAlerts(mockAlerts);
    setSpecialties(mockSpecialties);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': case 'contraindicated': case 'major': return 'bg-red-500';
      case 'warning': case 'moderate': return 'bg-orange-500';
      case 'info': case 'minor': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': case 'contraindicated': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': case 'major': return <AlertTriangle className="h-4 w-4" />;
      case 'info': case 'minor': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const filteredDrugs = drugDatabase.filter(drug =>
    drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drug.dci.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drug.cip_code.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Pill className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Chargement des outils pharmaceutiques...</p>
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
          <Button variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Synchroniser bases
          </Button>
          <Button>
            <BookOpen className="h-4 w-4 mr-2" />
            Guide d'utilisation
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
            <div className="text-2xl font-bold">{drugDatabase.length.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">{clinicalAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {clinicalAlerts.filter(a => a.severity === 'critical').length} critiques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
            <Zap className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interactions.length}</div>
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
                    Recherche et consultation d'informations médicamenteuses
                  </CardDescription>
                </div>
                <Button>
                  <QrCode className="h-4 w-4 mr-2" />
                  Scanner code
                </Button>
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

              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {filteredDrugs.map((drug) => (
                    <div key={drug.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{drug.name}</h4>
                            {drug.prescription_required && (
                              <Badge variant="outline" className="text-xs">
                                Prescription
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            DCI: {drug.dci} • {drug.therapeutic_class}
                          </p>
                          <div className="grid gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <span>Code CIP: {drug.cip_code}</span>
                              <span>Prix: {drug.price}€</span>
                              <span>Remb: {drug.reimbursement_rate}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Info className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                          <Button variant="outline" size="sm">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {selectedDrug === drug.id && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <h5 className="font-medium mb-2">Contre-indications</h5>
                              <ul className="text-sm text-muted-foreground list-disc list-inside">
                                {drug.contraindications.map((ci, idx) => (
                                  <li key={idx}>{ci}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-medium mb-2">Interactions</h5>
                              <ul className="text-sm text-muted-foreground list-disc list-inside">
                                {drug.interactions.map((interaction, idx) => (
                                  <li key={idx}>{interaction}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Barcode className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs">{drug.atc_code}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedDrug(selectedDrug === drug.id ? '' : drug.id)}
                        >
                          {selectedDrug === drug.id ? 'Réduire' : 'Développer'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interactions médicamenteuses */}
        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Vérificateur d'Interactions
              </CardTitle>
              <CardDescription>
                Analyse des interactions médicamenteuses potentielles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Premier médicament</Label>
                    <Select>
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
                    <Select>
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

                <Button className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Vérifier les interactions
                </Button>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4">Interactions connues</h4>
                  <div className="space-y-3">
                    {interactions.map((interaction) => (
                      <div key={interaction.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getSeverityColor(interaction.severity)}`}>
                              {getSeverityIcon(interaction.severity)}
                            </div>
                            <div>
                              <h5 className="font-medium">
                                {interaction.drug1} + {interaction.drug2}
                              </h5>
                              <Badge variant="outline" className="text-xs mt-1">
                                {interaction.severity}
                              </Badge>
                            </div>
                          </div>
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
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertes cliniques */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertes et Vigilances
              </CardTitle>
              <CardDescription>
                Alertes sanitaires et informations de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clinicalAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getSeverityColor(alert.severity)}`}>
                          {getSeverityIcon(alert.severity)}
                        </div>
                        <div>
                          <h4 className="font-medium">{alert.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {alert.type.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {alert.source}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{new Date(alert.date_issued).toLocaleDateString('fr-FR')}</div>
                        {alert.expiry_date && (
                          <div>Expire: {new Date(alert.expiry_date).toLocaleDateString('fr-FR')}</div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
                    
                    {alert.affected_drugs.length > 0 && (
                      <div className="mb-3">
                        <h5 className="font-medium text-sm mb-2">Médicaments concernés:</h5>
                        <div className="flex flex-wrap gap-1">
                          {alert.affected_drugs.map((drug, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {drug}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h5 className="font-medium text-sm mb-2">Actions requises:</h5>
                      <ul className="text-sm list-disc list-inside space-y-1">
                        {alert.actions_required.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spécialités pharmaceutiques */}
        <TabsContent value="specialties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Spécialités Pharmaceutiques
              </CardTitle>
              <CardDescription>
                Domaines d'expertise et protocoles spécialisés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {specialties.map((specialty) => (
                  <div key={specialty.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Stethoscope className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{specialty.name}</h4>
                        <p className="text-sm text-muted-foreground">{specialty.description}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium text-sm mb-2">Certifications requises</h5>
                        <div className="flex flex-wrap gap-1">
                          {specialty.certifications.map((cert, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-sm mb-2">Protocoles</h5>
                        <ul className="text-xs text-muted-foreground list-disc list-inside">
                          {specialty.protocols.slice(0, 2).map((protocol, idx) => (
                            <li key={idx}>{protocol}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-medium text-sm mb-2">Équipement</h5>
                        <ul className="text-xs text-muted-foreground list-disc list-inside">
                          {specialty.equipment.slice(0, 2).map((equipment, idx) => (
                            <li key={idx}>{equipment}</li>
                          ))}
                        </ul>
                      </div>

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
                <Button variant="outline" className="w-full justify-start">
                  <Heart className="h-4 w-4 mr-2" />
                  Calcul DFG (Cockcroft, MDRD)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Pill className="h-4 w-4 mr-2" />
                  Posologie pédiatrique
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Thermometer className="h-4 w-4 mr-2" />
                  Conversion d'unités
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Brain className="h-4 w-4 mr-2" />
                  Score de Beers (médicaments gériatriques)
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
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Thesaurus ANSM
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Base Claude Bernard
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  RCP et notices
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Portail de signalement ANSM
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkPharmaTools;