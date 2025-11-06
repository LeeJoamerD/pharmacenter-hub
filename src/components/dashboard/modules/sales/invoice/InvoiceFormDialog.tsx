import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ClientSelector } from '@/components/accounting/ClientSelector';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InvoiceLine {
  id?: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  taux_tva: number;
  montant_ht?: number;
  montant_tva?: number;
  montant_ttc?: number;
}

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  tvaRate: number;
}

export const InvoiceFormDialog: React.FC<InvoiceFormDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  tvaRate,
}) => {
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  
  const [tenantId, setTenantId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    client_id: '',
    libelle: '',
    date_emission: new Date().toISOString().split('T')[0],
    date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [newLine, setNewLine] = useState<Partial<InvoiceLine>>({
    designation: '',
    quantite: 1,
    prix_unitaire: 0,
    taux_tva: tvaRate,
  });

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  useEffect(() => {
    if (open && user) {
      loadTenantAndProducts();
    }
  }, [open, user]);

  const loadTenantAndProducts = async () => {
    if (!user) return;

    // Récupérer le tenant_id depuis personnel
    const { data: personnelData } = await supabase
      .from('personnel')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    if (personnelData?.tenant_id) {
      setTenantId(personnelData.tenant_id);
      await loadProducts(personnelData.tenant_id);
    }
  };

  const loadProducts = async (tenant_id: string) => {
    const { data, error } = await supabase
      .from('produits')
      .select('id, libelle_produit, prix_vente')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)
      .order('libelle_produit');

    if (!error && data) {
      setProducts(data);
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setNewLine(prev => ({
        ...prev,
        designation: product.libelle_produit,
        prix_unitaire: product.prix_vente || 0,
      }));
    }
  };

  const calculateLineTotals = (line: Partial<InvoiceLine>): InvoiceLine => {
    const montant_ht = (line.quantite || 0) * (line.prix_unitaire || 0);
    const montant_tva = montant_ht * ((line.taux_tva || 0) / 100);
    const montant_ttc = montant_ht + montant_tva;

    return {
      id: line.id || Date.now().toString(),
      designation: line.designation || '',
      quantite: line.quantite || 0,
      prix_unitaire: line.prix_unitaire || 0,
      taux_tva: line.taux_tva || 0,
      montant_ht,
      montant_tva,
      montant_ttc,
    };
  };

  const handleAddLine = () => {
    if (!newLine.designation || !newLine.quantite || newLine.prix_unitaire === undefined) {
      return;
    }

    const line = calculateLineTotals(newLine);
    setLines([...lines, line]);
    setNewLine({
      designation: '',
      quantite: 1,
      prix_unitaire: 0,
      taux_tva: tvaRate,
    });
    setSelectedProductId('');
  };

  const handleRemoveLine = (lineId: string) => {
    setLines(lines.filter(line => line.id !== lineId));
  };

  const calculateTotals = () => {
    const montant_ht = lines.reduce((sum, line) => sum + (line.montant_ht || 0), 0);
    const montant_tva = lines.reduce((sum, line) => sum + (line.montant_tva || 0), 0);
    const montant_ttc = lines.reduce((sum, line) => sum + (line.montant_ttc || 0), 0);
    return { montant_ht, montant_tva, montant_ttc };
  };

  const handleSubmit = () => {
    if (!formData.client_id || !formData.libelle || lines.length === 0) {
      return;
    }

    const totals = calculateTotals();
    onSubmit({
      type: 'client',
      ...formData,
      ...totals,
      montant_restant: totals.montant_ttc,
      montant_paye: 0,
      statut: 'brouillon',
      statut_paiement: 'impayee',
      relances_effectuees: 0,
      lines,
    });

    // Reset form
    setFormData({
      client_id: '',
      libelle: '',
      date_emission: new Date().toISOString().split('T')[0],
      date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
    });
    setLines([]);
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle facture</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour créer une nouvelle facture client
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations client */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <ClientSelector
                value={formData.client_id}
                onChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="libelle">Libellé *</Label>
              <Input
                id="libelle"
                value={formData.libelle}
                onChange={(e) => setFormData(prev => ({ ...prev, libelle: e.target.value }))}
                placeholder="Description de la facture"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_emission">Date d'émission</Label>
              <Input
                id="date_emission"
                type="date"
                value={formData.date_emission}
                onChange={(e) => setFormData(prev => ({ ...prev, date_emission: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_echeance">Date d'échéance *</Label>
              <Input
                id="date_echeance"
                type="date"
                value={formData.date_echeance}
                onChange={(e) => setFormData(prev => ({ ...prev, date_echeance: e.target.value }))}
              />
            </div>
          </div>

          {/* Ajout d'articles */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Articles</h4>

            <div className="grid grid-cols-6 gap-2">
              <Select value={selectedProductId} onValueChange={handleProductSelect}>
                <SelectTrigger className="col-span-2">
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.libelle_produit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Qté"
                value={newLine.quantite || ''}
                onChange={(e) => setNewLine(prev => ({ ...prev, quantite: parseInt(e.target.value) || 1 }))}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Prix unit."
                value={newLine.prix_unitaire || ''}
                onChange={(e) => setNewLine(prev => ({ ...prev, prix_unitaire: parseFloat(e.target.value) || 0 }))}
              />
              <Input
                type="number"
                placeholder="TVA %"
                value={newLine.taux_tva || tvaRate}
                onChange={(e) => setNewLine(prev => ({ ...prev, taux_tva: parseFloat(e.target.value) || 0 }))}
              />
              <Button onClick={handleAddLine} type="button">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Liste des articles */}
            {lines.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Prix unitaire</TableHead>
                    <TableHead>TVA</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>{line.designation}</TableCell>
                      <TableCell>{line.quantite}</TableCell>
                      <TableCell>{formatPrice(line.prix_unitaire)}</TableCell>
                      <TableCell>{line.taux_tva}%</TableCell>
                      <TableCell>{formatPrice(line.montant_ttc || 0)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveLine(line.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Totaux */}
            {lines.length > 0 && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Sous-total HT:</span>
                    <span>{formatPrice(totals.montant_ht)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TVA:</span>
                    <span>{formatPrice(totals.montant_tva)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total TTC:</span>
                    <span>{formatPrice(totals.montant_ttc)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes additionnelles..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            Créer la facture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
