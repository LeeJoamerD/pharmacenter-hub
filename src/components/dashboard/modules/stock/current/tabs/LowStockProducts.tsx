import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Filter, AlertTriangle, Package, TrendingDown, Download, ShoppingCart, Bell, FileText, FileSpreadsheet, FileDown, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useLowStockData } from "@/hooks/useLowStockData";
import { useToast } from "@/hooks/use-toast";
import { OrderProductModal } from "../modals/OrderProductModal";
import { CreateAlertModal } from "../modals/CreateAlertModal";
import { StockConfigModal } from "../modals/StockConfigModal";
import { ActionHistoryModal } from "../modals/ActionHistoryModal";
import { EmergencyOrderModal } from "../modals/EmergencyOrderModal";
import { ExportService } from "@/services/ExportService";
import { LowStockTableSkeleton } from "./LowStockTableSkeleton";
import { FadeIn } from "@/components/FadeIn";
import type { LowStockItem } from "@/hooks/useLowStockData";

type SortField = 'nomProduit' | 'quantiteActuelle' | 'seuilMinimum' | 'valeurStock' | 'dernierMouvement' | 'statut';
type SortDirection = 'asc' | 'desc';

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

  // Debug log
  useEffect(() => {
    console.log('🎯 [COMPONENT] Low Stock Items:', lowStockItems.length);
    console.log('🎯 [COMPONENT] Metrics:', metrics);
    console.log('🎯 [COMPONENT] Categories:', categories.length);
  }, [lowStockItems, metrics, categories]);

  // Selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('statut');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Modal states
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [emergencyOrderModalOpen, setEmergencyOrderModalOpen] = useState(false);
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

  // Sorting function
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort items
  const sortedItems = [...lowStockItems].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle status sorting with priority
    if (sortField === 'statut') {
      const statusPriority = { critique: 3, faible: 2, attention: 1 };
      aValue = statusPriority[a.statut];
      bValue = statusPriority[b.statut];
    }

    // Handle date sorting
    if (sortField === 'dernierMouvement') {
      aValue = a.dernierMouvement ? new Date(a.dernierMouvement).getTime() : 0;
      bValue = b.dernierMouvement ? new Date(b.dernierMouvement).getTime() : 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Get status badge with improved styling
  const getStatusBadge = (statut: string) => {
    const configs = {
      critique: { 
        variant: 'destructive' as const, 
        label: 'Critique',
        className: 'bg-destructive/90 text-destructive-foreground animate-pulse'
      },
      faible: { 
        variant: 'default' as const, 
        label: 'Faible',
        className: 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-800'
      },
      attention: { 
        variant: 'secondary' as const, 
        label: 'Attention',
        className: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-800'
      }
    };
    
    const config = configs[statut as keyof typeof configs] || configs.faible;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Sort icon helper
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-3 w-3 ml-1" /> : 
      <ArrowDown className="h-3 w-3 ml-1" />;
  };

  if (isLoading) {
    return <LowStockTableSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FadeIn delay={0}>
          <Card className="p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Critique</p>
                <h3 className="text-2xl font-bold text-destructive mt-1">{metrics.criticalItems}</h3>
                <p className="text-xs text-muted-foreground mt-1">Nécessite action immédiate</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Faible</p>
                <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{metrics.lowItems}</h3>
                <p className="text-xs text-muted-foreground mt-1">À réapprovisionner</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-full">
                <TrendingDown className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card className="p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Produits</p>
                <h3 className="text-2xl font-bold mt-1">{metrics.totalItems}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Valeur: {metrics.totalValue.toLocaleString()} F
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Filters */}
      <FadeIn delay={0.3}>
        <Card className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
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
              <p className="text-sm text-muted-foreground">
                <strong>{lowStockItems.length}</strong> produit{lowStockItems.length > 1 ? 's' : ''} trouvé{lowStockItems.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </Card>
      </FadeIn>

      {/* Quick Actions */}
      <FadeIn delay={0.4}>
        <Card className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
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
      </FadeIn>

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
      <FadeIn delay={0.5}>
        <Card className="p-4 md:p-6">
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-2 md:px-3 font-medium text-xs md:text-sm w-10">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left py-3 px-2 md:px-3 font-medium text-xs md:text-sm hidden lg:table-cell">
                      Code
                    </th>
                    <th 
                      className="text-left py-3 px-2 md:px-3 font-medium text-xs md:text-sm cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => handleSort('nomProduit')}
                    >
                      <div className="flex items-center">
                        Produit
                        <SortIcon field="nomProduit" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-2 md:px-3 font-medium text-xs md:text-sm hidden md:table-cell">
                      DCI
                    </th>
                    <th 
                      className="text-right py-3 px-2 md:px-3 font-medium text-xs md:text-sm cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => handleSort('quantiteActuelle')}
                    >
                      <div className="flex items-center justify-end">
                        Stock
                        <SortIcon field="quantiteActuelle" />
                      </div>
                    </th>
                    <th className="text-right py-3 px-2 md:px-3 font-medium text-xs md:text-sm hidden md:table-cell">
                      Seuil
                    </th>
                    <th className="text-left py-3 px-2 md:px-3 font-medium text-xs md:text-sm hidden xl:table-cell">
                      Unité
                    </th>
                    <th className="text-left py-3 px-2 md:px-3 font-medium text-xs md:text-sm hidden lg:table-cell">
                      Catégorie
                    </th>
                    <th className="text-left py-3 px-2 md:px-3 font-medium text-xs md:text-sm hidden xl:table-cell">
                      Fournisseur
                    </th>
                    <th 
                      className="text-left py-3 px-2 md:px-3 font-medium text-xs md:text-sm cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => handleSort('statut')}
                    >
                      <div className="flex items-center">
                        Statut
                        <SortIcon field="statut" />
                      </div>
                    </th>
                    <th className="text-right py-3 px-2 md:px-3 font-medium text-xs md:text-sm hidden lg:table-cell">
                      Dernier mvt
                    </th>
                    <th className="text-right py-3 px-2 md:px-3 font-medium text-xs md:text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="h-12 w-12 opacity-20" />
                          <p>Aucun produit en stock faible</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedItems.map((item, index) => (
                      <tr 
                        key={item.id} 
                        className="border-b hover:bg-muted/50 transition-colors group"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="py-3 px-2 md:px-3">
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => handleSelectItem(item.id)}
                          />
                        </td>
                        <td className="py-3 px-2 md:px-3 text-xs md:text-sm text-muted-foreground hidden lg:table-cell">
                          {item.codeProduit}
                        </td>
                        <td className="py-3 px-2 md:px-3">
                          <div className="flex flex-col">
                            <span className="text-xs md:text-sm font-medium">{item.nomProduit}</span>
                            <span className="text-xs text-muted-foreground lg:hidden">
                              {item.codeProduit}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 md:px-3 text-xs md:text-sm text-muted-foreground hidden md:table-cell">
                          {item.dci || '-'}
                        </td>
                        <td className="py-3 px-2 md:px-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`text-xs md:text-sm font-medium ${
                              item.quantiteActuelle === 0 ? 'text-destructive' :
                              item.quantiteActuelle <= item.seuilMinimum * 0.3 ? 'text-destructive' :
                              item.quantiteActuelle <= item.seuilMinimum ? 'text-orange-600 dark:text-orange-400' :
                              'text-foreground'
                            }`}>
                              {item.quantiteActuelle}
                            </span>
                            <span className="text-xs text-muted-foreground md:hidden">
                              / {item.seuilMinimum}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 md:px-3 text-xs md:text-sm text-right hidden md:table-cell">
                          {item.seuilMinimum}
                        </td>
                        <td className="py-3 px-2 md:px-3 text-xs md:text-sm hidden xl:table-cell">
                          {item.unite}
                        </td>
                        <td className="py-3 px-2 md:px-3 text-xs md:text-sm hidden lg:table-cell">
                          <span className="px-2 py-1 bg-muted rounded-md text-xs">
                            {item.categorie}
                          </span>
                        </td>
                        <td className="py-3 px-2 md:px-3 text-xs md:text-sm text-muted-foreground hidden xl:table-cell">
                          {item.fournisseurPrincipal || '-'}
                        </td>
                        <td className="py-3 px-2 md:px-3">
                          <div className="flex items-center gap-1">
                            {item.statut === 'critique' && (
                              <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                            )}
                            {getStatusBadge(item.statut)}
                          </div>
                        </td>
                        <td className="py-3 px-2 md:px-3 text-xs md:text-sm text-right text-muted-foreground hidden lg:table-cell">
                          {item.dernierMouvement ? new Date(item.dernierMouvement).toLocaleDateString('fr-FR') : 'N/A'}
                        </td>
                        <td className="py-3 px-2 md:px-3 text-right">
                          <div className="flex gap-1 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOrderProduct(item)}
                              title="Commander"
                              className="h-8 w-8 p-0"
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAlertProduct(item)}
                              title="Créer une alerte"
                              className="h-8 w-8 p-0"
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
          </div>

          {/* Mobile summary info */}
          {sortedItems.length > 0 && (
            <div className="mt-4 pt-4 border-t lg:hidden">
              <p className="text-xs text-muted-foreground text-center">
                Faites défiler horizontalement pour voir plus de détails
              </p>
            </div>
          )}
        </Card>
      </FadeIn>

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
