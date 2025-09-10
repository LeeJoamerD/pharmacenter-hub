import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Package, ShoppingCart, Search, Filter, Download, Bell } from 'lucide-react';
import { useLowStockData } from '@/hooks/useLowStockData';
import { useStockAlerts } from '@/hooks/useStockAlerts';
import { useSupplierOrders } from '@/hooks/useSupplierOrders';
import { LowStockActionService } from '@/services/LowStockActionService';
import { ExportService } from '@/services/ExportService';
import { useToast } from '@/hooks/use-toast';

const LowStockAlerts = () => {
  const { 
    lowStockItems, 
    metrics, 
    categories, 
    filters, 
    isLoading 
  } = useLowStockData();

  const { actions: alertActions } = useStockAlerts();
  const { actions: orderActions } = useSupplierOrders();
  const { toast } = useToast();

  const getStatusBadge = (statut: string) => {
    const configs = {
      critique: { variant: 'destructive', label: 'Critique' },
      faible: { variant: 'default', label: 'Faible' },
      attention: { variant: 'secondary', label: 'Attention' }
    };
    
    const config = configs[statut as keyof typeof configs];
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

  const handleUrgentOrder = async () => {
    try {
      const result = await LowStockActionService.executeOrderAction(lowStockItems);
      if (result.success) {
        toast({
          title: "Commande d'urgence créée",
          description: `Commande ${result.commande_id} créée avec succès`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande d'urgence",
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

  const handleProductOrder = async (product: any) => {
    try {
      const result = await LowStockActionService.executeOrderAction([product]);
      if (result.success) {
        toast({
          title: "Commande créée",
          description: `Commande pour ${product.nomProduit} créée`,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande",
        variant: "destructive",
      });
    }
  };

  const handleProductAlert = async (product: any) => {
    try {
      await LowStockActionService.executeAlertAction([product]);
      toast({
        title: "Alerte créée",
        description: `Alerte activée pour ${product.nomProduit}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'alerte",
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
            <CardTitle className="text-sm font-medium">Produits en Alerte</CardTitle>
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
              {metrics.urgentActions}
            </div>
            <p className="text-xs text-muted-foreground">Commandes nécessaires</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Surveillance Stock Faible</CardTitle>
          <CardDescription>Produits nécessitant un réapprovisionnement urgent</CardDescription>
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
            <div className="flex gap-2">
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
              
              <Button variant="outline" onClick={handleUrgentOrder}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Commande Urgente
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Table des alertes */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Statut</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Stock Actuel</TableHead>
                  <TableHead>Seuils</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Dernier Mvt</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={item.id}>
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
                          {item.codeProduit} - {item.dci}
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
                    <TableCell>{item.fournisseurPrincipal}</TableCell>
                    <TableCell>
                      <div className="text-right">
                        <div>{item.valeurStock.toLocaleString()} F</div>
                        <div className="text-xs text-muted-foreground">
                          {item.prixUnitaire.toLocaleString()} F/u
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.dernierMouvement ? item.dernierMouvement.toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleProductOrder(item)}>
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleProductAlert(item)}>
                          <Bell className="h-4 w-4" />
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

export default LowStockAlerts;