import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  dci?: { nom_dci: string | null } | null;
  laboratoires?: { libelle: string | null } | null;
}

type ProductQueryResult = {
  id: string;
  libelle_produit: string;
  code_cip: string | null;
  code_barre_externe: string | null;
  prix_vente_ttc: number | null;
  dci: { nom_dci: string } | null;
  laboratoires: { libelle: string } | null;
};

export function useLabelPrinting() {
  const [products, setProducts] = useState<ProductForLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [config, setConfig] = useState<LabelConfig>(DEFAULT_LABEL_CONFIG);
  const { toast } = useToast();
  const { getPharmacyInfo } = useGlobalSystemSettings();

  // Récupérer les produits avec leurs relations
  const fetchProducts = useCallback(async (searchTerm?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('produits')
        .select(`
          id,
          libelle_produit,
          code_cip,
          code_barre_externe,
          prix_vente_ttc,
          dci(nom_dci),
          laboratoires(libelle)
        `)
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

      setProducts((data as unknown as ProductForLabel[]) || []);
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
  }, [toast]);

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
        dci: product.dci?.nom_dci || null,
        pharmacyName,
        supplierPrefix: product.laboratoires?.libelle?.substring(0, 3).toUpperCase() || '---'
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
