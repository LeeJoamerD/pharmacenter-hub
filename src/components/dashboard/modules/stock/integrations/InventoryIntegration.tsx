import { useState, useEffect } from "react";
import { useLots } from "@/hooks/useLots";
import { useLotMovements } from "@/hooks/useLotMovements";
import { useTenant } from "@/contexts/TenantContext";
import { usePersonnel } from "@/hooks/usePersonnel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Clipboard, Package, TrendingUp, TrendingDown, RefreshCw,
  FileX, AlertCircle, CheckCircle, Clock, BarChart3, History,
  Calendar, User, FileText, Eye, X
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { StockUpdateService } from "@/services/stockUpdateService";
import { toast } from "sonner";

interface InventoryDiscrepancy {
  lotId: string;
  lotNumber: string;
  productName: string;
  theoreticalQuantity: number;
  physicalQuantity: number;
  difference: number;
  status: 'surplus' | 'deficit' | 'missing';
  productId: string;
}

interface ReconciliationSession {
  id: string;
  date: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  lotsCount: number;
  discrepanciesCount: number;
}

interface ReconciliationMetadata {
  theoretical_quantity?: number;
  physical_quantity?: number;
  reconciliation_session_id?: string;
  reconciliation_type?: string;
  total_lots?: number;
  discrepancies_count?: number;
  completion_timestamp?: string;
  session_type?: string;
}

// Interface pour les données de mouvement retournées par Supabase
interface MovementData {
  id: string;
  tenant_id: string;
  produit_id: string;
  lot_id: string;
  type_mouvement: string;
  quantite_mouvement: number;
  date_mouvement: string;
  agent_id: string;
  reference_id: string | null;
  reference_type: string | null;
  metadata: any;
  created_at: string;
  lot: {
    numero_lot: string;
    produit: {
      libelle_produit: string;
    } | null;
  } | null;
}

interface SessionDetails {
  session: ReconciliationSession;
  discrepancies: InventoryDiscrepancy[];
  personnel?: {
    noms: string;
    prenoms: string;
  };
  auditLogs?: any[];
}

