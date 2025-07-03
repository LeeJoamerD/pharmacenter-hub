import React, { useState } from 'react';
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
  Calendar
} from 'lucide-react';

interface RotationProduct {
  id: string;
  nom: string;
  categorie: string;
  stockMoyen: number;
  consommationAnnuelle: number;
  tauxRotation: number;
  dureeEcoulement: number; // en jours
  statut: 'excellent' | 'bon' | 'moyen' | 'faible' | 'critique';
  evolution: number;
  dernierMouvement: Date;
}

const RotationAnalysis = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('annuel');
  const [selectedCategory, setSelectedCategory] = useState('toutes');
  const [selectedStatus, setSelectedStatus] = useState('tous');

  // Données mockées pour l'analyse de rotation
  const products: RotationProduct[] = [
    {
      id: '1',
      nom: 'Paracétamol 500mg',
      categorie: 'Antalgiques',
      stockMoyen: 1200,
      consommationAnnuelle: 14400,
      tauxRotation: 12.0,
      dureeEcoulement: 30,
      statut: 'excellent',
      evolution: 8.5,
      dernierMouvement: new Date('2024-01-25')
    },
    {
      id: '2',
      nom: 'Doliprane 1000mg',
      categorie: 'Antalgiques',
      stockMoyen: 800,
      consommationAnnuelle: 7200,
      tauxRotation: 9.0,
      dureeEcoulement: 40,
      statut: 'bon',
      evolution: 3.2,
      dernierMouvement: new Date('2024-01-24')
    },
    {
      id: '3',
      nom: 'Amoxicilline 1g',
      categorie: 'Antibiotiques',
      stockMoyen: 600,
      consommationAnnuelle: 3600,
      tauxRotation: 6.0,
      dureeEcoulement: 60,
      statut: 'moyen',
      evolution: -1.5,
      dernierMouvement: new Date('2024-01-20')
    },
    {
      id: '4',
      nom: 'Vitamines B Complex',
      categorie: 'Compléments',
      stockMoyen: 400,
      consommationAnnuelle: 800,
      tauxRotation: 2.0,
      dureeEcoulement: 180,
      statut: 'faible',
      evolution: -5.8,
      dernierMouvement: new Date('2024-01-10')
    },
    {
      id: '5',
      nom: 'Sirop ancienne formule',
      categorie: 'Sirops',
      stockMoyen: 250,
      consommationAnnuelle: 125,
      tauxRotation: 0.5,
      dureeEcoulement: 720,
      statut: 'critique',
      evolution: -12.3,
      dernierMouvement: new Date('2023-12-15')
    }
  ];

  const rotationStats = {
    excellent: products.filter(p => p.statut === 'excellent').length,
    bon: products.filter(p => p.statut === 'bon').length,
    moyen: products.filter(p => p.statut === 'moyen').length,
    faible: products.filter(p => p.statut === 'faible').length,
    critique: products.filter(p => p.statut === 'critique').length
  };

  const moyenneRotation = products.reduce((sum, p) => sum + p.tauxRotation, 0) / products.length;
  const totalValeurStock = products.reduce((sum, p) => sum + (p.stockMoyen * 2.5), 0); // Prix estimé 2.5€

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

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'toutes' || product.categorie === selectedCategory;
    const matchesStatus = selectedStatus === 'tous' || product.statut === selectedStatus;
    return matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Métriques de rotation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rotation Moyenne</p>
              <p className={`text-2xl font-bold ${getRotationColor(moyenneRotation)}`}>
                {moyenneRotation.toFixed(1)}
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
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-xs text-muted-foreground">Articles suivis</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valeur Analysée</p>
              <p className="text-2xl font-bold">{totalValeurStock.toLocaleString('fr-FR')} €</p>
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
                {rotationStats.faible + rotationStats.critique}
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
              <div className="text-2xl font-bold text-green-600">{rotationStats.excellent}</div>
              <div className="text-sm text-muted-foreground">Excellent</div>
              <div className="text-xs text-green-600">&gt; 10 tours/an</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{rotationStats.bon}</div>
              <div className="text-sm text-muted-foreground">Bon</div>
              <div className="text-xs text-blue-600">6-10 tours/an</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{rotationStats.moyen}</div>
              <div className="text-sm text-muted-foreground">Moyen</div>
              <div className="text-xs text-orange-600">3-6 tours/an</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{rotationStats.faible}</div>
              <div className="text-sm text-muted-foreground">Faible</div>
              <div className="text-xs text-red-600">1-3 tours/an</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-700">{rotationStats.critique}</div>
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
                <SelectItem value="Antalgiques">Antalgiques</SelectItem>
                <SelectItem value="Antibiotiques">Antibiotiques</SelectItem>
                <SelectItem value="Compléments">Compléments</SelectItem>
                <SelectItem value="Sirops">Sirops</SelectItem>
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

            <Button>
              <Download className="mr-2 h-4 w-4" />
              Exporter
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

export default RotationAnalysis;