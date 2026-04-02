import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Gift, Trash2, Save } from 'lucide-react';
import { ProductSearchCombobox, ProductOption } from '@/components/ui/product-search-combobox';
import { useReceptions } from '@/hooks/useReceptions';
import { usePriceCategories } from '@/hooks/usePriceCategories';
import { useStockSettings } from '@/hooks/useStockSettings';
import { useSalesSettings } from '@/hooks/useSalesSettings';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useTenant } from '@/contexts/TenantContext';
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

const UG_SOURCES = [
  { value: 'reception', label: 'Réception' },
  { value: 'don', label: 'Don ou légué' },
  { value: 'stock_orphelin', label: 'Stock Orphelin' },
  { value: 'autre', label: 'Autre' },
];

const FreeUnitsEntryForm: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { receptions, createReception, loading: receptionLoading } = useReceptions();
  const { categories: priceCategories } = usePriceCategories();
  const { settings: stockSettings } = useStockSettings();
  const { settings: salesSettings } = useSalesSettings();
  const { formatAmount, isNoDecimalCurrency } = useCurrencyFormatting();

  const [ugSource, setUgSource] = useState('reception');
  const [selectedReceptionId, setSelectedReceptionId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [lines, setLines] = useState<FreeUnitLine[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const roundingPrecision = stockSettings?.rounding_precision || 25;
  const roundingMethod = (salesSettings?.tax?.taxRoundingMethod as 'ceil' | 'floor' | 'round' | 'none') || 'ceil';

  const validatedReceptions = useMemo(() =>
    receptions.filter(r => r.statut === 'Validé'),
    [receptions]
  );

  const selectedReception = useMemo(() =>
    validatedReceptions.find(r => r.id === selectedReceptionId),
    [validatedReceptions, selectedReceptionId]
  );

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

  const addProductFromCatalog = useCallback((product: ProductOption) => {
    if (lines.some(l => l.produitId === product.id)) return;

    const categorieTarificationId = product.categorie_tarification_id || '';
    const prixAchat = product.prix_achat || 0;
    const pricing = calculatePricing(prixAchat, categorieTarificationId);

    const newLine: FreeUnitLine = {
      id: crypto.randomUUID(),
      produitId: product.id,
      produitNom: product.libelle_produit,
      codeCip: product.code_cip || '',
      categorieTarificationId,
      quantite: 1,
      numeroLot: '',
      dateExpiration: '',
      prixAchat,
      ...pricing
    };

    setLines(prev => [...prev, newLine]);
    setSelectedProductId('');
  }, [calculatePricing, lines]);

  const handlePrixAchatChange = useCallback((lineId: string, rawValue: string) => {
    const newPrixAchat = parseFloat(rawValue) || 0;
    setLines(prev => prev.map(line => {
      if (line.id !== lineId) return line;
      const pricing = calculatePricing(newPrixAchat, line.categorieTarificationId);
      return { ...line, prixAchat: newPrixAchat, ...pricing };
    }));
  }, [calculatePricing]);

  const updateLine = useCallback((lineId: string, field: keyof FreeUnitLine, value: any) => {
    setLines(prev => prev.map(line =>
      line.id === lineId ? { ...line, [field]: value } : line
    ));
  }, []);

  const removeLine = useCallback((lineId: string) => {
    setLines(prev => prev.filter(l => l.id !== lineId));
  }, []);

  const handleSave = async () => {
    if (lines.length === 0) {
      toast({ title: t('freeUnitsErrorTitle'), description: 'Ajoutez au moins un produit.', variant: "destructive" });
      return;
    }
    const invalidLines = lines.filter(l => l.quantite <= 0);
    if (invalidLines.length > 0) {
      toast({ title: t('freeUnitsErrorTitle'), description: t('freeUnitsErrorQuantity'), variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const sourceLabel = UG_SOURCES.find(s => s.value === ugSource)?.label || ugSource;
      const receptionRef = selectedReception?.numero_reception || selectedReceptionId?.slice(-6) || '';
      const notesText = `UG — Source: ${sourceLabel}${receptionRef ? ` — Réception: ${receptionRef}` : ''}`;

      await createReception({
        fournisseur_id: selectedReception?.fournisseur_id || undefined as any,
        notes: notesText,
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
      setSelectedProductId('');
    } catch (err) {
      console.error('Erreur sauvegarde unités gratuites:', err);
      toast({ title: t('freeUnitsErrorTitle'), description: t('freeUnitsErrorSave'), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryLabel = (catId: string) => {
    const cat = priceCategories?.find(c => c.id === catId);
    return cat?.libelle_categorie || '—';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Saisie des Unités Gratuites
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Source UG */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Source de l'UG</Label>
            <Select value={ugSource} onValueChange={(v) => { setUgSource(v); if (v !== 'reception') setSelectedReceptionId(''); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UG_SOURCES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reception (optional, shown only when source = reception) */}
          {ugSource === 'reception' && (
            <div className="space-y-2">
              <Label>Réception associée <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Select value={selectedReceptionId} onValueChange={setSelectedReceptionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une réception..." />
                </SelectTrigger>
                <SelectContent>
                  {validatedReceptions.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.numero_reception || r.id.slice(-6)} — {r.reference_facture ? `${r.reference_facture} — ` : ''}{r.fournisseur?.nom || 'Fournisseur'} — {r.date_reception ? new Date(r.date_reception).toLocaleDateString('fr-FR') : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Product search from catalog */}
        <div className="space-y-2">
          <Label>{t('freeUnitsSearchProduct')}</Label>
          <ProductSearchCombobox
            value={selectedProductId}
            onValueChange={setSelectedProductId}
            onSelectFull={addProductFromCatalog}
            tenantId={tenantId}
          />
        </div>

        {/* Lines table */}
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
                      <Input type="number" min={1} value={line.quantite}
                        onChange={e => updateLine(line.id, 'quantite', parseInt(e.target.value) || 1)}
                        className="w-20 h-8" />
                    </TableCell>
                    <TableCell>
                      <Input value={line.numeroLot}
                        onChange={e => updateLine(line.id, 'numeroLot', e.target.value)}
                        placeholder="N° lot" className="w-28 h-8" />
                    </TableCell>
                    <TableCell>
                      <Input type="date" value={line.dateExpiration}
                        onChange={e => updateLine(line.id, 'dateExpiration', e.target.value)}
                        className="w-36 h-8" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" min={0}
                        step={isNoDecimalCurrency() ? '1' : '0.01'}
                        value={line.prixAchat}
                        onChange={e => handlePrixAchatChange(line.id, e.target.value)}
                        className="w-28 h-8" />
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
  );
};

export default FreeUnitsEntryForm;
