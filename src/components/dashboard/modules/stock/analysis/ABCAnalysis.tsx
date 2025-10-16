import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useABCAnalysis } from '@/hooks/useABCAnalysis';
import { 
  ChartBar, 
  Star, 
  Circle, 
  Triangle,
  Download,
  Eye,
  TrendingUp,
  Package,
  DollarSign,
  Search,
  RefreshCw,
  Calendar,
  Filter,
  AlertTriangle,
  ShoppingCart
} from 'lucide-react';

const ABCAnalysis = () => {
  const {
    analysis,
    filteredProducts,
    loading,
    error,
    filters,
    availableFamilies,
    availableCategories,
    updateFilters,
    refetchData,
    recalculateClasses,
    exportData,
    classeStats,
    totalCA,
    rotationMoyenne,
    respectePareto
  } = useABCAnalysis();

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Gestion de la recherche
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    updateFilters({ recherche: value });
  };

  // Gestion des exports
  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    await exportData(format);
  };

  // Gestion de l'affichage des détails produit
  const handleViewProductDetails = (product: any) => {
    setSelectedProduct(product);
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

  if (error) {
    if (error === 'NO_SALES_DATA') {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="text-center max-w-md">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-3">Aucune donnée de vente disponible</h3>
            <p className="text-muted-foreground mb-6">
              Veuillez d'abord saisir des ventes pour générer une analyse ABC.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                L'analyse ABC nécessite des données de vente pour classer vos produits selon leur performance.
              </p>
              <Button onClick={refetchData} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble des classes ABC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Classe A - Premium</p>
              {loading ? (
                <Skeleton className="h-8 w-24 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-green-600">{classeStats.A.count} produits</p>
              )}
              {loading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <p className="text-sm text-green-600">{classeStats.A.percentage.toFixed(1)}% du CA</p>
              )}
            </div>
            <Star className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Classe B - Standard</p>
              {loading ? (
                <Skeleton className="h-8 w-24 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-orange-600">{classeStats.B.count} produits</p>
              )}
              {loading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <p className="text-sm text-orange-600">{classeStats.B.percentage.toFixed(1)}% du CA</p>
              )}
            </div>
            <Circle className="h-8 w-8 text-orange-600" />
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Classe C - Économique</p>
              {loading ? (
                <Skeleton className="h-8 w-24 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-red-600">{classeStats.C.count} produits</p>
              )}
              {loading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <p className="text-sm text-red-600">{classeStats.C.percentage.toFixed(1)}% du CA</p>
              )}
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
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-bold">{totalCA.toLocaleString('fr-FR')} €</p>
              )}
              {analysis && (
                <p className="text-xs text-muted-foreground">{analysis.periodeAnalyse.libelle}</p>
              )}
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Produits Analysés</p>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{analysis?.totalProducts || 0}</p>
              )}
              <p className="text-xs text-muted-foreground">Articles classifiés</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rotation Moyenne</p>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">{rotationMoyenne.toFixed(1)}</p>
              )}
              <p className="text-xs text-muted-foreground">Tours/an</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Règle 80/20</p>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className={`text-2xl font-bold ${respectePareto ? 'text-green-600' : 'text-orange-600'}`}>
                  {respectePareto ? 'Respectée' : 'Partiellement'}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Pareto validé</p>
            </div>
            <ChartBar className={`h-8 w-8 ${respectePareto ? 'text-green-600' : 'text-orange-600'}`} />
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
          <div className="space-y-4">
            {/* Filtres principaux */}
            <div className="flex flex-wrap gap-4">
              <Select 
                value={filters.periode} 
                onValueChange={(value) => updateFilters({ periode: value as any })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Période d'analyse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mois">Ce mois</SelectItem>
                  <SelectItem value="trimestre">Ce trimestre</SelectItem>
                  <SelectItem value="semestre">Ce semestre</SelectItem>
                  <SelectItem value="annee">Cette année</SelectItem>
                  <SelectItem value="personnalise">Période personnalisée</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.classe || 'toutes'} 
                onValueChange={(value) => updateFilters({ classe: value === 'toutes' ? 'toutes' : value as any })}
              >
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

              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtres avancés
              </Button>
            </div>

            {/* Recherche */}
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtres avancés */}
            {showAdvancedFilters && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="famille">Famille de produits</Label>
                    <Select 
                      value={filters.famille_id || 'tous'} 
                      onValueChange={(value) => updateFilters({ famille_id: value === 'tous' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les familles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tous">Toutes les familles</SelectItem>
                        {availableFamilies.map(famille => (
                          <SelectItem key={famille.id} value={famille.id}>
                            {famille.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categorie">Catégorie de tarification</Label>
                    <Select 
                      value={filters.categorie_tarification_id || 'tous'} 
                      onValueChange={(value) => updateFilters({ categorie_tarification_id: value === 'tous' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les catégories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tous">Toutes les catégories</SelectItem>
                        {availableCategories.map(categorie => (
                          <SelectItem key={categorie.id} value={categorie.id}>
                            {categorie.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleExport('pdf')}
                disabled={loading}
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>

              <Button
                variant="outline"
                onClick={() => handleExport('excel')}
                disabled={loading}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>

              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                disabled={loading}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>

              <Button
                variant="outline"
                onClick={recalculateClasses}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Recalculer Classes
              </Button>
            </div>
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
                {loading ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  <span className="font-medium">{classeStats.A.percentage.toFixed(1)}%</span>
                )}
              </div>
              {loading ? (
                <Skeleton className="h-2 w-full" />
              ) : (
                <Progress value={classeStats.A.percentage} className="h-2" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Circle className="h-4 w-4 text-orange-600" />
                  Classe B (15% du CA avec 30% des produits)
                </span>
                {loading ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  <span className="font-medium">{classeStats.B.percentage.toFixed(1)}%</span>
                )}
              </div>
              {loading ? (
                <Skeleton className="h-2 w-full" />
              ) : (
                <Progress value={classeStats.B.percentage} className="h-2" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Triangle className="h-4 w-4 text-red-600" />
                  Classe C (5% du CA avec 50% des produits)
                </span>
                {loading ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  <span className="font-medium">{classeStats.C.percentage.toFixed(1)}%</span>
                )}
              </div>
              {loading ? (
                <Skeleton className="h-2 w-full" />
              ) : (
                <Progress value={classeStats.C.percentage} className="h-2" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Classification ABC Détaillée</CardTitle>
          <CardDescription>
            Analyse produit par produit selon la méthode ABC
            {filteredProducts.length > 0 && (
              <span className="ml-2 text-sm">
                ({filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} affiché{filteredProducts.length > 1 ? 's' : ''})
              </span>
            )}
          </CardDescription>
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
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Aucun produit trouvé pour les critères sélectionnés
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
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
                      <TableCell className="text-right font-mono">
                        {product.stockActuel.toLocaleString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewProductDetails(product)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Détails du produit</DialogTitle>
                                <DialogDescription>
                                  Analyse détaillée de {product.nom}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedProduct && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Produit</p>
                                      <p className="font-semibold">{selectedProduct.nom}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Catégorie</p>
                                      <p>{selectedProduct.categorie}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Classe ABC</p>
                                      <div className="flex items-center gap-2">
                                        {getClassIcon(selectedProduct.classe)}
                                        {getClassBadge(selectedProduct.classe)}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Chiffre d'affaires</p>
                                      <p className="font-semibold">{selectedProduct.chiffreAffaires.toLocaleString('fr-FR')} €</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Part du CA</p>
                                      <p>{selectedProduct.pourcentageCA.toFixed(2)}%</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Quantité vendue</p>
                                      <p>{selectedProduct.quantiteVendue.toLocaleString('fr-FR')}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Rotation</p>
                                      <p>{selectedProduct.rotation.toFixed(2)} tours/an</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Stock actuel</p>
                                      <p>{selectedProduct.stockActuel.toLocaleString('fr-FR')}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleExport('csv')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour les détails du produit */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du produit</DialogTitle>
              <DialogDescription>
                Analyse détaillée de {selectedProduct.nom}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Produit</p>
                  <p className="font-semibold">{selectedProduct.nom}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Catégorie</p>
                  <p>{selectedProduct.categorie}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Classe ABC</p>
                  <div className="flex items-center gap-2">
                    {getClassIcon(selectedProduct.classe)}
                    {getClassBadge(selectedProduct.classe)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Chiffre d'affaires</p>
                  <p className="font-semibold">{selectedProduct.chiffreAffaires.toLocaleString('fr-FR')} €</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Part du CA</p>
                  <p>{selectedProduct.pourcentageCA.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quantité vendue</p>
                  <p>{selectedProduct.quantiteVendue.toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rotation</p>
                  <p>{selectedProduct.rotation.toFixed(2)} tours/an</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stock actuel</p>
                  <p>{selectedProduct.stockActuel.toLocaleString('fr-FR')}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ABCAnalysis;