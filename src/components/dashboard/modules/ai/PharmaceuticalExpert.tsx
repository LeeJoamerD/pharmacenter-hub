import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Pill, 
  AlertTriangle,
  Shield,
  Search,
  Book,
  FileText,
  Users,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Brain,
  Zap,
  Activity,
  Heart,
  Eye,
  Info
} from 'lucide-react';

const PharmaceuticalExpert = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);

  // Base de connaissance médicaments
  const [drugDatabase] = useState([
    {
      id: 'doliprane1000',
      name: 'Doliprane 1000mg',
      genericName: 'Paracétamol',
      therapeuticClass: 'Antalgique/Antipyrétique',
      indications: ['Douleur', 'Fièvre'],
      contraindications: ['Insuffisance hépatique sévère', 'Allergie paracétamol'],
      sideEffects: ['Rares: réactions cutanées', 'Hépatotoxicité (surdosage)'],
      dosage: '1000mg toutes les 6-8h, max 4g/jour',
      interactions: ['Anticoagulants (surveillance)', 'Inducteurs enzymatiques'],
      pregnancy: 'Autorisé',
      breastfeeding: 'Compatible',
      age: 'Adulte et enfant >50kg',
      price: 2.84,
      reimbursement: 65
    },
    {
      id: 'amoxicilline500',
      name: 'Amoxicilline 500mg',
      genericName: 'Amoxicilline',
      therapeuticClass: 'Antibiotique β-lactamine',
      indications: ['Infections respiratoires', 'Infections urinaires', 'Infections ORL'],
      contraindications: ['Allergie pénicillines', 'Mononucléose infectieuse'],
      sideEffects: ['Troubles digestifs', 'Réactions allergiques', 'Candidoses'],
      dosage: '500mg 3x/jour pendant 7-10 jours',
      interactions: ['Méthotrexate', 'Anticoagulants oraux'],
      pregnancy: 'Autorisé',
      breastfeeding: 'Compatible',
      age: 'Tous âges (adaptation posologie)',
      price: 4.12,
      reimbursement: 100
    }
  ]);

  // Vérificateur d'interactions
  const [interactionChecker] = useState([
    {
      drug1: 'Warfarine',
      drug2: 'Paracétamol',
      severity: 'moderate',
      description: 'Augmentation possible de l\'effet anticoagulant',
      recommendation: 'Surveillance INR renforcée',
      mechanism: 'Inhibition métabolisme warfarine'
    },
    {
      drug1: 'Metformine',
      drug2: 'Furosémide',
      severity: 'high',
      description: 'Risque d\'acidose lactique',
      recommendation: 'Éviter l\'association, surveillance fonction rénale',
      mechanism: 'Altération élimination rénale'
    },
    {
      drug1: 'Aspirine',
      drug2: 'Méthotrexate',
      severity: 'high',
      description: 'Toxicité hématologique majorée',
      recommendation: 'Association contre-indiquée',
      mechanism: 'Diminution élimination rénale du méthotrexate'
    }
  ]);

  // Recommandations thérapeutiques
  const [therapeuticRecommendations] = useState([
    {
      condition: 'Douleur légère à modérée',
      firstLine: ['Paracétamol 1g', 'Ibuprofène 400mg'],
      alternatives: ['Aspirine 500mg', 'Kétoprofène gel'],
      contraindications: 'AINS si ulcère, insuffisance rénale',
      duration: '3-5 jours max sans avis médical',
      monitoring: 'Évaluer efficacité à 48h'
    },
    {
      condition: 'Rhinite allergique',
      firstLine: ['Cétirizine 10mg', 'Loratadine 10mg'],
      alternatives: ['Desloratadine 5mg', 'Corticoïdes nasaux'],
      contraindications: 'Allergie antihistaminiques',
      duration: 'Selon exposition allergène',
      monitoring: 'Somnolence, efficacité'
    }
  ]);

  // Alertes pharmacovigilance
  const [pharmacovigilanceAlerts] = useState([
    {
      drug: 'Tramadol',
      alert: 'Risque de convulsions majoré',
      date: '2025-01-03',
      severity: 'high',
      action: 'Information patients, surveillance neurologique',
      source: 'ANSM'
    },
    {
      drug: 'Ibuprofène',
      alert: 'Rappel risques cardiovasculaires',
      date: '2025-01-02',
      severity: 'moderate',
      action: 'Éviter traitement prolongé >3 jours',
      source: 'EMA'
    }
  ]);

  // Conformité réglementaire
  const [complianceChecks] = useState([
    {
      category: 'Stupéfiants',
      status: 'compliant',
      lastCheck: '2025-01-05',
      items: 23,
      issues: 0,
      nextAudit: '2025-01-12'
    },
    {
      category: 'Liste I',
      status: 'compliant',
      lastCheck: '2025-01-05',
      items: 156,
      issues: 0,
      nextAudit: '2025-01-10'
    },
    {
      category: 'Liste II',
      status: 'warning',
      lastCheck: '2025-01-04',
      items: 89,
      issues: 2,
      nextAudit: '2025-01-08'
    }
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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

  const searchDrugs = (query: string) => {
    return drugDatabase.filter(drug => 
      drug.name.toLowerCase().includes(query.toLowerCase()) ||
      drug.genericName.toLowerCase().includes(query.toLowerCase())
    );
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
          <Button variant="outline" size="sm">
            <Book className="h-4 w-4 mr-2" />
            Guide Thérapeutique
          </Button>
          <Button size="sm">
            <Brain className="h-4 w-4 mr-2" />
            Consultation IA
          </Button>
        </div>
      </div>

      {/* Recherche rapide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche Médicament
          </CardTitle>
          <CardDescription>Recherchez des informations complètes sur les médicaments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Nom du médicament ou DCI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
          </div>
          
          {searchQuery && (
            <div className="mt-4 space-y-2">
              {searchDrugs(searchQuery).map((drug) => (
                <div 
                  key={drug.id} 
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedDrug(drug.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{drug.name}</h4>
                      <p className="text-sm text-muted-foreground">{drug.genericName} • {drug.therapeuticClass}</p>
                    </div>
                    <Badge variant="outline">{drug.price}€</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          <div className="grid gap-6 md:grid-cols-2">
            {drugDatabase.map((drug) => (
              <Card key={drug.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    {drug.name}
                  </CardTitle>
                  <CardDescription>{drug.genericName} • {drug.therapeuticClass}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h5 className="font-medium mb-1">Indications</h5>
                    <div className="flex flex-wrap gap-1">
                      {drug.indications.map((indication, index) => (
                        <Badge key={index} variant="secondary">{indication}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-1">Posologie</h5>
                    <p className="text-sm text-muted-foreground">{drug.dosage}</p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-1">Contre-indications</h5>
                    <ul className="text-sm text-red-600 space-y-1">
                      {drug.contraindications.map((ci, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3" />
                          {ci}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-50 text-green-600">
                        Remb. {drug.reimbursement}%
                      </Badge>
                      <span className="font-medium">{drug.price}€</span>
                    </div>
                    <Button size="sm" variant="outline">
                      <Info className="h-4 w-4 mr-2" />
                      Détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Vérificateur d'Interactions
              </CardTitle>
              <CardDescription>Détection automatique des interactions médicamenteuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interactionChecker.map((interaction, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${getSeverityColor(interaction.severity)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">
                          {interaction.drug1} + {interaction.drug2}
                        </h4>
                        <Badge className={getSeverityColor(interaction.severity)}>
                          {interaction.severity === 'high' ? 'Sévère' :
                           interaction.severity === 'moderate' ? 'Modérée' : 'Légère'}
                        </Badge>
                      </div>
                      <AlertTriangle className={`h-5 w-5 ${
                        interaction.severity === 'high' ? 'text-red-600' :
                        interaction.severity === 'moderate' ? 'text-orange-600' : 'text-yellow-600'
                      }`} />
                    </div>
                    
                    <p className="text-sm mb-2">{interaction.description}</p>
                    
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <h5 className="font-medium text-blue-800 mb-1">Recommandation:</h5>
                      <p className="text-sm text-blue-700">{interaction.recommendation}</p>
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      Mécanisme: {interaction.mechanism}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-800">Vérification Automatique</h4>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  L'IA vérifie automatiquement les interactions lors de chaque prescription
                </p>
                <Button size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Vérifier Nouvelle Interaction
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recommandations Thérapeutiques
              </CardTitle>
              <CardDescription>Protocoles et guidelines basés sur l'évidence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {therapeuticRecommendations.map((rec, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-lg mb-3">{rec.condition}</h4>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h5 className="font-medium text-green-700 mb-2">Première intention</h5>
                        <div className="space-y-1">
                          {rec.firstLine.map((drug, drugIndex) => (
                            <Badge key={drugIndex} className="bg-green-50 text-green-700 mr-1">
                              {drug}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-blue-700 mb-2">Alternatives</h5>
                        <div className="space-y-1">
                          {rec.alternatives.map((alt, altIndex) => (
                            <Badge key={altIndex} className="bg-blue-50 text-blue-700 mr-1">
                              {alt}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <span className="font-medium text-red-700">Contre-indications: </span>
                          <span className="text-sm">{rec.contraindications}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <span className="font-medium text-blue-700">Durée: </span>
                          <span className="text-sm">{rec.duration}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Eye className="h-4 w-4 text-purple-600 mt-0.5" />
                        <div>
                          <span className="font-medium text-purple-700">Surveillance: </span>
                          <span className="text-sm">{rec.monitoring}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pharmacovigilance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Alertes Pharmacovigilance
              </CardTitle>
              <CardDescription>Surveillance des effets indésirables et alertes réglementaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pharmacovigilanceAlerts.map((alert, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{alert.drug}</h4>
                        <p className="text-sm mt-1">{alert.alert}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity === 'high' ? 'Urgent' : 'Information'}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">{alert.date}</div>
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 p-3 rounded border border-orange-200">
                      <h5 className="font-medium text-orange-800 mb-1">Action requise:</h5>
                      <p className="text-sm text-orange-700">{alert.action}</p>
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      Source: {alert.source}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Conformité Réglementaire
              </CardTitle>
              <CardDescription>Suivi automatique de la conformité pharmaceutique</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {complianceChecks.map((check, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{check.category}</h4>
                      {getComplianceIcon(check.status)}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Articles:</span>
                        <span className="font-medium">{check.items}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Problèmes:</span>
                        <span className={`font-medium ${
                          check.issues === 0 ? 'text-green-600' : 'text-red-600'
                        }`}>{check.issues}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dernier contrôle:</span>
                        <span className="text-muted-foreground">{check.lastCheck}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prochain audit:</span>
                        <span className="font-medium">{check.nextAudit}</span>
                      </div>
                    </div>
                    
                    <Button size="sm" className="w-full mt-3" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Rapport Détaillé
                    </Button>
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

export default PharmaceuticalExpert;