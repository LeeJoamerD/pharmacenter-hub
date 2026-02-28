/**
 * Hook pour la gestion des factures proforma
 * CRUD + conversion en vente réelle
 */
import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { updateStockAfterSale } from '@/utils/stockUpdater';

export interface ProformaCartItem {
  produit_id: string;
  libelle_produit: string;
  code_cip: string | null;
  quantite: number;
  prix_unitaire_ht: number;
  prix_unitaire_ttc: number;
  taux_tva: number;
  remise_ligne: number;
  montant_ligne_ttc: number;
}

export interface CreateProformaData {
  client_id?: string;
  client_nom?: string;
  items: ProformaCartItem[];
  notes?: string;
  validite_jours?: number;
  remise_globale?: number;
}

export interface ProformaRecord {
  id: string;
  numero_proforma: string;
  date_proforma: string;
  client_id: string | null;
  client_nom: string | null;
  montant_total_ht: number;
  montant_tva: number;
  montant_total_ttc: number;
  remise_globale: number;
  montant_net: number;
  statut: string;
  validite_jours: number;
  date_expiration: string | null;
  vente_id: string | null;
  agent_id: string | null;
  notes: string | null;
  created_at: string;
  lignes_proforma?: any[];
}

export const useProformaManager = () => {
  const { tenantId, currentUser } = useTenant();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Liste des proformas
  const { data: proformas = [], isLoading, refetch } = useQuery({
    queryKey: ['proformas', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('proformas')
        .select(`
          *,
          lignes_proforma(*)
        `)
        .eq('tenant_id', tenantId)
        .order('date_proforma', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as ProformaRecord[];
    },
    enabled: !!tenantId,
  });

  // Créer une proforma
  const createProforma = useCallback(async (data: CreateProformaData): Promise<{ id: string; numero: string } | null> => {
    if (!tenantId) return null;
    setIsCreating(true);

    try {
      // 1. Générer le numéro
      const { data: numero, error: numError } = await supabase.rpc('generate_proforma_number', {
        p_tenant_id: tenantId
      });
      if (numError) throw numError;

      // 2. Calculs totaux
      const totalHT = data.items.reduce((s, i) => s + (i.prix_unitaire_ht * i.quantite - i.remise_ligne), 0);
      const totalTTC = data.items.reduce((s, i) => s + i.montant_ligne_ttc, 0);
      const totalTVA = totalTTC - totalHT;
      const remise = data.remise_globale || 0;
      const montantNet = totalTTC - remise;
      const validiteJours = data.validite_jours || 30;
      const dateExpiration = new Date();
      dateExpiration.setDate(dateExpiration.getDate() + validiteJours);

      // 3. Insérer la proforma
      const { data: proforma, error: proError } = await supabase
        .from('proformas')
        .insert({
          tenant_id: tenantId,
          numero_proforma: numero as string,
          client_id: data.client_id || null,
          client_nom: data.client_nom || null,
          montant_total_ht: totalHT,
          montant_tva: totalTVA,
          montant_total_ttc: totalTTC,
          remise_globale: remise,
          montant_net: montantNet,
          validite_jours: validiteJours,
          date_expiration: dateExpiration.toISOString(),
          agent_id: currentUser?.id || null,
          notes: data.notes || null,
          statut: 'En attente',
        })
        .select('id')
        .single();

      if (proError) throw proError;

      // 4. Insérer les lignes
      const lignes = data.items.map(item => ({
        tenant_id: tenantId,
        proforma_id: proforma.id,
        produit_id: item.produit_id,
        libelle_produit: item.libelle_produit,
        code_cip: item.code_cip,
        quantite: item.quantite,
        prix_unitaire_ht: item.prix_unitaire_ht,
        prix_unitaire_ttc: item.prix_unitaire_ttc,
        taux_tva: item.taux_tva,
        remise_ligne: item.remise_ligne,
        montant_ligne_ttc: item.montant_ligne_ttc,
      }));

      const { error: lignesError } = await supabase
        .from('lignes_proforma')
        .insert(lignes);

      if (lignesError) throw lignesError;

      queryClient.invalidateQueries({ queryKey: ['proformas'] });
      toast.success(`Proforma ${numero} créée avec succès`);
      return { id: proforma.id, numero: numero as string };
    } catch (error: any) {
      console.error('Erreur création proforma:', error);
      toast.error('Erreur lors de la création de la proforma: ' + error.message);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [tenantId, currentUser, queryClient]);

  // Convertir en vente
  const convertToSale = useCallback(async (proformaId: string, sessionCaisseId: string, caisseId: string): Promise<boolean> => {
    if (!tenantId) return false;
    setIsConverting(true);

    try {
      // 1. Récupérer la proforma et ses lignes
      const { data: proforma, error: fetchError } = await supabase
        .from('proformas')
        .select('*, lignes_proforma(*)')
        .eq('id', proformaId)
        .single();

      if (fetchError) throw fetchError;
      if (proforma.statut !== 'En attente') {
        toast.error('Cette proforma ne peut plus être convertie');
        return false;
      }

      const lignes = proforma.lignes_proforma || [];

      // 2. Vérifier le stock disponible pour chaque produit
      const stockIssues: string[] = [];
      for (const ligne of lignes) {
        const { data: lots } = await supabase
          .from('lots')
          .select('quantite_restante')
          .eq('tenant_id', tenantId)
          .eq('produit_id', ligne.produit_id)
          .gt('quantite_restante', 0);

        const stockDispo = (lots || []).reduce((s: number, l: any) => s + l.quantite_restante, 0);
        if (stockDispo < ligne.quantite) {
          stockIssues.push(`${ligne.libelle_produit}: besoin ${ligne.quantite}, dispo ${stockDispo}`);
        }
      }

      if (stockIssues.length > 0) {
        toast.error('Stock insuffisant pour: ' + stockIssues.join(', '));
        return false;
      }

      // 3. Générer un numéro de vente
      const { data: numeroVente, error: numError } = await supabase.rpc('generate_pos_invoice_number', {
        p_tenant_id: tenantId
      });
      if (numError) throw numError;

      // 4. Créer la vente
      const { data: vente, error: venteError } = await supabase
        .from('ventes')
        .insert({
          tenant_id: tenantId,
          numero_vente: numeroVente as string,
          date_vente: new Date().toISOString(),
          montant_total_ht: Number(proforma.montant_total_ht),
          montant_tva: Number(proforma.montant_tva),
          montant_total_ttc: Number(proforma.montant_total_ttc),
          remise_globale: Number(proforma.remise_globale),
          montant_net: Number(proforma.montant_net),
          montant_paye: Number(proforma.montant_net),
          montant_rendu: 0,
          mode_paiement: 'Espèces' as const,
          statut: 'Finalisée' as const,
          client_id: proforma.client_id,
          session_caisse_id: sessionCaisseId,
          caisse_id: caisseId,
          agent_id: currentUser?.id || null,
        })
        .select('id')
        .single();

      if (venteError) throw venteError;

      // 5. Créer les lignes de vente et déduire le stock FIFO
      for (const ligne of lignes) {
        // Déduire le stock
        await updateStockAfterSale(
          ligne.produit_id,
          ligne.quantite,
          tenantId,
          vente.id,
          'Conversion proforma ' + proforma.numero_proforma
        );

        // Insérer la ligne de vente
        await supabase.from('lignes_ventes').insert({
          tenant_id: tenantId,
          vente_id: vente.id,
          produit_id: ligne.produit_id,
          quantite: Number(ligne.quantite),
          prix_unitaire_ht: Number(ligne.prix_unitaire_ht),
          prix_unitaire_ttc: Number(ligne.prix_unitaire_ttc),
          montant_ligne_ttc: Number(ligne.montant_ligne_ttc),
          taux_tva: Number(ligne.taux_tva),
        });
      }

      // 6. Mettre à jour le statut de la proforma
      await supabase
        .from('proformas')
        .update({ statut: 'Convertie', vente_id: vente.id })
        .eq('id', proformaId);

      queryClient.invalidateQueries({ queryKey: ['proformas'] });
      toast.success(`Proforma convertie en vente ${numeroVente}`);
      return true;
    } catch (error: any) {
      console.error('Erreur conversion proforma:', error);
      toast.error('Erreur lors de la conversion: ' + error.message);
      return false;
    } finally {
      setIsConverting(false);
    }
  }, [tenantId, currentUser, queryClient]);

  // Annuler une proforma
  const cancelProforma = useCallback(async (proformaId: string) => {
    try {
      const { error } = await supabase
        .from('proformas')
        .update({ statut: 'Annulée' })
        .eq('id', proformaId);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['proformas'] });
      toast.success('Proforma annulée');
    } catch (error: any) {
      toast.error('Erreur: ' + error.message);
    }
  }, [queryClient]);

  // Récupérer une proforma avec ses lignes
  const getProforma = useCallback(async (proformaId: string): Promise<ProformaRecord | null> => {
    const { data, error } = await supabase
      .from('proformas')
      .select('*, lignes_proforma(*)')
      .eq('id', proformaId)
      .single();

    if (error) return null;
    return data as ProformaRecord;
  }, []);

  return {
    proformas,
    isLoading,
    isCreating,
    isConverting,
    createProforma,
    convertToSale,
    cancelProforma,
    getProforma,
    refetch,
  };
};
