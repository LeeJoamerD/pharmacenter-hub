/**
 * Composant Encaissement (Mode Séparé)
 * Gère uniquement l'encaissement des ventes en attente
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Banknote, 
  CreditCard, 
  Smartphone, 
  Search,
  AlertCircle,
  CheckCircle,
  Printer,
  Loader2,
  Receipt,
  ShoppingCart
} from 'lucide-react';
import { usePOSData } from '@/hooks/usePOSData';
import { useCashSession } from '@/hooks/useCashSession';
import { usePendingTransactions, PendingTransaction } from '@/hooks/usePendingTransactions';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { setupBarcodeScanner } from '@/utils/barcodeScanner';
import { printCashReceipt } from '@/utils/salesTicketPrinter';

const CashRegisterInterface = () => {
  const { tenantId, currentUser } = useTenant();
  const { toast } = useToast();
  const { getPharmacyInfo } = useGlobalSystemSettings();
  const { formatAmount } = useCurrencyFormatting();
  
  const { processPayment } = usePOSData();
  const { activeSession, hasActiveSession, isLoading: sessionLoading } = useCashSession();
  const { 
    pendingTransactions, 
    isLoading: loadingTransactions, 
    refetch: refetchPending,
    searchByInvoiceNumber 
  } = usePendingTransactions(activeSession?.id);

  // États
  const [searchInput, setSearchInput] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<PendingTransaction | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(true);
  
  // États paiement
  const [paymentMethod, setPaymentMethod] = useState<'Espèces' | 'Carte Bancaire' | 'Mobile Money'>('Espèces');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [paymentReference, setPaymentReference] = useState('');

  // Scanner de codes-barres pour rechercher une transaction
  useEffect(() => {
    const cleanup = setupBarcodeScanner(async (barcode) => {
      await handleSearch(barcode);
    }, { minLength: 8, maxLength: 30, timeout: 100 });
    return cleanup;
  }, []);

  // Recherche de transaction
  const handleSearch = async (searchValue?: string) => {
    const value = searchValue || searchInput;
    if (!value.trim()) return;

    setIsSearching(true);
    try {
      const transaction = await searchByInvoiceNumber(value.trim());
      if (transaction) {
        setSelectedTransaction(transaction);
        setAmountReceived(transaction.montant_net);
        toast({ title: "Transaction trouvée", description: `Ticket ${transaction.numero_vente}` });
      } else {
        toast({ title: "Transaction non trouvée", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  // Sélection depuis la liste
  const handleSelectFromList = (transaction: PendingTransaction) => {
    setSelectedTransaction(transaction);
    setAmountReceived(transaction.montant_net);
    setSearchInput(transaction.numero_vente);
  };

  // Calcul du rendu
  const calculateChange = useCallback(() => {
    if (!selectedTransaction) return 0;
    return Math.max(0, amountReceived - selectedTransaction.montant_net);
  }, [selectedTransaction, amountReceived]);

  // Confirmer le paiement
  const handleConfirmPayment = async () => {
    if (!selectedTransaction || !activeSession) return;

    if (paymentMethod === 'Espèces' && amountReceived < selectedTransaction.montant_net) {
      toast({ title: "Montant insuffisant", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processPayment(
        selectedTransaction.id,
        {
          method: paymentMethod,
          amount_received: amountReceived,
          change: calculateChange(),
          reference: paymentReference || undefined
        },
        activeSession.id,
        currentUser?.id
      );

      if (result.success) {
        toast({ title: "Paiement confirmé", description: `Vente ${selectedTransaction.numero_vente} encaissée` });

        // Impression automatique du reçu
        if (autoPrintReceipt) {
          try {
            const pharmacyInfo = getPharmacyInfo();
            const receiptData = {
              vente: {
                numero_vente: selectedTransaction.numero_vente,
                date_vente: selectedTransaction.date_vente,
                montant_net: selectedTransaction.montant_net,
                montant_paye: amountReceived,
                montant_rendu: calculateChange(),
                mode_paiement: paymentMethod
              },
              pharmacyInfo: {
                name: pharmacyInfo.name,
                adresse: pharmacyInfo.address,
                telephone: pharmacyInfo.telephone_appel || pharmacyInfo.telephone_whatsapp
              },
              agentName: currentUser?.prenoms && currentUser?.noms 
                ? `${currentUser.prenoms} ${currentUser.noms}` 
                : 'Caissier'
            };

            const pdfUrl = await printCashReceipt(receiptData);
            const printWindow = window.open(pdfUrl, '_blank');
            if (printWindow) {
              printWindow.onload = () => printWindow.print();
            }

            toast({ title: "Reçu imprimé" });
          } catch (printError) {
            console.error('Erreur impression:', printError);
          }
        }

        // Reset
        setSelectedTransaction(null);
        setSearchInput('');
        setAmountReceived(0);
        setPaymentReference('');
        refetchPending();
      } else {
        throw new Error(result.error || 'Erreur lors de l\'encaissement');
      }
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // Pas de session active
  if (!sessionLoading && !hasActiveSession) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center gap-2 justify-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Session Caisse Fermée
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Vous devez ouvrir une session de caisse pour effectuer des encaissements.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Section Gauche - Recherche et Liste */}
      <div className="flex-1 space-y-6">
        {/* Info session */}
        {activeSession && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Session active</p>
                  <p className="font-medium">{activeSession.numero_session}</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ouverte
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recherche */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Rechercher une transaction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Scanner ou saisir le numéro de vente..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={() => handleSearch()} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="autoPrintReceipt"
                checked={autoPrintReceipt}
                onCheckedChange={setAutoPrintReceipt}
              />
              <Label htmlFor="autoPrintReceipt" className="flex items-center gap-1">
                <Printer className="h-4 w-4" />
                Impression auto du reçu
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Liste des transactions en attente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Ventes en attente
              </span>
              <Badge variant="secondary">{pendingTransactions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTransactions ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : pendingTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Aucune vente en attente d'encaissement
              </p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {pendingTransactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedTransaction?.id === transaction.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleSelectFromList(transaction)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{transaction.numero_vente}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.date_vente).toLocaleString('fr-CG')}
                          </p>
                          {transaction.client && (
                            <p className="text-xs text-muted-foreground">
                              Client: {transaction.client.nom_complet}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{formatAmount(transaction.montant_net)}</p>
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            En attente
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section Droite - Détails et Paiement */}
      <div className="w-full lg:w-[450px] space-y-6">
        {selectedTransaction ? (
          <>
            {/* Panier de la transaction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Détail - {selectedTransaction.numero_vente}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {selectedTransaction.lignes_ventes.map(ligne => (
                      <div key={ligne.id} className="flex justify-between text-sm border-b pb-2">
                        <div className="flex-1">
                          <p className="font-medium">{ligne.produit.libelle_produit}</p>
                          <p className="text-muted-foreground">
                            {ligne.quantite} x {formatAmount(ligne.prix_unitaire_ttc)}
                          </p>
                        </div>
                        <p className="font-medium">{formatAmount(ligne.montant_ligne_ttc)}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Sous-total:</span>
                    <span>{formatAmount(selectedTransaction.montant_total_ttc)}</span>
                  </div>
                  {selectedTransaction.remise_globale > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Remise:</span>
                      <span>-{formatAmount(selectedTransaction.remise_globale)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total à encaisser:</span>
                    <span className="text-primary">{formatAmount(selectedTransaction.montant_net)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interface de paiement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Encaissement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mode de paiement */}
                <div className="space-y-2">
                  <Label>Mode de paiement</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={paymentMethod === 'Espèces' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('Espèces')}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <Banknote className="h-5 w-5" />
                      <span className="text-xs">Espèces</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'Carte Bancaire' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('Carte Bancaire')}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <CreditCard className="h-5 w-5" />
                      <span className="text-xs">Carte</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'Mobile Money' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('Mobile Money')}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <Smartphone className="h-5 w-5" />
                      <span className="text-xs">Mobile</span>
                    </Button>
                  </div>
                </div>

                {/* Montant reçu */}
                <div className="space-y-2">
                  <Label>Montant reçu</Label>
                  <Input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(Number(e.target.value))}
                    className="text-right text-lg font-bold"
                  />
                </div>

                {/* Référence (pour carte/mobile) */}
                {paymentMethod !== 'Espèces' && (
                  <div className="space-y-2">
                    <Label>Référence transaction</Label>
                    <Input
                      placeholder="N° de référence..."
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>
                )}

                {/* Rendu */}
                {paymentMethod === 'Espèces' && calculateChange() > 0 && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 dark:text-green-300">Rendu:</span>
                      <span className="text-xl font-bold text-green-700 dark:text-green-300">
                        {formatAmount(calculateChange())}
                      </span>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Bouton confirmation */}
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleConfirmPayment}
                  disabled={isProcessing || (paymentMethod === 'Espèces' && amountReceived < selectedTransaction.montant_net)}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Confirmer le Paiement
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sélectionnez une transaction</h3>
              <p className="text-muted-foreground">
                Scannez un ticket ou sélectionnez une vente dans la liste pour l'encaisser
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CashRegisterInterface;
