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

// Interface pour les réceptions
export interface ReceptionForLabels {
  id: string;
  numero_reception: string;
  reference_facture: string | null;
  date_reception: string;
  fournisseur_nom: string;
  statut: string;
}

// Interface pour les lots d'une réception
export interface LotFromReception {
  id: string;
  numero_lot: string;
  code_barre: string | null;
  date_peremption: string | null;
  quantite_restante: number;
  prix_vente_ttc: number | null;
  produit: {
    id: string;
    libelle_produit: string;
    dci_nom?: string | null;
  };
  reception: {
    numero_reception: string;
    reference_facture: string | null;
  };
  fournisseur: {
    nom: string;
  } | null;
}

export function useReceptionLabelPrinting() {
  const [receptions, setReceptions] = useState<ReceptionForLabels[]>([]);
  const [selectedReception, setSelectedReception] = useState<ReceptionForLabels | null>(null);
  const [lotsFromReception, setLotsFromReception] = useState<LotFromReception[]>([]);
  const [loading, setLoading] = useState(false);
  const [lotsLoading, setLotsLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedLots, setSelectedLots] = useState<Set<string>>(new Set());
  const [config, setConfig] = useState<LabelConfig>(DEFAULT_LABEL_CONFIG);
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { getPharmacyInfo } = useGlobalSystemSettings();
  const { currency } = useRegionalSettings();

  // Rechercher les réceptions par numéro ou référence facture
  const fetchReceptions = useCallback(async (searchTerm?: string) => {
    if (!tenantId) {
      console.log('Pas de tenant ID disponible');
      return;
    }

    setLoading(true);
    try {
      // Charger les fournisseurs en parallèle
      const { data: fournisseursData } = await supabase
        .from('fournisseurs')
        .select('id, nom')
        .eq('tenant_id', tenantId);

      const fournisseurMap = new Map<string, string>();
      if (fournisseursData) {
        fournisseursData.forEach(f => fournisseurMap.set(f.id, f.nom));
      }

      // Requête sur les réceptions validées
      let query = supabase
        .from('receptions_fournisseurs')
        .select('id, numero_reception, reference_facture, date_reception, fournisseur_id, statut')
        .eq('tenant_id', tenantId)
        .eq('statut', 'Validé')
        .order('date_reception', { ascending: false })
        .limit(50);

      // Filtrer par terme de recherche si fourni
      if (searchTerm && searchTerm.trim()) {
        query = query.or(`numero_reception.ilike.%${searchTerm}%,reference_facture.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur fetch réceptions:', error);
        throw error;
      }

      // Mapper les données avec les noms de fournisseurs
      const receptionsData: ReceptionForLabels[] = (data || []).map(r => ({
        id: r.id,
        numero_reception: r.numero_reception || `REC-${r.id.substring(0, 8)}`,
        reference_facture: r.reference_facture,
        date_reception: r.date_reception,
        fournisseur_nom: r.fournisseur_id ? fournisseurMap.get(r.fournisseur_id) || 'Fournisseur inconnu' : 'N/A',
        statut: r.statut || 'Validé'
      }));

      setReceptions(receptionsData);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les réceptions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, toast]);

  // Sélectionner une réception et charger ses lots
  const selectReception = useCallback(async (reception: ReceptionForLabels) => {
    if (!tenantId) return;

    setSelectedReception(reception);
    setLotsLoading(true);
    setSelectedLots(new Set());

    try {
      // Charger les produits, fournisseurs et DCI en parallèle
      const [produitsResult, fournisseursResult, dciResult] = await Promise.all([
        supabase.from('produits').select('id, libelle_produit, dci_id').eq('tenant_id', tenantId),
        supabase.from('fournisseurs').select('id, nom').eq('tenant_id', tenantId),
        supabase.from('dci').select('id, nom_dci')
      ]);

      // Map DCI
      const dciMap = new Map<string, string>();
      if (dciResult.data) {
        dciResult.data.forEach(d => dciMap.set(d.id, d.nom_dci || ''));
      }

      // Maps de lookup
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

      // Charger les lots de cette réception
      const { data: rawData, error } = await supabase
        .from('lots')
        .select('id, produit_id, fournisseur_id, numero_lot, code_barre, date_peremption, quantite_restante, prix_vente_ttc, reception_id' as any)
        .eq('tenant_id', tenantId)
        .eq('reception_id', reception.id)
        .gt('quantite_restante', 0)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur fetch lots réception:', error);
        throw error;
      }

      // Filtrer les lots qui ont un code_barre
      const data = (rawData as any[] || []).filter((lot: any) => lot.code_barre);

      // Combiner les données
      const lotsData: LotFromReception[] = data.map(lot => {
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
          reception: {
            numero_reception: reception.numero_reception,
            reference_facture: reception.reference_facture
          },
          fournisseur: fournisseur ? { nom: fournisseur.nom } : null
        };
      });

      setLotsFromReception(lotsData);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les lots de la réception',
        variant: 'destructive'
      });
    } finally {
      setLotsLoading(false);
    }
  }, [tenantId, toast]);

  // Convertir les lots en données d'étiquettes
  const getLotsLabelsData = useCallback((): LotLabelData[] => {
    const pharmacyInfo = getPharmacyInfo();
    const pharmacyName = pharmacyInfo?.name || 'PHARMACIE';
    const currencySymbol = currency || 'FCFA';

    return lotsFromReception
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
        quantite_restante: lot.quantite_restante,
        currencySymbol,
        dci: lot.produit.dci_nom || null
      }));
  }, [lotsFromReception, selectedLots, getPharmacyInfo, currency]);

  // Imprimer les étiquettes lots
  const printReceptionLotLabels = useCallback(async () => {
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
        description: `${totalLabels} étiquette(s) de la réception ${selectedReception?.numero_reception} prête(s) à imprimer`,
      });
    } catch (error) {
      console.error('Erreur impression lots:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer les étiquettes',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  }, [getLotsLabelsData, config, toast, selectedReception]);

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
    setSelectedLots(new Set(lotsFromReception.map(l => l.id)));
  }, [lotsFromReception]);

  const deselectAllLots = useCallback(() => {
    setSelectedLots(new Set());
  }, []);

  // Réinitialiser la sélection
  const clearSelection = useCallback(() => {
    setSelectedReception(null);
    setLotsFromReception([]);
    setSelectedLots(new Set());
  }, []);

  return {
    receptions,
    selectedReception,
    lotsFromReception,
    loading,
    lotsLoading,
    generating,
    selectedLots,
    config,
    setConfig,
    fetchReceptions,
    selectReception,
    printReceptionLotLabels,
    toggleLot,
    selectAllLots,
    deselectAllLots,
    clearSelection,
    getLotsLabelsData
  };
}
