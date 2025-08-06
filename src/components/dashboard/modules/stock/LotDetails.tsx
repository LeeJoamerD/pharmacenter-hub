import { useState } from "react";
import { useLots } from "@/hooks/useLots";
import { useLotMovements } from "@/hooks/useLotMovements";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Package, Calendar, MapPin, Truck, Activity, 
  TrendingUp, TrendingDown, AlertCircle, Info 
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const LotDetails = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLotId, setSelectedLotId] = useState<string>("");

  const { useLotsQuery, useLotQuery, calculateDaysToExpiration, determineUrgencyLevel } = useLots();
  const { useLotMovementsForLot, getMovementTypeLabel, getMovementTypeColor, getMovementIcon } = useLotMovements();

  const { data: lots } = useLotsQuery();
  const { data: selectedLot } = useLotQuery(selectedLotId);
  const { data: movements } = useLotMovementsForLot(selectedLotId);

  const filteredLots = lots?.filter(lot =>
    lot.numero_lot.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lot.produit?.libelle_produit.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const calculateUsagePercentage = (initial: number, remaining: number) => {
    return ((initial - remaining) / initial) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Sélection du lot */}
      <Card>
        <CardHeader>
          <CardTitle>Sélectionner un Lot</CardTitle>
          <CardDescription>
            Choisissez un lot pour voir ses détails complets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un lot..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedLotId} onValueChange={setSelectedLotId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Sélectionner un lot" />
              </SelectTrigger>
              <SelectContent>
                {filteredLots.map((lot) => (
                  <SelectItem key={lot.id} value={lot.id}>
                    {lot.numero_lot} - {lot.produit?.libelle_produit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Détails du lot sélectionné */}
      {selectedLot && (
        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Numéro de Lot</p>
                    <p className="text-xl font-bold">{selectedLot.numero_lot}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Stock Actuel</p>
                    <p className="text-xl font-bold">
                      {selectedLot.quantite_restante}/{selectedLot.quantite_initiale}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(calculateUsagePercentage(selectedLot.quantite_initiale, selectedLot.quantite_restante))}% utilisé
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Expiration</p>
                    {selectedLot.date_peremption ? (
                      <>
                        <p className="text-xl font-bold">
                          {format(new Date(selectedLot.date_peremption), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {calculateDaysToExpiration(selectedLot.date_peremption)} jours restants
                        </p>
                      </>
                    ) : (
                      <p className="text-xl font-bold text-muted-foreground">Non définie</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MapPin className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Emplacement</p>
                    <p className="text-xl font-bold">{selectedLot.emplacement || 'Non défini'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Détails complets */}
          <Tabs defaultValue="info" className="space-y-4">
            <TabsList>
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Informations
              </TabsTrigger>
              <TabsTrigger value="movements" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Mouvements
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Analytiques
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Informations Détaillées</CardTitle>
                  <CardDescription>
                    Toutes les informations relatives à ce lot
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Produit</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nom:</span>
                          <span className="font-medium">{selectedLot.produit?.libelle_produit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Code-barres:</span>
                          <span className="font-medium">{selectedLot.produit?.code_bare}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Forme:</span>
                          <span className="font-medium">{selectedLot.produit?.forme_pharmaceutique}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Lot</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date de fabrication:</span>
                          <span className="font-medium">
                            {selectedLot.date_fabrication 
                              ? format(new Date(selectedLot.date_fabrication), 'dd/MM/yyyy', { locale: fr })
                              : 'Non définie'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date de réception:</span>
                          <span className="font-medium">
                            {selectedLot.date_reception 
                              ? format(new Date(selectedLot.date_reception), 'dd/MM/yyyy', { locale: fr })
                              : 'Non définie'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Prix d'achat unitaire:</span>
                          <span className="font-medium">
                            {selectedLot.prix_achat_unitaire ? `${selectedLot.prix_achat_unitaire} FCFA` : 'Non défini'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Prix de vente suggéré:</span>
                          <span className="font-medium">
                            {selectedLot.prix_vente_suggere ? `${selectedLot.prix_vente_suggere} FCFA` : 'Non défini'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedLot.fournisseur && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Fournisseur</h4>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nom:</span>
                        <span className="font-medium">{selectedLot.fournisseur.nom}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="movements">
              <Card>
                <CardHeader>
                  <CardTitle>Historique des Mouvements</CardTitle>
                  <CardDescription>
                    Tous les mouvements de stock pour ce lot
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {movements && movements.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Quantité</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Référence</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {movements.map((movement) => (
                            <TableRow key={movement.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span>{getMovementIcon(movement.type_mouvement)}</span>
                                  <Badge className={getMovementTypeColor(movement.type_mouvement)}>
                                    {getMovementTypeLabel(movement.type_mouvement)}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {movement.type_mouvement === 'entree' || movement.type_mouvement === 'retour' ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                  )}
                                  {movement.quantite_mouvement}
                                </div>
                              </TableCell>
                              <TableCell>
                                {format(new Date(movement.date_mouvement), 'dd/MM/yyyy HH:mm', { locale: fr })}
                              </TableCell>
                              <TableCell>{movement.reference_document || '-'}</TableCell>
                              <TableCell>{movement.notes || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun mouvement enregistré pour ce lot
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Analyse du Lot</CardTitle>
                  <CardDescription>
                    Indicateurs et analyses de performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Taux d'utilisation</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {Math.round(calculateUsagePercentage(selectedLot.quantite_initiale, selectedLot.quantite_restante))}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Niveau d'urgence</p>
                          <Badge 
                            variant={selectedLot.date_peremption ? 
                              (determineUrgencyLevel(calculateDaysToExpiration(selectedLot.date_peremption)) === 'critique' ? 'destructive' : 'secondary') 
                              : 'secondary'
                            }
                            className="text-sm"
                          >
                            {selectedLot.date_peremption ? 
                              determineUrgencyLevel(calculateDaysToExpiration(selectedLot.date_peremption)).toUpperCase() 
                              : 'INDÉFINI'
                            }
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Mouvements totaux</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {movements?.length || 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedLot.date_peremption && calculateDaysToExpiration(selectedLot.date_peremption) <= 30 && (
                    <div className="flex items-center gap-2 p-4 border border-orange-200 bg-orange-50 rounded-md">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-800">Attention - Expiration proche</p>
                        <p className="text-sm text-orange-700">
                          Ce lot expire dans {calculateDaysToExpiration(selectedLot.date_peremption)} jours. 
                          Considérez une action prioritaire.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};