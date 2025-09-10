import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Package, ShoppingCart, Search, Filter, Download, Bell, Eye } from 'lucide-react';
import { useLowStockData } from '@/hooks/useLowStockData';
import { useCurrentStock } from '@/hooks/useCurrentStock';
import { LowStockActionService } from '@/services/LowStockActionService';
import { ExportService } from '@/services/ExportService';
import { useToast } from '@/hooks/use-toast';

const LowStockProducts = () => {
  const { 
    lowStockItems, 
    metrics, 
    categories, 
    filters, 
    isLoading 
  } = useLowStockData();

  const { stockData } = useCurrentStock();
  const { toast } = useToast();

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const getStatusBadge = (statut: string) => {
    const configs = {
      critique: { variant: 'destructive', label: 'Critique' },
      faible: { variant: 'default', label: 'Faible' },
      attention: { variant: 'secondary', label: 'Attention' }
    };
    
    const config = configs[statut as keyof typeof configs] || configs.faible;
    return (
      <Badge variant={config.variant as any}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (statut: string) => {
    const className = statut === 'critique' ? 'text-red-500' : 
                     statut === 'faible' ? 'text-orange-500' : 'text-yellow-500';
    return <AlertTriangle className={`h-4 w-4 ${className}`} />;
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === lowStockItems.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(lowStockItems.map(item => item.id));
    }
  };

  const handleBulkOrder = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Aucun produit sélectionné",
        description: "Veuillez sélectionner au moins un produit",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedItems = lowStockItems.filter(item => selectedProducts.includes(item.id));
      const result = await LowStockActionService.executeOrderAction(selectedItems);
      
      if (result.success) {
        toast({
          title: "Commande groupée créée",
          description: `Commande ${result.commande_id} créée pour ${selectedProducts.length} produits`,
        });
        setSelectedProducts([]);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande groupée",
        variant: "destructive",
      });
    }
  };

  const handleBulkAlert = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Aucun produit sélectionné",
        description: "Veuillez sélectionner au moins un produit",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedItems = lowStockItems.filter(item => selectedProducts.includes(item.id));
      await LowStockActionService.executeAlertAction(selectedItems);
      
      toast({
        title: "Alertes créées",
        description: `Alertes activées pour ${selectedProducts.length} produits`,
      });
      setSelectedProducts([]);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer les alertes",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      const result = await ExportService.exportLowStockData(lowStockItems, {
        format: 'csv',
        includeMetrics: true
      });
      
      if (result.success) {
        toast({
          title: "Export réussi",
          description: `Fichier ${result.filename} téléchargé`,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits en Stock Faible</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.criticalItems} critiques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur à Risque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalValue.toLocaleString()} F</div>
            <p className="text-xs text-muted-foreground">Stock sous seuil</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions Requises</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {selectedProducts.length || metrics.urgentActions}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedProducts.length > 0 ? 'Sélectionnés' : 'Commandes nécessaires'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et actions */}
      <Card>
        <CardHeader>
          <CardTitle>Produits en Stock Faible</CardTitle>
          <CardDescription>
            Gestion des produits nécessitant un réapprovisionnement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, code ou DCI..."
                  value={filters.searchTerm}
                  onChange={(e) => filters.setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filters.categoryFilter} onValueChange={filters.setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.libelle_famille} value={cat.libelle_famille}>
                      {cat.libelle_famille}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filters.statusFilter} onValueChange={filters.setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="critique">Critique</SelectItem>
                  <SelectItem value="faible">Faible</SelectItem>
                  <SelectItem value="attention">Attention</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Actions groupées */}
          {selectedProducts.length > 0 && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{selectedProducts.length} produit(s) sélectionné(s)</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBulkAlert}>
                    <Bell className="h-4 w-4 mr-2" />
                    Créer Alertes
                  </Button>
                  <Button onClick={handleBulkOrder}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Commande Groupée
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Table des produits */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === lowStockItems.length && lowStockItems.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Stock Actuel</TableHead>
                  <TableHead>Seuils</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(item.id)}
                        onChange={() => handleSelectProduct(item.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.statut)}
                        {getStatusBadge(item.statut)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.nomProduit}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.codeProduit}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{item.quantiteActuelle}</div>
                        <div className="text-xs text-muted-foreground">{item.unite}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Min: {item.seuilMinimum}</div>
                        <div className="text-muted-foreground">Opt: {item.seuilOptimal}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.fournisseurPrincipal || 'Non défini'}
                    </TableCell>
                    <TableCell>
                      <div className="text-right">
                        <div>{item.valeurStock.toLocaleString()} F</div>
                        <div className="text-xs text-muted-foreground">
                          {item.prixUnitaire.toLocaleString()} F/u
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Bell className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {lowStockItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun produit en stock faible trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LowStockProducts;