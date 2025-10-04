import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, ShoppingCart, Bell, Package, Search, Filter } from 'lucide-react';
import { useLowStockData } from '@/hooks/useLowStockData';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

const LowStockProducts = () => {
  const { 
    lowStockItems, 
    metrics, 
    categories,
    filters,
    isLoading 
  } = useLowStockData();
  const { toast } = useToast();

  const handleUrgentOrder = () => {
    toast({
      title: "Commande d'urgence",
      description: "Préparation d'une commande d'urgence pour tous les produits critiques",
    });
  };

  const handleConfigureAlerts = () => {
    toast({
      title: "Configuration des alertes",
      description: "Ouverture du panneau de configuration des alertes de stock",
    });
  };

  const handleViewHistory = () => {
    toast({
      title: "Historique",
      description: "Affichage de l'historique des mouvements de stock",
    });
  };

  const handleOrder = (product: any) => {
    toast({
      title: "Commande produit",
      description: `Commande pour ${product.libelle_produit} ajoutée`,
    });
  };

  const handleAlert = (product: any) => {
    toast({
      title: "Alerte configurée",
      description: `Alerte activée pour ${product.nomProduit}`,
    });
  };

  const getSeverityColor = (status: string) => {
    switch (status) {
      case 'critique': return 'bg-red-100 text-red-800 border-red-200';
      case 'faible': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStockPercentage = (current: number, minimum: number) => {
    if (minimum === 0) return 100;
    return Math.min((current / minimum) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage <= 25) return 'bg-red-500';
    if (percentage <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Résumé des alertes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Stock Critique</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {metrics.criticalItems}
            </div>
            <p className="text-xs text-muted-foreground">Nécessite action immédiate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Stock Faible</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {metrics.lowItems}
            </div>
            <p className="text-xs text-muted-foreground">À surveiller</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total à Réapprovisionner</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.totalItems}
            </div>
            <p className="text-xs text-muted-foreground">Produits concernés</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, code ou DCI..."
                value={filters.searchTerm}
                onChange={(e) => filters.setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={filters.categoryFilter}
              onValueChange={filters.setCategoryFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.libelle_famille} value={cat.libelle_famille}>
                    {cat.libelle_famille}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.statusFilter}
              onValueChange={filters.setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
                <SelectItem value="faible">Faible</SelectItem>
                <SelectItem value="attention">Attention</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {lowStockItems.length > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              <strong>{lowStockItems.length}</strong> produit{lowStockItems.length > 1 ? 's' : ''} trouvé{lowStockItems.length > 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Actions Rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" onClick={handleUrgentOrder}>
              <ShoppingCart className="h-4 w-4" />
              Commande d'Urgence
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleConfigureAlerts}>
              <Bell className="h-4 w-4" />
              Configurer Alertes
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleViewHistory}>
              <Package className="h-4 w-4" />
              Voir Historique
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Produits en Stock Faible ({lowStockItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium text-green-600">Excellent !</p>
              <p>Aucun produit en stock faible détecté</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Stock Actuel</TableHead>
                    <TableHead>Stock Minimum</TableHead>
                    <TableHead>Niveau Stock</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Dernière Sortie</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems
                    .sort((a, b) => {
                      // Trier par criticité puis par pourcentage de stock
                      if (a.statut === 'critique' && b.statut !== 'critique') return -1;
                      if (b.statut === 'critique' && a.statut !== 'critique') return 1;
                      
                      const aPercentage = getStockPercentage(a.quantiteActuelle, a.seuilMinimum);
                      const bPercentage = getStockPercentage(b.quantiteActuelle, b.seuilMinimum);
                      return aPercentage - bPercentage;
                    })
                    .map((item) => {
                      const stockPercentage = getStockPercentage(item.quantiteActuelle, item.seuilMinimum);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.nomProduit}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.categorie}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.codeProduit}</TableCell>
                          <TableCell>
                            <div className="font-semibold text-lg">{item.quantiteActuelle}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-muted-foreground">{item.seuilMinimum}</div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <Progress 
                                value={stockPercentage} 
                                className="h-2"
                              />
                              <div className="text-xs text-muted-foreground">
                                {stockPercentage.toFixed(0)}% du minimum
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(item.statut)}>
                              {item.statut === 'critique' ? 'URGENT' : item.statut === 'faible' ? 'ATTENTION' : 'SURVEILLER'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {item.dernierMouvement 
                                ? new Date(item.dernierMouvement).toLocaleDateString()
                                : 'N/A'
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="default" 
                                className="gap-1"
                                onClick={() => handleOrder(item)}
                              >
                                <ShoppingCart className="h-3 w-3" />
                                Commander
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-1"
                                onClick={() => handleAlert(item)}
                              >
                                <Bell className="h-3 w-3" />
                                Alerter
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LowStockProducts;