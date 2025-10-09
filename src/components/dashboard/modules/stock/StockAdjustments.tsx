import React, { useState, useMemo } from 'react';
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
  Settings, 
  Package, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useLotMovements } from '@/hooks/useLotMovements';
import { useProducts } from '@/hooks/useProducts';
import { useLots } from '@/hooks/useLots';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface StockAdjustmentMetadata {
  raison: string;
  stockTheorique: number;
  stockReel: number;
  ecart: number;
  commentaire?: string;
  statut: 'en_attente' | 'valide' | 'rejete';
  utilisateur?: string;
  [key: string]: any; // Index signature for Json compatibility
}

interface StockAdjustmentMovement {
  id: string;
  date_mouvement: string;
  produit_id: string;
  lot_id: string;
  quantite_mouvement: number;
  metadata: StockAdjustmentMetadata;
  lot?: {
    numero_lot: string;
    quantite_restante: number;
  };
  produit?: {
    libelle_produit: string;
    code_cip: string;
  };
}

const StockAdjustments = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustmentMovement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState<string>('tous');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Hooks pour les données
  const { useLotMovementsQuery } = useLotMovements();
  const { products } = useProducts();
  const { useLotsQuery } = useLots();
  
  // Charger les ajustements (mouvements avec type_mouvement='ajustement')
  const { data: movementsData, isLoading: loadingMovements, refetch: refetchMovements } = useLotMovementsQuery({
    type_mouvement: 'ajustement'
  });

  // Charger les lots disponibles
  const { data: lotsData } = useLotsQuery();

  // Formulaire pour nouvel ajustement
  const [formData, setFormData] = useState({
    produit_id: '',
    lot_id: '',
    stockTheorique: 0,
    stockReel: 0,
    raison: '',
    commentaire: ''
  });

  // Convertir les mouvements en ajustements avec détails
  const ajustements: StockAdjustmentMovement[] = useMemo(() => {
    if (!movementsData) return [];
    return movementsData
      .filter((movement: any) => movement.metadata?.raison)
      .map((movement: any) => ({
        id: movement.id,
        date_mouvement: movement.date_mouvement,
        produit_id: movement.produit_id,
        lot_id: movement.lot_id,
        quantite_mouvement: movement.quantite_mouvement,
        metadata: movement.metadata as StockAdjustmentMetadata,
        lot: movement.lot,
        produit: movement.produit
      }));
  }, [movementsData]);

  // Filtrer les lots par produit sélectionné
  const availableLots = useMemo(() => {
    if (!lotsData || !formData.produit_id) return [];
    // Afficher TOUS les lots du produit pour permettre les ajustements sur lots épuisés
    return lotsData.filter((lot: any) => 
      lot.produit_id === formData.produit_id
    );
  }, [lotsData, formData.produit_id]);

  // Mettre à jour le stock théorique quand un lot est sélectionné
  const selectedLot = useMemo(() => {
    return availableLots.find((lot: any) => lot.id === formData.lot_id);
  }, [availableLots, formData.lot_id]);

  React.useEffect(() => {
    if (selectedLot) {
      setFormData(prev => ({ ...prev, stockTheorique: selectedLot.quantite_restante }));
    }
  }, [selectedLot]);

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'valide':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejete':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'en_attente':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatutBadge = (statut: string) => {
    const colors = {
      valide: 'bg-green-100 text-green-800 border-green-200',
      rejete: 'bg-red-100 text-red-800 border-red-200',
      en_attente: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    const labels = {
      valide: 'Validé',
      rejete: 'Rejeté',
      en_attente: 'En attente'
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
    if (!formData.produit_id || !formData.lot_id || !formData.raison) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      const ecart = formData.stockReel - formData.stockTheorique;
      
      const metadata: StockAdjustmentMetadata = {
        raison: formData.raison,
        stockTheorique: formData.stockTheorique,
        stockReel: formData.stockReel,
        ecart,
        commentaire: formData.commentaire,
        statut: 'en_attente'
      };

      const { error } = await supabase.rpc('rpc_stock_record_movement', {
        p_lot_id: formData.lot_id,
        p_produit_id: formData.produit_id,
        p_type_mouvement: 'ajustement',
        p_quantite_mouvement: ecart,
        p_quantite_reelle: formData.stockReel,
        p_reference_id: null,
        p_reference_type: 'ajustement',
        p_reference_document: null,
        p_agent_id: null,
        p_lot_destination_id: null,
        p_emplacement_source: null,
        p_emplacement_destination: null,
        p_motif: formData.raison,
        p_metadata: metadata
      });

      if (error) throw error;

      toast({
        title: "Ajustement créé",
        description: "L'ajustement de stock a été enregistré avec succès",
      });

      setIsDialogOpen(false);
      setFormData({
        produit_id: '',
        lot_id: '',
        stockTheorique: 0,
        stockReel: 0,
        raison: '',
        commentaire: ''
      });
      
      // Forcer le refetch et l'invalidation des queries pour mise à jour immédiate
      await refetchMovements();
      await queryClient.invalidateQueries({ queryKey: ['lot-movements'] });
      await queryClient.invalidateQueries({ queryKey: ['lots'] });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de l'ajustement",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (movementId: string, newStatus: 'valide' | 'rejete') => {
    try {
      const movement = ajustements.find(adj => adj.id === movementId);
      if (!movement) return;

      const updatedMetadata = {
        ...movement.metadata,
        statut: newStatus
      };

      const { data, error } = await supabase.rpc('rpc_stock_update_movement', {
        p_movement_id: movementId,
        p_quantite_mouvement: movement.quantite_mouvement,
        p_motif: movement.metadata.raison,
        p_reference_document: null,
        p_metadata: updatedMetadata
      });

      if (error) throw error;

      // Vérifier le résultat de la RPC
      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        const errorMessage = (data as any).error || 'Erreur lors de la mise à jour du statut';
        throw new Error(errorMessage);
      }

      toast({
        title: "Statut mis à jour",
        description: `Ajustement ${newStatus === 'valide' ? 'validé' : 'rejeté'} avec succès`,
      });

      // Forcer le refetch et l'invalidation des queries pour mise à jour immédiate
      await refetchMovements();
      await queryClient.invalidateQueries({ queryKey: ['lot-movements'] });
      await queryClient.invalidateQueries({ queryKey: ['lots'] });
      setIsDetailSheetOpen(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du statut",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAdjustment = async (movementId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet ajustement ?")) return;

    try {
      const { data, error } = await supabase.rpc('rpc_stock_delete_movement', {
        p_movement_id: movementId
      });

      if (error) throw error;

      // Vérifier le résultat de la RPC
      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        const errorMessage = (data as any).error || 'Erreur lors de la suppression';
        throw new Error(errorMessage);
      }

      toast({
        title: "Ajustement supprimé",
        description: "L'ajustement a été supprimé avec succès",
      });

      // Forcer le refetch et l'invalidation des queries pour mise à jour immédiate
      await refetchMovements();
      await queryClient.invalidateQueries({ queryKey: ['lot-movements'] });
      await queryClient.invalidateQueries({ queryKey: ['lots'] });
      setIsDetailSheetOpen(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  const filteredAjustements = ajustements.filter(ajustement => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      ajustement.produit?.libelle_produit?.toLowerCase().includes(searchLower) ||
      ajustement.lot?.numero_lot?.toLowerCase().includes(searchLower) ||
      ajustement.metadata.raison?.toLowerCase().includes(searchLower) ||
      ajustement.metadata.commentaire?.toLowerCase().includes(searchLower);
    
    const matchesStatut = selectedStatut === 'tous' || ajustement.metadata.statut === selectedStatut;
    
    return matchesSearch && matchesStatut;
  });

  return (
    <div className="space-y-6">
      {/* Métriques des ajustements */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Ajustements</p>
              <p className="text-2xl font-bold">{ajustements.length}</p>
            </div>
            <Settings className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

                <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">En Attente</p>
              <p className="text-2xl font-bold text-yellow-600">
                {ajustements.filter(a => a.metadata.statut === 'en_attente').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Validés</p>
              <p className="text-2xl font-bold text-green-600">
                {ajustements.filter(a => a.metadata.statut === 'valide').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rejetés</p>
              <p className="text-2xl font-bold text-red-600">
                {ajustements.filter(a => a.metadata.statut === 'rejete').length}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>
      </div>

      {/* Liste des ajustements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ajustements de Stock</CardTitle>
              <CardDescription>Gestion des écarts et corrections de stock</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel Ajustement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Créer un Ajustement de Stock</DialogTitle>
                  <DialogDescription>
                    Enregistrez un écart entre le stock théorique et réel
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stockTheorique">Stock Théorique *</Label>
                      <Input
                        id="stockTheorique"
                        type="number"
                        placeholder="Quantité théorique"
                        value={formData.stockTheorique.toString()}
                        onChange={(e) => setFormData({...formData, stockTheorique: parseInt(e.target.value) || 0})}
                        readOnly
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stockReel">Stock Réel *</Label>
                      <Input
                        id="stockReel"
                        type="number"
                        placeholder="Quantité réelle comptée"
                        value={formData.stockReel.toString()}
                        onChange={(e) => setFormData({...formData, stockReel: parseInt(e.target.value) || 0})}
                        required
                      />
                    </div>
                  </div>

                  {formData.stockTheorique > 0 && formData.stockReel > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">
                        Écart: <span className={formData.stockReel - formData.stockTheorique > 0 ? 'text-green-600' : 'text-red-600'}>
                          {formData.stockReel - formData.stockTheorique > 0 ? '+' : ''}{formData.stockReel - formData.stockTheorique}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="raison">Raison de l'écart *</Label>
                    <Select value={formData.raison} onValueChange={(value) => setFormData({...formData, raison: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une raison" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casse">Casse/Détérioration</SelectItem>
                        <SelectItem value="vol">Vol/Perte</SelectItem>
                        <SelectItem value="erreur_saisie">Erreur de saisie</SelectItem>
                        <SelectItem value="peremption">Péremption</SelectItem>
                        <SelectItem value="inventaire">Écart d'inventaire</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commentaire">Commentaire</Label>
                    <Textarea
                      id="commentaire"
                      placeholder="Détails supplémentaires sur l'ajustement..."
                      value={formData.commentaire}
                      onChange={(e) => setFormData({...formData, commentaire: e.target.value})}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">Créer l'Ajustement</Button>
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
                  placeholder="Rechercher produit, lot, raison..."
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
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="valide">Validé</SelectItem>
                <SelectItem value="rejete">Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Stock Théorique</TableHead>
                  <TableHead>Stock Réel</TableHead>
                  <TableHead>Écart</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAjustements.map((ajustement) => (
                  <TableRow key={ajustement.id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(ajustement.date_mouvement), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </TableCell>
                    <TableCell className="font-medium">{ajustement.produit?.libelle_produit || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ajustement.lot?.numero_lot || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{ajustement.metadata.stockTheorique}</TableCell>
                    <TableCell>{ajustement.metadata.stockReel}</TableCell>
                    <TableCell>
                      <span className={ajustement.metadata.ecart > 0 ? 'text-green-600' : 'text-red-600'}>
                        {ajustement.metadata.ecart > 0 ? '+' : ''}{ajustement.metadata.ecart}
                      </span>
                    </TableCell>
                    <TableCell>{ajustement.metadata.raison}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatutIcon(ajustement.metadata.statut)}
                        {getStatutBadge(ajustement.metadata.statut)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Sheet open={isDetailSheetOpen && selectedAdjustment?.id === ajustement.id} onOpenChange={(open) => {
                          setIsDetailSheetOpen(open);
                          if (open) setSelectedAdjustment(ajustement);
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

          {filteredAjustements.length === 0 && !loadingMovements && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun ajustement trouvé pour les critères sélectionnés
            </div>
          )}
          
          {loadingMovements && (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des ajustements...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet pour les détails de l'ajustement */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="sm:max-w-[600px]">
          {selectedAdjustment && (
            <>
              <SheetHeader>
                <SheetTitle>Détail de l'Ajustement</SheetTitle>
                <SheetDescription>
                  Ajustement du {format(new Date(selectedAdjustment.date_mouvement), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Informations du produit et lot */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Produit</Label>
                    <p className="font-medium">{selectedAdjustment.produit?.libelle_produit}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Lot</Label>
                    <p className="font-medium">{selectedAdjustment.lot?.numero_lot}</p>
                  </div>
                </div>

                {/* Stocks et écart */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Stock Théorique</Label>
                    <p className="text-lg font-semibold">{selectedAdjustment.metadata.stockTheorique}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Stock Réel</Label>
                    <p className="text-lg font-semibold">{selectedAdjustment.metadata.stockReel}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Écart</Label>
                    <p className={`text-lg font-semibold ${selectedAdjustment.metadata.ecart > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedAdjustment.metadata.ecart > 0 ? '+' : ''}{selectedAdjustment.metadata.ecart}
                    </p>
                  </div>
                </div>

                {/* Raison et commentaire */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Raison</Label>
                    <p className="font-medium">{selectedAdjustment.metadata.raison}</p>
                  </div>
                  {selectedAdjustment.metadata.commentaire && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Commentaire</Label>
                      <p className="text-sm">{selectedAdjustment.metadata.commentaire}</p>
                    </div>
                  )}
                </div>

                {/* Statut */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-muted-foreground">Statut:</Label>
                  {getStatutIcon(selectedAdjustment.metadata.statut)}
                  {getStatutBadge(selectedAdjustment.metadata.statut)}
                </div>
              </div>

              <SheetFooter className="mt-6">
                <div className="flex gap-2 w-full">
                  {selectedAdjustment.metadata.statut === 'en_attente' && (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleUpdateStatus(selectedAdjustment.id, 'valide')}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Valider
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleUpdateStatus(selectedAdjustment.id, 'rejete')}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeter
                      </Button>
                    </>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteAdjustment(selectedAdjustment.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default StockAdjustments;