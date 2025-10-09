import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Plus, 
  ArrowRightLeft, 
  Package, 
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Truck,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useLotMovements } from '@/hooks/useLotMovements';
import { useProducts } from '@/hooks/useProducts';
import { useLots } from '@/hooks/useLots';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StockTransferMetadata {
  numero: string;
  origine: string;
  destination: string;
  motif: string;
  commentaire?: string;
  statut: 'en_cours' | 'en_transit' | 'recu' | 'annule';
  utilisateurCreation?: string;
  utilisateurReception?: string;
  [key: string]: any; // Index signature for Json compatibility
}

interface StockTransferMovement {
  id: string;
  date_mouvement: string;
  produit_id: string;
  lot_id: string;
  quantite_mouvement: number;
  metadata: StockTransferMetadata;
  emplacement_source?: string;
  emplacement_destination?: string;
  lot?: {
    numero_lot: string;
    quantite_restante: number;
  };
  produit?: {
    libelle_produit: string;
    code_cip: string;
  };
}

function StockTransfers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransferMovement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState<string>('tous');
  const [localTransferts, setLocalTransferts] = useState<StockTransferMovement[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Hooks pour les données
  const { useLotMovementsQuery } = useLotMovements();
  const { products } = useProducts();
  const { useLotsQuery } = useLots();
  
  // Charger les transferts (mouvements avec type_mouvement='transfert')
  const { data: movementsData, isLoading: loadingMovements, refetch: refetchMovements } = useLotMovementsQuery({
    type_mouvement: 'transfert'
  });

  // Charger les lots disponibles
  const { data: lotsData } = useLotsQuery();

  // Formulaire pour nouveau transfert
  const [formData, setFormData] = useState({
    produit_id: '',
    lot_id: '',
    quantite: 0,
    origine: '',
    destination: '',
    motif: '',
    commentaire: ''
  });

  // Générer un numéro de transfert unique
  const generateTransferNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `TRF${year}${month}${timestamp}`;
  };

  // Convertir les mouvements en transferts avec détails
  const memoizedTransferts: StockTransferMovement[] = useMemo(() => {
    if (!movementsData) return [];
    return movementsData
      .filter((movement: any) => movement.metadata?.origine)
      .map((movement: any) => ({
        id: movement.id,
        date_mouvement: movement.date_mouvement,
        produit_id: movement.produit_id,
        lot_id: movement.lot_id,
        quantite_mouvement: movement.quantite_mouvement,
        metadata: movement.metadata || {},
        emplacement_source: movement.emplacement_source,
        emplacement_destination: movement.emplacement_destination,
        lot: movement.lot,
        lot_destination: movement.lot_destination,
        produit: movement.produit
      }));
  }, [movementsData]);
  
  // Utiliser useEffect pour mettre à jour l'état local des transferts quand les données mémorisées changent
  useEffect(() => {
    setLocalTransferts(memoizedTransferts);
  }, [memoizedTransferts]);

  // Filtrer les lots par produit sélectionné
  const availableLots = useMemo(() => {
    if (!lotsData || !formData.produit_id) return [];
    return lotsData.filter((lot: any) => 
      lot.produit_id === formData.produit_id && 
      lot.quantite_restante > 0
    );
  }, [lotsData, formData.produit_id]);

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'recu':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'annule':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'en_transit':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'en_cours':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatutBadge = (statut: string) => {
    const colors = {
      recu: 'bg-green-100 text-green-800 border-green-200',
      annule: 'bg-red-100 text-red-800 border-red-200',
      en_transit: 'bg-blue-100 text-blue-800 border-blue-200',
      en_cours: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    const labels = {
      recu: 'Reçu',
      annule: 'Annulé',
      en_transit: 'En transit',
      en_cours: 'En cours'
    };

    return (
      <Badge className={colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[statut as keyof typeof labels] || statut}
      </Badge>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.produit_id || !formData.lot_id || !formData.quantite || !formData.origine || !formData.destination || !formData.motif) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (formData.origine === formData.destination) {
      toast({
        title: "Erreur",
        description: "L'origine et la destination doivent être différentes",
        variant: "destructive"
      });
      return;
    }

    try {
      const numeroTransfert = generateTransferNumber();
      
      const metadata: StockTransferMetadata = {
        numero: numeroTransfert,
        origine: formData.origine,
        destination: formData.destination,
        motif: formData.motif,
        commentaire: formData.commentaire,
        statut: 'en_cours'
      };

      const { error } = await supabase.rpc('rpc_stock_record_movement', {
        p_lot_id: formData.lot_id,
        p_produit_id: formData.produit_id,
        p_type_mouvement: 'transfert',
        p_quantite_mouvement: formData.quantite,
        p_reference_type: 'transfert',
        p_reference_document: numeroTransfert,
        p_emplacement_source: formData.origine,
        p_emplacement_destination: formData.destination,
        p_motif: formData.motif,
        p_metadata: metadata
      });

      if (error) throw error;

      toast({
        title: "Transfert créé",
        description: `Le transfert ${numeroTransfert} a été créé avec succès`,
      });

      setIsDialogOpen(false);
      setFormData({
        produit_id: '',
        lot_id: '',
        quantite: 0,
        origine: '',
        destination: '',
        motif: '',
        commentaire: ''
      });
      
      refetchMovements();
      queryClient.invalidateQueries({ queryKey: ['lots'] });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du transfert",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (movementId: string, newStatus: 'en_cours' | 'en_transit' | 'recu' | 'annule') => {
    try {
      const movement = localTransferts.find(t => t.id === movementId);
      if (!movement) return;

      const updatedMetadata = {
        ...movement.metadata,
        statut: newStatus
      };

      const { error } = await supabase.rpc('rpc_stock_update_movement', {
        p_movement_id: movementId,
        p_new_metadata: updatedMetadata
      });

      if (error) throw error;

      // Invalider le cache pour forcer un rechargement des données
      queryClient.invalidateQueries({queryKey: ['lot-movements']});
      
      // Rafraîchir les données immédiatement
      await refetchMovements();

      // Mise à jour locale du transfert sélectionné pour actualiser l'interface immédiatement
      if (selectedTransfer && selectedTransfer.id === movementId) {
        setSelectedTransfer({
          ...selectedTransfer,
          metadata: {
            ...selectedTransfer.metadata,
            statut: newStatus
          }
        });
      }

      // Mettre à jour l'état local des transferts pour une mise à jour immédiate de l'UI
      setLocalTransferts(prevTransferts => 
        prevTransferts.map(transfert => 
          transfert.id === movementId 
            ? {
                ...transfert,
                metadata: {
                  ...transfert.metadata,
                  statut: newStatus
                }
              } 
            : transfert
        )
      );

      toast({
        title: "Statut mis à jour",
        description: `Transfert mis à jour vers "${newStatus}"`,
      });

      // Rafraîchir les données en arrière-plan
      refetchMovements();
      queryClient.invalidateQueries({ queryKey: ['lots'] });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du statut",
        variant: "destructive"
      });
    }
  };

  const filteredTransferts = localTransferts.filter(transfert => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      transfert.produit?.libelle_produit?.toLowerCase().includes(searchLower) ||
      transfert.lot?.numero_lot?.toLowerCase().includes(searchLower) ||
      transfert.metadata.numero?.toLowerCase().includes(searchLower) ||
      transfert.metadata.origine?.toLowerCase().includes(searchLower) ||
      transfert.metadata.destination?.toLowerCase().includes(searchLower);
    
    const matchesStatut = selectedStatut === 'tous' || transfert.metadata.statut === selectedStatut;
    
    return matchesSearch && matchesStatut;
  });

  return (
    <div className="space-y-6">
      {/* Métriques des transferts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Transferts</p>
              <p className="text-2xl font-bold">{localTransferts.length}</p>
            </div>
            <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">En Transit</p>
              <p className="text-2xl font-bold text-blue-600">
                {localTransferts.filter(t => t.metadata.statut === 'en_transit').length}
              </p>
            </div>
            <Truck className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">En Cours</p>
              <p className="text-2xl font-bold text-yellow-600">
                {localTransferts.filter(t => t.metadata.statut === 'en_cours').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Terminés</p>
              <p className="text-2xl font-bold text-green-600">
                {localTransferts.filter(t => t.metadata.statut === 'recu').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>
      </div>

      {/* Liste des transferts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transferts de Stock</CardTitle>
              <CardDescription>Gestion des mouvements entre sites et succursales</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Transfert
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Créer un Transfert de Stock</DialogTitle>
                  <DialogDescription>
                    Transférez des produits entre différents sites ou succursales
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="produit">Produit *</Label>
                      <Select value={formData.produit_id} onValueChange={(value) => setFormData({...formData, produit_id: value, lot_id: ''})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un produit" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.libelle_produit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lot">Lot *</Label>
                      <Select 
                        value={formData.lot_id} 
                        onValueChange={(value) => setFormData({...formData, lot_id: value})}
                        disabled={!formData.produit_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un lot" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableLots.map((lot) => (
                            <SelectItem key={lot.id} value={lot.id}>
                              {lot.numero_lot} (Stock: {lot.quantite_restante})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantite">Quantité à transférer *</Label>
                    <Input
                      id="quantite"
                      type="number"
                      placeholder="Quantité"
                      value={formData.quantite.toString()}
                      onChange={(e) => setFormData({...formData, quantite: parseInt(e.target.value) || 0})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="origine">Site d'origine *</Label>
                      <Select value={formData.origine} onValueChange={(value) => setFormData({...formData, origine: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Site d'origine" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pharmacie_centrale">Pharmacie Centrale</SelectItem>
                          <SelectItem value="succursale_a">Succursale A</SelectItem>
                          <SelectItem value="succursale_b">Succursale B</SelectItem>
                          <SelectItem value="entrepot">Entrepôt Principal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="destination">Site de destination *</Label>
                      <Select value={formData.destination} onValueChange={(value) => setFormData({...formData, destination: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Site de destination" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pharmacie_centrale">Pharmacie Centrale</SelectItem>
                          <SelectItem value="succursale_a">Succursale A</SelectItem>
                          <SelectItem value="succursale_b">Succursale B</SelectItem>
                          <SelectItem value="entrepot">Entrepôt Principal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motif">Motif du transfert *</Label>
                    <Select value={formData.motif} onValueChange={(value) => setFormData({...formData, motif: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un motif" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reapprovisionnement">Réapprovisionnement</SelectItem>
                        <SelectItem value="equilibrage">Équilibrage des stocks</SelectItem>
                        <SelectItem value="retour_surplus">Retour de surplus</SelectItem>
                        <SelectItem value="urgence">Besoin urgent</SelectItem>
                        <SelectItem value="reorganisation">Réorganisation</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commentaire">Commentaire</Label>
                    <Textarea
                      id="commentaire"
                      placeholder="Informations complémentaires sur le transfert..."
                      value={formData.commentaire}
                      onChange={(e) => setFormData({...formData, commentaire: e.target.value})}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">Créer le Transfert</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher transfert, produit, site..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={selectedStatut} onValueChange={setSelectedStatut}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="en_transit">En transit</SelectItem>
                <SelectItem value="recu">Reçu</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Transfert</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Origine</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransferts.map((transfert) => (
                  <TableRow key={transfert.id}>
                    <TableCell className="font-medium">{transfert.metadata.numero}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(transfert.date_mouvement), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </TableCell>
                    <TableCell>{transfert.produit?.libelle_produit || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transfert.lot?.numero_lot || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{transfert.quantite_mouvement}</TableCell>
                    <TableCell>{transfert.metadata.origine}</TableCell>
                    <TableCell>{transfert.metadata.destination}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatutIcon(transfert.metadata.statut)}
                        {getStatutBadge(transfert.metadata.statut)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Sheet open={isDetailSheetOpen && selectedTransfer?.id === transfert.id} onOpenChange={(open) => {
                          setIsDetailSheetOpen(open);
                          if (open) setSelectedTransfer(transfert);
                        }}>
                          <SheetTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                        </Sheet>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTransferts.length === 0 && !loadingMovements && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun transfert trouvé pour les critères sélectionnés
            </div>
          )}
          
          {loadingMovements && (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des transferts...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet pour les détails du transfert */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="sm:max-w-[600px]">
          {selectedTransfer && (
            <>
              <SheetHeader>
                <SheetTitle>Détail du Transfert - {selectedTransfer.metadata.numero}</SheetTitle>
                <SheetDescription>
                  Transfert créé le {format(new Date(selectedTransfer.date_mouvement), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Informations du produit et lot */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Produit</Label>
                    <p className="font-medium">{selectedTransfer.produit?.libelle_produit}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Lot</Label>
                    <p className="font-medium">{selectedTransfer.lot?.numero_lot}</p>
                  </div>
                </div>

                {/* Quantité */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Quantité transférée</Label>
                  <p className="text-lg font-semibold">{selectedTransfer.quantite_mouvement}</p>
                </div>

                {/* Origine et destination */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Origine</Label>
                    <p className="font-medium">{selectedTransfer.metadata.origine}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Destination</Label>
                    <p className="font-medium">{selectedTransfer.metadata.destination}</p>
                  </div>
                </div>

                {/* Motif et commentaire */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Motif</Label>
                    <p className="font-medium">{selectedTransfer.metadata.motif}</p>
                  </div>
                  {selectedTransfer.metadata.commentaire && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Commentaire</Label>
                      <p className="text-sm">{selectedTransfer.metadata.commentaire}</p>
                    </div>
                  )}
                </div>

                {/* Statut */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-muted-foreground">Statut:</Label>
                  {getStatutIcon(selectedTransfer.metadata.statut)}
                  {getStatutBadge(selectedTransfer.metadata.statut)}
                </div>

                {/* Actions de changement de statut */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Changer le statut</Label>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTransfer.metadata.statut === 'en_cours' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedTransfer.id, 'en_transit')}
                      >
                        <Truck className="mr-2 h-4 w-4" />
                        Marquer en transit
                      </Button>
                    )}
                    {selectedTransfer.metadata.statut === 'en_transit' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedTransfer.id, 'recu')}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Marquer comme reçu
                      </Button>
                    )}
                    {['en_cours', 'en_transit'].includes(selectedTransfer.metadata.statut) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedTransfer.id, 'annule')}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Annuler
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default StockTransfers;