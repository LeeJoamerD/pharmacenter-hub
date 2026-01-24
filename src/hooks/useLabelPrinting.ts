import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { 
  EnhancedLabelData, 
  LabelConfig, 
  DEFAULT_LABEL_CONFIG,
  printEnhancedLabels,
  openPrintDialog
} from '@/utils/labelPrinterEnhanced';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';

export interface ProductForLabel {
  id: string;
  libelle_produit: string;
  code_cip: string | null;
  code_barre_externe: string | null;
  prix_vente_ttc: number | null;
  dci_nom: string | null;
  laboratoire_libelle: string | null;
  date_peremption: string | null;
  numero_lot: string | null;
}

export function useLabelPrinting() {
  const [products, setProducts] = useState<ProductForLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [config, setConfig] = useState<LabelConfig>(DEFAULT_LABEL_CONFIG);
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { getPharmacyInfo } = useGlobalSystemSettings();

  // Récupérer les produits avec leurs relations
  const fetchProducts = useCallback(async (searchTerm?: string) => {
    if (!tenantId) {
      console.log('Pas de tenant ID disponible');
      return;
    }

    setLoading(true);
    try {
      // Charger les tables de référence en parallèle
      const [dciResult, labResult] = await Promise.all([
        supabase.from('dci').select('id, nom_dci'),
        supabase.from('laboratoires').select('id, libelle')
      ]);

      // Charger les lots séparément (table lots)
      const { data: lotsData } = await supabase
        .from('lots')
        .select('produit_id, numero_lot, date_peremption')
        .eq('tenant_id', tenantId)
        .gt('quantite_disponible', 0)
        .order('date_peremption', { ascending: true });

      // Créer des maps de lookup
      const dciMap = new Map<string, string>();
      if (dciResult.data) {
        dciResult.data.forEach(d => dciMap.set(d.id, d.nom_dci || ''));
      }

      const labMap = new Map<string, string>();
      if (labResult.data) {
        labResult.data.forEach(l => labMap.set(l.id, l.libelle || ''));
      }

      // Map produit -> premier lot disponible (plus proche de l'expiration)
      const stockMap = new Map<string, { numero_lot: string | null; date_peremption: string | null }>();
      if (lotsData) {
        lotsData.forEach(s => {
          if (!stockMap.has(s.produit_id)) {
            stockMap.set(s.produit_id, {
              numero_lot: s.numero_lot,
              date_peremption: s.date_peremption
            });
          }
        });
      }

      // Requête principale sur les produits avec filtre tenant
      let query = supabase
        .from('produits')
        .select('id, libelle_produit, code_cip, code_barre_externe, prix_vente_ttc, dci_id, laboratoires_id')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('libelle_produit', { ascending: true })
        .limit(200);

      if (searchTerm && searchTerm.trim()) {
        query = query.or(`libelle_produit.ilike.%${searchTerm}%,code_cip.ilike.%${searchTerm}%,code_barre_externe.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur fetch produits:', error);
        throw error;
      }

      // Combiner les données avec les noms DCI/laboratoires et infos stock
      const productsWithNames: ProductForLabel[] = (data || []).map(product => {
        const stockInfo = stockMap.get(product.id);
        return {
          id: product.id,
          libelle_produit: product.libelle_produit,
          code_cip: product.code_cip,
          code_barre_externe: product.code_barre_externe,
          prix_vente_ttc: product.prix_vente_ttc,
          dci_nom: product.dci_id ? dciMap.get(product.dci_id) || null : null,
          laboratoire_libelle: product.laboratoires_id ? labMap.get(product.laboratoires_id) || null : null,
          date_peremption: stockInfo?.date_peremption || null,
          numero_lot: stockInfo?.numero_lot || null
        };
      });

      setProducts(productsWithNames);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les produits',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, toast]);

  // Générer un code interne pour un produit
  const generateInternalCode = useCallback(async (productId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('generate_internal_product_code', {
        p_product_id: productId
      });

      if (error) {
        console.error('Erreur génération code:', error);
        throw error;
      }

      // Rafraîchir les produits
      await fetchProducts();
      
      return data as string;
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le code interne',
        variant: 'destructive'
      });
      return null;
    }
  }, [fetchProducts, toast]);

  // Générer des codes internes pour tous les produits sélectionnés sans code
  const generateCodesForSelected = useCallback(async (): Promise<number> => {
    const productsNeedingCode = products.filter(
      p => selectedProducts.has(p.id) && !p.code_cip && !p.code_barre_externe
    );

    if (productsNeedingCode.length === 0) {
      toast({
        title: 'Information',
        description: 'Tous les produits sélectionnés ont déjà un code',
      });
      return 0;
    }

    setGenerating(true);
    let successCount = 0;

    try {
      for (const product of productsNeedingCode) {
        const code = await generateInternalCode(product.id);
        if (code) successCount++;
      }

      toast({
        title: 'Codes générés',
        description: `${successCount} code(s) interne(s) généré(s)`,
      });

      return successCount;
    } finally {
      setGenerating(false);
    }
  }, [products, selectedProducts, generateInternalCode, toast]);

  // Convertir les produits en données d'étiquettes
  const getLabelsData = useCallback((): EnhancedLabelData[] => {
    const pharmacyInfo = getPharmacyInfo();
    const pharmacyName = pharmacyInfo?.name || 'PHARMACIE';

    return products
      .filter(p => selectedProducts.has(p.id))
      .map(product => ({
        id: product.id,
        nom: product.libelle_produit,
        code_cip: product.code_cip,
        code_barre_externe: product.code_barre_externe,
        prix_vente: product.prix_vente_ttc || 0,
        dci: product.dci_nom || null,
        date_peremption: product.date_peremption || null,
        numero_lot: product.numero_lot || null,
        pharmacyName,
        supplierPrefix: product.laboratoire_libelle?.substring(0, 3).toUpperCase() || '---'
      }));
  }, [products, selectedProducts, getPharmacyInfo]);

  // Imprimer les étiquettes
  const printLabels = useCallback(async () => {
    const labelsData = getLabelsData();
    
    if (labelsData.length === 0) {
      toast({
        title: 'Attention',
        description: 'Aucun produit sélectionné',
        variant: 'destructive'
      });
      return;
    }

    setGenerating(true);
    try {
      const pdfUrl = await printEnhancedLabels(labelsData, config);
      openPrintDialog(pdfUrl);
      
      toast({
        title: 'Étiquettes générées',
        description: `${labelsData.length * config.quantity} étiquette(s) prête(s) à imprimer`,
      });
    } catch (error) {
      console.error('Erreur impression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer les étiquettes',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  }, [getLabelsData, config, toast]);

  // Sélection des produits
  const toggleProduct = useCallback((productId: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedProducts(new Set(products.map(p => p.id)));
  }, [products]);

  const deselectAll = useCallback(() => {
    setSelectedProducts(new Set());
  }, []);

  return {
    products,
    loading,
    generating,
    selectedProducts,
    config,
    setConfig,
    fetchProducts,
    generateInternalCode,
    generateCodesForSelected,
    printLabels,
    toggleProduct,
    selectAll,
    deselectAll,
    getLabelsData
  };
}
