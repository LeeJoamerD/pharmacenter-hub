/**
 * Interface de création de factures proforma
 * Recherche dans le catalogue produits (pas les lots), pas de déduction stock
 */
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, ShoppingCart, User, Trash2, Plus, Minus, 
  Loader2, Download, List
} from 'lucide-react';
import ProformaProductSearch, { ProformaProduct } from './ProformaProductSearch';
import ProformaListPanel from './ProformaListPanel';
import CustomerSelection from './CustomerSelection';
import { useProformaManager, ProformaCartItem } from '@/hooks/useProformaManager';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { CustomerInfo } from '@/types/pos';
import { generateProformaPDF, ProformaPDFData } from '@/utils/proformaInvoicePDF';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';

interface CartItem {
  product: ProformaProduct;
  quantity: number;
  unitPrice: number;
  total: number;
}

const ProformaInterface: React.FC = () => {
  const { formatAmount } = useCurrencyFormatting();
  const { createProforma, isCreating } = useProformaManager();
  const { getPharmacyInfo } = useGlobalSystemSettings();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CustomerInfo>({ type: 'Ordinaire', discount_rate: 0 });
  const [notes, setNotes] = useState('');
  const [validiteJours, setValiditeJours] = useState(30);
  const [showList, setShowList] = useState(false);

  // Ajouter un produit au panier (pas de vérification stock)
  const addToCart = useCallback((product: ProformaProduct) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
            : i
        );
      }
      return [...prev, {
        product,
        quantity: 1,
        unitPrice: product.prix_vente_ttc,
        total: product.prix_vente_ttc,
      }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, total: newQty * item.unitPrice };
      }
      return item;
    }));
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // Calculs
  const totalTTC = cart.reduce((s, i) => s + i.total, 0);
  const totalHT = cart.reduce((s, i) => s + (i.product.prix_vente_ht * i.quantity), 0);
  const totalTVA = totalTTC - totalHT;

  // Créer et générer le PDF
  const handleCreateProforma = useCallback(async () => {
    if (cart.length === 0) return;

    const items: ProformaCartItem[] = cart.map(item => ({
      produit_id: item.product.id,
      libelle_produit: item.product.libelle_produit,
      code_cip: item.product.code_cip,
      quantite: item.quantity,
      prix_unitaire_ht: item.product.prix_vente_ht,
      prix_unitaire_ttc: item.product.prix_vente_ttc,
      taux_tva: item.product.taux_tva,
      remise_ligne: 0,
      montant_ligne_ttc: item.total,
    }));

    const result = await createProforma({
      client_id: customer.id,
      client_nom: customer.name,
      items,
      notes,
      validite_jours: validiteJours,
    });

    if (result) {
      // Générer le PDF
      const pharmacyInfo = getPharmacyInfo();
      const pdfData: ProformaPDFData = {
        numero_proforma: result.numero,
        date_proforma: new Date().toISOString(),
        date_expiration: new Date(Date.now() + validiteJours * 86400000).toISOString(),
        validite_jours: validiteJours,
        client_nom: customer.name || null,
        montant_total_ht: totalHT,
        montant_tva: totalTVA,
        montant_total_ttc: totalTTC,
        remise_globale: 0,
        montant_net: totalTTC,
        notes,
        lignes: cart.map(i => ({
          libelle_produit: i.product.libelle_produit,
          code_cip: i.product.code_cip,
          quantite: i.quantity,
          prix_unitaire_ttc: i.unitPrice,
          remise_ligne: 0,
          montant_ligne_ttc: i.total,
        })),
        pharmacyInfo: {
          name: pharmacyInfo.name,
          address: pharmacyInfo.address,
          telephone: pharmacyInfo.telephone_appel || pharmacyInfo.telephone_whatsapp,
        },
      };

      const pdfUrl = generateProformaPDF(pdfData);
      window.open(pdfUrl, '_blank');

      // Reset
      clearCart();
      setCustomer({ type: 'Ordinaire', discount_rate: 0 });
      setNotes('');
    }
  }, [cart, customer, notes, validiteJours, createProforma, getPharmacyInfo, totalHT, totalTVA, totalTTC, clearCart]);

  if (showList) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setShowList(false)}>
          ← Nouvelle Proforma
        </Button>
        <ProformaListPanel />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Section Gauche - Recherche + Panier */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nouvelle Facture Proforma
          </h3>
          <Button variant="outline" size="sm" onClick={() => setShowList(true)}>
            <List className="h-4 w-4 mr-2" />
            Voir les proformas
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recherche Produit (Catalogue)</CardTitle>
          </CardHeader>
          <CardContent>
            <ProformaProductSearch onProductSelect={addToCart} />
            <p className="text-xs text-muted-foreground mt-2">
              La recherche s'effectue dans le catalogue produits. Aucune vérification de stock.
            </p>
          </CardContent>
        </Card>

        {/* Panier */}
        {cart.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Articles ({cart.length})
                </span>
                <Button variant="ghost" size="sm" onClick={clearCart}>Vider</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 p-2 border rounded-md">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.libelle_produit}</p>
                    <p className="text-xs text-muted-foreground">{formatAmount(item.unitPrice)} / unité</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm font-semibold w-20 text-right">{formatAmount(item.total)}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Section Droite - Client + Totaux + Validation */}
      <div className="w-full lg:w-96 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              Client (optionnel)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerSelection 
              customer={customer} 
              onCustomerChange={setCustomer}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium">Validité (jours)</label>
              <Input
                type="number"
                value={validiteJours}
                onChange={(e) => setValiditeJours(Number(e.target.value) || 30)}
                min={1}
                max={365}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes ou observations..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Total HT</span>
              <span>{formatAmount(totalHT)}</span>
            </div>
            {totalTVA > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>TVA</span>
                <span>{formatAmount(totalTVA)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total TTC</span>
              <span className="text-primary">{formatAmount(totalTTC)}</span>
            </div>

            <Button
              size="lg"
              className="w-full mt-4"
              onClick={handleCreateProforma}
              disabled={cart.length === 0 || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Créer & Générer PDF
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Aucun stock ne sera déduit. Le PDF sera généré automatiquement.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProformaInterface;
