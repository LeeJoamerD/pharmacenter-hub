import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Calendar as CalendarIcon,
  Download,
  Eye,
  BarChart3,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStockValorisation } from '@/hooks/useStockValorisation';

const StockValorisation = () => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');

  const {
    products,
    metrics,
    families,
    categories,
    loading,
    error,
    filters,
    updateFilters,
    refetch,
    exportData
  } = useStockValorisation();

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

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    await exportData(format);
  };

  const handleFilterChange = (key: string, value: any) => {
    updateFilters({ [key]: value });
  };

  const applyAdvancedFilters = () => {
    updateFilters({
      dateFrom,
      dateTo,
      minValue: minValue ? parseFloat(minValue) : undefined,
      maxValue: maxValue ? parseFloat(maxValue) : undefined
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Erreur lors du chargement des données</p>
          <Button onClick={refetch} variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques de valorisation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valeur Total Stock</p>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{metrics.totalValorisation.toLocaleString('fr-FR')} €</p>
              )}
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Évolution Moyenne</p>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <p className={`text-2xl font-bold ${metrics.moyenneEvolution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.moyenneEvolution >= 0 ? '+' : ''}{metrics.moyenneEvolution}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {filters.period === 'semaine' ? 'Cette semaine' : 
                     filters.period === 'mois' ? 'Ce mois' :
                     filters.period === 'trimestre' ? 'Ce trimestre' : 'Cette année'}
                  </p>
                </>
              )}
            </div>
            {loading ? (
              <Skeleton className="h-8 w-8 rounded" />
            ) : metrics.moyenneEvolution >= 0 ? (
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
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <p className="text-2xl font-bold">{metrics.nombreProduits}</p>
                  <p className="text-xs text-muted-foreground">Articles analysés</p>
                </>
              )}
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valeur Moy./Produit</p>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <p className="text-2xl font-bold">
                    {metrics.valeurMoyenneParProduit.toLocaleString('fr-FR')} €
                  </p>
                  <p className="text-xs text-muted-foreground">Par article</p>
                </>
              )}
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filtres d'Analyse</CardTitle>
              <CardDescription>Personnalisez votre analyse de valorisation</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtres avancés
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtres principaux */}
            <div className="flex flex-wrap gap-4">
              <Select value={filters.period} onValueChange={(value) => handleFilterChange('period', value)}>
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

              <Select value={filters.famille} onValueChange={(value) => handleFilterChange('famille', value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Famille" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes familles</SelectItem>
                  {families.map((famille) => (
                    <SelectItem key={famille.id} value={famille.id}>
                      {famille.libelle_famille}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exporter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="grid gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport('csv')}
                      className="justify-start"
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport('excel')}
                      className="justify-start"
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export Excel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport('pdf')}
                      className="justify-start"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Export PDF
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Filtres avancés */}
            {showAdvancedFilters && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom">Date de début</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: fr }) : "Sélectionner"}
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateTo">Date de fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: fr }) : "Sélectionner"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minValue">Valeur min. (€)</Label>
                    <Input
                      id="minValue"
                      type="number"
                      placeholder="0"
                      value={minValue}
                      onChange={(e) => setMinValue(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxValue">Valeur max. (€)</Label>
                    <Input
                      id="maxValue"
                      type="number"
                      placeholder="10000"
                      value={maxValue}
                      onChange={(e) => setMaxValue(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button onClick={applyAdvancedFilters}>
                    Appliquer les filtres
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tableau de valorisation détaillé */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Valorisation Détaillée par Produit</CardTitle>
              <CardDescription>Analyse de la valeur du stock pour chaque produit</CardDescription>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>CIP</TableHead>
                  <TableHead>Famille</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="text-right">Prix Unitaire</TableHead>
                  <TableHead className="text-right">Valeur Totale</TableHead>
                  <TableHead className="text-right">Évolution</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Rotation</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      Aucun produit trouvé avec les filtres actuels
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{product.nom}</div>
                          <div className="text-xs text-muted-foreground">
                            {product.statut_stock}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.cip}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.famille}</Badge>
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
                            {product.evolution >= 0 ? '+' : ''}{product.evolution}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(product.statut)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {product.rotation}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              // Afficher les détails du produit
                              console.log('Détails du produit:', product);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
    </div>
  );
};

export default StockValorisation;