import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock,
  Eye,
  Printer,
  MoreVertical,
  Receipt,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSalesMetricsDB, RecentTransaction } from '@/hooks/useSalesMetricsDB';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/hooks/useTransactionHistory';
import TransactionDetailsModal from '../history/TransactionDetailsModal';
import { printCashReceipt } from '@/utils/salesTicketPrinter';
import { openPdfWithOptions } from '@/utils/printOptions';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { useSalesSettings } from '@/hooks/useSalesSettings';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { toast } from 'sonner';

const RecentTransactions = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [loadingTransactionId, setLoadingTransactionId] = useState<string | null>(null);
  
  const { 
    recentTransactions, 
    totalTransactions, 
    totalTransactionsPages,
    currentTransactionsPage,
    loading 
  } = useSalesMetricsDB(page, limit);
  
  const { formatPrice } = useCurrency();
  const { getPharmacyInfo } = useGlobalSystemSettings();
  const { settings: salesSettings } = useSalesSettings();
  const { receiptSettings } = usePrintSettings();

  const fetchFullTransaction = async (venteId: string): Promise<Transaction | null> => {
    const { data, error } = await supabase
      .from('ventes')
      .select(`
        *,
        client:clients(nom_complet, telephone, email),
        agent:personnel(noms, prenoms),
        caisse:caisses(nom_caisse),
        lignes_ventes(*, produit:produits(libelle_produit))
      `)
      .eq('id', venteId)
      .maybeSingle();

    if (error || !data) {
      console.error('Erreur chargement transaction:', error);
      toast.error('Impossible de charger les détails de la transaction');
      return null;
    }
    return data as unknown as Transaction;
  };

  const handleViewDetails = async (transaction: RecentTransaction) => {
    setLoadingTransactionId(transaction.id);
    const full = await fetchFullTransaction(transaction.id);
    setLoadingTransactionId(null);
    if (full) {
      setSelectedTransaction(full);
      setDetailsModalOpen(true);
    }
  };

  const handlePrint = async (transaction: RecentTransaction) => {
    setLoadingTransactionId(transaction.id);
    try {
      const full = await fetchFullTransaction(transaction.id);
      if (!full) return;

      const pharmacyInfo = getPharmacyInfo();
      const receiptData = {
        vente: {
          numero_vente: full.numero_vente,
          date_vente: full.date_vente,
          montant_total_ht: full.montant_total_ht || 0,
          montant_tva: full.montant_tva || 0,
          montant_total_ttc: full.montant_total_ttc,
          montant_net: full.montant_net,
          montant_paye: full.montant_paye || full.montant_net,
          montant_rendu: full.montant_rendu || 0,
          mode_paiement: full.mode_paiement || 'Espèces',
          remise_globale: full.remise_globale || 0,
        },
        lignesVente: full.lignes_ventes?.map(l => ({
          produit: l.produit?.libelle_produit || 'Produit',
          quantite: l.quantite,
          prix_unitaire: l.prix_unitaire_ttc,
          montant: l.montant_ligne_ttc,
        })) || [],
        client: full.client ? {
          nom: full.client.nom_complet,
          type: 'Client',
        } : undefined,
        pharmacyInfo: {
          name: pharmacyInfo?.name || 'Pharmacie',
          adresse: pharmacyInfo?.address,
          telephone: pharmacyInfo?.telephone_appel || pharmacyInfo?.telephone_whatsapp,
        },
        agentName: full.agent
          ? `${full.agent.prenoms || ''} ${full.agent.noms || ''}`.trim()
          : undefined,
      };
      const printOptions = {
        autoprint: salesSettings.printing.autoprint,
        receiptFooter: salesSettings.printing.receiptFooter,
        printLogo: salesSettings.printing.printLogo,
        includeBarcode: salesSettings.printing.includeBarcode,
        paperSize: salesSettings.printing.paperSize,
        receiptHeaderLines: receiptSettings.headerLines,
        receiptFooterLines: receiptSettings.footerLines,
        showAddress: receiptSettings.showAddress,
        receiptWidth: receiptSettings.receiptWidth,
      };
      const pdfUrl = await printCashReceipt(receiptData, printOptions);
      openPdfWithOptions(pdfUrl, printOptions);
      toast.success('Reçu généré avec succès');
    } catch (error) {
      console.error('Erreur impression:', error);
      toast.error('Erreur lors de la génération du reçu');
    } finally {
      setLoadingTransactionId(null);
    }
  };

  const handleCancel = async (venteId: string) => {
    try {
      const { error } = await supabase
        .from('ventes')
        .update({ statut: 'Annulée' })
        .eq('id', venteId);
      
      if (error) throw error;
      toast.success('Vente annulée avec succès');
    } catch (error) {
      console.error('Erreur annulation:', error);
      toast.error("Erreur lors de l'annulation de la vente");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Transactions Récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPaymentTypeColor = (paymentType: string) => {
    switch (paymentType) {
      case 'Espèces':
        return 'bg-green-100 text-green-800';
      case 'Carte':
        return 'bg-blue-100 text-blue-800';
      case 'Mobile Money':
        return 'bg-purple-100 text-purple-800';
      case 'Assureur':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isLoading = (id: string) => loadingTransactionId === id;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Transactions Récentes
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {totalTransactions} transaction(s) au total
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune transaction récente</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{transaction.invoice_number}</h4>
                      <Badge 
                        variant="outline" 
                        className={getPaymentTypeColor(transaction.payment_type)}
                      >
                        {transaction.payment_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{transaction.customer_name}</span>
                      {transaction.cash_register && (
                        <span className="text-xs">• {transaction.cash_register}</span>
                      )}
                      {transaction.agent_name && (
                        <span className="text-xs">• {transaction.agent_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true, locale: fr })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(transaction.amount)}</p>
                      {transaction.discount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Remise: {formatPrice(transaction.discount)}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={isLoading(transaction.id)}
                        onClick={() => handleViewDetails(transaction)}
                      >
                        {isLoading(transaction.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={isLoading(transaction.id)}
                        onClick={() => handlePrint(transaction)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={isLoading(transaction.id)}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(transaction)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrint(transaction)}>
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimer le reçu
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleCancel(transaction.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Annuler la vente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalTransactionsPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {currentTransactionsPage} sur {totalTransactionsPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalTransactionsPages}
                    onClick={() => setPage(p => Math.min(totalTransactionsPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      <TransactionDetailsModal
        transaction={selectedTransaction}
        open={detailsModalOpen}
        onOpenChange={(open) => {
          setDetailsModalOpen(open);
          if (!open) setSelectedTransaction(null);
        }}
        onCancel={handleCancel}
      />
    </Card>
  );
};

export default RecentTransactions;
