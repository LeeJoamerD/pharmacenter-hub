import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Download,
  Upload,
  Eye,
  Filter,
  Calendar,
  Building,
  User,
  Package,
  Truck,
  Database,
  Lock,
  BookOpen,
  Clipboard,
  Pill,
  Activity,
  Users,
  Settings
} from 'lucide-react';

const RegulatoryReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [complianceFilter, setComplianceFilter] = useState('all');

  // Statut de conformité
  const complianceMetrics = [
    {
      title: 'Conformité Globale',
      value: '96.8%',
      change: '+2.1%',
      status: 'excellent',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Rapports Obligatoires',
      value: '24/25',
      change: '1 en retard',
      status: 'warning',
      icon: FileText,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Audits Réussis',
      value: '12/12',
      change: '100%',
      status: 'excellent',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Alertes Actives',
      value: '3',
      change: '-2 vs hier',
      status: 'good',
      icon: AlertTriangle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ];

  // Registre stupéfiants
  const narcoticsRegistry = [
    {
      id: 'STU001',
      substance: 'Morphine 10mg',
      stock_initial: 500,
      entrees: 250,
      sorties: 180,
      stock_final: 570,
      statut: 'Conforme',
      derniere_verification: '2024-01-05'
    },
    {
      id: 'STU002',
      substance: 'Codéine 30mg',
      stock_initial: 300,
      entrees: 150,
      sorties: 120,
      stock_final: 330,
      statut: 'Conforme',
      derniere_verification: '2024-01-04'
    },
    {
      id: 'STU003',
      substance: 'Tramadol 50mg',
      stock_initial: 800,
      entrees: 400,
      sorties: 450,
      stock_final: 750,
      statut: 'À vérifier',
      derniere_verification: '2024-01-03'
    }
  ];

  // Traçabilité des médicaments
  const traceabilityData = [
    {
      lot: 'LOT2024-001',
      medicament: 'Doliprane 1000mg',
      fournisseur: 'Sanofi',
      date_reception: '2024-01-02',
      date_peremption: '2025-12-15',
      quantite_recue: 1000,
      quantite_vendue: 847,
      quantite_restante: 153,
      statut_trace: 'Active'
    },
    {
      lot: 'LOT2024-002',
      medicament: 'Amoxicilline 500mg',
      fournisseur: 'GSK',
      date_reception: '2024-01-03',
      date_peremption: '2025-08-30',
      quantite_recue: 500,
      quantite_vendue: 456,
      quantite_restante: 44,
      statut_trace: 'Active'
    }
  ];

  // Pharmacovigilance
  const pharmacovigilance = [
    {
      id: 'PV001',
      medicament: 'Aspirine 500mg',
      effet_indesirable: 'Nausées légères',
      gravite: 'Mineure',
      patient_age: 45,
      date_declaration: '2024-01-04',
      statut: 'Déclaré ANSM',
      suivi_requis: false
    },
    {
      id: 'PV002',
      medicament: 'Ibuprofen 400mg',
      effet_indesirable: 'Réaction cutanée',
      gravite: 'Modérée',
      patient_age: 32,
      date_declaration: '2024-01-03',
      statut: 'En cours',
      suivi_requis: true
    }
  ];

  // Rapports obligatoires
  const mandatoryReports = [
    {
      nom: 'Rapport Mensuel ANSM',
      frequence: 'Mensuel',
      prochaine_echeance: '2024-01-31',
      statut: 'En cours',
      responsable: 'Dr. Martin',
      progression: 75
    },
    {
      nom: 'Bilan Stupéfiants',
      frequence: 'Trimestriel',
      prochaine_echeance: '2024-03-31',
      statut: 'Planifié',
      responsable: 'Pharmacien Chef',
      progression: 25
    },
    {
      nom: 'Déclaration Pharmacovigilance',
      frequence: 'Immédiat',
      prochaine_echeance: '2024-01-06',
      statut: 'Urgent',
      responsable: 'Dr. Dubois',
      progression: 90
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'Conforme': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'À vérifier': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Non conforme': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'Complété': return 'text-green-600 bg-green-50';
      case 'En cours': return 'text-blue-600 bg-blue-50';
      case 'Urgent': return 'text-red-600 bg-red-50';
      case 'Planifié': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rapports Réglementaires</h2>
          <p className="text-muted-foreground">
            Conformité pharmaceutique et rapports obligatoires
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
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter Conformité
          </Button>
        </div>
      </div>

      {/* Métriques de conformité */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {complianceMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                  <span className="ml-2">{metric.change}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="narcotics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="narcotics">Stupéfiants</TabsTrigger>
          <TabsTrigger value="traceability">Traçabilité</TabsTrigger>
          <TabsTrigger value="pharmacovigilance">Pharmacovigilance</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
          <TabsTrigger value="compliance">Conformité</TabsTrigger>
        </TabsList>

        <TabsContent value="narcotics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Registre des Stupéfiants
              </CardTitle>
              <CardDescription>Suivi réglementaire des substances contrôlées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher une substance..." className="pl-10" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrer
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {narcoticsRegistry.map((entry, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Pill className="h-5 w-5 text-purple-600" />
                          <div>
                            <h4 className="font-semibold">{entry.substance}</h4>
                            <p className="text-sm text-muted-foreground">ID: {entry.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getComplianceIcon(entry.statut)}
                          <Badge className={entry.statut === 'Conforme' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}>
                            {entry.statut}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Stock Initial</p>
                          <p className="font-semibold">{entry.stock_initial}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Entrées</p>
                          <p className="font-semibold text-green-600">+{entry.entrees}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Sorties</p>
                          <p className="font-semibold text-red-600">-{entry.sorties}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Stock Final</p>
                          <p className="font-semibold">{entry.stock_final}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Dernière Vérification</p>
                          <p className="font-semibold">{entry.derniere_verification}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <Progress value={((entry.stock_final / entry.stock_initial) * 100)} className="flex-1 mr-4 h-2" />
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Détails
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traceability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Traçabilité des Médicaments
              </CardTitle>
              <CardDescription>Suivi complet des lots pharmaceutiques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {traceabilityData.map((trace, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{trace.medicament}</h4>
                        <p className="text-sm text-muted-foreground">
                          Lot: {trace.lot} • Fournisseur: {trace.fournisseur}
                        </p>
                      </div>
                      <Badge className="bg-blue-50 text-blue-600">
                        {trace.statut_trace}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Date Réception</p>
                        <p className="font-semibold">{trace.date_reception}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date Péremption</p>
                        <p className="font-semibold">{trace.date_peremption}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quantité Reçue</p>
                        <p className="font-semibold">{trace.quantite_recue}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Restant</p>
                        <p className="font-semibold">{trace.quantite_restante}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progression ventes</span>
                        <span>{((trace.quantite_vendue / trace.quantite_recue) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={(trace.quantite_vendue / trace.quantite_recue) * 100} className="h-2" />
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
                Pharmacovigilance
              </CardTitle>
              <CardDescription>Surveillance des effets indésirables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pharmacovigilance.map((pv, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{pv.medicament}</h4>
                        <p className="text-sm text-muted-foreground">ID: {pv.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {pv.suivi_requis && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                        <Badge className={pv.statut === 'Déclaré ANSM' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}>
                          {pv.statut}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Effet Indésirable</p>
                        <p className="font-semibold">{pv.effet_indesirable}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Gravité</p>
                        <p className={`font-semibold ${
                          pv.gravite === 'Mineure' ? 'text-green-600' : 
                          pv.gravite === 'Modérée' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {pv.gravite}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Âge Patient</p>
                        <p className="font-semibold">{pv.patient_age} ans</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date Déclaration</p>
                        <p className="font-semibold">{pv.date_declaration}</p>
                      </div>
                    </div>
                    
                    {pv.suivi_requis && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <p className="text-yellow-800 font-medium">⚠️ Suivi médical requis</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Rapports Obligatoires
              </CardTitle>
              <CardDescription>Planning et suivi des déclarations réglementaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mandatoryReports.map((report, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{report.nom}</h4>
                        <p className="text-sm text-muted-foreground">
                          {report.frequence} • Responsable: {report.responsable}
                        </p>
                      </div>
                      <Badge className={getReportStatusColor(report.statut)}>
                        {report.statut}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Prochaine Échéance</p>
                        <p className="font-semibold">{report.prochaine_echeance}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Progression</p>
                        <p className="font-semibold">{report.progression}%</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Progress value={report.progression} className="h-2" />
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">
                          {report.progression < 50 ? 'Début' : report.progression < 80 ? 'En cours' : 'Finalisation'}
                        </span>
                        <Button size="sm" variant="outline">
                          {report.statut === 'Urgent' ? <Upload className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                          {report.statut === 'Urgent' ? 'Soumettre' : 'Voir'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Audits de Conformité
                </CardTitle>
                <CardDescription>Historique et planning des audits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Audit ANSM</p>
                        <p className="text-sm text-muted-foreground">15 Décembre 2023</p>
                      </div>
                      <Badge className="bg-green-50 text-green-600">Conforme</Badge>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Inspection Régionale</p>
                        <p className="text-sm text-muted-foreground">8 Novembre 2023</p>
                      </div>
                      <Badge className="bg-green-50 text-green-600">Conforme</Badge>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Prochain Audit</p>
                        <p className="text-sm text-muted-foreground">Planifié Mars 2024</p>
                      </div>
                      <Badge className="bg-blue-50 text-blue-600">Préparation</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Actions de Mise en Conformité
                </CardTitle>
                <CardDescription>Recommandations et actions correctives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">✓ Formation Personnel</p>
                    <p className="text-xs text-green-600">Mise à jour réglementaire complétée</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">🔄 Mise à jour Procédures</p>
                    <p className="text-xs text-blue-600">En cours - Échéance 15/01/2024</p>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">⚠️ Vérification Stock</p>
                    <p className="text-xs text-yellow-600">Planifiée pour demain</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RegulatoryReports;