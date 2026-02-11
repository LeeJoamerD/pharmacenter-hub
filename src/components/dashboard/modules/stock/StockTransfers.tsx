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
  Plus, ArrowRightLeft, Package, CheckCircle, XCircle, Clock,
  Search, Filter, Eye, Truck, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { useMovementsPaginated } from '@/hooks/useMovementsPaginated';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

function StockTransfers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState<string>('tous');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { products } = useProducts();
  const { tenantId } = useTenant();

  // Server-side paginated query
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
    type_mouvement: 'transfert',
  });

  const [formData, setFormData] = useState({
    produit_id: '', lot_id: '', quantite: 0, origine: '', destination: '', motif: '', commentaire: ''
  });

  // Lots filtered by product for form
  const { data: availableLots = [] } = useQuery({
    queryKey: ['lots-for-transfer', tenantId, formData.produit_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lots')
        .select('id, produit_id, numero_lot, quantite_restante')
        .eq('tenant_id', tenantId!)
        .eq('produit_id', formData.produit_id)
        .gt('quantite_restante', 0)
        .order('date_peremption', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId && !!formData.produit_id,
  });

  const generateTransferNumber = () => {
    const d = new Date();
    return `TRF${d.getFullYear().toString().slice(-2)}${(d.getMonth()+1).toString().padStart(2,'0')}${Date.now().toString().slice(-4)}`;
  };

  // Filter by status client-side (metadata)
  const transferts = useMemo(() => {
    if (!movementsData) return [];
    return movementsData
      .filter((m: any) => m.metadata?.origine)
      .filter((m: any) => selectedStatut === 'tous' || m.metadata?.statut === selectedStatut);
  }, [movementsData, selectedStatut]);

  const statusCounts = useMemo(() => {
    const all = movementsData.filter((m: any) => m.metadata?.origine);
    return {
      en_transit: all.filter((m: any) => m.metadata?.statut === 'en_transit').length,
      en_cours: all.filter((m: any) => m.metadata?.statut === 'en_cours').length,
      recu: all.filter((m: any) => m.metadata?.statut === 'recu').length,
    };
  }, [movementsData]);

  const getStatutIcon = (s: string) => {
    switch (s) {
      case 'recu': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'annule': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'en_transit': return <Truck className="h-4 w-4 text-blue-600" />;
      case 'en_cours': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatutBadge = (s: string) => {
    const colors: Record<string,string> = { recu: 'bg-green-100 text-green-800', annule: 'bg-red-100 text-red-800', en_transit: 'bg-blue-100 text-blue-800', en_cours: 'bg-yellow-100 text-yellow-800' };
    const labels: Record<string,string> = { recu: 'Reçu', annule: 'Annulé', en_transit: 'En transit', en_cours: 'En cours' };
    return <Badge className={colors[s] || 'bg-gray-100 text-gray-800'}>{labels[s] || s}</Badge>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.produit_id || !formData.lot_id || !formData.quantite || !formData.origine || !formData.destination || !formData.motif) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" }); return;
    }
    if (formData.origine === formData.destination) {
      toast({ title: "Erreur", description: "L'origine et la destination doivent être différentes", variant: "destructive" }); return;
    }
    try {
      const numero = generateTransferNumber();
      const metadata = { numero, origine: formData.origine, destination: formData.destination, motif: formData.motif, commentaire: formData.commentaire, statut: 'en_cours' };
      const { error } = await supabase.rpc('rpc_stock_record_movement', {
        p_lot_id: formData.lot_id, p_produit_id: formData.produit_id,
        p_type_mouvement: 'transfert', p_quantite_mouvement: formData.quantite,
        p_reference_type: 'transfert', p_reference_document: numero,
        p_emplacement_source: formData.origine, p_emplacement_destination: formData.destination,
        p_motif: formData.motif, p_metadata: metadata
      });
      if (error) throw error;
      toast({ title: "Transfert créé", description: `Le transfert ${numero} a été créé` });
      setIsDialogOpen(false);
      setFormData({ produit_id: '', lot_id: '', quantite: 0, origine: '', destination: '', motif: '', commentaire: '' });
      refetchMovements();
      queryClient.invalidateQueries({ queryKey: ['lots'] });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateStatus = async (movementId: string, newStatus: string) => {
    try {
      const movement = movementsData.find((m: any) => m.id === movementId);
      if (!movement) return;
      const { data, error } = await supabase.rpc('rpc_stock_update_movement', {
        p_movement_id: movementId, p_metadata: { ...movement.metadata, statut: newStatus }
      });
      if (error) throw error;
      const rpcResult = data as any;
      if (!rpcResult?.success) throw new Error(rpcResult?.error || 'Échec de la mise à jour');
      
      if (selectedTransfer?.id === movementId) {
        setSelectedTransfer({ ...selectedTransfer, metadata: { ...selectedTransfer.metadata, statut: newStatus } });
      }
      
      toast({ title: "Statut mis à jour", description: `Transfert mis à jour vers "${newStatus}"` });
      refetchMovements();
      queryClient.invalidateQueries({ queryKey: ['lots'] });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm font-medium text-muted-foreground">Total Transferts</p><p className="text-2xl font-bold">{stats.transferts}</p></div><ArrowRightLeft className="h-8 w-8 text-muted-foreground" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm font-medium text-muted-foreground">En Transit</p><p className="text-2xl font-bold text-blue-600">{statusCounts.en_transit}</p></div><Truck className="h-8 w-8 text-blue-600" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm font-medium text-muted-foreground">En Cours</p><p className="text-2xl font-bold text-yellow-600">{statusCounts.en_cours}</p></div><Clock className="h-8 w-8 text-yellow-600" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm font-medium text-muted-foreground">Terminés</p><p className="text-2xl font-bold text-green-600">{statusCounts.recu}</p></div><CheckCircle className="h-8 w-8 text-green-600" /></CardContent></Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle>Transferts de Stock</CardTitle><CardDescription>Gestion des mouvements entre sites et succursales</CardDescription></div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nouveau Transfert</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader><DialogTitle>Créer un Transfert de Stock</DialogTitle><DialogDescription>Transférez des produits entre différents sites</DialogDescription></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Produit *</Label>
                      <Select value={formData.produit_id} onValueChange={(v) => setFormData({...formData, produit_id: v, lot_id: ''})}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                        <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.libelle_produit}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Lot *</Label>
                      <Select value={formData.lot_id} onValueChange={(v) => setFormData({...formData, lot_id: v})} disabled={!formData.produit_id}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                        <SelectContent>{availableLots.map(l => <SelectItem key={l.id} value={l.id}>{l.numero_lot} (Stock: {l.quantite_restante})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Quantité *</Label><Input type="number" value={formData.quantite.toString()} onChange={(e) => setFormData({...formData, quantite: parseInt(e.target.value) || 0})} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Site d'origine *</Label>
                      <Select value={formData.origine} onValueChange={(v) => setFormData({...formData, origine: v})}>
                        <SelectTrigger><SelectValue placeholder="Site d'origine" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pharmacie_centrale">Pharmacie Centrale</SelectItem>
                          <SelectItem value="succursale_a">Succursale A</SelectItem>
                          <SelectItem value="succursale_b">Succursale B</SelectItem>
                          <SelectItem value="entrepot">Entrepôt Principal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Site de destination *</Label>
                      <Select value={formData.destination} onValueChange={(v) => setFormData({...formData, destination: v})}>
                        <SelectTrigger><SelectValue placeholder="Site de destination" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pharmacie_centrale">Pharmacie Centrale</SelectItem>
                          <SelectItem value="succursale_a">Succursale A</SelectItem>
                          <SelectItem value="succursale_b">Succursale B</SelectItem>
                          <SelectItem value="entrepot">Entrepôt Principal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Motif *</Label>
                    <Select value={formData.motif} onValueChange={(v) => setFormData({...formData, motif: v})}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner un motif" /></SelectTrigger>
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
                  <div className="space-y-2"><Label>Commentaire</Label><Textarea value={formData.commentaire} onChange={(e) => setFormData({...formData, commentaire: e.target.value})} /></div>
                  <DialogFooter><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button><Button type="submit">Créer le Transfert</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher transfert, produit, site..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div></div>
            <Select value={selectedStatut} onValueChange={setSelectedStatut}>
              <SelectTrigger className="w-[180px]"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Statut" /></SelectTrigger>
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
              <TableHeader><TableRow>
                <TableHead>N° Transfert</TableHead><TableHead>Date</TableHead><TableHead>Produit</TableHead>
                <TableHead>Lot</TableHead><TableHead>Quantité</TableHead><TableHead>Origine</TableHead>
                <TableHead>Destination</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {transferts.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.metadata?.numero}</TableCell>
                    <TableCell className="font-mono text-sm">{format(new Date(t.date_mouvement), 'dd/MM/yyyy HH:mm', { locale: fr })}</TableCell>
                    <TableCell>{t.produit?.libelle_produit || 'N/A'}</TableCell>
                    <TableCell><Badge variant="outline">{t.lot?.numero_lot || 'N/A'}</Badge></TableCell>
                    <TableCell>{t.quantite_mouvement}</TableCell>
                    <TableCell>{t.metadata?.origine}</TableCell>
                    <TableCell>{t.metadata?.destination}</TableCell>
                    <TableCell><div className="flex items-center gap-2">{getStatutIcon(t.metadata?.statut)}{getStatutBadge(t.metadata?.statut)}</div></TableCell>
                    <TableCell>
                      <Sheet open={isDetailSheetOpen && selectedTransfer?.id === t.id} onOpenChange={(open) => { setIsDetailSheetOpen(open); if (open) setSelectedTransfer(t); }}>
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
              {count > 0 ? `Page ${page} / ${totalPages || 1} — ${count} transferts au total` : 'Aucun transfert'}
              {isFetching && <span className="ml-2 text-primary">(mise à jour...)</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /> Précédent</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Suivant <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          {transferts.length === 0 && !loadingMovements && <div className="text-center py-8 text-muted-foreground">Aucun transfert trouvé</div>}
          {loadingMovements && <div className="text-center py-8 text-muted-foreground">Chargement des transferts...</div>}
        </CardContent>
      </Card>

      {/* Detail sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="sm:max-w-[600px]">
          {selectedTransfer && (
            <>
              <SheetHeader>
                <SheetTitle>Détail du Transfert - {selectedTransfer.metadata?.numero}</SheetTitle>
                <SheetDescription>Transfert créé le {format(new Date(selectedTransfer.date_mouvement), 'dd MMMM yyyy à HH:mm', { locale: fr })}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-sm font-medium text-muted-foreground">Produit</Label><p className="font-medium">{selectedTransfer.produit?.libelle_produit}</p></div>
                  <div><Label className="text-sm font-medium text-muted-foreground">Lot</Label><p className="font-medium">{selectedTransfer.lot?.numero_lot}</p></div>
                </div>
                <div><Label className="text-sm font-medium text-muted-foreground">Quantité transférée</Label><p className="text-lg font-semibold">{selectedTransfer.quantite_mouvement}</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-sm font-medium text-muted-foreground">Origine</Label><p className="font-medium">{selectedTransfer.metadata?.origine}</p></div>
                  <div><Label className="text-sm font-medium text-muted-foreground">Destination</Label><p className="font-medium">{selectedTransfer.metadata?.destination}</p></div>
                </div>
                <div className="space-y-4">
                  <div><Label className="text-sm font-medium text-muted-foreground">Motif</Label><p className="font-medium">{selectedTransfer.metadata?.motif}</p></div>
                  {selectedTransfer.metadata?.commentaire && <div><Label className="text-sm font-medium text-muted-foreground">Commentaire</Label><p className="text-sm">{selectedTransfer.metadata.commentaire}</p></div>}
                </div>
                <div className="flex items-center gap-2"><Label className="text-sm font-medium text-muted-foreground">Statut:</Label>{getStatutIcon(selectedTransfer.metadata?.statut)}{getStatutBadge(selectedTransfer.metadata?.statut)}</div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Changer le statut</Label>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTransfer.metadata?.statut === 'en_cours' && <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedTransfer.id, 'en_transit')}><Truck className="mr-2 h-4 w-4" />Marquer en transit</Button>}
                    {selectedTransfer.metadata?.statut === 'en_transit' && <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedTransfer.id, 'recu')}><CheckCircle className="mr-2 h-4 w-4" />Marquer comme reçu</Button>}
                    {['en_cours', 'en_transit'].includes(selectedTransfer.metadata?.statut) && <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedTransfer.id, 'annule')}><XCircle className="mr-2 h-4 w-4" />Annuler</Button>}
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
