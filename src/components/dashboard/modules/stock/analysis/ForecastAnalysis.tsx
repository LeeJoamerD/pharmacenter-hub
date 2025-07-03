import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle,
  Download,
  BarChart3,
  LineChart,
  Target
} from 'lucide-react';

interface ForecastProduct {
  id: string;
  nom: string;
  categorie: string;
  stockActuel: number;
  consommationMoyenne: number; // par mois
  prevision1Mois: number;
  prevision3Mois: number;
  prevision6Mois: number;
  fiabilite: number; // %
  tendance: 'hausse' | 'baisse' | 'stable';
  seuil: number;
  recommandation: 'commander' | 'surveiller' | 'diminuer' | 'normal';
  prochainOrder: Date;
  quantiteRecommandee: number;
}

const ForecastAnalysis = () => {
  const [selectedHorizon, setSelectedHorizon] = useState('3mois');
  const [selectedCategory, setSelectedCategory] = useState('toutes');
  const [selectedRecommendation, setSelectedRecommendation] = useState('toutes');

  // Données mockées pour les prévisions
  const products: ForecastProduct[] = [
    {
      id: '1',
      nom: 'Paracétamol 500mg',
      categorie: 'Antalgiques',
      stockActuel: 1200,
      consommationMoyenne: 400,
      prevision1Mois: 380,
      prevision3Mois: 1140,
      prevision6Mois: 2400,
      fiabilite: 92,
      tendance: 'stable',
      seuil: 500,
      recommandation: 'normal',
      prochainOrder: new Date('2024-02-15'),
      quantiteRecommandee: 1500
    },
    {
      id: '2',
      nom: 'Doliprane 1000mg',
      categorie: 'Antalgiques',
      stockActuel: 350,
      consommationMoyenne: 300,
      prevision1Mois: 320,
      prevision3Mois: 960,
      prevision6Mois: 2100,
      fiabilite: 88,
      tendance: 'hausse',
      seuil: 400,
      recommandation: 'commander',
      prochainOrder: new Date('2024-02-01'),
      quantiteRecommandee: 2000
    },
    {
      id: '3',
      nom: 'Amoxicilline 1g',
      categorie: 'Antibiotiques',
      stockActuel: 800,
      consommationMoyenne: 150,
      prevision1Mois: 140,
      prevision3Mois: 420,
      prevision6Mois: 840,
      fiabilite: 85,
      tendance: 'baisse',
      seuil: 200,
      recommandation: 'surveiller',
      prochainOrder: new Date('2024-03-01'),
      quantiteRecommandee: 1000
    },
    {
      id: '4',
      nom: 'Vitamines B Complex',
      categorie: 'Compléments',
      stockActuel: 600,
      consommationMoyenne: 50,
      prevision1Mois: 45,
      prevision3Mois: 135,
      prevision6Mois: 270,
      fiabilite: 70,
      tendance: 'baisse',
      seuil: 100,
      recommandation: 'diminuer',
      prochainOrder: new Date('2024-04-15'),
      quantiteRecommandee: 200
    }
  ];

  const forecastStats = {
    commander: products.filter(p => p.recommandation === 'commander').length,
    surveiller: products.filter(p => p.recommandation === 'surveiller').length,
    diminuer: products.filter(p => p.recommandation === 'diminuer').length,
    normal: products.filter(p => p.recommandation === 'normal').length
  };

  const fiabiliteMoyenne = products.reduce((sum, p) => sum + p.fiabilite, 0) / products.length;
  const valeurPrevisionnelle = products.reduce((sum, p) => sum + (p.prevision3Mois * 2.5), 0); // Prix estimé 2.5€

  const getTendanceIcon = (tendance: string) => {
    switch (tendance) {
      case 'hausse':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'baisse':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
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
        {labels[tendance as keyof typeof labels] || tendance}
      </Badge>
    );
  };

  const getRecommendationIcon = (recommandation: string) => {
    switch (recommandation) {
      case 'commander':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'surveiller':
        return <Eye className="h-4 w-4 text-orange-600" />;
      case 'diminuer':
        return <TrendingDown className="h-4 w-4 text-purple-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getRecommendationBadge = (recommandation: string) => {
    const colors = {
      commander: 'bg-red-100 text-red-800 border-red-200',
      surveiller: 'bg-orange-100 text-orange-800 border-orange-200',
      diminuer: 'bg-purple-100 text-purple-800 border-purple-200',
      normal: 'bg-green-100 text-green-800 border-green-200'
    };

    const labels = {
      commander: 'Commander',
      surveiller: 'Surveiller',
      diminuer: 'Réduire stock',
      normal: 'Normal'
    };

    return (
      <Badge className={colors[recommandation as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[recommandation as keyof typeof labels] || recommandation}
      </Badge>
    );
  };

  const getFiabiliteColor = (fiabilite: number) => {
    if (fiabilite >= 90) return 'text-green-600';
    if (fiabilite >= 80) return 'text-blue-600';
    if (fiabilite >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'toutes' || product.categorie === selectedCategory;
    const matchesRecommendation = selectedRecommendation === 'toutes' || product.recommandation === selectedRecommendation;
    return matchesCategory && matchesRecommendation;
  });

  const getPrevisionValue = (product: ForecastProduct) => {
    switch (selectedHorizon) {
      case '1mois':
        return product.prevision1Mois;
      case '3mois':
        return product.prevision3Mois;
      case '6mois':
        return product.prevision6Mois;
      default:
        return product.prevision3Mois;
    }
  };

  return (
    <div className="space-y-6">
      {/* Métriques de prévision */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fiabilité Moyenne</p>
              <p className={`text-2xl font-bold ${getFiabiliteColor(fiabiliteMoyenne)}`}>
                {fiabiliteMoyenne.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Précision modèle</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Produits Analysés</p>
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-xs text-muted-foreground">Articles suivis</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valeur Prévisionnelle</p>
              <p className="text-2xl font-bold">{valeurPrevisionnelle.toLocaleString('fr-FR')} €</p>
              <p className="text-xs text-muted-foreground">3 mois</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Actions Urgentes</p>
              <p className="text-2xl font-bold text-red-600">
                {forecastStats.commander}
              </p>
              <p className="text-xs text-muted-foreground">À commander</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>
      </div>

      {/* Distribution des recommandations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommandations d'Actions</CardTitle>
          <CardDescription>Répartition des actions recommandées par l'algorithme de prévision</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{forecastStats.commander}</div>
              <div className="text-sm text-muted-foreground">À Commander</div>
              <div className="text-xs text-red-600">Action urgente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{forecastStats.surveiller}</div>
              <div className="text-sm text-muted-foreground">À Surveiller</div>
              <div className="text-xs text-orange-600">Suivi renforcé</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{forecastStats.diminuer}</div>
              <div className="text-sm text-muted-foreground">À Réduire</div>
              <div className="text-xs text-purple-600">Surstock détecté</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{forecastStats.normal}</div>
              <div className="text-sm text-muted-foreground">Normale</div>
              <div className="text-xs text-green-600">Situation stable</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de Prévision</CardTitle>
          <CardDescription>Configurez l'horizon et les critères d'analyse prévisionnelle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={selectedHorizon} onValueChange={setSelectedHorizon}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Horizon prévisionnel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1mois">1 mois</SelectItem>
                <SelectItem value="3mois">3 mois</SelectItem>
                <SelectItem value="6mois">6 mois</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes catégories</SelectItem>
                <SelectItem value="Antalgiques">Antalgiques</SelectItem>
                <SelectItem value="Antibiotiques">Antibiotiques</SelectItem>
                <SelectItem value="Compléments">Compléments</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedRecommendation} onValueChange={setSelectedRecommendation}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Recommandation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes actions</SelectItem>
                <SelectItem value="commander">À commander</SelectItem>
                <SelectItem value="surveiller">À surveiller</SelectItem>
                <SelectItem value="diminuer">À réduire</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>

            <Button>
              <Download className="mr-2 h-4 w-4" />
              Exporter Prévisions
            </Button>

            <Button variant="outline">
              <LineChart className="mr-2 h-4 w-4" />
              Recalculer Modèle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des prévisions */}
      <Card>
        <CardHeader>
          <CardTitle>Prévisions Détaillées</CardTitle>
          <CardDescription>Analyse prévisionnelle avec recommandations d'actions par produit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Stock Actuel</TableHead>
                  <TableHead className="text-right">Prévision</TableHead>
                  <TableHead className="text-right">Fiabilité</TableHead>
                  <TableHead>Tendance</TableHead>
                  <TableHead>Recommandation</TableHead>
                  <TableHead className="text-right">Qté Recommandée</TableHead>
                  <TableHead>Prochain Ordre</TableHead>
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
                      {product.stockActuel.toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {getPrevisionValue(product).toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-mono font-semibold ${getFiabiliteColor(product.fiabilite)}`}>
                          {product.fiabilite}%
                        </span>
                        <Progress value={product.fiabilite} className="w-16 h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTendanceIcon(product.tendance)}
                        {getTendanceBadge(product.tendance)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRecommendationIcon(product.recommandation)}
                        {getRecommendationBadge(product.recommandation)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {product.quantiteRecommandee.toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {product.prochainOrder.toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
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

export default ForecastAnalysis;