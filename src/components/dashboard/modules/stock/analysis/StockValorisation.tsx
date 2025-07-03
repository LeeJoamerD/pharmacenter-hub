import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Calendar as CalendarIcon,
  Download,
  Eye,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ValorizedProduct {
  id: string;
  nom: string;
  categorie: string;
  quantiteStock: number;
  prixUnitaire: number;
  valeurTotale: number;
  evolution: number;
  statut: 'stable' | 'hausse' | 'baisse';
}

const StockValorisation = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('mois');
  const [selectedCategory, setSelectedCategory] = useState('toutes');
  const [dateFrom, setDateFrom] = useState<Date>();

  // Données mockées pour la valorisation
  const products: ValorizedProduct[] = [
    {
      id: '1',
      nom: 'Paracétamol 500mg',
      categorie: 'Antalgiques',
      quantiteStock: 2500,
      prixUnitaire: 0.45,
      valeurTotale: 1125,
      evolution: 5.2,
      statut: 'hausse'
    },
    {
      id: '2',
      nom: 'Amoxicilline 1g',
      categorie: 'Antibiotiques',
      quantiteStock: 850,
      prixUnitaire: 2.80,
      valeurTotale: 2380,
      evolution: -2.1,
      statut: 'baisse'
    },
    {
      id: '3',
      nom: 'Doliprane 1000mg',
      categorie: 'Antalgiques',
      quantiteStock: 1800,
      prixUnitaire: 0.65,
      valeurTotale: 1170,
      evolution: 0.8,
      statut: 'stable'
    }
  ];

  const totalValorisation = products.reduce((sum, product) => sum + product.valeurTotale, 0);
  const moyenneEvolution = products.reduce((sum, product) => sum + product.evolution, 0) / products.length;

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'hausse':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'baisse':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (statut: string) => {
    const colors = {
      hausse: 'bg-green-100 text-green-800 border-green-200',
      baisse: 'bg-red-100 text-red-800 border-red-200',
      stable: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    return (
      <Badge className={colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {statut === 'hausse' ? 'En hausse' : statut === 'baisse' ? 'En baisse' : 'Stable'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Métriques de valorisation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valeur Total Stock</p>
              <p className="text-2xl font-bold">{totalValorisation.toLocaleString('fr-FR')} €</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Évolution Moyenne</p>
              <p className={`text-2xl font-bold ${moyenneEvolution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {moyenneEvolution >= 0 ? '+' : ''}{moyenneEvolution.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Ce mois</p>
            </div>
            {moyenneEvolution >= 0 ? (
              <TrendingUp className="h-8 w-8 text-green-600" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-600" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Produits Valorisés</p>
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-xs text-muted-foreground">Articles analysés</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valeur Moy./Produit</p>
              <p className="text-2xl font-bold">
                {(totalValorisation / products.length).toLocaleString('fr-FR')} €
              </p>
              <p className="text-xs text-muted-foreground">Par article</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres d'Analyse</CardTitle>
          <CardDescription>Personnalisez votre analyse de valorisation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semaine">Cette semaine</SelectItem>
                <SelectItem value="mois">Ce mois</SelectItem>
                <SelectItem value="trimestre">Ce trimestre</SelectItem>
                <SelectItem value="annee">Cette année</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes catégories</SelectItem>
                <SelectItem value="antalgiques">Antalgiques</SelectItem>
                <SelectItem value="antibiotiques">Antibiotiques</SelectItem>
                <SelectItem value="cardiovasculaire">Cardiovasculaire</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Date de début
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

            <Button>
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau de valorisation détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Valorisation Détaillée par Produit</CardTitle>
          <CardDescription>Analyse de la valeur du stock pour chaque produit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="text-right">Prix Unitaire</TableHead>
                  <TableHead className="text-right">Valeur Totale</TableHead>
                  <TableHead className="text-right">Évolution</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.nom}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.categorie}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {product.quantiteStock.toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {product.prixUnitaire.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {product.valeurTotale.toLocaleString('fr-FR')} €
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`flex items-center justify-end gap-2 ${
                        product.evolution >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {getStatusIcon(product.statut)}
                        <span className="font-mono">
                          {product.evolution >= 0 ? '+' : ''}{product.evolution.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(product.statut)}
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

export default StockValorisation;