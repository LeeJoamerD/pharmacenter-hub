import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Download,
  RefreshCw,
  Package,
  Calculator,
  Target,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useForecastAnalysis } from '@/hooks/useForecastAnalysis';
import type { ForecastProduct } from '@/services/ForecastAnalysisService';

const ForecastAnalysis = () => {
  const {
    // Data
    products,
    stats: forecastStats,
    recommendations,
    families,
    
    // State
    loading,
    error,
    
    // Filters
    selectedHorizon,
    selectedCategory,
    selectedRecommendation,
    
    // Actions
    setSelectedHorizon,
    setSelectedCategory,
    setSelectedRecommendation,
    refreshData,
    exportData,
    runCalculation
  } = useForecastAnalysis();

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des prévisions...</span>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-center text-destructive">{error}</p>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  // Helper functions pour les badges et icônes
  const getTendanceIcon = (tendance: string) => {
    switch (tendance) {
      case 'hausse':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'baisse':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTendanceBadge = (tendance: string) => {
    const colors = {
      hausse: 'bg-green-100 text-green-800 border-green-200',
      baisse: 'bg-red-100 text-red-800 border-red-200',
      stable: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    const labels = {
      hausse: 'En hausse',
      baisse: 'En baisse',
      stable: 'Stable'
    };

    return (
      <Badge className={colors[tendance as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {getTendanceIcon(tendance)}
        <span className="ml-1">{labels[tendance as keyof typeof labels] || tendance}</span>
      </Badge>
    );
  };

  const getRecommendationIcon = (recommandation: string) => {
    switch (recommandation) {
      case 'Commande urgente':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'Surveiller':
        return <Eye className="h-4 w-4 text-orange-600" />;
      case 'Surstockage':
        return <TrendingDown className="h-4 w-4 text-purple-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getRecommendationBadge = (recommandation: string) => {
    const colors = {
      'Commande urgente': 'bg-red-100 text-red-800 border-red-200',
      'Surveiller': 'bg-orange-100 text-orange-800 border-orange-200',
      'Surstockage': 'bg-purple-100 text-purple-800 border-purple-200',
      'Stock optimal': 'bg-green-100 text-green-800 border-green-200'
    };

    return (
      <Badge className={colors[recommandation as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {getRecommendationIcon(recommandation)}
        <span className="ml-1">{recommandation}</span>
      </Badge>
    );
  };

  const getFiabiliteColor = (fiabilite: number) => {
    if (fiabilite >= 90) return 'text-green-600';
    if (fiabilite >= 80) return 'text-blue-600';
    if (fiabilite >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get prediction value based on selected horizon
  const getPrevisionValue = (product: ForecastProduct) => {
    switch (selectedHorizon) {
      case '1': return product.prevision1Mois;
      case '3': return product.prevision3Mois;
      case '6': return product.prevision6Mois;
      default: return product.prevision1Mois;
    }
  };

  // Calculate recommendation distribution for display
  const recommendationDistribution = recommendations.length > 0 ? recommendations : [
    { type: 'Stock optimal', count: 0, percentage: 0 },
    { type: 'Surveiller', count: 0, percentage: 0 },
    { type: 'Commande urgente', count: 0, percentage: 0 },
    { type: 'Surstockage', count: 0, percentage: 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fiabilité Moyenne</p>
              <p className={`text-2xl font-bold ${getFiabiliteColor(forecastStats.fiabiliteMoyenne)}`}>
                {forecastStats.fiabiliteMoyenne}%
              </p>
              <p className="text-xs text-muted-foreground">Précision du modèle</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Produits Analysés</p>
              <p className="text-2xl font-bold">{forecastStats.totalProduits}</p>
              <p className="text-xs text-muted-foreground">Articles suivis</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valeur Prévisionnelle</p>
              <p className="text-2xl font-bold">{forecastStats.valeurPrevisionnelle.toLocaleString('fr-FR')} €</p>
              <p className="text-xs text-muted-foreground">Estimée</p>
            </div>
            <Calculator className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Alertes Stock</p>
              <p className="text-2xl font-bold text-red-600">{forecastStats.alertesStock}</p>
              <p className="text-xs text-muted-foreground">Actions requises</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>
      </div>

      {/* Distribution des recommandations */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition des Recommandations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 mb-4">
              {recommendationDistribution.map((rec, index) => {
                const colors = {
                  'Stock optimal': 'text-green-600',
                  'Surveiller': 'text-yellow-600',
                  'Commande urgente': 'text-red-600',
                  'Surstockage': 'text-blue-600'
                };
                return (
                  <div key={index} className="text-center">
                    <div className={`text-2xl font-bold ${colors[rec.type as keyof typeof colors] || 'text-gray-600'}`}>
                      {rec.count}
                    </div>
                    <div className="text-sm text-gray-600">{rec.type}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres et Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres et Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Select value={selectedHorizon} onValueChange={setSelectedHorizon}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Horizon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 mois</SelectItem>
                  <SelectItem value="3">3 mois</SelectItem>
                  <SelectItem value="6">6 mois</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {families.map((family) => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.libelle_famille}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedRecommendation} onValueChange={setSelectedRecommendation}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Toutes les recommandations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les recommandations</SelectItem>
                  <SelectItem value="Commande urgente">Commande urgente</SelectItem>
                  <SelectItem value="Surveiller">Surveiller</SelectItem>
                  <SelectItem value="Stock optimal">Stock optimal</SelectItem>
                  <SelectItem value="Surstockage">Surstockage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshData}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Actualiser
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportData('pdf')}
              >
                <Download className="h-4 w-4 mr-1" />
                Exporter PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportData('excel')}
              >
                <Download className="h-4 w-4 mr-1" />
                Exporter Excel
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={runCalculation}
                disabled={loading}
              >
                <Calculator className="h-4 w-4 mr-1" />
                Recalculer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau détaillé des prévisions */}
      <Card>
        <CardHeader>
          <CardTitle>Prévisions Détaillées</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="text-center">Stock Actuel</TableHead>
                <TableHead className="text-center">Prévision</TableHead>
                <TableHead className="text-center">Fiabilité</TableHead>
                <TableHead className="text-center">Tendance</TableHead>
                <TableHead className="text-center">Recommandation</TableHead>
                <TableHead className="text-center">Qté Recommandée</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">Aucune prévision disponible</p>
                      <Button onClick={runCalculation} variant="outline" size="sm">
                        <Calculator className="h-4 w-4 mr-2" />
                        Générer les prévisions
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.nom}</TableCell>
                    <TableCell className="text-center">{product.stockActuel}</TableCell>
                    <TableCell className="text-center">{getPrevisionValue(product)}</TableCell>
                    <TableCell className="text-center">{product.fiabilite}%</TableCell>
                    <TableCell className="text-center">
                      {getTendanceBadge(product.tendance)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getRecommendationBadge(product.recommandation)}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.quantiteRecommandee > 0 ? product.quantiteRecommandee : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForecastAnalysis;