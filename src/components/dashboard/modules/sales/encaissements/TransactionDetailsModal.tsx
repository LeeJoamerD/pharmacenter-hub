import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, Package, Calendar, AlertTriangle, ChevronDown, Receipt, CreditCard } from 'lucide-react';
import { TransactionDetails } from '@/hooks/useEncaissements';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { format, isBefore, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { printSalesTicket, printCashReceipt } from '@/utils/salesTicketPrinter';
import { openPdfWithOptions } from '@/utils/printOptions';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { useSalesSettings } from '@/hooks/useSalesSettings';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { toast } from 'sonner';

interface TransactionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
  onFetchDetails: (id: string) => Promise<TransactionDetails | null>;
}

const TransactionDetailsModal = ({
  open,
  onOpenChange,
  transactionId,
  onFetchDetails,
}: TransactionDetailsModalProps) => {
  const [details, setDetails] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && transactionId) {
      setLoading(true);
      onFetchDetails(transactionId)
        .then((data) => {
          setDetails(data);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setDetails(null);
    }
  }, [open, transactionId, onFetchDetails]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      Finalisée: 'default',
      Validée: 'default',
      'En attente': 'secondary',
      Annulée: 'destructive',
      Remboursée: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-CG', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  };

  const { formatAmount } = useCurrencyFormatting();
  const formatCurrency = (amount: number) => formatAmount(amount);

  // Helpers pour les dates de péremption (comme dans ShoppingCartComponent)
  const isExpiringSoon = (date: string | null): boolean => {
    if (!date) return false;
    return isBefore(new Date(date), addDays(new Date(), 30)) && !isExpired(date);
  };

  const isExpired = (date: string | null): boolean => {
    if (!date) return false;
    return isBefore(new Date(date), new Date());
  };

  const buildPrintContext = () => {
    const pharmacyInfo = getPharmacyInfo();
    const clientPayload = details?.client ? {
      nom: details.client.nom_complet,
      type: details.client.type_client || 'Client',
    } : undefined;
    const pharmacyPayload = {
      name: pharmacyInfo?.name || 'Pharmacie',
      adresse: pharmacyInfo?.address,
      telephone: pharmacyInfo?.telephone_appel || pharmacyInfo?.telephone_whatsapp,
    };
    const agentName = details?.agent
      ? `${details.agent.prenoms || ''} ${details.agent.noms || ''}`.trim()
      : undefined;
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
      printHeaderEnabled: printSettings.headerEnabled,
      printHeaderText: printSettings.headerText,
      printFooterEnabled: printSettings.footerEnabled,
      printFooterText: printSettings.footerText,
    };
    return { clientPayload, pharmacyPayload, agentName, printOptions };
  };

  const handlePrintSalesTicket = async () => {
    if (!details) return;
    try {
      const { clientPayload, pharmacyPayload, agentName, printOptions } = buildPrintContext();
      const ticketData = {
        vente: {
          numero_vente: details.numero_vente,
          date_vente: details.date_vente,
          montant_total_ht: details.montant_total_ht || 0,
          montant_tva: details.montant_tva || 0,
          montant_total_ttc: (details as any).montant_total_ttc ?? details.montant_net,
          montant_net: details.montant_net,
          remise_globale: details.montant_remise || 0,
        },
        lignes: details.lignes_ventes.map(l => ({
          produit: { libelle_produit: l.produit.libelle_produit },
          quantite: l.quantite,
          prix_unitaire_ttc: l.prix_unitaire,
          montant_ligne_ttc: l.montant_ligne,
          numero_lot: l.numero_lot || undefined,
          date_peremption: l.date_peremption_lot || undefined,
        })),
        client: clientPayload,
        pharmacyInfo: pharmacyPayload,
        agentName,
      };
      const pdfUrl = await printSalesTicket(ticketData, printOptions);
      openPdfWithOptions(pdfUrl, printOptions);
      toast.success('Ticket de vente généré avec succès');
    } catch (error) {
      console.error('Erreur impression ticket:', error);
      toast.error('Erreur lors de la génération du ticket');
    }
  };

  const handlePrintCashReceipt = async () => {
    if (!details) return;
    try {
      const { clientPayload, pharmacyPayload, agentName, printOptions } = buildPrintContext();
      const receiptData = {
        vente: {
          numero_vente: details.numero_vente,
          date_vente: details.date_vente,
          montant_total_ht: details.montant_total_ht || 0,
          montant_tva: details.montant_tva || 0,
          montant_total_ttc: (details as any).montant_total_ttc ?? details.montant_net,
          montant_net: details.montant_net,
          montant_paye: (details as any).montant_paye ?? details.montant_net,
          montant_rendu: (details as any).montant_rendu ?? 0,
          mode_paiement: details.mode_paiement || 'Espèces',
          remise_globale: details.montant_remise || 0,
        },
        client: clientPayload,
        pharmacyInfo: pharmacyPayload,
        agentName,
      };
      const pdfUrl = await printCashReceipt(receiptData, printOptions);
      openPdfWithOptions(pdfUrl, printOptions);
      toast.success('Reçu de caisse généré avec succès');
    } catch (error) {
      console.error('Erreur impression reçu:', error);
      toast.error('Erreur lors de la génération du reçu');
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chargement des détails...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!details) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Détails de la Transaction</DialogTitle>
              <DialogDescription>
                Vente N° {details.numero_vente} • {formatDate(details.date_vente)}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-1" />
                    Imprimer
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handlePrintSalesTicket}>
                    <Receipt className="h-4 w-4 mr-2" />
                    Ticket de vente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrintCashReceipt}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Reçu de caisse
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Exporter
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations Générales */}
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <div className="mt-1">{getStatusBadge(details.statut)}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mode de Paiement</p>
              <p className="font-medium">{details.mode_paiement}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Caisse</p>
              <p className="font-medium">{details.caisse?.nom || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Session</p>
              <p className="font-medium">{details.session_caisse?.numero_session || 'N/A'}</p>
            </div>
            {details.reference_paiement && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Référence Paiement</p>
                <p className="font-medium">{details.reference_paiement}</p>
              </div>
            )}
          </div>

          {/* Client */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-3">Client</h3>
            {details.client ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-medium">{details.client.nom_complet}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{details.client.telephone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="outline">{details.client.type_client}</Badge>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Client Ordinaire</p>
            )}
          </div>

          {/* Caissier */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-3">Caissier</h3>
            {details.agent ? (
              <p className="font-medium">
                {details.agent.prenoms} {details.agent.noms}
              </p>
            ) : (
              <p className="text-muted-foreground">N/A</p>
            )}
          </div>

          {/* Articles */}
          <div className="border rounded-lg overflow-hidden">
            <div className="p-4 bg-muted">
              <h3 className="font-semibold">Articles Vendus ({details.lignes_ventes.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Produit</th>
                    <th className="text-left p-3 text-sm font-medium">Lot / Péremption</th>
                    <th className="text-right p-3 text-sm font-medium">Quantité</th>
                    <th className="text-right p-3 text-sm font-medium">Prix Unitaire</th>
                    <th className="text-right p-3 text-sm font-medium">Remise</th>
                    <th className="text-right p-3 text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {details.lignes_ventes.map((ligne) => (
                    <tr key={ligne.id} className="border-t">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{ligne.produit.libelle_produit}</p>
                          <p className="text-xs text-muted-foreground">{ligne.produit.code_cip || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        {ligne.numero_lot ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="text-xs w-fit">
                              <Package className="h-3 w-3 mr-1" />
                              {ligne.numero_lot}
                            </Badge>
                            {ligne.date_peremption_lot && (
                              <Badge 
                                variant={isExpired(ligne.date_peremption_lot) ? "destructive" : "outline"}
                                className={cn(
                                  "text-xs w-fit",
                                  isExpiringSoon(ligne.date_peremption_lot) && "border-warning text-warning bg-warning/10"
                                )}
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(ligne.date_peremption_lot), 'dd/MM/yyyy', { locale: fr })}
                                {isExpiringSoon(ligne.date_peremption_lot) && (
                                  <AlertTriangle className="h-3 w-3 ml-1" />
                                )}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right">{ligne.quantite}</td>
                      <td className="p-3 text-right">{formatCurrency(ligne.prix_unitaire)}</td>
                      <td className="p-3 text-right text-destructive">
                        -{formatCurrency(ligne.montant_remise || 0)}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(ligne.montant_ligne)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux */}
          <div className="p-4 border rounded-lg bg-muted/20">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant HT</span>
                <span className="font-medium">{formatCurrency(details.montant_total_ht)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA</span>
                <span className="font-medium">{formatCurrency(details.montant_tva)}</span>
              </div>
              {details.montant_remise > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Remise</span>
                  <span className="font-medium">-{formatCurrency(details.montant_remise)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Montant Net</span>
                <span className="font-bold text-primary">
                  {formatCurrency(details.montant_net)}
                </span>
              </div>
              {details.mode_paiement === 'Assurance' && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Part Assurance</span>
                    <span className="font-medium">
                      {formatCurrency(details.montant_part_assurance || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Part Patient</span>
                    <span className="font-medium">
                      {formatCurrency(details.montant_part_patient || 0)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailsModal;
