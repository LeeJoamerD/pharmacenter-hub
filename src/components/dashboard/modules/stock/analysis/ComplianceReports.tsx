import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Clipboard, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Eye,
  Download,
  Calendar as CalendarIcon,
  Shield,
  FileText,
  Clock,
  Award,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCompliance, useComplianceFilters } from '@/hooks/useCompliance';

// Types are now imported from the service

const ComplianceReports = () => {
  const [selectedCategory, setSelectedCategory] = useState('toutes');
  const [selectedStatus, setSelectedStatus] = useState('tous');
  const [selectedUrgency, setSelectedUrgency] = useState('toutes');
  const [dateFrom, setDateFrom] = useState<Date>();

  // Use the compliance hook for real data
  const {
    complianceItems,
    metrics,
    categories,
    isLoading,
    error,
    exportComplianceReport,
    generateAuditReport,
    refreshAll
  } = useCompliance();

  // Apply filters
  const { filteredItems } = useComplianceFilters(complianceItems, {
    category: selectedCategory,
    status: selectedStatus,
    urgency: selectedUrgency,
    dateFrom
  });

  // Handle export
  const handleExportReport = () => {
    exportComplianceReport({
      category: selectedCategory,
      status: selectedStatus,
      urgency: selectedUrgency,
      dateFrom
    });
  };

  // Handle audit report
  const handleAuditReport = () => {
    generateAuditReport();
  };

  // Handle refresh
  const handleRefresh = () => {
    refreshAll();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des données de conformité...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-red-600">Erreur de chargement</p>
          <p className="text-muted-foreground mb-4">
            Impossible de charger les données de conformité
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'conforme':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'non_conforme':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'en_cours':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'expire':
        return <AlertTriangle className="h-4 w-4 text-red-700" />;
      default:
        return <Clipboard className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (statut: string) => {
    const colors = {
      conforme: 'bg-green-100 text-green-800 border-green-200',
      non_conforme: 'bg-red-100 text-red-800 border-red-200',
      en_cours: 'bg-blue-100 text-blue-800 border-blue-200',
      expire: 'bg-red-200 text-red-900 border-red-300'
    };

    const labels = {
      conforme: 'Conforme',
      non_conforme: 'Non conforme',
      en_cours: 'En cours',
      expire: 'Expiré'
    };

    return (
      <Badge className={colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[statut as keyof typeof labels] || statut}
      </Badge>
    );
  };

  const getUrgencyIcon = (urgence: string) => {
    switch (urgence) {
      case 'critique':
        return <AlertTriangle className="h-4 w-4 text-red-700" />;
      case 'haute':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'moyenne':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getUrgencyBadge = (urgence: string) => {
    const colors = {
      critique: 'bg-red-200 text-red-900 border-red-300',
      haute: 'bg-red-100 text-red-800 border-red-200',
      moyenne: 'bg-orange-100 text-orange-800 border-orange-200',
      basse: 'bg-green-100 text-green-800 border-green-200'
    };

    const labels = {
      critique: 'Critique',
      haute: 'Haute',
      moyenne: 'Moyenne',
      basse: 'Basse'
    };

    return (
      <Badge className={colors[urgence as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[urgence as keyof typeof labels] || urgence}
      </Badge>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  // filteredItems is now handled by the useComplianceFilters hook

  return (
    <div className="space-y-6">
      {/* Métriques de conformité */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Score Global</p>
              <p className={`text-2xl font-bold ${getScoreColor(metrics.scoreGlobal)}`}>
                {metrics.scoreGlobal.toFixed(0)}%
              </p>
            </div>
            <Award className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conforme</p>
              <p className="text-2xl font-bold text-green-600">{metrics.conformite}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">En Cours</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.enCours}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Non Conforme</p>
              <p className="text-2xl font-bold text-red-600">{metrics.nonConformite}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>

        <Card className="border-red-300">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Expiré</p>
              <p className="text-2xl font-bold text-red-700">{metrics.expire}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-700" />
          </CardContent>
        </Card>
      </div>

      {/* Niveau de conformité global */}
      <Card>
        <CardHeader>
          <CardTitle>Niveau de Conformité Réglementaire</CardTitle>
          <CardDescription>Évaluation globale du respect des exigences pharmaceutiques</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Conformité Globale</span>
              <span className={`text-lg font-bold ${getScoreColor(metrics.scoreGlobal)}`}>
                {metrics.scoreGlobal.toFixed(1)}%
              </span>
            </div>
            <Progress value={metrics.scoreGlobal} className="h-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>≥ 90% Excellent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>80-89% Bon</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>70-79% Moyen</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>&lt; 70% Critique</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres de Conformité</CardTitle>
          <CardDescription>Personnalisez votre vue des exigences réglementaires</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes catégories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous statuts</SelectItem>
                <SelectItem value="conforme">Conforme</SelectItem>
                <SelectItem value="non_conforme">Non conforme</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="expire">Expiré</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Urgence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes urgences</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
                <SelectItem value="basse">Basse</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Période
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Rapport Conformité
            </Button>

            <Button variant="outline" onClick={handleAuditReport}>
              <FileText className="mr-2 h-4 w-4" />
              Audit Complet
            </Button>

            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau de conformité détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des Exigences Réglementaires</CardTitle>
          <CardDescription>Suivi détaillé de la conformité aux exigences pharmaceutiques</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exigence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Urgence</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Dernier Contrôle</TableHead>
                  <TableHead>Prochain Contrôle</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.exigence}</div>
                        <div className="text-sm text-muted-foreground">
                          <Badge variant="outline" className="mr-2">{item.categorie}</Badge>
                          {item.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.statut)}
                        {getStatusBadge(item.statut)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-mono font-semibold ${getScoreColor(item.scoreConformite)}`}>
                          {item.scoreConformite}%
                        </span>
                        <Progress value={item.scoreConformite} className="w-16 h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getUrgencyIcon(item.urgence)}
                        {getUrgencyBadge(item.urgence)}
                      </div>
                    </TableCell>
                    <TableCell>{item.responsable}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {format(item.dernierControle, 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {format(item.prochainControle, 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Shield className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune exigence trouvée pour les critères sélectionnés
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceReports;