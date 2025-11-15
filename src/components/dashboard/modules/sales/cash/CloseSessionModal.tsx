import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, DollarSign, TrendingUp, TrendingDown, Loader2, AlertTriangle } from 'lucide-react';
import { CashSession } from '@/hooks/useCashRegister';
import { useCurrency } from '@/contexts/CurrencyContext';
import useCashRegister from '@/hooks/useCashRegister';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CloseSessionModalProps {
  session: CashSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionClosed: () => void;
}

const CloseSessionModal = ({ session, open, onOpenChange, onSessionClosed }: CloseSessionModalProps) => {
  const { formatPrice } = useCurrency();
  const { closeSession, getSessionBalance, loading } = useCashRegister();
  
  const [montantReel, setMontantReel] = useState('');
  const [notes, setNotes] = useState('');
  const [montantTheorique, setMontantTheorique] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  // Charger le montant théorique
  useEffect(() => {
    if (session && open) {
      setIsCalculating(true);
      getSessionBalance(session.id)
        .then(balance => {
          setMontantTheorique(balance);
        })
        .finally(() => setIsCalculating(false));
    }
  }, [session, open, getSessionBalance]);

  const ecart = montantReel ? Number(montantReel) - montantTheorique : 0;

  const handleClose = async () => {
    if (!session || !montantReel) return;

    try {
      await closeSession(session.id, Number(montantReel), notes || undefined);
      onSessionClosed();
      onOpenChange(false);
      // Reset form
      setMontantReel('');
      setNotes('');
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
      <DialogContent className="max-w-lg">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button 
            onClick={handleClose} 
            disabled={!montantReel || loading || isCalculating}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Fermeture...
              </>
            ) : (
              'Fermer la Session'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloseSessionModal;
