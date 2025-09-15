import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown,
  Clock,
  Package,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  BarChart3,
  Calendar,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useRotationAnalysis } from '@/hooks/useRotationAnalysis';

const RotationAnalysis = () => {
  // Utiliser le hook personnalisé pour les données réelles
  const {
    filteredProducts,
    metrics,
    stats,
    families,
    loading,
    error,
    selectedPeriod,
    selectedCategory,
    selectedStatus,
    setSelectedPeriod,
    setSelectedCategory,
    setSelectedStatus,
    refreshData,
    exportData,
    getRecommendations
  } = useRotationAnalysis();

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'excellent':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'bon':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'moyen':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'faible':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'critique':
        return <AlertTriangle className="h-4 w-4 text-red-700" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (statut: string) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800 border-green-200',
      bon: 'bg-blue-100 text-blue-800 border-blue-200',
      moyen: 'bg-orange-100 text-orange-800 border-orange-200',
      faible: 'bg-red-100 text-red-800 border-red-200',
      critique: 'bg-red-200 text-red-900 border-red-300'
    };

    const labels = {
      excellent: 'Excellent (>10)',
      bon: 'Bon (6-10)',
      moyen: 'Moyen (3-6)',
      faible: 'Faible (1-3)',
      critique: 'Critique (<1)'
    };

    return (
      <Badge className={colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[statut as keyof typeof labels] || statut}
      </Badge>
    );
  };

  const getRotationColor = (taux: number) => {
    if (taux >= 10) return 'text-green-600';
    if (taux >= 6) return 'text-blue-600';
    if (taux >= 3) return 'text-orange-600';
    if (taux >= 1) return 'text-red-600';
    return 'text-red-700';
  };

  // Gérer les états de chargement et d'erreur
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement de l'analyse de rotation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques de rotation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rotation Moyenne</p>
              <p className={`text-2xl font-bold ${getRotationColor(metrics.rotationMoyenne)}`}>
                {metrics.rotationMoyenne.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Tours/an</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Produits Analysés</p>
              <p className="text-2xl font-bold">{metrics.produitsAnalyses}</p>
              <p className="text-xs text-muted-foreground">Articles suivis</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valeur Analysée</p>
              <p className="text-2xl font-bold">{metrics.valeurAnalysee.toLocaleString('fr-FR')} FCFA</p>
              <p className="text-xs text-muted-foreground">Stock évalué</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Alertes Rotation</p>
              <p className="text-2xl font-bold text-red-600">
                {metrics.alertesRotation}
              </p>
              <p className="text-xs text-muted-foreground">Produits lents</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>
      </div>

      {/* Distribution des statuts de rotation */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution des Taux de Rotation</CardTitle>
          <CardDescription>Répartition des produits selon leur vitesse de rotation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.excellent}</div>
              <div className="text-sm text-muted-foreground">Excellent</div>
              <div className="text-xs text-green-600">&gt; 10 tours/an</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.bon}</div>
              <div className="text-sm text-muted-foreground">Bon</div>
              <div className="text-xs text-blue-600">6-10 tours/an</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.moyen}</div>
              <div className="text-sm text-muted-foreground">Moyen</div>
              <div className="text-xs text-orange-600">3-6 tours/an</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.faible}</div>
              <div className="text-sm text-muted-foreground">Faible</div>
              <div className="text-xs text-red-600">1-3 tours/an</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-700">{stats.critique}</div>
              <div className="text-sm text-muted-foreground">Critique</div>
              <div className="text-xs text-red-700">&lt; 1 tour/an</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres d'Analyse</CardTitle>
          <CardDescription>Configurez votre analyse de rotation des stocks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensuel">Mensuel</SelectItem>
                <SelectItem value="trimestriel">Trimestriel</SelectItem>
                <SelectItem value="annuel">Annuel</SelectItem>
                <SelectItem value="personnalise">Personnalisé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes catégories</SelectItem>
                {families.map((family) => (
                  <SelectItem key={family.id} value={family.libelle_famille}>
                    {family.libelle_famille}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut rotation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous statuts</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="bon">Bon</SelectItem>
                <SelectItem value="moyen">Moyen</SelectItem>
                <SelectItem value="faible">Faible</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => exportData('csv')} disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
            
            <Button onClick={refreshData} variant="outline" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse Détaillée de Rotation</CardTitle>
          <CardDescription>Suivi du taux de rotation par produit avec recommandations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Stock Moyen</TableHead>
                  <TableHead className="text-right">Consommation/An</TableHead>
                  <TableHead className="text-right">Taux Rotation</TableHead>
                  <TableHead className="text-right">Durée Écoulement</TableHead>
                  <TableHead className="text-right">Évolution</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernier Mvt</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.nom}</div>
                        <div className="text-sm text-muted-foreground">{product.categorie}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {product.stockMoyen.toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {product.consommationAnnuelle.toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono font-semibold ${getRotationColor(product.tauxRotation)}`}>
                        {product.tauxRotation.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {product.dureeEcoulement} jours
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`flex items-center justify-end gap-1 ${
                        product.evolution >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product.evolution >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="font-mono">
                          {product.evolution >= 0 ? '+' : ''}{product.evolution.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(product.statut)}
                        {getStatusBadge(product.statut)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {product.dernierMouvement.toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            // TODO: Implémenter la vue détaillée du produit
                            console.log('Voir détails:', product.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            // Exporter les données d'un seul produit
                            exportData('csv');
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RotationAnalysis;