import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedPricingService } from '@/services/UnifiedPricingService';
// Type pour la région tarifaire (Brazzaville = prix référence, Pointe-Noire = prix référence PNR)
export type PriceRegion = 'brazzaville' | 'pointe-noire';

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
  prix_achat_reference_pnr: number | null;
  prix_vente_reference_pnr: number | null;
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

/**
 * Divise un tableau en chunks de taille spécifiée
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export const useGlobalCatalogLookup = () => {
  const { toast } = useToast();
  const { personnel } = useAuth();
  const tenantId = personnel?.tenant_id;

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
   * Recherche groupée de produits dans le catalogue global
   * Utilise le chunking pour gérer les gros volumes (évite ERR_QUIC_PROTOCOL_ERROR)
   */
  const searchGlobalCatalogBatch = async (codes: string[]): Promise<Map<string, GlobalCatalogProduct>> => {
    const result = new Map<string, GlobalCatalogProduct>();
    if (codes.length === 0) return result;

    const CHUNK_SIZE = 200;
    const normalizedCodes = [...new Set(codes.map(c => String(c).trim()).filter(c => c.length > 0))];
    const chunks = chunkArray(normalizedCodes, CHUNK_SIZE);

    try {
      // Recherche par code_cip en parallèle sur tous les chunks
      const cipPromises = chunks.map(chunk =>
        supabase
          .from('catalogue_global_produits')
          .select('*')
          .in('code_cip', chunk)
      );
      const cipResults = await Promise.all(cipPromises);

      // Collecter les codes trouvés par code_cip
      const foundByCip = new Set<string>();
      cipResults.forEach(r => {
        (r.data || []).forEach((product: GlobalCatalogProduct) => {
          result.set(product.code_cip, product);
          foundByCip.add(product.code_cip);
          if (product.ancien_code_cip) {
            result.set(product.ancien_code_cip, product);
          }
        });
      });

      // Filtrer les codes non trouvés pour chercher dans ancien_code_cip
      const notFoundCodes = normalizedCodes.filter(c => !result.has(c));
      if (notFoundCodes.length > 0) {
        const ancienChunks = chunkArray(notFoundCodes, CHUNK_SIZE);
        const ancienCipPromises = ancienChunks.map(chunk =>
          supabase
            .from('catalogue_global_produits')
            .select('*')
            .in('ancien_code_cip', chunk)
        );
        const ancienCipResults = await Promise.all(ancienCipPromises);

        ancienCipResults.forEach(r => {
          (r.data || []).forEach((product: GlobalCatalogProduct) => {
            result.set(product.code_cip, product);
            if (product.ancien_code_cip) {
              result.set(product.ancien_code_cip, product);
            }
          });
        });
      }
    } catch (error) {
      console.error('Erreur recherche groupée catalogue global:', error);
    }

    return result;
  };

  /**
   * Vérifie en batch quels codes CIP existent déjà dans le catalogue local
   */
  const checkExistingProductsBatch = async (codes: string[]): Promise<Set<string>> => {
    const existingCodes = new Set<string>();
    if (!tenantId || codes.length === 0) return existingCodes;

    const CHUNK_SIZE = 200;
    const normalizedCodes = [...new Set(codes.map(c => String(c).trim()).filter(c => c.length > 0))];
    const chunks = chunkArray(normalizedCodes, CHUNK_SIZE);

    try {
      const promises = chunks.map(chunk =>
        supabase
          .from('produits')
          .select('code_cip, ancien_code_cip')
          .eq('tenant_id', tenantId)
          .or(`code_cip.in.(${chunk.join(',')}),ancien_code_cip.in.(${chunk.join(',')})`)
      );

      const results = await Promise.all(promises);
      results.forEach(r => {
        (r.data || []).forEach(p => {
          if (p.code_cip) existingCodes.add(p.code_cip);
          if (p.ancien_code_cip) existingCodes.add(p.ancien_code_cip);
        });
      });
    } catch (error) {
      console.error('Erreur vérification produits existants batch:', error);
    }

    return existingCodes;
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
   * Recherche ou crée une catégorie de tarification par libellé
   * Pattern "Find or Create" comme pour les autres référentiels
   */
  const findOrCreatePricingCategoryByLabel = async (libelle: string | null): Promise<string | undefined> => {
    if (!libelle || !tenantId) return undefined;

    const normalizedLibelle = libelle.trim().toUpperCase();

    // Recherche existante
    const { data: existing, error: searchError } = await supabase
      .from('categorie_tarification')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('libelle_categorie', normalizedLibelle)
      .maybeSingle();

    if (searchError) {
      console.error('Erreur recherche catégorie tarification:', searchError);
    }

    if (existing) return existing.id;

    // Création si non trouvé
    const { data: created, error: insertError } = await supabase
      .from('categorie_tarification')
      .insert({ 
        tenant_id: tenantId, 
        libelle_categorie: normalizedLibelle 
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Erreur création catégorie tarification:', insertError);
      
      // Si l'insert a réussi mais le SELECT a échoué, récupérer l'ID avec un SELECT séparé
      const { data: refetched } = await supabase
        .from('categorie_tarification')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('libelle_categorie', normalizedLibelle)
        .maybeSingle();
      
      return refetched?.id;
    }

    return created?.id;
  };

  /**
   * Mappe un produit du catalogue global vers les IDs locaux du tenant
   * Crée automatiquement les référentiels manquants
   * @param priceRegion - 'brazzaville' pour prix référence, 'pointe-noire' pour prix référence PNR
   */
  const mapToLocalReferences = async (
    globalProduct: GlobalCatalogProduct,
    priceRegion: PriceRegion = 'brazzaville'
  ): Promise<MappedProductData> => {
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

    // Récupérer les paramètres DIRECTEMENT depuis Supabase pour éviter le stale closure
    let roundingPrecision = 25;
    let roundingMethod: 'ceil' | 'floor' | 'round' | 'none' = 'ceil';
    let currencyCode = 'XAF';

    if (tenantId) {
      const { data: freshParams } = await supabase
        .from('parametres_systeme')
        .select('cle_parametre, valeur_parametre')
        .eq('tenant_id', tenantId)
        .in('cle_parametre', ['stock_rounding_precision', 'sales_tax', 'default_currency']);

      if (freshParams) {
        for (const param of freshParams) {
          if (param.cle_parametre === 'stock_rounding_precision' && param.valeur_parametre) {
            roundingPrecision = parseInt(param.valeur_parametre);
          }
          if (param.cle_parametre === 'sales_tax' && param.valeur_parametre) {
            try {
              const salesTax = JSON.parse(param.valeur_parametre);
              roundingMethod = salesTax.taxRoundingMethod || 'ceil';
            } catch (e) {
              // Ignorer les erreurs de parsing
            }
          }
          if (param.cle_parametre === 'default_currency' && param.valeur_parametre) {
            currencyCode = param.valeur_parametre;
          }
        }
      }
    }

    // Sélection dynamique des prix selon la région
    const selectedPrixAchat = priceRegion === 'pointe-noire'
      ? globalProduct.prix_achat_reference_pnr
      : globalProduct.prix_achat_reference;
    
    const selectedPrixVente = priceRegion === 'pointe-noire'
      ? globalProduct.prix_vente_reference_pnr
      : globalProduct.prix_vente_reference;

    // Appliquer les paramètres d'arrondi du tenant sur le prix de vente importé
    const prix_vente_ttc = selectedPrixVente
      ? unifiedPricingService.roundToNearest(
          selectedPrixVente,
          roundingPrecision,
          roundingMethod,
          currencyCode
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
      prix_achat: selectedPrixAchat || undefined,
      prix_vente_ttc
    };
  };

  return {
    searchGlobalCatalog,
    searchGlobalCatalogBatch,
    checkExistingProductsBatch,
    mapToLocalReferences,
    findOrCreatePricingCategoryByLabel,
    parseDCIs
  };
};
