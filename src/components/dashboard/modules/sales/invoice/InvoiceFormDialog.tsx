import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ClientSelector } from '@/components/accounting/ClientSelector';
import { AssureurSelector } from '@/components/accounting/AssureurSelector';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/use-debounce';

interface InvoiceLine {
  id?: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  taux_tva: number;
  taux_centime_additionnel: number;
  montant_ht?: number;
  montant_tva?: number;
  montant_centime_additionnel?: number;
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
  
  // Type de facture : 'client' ou 'assureur'
  const [invoiceTarget, setInvoiceTarget] = useState<'client' | 'assureur'>('client');

  const [formData, setFormData] = useState({
    client_id: '',
    assureur_id: '',
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
    taux_centime_additionnel: 0.175,
  });

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isProductPopoverOpen, setIsProductPopoverOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const debouncedProductSearch = useDebouncedValue(productSearch, 400);

  useEffect(() => {
    if (open && user) {
      loadTenant();
    }
  }, [open, user]);

  // Reset form when target type changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, client_id: '', assureur_id: '' }));
  }, [invoiceTarget]);

  // Server-side product search
  useEffect(() => {
    if (!tenantId || !isProductPopoverOpen) return;

    let cancelled = false;
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        let query = supabase
          .from('produits')
          .select('id, libelle_produit, prix_vente_ttc, code_cip')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('libelle_produit')
          .limit(50);

        if (debouncedProductSearch.trim()) {
          const term = `%${debouncedProductSearch.trim()}%`;
          query = query.or(`libelle_produit.ilike.${term},code_cip.ilike.${term}`);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!cancelled) setProducts(data || []);
      } catch (err) {
        console.error('Invoice product search error:', err);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    };

    fetchProducts();
    return () => { cancelled = true; };
  }, [tenantId, debouncedProductSearch, isProductPopoverOpen]);

  const loadTenant = async () => {
    if (!user) return;
    const { data: personnelData } = await supabase
      .from('personnel')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    if (personnelData?.tenant_id) {
      setTenantId(personnelData.tenant_id);
    }
  };
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setNewLine(prev => ({
        ...prev,
        designation: product.libelle_produit,
        prix_unitaire: product.prix_vente_ttc || 0,
      }));
    }
  };

  const calculateLineTotals = (line: Partial<InvoiceLine>): InvoiceLine => {
    const montant_ht = (line.quantite || 0) * (line.prix_unitaire || 0);
    const montant_centime_additionnel = montant_ht * ((line.taux_centime_additionnel || 0) / 100);
    const base_tva = montant_ht + montant_centime_additionnel;
    const montant_tva = base_tva * ((line.taux_tva || 0) / 100);
    const montant_ttc = montant_ht + montant_centime_additionnel + montant_tva;

    return {
      id: line.id || Date.now().toString(),
      designation: line.designation || '',
      quantite: line.quantite || 0,
      prix_unitaire: line.prix_unitaire || 0,
      taux_tva: line.taux_tva || 0,
      taux_centime_additionnel: line.taux_centime_additionnel || 0,
      montant_ht,
      montant_centime_additionnel,
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
      taux_centime_additionnel: 0.175,
    });
    setSelectedProductId('');
  };

  const handleRemoveLine = (lineId: string) => {
    setLines(lines.filter(line => line.id !== lineId));
  };

  const calculateTotals = () => {
    const montant_ht = lines.reduce((sum, line) => sum + (line.montant_ht || 0), 0);
    const montant_centime_additionnel = lines.reduce((sum, line) => sum + (line.montant_centime_additionnel || 0), 0);
    const montant_tva = lines.reduce((sum, line) => sum + (line.montant_tva || 0), 0);
    const montant_ttc = lines.reduce((sum, line) => sum + (line.montant_ttc || 0), 0);
    return { montant_ht, montant_centime_additionnel, montant_tva, montant_ttc };
  };

  const handleSubmit = () => {
    const hasTarget = invoiceTarget === 'client' ? formData.client_id : formData.assureur_id;
    if (!hasTarget || !formData.libelle || lines.length === 0) {
      return;
    }

    const totals = calculateTotals();
    const submitData: any = {
      type: 'client', // Type DB reste 'client' pour la table factures
      ...formData,
      ...totals,
      montant_restant: totals.montant_ttc,
      montant_paye: 0,
      statut: 'brouillon',
      statut_paiement: 'impayee',
      relances_effectuees: 0,
      lines,
    };

    // Pour les factures assureur, stocker assureur_id et mettre client_id à null
    if (invoiceTarget === 'assureur') {
      submitData.assureur_id = formData.assureur_id;
      submitData.client_id = null;
    } else {
      submitData.assureur_id = null;
    }

    onSubmit(submitData);

    // Reset form
    setFormData({
      client_id: '',
      assureur_id: '',
      libelle: '',
      date_emission: new Date().toISOString().split('T')[0],
      date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
    });
    setLines([]);
    setInvoiceTarget('client');
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle facture</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour créer une nouvelle facture
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Type de destinataire */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type de facture</Label>
              <Select value={invoiceTarget} onValueChange={(v: 'client' | 'assureur') => setInvoiceTarget(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Facture Client</SelectItem>
                  <SelectItem value="assureur">Facture Assureur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{invoiceTarget === 'client' ? 'Client *' : 'Assureur *'}</Label>
              {invoiceTarget === 'client' ? (
                <ClientSelector
                  value={formData.client_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                />
              ) : (
                <AssureurSelector
                  value={formData.assureur_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, assureur_id: value }))}
                  tenantId={tenantId || undefined}
                />
              )}
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

            <div className="grid grid-cols-7 gap-2">
              <Popover open={isProductPopoverOpen} onOpenChange={setIsProductPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isProductPopoverOpen}
                    className="col-span-2 justify-between"
                  >
                    {selectedProductId ? (
                      products.find(p => p.id === selectedProductId)?.libelle_produit
                    ) : (
                      "Rechercher un produit..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Rechercher par nom ou code CIP..."
                      value={productSearch}
                      onValueChange={setProductSearch}
                    />
                    <CommandList>
                      {isLoadingProducts ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">Chargement...</span>
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {products.map((product) => (
                              <CommandItem
                                key={product.id}
                                value={product.id}
                                onSelect={() => {
                                  handleProductSelect(product.id);
                                  setIsProductPopoverOpen(false);
                                  setProductSearch('');
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedProductId === product.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{product.libelle_produit}</span>
                                  {product.code_cip && (
                                    <span className="text-xs text-muted-foreground">
                                      CIP: {product.code_cip}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                step="0.01"
                placeholder="TVA %"
                value={newLine.taux_tva || tvaRate}
                onChange={(e) => setNewLine(prev => ({ ...prev, taux_tva: parseFloat(e.target.value) || 0 }))}
              />
              <Input
                type="number"
                step="0.001"
                placeholder="CA %"
                title="Centime Additionnel %"
                value={newLine.taux_centime_additionnel || ''}
                onChange={(e) => setNewLine(prev => ({ ...prev, taux_centime_additionnel: parseFloat(e.target.value) || 0 }))}
                className="text-sm"
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
                    <TableHead>TVA %</TableHead>
                    <TableHead>CA %</TableHead>
                    <TableHead>Total HT</TableHead>
                    <TableHead>Total TTC</TableHead>
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
                      <TableCell>{line.taux_centime_additionnel}%</TableCell>
                      <TableCell>{formatPrice(line.montant_ht || 0)}</TableCell>
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
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Centime Additionnel:</span>
                    <span>{formatPrice(totals.montant_centime_additionnel)}</span>
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
