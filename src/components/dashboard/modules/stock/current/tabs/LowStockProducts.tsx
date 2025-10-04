import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Filter, AlertTriangle, Package, TrendingDown, Download, ShoppingCart, Bell, FileText, FileSpreadsheet, FileDown, X } from "lucide-react";
import { useLowStockData } from "@/hooks/useLowStockData";
import { useToast } from "@/hooks/use-toast";
import { OrderProductModal } from "../modals/OrderProductModal";
import { CreateAlertModal } from "../modals/CreateAlertModal";
import { ExportService } from "@/services/ExportService";
import type { LowStockItem } from "@/hooks/useLowStockData";

export const LowStockProducts = () => {
  const { toast } = useToast();
  const {
    lowStockItems,
    metrics,
    categories,
    filters,
    isLoading,
    refetch,
  } = useLowStockData();

  // Selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Modal states
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LowStockItem | null>(null);

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(lowStockItems.map(item => item.id));
      setSelectAll(true);
    }
  };

  // Handle individual selection
  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedItems([]);
    setSelectAll(false);
  };

  // Export handlers
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const itemsToExport = selectedItems.length > 0
        ? lowStockItems.filter(item => selectedItems.includes(item.id))
        : lowStockItems;

      const result = await ExportService.exportLowStockData(itemsToExport, {
        format,
        includeMetrics: true,
      });

      if (result.success && result.downloadUrl) {
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.filename;
        link.click();
        
        toast({
          title: "Export réussi",
          description: `${itemsToExport.length} produit(s) exporté(s) en ${format.toUpperCase()}`,
        });
      } else {
        throw new Error(result.error || 'Erreur d\'export');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur d'export",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    }
  };

  // Order selected products
  const handleOrderSelected = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Aucune sélection",
        description: "Veuillez sélectionner au moins un produit",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Commande groupée",
      description: `${selectedItems.length} produit(s) sélectionné(s) pour commande`,
    });
  };

  // Create alerts for selected products
  const handleAlertSelected = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Aucune sélection",
        description: "Veuillez sélectionner au moins un produit",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Alertes multiples",
      description: `Création d'alertes pour ${selectedItems.length} produit(s)`,
    });
  };

  // Open order modal for single product
  const handleOrderProduct = (product: LowStockItem) => {
    setSelectedProduct(product);
    setOrderModalOpen(true);
  };

  // Open alert modal for single product
  const handleAlertProduct = (product: LowStockItem) => {
    setSelectedProduct(product);
    setAlertModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Stock Critique</p>
              <h3 className="text-2xl font-bold text-destructive">{metrics.criticalItems}</h3>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Stock Faible</p>
              <h3 className="text-2xl font-bold text-orange-600">{metrics.lowItems}</h3>
            </div>
            <TrendingDown className="h-8 w-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Produits</p>
              <h3 className="text-2xl font-bold">{metrics.totalItems}</h3>
            </div>
            <Package className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <h3 className="font-semibold">Filtres et Recherche</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                {categories.map((cat: string) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
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
            <p className="text-sm text-muted-foreground">
              <strong>{lowStockItems.length}</strong> produit{lowStockItems.length > 1 ? 's' : ''} trouvé{lowStockItems.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h3 className="font-semibold">Actions Rapides</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={handleOrderSelected}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Commande d'urgence
            </Button>
            <Button variant="outline" size="sm">
              <Bell className="mr-2 h-4 w-4" />
              Configurer alertes
            </Button>
          </div>
        </div>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedItems.length > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {selectedItems.length} produit(s) sélectionné(s)
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                <X className="h-4 w-4 mr-1" />
                Désélectionner tout
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="default" size="sm" onClick={handleOrderSelected}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Commander la sélection
              </Button>
              <Button variant="secondary" size="sm" onClick={handleAlertSelected}>
                <Bell className="mr-2 h-4 w-4" />
                Créer des alertes
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Exporter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileText className="mr-2 h-4 w-4" />
                    CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('excel')}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileDown className="mr-2 h-4 w-4" />
                    PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>
      )}

      {/* Products Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium text-sm w-10">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="text-left py-3 px-2 font-medium text-sm">Code</th>
                <th className="text-left py-3 px-2 font-medium text-sm">Produit</th>
                <th className="text-left py-3 px-2 font-medium text-sm">DCI</th>
                <th className="text-right py-3 px-2 font-medium text-sm">Stock actuel</th>
                <th className="text-right py-3 px-2 font-medium text-sm">Seuil min</th>
                <th className="text-left py-3 px-2 font-medium text-sm">Unité</th>
                <th className="text-left py-3 px-2 font-medium text-sm">Catégorie</th>
                <th className="text-left py-3 px-2 font-medium text-sm">Fournisseur</th>
                <th className="text-left py-3 px-2 font-medium text-sm">Statut</th>
                <th className="text-right py-3 px-2 font-medium text-sm">Dernier mvt</th>
                <th className="text-right py-3 px-2 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : lowStockItems.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-muted-foreground">
                    Aucun produit en stock faible
                  </td>
                </tr>
              ) : (
                lowStockItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => handleSelectItem(item.id)}
                      />
                    </td>
                    <td className="py-3 px-2 text-sm">{item.codeProduit}</td>
                    <td className="py-3 px-2 text-sm font-medium">{item.nomProduit}</td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">{item.dci}</td>
                    <td className="py-3 px-2 text-sm text-right font-medium">{item.quantiteActuelle}</td>
                    <td className="py-3 px-2 text-sm text-right">{item.seuilMinimum}</td>
                    <td className="py-3 px-2 text-sm">{item.unite}</td>
                    <td className="py-3 px-2 text-sm">{item.categorie}</td>
                    <td className="py-3 px-2 text-sm">{item.fournisseurPrincipal}</td>
                    <td className="py-3 px-2">
                      <Badge 
                        variant={
                          item.statut === 'critique' ? 'destructive' :
                          item.statut === 'faible' ? 'default' : 'secondary'
                        }
                        className="capitalize"
                      >
                        {item.statut}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-sm text-right text-muted-foreground">
                      {item.dernierMouvement ? new Date(item.dernierMouvement).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOrderProduct(item)}
                          title="Commander"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAlertProduct(item)}
                          title="Créer une alerte"
                        >
                          <Bell className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      {selectedProduct && (
        <>
          <OrderProductModal
            open={orderModalOpen}
            onOpenChange={setOrderModalOpen}
            product={selectedProduct}
          />
          <CreateAlertModal
            open={alertModalOpen}
            onOpenChange={setAlertModalOpen}
            product={selectedProduct}
            onSuccess={refetch}
          />
        </>
      )}
    </div>
  );
};

export default LowStockProducts;
