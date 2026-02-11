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
  Plus, Settings, Package, AlertTriangle, CheckCircle, XCircle,
  Search, Filter, Eye, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { useMovementsPaginated } from '@/hooks/useMovementsPaginated';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useTenant } from '@/contexts/TenantContext';

interface StockAdjustmentMetadata {
  raison: string;
  stockTheorique: number;
  stockReel: number;
  ecart: number;
  commentaire?: string;
  statut: 'en_attente' | 'valide' | 'rejete';
  utilisateur?: string;
  [key: string]: any;
}

const StockAdjustments = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState<string>('tous');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { products } = useProducts();
  const { tenantId } = useTenant();

  // Server-side paginated query for adjustments
  const {
    movements: movementsData,
    stats,
    count,
    totalPages,
    isLoading: loadingMovements,
    page,
    setPage,
    pageSize,
    refetch: refetchMovements,
    isFetching,
  } = useMovementsPaginated({
    search: searchTerm,
    type_mouvement: 'ajustement',
  });

  const [formData, setFormData] = useState({
    produit_id: '', lot_id: '', stockTheorique: 0, stockReel: 0, raison: '', commentaire: ''
  });

  // Lots filtered by selected product
  const { data: availableLots = [] } = useQuery({
    queryKey: ['lots-for-adjustment', tenantId, formData.produit_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lots')
        .select('id, produit_id, numero_lot, quantite_restante')
        .eq('tenant_id', tenantId!)
        .eq('produit_id', formData.produit_id)
        .order('date_peremption', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId && !!formData.produit_id,
  });

  const selectedLot = useMemo(() => availableLots.find((lot: any) => lot.id === formData.lot_id), [availableLots, formData.lot_id]);

  React.useEffect(() => {
    if (selectedLot) {
      setFormData(prev => ({ ...prev, stockTheorique: selectedLot.quantite_restante }));
    }
  }, [selectedLot]);

  // Filter adjustments client-side for status (metadata-based)
  const ajustements = useMemo(() => {
    if (!movementsData) return [];
    return movementsData
      .filter((m: any) => m.metadata?.raison)
      .filter((m: any) => selectedStatut === 'tous' || m.metadata?.statut === selectedStatut);
  }, [movementsData, selectedStatut]);

  // Compute metrics from stats (server-side count) and client filtering for status
  const statusCounts = useMemo(() => {
    const all = movementsData.filter((m: any) => m.metadata?.raison);
    return {
      total: all.length,
      en_attente: all.filter((m: any) => m.metadata?.statut === 'en_attente').length,
      valide: all.filter((m: any) => m.metadata?.statut === 'valide').length,
      rejete: all.filter((m: any) => m.metadata?.statut === 'rejete').length,
    };
  }, [movementsData]);

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'valide': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejete': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'en_attente': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatutBadge = (statut: string) => {
    const colors: Record<string, string> = {
      valide: 'bg-green-100 text-green-800 border-green-200',
      rejete: 'bg-red-100 text-red-800 border-red-200',
      en_attente: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    const labels: Record<string, string> = { valide: 'Validé', rejete: 'Rejeté', en_attente: 'En attente' };
    return <Badge className={colors[statut] || 'bg-gray-100 text-gray-800'}>{labels[statut] || statut}</Badge>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.produit_id || !formData.lot_id || !formData.raison) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }
    try {
      const ecart = formData.stockReel - formData.stockTheorique;
      const metadata: StockAdjustmentMetadata = {
        raison: formData.raison, stockTheorique: formData.stockTheorique,
        stockReel: formData.stockReel, ecart, commentaire: formData.commentaire, statut: 'en_attente'
      };
      const { error } = await supabase.rpc('rpc_stock_record_movement', {
        p_lot_id: formData.lot_id, p_produit_id: formData.produit_id,
        p_type_mouvement: 'ajustement', p_quantite_mouvement: ecart,
        p_quantite_reelle: formData.stockReel, p_reference_id: null,
        p_reference_type: 'ajustement', p_reference_document: null,
        p_agent_id: null, p_lot_destination_id: null,
        p_emplacement_source: null, p_emplacement_destination: null,
        p_motif: formData.raison, p_metadata: metadata
      });
      if (error) throw error;
      toast({ title: "Ajustement créé", description: "L'ajustement de stock a été enregistré avec succès" });
      setIsDialogOpen(false);
      setFormData({ produit_id: '', lot_id: '', stockTheorique: 0, stockReel: 0, raison: '', commentaire: '' });
      await refetchMovements();
      await queryClient.invalidateQueries({ queryKey: ['lots'] });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Erreur lors de la création", variant: "destructive" });
    }
  };

  const handleUpdateStatus = async (movementId: string, newStatus: 'valide' | 'rejete') => {
    try {
      const movement = movementsData.find((m: any) => m.id === movementId);
      if (!movement) return;
      const updatedMetadata = { ...movement.metadata, statut: newStatus };
      const { data, error } = await supabase.rpc('rpc_stock_update_movement', {
        p_movement_id: movementId, p_quantite_mouvement: movement.quantite_mouvement,
        p_motif: movement.metadata.raison, p_reference_document: null, p_metadata: updatedMetadata
      });
      if (error) throw error;
      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        throw new Error((data as any).error || 'Erreur lors de la mise à jour');
      }
      toast({ title: "Statut mis à jour", description: `Ajustement ${newStatus === 'valide' ? 'validé' : 'rejeté'}` });
      await refetchMovements();
      setIsDetailSheetOpen(false);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteAdjustment = async (movementId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet ajustement ?")) return;
    try {
      const { data, error } = await supabase.rpc('rpc_stock_delete_movement', { p_movement_id: movementId });
      if (error) throw error;
      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        throw new Error((data as any).error || 'Erreur lors de la suppression');
      }
      toast({ title: "Ajustement supprimé", description: "L'ajustement a été supprimé avec succès" });
      await refetchMovements();
      setIsDetailSheetOpen(false);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm font-medium text-muted-foreground">Total Ajustements</p><p className="text-2xl font-bold">{stats.ajustements}</p></div><Settings className="h-8 w-8 text-muted-foreground" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm font-medium text-muted-foreground">En Attente</p><p className="text-2xl font-bold text-yellow-600">{statusCounts.en_attente}</p></div><AlertTriangle className="h-8 w-8 text-yellow-600" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm font-medium text-muted-foreground">Validés</p><p className="text-2xl font-bold text-green-600">{statusCounts.valide}</p></div><CheckCircle className="h-8 w-8 text-green-600" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm font-medium text-muted-foreground">Rejetés</p><p className="text-2xl font-bold text-red-600">{statusCounts.rejete}</p></div><XCircle className="h-8 w-8 text-red-600" /></CardContent></Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle>Ajustements de Stock</CardTitle><CardDescription>Gestion des écarts et corrections de stock</CardDescription></div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nouvel Ajustement</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader><DialogTitle>Créer un Ajustement de Stock</DialogTitle><DialogDescription>Enregistrez un écart entre le stock théorique et réel</DialogDescription></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Produit *</Label>
                      <Select value={formData.produit_id} onValueChange={(v) => setFormData({...formData, produit_id: v, lot_id: ''})}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner un produit" /></SelectTrigger>
                        <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.libelle_produit}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Lot *</Label>
                      <Select value={formData.lot_id} onValueChange={(v) => setFormData({...formData, lot_id: v})} disabled={!formData.produit_id}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner un lot" /></SelectTrigger>
                        <SelectContent>{availableLots.map(l => <SelectItem key={l.id} value={l.id}>{l.numero_lot} (Stock: {l.quantite_restante})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Stock Théorique *</Label><Input type="number" value={formData.stockTheorique.toString()} readOnly className="bg-muted" /></div>
                    <div className="space-y-2"><Label>Stock Réel *</Label><Input type="number" value={formData.stockReel.toString()} onChange={(e) => setFormData({...formData, stockReel: parseInt(e.target.value) || 0})} required /></div>
                  </div>
                  {formData.stockTheorique > 0 && formData.stockReel > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Écart: <span className={formData.stockReel - formData.stockTheorique > 0 ? 'text-green-600' : 'text-red-600'}>{formData.stockReel - formData.stockTheorique > 0 ? '+' : ''}{formData.stockReel - formData.stockTheorique}</span></p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Raison de l'écart *</Label>
                    <Select value={formData.raison} onValueChange={(v) => setFormData({...formData, raison: v})}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner une raison" /></SelectTrigger>
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
                  <div className="space-y-2"><Label>Commentaire</Label><Textarea placeholder="Détails supplémentaires..." value={formData.commentaire} onChange={(e) => setFormData({...formData, commentaire: e.target.value})} /></div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
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
                <Input placeholder="Rechercher produit, lot, raison..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
            </div>
            <Select value={selectedStatut} onValueChange={setSelectedStatut}>
              <SelectTrigger className="w-[180px]"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Statut" /></SelectTrigger>
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
                  <TableHead>Date</TableHead><TableHead>Produit</TableHead><TableHead>Lot</TableHead>
                  <TableHead>Stock Théorique</TableHead><TableHead>Stock Réel</TableHead><TableHead>Écart</TableHead>
                  <TableHead>Raison</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ajustements.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-sm">{format(new Date(a.date_mouvement), 'dd/MM/yyyy HH:mm', { locale: fr })}</TableCell>
                    <TableCell className="font-medium">{a.produit?.libelle_produit || 'N/A'}</TableCell>
                    <TableCell><Badge variant="outline">{a.lot?.numero_lot || 'N/A'}</Badge></TableCell>
                    <TableCell>{a.metadata?.stockTheorique}</TableCell>
                    <TableCell>{a.metadata?.stockReel}</TableCell>
                    <TableCell><span className={a.metadata?.ecart > 0 ? 'text-green-600' : 'text-red-600'}>{a.metadata?.ecart > 0 ? '+' : ''}{a.metadata?.ecart}</span></TableCell>
                    <TableCell>{a.metadata?.raison}</TableCell>
                    <TableCell><div className="flex items-center gap-2">{getStatutIcon(a.metadata?.statut)}{getStatutBadge(a.metadata?.statut)}</div></TableCell>
                    <TableCell>
                      <Sheet open={isDetailSheetOpen && selectedAdjustment?.id === a.id} onOpenChange={(open) => { setIsDetailSheetOpen(open); if (open) setSelectedAdjustment(a); }}>
                        <SheetTrigger asChild><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></SheetTrigger>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {count > 0 ? `Page ${page} / ${totalPages || 1} — ${count} ajustements au total` : 'Aucun ajustement'}
              {isFetching && <span className="ml-2 text-primary">(mise à jour...)</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" /> Précédent
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                Suivant <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {ajustements.length === 0 && !loadingMovements && <div className="text-center py-8 text-muted-foreground">Aucun ajustement trouvé</div>}
          {loadingMovements && <div className="text-center py-8 text-muted-foreground">Chargement des ajustements...</div>}
        </CardContent>
      </Card>

      {/* Detail sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="sm:max-w-[600px]">
          {selectedAdjustment && (
            <>
              <SheetHeader>
                <SheetTitle>Détail de l'Ajustement</SheetTitle>
                <SheetDescription>Ajustement du {format(new Date(selectedAdjustment.date_mouvement), 'dd MMMM yyyy à HH:mm', { locale: fr })}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-sm font-medium text-muted-foreground">Produit</Label><p className="font-medium">{selectedAdjustment.produit?.libelle_produit}</p></div>
                  <div><Label className="text-sm font-medium text-muted-foreground">Lot</Label><p className="font-medium">{selectedAdjustment.lot?.numero_lot}</p></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label className="text-sm font-medium text-muted-foreground">Stock Théorique</Label><p className="text-lg font-semibold">{selectedAdjustment.metadata?.stockTheorique}</p></div>
                  <div><Label className="text-sm font-medium text-muted-foreground">Stock Réel</Label><p className="text-lg font-semibold">{selectedAdjustment.metadata?.stockReel}</p></div>
                  <div><Label className="text-sm font-medium text-muted-foreground">Écart</Label><p className={`text-lg font-semibold ${selectedAdjustment.metadata?.ecart > 0 ? 'text-green-600' : 'text-red-600'}`}>{selectedAdjustment.metadata?.ecart > 0 ? '+' : ''}{selectedAdjustment.metadata?.ecart}</p></div>
                </div>
                <div className="space-y-4">
                  <div><Label className="text-sm font-medium text-muted-foreground">Raison</Label><p className="font-medium">{selectedAdjustment.metadata?.raison}</p></div>
                  {selectedAdjustment.metadata?.commentaire && <div><Label className="text-sm font-medium text-muted-foreground">Commentaire</Label><p className="text-sm">{selectedAdjustment.metadata.commentaire}</p></div>}
                </div>
                <div className="flex items-center gap-2"><Label className="text-sm font-medium text-muted-foreground">Statut:</Label>{getStatutIcon(selectedAdjustment.metadata?.statut)}{getStatutBadge(selectedAdjustment.metadata?.statut)}</div>
              </div>
              <SheetFooter className="mt-6">
                <div className="flex gap-2 w-full">
                  {selectedAdjustment.metadata?.statut === 'en_attente' && (
                    <>
                      <Button variant="outline" className="flex-1" onClick={() => handleUpdateStatus(selectedAdjustment.id, 'valide')}><CheckCircle className="mr-2 h-4 w-4" />Valider</Button>
                      <Button variant="outline" className="flex-1" onClick={() => handleUpdateStatus(selectedAdjustment.id, 'rejete')}><XCircle className="mr-2 h-4 w-4" />Rejeter</Button>
                    </>
                  )}
                  <Button variant="destructive" onClick={() => handleDeleteAdjustment(selectedAdjustment.id)}><Trash2 className="mr-2 h-4 w-4" />Supprimer</Button>
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
