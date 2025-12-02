import { useState, useMemo } from "react";
import { useLotsPaginated } from "@/hooks/useLotsPaginated";
import { useLots } from "@/hooks/useLots";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Eye, Calendar, Package, MapPin, AlertTriangle, Layers, RefreshCw, RotateCcw, Download, ArrowUpDown, ChevronLeft, ChevronRight, FileSpreadsheet, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LotDetailsDialog } from "./LotDetailsDialog";
import { DetailBreakdownDialog } from "./dialogs/DetailBreakdownDialog";
import { exportLotsToExcel, exportLotsToPDF } from "@/utils/lotExportUtils";
import { useToast } from "@/hooks/use-toast";

export const LotTracker = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("date_peremption");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDetailBreakdownDialogOpen, setIsDetailBreakdownDialogOpen] = useState(false);
  const [selectedLotForBreakdown, setSelectedLotForBreakdown] = useState<string | null>(null);

  const { calculateDaysToExpiration, determineUrgencyLevel } = useLots();
  const { toast } = useToast();

  // Use paginated hook
  const { lots, count, totalPages, metrics, isLoading, error } = useLotsPaginated({
    searchTerm,
    pageSize,
    currentPage,
    statusFilter,
    sortBy,
    sortOrder,
  });

  // Fetch all lots for export (without pagination)
  const { useLotsQuery } = useLots();
  const { data: allLots } = useLotsQuery({});

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    toast({
      title: "Données actualisées",
      description: "Les lots ont été rechargés avec succès.",
    });
  };

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("date_peremption");
    setSortOrder("asc");
    setPageSize(100);
    setCurrentPage(1);
    toast({
      title: "Filtres réinitialisés",
      description: "Tous les filtres ont été remis à zéro.",
    });
  };

  const handleExportExcel = () => {
    if (!allLots || allLots.length === 0) {
      toast({
        title: "Aucune donnée à exporter",
        description: "Il n'y a aucun lot à exporter.",
        variant: "destructive",
      });
      return;
    }
    exportLotsToExcel(allLots, 'lots_export');
    toast({
      title: "Export Excel réussi",
      description: `${allLots.length} lots exportés en Excel.`,
    });
  };

  const handleExportPDF = () => {
    if (!allLots || allLots.length === 0) {
      toast({
        title: "Aucune donnée à exporter",
        description: "Il n'y a aucun lot à exporter.",
        variant: "destructive",
      });
      return;
    }
    exportLotsToPDF(allLots, 'lots_export');
    toast({
      title: "Export PDF réussi",
      description: `${allLots.length} lots exportés en PDF.`,
    });
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critique': return 'destructive';
      case 'eleve': return 'destructive';
      case 'moyen': return 'outline';
      case 'faible': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStockLevel = (initial: number, remaining: number) => {
    const percentage = (remaining / initial) * 100;
    if (percentage <= 10) return { level: 'Critique', color: 'destructive' };
    if (percentage <= 30) return { level: 'Bas', color: 'destructive' };
    if (percentage <= 70) return { level: 'Moyen', color: 'outline' };
    return { level: 'Bon', color: 'secondary' };
  };

  // Generate page numbers for pagination
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage, totalPages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Chargement des lots...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-destructive mb-2">Erreur de chargement</div>
        <p className="text-muted-foreground">Impossible de charger les lots</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres et recherche améliorés */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un lot ou un produit..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1); // Reset to first page on filter change
          }}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="expire">Expiré</SelectItem>
              <SelectItem value="epuise">Épuisé</SelectItem>
              <SelectItem value="expiration_proche">Expiration Proche</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={sortBy} onValueChange={(value) => {
            setSortBy(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_peremption">Date péremption</SelectItem>
              <SelectItem value="numero_lot">Numéro lot</SelectItem>
              <SelectItem value="produit">Produit</SelectItem>
              <SelectItem value="stock">Stock</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
          </Button>

          <Select value={pageSize.toString()} onValueChange={(value) => {
            setPageSize(Number(value));
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Lignes par page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50 lignes</SelectItem>
              <SelectItem value="100">100 lignes</SelectItem>
              <SelectItem value="200">200 lignes</SelectItem>
              <SelectItem value="500">500 lignes</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>

          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Statistiques rapides avec données RPC */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Lots</p>
                <p className="text-2xl font-bold">{metrics?.totalLots || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Expiration Proche (30j)</p>
                <p className="text-2xl font-bold text-orange-600">
                  {metrics?.expiringLots30 || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Lots Expirés</p>
                <p className="text-2xl font-bold text-red-600">
                  {metrics?.expiredLots || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Emplacements</p>
                <p className="text-2xl font-bold">
                  {metrics?.locations || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table des lots avec tri */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Lots</CardTitle>
          <CardDescription>
            Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, count)} sur {count} lots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => handleSort('numero_lot')}
                  >
                    <div className="flex items-center gap-2">
                      Numéro Lot
                      {sortBy === 'numero_lot' && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => handleSort('produit')}
                  >
                    <div className="flex items-center gap-2">
                      Produit
                      {sortBy === 'produit' && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => handleSort('stock')}
                  >
                    <div className="flex items-center gap-2">
                      Stock
                      {sortBy === 'stock' && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => handleSort('date_peremption')}
                  >
                    <div className="flex items-center gap-2">
                      Expiration
                      {sortBy === 'date_peremption' && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead>Urgence</TableHead>
                  <TableHead>Emplacement</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lots.map((lot) => {
                  const daysToExpiration = lot.date_peremption ? calculateDaysToExpiration(lot.date_peremption) : null;
                  const urgencyLevel = daysToExpiration !== null ? determineUrgencyLevel(daysToExpiration) : 'faible';
                  const stockLevel = getStockLevel(lot.quantite_initiale, lot.quantite_restante);
                  const isDetailable = lot.produit?.niveau_detail === 1 && 
                                       lot.produit?.produit_detail && 
                                       Array.isArray(lot.produit.produit_detail) && 
                                       lot.produit.produit_detail.length > 0 &&
                                       lot.produit.produit_detail[0]?.quantite_unites_details_source > 0;

                  return (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {lot.numero_lot}
                          {isDetailable && (
                            <Badge variant="secondary" className="text-xs">
                              <Layers className="h-3 w-3 mr-1" />
                              Détaillable
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lot.produit?.libelle_produit}</div>
                          <div className="text-sm text-muted-foreground">{lot.produit?.code_cip}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <span>{lot.quantite_restante}/{lot.quantite_initiale}</span>
                            <Badge variant={stockLevel.color as any}>{stockLevel.level}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {Math.round((lot.quantite_restante / lot.quantite_initiale) * 100)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lot.date_peremption ? (
                          <div>
                            <div>{format(new Date(lot.date_peremption), 'dd/MM/yyyy', { locale: fr })}</div>
                            <div className="text-sm text-muted-foreground">
                              {daysToExpiration !== null && daysToExpiration >= 0 
                                ? `${daysToExpiration} jours`
                                : 'Expiré'
                              }
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Non définie</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getUrgencyColor(urgencyLevel) as any}>
                          {urgencyLevel.charAt(0).toUpperCase() + urgencyLevel.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{lot.emplacement || 'Non défini'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLot(lot.id);
                              setIsDetailsDialogOpen(true);
                            }}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLotForBreakdown(lot.id);
                              setIsDetailBreakdownDialogOpen(true);
                            }}
                            title={isDetailable ? "Mise en détail" : "Produit non détaillable"}
                            disabled={!isDetailable || lot.quantite_restante < 1}
                          >
                            <Layers className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination optimisée */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, count)} sur {count} lots
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
              
              <div className="flex items-center gap-1">
                {pageNumbers.map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2">...</span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page as number)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  )
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de détails du lot */}
      <LotDetailsDialog
        lotId={selectedLot}
        isOpen={isDetailsDialogOpen}
        onClose={() => {
          setIsDetailsDialogOpen(false);
          setSelectedLot(null);
        }}
      />

      {/* Dialog de mise en détail */}
      <DetailBreakdownDialog
        lotId={selectedLotForBreakdown}
        isOpen={isDetailBreakdownDialogOpen}
        onClose={() => {
          setIsDetailBreakdownDialogOpen(false);
          setSelectedLotForBreakdown(null);
        }}
        onSuccess={() => {
          // Rafraîchir les données après succès
          handleRefresh();
        }}
      />
    </div>
  );
};
