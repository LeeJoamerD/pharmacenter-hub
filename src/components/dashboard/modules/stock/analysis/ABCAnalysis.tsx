import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChartBar, 
  Star, 
  Circle, 
  Triangle,
  Download,
  Eye,
  TrendingUp,
  Package,
  DollarSign
} from 'lucide-react';

interface ABCProduct {
  id: string;
  nom: string;
  categorie: string;
  classe: 'A' | 'B' | 'C';
  chiffreAffaires: number;
  pourcentageCA: number;
  pourcentageCumule: number;
  quantiteVendue: number;
  rotation: number;
}

const ABCAnalysis = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('trimestre');
  const [selectedClass, setSelectedClass] = useState('toutes');

  // Données mockées pour l'analyse ABC
  const products: ABCProduct[] = [
    {
      id: '1',
      nom: 'Doliprane 1000mg',
      categorie: 'Antalgiques',
      classe: 'A',
      chiffreAffaires: 45000,
      pourcentageCA: 25.2,
      pourcentageCumule: 25.2,
      quantiteVendue: 8500,
      rotation: 12.5
    },
    {
      id: '2',
      nom: 'Amoxicilline 1g',
      categorie: 'Antibiotiques',
      classe: 'A',
      chiffreAffaires: 38000,
      pourcentageCA: 21.3,
      pourcentageCumule: 46.5,
      quantiteVendue: 3200,
      rotation: 8.2
    },
    {
      id: '3',
      nom: 'Paracétamol 500mg',
      categorie: 'Antalgiques',
      classe: 'A',
      chiffreAffaires: 25000,
      pourcentageCA: 14.0,
      pourcentageCumule: 60.5,
      quantiteVendue: 12000,
      rotation: 15.3
    },
    {
      id: '4',
      nom: 'Ibuprofène 400mg',
      categorie: 'Anti-inflammatoires',
      classe: 'B',
      chiffreAffaires: 18000,
      pourcentageCA: 10.1,
      pourcentageCumule: 70.6,
      quantiteVendue: 4500,
      rotation: 6.8
    },
    {
      id: '5',
      nom: 'Aspirine 500mg',
      categorie: 'Antalgiques',
      classe: 'B',
      chiffreAffaires: 15000,
      pourcentageCA: 8.4,
      pourcentageCumule: 79.0,
      quantiteVendue: 6800,
      rotation: 9.1
    },
    {
      id: '6',
      nom: 'Vitamines B Complex',
      categorie: 'Compléments',
      classe: 'C',
      chiffreAffaires: 8000,
      pourcentageCA: 4.5,
      pourcentageCumule: 83.5,
      quantiteVendue: 1200,
      rotation: 2.3
    }
  ];

  const classeStats = {
    A: { count: products.filter(p => p.classe === 'A').length, ca: 60.5, color: 'text-green-600' },
    B: { count: products.filter(p => p.classe === 'B').length, ca: 18.5, color: 'text-orange-600' },
    C: { count: products.filter(p => p.classe === 'C').length, ca: 21.0, color: 'text-red-600' }
  };

  const getClassIcon = (classe: string) => {
    switch (classe) {
      case 'A':
        return <Star className="h-4 w-4 text-green-600" />;
      case 'B':
        return <Circle className="h-4 w-4 text-orange-600" />;
      case 'C':
        return <Triangle className="h-4 w-4 text-red-600" />;
      default:
        return <ChartBar className="h-4 w-4" />;
    }
  };

  const getClassBadge = (classe: string) => {
    const colors = {
      A: 'bg-green-100 text-green-800 border-green-200',
      B: 'bg-orange-100 text-orange-800 border-orange-200',
      C: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <Badge className={colors[classe as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        Classe {classe}
      </Badge>
    );
  };

  const filteredProducts = products.filter(product => {
    return selectedClass === 'toutes' || product.classe === selectedClass;
  });

  const totalCA = products.reduce((sum, product) => sum + product.chiffreAffaires, 0);

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble des classes ABC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Classe A - Premium</p>
              <p className="text-2xl font-bold text-green-600">{classeStats.A.count} produits</p>
              <p className="text-sm text-green-600">{classeStats.A.ca}% du CA</p>
            </div>
            <Star className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Classe B - Standard</p>
              <p className="text-2xl font-bold text-orange-600">{classeStats.B.count} produits</p>
              <p className="text-sm text-orange-600">{classeStats.B.ca}% du CA</p>
            </div>
            <Circle className="h-8 w-8 text-orange-600" />
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Classe C - Économique</p>
              <p className="text-2xl font-bold text-red-600">{classeStats.C.count} produits</p>
              <p className="text-sm text-red-600">{classeStats.C.ca}% du CA</p>
            </div>
            <Triangle className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>
      </div>

      {/* Métriques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">CA Total Analysé</p>
              <p className="text-2xl font-bold">{totalCA.toLocaleString('fr-FR')} €</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Produits Analysés</p>
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-xs text-muted-foreground">Articles classifiés</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rotation Moyenne</p>
              <p className="text-2xl font-bold">
                {(products.reduce((sum, p) => sum + p.rotation, 0) / products.length).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Tours/an</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Règle 80/20</p>
              <p className="text-2xl font-bold text-green-600">Respectée</p>
              <p className="text-xs text-muted-foreground">Pareto validé</p>
            </div>
            <ChartBar className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>
      </div>

      {/* Filtres et actions */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse ABC - Paramètres</CardTitle>
          <CardDescription>Configurez votre analyse selon la méthode ABC (Pareto)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Période d'analyse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mois">Ce mois</SelectItem>
                <SelectItem value="trimestre">Ce trimestre</SelectItem>
                <SelectItem value="annee">Cette année</SelectItem>
                <SelectItem value="personnalise">Période personnalisée</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Classe ABC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les classes</SelectItem>
                <SelectItem value="A">Classe A seulement</SelectItem>
                <SelectItem value="B">Classe B seulement</SelectItem>
                <SelectItem value="C">Classe C seulement</SelectItem>
              </SelectContent>
            </Select>

            <Button>
              <Download className="mr-2 h-4 w-4" />
              Exporter Analyse
            </Button>

            <Button variant="outline">
              Recalculer Classes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Distribution des classes */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution ABC</CardTitle>
          <CardDescription>Répartition du chiffre d'affaires par classe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-green-600" />
                  Classe A (80% du CA avec 20% des produits)
                </span>
                <span className="font-medium">{classeStats.A.ca}%</span>
              </div>
              <Progress value={classeStats.A.ca} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Circle className="h-4 w-4 text-orange-600" />
                  Classe B (15% du CA avec 30% des produits)
                </span>
                <span className="font-medium">{classeStats.B.ca}%</span>
              </div>
              <Progress value={classeStats.B.ca} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Triangle className="h-4 w-4 text-red-600" />
                  Classe C (5% du CA avec 50% des produits)
                </span>
                <span className="font-medium">{classeStats.C.ca}%</span>
              </div>
              <Progress value={classeStats.C.ca} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Classification ABC Détaillée</CardTitle>
          <CardDescription>Analyse produit par produit selon la méthode ABC</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead className="text-right">CA</TableHead>
                  <TableHead className="text-right">% CA</TableHead>
                  <TableHead className="text-right">% Cumulé</TableHead>
                  <TableHead className="text-right">Qté Vendue</TableHead>
                  <TableHead className="text-right">Rotation</TableHead>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getClassIcon(product.classe)}
                        {getClassBadge(product.classe)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {product.chiffreAffaires.toLocaleString('fr-FR')} €
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {product.pourcentageCA.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {product.pourcentageCumule.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {product.quantiteVendue.toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {product.rotation.toFixed(1)}
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

export default ABCAnalysis;