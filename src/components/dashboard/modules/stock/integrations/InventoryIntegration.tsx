import { useState, useEffect } from "react";
import { useLots } from "@/hooks/useLots";
import { useLotMovements } from "@/hooks/useLotMovements";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clipboard, Package, TrendingUp, TrendingDown, RefreshCw,
  FileX, AlertCircle, CheckCircle, Clock, BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InventoryDiscrepancy {
  lotId: string;
  lotNumber: string;
  productName: string;
  theoreticalQuantity: number;
  physicalQuantity: number;
  difference: number;
  status: 'surplus' | 'deficit' | 'missing';
}

interface ReconciliationSession {
  id: string;
  date: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  lotsCount: number;
  discrepanciesCount: number;
}

export const InventoryIntegration = () => {
  const [reconciliationMode, setReconciliationMode] = useState(false);
  const [currentSession, setCurrentSession] = useState<ReconciliationSession | null>(null);
  const [discrepancies, setDiscrepancies] = useState<InventoryDiscrepancy[]>([]);
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});

  const { useLotsQuery, useLowStockLots } = useLots();
  // const { createLotMovementMutation } = useLotMovements();

  const { data: allLots } = useLotsQuery();
  const { data: lowStockLots } = useLowStockLots();

  const startReconciliation = () => {
    const sessionId = `INV-${Date.now()}`;
    const newSession: ReconciliationSession = {
      id: sessionId,
      date: new Date().toISOString(),
      status: 'in_progress',
      lotsCount: allLots?.length || 0,
      discrepanciesCount: 0
    };
    
    setCurrentSession(newSession);
    setReconciliationMode(true);
    setDiscrepancies([]);
    setPhysicalCounts({});
  };

  const updatePhysicalCount = (lotId: string, count: number) => {
    setPhysicalCounts(prev => ({
      ...prev,
      [lotId]: count
    }));
  };

  const calculateDiscrepancies = () => {
    if (!allLots) return;

    const newDiscrepancies: InventoryDiscrepancy[] = [];

    allLots.forEach(lot => {
      const physicalCount = physicalCounts[lot.id];
      if (physicalCount !== undefined) {
        const difference = physicalCount - lot.quantite_restante;
        
        if (difference !== 0) {
          let status: 'surplus' | 'deficit' | 'missing';
          if (physicalCount === 0) {
            status = 'missing';
          } else if (difference > 0) {
            status = 'surplus';
          } else {
            status = 'deficit';
          }

          newDiscrepancies.push({
            lotId: lot.id,
            lotNumber: lot.numero_lot,
            productName: lot.produit?.libelle_produit || 'Produit inconnu',
            theoreticalQuantity: lot.quantite_restante,
            physicalQuantity: physicalCount,
            difference,
            status
          });
        }
      }
    });

    setDiscrepancies(newDiscrepancies);
    
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        discrepanciesCount: newDiscrepancies.length
      });
    }
  };

  const completeReconciliation = async () => {
    try {
      // Créer les mouvements d'ajustement pour chaque écart
      for (const discrepancy of discrepancies) {
        console.log('Ajustement pour lot:', discrepancy.lotId);
        // TODO: Implémenter l'ajustement automatique
      }

      if (currentSession) {
        setCurrentSession({
          ...currentSession,
          status: 'completed'
        });
      }

      setReconciliationMode(false);
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
    }
  };

  const getDiscrepancyColor = (status: string) => {
    switch (status) {
      case 'surplus': return 'bg-green-100 text-green-800';
      case 'deficit': return 'bg-red-100 text-red-800';
      case 'missing': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDiscrepancyIcon = (status: string) => {
    switch (status) {
      case 'surplus': return <TrendingUp className="h-4 w-4" />;
      case 'deficit': return <TrendingDown className="h-4 w-4" />;
      case 'missing': return <FileX className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Clipboard className="h-8 w-8 text-purple-600 mt-1" />
            <div>
              <h3 className="font-semibold text-purple-900">Intégration Inventaire - Réconciliation des Lots</h3>
              <p className="text-purple-700 mt-1">
                Outils de réconciliation pour maintenir la précision des stocks et détecter les écarts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            Réconciliation
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Alertes Stock
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Lots</p>
                    <p className="text-2xl font-bold">{allLots?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Stock Bas</p>
                    <p className="text-2xl font-bold text-red-600">{lowStockLots?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Sessions Complétées</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">En Cours</p>
                    <p className="text-2xl font-bold">{reconciliationMode ? 1 : 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reconciliation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clipboard className="h-5 w-5" />
                Réconciliation Inventaire
              </CardTitle>
              <CardDescription>
                Comparez les quantités théoriques avec les comptages physiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!reconciliationMode ? (
                <div className="text-center py-8">
                  <Clipboard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Démarrer une Réconciliation</h3>
                  <p className="text-muted-foreground mb-4">
                    Lancez une session de réconciliation pour vérifier vos stocks
                  </p>
                  <Button onClick={startReconciliation}>
                    <Clipboard className="h-4 w-4 mr-2" />
                    Nouvelle Réconciliation
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Statut de la session */}
                  {currentSession && (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Session en cours: {currentSession.id} - {currentSession.lotsCount} lots à vérifier
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Saisie des comptages */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Saisie des Comptages Physiques</h4>
                    <div className="rounded-md border max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Lot</TableHead>
                            <TableHead>Produit</TableHead>
                            <TableHead>Stock Théorique</TableHead>
                            <TableHead>Comptage Physique</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allLots?.map((lot) => (
                            <TableRow key={lot.id}>
                              <TableCell className="font-medium">{lot.numero_lot}</TableCell>
                              <TableCell>{lot.produit?.libelle_produit}</TableCell>
                              <TableCell>{lot.quantite_restante}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={physicalCounts[lot.id] || ''}
                                  onChange={(e) => updatePhysicalCount(lot.id, parseInt(e.target.value) || 0)}
                                  className="w-20"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button onClick={calculateDiscrepancies}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Calculer les Écarts
                    </Button>
                    {discrepancies.length > 0 && (
                      <Button onClick={completeReconciliation} variant="outline">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Finaliser la Réconciliation
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={() => setReconciliationMode(false)}
                    >
                      Annuler
                    </Button>
                  </div>

                  {/* Résultats des écarts */}
                  {discrepancies.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Écarts Détectés ({discrepancies.length})</h4>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Lot</TableHead>
                              <TableHead>Produit</TableHead>
                              <TableHead>Théorique</TableHead>
                              <TableHead>Physique</TableHead>
                              <TableHead>Écart</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {discrepancies.map((discrepancy, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Badge className={getDiscrepancyColor(discrepancy.status) + " flex items-center gap-1 w-fit"}>
                                    {getDiscrepancyIcon(discrepancy.status)}
                                    {discrepancy.status.toUpperCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">{discrepancy.lotNumber}</TableCell>
                                <TableCell>{discrepancy.productName}</TableCell>
                                <TableCell>{discrepancy.theoreticalQuantity}</TableCell>
                                <TableCell>{discrepancy.physicalQuantity}</TableCell>
                                <TableCell className={discrepancy.difference > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {discrepancy.difference > 0 ? '+' : ''}{discrepancy.difference}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertes de Stock</CardTitle>
              <CardDescription>
                Surveillance automatique des niveaux de stock critiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockLots && lowStockLots.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lot</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Stock Restant</TableHead>
                        <TableHead>Pourcentage</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockLots.map((lot) => {
                        const percentage = (lot.quantite_restante / lot.quantite_initiale) * 100;
                        return (
                          <TableRow key={lot.id}>
                            <TableCell className="font-medium">{lot.numero_lot}</TableCell>
                            <TableCell>{lot.produit?.libelle_produit}</TableCell>
                            <TableCell>{lot.quantite_restante}</TableCell>
                            <TableCell>
                              <Badge variant={percentage <= 10 ? 'destructive' : 'outline'}>
                                {percentage.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">
                                Réapprovisionner
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune alerte de stock pour le moment
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};