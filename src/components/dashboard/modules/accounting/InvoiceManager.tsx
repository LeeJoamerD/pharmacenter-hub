import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Edit, Trash2, Eye, Send, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { ClientSelector } from '@/components/accounting/ClientSelector';
import { FournisseurSelector } from '@/components/accounting/FournisseurSelector';
import { TransactionSelector, UnbilledSale, UnbilledReception } from '@/components/accounting/TransactionSelector';
import { useInvoiceManager, Invoice, InvoiceLine, CreditNote } from '@/hooks/useInvoiceManager';
import { InvoiceDetailDialog } from '@/components/accounting/InvoiceDetailDialog';
import { InvoicePDFService } from '@/services/InvoicePDFService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const InvoiceManager = () => {
  const { toast } = useToast();
  const {
    invoices,
    creditNotes,
    isLoading,
    isSaving,
    regionalParams,
    formatAmount,
    getDevise,
    getTVARate,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    recordPayment,
    sendReminder,
    createCreditNote,
    searchInvoices,
    getInvoicesByType,
    getOverdueInvoices,
    getUpcomingInvoices,
    getInvoiceStats,
    calculateLineTotals,
  } = useInvoiceManager();

  const [activeTab, setActiveTab] = useState('clients');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [selectedInvoiceForReminder, setSelectedInvoiceForReminder] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNote | null>(null);
  const [showCreditViewDialog, setShowCreditViewDialog] = useState(false);

  const [selectedTransactions, setSelectedTransactions] = useState<{
    sales: UnbilledSale[];
    receptions: UnbilledReception[];
    totals: {
      montant_ht: number;
      montant_tva: number;
      montant_centime_additionnel?: number;
      montant_ttc: number;
    };
  }>({
    sales: [],
    receptions: [],
    totals: { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
  });

  const [newInvoice, setNewInvoice] = useState<Partial<Invoice & { lines: Partial<InvoiceLine>[], vente_ids?: string[], reception_id?: string, reception_ids?: string[] }>>({
    type: 'client',
    date_emission: new Date().toISOString().split('T')[0],
    date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    client_id: '',
    fournisseur_id: '',
    libelle: '',
    montant_ht: 0,
    montant_tva: 0,
    montant_ttc: 0,
    statut: 'brouillon',
    statut_paiement: 'impayee',
    montant_paye: 0,
    montant_restant: 0,
    pieces_jointes: [],
    relances_effectuees: 0,
    lines: []
  });

  // Handle transaction selection from TransactionSelector
  const handleTransactionSelection = useCallback((
    selected: UnbilledSale[] | UnbilledReception[],
    totals: { montant_ht: number; montant_tva: number; montant_centime_additionnel?: number; montant_ttc: number }
  ) => {
    if (newInvoice.type === 'client') {
      const sales = selected as UnbilledSale[];
      setSelectedTransactions({
        sales,
        receptions: [],
        totals
      });
      
      // Auto-fill invoice amounts and generate lines from selected sales
      const lines: Partial<InvoiceLine>[] = sales.map(sale => ({
        id: sale.id,
        designation: `Vente ${sale.numero_vente}`,
        quantite: 1,
        prix_unitaire: sale.montant_total_ht,
        taux_tva: sale.montant_total_ht > 0 ? (sale.montant_tva / sale.montant_total_ht) * 100 : 0,
        montant_ht: sale.montant_total_ht,
        montant_tva: sale.montant_tva,
        montant_ttc: sale.montant_total_ttc,
      }));

      setNewInvoice(prev => ({
        ...prev,
        montant_ht: totals.montant_ht,
        montant_tva: totals.montant_tva,
        montant_ttc: totals.montant_ttc,
        montant_restant: totals.montant_ttc,
        lines,
        vente_ids: sales.map(s => s.id),
        libelle: sales.length > 0 
          ? `Facture pour ${sales.length} vente(s): ${sales.map(s => s.numero_vente).join(', ')}`
          : prev.libelle,
      }));
    } else {
      const receptions = selected as UnbilledReception[];
      setSelectedTransactions({
        sales: [],
        receptions,
        totals
      });

      // Auto-fill invoice amounts for supplier invoice - generate one line per reception
      if (receptions.length > 0) {
        const lines: Partial<InvoiceLine>[] = receptions.map(reception => ({
          id: reception.id,
          designation: `Réception ${reception.numero_reception || reception.reference_facture || ''}`,
          quantite: 1,
          prix_unitaire: reception.montant_ht,
          taux_tva: reception.montant_ht > 0 ? (reception.montant_tva / reception.montant_ht) * 100 : 0,
          montant_ht: reception.montant_ht,
          montant_tva: reception.montant_tva + (reception.montant_centime_additionnel || 0),
          montant_ttc: reception.montant_ttc,
        }));

        const receptionIds = receptions.map(r => r.id);
        const receptionRefs = receptions.map(r => r.numero_reception || r.reference_facture || '').filter(Boolean);

        setNewInvoice(prev => ({
          ...prev,
          montant_ht: totals.montant_ht,
          montant_tva: totals.montant_tva + (totals.montant_centime_additionnel || 0),
          montant_ttc: totals.montant_ttc,
          montant_restant: totals.montant_ttc,
          lines,
          reception_id: receptionIds[0], // Keep first for backward compatibility
          reception_ids: receptionIds, // Store all reception IDs
          libelle: `Facture fournisseur - ${receptions.length} réception(s): ${receptionRefs.join(', ')}`,
        }));
      } else {
        setNewInvoice(prev => ({
          ...prev,
          montant_ht: 0,
          montant_tva: 0,
          montant_ttc: 0,
          montant_restant: 0,
          lines: [],
          reception_id: undefined,
          reception_ids: [],
        }));
      }
    }
  }, [newInvoice.type]);

  const [newLine, setNewLine] = useState<Partial<InvoiceLine>>({
    designation: '',
    quantite: 1,
    prix_unitaire: 0,
    taux_tva: 0,
  });

  const [paymentData, setPaymentData] = useState({
    montant: 0,
    mode_paiement: 'Espèces',
    reference_paiement: '',
    notes: '',
  });

  const [reminderData, setReminderData] = useState({
    type_relance: 'email' as 'email' | 'sms' | 'telephone' | 'courrier',
    message: '',
    destinataire: '',
  });

  const [newCreditNote, setNewCreditNote] = useState<Partial<CreditNote>>({
    facture_origine_id: '',
    motif: '',
    montant_ht: 0,
    montant_tva: 0,
    montant_ttc: 0,
  });

  // Handler pour visualiser une facture
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewDialog(true);
  };

  // Handler pour télécharger une facture en PDF
  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      const { data: lines } = await supabase
        .from('lignes_facture')
        .select('*')
        .eq('facture_id', invoice.id);

      const { url, filename } = await InvoicePDFService.generateInvoicePDF(
        invoice,
        (lines as InvoiceLine[]) || [],
        regionalParams
      );
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Téléchargement",
        description: `Facture ${invoice.numero} téléchargée avec succès`
      });
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la facture",
        variant: "destructive"
      });
    }
  };

  // Handler pour visualiser un avoir
  const handleViewCreditNote = (credit: CreditNote) => {
    setSelectedCreditNote(credit);
    setShowCreditViewDialog(true);
  };

  // Handler pour télécharger un avoir
  const handleDownloadCreditNote = async (credit: CreditNote) => {
    try {
      // Create a simplified invoice-like structure for the credit note
      const creditInvoice: Invoice = {
        id: credit.id,
        numero: credit.numero,
        type: 'client',
        date_emission: credit.date_emission,
        date_echeance: credit.date_emission,
        libelle: `Avoir - ${credit.motif}`,
        montant_ht: credit.montant_ht,
        montant_tva: credit.montant_tva,
        montant_ttc: credit.montant_ttc,
        statut: credit.statut === 'applique' || credit.statut === 'emis' ? 'emise' : credit.statut === 'annule' ? 'annulee' : 'brouillon',
        statut_paiement: 'payee',
        montant_paye: credit.montant_ttc,
        montant_restant: 0,
        tenant_id: credit.tenant_id,
        created_at: credit.created_at,
        updated_at: credit.updated_at,
        relances_effectuees: 0,
        pieces_jointes: [],
      };

      const { url, filename } = await InvoicePDFService.generateInvoicePDF(
        creditInvoice,
        [],
        regionalParams
      );
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `avoir-${credit.numero}.html`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Téléchargement",
        description: `Avoir ${credit.numero} téléchargé avec succès`
      });
    } catch (error: any) {
      console.error('Error downloading credit note:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger l'avoir",
        variant: "destructive"
      });
    }
  };

  const filteredInvoices = (type: 'client' | 'fournisseur') => {
    let filtered = getInvoicesByType(type);
    
    if (searchTerm) {
      filtered = searchInvoices(searchTerm, type);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.statut === statusFilter);
    }
    
    return filtered;
  };

  const addLineToInvoice = () => {
    if (!newLine.designation || !newLine.quantite || newLine.prix_unitaire === undefined) {
      return;
    }

    const totals = calculateLineTotals(newLine);
    const line: Partial<InvoiceLine> = {
      id: Date.now().toString(),
      ...newLine,
      ...totals
    };

    const updatedLines = [...(newInvoice.lines || []), line];
    const invoiceTotals = {
      montant_ht: updatedLines.reduce((sum, l) => sum + (l.montant_ht || 0), 0),
      montant_tva: updatedLines.reduce((sum, l) => sum + (l.montant_tva || 0), 0),
      montant_ttc: updatedLines.reduce((sum, l) => sum + (l.montant_ttc || 0), 0),
    };

    setNewInvoice(prev => ({
      ...prev,
      lines: updatedLines,
      ...invoiceTotals,
      montant_restant: invoiceTotals.montant_ttc
    }));

    setNewLine({
      designation: '',
      quantite: 1,
      prix_unitaire: 0,
      taux_tva: 0,
    });
  };

  const removeLineFromInvoice = (lineId: string) => {
    const updatedLines = (newInvoice.lines || []).filter(line => line.id !== lineId);
    const invoiceTotals = {
      montant_ht: updatedLines.reduce((sum, l) => sum + (l.montant_ht || 0), 0),
      montant_tva: updatedLines.reduce((sum, l) => sum + (l.montant_tva || 0), 0),
      montant_ttc: updatedLines.reduce((sum, l) => sum + (l.montant_ttc || 0), 0),
    };

    // Update reception_ids to match remaining lines (for supplier invoices)
    const updatedReceptionIds = (newInvoice.reception_ids || []).filter(id => id !== lineId);
    
    // Update libelle based on remaining lines
    const remainingRefs = updatedLines.map(l => {
      const designation = l.designation || '';
      const match = designation.match(/Réception\s+(.+)/);
      return match ? match[1] : '';
    }).filter(Boolean);

    const updatedLibelle = updatedLines.length > 0
      ? `Facture fournisseur - ${updatedLines.length} réception(s): ${remainingRefs.join(', ')}`
      : '';

    setNewInvoice(prev => ({
      ...prev,
      lines: updatedLines,
      ...invoiceTotals,
      montant_restant: invoiceTotals.montant_ttc,
      reception_ids: updatedReceptionIds,
      reception_id: updatedReceptionIds[0] || undefined,
      libelle: prev.type === 'fournisseur' ? updatedLibelle : prev.libelle,
    }));
  };

  const handleSaveInvoice = () => {
    if (!newInvoice.libelle || !newInvoice.lines?.length) {
      return;
    }

    if (newInvoice.type === 'client' && !newInvoice.client_id) {
      return;
    }

    if (newInvoice.type === 'fournisseur' && !newInvoice.fournisseur_id) {
      return;
    }

    const invoiceData = {
      ...newInvoice,
      lines: newInvoice.lines || [],
    };

    createInvoice(invoiceData as any);
    setShowInvoiceDialog(false);
    resetInvoiceForm();
  };

  const resetInvoiceForm = () => {
    setNewInvoice({
      type: 'client',
      date_emission: new Date().toISOString().split('T')[0],
      date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      client_id: '',
      fournisseur_id: '',
      libelle: '',
      montant_ht: 0,
      montant_tva: 0,
      montant_ttc: 0,
      statut: 'brouillon',
      statut_paiement: 'impayee',
      montant_paye: 0,
      montant_restant: 0,
      pieces_jointes: [],
      relances_effectuees: 0,
      lines: [],
      vente_ids: undefined,
      reception_id: undefined,
    });
    setNewLine({
      designation: '',
      quantite: 1,
      prix_unitaire: 0,
      taux_tva: 0,
    });
    setSelectedTransactions({
      sales: [],
      receptions: [],
      totals: { montant_ht: 0, montant_tva: 0, montant_ttc: 0 }
    });
  };

  const handleRecordPayment = () => {
    if (!selectedInvoiceForPayment || !paymentData.montant) {
      return;
    }

    recordPayment({
      facture_id: selectedInvoiceForPayment.id,
      date_paiement: new Date().toISOString().split('T')[0],
      ...paymentData,
    });

    setShowPaymentDialog(false);
    setSelectedInvoiceForPayment(null);
    setPaymentData({
      montant: 0,
      mode_paiement: 'Espèces',
      reference_paiement: '',
      notes: '',
    });
  };

  const handleSendReminder = () => {
    if (!selectedInvoiceForReminder) {
      return;
    }

    sendReminder({
      facture_id: selectedInvoiceForReminder.id,
      date_relance: new Date().toISOString().split('T')[0],
      ...reminderData,
    });

    setShowReminderDialog(false);
    setSelectedInvoiceForReminder(null);
    setReminderData({
      type_relance: 'email',
      message: '',
      destinataire: '',
    });
  };

  const handleCreateCreditNote = () => {
    if (!newCreditNote.facture_origine_id || !newCreditNote.motif || !newCreditNote.montant_ttc) {
      return;
    }

    createCreditNote({
      ...newCreditNote,
      date_emission: new Date().toISOString().split('T')[0],
      statut: 'brouillon',
    } as any);

    setShowCreditDialog(false);
    setNewCreditNote({
      facture_origine_id: '',
      motif: '',
      montant_ht: 0,
      montant_tva: 0,
      montant_ttc: 0,
    });
  };

  const getStatusBadge = (status: string, type: 'status' | 'payment' = 'status') => {
    if (type === 'payment') {
      switch (status) {
        case 'impayee':
          return <Badge variant="destructive">Impayée</Badge>;
        case 'partielle':
          return <Badge variant="secondary">Partielle</Badge>;
        case 'payee':
          return <Badge variant="default">Payée</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    }

    switch (status) {
      case 'brouillon':
      case 'Brouillon':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'emise':
      case 'Validé':
        return <Badge variant="default">Émise</Badge>;
      case 'partiellement_payee':
        return <Badge variant="secondary">Partiellement payée</Badge>;
      case 'payee':
        return <Badge variant="default">Payée</Badge>;
      case 'en_retard':
        return <Badge variant="destructive">En retard</Badge>;
      case 'annulee':
      case 'Verrouillé':
        return <Badge variant="outline">Annulée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const clientStats = getInvoiceStats('client');
  const fournisseurStats = getInvoiceStats('fournisseur');

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Gestion des Factures</h2>
          {regionalParams && (
            <div className="flex gap-2">
              <Badge variant="outline">{regionalParams.pays}</Badge>
              <Badge variant="secondary">{regionalParams.devise_principale}</Badge>
              <Badge variant="outline">{regionalParams.libelle_tva} {regionalParams.taux_tva_standard}%</Badge>
            </div>
          )}
        </div>
        <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
          <DialogTrigger asChild>
            <Button disabled={isSaving}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Facture
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle facture</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type de facture</Label>
                  <Select 
                    value={newInvoice.type} 
                    onValueChange={(value: 'client' | 'fournisseur') => setNewInvoice(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Facture Client</SelectItem>
                      <SelectItem value="fournisseur">Facture Fournisseur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>
                    {newInvoice.type === 'client' ? 'Client' : 'Fournisseur'}
                  </Label>
                  {newInvoice.type === 'client' ? (
                    <ClientSelector
                      value={newInvoice.client_id || ''}
                      onChange={(value) => setNewInvoice(prev => ({ ...prev, client_id: value }))}
                    />
                  ) : (
                    <FournisseurSelector
                      value={newInvoice.fournisseur_id || ''}
                      onChange={(value) => setNewInvoice(prev => ({ ...prev, fournisseur_id: value }))}
                    />
                  )}
                </div>
              </div>

              {/* Transaction Selector - shows unbilled sales/receptions */}
              <TransactionSelector
                type={newInvoice.type || 'client'}
                clientId={newInvoice.client_id || undefined}
                fournisseurId={newInvoice.fournisseur_id || undefined}
                onSelectionChange={handleTransactionSelection}
                selectedIds={newInvoice.type === 'fournisseur' ? newInvoice.reception_ids : newInvoice.vente_ids}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date d'émission</Label>
                  <Input
                    type="date"
                    value={newInvoice.date_emission}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, date_emission: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Date d'échéance</Label>
                  <Input
                    type="date"
                    value={newInvoice.date_echeance}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, date_echeance: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Libellé</Label>
                <Input
                  value={newInvoice.libelle}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, libelle: e.target.value }))}
                  placeholder="Description de la facture"
                />
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-4">Lignes de facture</h4>
                
                <div className="grid grid-cols-6 gap-2 mb-4">
                  <Input
                    placeholder="Désignation"
                    value={newLine.designation}
                    onChange={(e) => setNewLine(prev => ({ ...prev, designation: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Qté"
                    value={newLine.quantite || ''}
                    onChange={(e) => setNewLine(prev => ({ ...prev, quantite: parseInt(e.target.value) || 0 }))}
                  />
                  <Input
                    type="number"
                    placeholder="Prix unit."
                    value={newLine.prix_unitaire || ''}
                    onChange={(e) => setNewLine(prev => ({ ...prev, prix_unitaire: parseFloat(e.target.value) || 0 }))}
                  />
                  <Input
                    type="number"
                    placeholder="TVA %"
                    value={newLine.taux_tva || getTVARate()}
                    onChange={(e) => setNewLine(prev => ({ ...prev, taux_tva: parseFloat(e.target.value) || getTVARate() }))}
                  />
                  <div className="text-sm text-muted-foreground self-center">
                    {((newLine.quantite || 0) * (newLine.prix_unitaire || 0)).toLocaleString()}
                  </div>
                  <Button onClick={addLineToInvoice} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {newInvoice.lines && newInvoice.lines.length > 0 && (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Désignation</TableHead>
                          <TableHead>Qté</TableHead>
                          <TableHead>Prix Unit.</TableHead>
                          <TableHead>TVA</TableHead>
                          <TableHead>Total HT</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newInvoice.lines.map(line => (
                          <TableRow key={line.id}>
                            <TableCell>{line.designation}</TableCell>
                            <TableCell>{line.quantite}</TableCell>
                            <TableCell>{line.prix_unitaire?.toLocaleString()}</TableCell>
                            <TableCell>{line.taux_tva}%</TableCell>
                            <TableCell>{line.montant_ht?.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeLineFromInvoice(line.id!)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>Total HT: <span className="font-medium">{(newInvoice.montant_ht || 0).toLocaleString()}</span></div>
                        <div>TVA: <span className="font-medium">{(newInvoice.montant_tva || 0).toLocaleString()}</span></div>
                        <div>Total TTC: <span className="font-medium">{(newInvoice.montant_ttc || 0).toLocaleString()}</span></div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveInvoice} disabled={isSaving}>
                Créer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="clients">Factures Clients</TabsTrigger>
          <TabsTrigger value="fournisseurs">Factures Fournisseurs</TabsTrigger>
          <TabsTrigger value="avoirs">Avoirs</TabsTrigger>
          <TabsTrigger value="relances">Relances</TabsTrigger>
        </TabsList>

        {/* Factures Clients */}
        <TabsContent value="clients" className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une facture..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="emise">Émise</SelectItem>
                <SelectItem value="partiellement_payee">Partiellement payée</SelectItem>
                <SelectItem value="payee">Payée</SelectItem>
                <SelectItem value="en_retard">En retard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Créances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clientStats.totalCreances.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">{getDevise()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">En Retard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {clientStats.countOverdue}
                </div>
                <p className="text-xs text-muted-foreground">Factures</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Payées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {clientStats.countPaid}
                </div>
                <p className="text-xs text-muted-foreground">Factures</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Montant Moyen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(clientStats.averageAmount).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">{getDevise()}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Montant TTC</TableHead>
                    <TableHead>Payé</TableHead>
                    <TableHead>Restant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices('client').map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.numero}</TableCell>
                      <TableCell>{invoice.client_fournisseur}</TableCell>
                      <TableCell>{new Date(invoice.date_emission).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.date_echeance).toLocaleDateString()}</TableCell>
                      <TableCell>{invoice.montant_ttc.toLocaleString()}</TableCell>
                      <TableCell>{invoice.montant_paye.toLocaleString()}</TableCell>
                      <TableCell>{invoice.montant_restant.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(invoice.statut)}
                          {getStatusBadge(invoice.statut_paiement, 'payment')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(invoice)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(invoice)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.statut_paiement !== 'payee' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedInvoiceForReminder(invoice);
                                  setReminderData(prev => ({ ...prev, destinataire: invoice.client_telephone || invoice.client_email || '' }));
                                  setShowReminderDialog(true);
                                }}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedInvoiceForPayment(invoice);
                                  setPaymentData(prev => ({ ...prev, montant: invoice.montant_restant }));
                                  setShowPaymentDialog(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Factures Fournisseurs */}
        <TabsContent value="fournisseurs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Dettes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {fournisseurStats.totalCreances.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">À Payer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {fournisseurStats.countUnpaid}
                </div>
                <p className="text-xs text-muted-foreground">Factures</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Échues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {fournisseurStats.countOverdue}
                </div>
                <p className="text-xs text-muted-foreground">Factures</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Payées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {fournisseurStats.countPaid}
                </div>
                <p className="text-xs text-muted-foreground">Factures</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Montant TTC</TableHead>
                    <TableHead>Payé</TableHead>
                    <TableHead>Restant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices('fournisseur').map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.numero}</TableCell>
                      <TableCell>{invoice.client_fournisseur}</TableCell>
                      <TableCell>{new Date(invoice.date_emission).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.date_echeance).toLocaleDateString()}</TableCell>
                      <TableCell>{invoice.montant_ttc.toLocaleString()}</TableCell>
                      <TableCell>{invoice.montant_paye.toLocaleString()}</TableCell>
                      <TableCell>{invoice.montant_restant.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(invoice.statut)}
                          {getStatusBadge(invoice.statut_paiement, 'payment')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(invoice)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(invoice)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.statut_paiement !== 'payee' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedInvoiceForPayment(invoice);
                                setPaymentData(prev => ({ ...prev, montant: invoice.montant_restant }));
                                setShowPaymentDialog(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Avoirs */}
        <TabsContent value="avoirs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Notes de crédit et avoirs</h3>
            <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel Avoir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un avoir</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label>Facture d'origine</Label>
                    <Select 
                      value={newCreditNote.facture_origine_id} 
                      onValueChange={(value) => setNewCreditNote(prev => ({ ...prev, facture_origine_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une facture" />
                      </SelectTrigger>
                      <SelectContent>
                        {getInvoicesByType('client').map(invoice => (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.numero} - {invoice.client_fournisseur}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Motif de l'avoir</Label>
                    <Textarea
                      value={newCreditNote.motif}
                      onChange={(e) => setNewCreditNote(prev => ({ ...prev, motif: e.target.value }))}
                      placeholder="Raison de la création de l'avoir"
                    />
                  </div>
                  <div>
                    <Label>Montant TTC</Label>
                    <Input
                      type="number"
                      value={newCreditNote.montant_ttc || ''}
                      onChange={(e) => {
                        const montant = parseFloat(e.target.value) || 0;
                        setNewCreditNote(prev => ({ 
                          ...prev, 
                          montant_ttc: montant,
                          montant_ht: montant,
                          montant_tva: 0
                        }));
                      }}
                      placeholder="Montant de l'avoir"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreditDialog(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateCreditNote} disabled={isSaving}>
                    Créer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Avoir</TableHead>
                    <TableHead>Facture origine</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditNotes.map(credit => {
                    const originInvoice = invoices.find(inv => inv.id === credit.facture_origine_id);
                    return (
                      <TableRow key={credit.id}>
                        <TableCell className="font-medium">{credit.numero}</TableCell>
                        <TableCell>{originInvoice?.numero}</TableCell>
                        <TableCell>{new Date(credit.date_emission).toLocaleDateString()}</TableCell>
                        <TableCell>{credit.motif}</TableCell>
                        <TableCell>{credit.montant_ttc.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(credit.statut)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewCreditNote(credit)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadCreditNote(credit)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relances */}
        <TabsContent value="relances" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span>Factures en retard</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getOverdueInvoices('client').map(invoice => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{invoice.numero}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.client_fournisseur} - {invoice.montant_restant.toLocaleString()} FCFA
                        </div>
                        <div className="text-xs text-red-600">
                          Échue depuis {invoice.jours_retard} jours
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setSelectedInvoiceForReminder(invoice);
                            setReminderData(prev => ({ ...prev, destinataire: invoice.client_email || invoice.client_telephone || '' }));
                            setShowReminderDialog(true);
                          }}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Relancer
                        </Button>
                      </div>
                    </div>
                  ))}
                  {getOverdueInvoices('client').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune facture en retard
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span>Échéances prochaines</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getUpcomingInvoices(7, 'client').map(invoice => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{invoice.numero}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.client_fournisseur} - {invoice.montant_restant.toLocaleString()} FCFA
                        </div>
                        <div className="text-xs text-orange-600">
                          Échéance dans {invoice.jours_avant_echeance} jours
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline"
                          size="sm" 
                          onClick={() => {
                            setSelectedInvoiceForReminder(invoice);
                            setReminderData(prev => ({ ...prev, destinataire: invoice.client_email || invoice.client_telephone || '' }));
                            setShowReminderDialog(true);
                          }}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Prérelance
                        </Button>
                      </div>
                    </div>
                  ))}
                  {getUpcomingInvoices(7, 'client').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune échéance proche
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Montant payé</Label>
              <Input
                type="number"
                value={paymentData.montant}
                onChange={(e) => setPaymentData(prev => ({ ...prev, montant: parseFloat(e.target.value) || 0 }))}
                placeholder="Montant du paiement"
              />
            </div>
            <div>
              <Label>Mode de paiement</Label>
              <Select 
                value={paymentData.mode_paiement} 
                onValueChange={(value) => setPaymentData(prev => ({ ...prev, mode_paiement: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Espèces">Espèces</SelectItem>
                  <SelectItem value="Chèque">Chèque</SelectItem>
                  <SelectItem value="Virement">Virement</SelectItem>
                  <SelectItem value="Carte bancaire">Carte bancaire</SelectItem>
                  <SelectItem value="Mobile money">Mobile money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Référence paiement (optionnel)</Label>
              <Input
                value={paymentData.reference_paiement}
                onChange={(e) => setPaymentData(prev => ({ ...prev, reference_paiement: e.target.value }))}
                placeholder="Numéro chèque, référence..."
              />
            </div>
            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes supplémentaires"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleRecordPayment} disabled={isSaving}>
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer une relance</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Type de relance</Label>
              <Select 
                value={reminderData.type_relance} 
                onValueChange={(value: any) => setReminderData(prev => ({ ...prev, type_relance: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="telephone">Téléphone</SelectItem>
                  <SelectItem value="courrier">Courrier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Destinataire</Label>
              <Input
                value={reminderData.destinataire}
                onChange={(e) => setReminderData(prev => ({ ...prev, destinataire: e.target.value }))}
                placeholder="Email ou téléphone"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={reminderData.message}
                onChange={(e) => setReminderData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Message de la relance"
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowReminderDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSendReminder} disabled={isSaving}>
              Envoyer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de visualisation de facture */}
      <InvoiceDetailDialog
        invoice={selectedInvoice}
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
      />

      {/* Dialog de visualisation d'avoir */}
      {selectedCreditNote && (
        <Dialog open={showCreditViewDialog} onOpenChange={setShowCreditViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Avoir {selectedCreditNote.numero}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Facture d'origine</Label>
                  <p className="font-medium">
                    {invoices.find(inv => inv.id === selectedCreditNote.facture_origine_id)?.numero || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date d'émission</Label>
                  <p className="font-medium">{new Date(selectedCreditNote.date_emission).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Motif</Label>
                <p className="font-medium">{selectedCreditNote.motif}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Montant HT</Label>
                  <p className="font-medium">{selectedCreditNote.montant_ht.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">TVA</Label>
                  <p className="font-medium">{selectedCreditNote.montant_tva.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Montant TTC</Label>
                  <p className="font-bold text-lg">{selectedCreditNote.montant_ttc.toLocaleString()} FCFA</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Statut</Label>
                <div className="mt-1">{getStatusBadge(selectedCreditNote.statut)}</div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreditViewDialog(false)}>
                  Fermer
                </Button>
                <Button onClick={() => handleDownloadCreditNote(selectedCreditNote)}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default InvoiceManager;
