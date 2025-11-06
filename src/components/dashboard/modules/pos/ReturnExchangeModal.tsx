import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useReturnsExchanges } from '@/hooks/useReturnsExchanges';
import { toast } from 'sonner';
import { Search, Package, AlertCircle } from 'lucide-react';

interface ReturnExchangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReturnExchangeModal: React.FC<ReturnExchangeModalProps> = ({ open, onOpenChange }) => {
  const { searchOriginalTransaction, createReturn, calculateRefundAmount } = useReturnsExchanges();
  const [step, setStep] = useState<'search' | 'details'>('search');
  const [transactionRef, setTransactionRef] = useState('');
  const [originalTransaction, setOriginalTransaction] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<Array<{
    productId: string;
    productName: string;
    quantityReturned: number;
    maxQuantity: number;
    condition: 'Neuf' | 'Ouvert' | 'Défectueux';
    reason: string;
  }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!transactionRef.trim()) {
      toast.error('Veuillez entrer une référence de transaction');
      return;
    }

    const result = await searchOriginalTransaction(transactionRef);
    if (result && result.length > 0) {
      const transaction = result[0];
      setOriginalTransaction(transaction);
      // Les lignes_ventes sont à récupérer séparément si nécessaire
      setReturnItems([{
        productId: '',
        productName: 'Produit',
        quantityReturned: 0,
        maxQuantity: 1,
        condition: 'Neuf' as const,
        reason: ''
      }]);
      setStep('details');
    } else {
      toast.error('Transaction introuvable');
    }
  };

  const handleSubmit = async () => {
    const itemsToReturn = returnItems.filter(item => item.quantityReturned > 0);
    
    if (itemsToReturn.length === 0) {
      toast.error('Veuillez sélectionner au moins un article à retourner');
      return;
    }

    if (itemsToReturn.some(item => !item.reason.trim())) {
      toast.error('Veuillez indiquer un motif pour chaque article');
      return;
    }

    setIsSubmitting(true);
    try {
      await createReturn({
        vente_origine_id: originalTransaction.id,
        numero_vente_origine: originalTransaction.numero_facture || '',
        client_id: originalTransaction.client_id,
        type_operation: 'Retour',
        motif_retour: 'Retour client',
        lignes: itemsToReturn.map(item => ({
          produit_id: item.productId,
          lot_id: undefined,
          quantite_retournee: item.quantityReturned,
          prix_unitaire: 0,
          montant_ligne: 0,
          etat_produit: item.condition === 'Neuf' ? 'Parfait' : item.condition === 'Ouvert' ? 'Endommagé' : 'Non conforme',
          taux_remboursement: 100,
          motif_ligne: item.reason,
          remis_en_stock: false
        }))
      });

      toast.success('Retour enregistré avec succès');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement du retour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('search');
    setTransactionRef('');
    setOriginalTransaction(null);
    setReturnItems([]);
  };

  const updateReturnItem = (index: number, field: string, value: any) => {
    setReturnItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Retour / Échange de Produits
          </DialogTitle>
        </DialogHeader>

        {step === 'search' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Recherchez la transaction originale par son numéro de facture
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-ref">Numéro de Facture</Label>
              <div className="flex gap-2">
                <Input
                  id="transaction-ref"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="Ex: FAC-2024-0001"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} className="gap-2">
                  <Search className="h-4 w-4" />
                  Rechercher
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'details' && originalTransaction && (
          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h3 className="font-semibold">Transaction Originale</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Numéro:</span> {originalTransaction.numero_facture}
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span> {new Date(originalTransaction.date_vente).toLocaleDateString()}
                </div>
                <div>
                  <span className="text-muted-foreground">Montant:</span> {originalTransaction.montant_total} FCFA
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Articles à Retourner</h3>
              {returnItems.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">Max: {item.maxQuantity}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Quantité</Label>
                      <Input
                        type="number"
                        min={0}
                        max={item.maxQuantity}
                        value={item.quantityReturned}
                        onChange={(e) => updateReturnItem(index, 'quantityReturned', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>État</Label>
                      <Select
                        value={item.condition}
                        onValueChange={(value) => updateReturnItem(index, 'condition', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Neuf">Neuf</SelectItem>
                          <SelectItem value="Ouvert">Ouvert</SelectItem>
                          <SelectItem value="Défectueux">Défectueux</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Remboursement</Label>
                      <Input
                        value={calculateRefundAmount([{ quantite_retournee: item.quantityReturned, etat_produit: item.condition, prix_unitaire: 1000 }]) + ' FCFA'}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  {item.quantityReturned > 0 && (
                    <div className="space-y-2">
                      <Label>Motif du retour</Label>
                      <Textarea
                        value={item.reason}
                        onChange={(e) => updateReturnItem(index, 'reason', e.target.value)}
                        placeholder="Précisez la raison du retour..."
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'search' ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('search')}>
                Retour
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer le Retour'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
