import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calculator, DollarSign, TrendingUp, TrendingDown, Loader2, AlertTriangle, AlertCircle, Receipt, BookOpen } from 'lucide-react';
import { CashSession } from '@/hooks/useCashRegister';
import { useCurrency } from '@/contexts/CurrencyContext';
import useCashRegister from '@/hooks/useCashRegister';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { generateSessionAccountingEntries, getSessionSalesTotals, isAutoAccountingEnabled } from '@/services/AccountingEntriesService';

interface PendingTransaction {
  id: string;
  numero_vente: string;
  montant_net: number;
}

interface CloseSessionModalProps {
  session: CashSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionClosed: () => void;
}

const CloseSessionModal = ({ session, open, onOpenChange, onSessionClosed }: CloseSessionModalProps) => {
  const { formatPrice } = useCurrency();
  const { tenantId } = useTenant();
  const { closeSession, getSessionBalance, loading } = useCashRegister();
  
  const [montantReel, setMontantReel] = useState('');
  const [notes, setNotes] = useState('');
  const [montantTheorique, setMontantTheorique] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // États pour les totaux entrées/sorties
  const [totalEntrees, setTotalEntrees] = useState(0);
  const [totalSorties, setTotalSorties] = useState(0);
  
  // États pour les transactions en attente
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [isCheckingPending, setIsCheckingPending] = useState(false);
  const [showPendingWarning, setShowPendingWarning] = useState(false);
  const [forceClose, setForceClose] = useState(false);

  // Calculer les totaux entrées/sorties depuis mouvements_caisse
  const calculateSessionTotals = async (sessionId: string) => {
    try {
      const { data: movements, error } = await supabase
        .from('mouvements_caisse')
        .select('type_mouvement, montant')
        .eq('tenant_id', tenantId)
        .eq('session_caisse_id', sessionId);

      if (error) throw error;

      // Calculer Total Entrées = Ventes + Entrées
      const ventes = movements?.filter(m => m.type_mouvement === 'Vente')
        .reduce((sum, m) => sum + (m.montant || 0), 0) || 0;
      const entrees = movements?.filter(m => m.type_mouvement === 'Entrée')
        .reduce((sum, m) => sum + (m.montant || 0), 0) || 0;
      
      // Calculer Total Sorties = Sorties + Dépenses
      const sorties = movements?.filter(m => m.type_mouvement === 'Sortie')
        .reduce((sum, m) => sum + (m.montant || 0), 0) || 0;
      const depenses = movements?.filter(m => m.type_mouvement === 'Dépense')
        .reduce((sum, m) => sum + (m.montant || 0), 0) || 0;

      setTotalEntrees(ventes + entrees);
      setTotalSorties(sorties + depenses);
    } catch (error) {
      console.error('Erreur calcul totaux session:', error);
    }
  };

  // Charger le montant théorique et vérifier les transactions en attente
  useEffect(() => {
    if (session && open) {
      // Charger le montant théorique
      setIsCalculating(true);
      getSessionBalance(session.id)
        .then(balance => {
          setMontantTheorique(balance);
        })
        .finally(() => setIsCalculating(false));

      // Calculer les totaux Entrées/Sorties
      calculateSessionTotals(session.id);

      // Vérifier les transactions en attente
      setIsCheckingPending(true);
      checkPendingTransactions(session.id);
    }
    
    // Reset states when closing
    if (!open) {
      setShowPendingWarning(false);
      setForceClose(false);
      setTotalEntrees(0);
      setTotalSorties(0);
    }
  }, [session, open, getSessionBalance]);

  // Vérifier les transactions en attente
  const checkPendingTransactions = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('ventes')
        .select('id, numero_vente, montant_net')
        .eq('tenant_id', tenantId)
        .eq('session_caisse_id', sessionId)
        .eq('statut', 'En cours');

      if (error) throw error;

      const transactions = data || [];
      const total = transactions.reduce((sum, v) => sum + (v.montant_net || 0), 0);

      setPendingTransactions(transactions);
      setPendingTotal(total);
      setShowPendingWarning(transactions.length > 0);
    } catch (error) {
      console.error('Erreur vérification transactions en attente:', error);
    } finally {
      setIsCheckingPending(false);
    }
  };

  const ecart = montantReel ? Number(montantReel) - montantTheorique : 0;

  const handleClose = async () => {
    if (!session || !montantReel) return;

    // Si transactions en attente et pas de forceClose, montrer l'avertissement
    if (pendingTransactions.length > 0 && !forceClose) {
      setShowPendingWarning(true);
      return;
    }

    try {
      await closeSession(session.id, Number(montantReel), notes || undefined);
      
      // Génération des écritures comptables consolidées
      try {
        const autoAccountingEnabled = await isAutoAccountingEnabled(tenantId);
        if (autoAccountingEnabled) {
          const sessionTotals = await getSessionSalesTotals(session.id, tenantId);
          
          if (sessionTotals.nombreVentes > 0) {
            const success = await generateSessionAccountingEntries({
              sessionId: session.id,
              numeroSession: session.numero_session || session.id.slice(-8),
              tenantId,
              montantTotalHT: sessionTotals.totalHT,
              montantTotalTVA: sessionTotals.totalTVA,
              montantTotalCentimeAdditionnel: sessionTotals.totalCentimeAdditionnel,
              montantTotalTTC: sessionTotals.totalTTC,
              nombreVentes: sessionTotals.nombreVentes,
              modePaiementPrincipal: sessionTotals.modePaiementPrincipal
            });
            
            if (success) {
              toast.success(`Écritures comptables générées pour ${sessionTotals.nombreVentes} vente(s)`, {
                icon: <BookOpen className="h-4 w-4" />
              });
            }
          }
        }
      } catch (accountingError) {
        console.error('Erreur génération écritures comptables (non bloquante):', accountingError);
        // Ne pas bloquer la fermeture de session en cas d'erreur comptable
      }
      
      onSessionClosed();
      onOpenChange(false);
      // Reset form
      setMontantReel('');
      setNotes('');
      setPendingTransactions([]);
      setShowPendingWarning(false);
      setForceClose(false);
    } catch (error) {
      console.error('Erreur fermeture session:', error);
    }
  };

  const getAgentName = (session: CashSession | null) => {
    if (!session) return 'N/A';
    if (session.caissier) {
      return `${session.caissier.prenoms} ${session.caissier.noms}`;
    }
    return session.caissier_id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Fermer la Session de Caisse
          </DialogTitle>
          <DialogDescription>
            Vérifiez les montants et fermez la session #{session?.numero_session}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alerte transactions en attente */}
          {pendingTransactions.length > 0 && (
            <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-700 dark:text-orange-400">
                Transactions non encaissées
              </AlertTitle>
              <AlertDescription className="space-y-2">
                <p className="text-orange-600 dark:text-orange-400">
                  {pendingTransactions.length} transaction(s) en attente d'encaissement
                  pour un total de <strong>{formatPrice(pendingTotal)}</strong>
                </p>
                
                <ScrollArea className="h-[100px] rounded border border-orange-200 dark:border-orange-800 p-2 mt-2">
                  <div className="space-y-1">
                    {pendingTransactions.map(tx => (
                      <div key={tx.id} className="flex justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Receipt className="h-3 w-3" />
                          {tx.numero_vente}
                        </span>
                        <span className="font-medium">{formatPrice(tx.montant_net)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  Rendez-vous dans l'onglet "Encaissement" pour traiter ces ventes avant de fermer la session.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Informations de la session */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Session</span>
              <span className="font-medium">#{session?.numero_session}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Agent</span>
              <span className="font-medium">{getAgentName(session)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ouverture</span>
              <span className="font-medium">
                {session?.date_ouverture && format(new Date(session.date_ouverture), 'Pp', { locale: fr })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fond de caisse</span>
              <span className="font-medium">{formatPrice(session?.fond_caisse_ouverture || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-green-600">Total Entrées (Ventes + Entrées)</span>
              <span className="font-medium text-green-600">{formatPrice(totalEntrees)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-red-600">Total Sorties (Sorties + Dépenses)</span>
              <span className="font-medium text-red-600">{formatPrice(totalSorties)}</span>
            </div>
          </div>

          {/* Montant théorique */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Montant Théorique</span>
              </div>
              {isCalculating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="text-lg font-bold text-blue-600">
                  {formatPrice(montantTheorique)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Fond de caisse + Encaissements - Retraits
            </p>
          </div>

          {/* Montant réel */}
          <div className="space-y-2">
            <Label htmlFor="montant_reel">Montant Réel en Caisse *</Label>
            <Input
              id="montant_reel"
              type="number"
              step="0.01"
              placeholder="Entrez le montant réel compté"
              value={montantReel}
              onChange={(e) => setMontantReel(e.target.value)}
              required
            />
          </div>

          {/* Écart */}
          {montantReel && (
            <Alert className={ecart === 0 ? 'border-green-500' : ecart > 0 ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              <div className="flex items-center gap-2">
                {ecart > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : ecart < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <DollarSign className="h-4 w-4 text-green-600" />
                )}
                <AlertDescription>
                  <span className="font-medium">
                    Écart: {formatPrice(Math.abs(ecart))}
                  </span>
                  {ecart > 0 && <span className="text-green-600 ml-2">(Excédent)</span>}
                  {ecart < 0 && <span className="text-red-600 ml-2">(Manquant)</span>}
                  {ecart === 0 && <span className="text-green-600 ml-2">(Aucun écart)</span>}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Remarques ou explications sur l'écart..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Warning si écart important */}
          {Math.abs(ecart) > 1000 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                L'écart est important. Veuillez vérifier attentivement le comptage.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          
          {pendingTransactions.length > 0 && !forceClose ? (
            <Button 
              variant="destructive"
              onClick={() => setForceClose(true)}
              disabled={!montantReel || loading || isCalculating || isCheckingPending}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Fermer malgré les ventes en attente
            </Button>
          ) : (
            <Button 
              onClick={handleClose} 
              disabled={!montantReel || loading || isCalculating || isCheckingPending}
              variant={forceClose ? "destructive" : "default"}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fermeture...
                </>
              ) : forceClose ? (
                'Confirmer la fermeture forcée'
              ) : (
                'Fermer la Session'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloseSessionModal;
