import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { 
  LabelConfig, 
  DEFAULT_LABEL_CONFIG,
  printLotLabels,
  LotLabelData,
  openPrintDialog
} from '@/utils/labelPrinterEnhanced';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { useRegionalSettings } from '@/hooks/useRegionalSettings';

export interface LotForLabel {
  id: string;
  numero_lot: string;
  code_barre: string | null;
  date_peremption: string | null;
  quantite_restante: number;
  prix_vente_ttc: number | null;
  produit: {
    id: string;
    libelle_produit: string;
    dci_nom?: string | null;  // Pour l'option "Inclure DCI"
  };
  fournisseur: {
    nom: string;
  } | null;
}

export function useLotLabelPrinting() {
  const [lots, setLots] = useState<LotForLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedLots, setSelectedLots] = useState<Set<string>>(new Set());
  const [config, setConfig] = useState<LabelConfig>(DEFAULT_LABEL_CONFIG);
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { getPharmacyInfo } = useGlobalSystemSettings();
  const { currency } = useRegionalSettings();

  // Récupérer les lots avec code-barres
  const fetchLots = useCallback(async (searchTerm?: string) => {
    if (!tenantId) {
      console.log('Pas de tenant ID disponible');
      return;
    }

    setLoading(true);
    try {
      // Charger les produits, fournisseurs et DCI en parallèle
      const [produitsResult, fournisseursResult, dciResult] = await Promise.all([
        supabase.from('produits').select('id, libelle_produit, dci_id').eq('tenant_id', tenantId),
        supabase.from('fournisseurs').select('id, nom').eq('tenant_id', tenantId),
        supabase.from('dci').select('id, nom_dci')  // Table DCI globale
      ]);

      // Map DCI
      const dciMap = new Map<string, string>();
      if (dciResult.data) {
        dciResult.data.forEach(d => dciMap.set(d.id, d.nom_dci || ''));
      }

      // Créer des maps de lookup
      const produitMap = new Map<string, { libelle_produit: string; dci_nom?: string | null }>();
      if (produitsResult.data) {
        produitsResult.data.forEach(p => {
          const dciNom = p.dci_id ? dciMap.get(p.dci_id) : null;
          produitMap.set(p.id, { libelle_produit: p.libelle_produit, dci_nom: dciNom });
        });
      }

      const fournisseurMap = new Map<string, { nom: string }>();
      if (fournisseursResult.data) {
        fournisseursResult.data.forEach(f => fournisseurMap.set(f.id, { nom: f.nom }));
      }

      // Requête principale sur les lots avec code_barre
      // Note: Utilisation de 'as any' car le type généré n'inclut pas encore la colonne code_barre
      let query = supabase
        .from('lots')
        .select('id, produit_id, fournisseur_id, numero_lot, code_barre, date_peremption, quantite_restante, prix_vente_ttc' as any)
        .eq('tenant_id', tenantId)
        .gt('quantite_restante', 0)
        .order('date_reception', { ascending: false })
        .limit(200);

      const { data: rawData, error } = await query;

      if (error) {
        console.error('Erreur fetch lots:', error);
        throw error;
      }

      // Filtrer les lots qui ont un code_barre et le caster
      const data = (rawData as any[] || []).filter((lot: any) => lot.code_barre);

      // Combiner les données
      let lotsWithNames: LotForLabel[] = (data || []).map(lot => {
        const produit = produitMap.get(lot.produit_id);
        const fournisseur = lot.fournisseur_id ? fournisseurMap.get(lot.fournisseur_id) : null;
        
        return {
          id: lot.id,
          numero_lot: lot.numero_lot,
          code_barre: lot.code_barre,
          date_peremption: lot.date_peremption,
          quantite_restante: lot.quantite_restante,
          prix_vente_ttc: lot.prix_vente_ttc,
          produit: {
            id: lot.produit_id,
            libelle_produit: produit?.libelle_produit || 'Produit inconnu',
            dci_nom: produit?.dci_nom || null
          },
          fournisseur: fournisseur ? { nom: fournisseur.nom } : null
        };
      });

      // Filtrer par terme de recherche si fourni
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        lotsWithNames = lotsWithNames.filter(lot => 
          lot.produit.libelle_produit.toLowerCase().includes(term) ||
          lot.numero_lot.toLowerCase().includes(term) ||
          (lot.code_barre && lot.code_barre.toLowerCase().includes(term))
        );
      }

      setLots(lotsWithNames);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les lots',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, toast]);

  // Convertir les lots en données d'étiquettes
  const getLotsLabelsData = useCallback((): LotLabelData[] => {
    const pharmacyInfo = getPharmacyInfo();
    const pharmacyName = pharmacyInfo?.name || 'PHARMACIE';
    // Utiliser le symbole de devise des paramètres régionaux
    const currencySymbol = currency || 'FCFA';

    return lots
      .filter(l => selectedLots.has(l.id) && l.code_barre)
      .map(lot => ({
        id: lot.id,
        code_barre: lot.code_barre!,
        numero_lot: lot.numero_lot,
        date_peremption: lot.date_peremption,
        nom_produit: lot.produit.libelle_produit,
        prix_vente: lot.prix_vente_ttc || 0,
        pharmacyName,
        supplierPrefix: lot.fournisseur?.nom?.substring(0, 3).toUpperCase() || '---',
        // Champs enrichis
        quantite_restante: lot.quantite_restante,
        currencySymbol,
        dci: lot.produit.dci_nom || null
      }));
  }, [lots, selectedLots, getPharmacyInfo, currency]);

  // Imprimer les étiquettes lots
  const printLotLabelsAction = useCallback(async () => {
    const labelsData = getLotsLabelsData();
    
    if (labelsData.length === 0) {
      toast({
        title: 'Attention',
        description: 'Aucun lot sélectionné avec code-barres',
        variant: 'destructive'
      });
      return;
    }

    setGenerating(true);
    try {
      const pdfUrl = await printLotLabels(labelsData, config);
      openPrintDialog(pdfUrl);
      
      // Calculer le nombre total d'étiquettes basé sur le stock
      const totalLabels = labelsData.reduce((sum, lot) => sum + (lot.quantite_restante || 1), 0);
      
      toast({
        title: 'Étiquettes générées',
        description: `${totalLabels} étiquette(s) lot prête(s) à imprimer`,
      });
    } catch (error) {
      console.error('Erreur impression lots:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer les étiquettes lot',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  }, [getLotsLabelsData, config, toast]);

  // Sélection des lots
  const toggleLot = useCallback((lotId: string) => {
    setSelectedLots(prev => {
      const next = new Set(prev);
      if (next.has(lotId)) {
        next.delete(lotId);
      } else {
        next.add(lotId);
      }
      return next;
    });
  }, []);

  const selectAllLots = useCallback(() => {
    setSelectedLots(new Set(lots.map(l => l.id)));
  }, [lots]);

  const deselectAllLots = useCallback(() => {
    setSelectedLots(new Set());
  }, []);

  return {
    lots,
    loading,
    generating,
    selectedLots,
    config,
    setConfig,
    fetchLots,
    printLotLabelsAction,
    toggleLot,
    selectAllLots,
    deselectAllLots,
    getLotsLabelsData
  };
}