export const InventoryIntegration = () => {
  const { tenantId } = useTenant();
  const { currentPersonnel } = usePersonnel();
  const [reconciliationMode, setReconciliationMode] = useState(false);
  const [currentSession, setCurrentSession] = useState<ReconciliationSession | null>(null);
  const [discrepancies, setDiscrepancies] = useState<InventoryDiscrepancy[]>([]);
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});
  const [completedSessions, setCompletedSessions] = useState<ReconciliationSession[]>([]);

  const [loading, setLoading] = useState(true);
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<SessionDetails | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fonctions utilitaires pour l'affichage des écarts
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
      case 'surplus': return <TrendingUp className="h-3 w-3" />;
      case 'deficit': return <TrendingDown className="h-3 w-3" />;
      case 'missing': return <FileX className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  // Fonction pour charger les sessions terminées depuis la base de données
  const loadCompletedSessions = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventaire_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('statut', 'terminee')
        .eq('type', 'complet')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des sessions:', error);
        return;
      }

      // Convertir les sessions de la base vers le format local
      const sessions = data.map(session => ({
        id: session.id,
        date: session.date_debut || session.created_at,
        status: 'completed' as const,
        lotsCount: session.produits_total || 0,
        discrepanciesCount: session.ecarts || 0
      }));

      setCompletedSessions(sessions);
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Charger les sessions terminées depuis la base de données au démarrage
    loadCompletedSessions();
  }, [tenantId]);

  const { useLotsQuery, useLowStockLots } = useLots();
  // const { createLotMovementMutation } = useLotMovements();

  const { data: allLots } = useLotsQuery();
  const { data: lowStockLots } = useLowStockLots();

  const startReconciliation = () => {
    // Utiliser crypto.randomUUID() pour éviter les doublons
    const sessionId = `INV-${crypto.randomUUID().slice(0, 8)}-${Date.now()}`;
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
            status,
            productId: lot.produit_id // Ajouter l'ID du produit pour les ajustements
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
    if (!currentSession || discrepancies.length === 0) {
      toast.error('Aucun écart à traiter');
      return;
    }

    try {
      // 1. Persister la session en base de données
      // Vérifier que le personnel est chargé
      if (!currentPersonnel?.id) {
        toast.error('Erreur: Utilisateur non identifié');
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from('inventaire_sessions')
        .insert({
          tenant_id: tenantId!,
          nom: `Session ${currentSession.id}`,
          description: `Réconciliation de ${currentSession.lotsCount} lots`,
          statut: 'terminee',
          type: 'complet',
          date_debut: new Date(currentSession.date).toISOString(),
          date_fin: new Date().toISOString(),
          produits_total: currentSession.lotsCount,
          produits_comptes: currentSession.lotsCount,
          ecarts: discrepancies.length,
          progression: 100,
          responsable: `${currentPersonnel.prenoms} ${currentPersonnel.noms}`,
          agent_id: currentPersonnel.id
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Erreur lors de la sauvegarde de la session:', sessionError);
        throw sessionError;
      }

      // Audit log pour la création de la session
      await supabase
        .from('audit_logs')
        .insert({
          tenant_id: tenantId,
          user_id: currentPersonnel.auth_user_id,
          personnel_id: currentPersonnel.id,
          action: 'RECONCILIATION_COMPLETED',
          table_name: 'inventaire_sessions',
          record_id: sessionData.id,
          new_values: {
            session_id: sessionData.id,
            discrepancies_count: discrepancies.length,
            total_lots: currentSession.lotsCount,
            completion_timestamp: new Date().toISOString(),
            session_type: 'complet'
          },
          status: 'success'
        });

      // 2. Créer les mouvements d'ajustement pour chaque écart
      for (const discrepancy of discrepancies) {
        console.log('Ajustement pour lot:', discrepancy.lotId);
        
        // Créer un mouvement d'ajustement pour corriger l'écart
        await StockUpdateService.recordStockMovement({
          produit_id: discrepancy.productId,
          lot_id: discrepancy.lotId,
          quantite: discrepancy.difference,
          type_mouvement: 'ajustement',
          reference_type: 'reconciliation',
          reference_id: sessionData.id,
          motif: `Réconciliation inventaire - Session ${currentSession?.id}`,
          description: `Ajustement suite à réconciliation: Stock théorique ${discrepancy.theoreticalQuantity}, Stock physique ${discrepancy.physicalQuantity}`,
          metadata: {
            reconciliation_session_id: sessionData.id,
            session_number: currentSession?.id,
            theoretical_quantity: discrepancy.theoreticalQuantity,
            physical_quantity: discrepancy.physicalQuantity,
            reconciliation_type: 'inventory_adjustment'
          }
        });

        // La RPC rpc_stock_record_movement met déjà à jour lots.quantite_restante
      }

      // 3. Marquer la session comme terminée
      const completedSession = {
        ...currentSession,
        status: 'completed' as const,
        discrepanciesCount: discrepancies.length
      };

      // 4. Recharger les sessions depuis la base de données
      await loadCompletedSessions();

      // 5. Réinitialiser l'état
      setCurrentSession(null);
      setReconciliationMode(false);
      setDiscrepancies([]);
      setPhysicalCounts({});

      toast.success(`Réconciliation finalisée avec succès. ${discrepancies.length} écart(s) traité(s).`);
      
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
      toast.error('Erreur lors de la finalisation de la réconciliation');
    }
  };

  // Fonction pour récupérer les détails d'une session terminée
  const fetchSessionDetails = async (sessionId: string) => {
    try {
      setLoadingDetails(true);

      // 1. Récupérer les informations de la session
      const { data: sessionData, error: sessionError } = await supabase
        .from('inventaire_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('Erreur lors de la récupération de la session:', sessionError);
        toast.error('Erreur lors de la récupération des détails de la session');
        return;
      }

      // 2. Récupérer les logs d'audit pour cette session
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select(`
          *,
          personnel:personnel_id (
            noms,
            prenoms
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('record_id', sessionId)
        .eq('action', 'RECONCILIATION_COMPLETED')
        .order('created_at', { ascending: false });

      if (auditError) {
        console.error('Erreur lors de la récupération des logs:', auditError);
      }

      // 3. Récupérer les mouvements d'ajustement liés à cette session depuis mouvements_lots
      // Essayons d'abord avec les critères exacts
      let { data: movements, error: movementsError } = await supabase
        .from('mouvements_lots')
        .select(`
          id,
          tenant_id,
          produit_id,
          lot_id,
          type_mouvement,
          quantite_mouvement,
          date_mouvement,
          agent_id,
          reference_id,
          reference_type,
          metadata,
          created_at,
          lot:lots!lot_id (
            numero_lot,
            produit:produit_id (
              libelle_produit
            )
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('type_mouvement', 'ajustement')
        .eq('reference_type', 'reconciliation')
        .eq('reference_document', sessionId)
        .order('date_mouvement', { ascending: false });


      if (movementsError) {
        console.error('Erreur lors de la récupération des mouvements:', movementsError);
      }

      console.log('🔍 Mouvements de réconciliation:', {
        sessionId,
        mouvementsCount: movements?.length || 0,
        premiers3: movements?.slice(0, 3).map(m => ({
          lot: m.lot?.numero_lot,
          produit: m.lot?.produit?.libelle_produit,
          quantite: m.quantite_mouvement,
          reference_id: m.reference_id,
          metadata: m.metadata
        }))
      });

      // 4. Construire les écarts à partir des mouvements
      const sessionDiscrepancies: InventoryDiscrepancy[] = movements?.map((movement: MovementData) => {
        // Typer correctement les métadonnées
        const metadata = movement.metadata as ReconciliationMetadata;
        
        return {
          lotId: movement.lot_id,
          lotNumber: movement.lot?.numero_lot || 'N/A',
          productName: movement.lot?.produit?.libelle_produit || 'Produit inconnu',
          theoreticalQuantity: metadata?.theoretical_quantity || 0,
          physicalQuantity: metadata?.physical_quantity || 0,
          difference: movement.quantite_mouvement,
          status: movement.quantite_mouvement > 0 ? 'surplus' as const : 'deficit' as const,
          productId: movement.produit_id
        };
      }) || [];

      // Logs de débogage pour vérifier les données
      console.log('📊 Session Discrepancies construites:', sessionDiscrepancies);
      console.log('📊 Nombre d\'écarts:', sessionDiscrepancies.length);
      console.log('📊 Détails écarts:', sessionDiscrepancies.map(d => ({
        lot: d.lotNumber,
        produit: d.productName,
        theorique: d.theoreticalQuantity,
        physique: d.physicalQuantity,
        ecart: d.difference
      })));

      // 5. Construire l'objet SessionDetails
      const sessionDetails: SessionDetails = {
        session: {
          id: sessionData.id,
          date: sessionData.created_at,
          status: 'completed',
          lotsCount: sessionData.produits_total || 0,
          discrepanciesCount: sessionData.ecarts || 0
        },
        discrepancies: sessionDiscrepancies,
        personnel: auditLogs?.[0]?.personnel || undefined,
        auditLogs: auditLogs || []
      };

      setSelectedSessionDetails(sessionDetails);
      setIsDetailsDialogOpen(true);

    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      toast.error('Erreur lors de la récupération des détails de la session');
    } finally {
      setLoadingDetails(false);
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
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historique
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
                    <p className="text-2xl font-bold">{completedSessions.length}</p>
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

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des Réconciliations
              </CardTitle>
              <CardDescription>
                Consultez l'historique des sessions de réconciliation terminées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground mb-4 animate-spin" />
                  <p className="text-muted-foreground">Chargement de l'historique...</p>
                </div>
              ) : completedSessions.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {completedSessions.length} session(s) de réconciliation terminée(s)
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={loadCompletedSessions}
                      disabled={loading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Session</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Lots Vérifiés</TableHead>
                          <TableHead>Écarts Détectés</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completedSessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell className="font-medium">{session.id}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(session.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-blue-600" />
                                {session.lotsCount}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={session.discrepanciesCount > 0 ? 'destructive' : 'secondary'}>
                                {session.discrepanciesCount} écart(s)
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Terminée
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => fetchSessionDetails(session.id)}
                                disabled={loadingDetails}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Détails
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun Historique</h3>
                  <p className="text-muted-foreground mb-4">
                    Aucune session de réconciliation n'a encore été terminée
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={loadCompletedSessions}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
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

      {/* Dialog pour afficher les détails d'une session */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Détails de la Session de Réconciliation
            </DialogTitle>
            <DialogDescription>
              {selectedSessionDetails && (
                <>Informations complètes pour la session {selectedSessionDetails.session.id}</>
              )}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground mb-4 animate-spin" />
              <p className="text-muted-foreground">Chargement des détails...</p>
            </div>
          ) : selectedSessionDetails ? (
            <div className="space-y-6">
              {/* Informations générales de la session */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations Générales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Session ID</Label>
                      <p className="font-mono text-sm">{selectedSessionDetails.session.id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                      <p className="text-sm">
                        {format(new Date(selectedSessionDetails.session.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Lots Vérifiés</Label>
                      <p className="text-sm font-semibold">{selectedSessionDetails.session.lotsCount}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Écarts Détectés</Label>
                      <p className="text-sm font-semibold text-red-600">
                        {selectedSessionDetails.session.discrepanciesCount}
                      </p>
                    </div>
                  </div>
                  
                  {selectedSessionDetails.personnel && (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-sm font-medium text-muted-foreground">Réalisé par</Label>
                      <p className="text-sm">
                        {selectedSessionDetails.personnel.prenoms} {selectedSessionDetails.personnel.noms}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Détails des écarts */}
              {selectedSessionDetails.discrepancies.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Écarts Détectés</CardTitle>
                    <CardDescription>
                      Liste des ajustements effectués lors de cette réconciliation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Lot</TableHead>
                            <TableHead>Produit</TableHead>
                            <TableHead>Qté Théorique</TableHead>
                            <TableHead>Qté Physique</TableHead>
                            <TableHead>Écart</TableHead>
                            <TableHead>Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedSessionDetails.discrepancies.map((discrepancy, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-sm">
                                {discrepancy.lotNumber}
                              </TableCell>
                              <TableCell className="font-medium">
                                {discrepancy.productName}
                              </TableCell>
                              <TableCell>{discrepancy.theoreticalQuantity}</TableCell>
                              <TableCell>{discrepancy.physicalQuantity}</TableCell>
                              <TableCell className={discrepancy.difference > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                {discrepancy.difference > 0 ? '+' : ''}{discrepancy.difference}
                              </TableCell>
                              <TableCell>
                                <Badge className={getDiscrepancyColor(discrepancy.status)}>
                                  {getDiscrepancyIcon(discrepancy.status)}
                                  <span className="ml-1">
                                    {discrepancy.status === 'surplus' ? 'Surplus' : 'Déficit'}
                                  </span>
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun Écart Détecté</h3>
                    <p className="text-muted-foreground">
                      Cette session de réconciliation n'a révélé aucun écart entre les stocks théoriques et physiques.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun détail disponible</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};