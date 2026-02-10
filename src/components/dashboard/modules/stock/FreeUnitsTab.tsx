import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Gift, Search, Plus, Trash2, Save } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useReceptions } from '@/hooks/useReceptions';
import { usePriceCategories } from '@/hooks/usePriceCategories';
import { useStockSettings } from '@/hooks/useStockSettings';
import { useSalesSettings } from '@/hooks/useSalesSettings';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { unifiedPricingService } from '@/services/UnifiedPricingService';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface FreeUnitLine {
  id: string;
  produitId: string;
  produitNom: string;
  codeCip: string;
  categorieTarificationId: string;
  quantite: number;
  numeroLot: string;
  dateExpiration: string;
  prixAchat: number;
  prixVenteHT: number;
  montantTVA: number;
  montantCentimeAdd: number;
  prixVenteTTC: number;
  tauxTVA: number;
  tauxCentimeAdd: number;
  coefficientPrixVente: number;
}

const FreeUnitsTab: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { products } = useProducts();
  const { receptions, createReception, loading: receptionLoading } = useReceptions();
  const { categories: priceCategories } = usePriceCategories();
  const { settings: stockSettings } = useStockSettings();
  const { settings: salesSettings } = useSalesSettings();
  const { formatAmount, isNoDecimalCurrency } = useCurrencyFormatting();

  const [selectedReceptionId, setSelectedReceptionId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lines, setLines] = useState<FreeUnitLine[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Rounding params
  const roundingPrecision = stockSettings?.rounding_precision || 25;
  const roundingMethod = (salesSettings?.tax?.taxRoundingMethod as 'ceil' | 'floor' | 'round' | 'none') || 'ceil';

  // Validated receptions only
  const validatedReceptions = useMemo(() =>
    receptions.filter(r => r.statut === 'Validé'),
    [receptions]
  );

  const selectedReception = useMemo(() =>
    validatedReceptions.find(r => r.id === selectedReceptionId),
    [validatedReceptions, selectedReceptionId]
  );

  // Product search results
  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase();
    return products
      .filter(p =>
        (p.libelle_produit?.toLowerCase().includes(term) ||
         p.code_cip?.toLowerCase().includes(term)) &&
        !lines.some(l => l.produitId === p.id)
      )
      .slice(0, 10);
  }, [searchTerm, products, lines]);

  // Calculate pricing for a line
  const calculatePricing = useCallback((prixAchat: number, categorieTarificationId: string) => {
    const category = priceCategories?.find(cat => cat.id === categorieTarificationId);
    if (!category) {
      return { prixVenteHT: 0, montantTVA: 0, montantCentimeAdd: 0, prixVenteTTC: 0, tauxTVA: 0, tauxCentimeAdd: 0, coefficientPrixVente: 1 };
    }

    const result = unifiedPricingService.calculateSalePrice({
      prixAchat,
      coefficientPrixVente: category.coefficient_prix_vente || 1,
      tauxTVA: category.taux_tva || 0,
      tauxCentimeAdditionnel: category.taux_centime_additionnel || 0,
      roundingPrecision,
      roundingMethod,
      currencyCode: isNoDecimalCurrency() ? 'XAF' : undefined
    });

    return {
      prixVenteHT: result.prixVenteHT,
      montantTVA: result.montantTVA,
      montantCentimeAdd: result.montantCentimeAdditionnel,
      prixVenteTTC: result.prixVenteTTC,
      tauxTVA: result.tauxTVA,
      tauxCentimeAdd: result.tauxCentimeAdditionnel,
      coefficientPrixVente: category.coefficient_prix_vente || 1
    };
  }, [priceCategories, roundingPrecision, roundingMethod, isNoDecimalCurrency]);

  // Add product to lines
  const addProduct = useCallback((product: any) => {
    const categorieTarificationId = product.categorie_tarification_id || '';
    const pricing = calculatePricing(0, categorieTarificationId);

    const newLine: FreeUnitLine = {
      id: crypto.randomUUID(),
      produitId: product.id,
      produitNom: product.libelle_produit,
      codeCip: product.code_cip || '',
      categorieTarificationId,
      quantite: 1,
      numeroLot: '',
      dateExpiration: '',
      prixAchat: 0,
      ...pricing
    };

    setLines(prev => [...prev, newLine]);
    setSearchTerm('');
  }, [calculatePricing]);

  // Handle purchase price change with auto-recalculation
  const handlePrixAchatChange = useCallback((lineId: string, rawValue: string) => {
    const newPrixAchat = parseFloat(rawValue) || 0;
    setLines(prev => prev.map(line => {
      if (line.id !== lineId) return line;
      const pricing = calculatePricing(newPrixAchat, line.categorieTarificationId);
      return { ...line, prixAchat: newPrixAchat, ...pricing };
    }));
  }, [calculatePricing]);

  // Update simple field
  const updateLine = useCallback((lineId: string, field: keyof FreeUnitLine, value: any) => {
    setLines(prev => prev.map(line =>
      line.id === lineId ? { ...line, [field]: value } : line
    ));
  }, []);

  // Remove line
  const removeLine = useCallback((lineId: string) => {
    setLines(prev => prev.filter(l => l.id !== lineId));
  }, []);

  // Save
  const handleSave = async () => {
    if (!selectedReceptionId || lines.length === 0) {
      toast({ title: t('freeUnitsErrorTitle'), description: t('freeUnitsErrorSelectReception'), variant: "destructive" });
      return;
    }

    const invalidLines = lines.filter(l => l.quantite <= 0);
    if (invalidLines.length > 0) {
      toast({ title: t('freeUnitsErrorTitle'), description: t('freeUnitsErrorQuantity'), variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await createReception({
        fournisseur_id: selectedReception?.fournisseur_id || '',
        notes: `${t('freeUnitsNotePrefix')} ${selectedReception?.numero_reception || selectedReceptionId.slice(-6)}`,
        isValidated: true,
        montant_ht: 0,
        montant_tva: 0,
        montant_centime_additionnel: 0,
        montant_ttc: 0,
        lignes: lines.map(line => ({
          produit_id: line.produitId,
          quantite_commandee: 0,
          quantite_recue: line.quantite,
          quantite_acceptee: line.quantite,
          numero_lot: line.numeroLot,
          date_expiration: line.dateExpiration || undefined,
          statut: 'conforme' as const,
          prix_achat_reel: line.prixAchat,
          categorie_tarification_id: line.categorieTarificationId,
          prix_vente_ht: line.prixVenteHT,
          taux_tva: line.tauxTVA,
          montant_tva: line.montantTVA,
          taux_centime_additionnel: line.tauxCentimeAdd,
          montant_centime_additionnel: line.montantCentimeAdd,
          prix_vente_ttc: line.prixVenteTTC,
          prix_vente_suggere: line.prixVenteTTC
        }))
      });

      toast({ title: t('freeUnitsSuccessTitle'), description: t('freeUnitsSuccessDesc') });
      setLines([]);
      setSelectedReceptionId('');
    } catch (err) {
      console.error('Erreur sauvegarde unités gratuites:', err);
      toast({ title: t('freeUnitsErrorTitle'), description: t('freeUnitsErrorSave'), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Get category label
  const getCategoryLabel = (catId: string) => {
    const cat = priceCategories?.find(c => c.id === catId);
    return cat?.libelle_categorie || '—';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            {t('freeUnits')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Select reception */}
          <div className="space-y-2">
            <Label>{t('freeUnitsSelectReception')}</Label>
            <Select value={selectedReceptionId} onValueChange={setSelectedReceptionId}>
              <SelectTrigger>
                <SelectValue placeholder={t('freeUnitsSelectReceptionPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {validatedReceptions.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.numero_reception || r.id.slice(-6)} — {r.fournisseur?.nom || 'Fournisseur'} — {r.date_reception ? new Date(r.date_reception).toLocaleDateString('fr-FR') : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Product search */}
          {selectedReceptionId && (
            <div className="space-y-2">
              <Label>{t('freeUnitsSearchProduct')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('freeUnitsSearchPlaceholder')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="border rounded-md max-h-48 overflow-auto bg-background shadow-md">
                  {searchResults.map(product => (
                    <button
                      key={product.id}
                      className="w-full text-left px-4 py-2 hover:bg-muted flex justify-between items-center"
                      onClick={() => addProduct(product)}
                    >
                      <div>
                        <span className="font-medium">{product.libelle_produit}</span>
                        {product.code_cip && <span className="ml-2 text-muted-foreground text-sm">({product.code_cip})</span>}
                      </div>
                      <Plus className="h-4 w-4 text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Lines table */}
          {lines.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('product')}</TableHead>
                    <TableHead>{t('codeCip')}</TableHead>
                    <TableHead>{t('category')}</TableHead>
                    <TableHead className="w-20">{t('quantity')}</TableHead>
                    <TableHead>{t('lotNumber')}</TableHead>
                    <TableHead>{t('expirationDate')}</TableHead>
                    <TableHead className="w-28">{t('purchasePrice')}</TableHead>
                    <TableHead className="text-right">{t('totalHT')}</TableHead>
                    <TableHead className="text-right">{t('tva')}</TableHead>
                    <TableHead className="text-right">{t('centimeAdd')}</TableHead>
                    <TableHead className="text-right">{t('subtotalTTC')}</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map(line => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium max-w-[180px] truncate">{line.produitNom}</TableCell>
                      <TableCell><Badge variant="outline">{line.codeCip || '—'}</Badge></TableCell>
                      <TableCell className="text-xs">{getCategoryLabel(line.categorieTarificationId)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={line.quantite}
                          onChange={e => updateLine(line.id, 'quantite', parseInt(e.target.value) || 1)}
                          className="w-20 h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={line.numeroLot}
                          onChange={e => updateLine(line.id, 'numeroLot', e.target.value)}
                          placeholder={t('freeUnitsLotPlaceholder')}
                          className="w-28 h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="month"
                          value={line.dateExpiration}
                          onChange={e => updateLine(line.id, 'dateExpiration', e.target.value)}
                          className="w-36 h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={isNoDecimalCurrency() ? '1' : '0.01'}
                          value={line.prixAchat}
                          onChange={e => handlePrixAchatChange(line.id, e.target.value)}
                          className="w-28 h-8"
                        />
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatAmount(line.prixVenteHT)}</TableCell>
                      <TableCell className="text-right text-sm">{formatAmount(line.montantTVA)}</TableCell>
                      <TableCell className="text-right text-sm">{formatAmount(line.montantCentimeAdd)}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{formatAmount(line.prixVenteTTC)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeLine(line.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Save button */}
          {lines.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving || receptionLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? t('freeUnitsSaving') : t('freeUnitsSave')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FreeUnitsTab;
