import { useState } from "react";
import { useLots } from "@/hooks/useLots";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Eye, Calendar, Package, MapPin, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const LotTracker = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLot, setSelectedLot] = useState<string | null>(null);

  const { useLotsQuery, calculateDaysToExpiration, determineUrgencyLevel } = useLots();
  
  const { data: lots, isLoading, error } = useLotsQuery({
    ...(statusFilter !== "all" && { statut_lot: statusFilter }),
  });

  const filteredLots = lots?.filter(lot =>
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
                <p className="text-sm font-medium text-muted-foreground">Stock Critique</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredLots.filter(lot => 
                    (lot.quantite_restante / lot.quantite_initiale) * 100 <= 10
                  ).length}
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

                  return (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium">{lot.numero_lot}</TableCell>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLot(lot.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};