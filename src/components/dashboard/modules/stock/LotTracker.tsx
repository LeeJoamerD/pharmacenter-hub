import { useState } from "react";
import { useLots } from "@/hooks/useLots";
import { useAlertSettings } from "@/hooks/useAlertSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Eye, Calendar, Package, MapPin, AlertTriangle, Layers } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LotDetailsDialog } from "./LotDetailsDialog";
import { DetailBreakdownDialog } from "./dialogs/DetailBreakdownDialog";

export const LotTracker = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDetailBreakdownDialogOpen, setIsDetailBreakdownDialogOpen] = useState(false);
  const [selectedLotForBreakdown, setSelectedLotForBreakdown] = useState<string | null>(null);

  const { useLotsQuery, calculateDaysToExpiration, determineUrgencyLevel } = useLots();
  const { settings: alertSettings } = useAlertSettings();
  
  // Récupération de tous les lots sans filtrage côté serveur
  const { data: lots, isLoading, error, refetch } = useLotsQuery({});

  // Filtrage côté client basé sur les données réelles
  const getFilteredLotsByStatus = (allLots: any[], filter: string) => {
    if (filter === "all") {
      return allLots;
    }
    
    const filtered = allLots.filter(lot => {
      const daysToExpiration = lot.date_peremption ? calculateDaysToExpiration(lot.date_peremption) : null;
      const stockPercentage = (lot.quantite_restante / lot.quantite_initiale) * 100;
      
      // Logique basée sur les données réelles observées
      if (filter === "actif") {
        // Un lot est actif s'il n'est ni expiré ni épuisé
        const isNotExpired = !daysToExpiration || daysToExpiration > 0;
        const isNotEmpty = stockPercentage > 0;
        return isNotExpired && isNotEmpty;
      }
      
      if (filter === "expire") {
        // Un lot est expiré si la date de péremption est dépassée
        return daysToExpiration !== null && daysToExpiration <= 0;
      }
      
      if (filter === "epuise") {
        // Un lot est épuisé si le stock restant est 0
        return stockPercentage <= 0;
      }
      
      if (filter === "expiration_proche") {
        // Un lot a une expiration proche s'il expire dans 60 jours ou moins (même critère que la carte statistique)
        return daysToExpiration !== null && daysToExpiration > 0 && daysToExpiration <= 60;
      }
      
      return false;
    });
    
    return filtered;
  };

  const statusFilteredLots = lots ? getFilteredLotsByStatus(lots, statusFilter) : [];

  const filteredLots = statusFilteredLots?.filter(lot =>
    lot.numero_lot.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lot.produit?.libelle_produit.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un lot ou un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Lots</p>
                <p className="text-2xl font-bold">{filteredLots.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Expiration Proche</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filteredLots.filter(lot => 
                    lot.date_peremption && calculateDaysToExpiration(lot.date_peremption) <= 30
                  ).length}
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
                <p className="text-sm font-medium text-muted-foreground">Produits en Stock Critique</p>
                <p className="text-2xl font-bold text-red-600">
                  {(() => {
                    // Récupérer le seuil critique depuis les paramètres (par défaut 5)
                    const criticalThreshold = alertSettings?.critical_stock_threshold || 5;
                    
                    // Grouper les lots par produit et calculer le stock total
                    const productStocks = new Map<string, number>();
                    
                    lots?.forEach(lot => {
                      const productId = lot.produit?.id;
                      if (!productId) return;
                      
                      const currentStock = productStocks.get(productId) || 0;
                      productStocks.set(productId, currentStock + lot.quantite_restante);
                    });
                    
                    // Compter les produits en stock critique
                    // Logique : 0 < stock <= criticalThreshold
                    let criticalCount = 0;
                    productStocks.forEach(totalStock => {
                      if (totalStock > 0 && totalStock <= criticalThreshold) {
                        criticalCount++;
                      }
                    });
                    
                    return criticalCount;
                  })()}
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
                  {new Set(filteredLots.map(lot => lot.emplacement).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table des lots */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Lots</CardTitle>
          <CardDescription>
            Tous les lots disponibles avec leurs informations essentielles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro Lot</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Urgence</TableHead>
                  <TableHead>Emplacement</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLots.map((lot) => {
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
          refetch();
        }}
      />
    </div>
  );
};