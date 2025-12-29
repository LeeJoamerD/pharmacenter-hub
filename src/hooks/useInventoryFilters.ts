import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export interface RayonOption {
  id: string;
  libelle: string;
}

export interface FournisseurOption {
  id: string;
  nom: string;
}

export interface EmplacementOption {
  value: string;
  label: string;
}

export const useInventoryFilters = () => {
  const [rayons, setRayons] = useState<RayonOption[]>([]);
  const [fournisseurs, setFournisseurs] = useState<FournisseurOption[]>([]);
  const [emplacements, setEmplacements] = useState<EmplacementOption[]>([]);
  const [loading, setLoading] = useState(true);
  const { tenantId } = useTenant();

  const fetchFilters = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch rayons
      const { data: rayonsData } = await supabase
        .from("rayons_produits")
        .select("id, libelle_rayon")
        .eq("tenant_id", tenantId)
        .order("libelle_rayon");

      if (rayonsData) {
        setRayons(rayonsData.map(r => ({ id: r.id, libelle: r.libelle_rayon })));
      }

      // Fetch fournisseurs
      const { data: fournisseursData } = await supabase
        .from("fournisseurs")
        .select("id, nom")
        .eq("tenant_id", tenantId)
        .order("nom");

      if (fournisseursData) {
        setFournisseurs(fournisseursData as FournisseurOption[]);
      }

      // Fetch distinct emplacements from lots
      const { data: emplacementsData } = await supabase
        .from("lots")
        .select("emplacement")
        .eq("tenant_id", tenantId)
        .not("emplacement", "is", null)
        .gt("quantite_restante", 0);

      if (emplacementsData) {
        const uniqueEmplacements = [...new Set(emplacementsData.map(e => e.emplacement).filter(Boolean))];
        setEmplacements(uniqueEmplacements.map(e => ({ value: e!, label: e! })));
      }

    } catch (error) {
      console.error("Erreur chargement filtres inventaire:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Fonction de prévisualisation du nombre de produits
  const previewItemsCount = useCallback(async (
    type: string,
    filtresRayon?: string[],
    filtresFournisseur?: string[],
    filtresEmplacement?: string[],
    filtresPeremptionJours?: number,
    cycliqueJours?: number
  ) => {
    if (!tenantId) return { success: false, count: 0 };

    try {
      const { data, error } = await supabase.rpc("preview_inventaire_items_count", {
        p_tenant_id: tenantId,
        p_type_inventaire: type,
        p_filtres_rayon: filtresRayon && filtresRayon.length > 0 ? filtresRayon : null,
        p_filtres_fournisseur: filtresFournisseur && filtresFournisseur.length > 0 ? filtresFournisseur : null,
        p_filtres_emplacement: filtresEmplacement && filtresEmplacement.length > 0 ? filtresEmplacement : null,
        p_filtres_peremption_jours: filtresPeremptionJours || null,
        p_cyclique_jours: cycliqueJours || 30
      });

      if (error) throw error;
      
      // La fonction SQL retourne un INTEGER directement
      return { success: true, count: (data as number) || 0 };
    } catch (error) {
      console.error("Erreur prévisualisation:", error);
      return { success: false, count: 0 };
    }
  }, [tenantId]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  return {
    rayons,
    fournisseurs,
    emplacements,
    loading,
    previewItemsCount,
    refetch: fetchFilters
  };
};
