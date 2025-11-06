import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Eye, 
  Printer, 
  Download, 
  Send,
  DollarSign,
  Bell
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useInvoiceManager, Invoice } from '@/hooks/useInvoiceManager';
import { InvoiceStatisticsCards } from './invoice/InvoiceStatisticsCards';
import { InvoiceFiltersPanel } from './invoice/InvoiceFiltersPanel';
import { InvoiceFormDialog } from './invoice/InvoiceFormDialog';
import { InvoicePaymentDialog } from './invoice/InvoicePaymentDialog';
import { InvoiceReminderDialog } from './invoice/InvoiceReminderDialog';
import { InvoiceDetailDialog } from '@/components/accounting/InvoiceDetailDialog';
import { InvoicePDFService } from '@/services/InvoicePDFService';
import { supabase } from '@/integrations/supabase/client';

const InvoiceModuleConnected = () => {
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  
  const {
    invoices,
    isLoading,
    isSaving,
    regionalParams,
    getTVARate,
    createInvoice,
    updateInvoice,
    recordPayment,
    sendReminder,
    searchInvoices,
    getInvoicesByType,
    getOverdueInvoices,
  } = useInvoiceManager();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);

  const statusColors = {
    brouillon: 'bg-secondary text-secondary-foreground',
    emise: 'bg-primary text-primary-foreground',
    payee: 'bg-green-100 text-green-700',
    en_retard: 'bg-red-100 text-red-700',
    annulee: 'bg-muted text-muted-foreground'
  };

  const statusLabels = {
    brouillon: 'Brouillon',
    emise: 'Émise',
    payee: 'Payée',
    en_retard: 'En retard',
    annulee: 'Annulée'
  };

  // Filtrage des factures clients
  const clientInvoices = getInvoicesByType('client');
  
  const filteredInvoices = clientInvoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.libelle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || invoice.statut === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calcul des statistiques
  const totalInvoices = clientInvoices.length;
  const totalAmount = clientInvoices.reduce((sum, invoice) => sum + (invoice.montant_ttc || 0), 0);
  const paidInvoices = clientInvoices.filter(inv => inv.statut_paiement === 'payee').length;
  const overdueInvoices = getOverdueInvoices().filter(inv => inv.type === 'client').length;

  const handleCreateInvoice = async (data: any) => {
    await createInvoice(data);
    setIsCreateDialogOpen(false);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    await updateInvoice(invoiceId, { statut: newStatus as any });
    toast({
      title: "Statut mis à jour",
      description: `Le statut de la facture a été mis à jour.`
    });
  };

  const handlePrintInvoice = async (invoice: Invoice) => {
    try {
      const { data: lines } = await supabase
        .from('lignes_facture')
        .select('*')
        .eq('facture_id', invoice.id);

      const { url } = await InvoicePDFService.generateInvoicePDF(
        invoice,
        lines || [],
        regionalParams
      );
      
      window.open(url, '_blank');
      
      toast({
        title: "Impression",
        description: `Ouverture de la facture ${invoice.numero}...`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'imprimer la facture",
        variant: "destructive"
      });
    }
  };

  const handleExportInvoice = async (invoice: Invoice) => {
    try {
      const { data: lines } = await supabase
        .from('lignes_facture')
        .select('*')
        .eq('facture_id', invoice.id);

      const { url, filename } = await InvoicePDFService.generateInvoicePDF(
        invoice,
        lines || [],
        regionalParams
      );
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      toast({
        title: "Export",
        description: `Téléchargement de ${filename}...`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter la facture",
        variant: "destructive"
      });
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    await handleStatusChange(invoice.id, 'emise');
    toast({
      title: "Facture envoyée",
      description: `La facture ${invoice.numero} a été marquée comme envoyée.`
    });
  };

  const handlePayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
  };

  const handleRecordPayment = async (paymentData: any) => {
    if (!selectedInvoice) return;
    
    await recordPayment({
      facture_id: selectedInvoice.id,
      date_paiement: new Date().toISOString().split('T')[0],
      ...paymentData,
    });
    
    setIsPaymentDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handleReminder = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsReminderDialogOpen(true);
  };

  const handleSendReminder = async (reminderData: any) => {
    if (!selectedInvoice) return;
    
    await sendReminder({
      facture_id: selectedInvoice.id,
      date_relance: new Date().toISOString().split('T')[0],
      ...reminderData,
    });
    
    setIsReminderDialogOpen(false);
    setSelectedInvoice(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Chargement des factures...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Facturation</h2>
          <p className="text-muted-foreground">
            Gestion complète des factures et de la facturation
          </p>
        </div>
        
        <Button onClick={() => setIsCreateDialogOpen(true)} disabled={isSaving}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Facture
        </Button>
      </div>

      {/* Métriques */}
      <InvoiceStatisticsCards
        totalInvoices={totalInvoices}
        totalAmount={totalAmount}
        paidInvoices={paidInvoices}
        overdueInvoices={overdueInvoices}
      />

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Factures</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceFiltersPanel
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucune facture trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.numero}</TableCell>
                    <TableCell>{invoice.client_nom}</TableCell>
                    <TableCell>{new Date(invoice.date_emission).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{new Date(invoice.date_echeance).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{formatPrice(invoice.montant_ttc)}</TableCell>
                    <TableCell>
                      <Select
                        value={invoice.statut}
                        onValueChange={(value) => handleStatusChange(invoice.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <Badge className={statusColors[invoice.statut as keyof typeof statusColors]}>
                            {statusLabels[invoice.statut as keyof typeof statusLabels]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="brouillon">Brouillon</SelectItem>
                          <SelectItem value="emise">Émise</SelectItem>
                          <SelectItem value="payee">Payée</SelectItem>
                          <SelectItem value="en_retard">En retard</SelectItem>
                          <SelectItem value="annulee">Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintInvoice(invoice)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportInvoice(invoice)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {invoice.statut === 'brouillon' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendInvoice(invoice)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        {invoice.statut_paiement !== 'payee' && invoice.statut !== 'brouillon' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePayment(invoice)}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                        {invoice.jours_retard && invoice.jours_retard > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReminder(invoice)}
                          >
                            <Bell className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <InvoiceFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateInvoice}
        tvaRate={getTVARate()}
      />

      <InvoiceDetailDialog
        invoice={selectedInvoice}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />

      <InvoicePaymentDialog
        invoice={selectedInvoice}
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        onSubmit={handleRecordPayment}
      />

      <InvoiceReminderDialog
        invoice={selectedInvoice}
        open={isReminderDialogOpen}
        onOpenChange={setIsReminderDialogOpen}
        onSubmit={handleSendReminder}
      />
    </div>
  );
};

export default InvoiceModuleConnected;
