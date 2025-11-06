import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  Minus,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2
} from 'lucide-react';
import { useReturnsExchanges } from '@/hooks/useReturnsExchanges';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import ReturnStatisticsCards from './returns/ReturnStatisticsCards';
import ReturnFiltersPanel from './returns/ReturnFiltersPanel';
import ReturnDetailsModal from './returns/ReturnDetailsModal';
import ReturnApprovalDialog from './returns/ReturnApprovalDialog';
import ReturnProcessDialog from './returns/ReturnProcessDialog';

interface ReturnItem {
  id: string;
  productId: string;
  name: string;
  originalQuantity: number;
  returnQuantity: number;
  unitPrice: number;
  reason: string;
  condition: 'Parfait' | 'Endommagé' | 'Expiré' | 'Non conforme';
  refundAmount: number;
}

const ReturnsExchangesConnected = () => {
  const { currentUser } = useTenant();
  const {
    returns,
    returnsLoading,
    totalReturns,
    filters,
    updateFilters,
    pagination,
    changePage,
    searchOriginalTransaction,
    calculateRefundAmount,
    createReturn,
    validateReturn,
    processReturn,
    statistics,
    exportToExcel,
    exportToPDF,
  } = useReturnsExchanges();

  // États locaux
  const [activeTab, setActiveTab] = useState('new-return');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États modals
  const [selectedReturnForDetails, setSelectedReturnForDetails] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    returnId: string | null;
    returnNumber: string;
    action: 'approve' | 'reject' | null;
  }>({ open: false, returnId: null, returnNumber: '', action: null });
  const [processDialog, setProcessDialog] = useState<{
    open: boolean;
    returnId: string | null;
    returnNumber: string;
  }>({ open: false, returnId: null, returnNumber: '' });

  const returnReasons = [
    'Produit défectueux',
    'Erreur de commande',
    'Produit expiré',
    'Changement d\'avis',
    'Effet indésirable',
    'Ordonnance modifiée',
    'Autre'
  ];

  const handleTransactionSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Veuillez entrer un numéro de transaction');
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchOriginalTransaction(searchTerm);
      
      if (results && results.length > 0) {
        const transaction = results[0];
        setSelectedTransaction(transaction);
        
        // Initialiser les articles pour le retour
        const items: ReturnItem[] = ((transaction as any).lignes_ventes || []).map((ligne: any) => ({
          id: ligne.id,
          productId: ligne.produit_id,
          name: ligne.produit?.libelle_produit || 'Produit',
          originalQuantity: ligne.quantite,
          returnQuantity: 0,
          unitPrice: ligne.prix_unitaire_ttc,
          reason: '',
          condition: 'Parfait' as const,
          refundAmount: 0
        }));
        setReturnItems(items);
        toast.success('Transaction trouvée');
      } else {
        toast.error('Transaction introuvable');
        setSelectedTransaction(null);
        setReturnItems([]);
      }
    } catch (error: any) {
      toast.error('Erreur lors de la recherche: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const updateReturnItem = (itemId: string, field: keyof ReturnItem, value: any) => {
    setReturnItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        
        // Recalculer le montant de remboursement
        if (field === 'returnQuantity' || field === 'condition') {
          let refundRate = 1;
          if (updated.condition === 'Endommagé') refundRate = 0.5;
          if (updated.condition === 'Expiré' || updated.condition === 'Non conforme') refundRate = 0;
          
          updated.refundAmount = updated.returnQuantity * updated.unitPrice * refundRate;
        }
        return updated;
      }
      return item;
    }));
  };

  const getTotalRefund = () => {
    return returnItems.reduce((sum, item) => sum + item.refundAmount, 0);
  };

  const handleSubmitReturn = async () => {
    const validItems = returnItems.filter(item => item.returnQuantity > 0);
    
    if (validItems.length === 0) {
      toast.error('Veuillez sélectionner au moins un article à retourner');
      return;
    }

    if (!returnReason) {
      toast.error('Veuillez indiquer la raison du retour');
      return;
    }

    if (validItems.some(item => !item.reason.trim())) {
      toast.error('Veuillez indiquer un motif pour chaque article');
      return;
    }

    setIsSubmitting(true);
    try {
      await createReturn({
        vente_origine_id: selectedTransaction.id,
        numero_vente_origine: selectedTransaction.numero_vente,
        client_id: selectedTransaction.client_id,
        type_operation: 'Retour',
        motif_retour: returnReason,
        notes: returnNotes || undefined,
        lignes: validItems.map(item => ({
          produit_id: item.productId,
          lot_id: undefined,
          quantite_retournee: item.returnQuantity,
          prix_unitaire: item.unitPrice,
          montant_ligne: item.refundAmount,
          etat_produit: item.condition,
          taux_remboursement: item.condition === 'Parfait' ? 100 : item.condition === 'Endommagé' ? 50 : 0,
          motif_ligne: item.reason,
          remis_en_stock: false
        }))
      });

      // Reset du formulaire
      setSelectedTransaction(null);
      setReturnItems([]);
      setReturnReason('');
      setReturnNotes('');
      setSearchTerm('');
      
      toast.success('Demande de retour créée avec succès');
    } catch (error: any) {
      toast.error('Erreur: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproval = async (returnId: string, decision: 'Approuvé' | 'Rejeté', notes?: string) => {
    try {
      await validateReturn({
        id: returnId,
        decision,
        validatorId: currentUser?.id || ''
      });
      toast.success(`Retour ${decision.toLowerCase()}`);
    } catch (error: any) {
      toast.error('Erreur: ' + error.message);
      throw error;
    }
  };

  const handleProcess = async (returnId: string) => {
    try {
      await processReturn(returnId);
      toast.success('Retour traité avec succès');
    } catch (error: any) {
      toast.error('Erreur: ' + error.message);
      throw error;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'En attente': 'secondary',
      'Approuvé': 'default',
      'Rejeté': 'destructive',
      'Terminé': 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const getConditionBadge = (condition: string) => {
    const variants = {
      'Parfait': 'default',
      'Endommagé': 'secondary',
      'Expiré': 'destructive',
      'Non conforme': 'destructive'
    } as const;

    return (
      <Badge variant={variants[condition as keyof typeof variants] || 'outline'} className="text-xs">
        {condition}
      </Badge>
    );
  };

  const pendingReturns = returns.filter(r => r.statut === 'En attente');

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <ReturnStatisticsCards statistics={statistics} isLoading={returnsLoading} />

      {/* Contenu principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="new-return">Nouveau Retour</TabsTrigger>
          <TabsTrigger value="pending-returns">
            Retours en Attente
            {pendingReturns.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingReturns.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* Nouveau Retour */}
        <TabsContent value="new-return" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nouveau Retour/Échange</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recherche de transaction */}
              <div className="space-y-4">
                <Label htmlFor="transaction-search">Rechercher la transaction originale</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="transaction-search"
                      placeholder="Numéro de référence ou nom du client..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleTransactionSearch()}
                      className="pl-10"
                      disabled={isSearching}
                    />
                  </div>
                  <Button onClick={handleTransactionSearch} disabled={isSearching}>
                    {isSearching ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Recherche...</>
                    ) : (
                      <><Search className="h-4 w-4 mr-1" /> Rechercher</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Transaction trouvée */}
              {selectedTransaction && (
                <div className="space-y-4">
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg">Transaction Trouvée</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-sm font-medium">Référence</Label>
                          <p className="text-sm">{selectedTransaction.numero_vente}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Date</Label>
                          <p className="text-sm">
                            {new Date(selectedTransaction.date_vente).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Client</Label>
                          <p className="text-sm">{selectedTransaction.client?.nom_complet || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Total</Label>
                          <p className="text-sm font-bold">
                            {selectedTransaction.montant_net.toLocaleString('fr-FR')} FCFA
                          </p>
                        </div>
                      </div>

                      {/* Articles de la transaction */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Articles à retourner</Label>
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Article</TableHead>
                                <TableHead>Qté Originale</TableHead>
                                <TableHead>Qté à Retourner</TableHead>
                                <TableHead>État</TableHead>
                                <TableHead>Raison</TableHead>
                                <TableHead>Remboursement</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {returnItems.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.name}</TableCell>
                                  <TableCell>{item.originalQuantity}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateReturnItem(item.id, 'returnQuantity', Math.max(0, item.returnQuantity - 1))}
                                        disabled={item.returnQuantity <= 0}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="w-8 text-center">{item.returnQuantity}</span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateReturnItem(item.id, 'returnQuantity', Math.min(item.originalQuantity, item.returnQuantity + 1))}
                                        disabled={item.returnQuantity >= item.originalQuantity}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Select 
                                      value={item.condition}
                                      onValueChange={(value: any) => updateReturnItem(item.id, 'condition', value)}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Parfait">Parfait</SelectItem>
                                        <SelectItem value="Endommagé">Endommagé</SelectItem>
                                        <SelectItem value="Expiré">Expiré</SelectItem>
                                        <SelectItem value="Non conforme">Non conforme</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Select 
                                      value={item.reason}
                                      onValueChange={(value) => updateReturnItem(item.id, 'reason', value)}
                                    >
                                      <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Sélectionner..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {returnReasons.map(reason => (
                                          <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-medium text-primary">
                                      {item.refundAmount.toLocaleString('fr-FR')} FCFA
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Raison générale et notes */}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="return-reason">Raison principale du retour</Label>
                          <Select value={returnReason} onValueChange={setReturnReason}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une raison..." />
                            </SelectTrigger>
                            <SelectContent>
                              {returnReasons.map(reason => (
                                <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="return-notes">Notes additionnelles</Label>
                          <Textarea
                            id="return-notes"
                            placeholder="Détails supplémentaires..."
                            value={returnNotes}
                            onChange={(e) => setReturnNotes(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Total remboursement */}
                      <div className="flex justify-between items-center mt-6 pt-4 border-t">
                        <span className="text-lg font-medium">Total à rembourser:</span>
                        <span className="text-2xl font-bold text-primary">
                          {getTotalRefund().toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-6">
                        <Button onClick={handleSubmitReturn} className="flex-1" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Soumission...</>
                          ) : (
                            <><CheckCircle className="h-4 w-4 mr-1" /> Soumettre la Demande</>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedTransaction(null);
                            setReturnItems([]);
                            setSearchTerm('');
                          }}
                          disabled={isSubmitting}
                        >
                          Annuler
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retours en attente */}
        <TabsContent value="pending-returns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retours en Attente d'Approbation</CardTitle>
            </CardHeader>
            <CardContent>
              {returnsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pendingReturns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun retour en attente
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingReturns.map((returnRequest) => (
                    <Card key={returnRequest.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-medium">Retour #{returnRequest.numero_retour}</h4>
                            <p className="text-sm text-muted-foreground">
                              Transaction: {returnRequest.numero_vente_origine}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(returnRequest.statut)}
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(returnRequest.date_retour).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label className="text-sm font-medium">Client</Label>
                            <p className="text-sm">{(returnRequest as any).client?.nom_complet || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Raison</Label>
                            <p className="text-sm">{returnRequest.motif_retour}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Montant</Label>
                            <p className="text-sm font-bold text-primary">
                              {returnRequest.montant_rembourse.toLocaleString('fr-FR')} FCFA
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => setApprovalDialog({
                              open: true,
                              returnId: returnRequest.id,
                              returnNumber: returnRequest.numero_retour,
                              action: 'approve'
                            })}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approuver
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => setApprovalDialog({
                              open: true,
                              returnId: returnRequest.id,
                              returnNumber: returnRequest.numero_retour,
                              action: 'reject'
                            })}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeter
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedReturnForDetails(returnRequest);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique */}
        <TabsContent value="history" className="space-y-4">
          {/* Filtres */}
          <ReturnFiltersPanel filters={filters} onFilterChange={updateFilters} />

          {/* Actions d'export */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Historique des Retours & Échanges</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportToExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToPDF}>
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {returnsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : returns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun retour trouvé
                </div>
              ) : (
                <>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID Retour</TableHead>
                          <TableHead>Transaction</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {returns.map((returnRequest) => (
                          <TableRow key={returnRequest.id}>
                            <TableCell className="font-medium">{returnRequest.numero_retour}</TableCell>
                            <TableCell>{returnRequest.numero_vente_origine}</TableCell>
                            <TableCell>{(returnRequest as any).client?.nom_complet || 'N/A'}</TableCell>
                            <TableCell>
                              {new Date(returnRequest.date_retour).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell className="font-medium text-primary">
                              {returnRequest.montant_rembourse.toLocaleString('fr-FR')} FCFA
                            </TableCell>
                            <TableCell>{getStatusBadge(returnRequest.statut)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReturnForDetails(returnRequest);
                                    setShowDetailsModal(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {returnRequest.statut === 'Approuvé' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setProcessDialog({
                                      open: true,
                                      returnId: returnRequest.id,
                                      returnNumber: returnRequest.numero_retour
                                    })}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalReturns > pagination.pageSize && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Affichage de {(pagination.page - 1) * pagination.pageSize + 1} à{' '}
                        {Math.min(pagination.page * pagination.pageSize, totalReturns)} sur {totalReturns} retours
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => changePage(pagination.page - 1)}
                          disabled={pagination.page === 1}
                        >
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => changePage(pagination.page + 1)}
                          disabled={pagination.page * pagination.pageSize >= totalReturns}
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ReturnDetailsModal
        returnData={selectedReturnForDetails}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />

      <ReturnApprovalDialog
        returnId={approvalDialog.returnId}
        returnNumber={approvalDialog.returnNumber}
        action={approvalDialog.action}
        open={approvalDialog.open}
        onOpenChange={(open) => setApprovalDialog({ ...approvalDialog, open })}
        onConfirm={handleApproval}
      />

      <ReturnProcessDialog
        returnId={processDialog.returnId}
        returnNumber={processDialog.returnNumber}
        open={processDialog.open}
        onOpenChange={(open) => setProcessDialog({ ...processDialog, open })}
        onConfirm={handleProcess}
      />
    </div>
  );
};

export default ReturnsExchangesConnected;
