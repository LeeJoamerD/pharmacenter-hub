import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  FileText,
  Download,
  Eye,
  Calendar as CalendarIcon,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InventoryReport {
  id: string;
  nom: string;
  type: 'synthese' | 'ecarts' | 'valorisation' | 'conformite' | 'performance';
  session: string;
  dateGeneration: Date;
  generePar: string;
  statut: 'genere' | 'en_cours' | 'erreur';
  tailleFichier: string;
  format: 'PDF' | 'Excel' | 'CSV';
  description: string;
}

interface ReportMetrics {
  totalRapports: number;
  rapportsRecents: number;
  tailleTotal: number;
  sessionsAnalysees: number;
}

const InventoryReports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('tous');
  const [selectedStatus, setSelectedStatus] = useState<string>('tous');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  // Données mockées pour les rapports
  const reports: InventoryReport[] = [
    {
      id: '1',
      nom: 'Rapport Synthèse Q1 2024',
      type: 'synthese',
      session: 'Inventaire Général Q1 2024',
      dateGeneration: new Date('2024-01-17T16:30:00'),
      generePar: 'Marie Dubois',
      statut: 'genere',
      tailleFichier: '2.4 MB',
      format: 'PDF',
      description: 'Rapport complet avec synthèse générale, écarts et recommandations'
    },
    {
      id: '2',
      nom: 'Analyse Écarts Antibiotiques',
      type: 'ecarts',
      session: 'Inventaire Cyclique Antibiotiques',
      dateGeneration: new Date('2024-01-25T14:15:00'),
      generePar: 'Jean Martin',
      statut: 'genere',
      tailleFichier: '850 KB',
      format: 'Excel',
      description: 'Détail des écarts détectés sur les antibiotiques avec causes identifiées'
    },
    {
      id: '3',
      nom: 'Valorisation Stock Mensuel',
      type: 'valorisation',
      session: 'Inventaire Général Q1 2024',
      dateGeneration: new Date('2024-01-20T10:00:00'),
      generePar: 'Sophie Moreau',
      statut: 'genere',
      tailleFichier: '1.2 MB',
      format: 'PDF',
      description: 'Rapport de valorisation avec évolution des stocks par catégorie'
    },
    {
      id: '4',
      nom: 'Conformité Réglementaire',
      type: 'conformite',
      session: 'Inventaire Général Q1 2024',
      dateGeneration: new Date('2024-01-18T09:30:00'),
      generePar: 'Pierre Durand',
      statut: 'genere',
      tailleFichier: '680 KB',
      format: 'PDF',
      description: 'Rapport de conformité aux exigences réglementaires pharmaceutiques'
    },
    {
      id: '5',
      nom: 'Performance Équipe',
      type: 'performance',
      session: 'Inventaire Général Q1 2024',
      dateGeneration: new Date('2024-01-19T11:45:00'),
      generePar: 'Marie Dubois',
      statut: 'en_cours',
      tailleFichier: '-',
      format: 'Excel',
      description: 'Analyse des performances de l\'équipe durant l\'inventaire'
    }
  ];

  const metrics: ReportMetrics = {
    totalRapports: reports.length,
    rapportsRecents: reports.filter(r => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return r.dateGeneration >= weekAgo;
    }).length,
    tailleTotal: 5.13, // MB
    sessionsAnalysees: 3
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'synthese':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'ecarts':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'valorisation':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'conformite':
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      case 'performance':
        return <BarChart3 className="h-4 w-4 text-indigo-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      synthese: 'bg-blue-100 text-blue-800 border-blue-200',
      ecarts: 'bg-orange-100 text-orange-800 border-orange-200',
      valorisation: 'bg-green-100 text-green-800 border-green-200',
      conformite: 'bg-purple-100 text-purple-800 border-purple-200',
      performance: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };

    const labels = {
      synthese: 'Synthèse',
      ecarts: 'Écarts',
      valorisation: 'Valorisation',
      conformite: 'Conformité',
      performance: 'Performance'
    };

    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'genere':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'en_cours':
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
      case 'erreur':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (statut: string) => {
    const colors = {
      genere: 'bg-green-100 text-green-800 border-green-200',
      en_cours: 'bg-blue-100 text-blue-800 border-blue-200',
      erreur: 'bg-red-100 text-red-800 border-red-200'
    };

    const labels = {
      genere: 'Généré',
      en_cours: 'En cours',
      erreur: 'Erreur'
    };

    return (
      <Badge className={colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[statut as keyof typeof labels] || statut}
      </Badge>
    );
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.session.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.generePar.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'tous' || report.type === selectedType;
    const matchesStatus = selectedStatus === 'tous' || report.statut === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const generateReport = (type: string) => {
    console.log(`Génération d'un rapport de type: ${type}`);
    // Logique de génération de rapport
  };

  return (
    <div className="space-y-6">
      {/* Métriques des rapports */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Rapports</p>
              <p className="text-2xl font-bold">{metrics.totalRapports}</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rapports Récents</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.rapportsRecents}</p>
              <p className="text-xs text-muted-foreground">Cette semaine</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Taille Totale</p>
              <p className="text-2xl font-bold text-green-600">{metrics.tailleTotal} MB</p>
              <p className="text-xs text-muted-foreground">Espace utilisé</p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sessions Analysées</p>
              <p className="text-2xl font-bold text-purple-600">{metrics.sessionsAnalysees}</p>
              <p className="text-xs text-muted-foreground">Inventaires traités</p>
            </div>
            <PieChart className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides - Génération de rapports */}
      <Card>
        <CardHeader>
          <CardTitle>Génération de Rapports</CardTitle>
          <CardDescription>Créez des rapports personnalisés selon vos besoins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              onClick={() => generateReport('synthese')}
              className="h-auto p-4 flex flex-col items-start gap-2"
              variant="outline"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Rapport de Synthèse</span>
              </div>
              <span className="text-sm text-muted-foreground text-left">
                Vue d'ensemble complète avec KPIs et recommandations
              </span>
            </Button>

            <Button 
              onClick={() => generateReport('ecarts')}
              className="h-auto p-4 flex flex-col items-start gap-2"
              variant="outline"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="font-medium">Analyse des Écarts</span>
              </div>
              <span className="text-sm text-muted-foreground text-left">
                Détail des écarts avec causes et actions correctives
              </span>
            </Button>

            <Button 
              onClick={() => generateReport('valorisation')}
              className="h-auto p-4 flex flex-col items-start gap-2"
              variant="outline"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-medium">Valorisation</span>
              </div>
              <span className="text-sm text-muted-foreground text-left">
                Analyse financière et évolution de la valeur du stock
              </span>
            </Button>

            <Button 
              onClick={() => generateReport('conformite')}
              className="h-auto p-4 flex flex-col items-start gap-2"
              variant="outline"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Conformité</span>
              </div>
              <span className="text-sm text-muted-foreground text-left">
                Respect des exigences réglementaires pharmaceutiques
              </span>
            </Button>

            <Button 
              onClick={() => generateReport('performance')}
              className="h-auto p-4 flex flex-col items-start gap-2"
              variant="outline"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                <span className="font-medium">Performance</span>
              </div>
              <span className="text-sm text-muted-foreground text-left">
                Analyse des performances de l'équipe et processus
              </span>
            </Button>

            <Button 
              onClick={() => generateReport('custom')}
              className="h-auto p-4 flex flex-col items-start gap-2"
              variant="outline"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Rapport Personnalisé</span>
              </div>
              <span className="text-sm text-muted-foreground text-left">
                Créez un rapport avec vos critères spécifiques
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des rapports existants */}
      <Card>
        <CardHeader>
          <CardTitle>Rapports Existants</CardTitle>
          <CardDescription>Historique et gestion des rapports générés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher rapports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type de rapport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                <SelectItem value="synthese">Synthèse</SelectItem>
                <SelectItem value="ecarts">Écarts</SelectItem>
                <SelectItem value="valorisation">Valorisation</SelectItem>
                <SelectItem value="conformite">Conformité</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="genere">Généré</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="erreur">Erreur</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Période
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rapport</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Généré par</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.nom}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {report.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(report.type)}
                        {getTypeBadge(report.type)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">{report.session}</TableCell>
                    <TableCell>{report.generePar}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {format(report.dateGeneration, 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(report.statut)}
                        {getStatusBadge(report.statut)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{report.format}</Badge>
                        <span className="text-sm text-muted-foreground">{report.tailleFichier}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {report.statut === 'genere' && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun rapport trouvé pour les critères sélectionnés
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryReports;