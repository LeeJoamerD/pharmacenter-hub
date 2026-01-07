import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedPricingService } from '@/services/UnifiedPricingService';
import { useUnifiedPricingParams } from '@/hooks/useUnifiedPricingParams';

interface GlobalCatalogProduct {
  id: string;
  code_cip: string;
  ancien_code_cip: string | null;
  libelle_produit: string;
  libelle_forme: string | null;
  libelle_famille: string | null;
  libelle_rayon: string | null;
  libelle_dci: string | null;
  libelle_classe_therapeutique: string | null;
  libelle_laboratoire: string | null;
  libelle_categorie_tarification: string | null;
  tva: boolean | null;
  prix_achat_reference: number | null;
  prix_vente_reference: number | null;
}

export interface MappedProductData {
  code_cip: string;
  ancien_code_cip: string;
  libelle_produit: string;
  famille_id?: string;
  rayon_id?: string;
  forme_id?: string;
  dci_ids: string[];
  classe_therapeutique_id?: string;
  laboratoires_id?: string;
  categorie_tarification_id?: string;
  prix_achat?: number;
  prix_vente_ttc?: number;
}

/**
 * Parse les DCI multiples séparés par "/"
 * Exemple: "PARACETAMOL/CODEINE/CAFEINE" -> ["PARACETAMOL", "CODEINE", "CAFEINE"]
 */
function parseDCIs(libelleDci: string | null): string[] {
  if (!libelleDci) return [];
  
  return libelleDci
    .split('/')
    .map(dci => dci.trim())
    .filter(dci => dci.length > 0);
}

export const useGlobalCatalogLookup = () => {
  const { toast } = useToast();
  const { personnel } = useAuth();
  const tenantId = personnel?.tenant_id;
  const { params: pricingParams, refetch: refetchPricingParams } = useUnifiedPricingParams();

  /**
   * Recherche un produit dans le catalogue global par code CIP
   * Vérifie d'abord code_cip, puis ancien_code_cip
   */
  const searchGlobalCatalog = async (codeCip: string): Promise<GlobalCatalogProduct | null> => {
    if (!codeCip || codeCip.length < 3) return null;

    try {
      // Recherche par code_cip
      let { data, error } = await supabase
        .from('catalogue_global_produits')
        .select('*')
        .ilike('code_cip', codeCip)
        .maybeSingle();

      if (error) throw error;

      // Si non trouvé, recherche par ancien_code_cip
      if (!data) {
        const { data: dataAncien, error: errorAncien } = await supabase
          .from('catalogue_global_produits')
          .select('*')
          .ilike('ancien_code_cip', codeCip)
          .maybeSingle();

        if (errorAncien) throw errorAncien;
        data = dataAncien;
      }

      return data as GlobalCatalogProduct | null;
    } catch (error) {
      console.error('Erreur recherche catalogue global:', error);
      return null;
    }
  };

  /**
   * Recherche ou crée une famille par libellé
   */
  const findOrCreateFamily = async (libelle: string | null): Promise<string | undefined> => {
    if (!libelle || !tenantId) return undefined;

    // Recherche existante
    const { data: existing } = await supabase
      .from('famille_produit')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('libelle_famille', libelle.trim())
      .maybeSingle();

    if (existing) return existing.id;

    // Création si non trouvé
    const { data: created } = await supabase
      .from('famille_produit')
      .insert({ tenant_id: tenantId, libelle_famille: libelle.trim().toUpperCase() })
      .select('id')
      .single();

    return created?.id;
  };

  /**
   * Recherche ou crée un rayon par libellé
   */
  const findOrCreateRayon = async (libelle: string | null): Promise<string | undefined> => {
    if (!libelle || !tenantId) return undefined;

    const { data: existing } = await supabase
      .from('rayons_produits')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('libelle_rayon', libelle.trim())
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created } = await supabase
      .from('rayons_produits')
      .insert({ tenant_id: tenantId, libelle_rayon: libelle.trim().toUpperCase() })
      .select('id')
      .single();

    return created?.id;
  };

  /**
   * Recherche ou crée une forme galénique par libellé
   */
  const findOrCreateForme = async (libelle: string | null): Promise<string | undefined> => {
    if (!libelle || !tenantId) return undefined;

    const { data: existing } = await supabase
      .from('formes_galeniques')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('libelle_forme', libelle.trim())
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created } = await supabase
      .from('formes_galeniques')
      .insert({ tenant_id: tenantId, libelle_forme: libelle.trim().toUpperCase() })
      .select('id')
      .single();

    return created?.id;
  };

  /**
   * Recherche ou crée chaque DCI et retourne leurs IDs
   * Gère les DCI multiples séparés par "/"
   */
  const findOrCreateMultipleDCIs = async (libelleDci: string | null): Promise<string[]> => {
    const dciNames = parseDCIs(libelleDci);
    if (dciNames.length === 0 || !tenantId) return [];

    const dciIds: string[] = [];

    for (const dciName of dciNames) {
      // Recherche existante
      const { data: existing } = await supabase
        .from('dci')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('nom_dci', dciName.trim())
        .maybeSingle();

      if (existing) {
        dciIds.push(existing.id);
      } else {
        // Création si non trouvé
        const { data: created } = await supabase
          .from('dci')
          .insert({ tenant_id: tenantId, nom_dci: dciName.trim().toUpperCase() })
          .select('id')
          .single();

        if (created) {
          dciIds.push(created.id);
        }
      }
    }

    return dciIds;
  };

  /**
   * Recherche ou crée une classe thérapeutique par libellé
   */
  const findOrCreateClasseTherapeutique = async (libelle: string | null): Promise<string | undefined> => {
    if (!libelle || !tenantId) return undefined;

    const { data: existing } = await supabase
      .from('classes_therapeutiques')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('libelle_classe', libelle.trim())
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created } = await supabase
      .from('classes_therapeutiques')
      .insert({ 
        tenant_id: tenantId, 
        libelle_classe: libelle.trim().toUpperCase(),
        systeme_anatomique: 'NON CLASSÉ' // Valeur par défaut
      })
      .select('id')
      .single();

    return created?.id;
  };

  /**
   * Recherche ou crée un laboratoire par libellé
   * Avec gestion d'erreur améliorée pour récupérer l'ID après insertion
   */
  const findOrCreateLaboratoire = async (libelle: string | null): Promise<string | undefined> => {
    if (!libelle || !tenantId) return undefined;

    const normalizedLibelle = libelle.trim().toUpperCase();

    // Recherche existante
    const { data: existing, error: searchError } = await supabase
      .from('laboratoires')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('libelle', normalizedLibelle)
      .maybeSingle();

    if (searchError) {
      console.error('Erreur recherche laboratoire:', searchError);
    }

    if (existing) return existing.id;

    // Création si non trouvé
    const { data: created, error: insertError } = await supabase
      .from('laboratoires')
      .insert({ tenant_id: tenantId, libelle: normalizedLibelle })
      .select('id')
      .single();

    if (insertError) {
      console.error('Erreur création laboratoire:', insertError);
      
      // Si l'insert a réussi mais le SELECT a échoué, récupérer l'ID avec un SELECT séparé
      const { data: refetched } = await supabase
        .from('laboratoires')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('libelle', normalizedLibelle)
        .maybeSingle();
      
      return refetched?.id;
    }

    return created?.id;
  };

  /**
   * Détermine la catégorie de tarification basée sur le champ tva
   * tva = TRUE → "PARAPHARMACIES AVEC TVA"
   * tva = FALSE → "MEDICAMENTS"
   */
  const findPricingCategory = async (tva: boolean | null): Promise<string | undefined> => {
    if (tva === null || !tenantId) return undefined;

    const categoryLabel = tva ? 'PARAPHARMACIES AVEC TVA' : 'MEDICAMENTS';

    const { data } = await supabase
      .from('categorie_tarification')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('libelle_categorie', categoryLabel)
      .maybeSingle();

    return data?.id;
  };

  /**
   * Mappe un produit du catalogue global vers les IDs locaux du tenant
   * Crée automatiquement les référentiels manquants
   */
  const mapToLocalReferences = async (globalProduct: GlobalCatalogProduct): Promise<MappedProductData> => {
    // Exécuter toutes les recherches/créations en parallèle pour optimiser
    const [
      famille_id,
      rayon_id,
      forme_id,
      dci_ids,
      classe_therapeutique_id,
      laboratoires_id,
      categorie_tarification_id
    ] = await Promise.all([
      findOrCreateFamily(globalProduct.libelle_famille),
      findOrCreateRayon(globalProduct.libelle_rayon),
      findOrCreateForme(globalProduct.libelle_forme),
      findOrCreateMultipleDCIs(globalProduct.libelle_dci),
      findOrCreateClasseTherapeutique(globalProduct.libelle_classe_therapeutique),
      findOrCreateLaboratoire(globalProduct.libelle_laboratoire),
      findPricingCategory(globalProduct.tva)
    ]);

    // Rafraîchir les paramètres avant utilisation pour avoir les dernières valeurs
    await refetchPricingParams();
    // Note: pricingParams sera mis à jour après le refetch grâce à React Query

    // Appliquer les paramètres d'arrondi du tenant sur le prix de vente importé
    const prix_vente_ttc = globalProduct.prix_vente_reference
      ? unifiedPricingService.roundToNearest(
          globalProduct.prix_vente_reference,
          pricingParams.roundingPrecision,
          pricingParams.taxRoundingMethod,
          pricingParams.currencyCode
        )
      : undefined;

    return {
      code_cip: globalProduct.code_cip || '',
      ancien_code_cip: globalProduct.ancien_code_cip || '',
      libelle_produit: globalProduct.libelle_produit || '',
      famille_id,
      rayon_id,
      forme_id,
      dci_ids,
      classe_therapeutique_id,
      laboratoires_id,
      categorie_tarification_id,
      prix_achat: globalProduct.prix_achat_reference || undefined,
      prix_vente_ttc
    };
  };

  return {
    searchGlobalCatalog,
    mapToLocalReferences,
    parseDCIs
  };
};
