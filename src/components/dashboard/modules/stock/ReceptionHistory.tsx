import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Package, 
  Search,
  Calendar,
  Eye,
  FileText,
  Truck,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useReceptions, Reception } from '@/hooks/useReceptions';
import { useLots, LotWithDetails } from '@/hooks/useLots';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReceptionHistoryProps {
  onViewReception?: (reception: Reception) => void;
}

const ReceptionHistory: React.FC<ReceptionHistoryProps> = ({ onViewReception }) => {
  const { receptions, loading } = useReceptions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReception, setSelectedReception] = useState<Reception | null>(null);
  const [showLotsDialog, setShowLotsDialog] = useState(false);
  const [showMovementsDialog, setShowMovementsDialog] = useState(false);
  const [receptionLots, setReceptionLots] = useState<LotWithDetails[]>([]);
  const [receptionMovements, setReceptionMovements] = useState<any[]>([]);
  const [loadingLots, setLoadingLots] = useState(false);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Filter receptions based on search and status
  const filteredReceptions = receptions.filter(reception => {
    const matchesSearch = !searchTerm || 
      reception.numero_reception?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reception.reference_facture?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reception.fournisseur?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reception.statut === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (statut?: string) => {
    switch (statut) {
      case 'Validé': return 'bg-green-100 text-green-800';
      case 'En cours': return 'bg-yellow-100 text-yellow-800';
      case 'Annulé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fetch lots created during reception
  const fetchReceptionLots = async (receptionId: string) => {
    setLoadingLots(true);
    try {
      const { data, error }: { data: any; error: any } = await supabase
        .from('lots')
        .select(`
          *,
          produit:produits!produit_id(
            id,
            libelle_produit,
            code_cip
          ),
          fournisseur:fournisseurs!fournisseur_id(
            id,
            nom
          )
        `)
        .eq('reception_id', receptionId);

      if (error) throw error;
      setReceptionLots(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des lots:', error);
    } finally {
      setLoadingLots(false);
    }
  };

  // Fetch movements related to reception
  const fetchReceptionMovements = async (receptionId: string) => {
    setLoadingMovements(true);
    try {
      const { data, error } = await supabase
        .from('mouvements_lots')
        .select(`
          *,
          lot:lots!lot_id(
            id,
            numero_lot,
            produit:produits!produit_id(
              id,
              libelle_produit,
              code_cip
            )
          )
        `)
        .eq('reference_id', receptionId)
        .eq('reference_type', 'reception')
        .order('date_mouvement', { ascending: false });

      if (error) throw error;
      setReceptionMovements(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des mouvements:', error);
    } finally {
      setLoadingMovements(false);
    }
  };

  const getStatusIcon = (statut?: string) => {
    switch (statut) {
      case 'Validé': return <CheckCircle className="h-4 w-4" />;
      case 'En cours': return <Clock className="h-4 w-4" />;
      case 'Annulé': return <AlertTriangle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Package className="h-8 w-8 animate-spin" />
            <span className="ml-2">Chargement de l'historique...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const statistics = {
    total: receptions.length,
    valides: receptions.filter(r => r.statut === 'Validé').length,
    enCours: receptions.filter(r => r.statut === 'En cours').length,
    mensuelles: receptions.filter(r => {
      const receptionDate = new Date(r.date_reception || r.created_at);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      return receptionDate.getMonth() === currentMonth && receptionDate.getFullYear() === currentYear;
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Statistics Block - Same structure as OrderList */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Validées</p>
                <p className="text-2xl font-bold">{statistics.valides}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{statistics.enCours}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ce mois</p>
                <p className="text-2xl font-bold">{statistics.mensuelles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Display Block - Title, subtitle, search and filters, table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Historique des Réceptions
              </CardTitle>
              <CardDescription>
                Consultez l'historique complet de vos réceptions fournisseurs ({filteredReceptions.length} réceptions)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro, référence ou fournisseur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="En cours">En cours</SelectItem>
                <SelectItem value="Validé">Validé</SelectItem>
                <SelectItem value="Annulé">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reception History Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm || (statusFilter !== 'all') ? 'Aucune réception trouvée' : 'Aucune réception enregistrée'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReceptions.map((reception) => (
                    <TableRow key={reception.id}>
                      <TableCell className="font-medium">
                        {reception.numero_reception || `REC-${reception.id.slice(-6)}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {reception.date_reception ? 
                            format(new Date(reception.date_reception), 'dd/MM/yyyy HH:mm', { locale: fr }) :
                            format(new Date(reception.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          {reception.fournisseur?.nom || 'Fournisseur inconnu'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {reception.reference_facture ? (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {reception.reference_facture}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(reception.statut)}>
                          {getStatusIcon(reception.statut)}
                          <span className="ml-1">{reception.statut || 'En cours'}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReception(reception)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Voir
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Package className="h-5 w-5" />
                                  Détails de la réception {selectedReception?.numero_reception}
                                </DialogTitle>
                                <DialogDescription>
                                  Réception du {selectedReception?.date_reception ? 
                                    format(new Date(selectedReception.date_reception), 'dd/MM/yyyy à HH:mm', { locale: fr }) :
                                    format(new Date(selectedReception?.created_at || new Date()), 'dd/MM/yyyy à HH:mm', { locale: fr })
                                  }
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedReception && (
                                <div className="space-y-6">
                                  {/* Reception Info */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-sm">Informations générales</h4>
                                      <div className="text-sm space-y-1">
                                        <p><span className="font-medium">Fournisseur:</span> {selectedReception.fournisseur?.nom}</p>
                                        <p><span className="font-medium">Référence facture:</span> {selectedReception.reference_facture || '-'}</p>
                                        <p><span className="font-medium">Statut:</span> 
                                          <Badge className={`ml-2 ${getStatusColor(selectedReception.statut)}`}>
                                            {selectedReception.statut || 'En cours'}
                                          </Badge>
                                        </p>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-sm">Commande liée</h4>
                                      <div className="text-sm space-y-1">
                                        {selectedReception.commande ? (
                                          <p><span className="font-medium">N° Commande:</span> {selectedReception.commande.numero}</p>
                                        ) : (
                                          <p className="text-muted-foreground">Aucune commande liée</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Notes */}
                                  {selectedReception.notes && (
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-sm">Notes</h4>
                                      <p className="text-sm p-3 bg-muted rounded">{selectedReception.notes}</p>
                                    </div>
                                  )}

                                  {/* Quick actions */}
                                  <div className="flex gap-2 pt-4 border-t">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        fetchReceptionLots(selectedReception.id);
                                        setShowLotsDialog(true);
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Voir les lots créés
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        fetchReceptionMovements(selectedReception.id);
                                        setShowMovementsDialog(true);
                                      }}
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      Historique des mouvements
                                    </Button>
                                  </div>
                                 </div>
                               )}
                             </DialogContent>
                           </Dialog>
                           
                           {onViewReception && (
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => onViewReception(reception)}
                             >
                               <ExternalLink className="h-4 w-4" />
                             </Button>
                           )}
                         </div>
                       </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
           </div>
         </CardContent>
       </Card>

       {/* Stats Summary */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card>
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Total</p>
                 <p className="text-2xl font-bold">{receptions.length}</p>
               </div>
               <Package className="h-8 w-8 text-muted-foreground" />
             </div>
           </CardContent>
         </Card>
         
         <Card>
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Validées</p>
                 <p className="text-2xl font-bold text-green-600">
                   {receptions.filter(r => r.statut === 'Validé').length}
                 </p>
               </div>
               <CheckCircle className="h-8 w-8 text-green-600" />
             </div>
           </CardContent>
         </Card>
         
         <Card>
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-muted-foreground">En cours</p>
                 <p className="text-2xl font-bold text-yellow-600">
                   {receptions.filter(r => r.statut === 'En cours').length}
                 </p>
               </div>
               <Clock className="h-8 w-8 text-yellow-600" />
             </div>
           </CardContent>
         </Card>
         
         <Card>
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Ce mois</p>
                 <p className="text-2xl font-bold">
                   {receptions.filter(r => {
                     const receptionDate = new Date(r.created_at);
                     const currentDate = new Date();
                     return receptionDate.getMonth() === currentDate.getMonth() &&
                            receptionDate.getFullYear() === currentDate.getFullYear();
                   }).length}
                 </p>
               </div>
               <Calendar className="h-8 w-8 text-muted-foreground" />
             </div>
           </CardContent>
         </Card>
       </div>

      {/* Lots Dialog */}
      <Dialog open={showLotsDialog} onOpenChange={setShowLotsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Lots créés lors de la réception</DialogTitle>
            <DialogDescription>
              Liste des lots créés lors de la réception {selectedReception?.numero_reception}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-auto">
            {loadingLots ? (
              <div className="text-center py-4">Chargement...</div>
            ) : receptionLots.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Aucun lot trouvé pour cette réception
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Lot</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Quantité initiale</TableHead>
                    <TableHead>Quantité restante</TableHead>
                    <TableHead>Date péremption</TableHead>
                    <TableHead>Prix d'achat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receptionLots.map((lot) => (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium">{lot.numero_lot}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lot.produit?.libelle_produit}</div>
                          <div className="text-sm text-muted-foreground">{lot.produit?.code_cip}</div>
                        </div>
                      </TableCell>
                      <TableCell>{lot.quantite_initiale}</TableCell>
                      <TableCell>{lot.quantite_restante}</TableCell>
                      <TableCell>
                        {lot.date_peremption ? 
                          format(new Date(lot.date_peremption), 'dd/MM/yyyy', { locale: fr }) :
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        {lot.prix_achat_unitaire ? `${lot.prix_achat_unitaire} FCFA` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Movements Dialog */}
      <Dialog open={showMovementsDialog} onOpenChange={setShowMovementsDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Historique des mouvements</DialogTitle>
            <DialogDescription>
              Mouvements de stock liés à la réception {selectedReception?.numero_reception}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-auto">
            {loadingMovements ? (
              <div className="text-center py-4">Chargement...</div>
            ) : receptionMovements.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Aucun mouvement trouvé pour cette réception
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>N° Lot</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Motif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receptionMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {format(new Date(movement.date_mouvement), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={movement.type_mouvement === 'entree' ? 'default' : 'secondary'}>
                          {movement.type_mouvement}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{movement.lot?.produit?.libelle_produit}</div>
                          <div className="text-sm text-muted-foreground">{movement.lot?.produit?.code_cip}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{movement.lot?.numero_lot}</TableCell>
                      <TableCell className="font-medium">
                        <span className={movement.type_mouvement === 'entree' ? 'text-green-600' : 'text-red-600'}>
                          {movement.type_mouvement === 'entree' ? '+' : '-'}{movement.quantite_mouvement}
                        </span>
                      </TableCell>
                      <TableCell>{movement.reference_document || '-'}</TableCell>
                      <TableCell>{movement.motif || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceptionHistory;
