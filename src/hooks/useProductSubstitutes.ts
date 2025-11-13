import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantQuery } from './useTenantQuery';

export interface SubstituteProduct {
  id: string;
  produit_principal_id: string;
  produit_substitut_id: string;
  priorite: number;
  raison_substitution?: string;
  efficacite_validee: boolean;
  nombre_utilisations: number;
  substitut_info?: {
    libelle_produit: string;
    code_cip: string;
    prix_vente_ttc: number;
    stock_actuel: number;
  };
}

export interface SubstituteSuggestion {
  id: string;
  libelle_produit: string;
  code_cip: string;
  famille_id?: string;
  classe_therapeutique_id?: string;
  prix_vente_ttc: number;
  stock_actuel: number;
  similarity_score: number;
}

export const useProductSubstitutes = () => {
  const { useTenantQueryWithCache } = useTenantQuery();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer tous les substituts configurés
  const { data: substitutes = [], refetch } = useTenantQueryWithCache(
    ['product-substitutes'],
    'produits_substituts',
    '*',
    { is_active: true }
  );

  // Récupérer les substituts pour un produit spécifique
  const getSubstitutesForProduct = async (productId: string): Promise<SubstituteProduct[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!personnel) return [];

      const { data, error } = await supabase
        .from('produits_substituts')
        .select('*')
        .eq('tenant_id', personnel.tenant_id)
        .eq('produit_principal_id', productId)
        .eq('is_active', true)
        .order('priorite', { ascending: true });

      if (error) throw error;

      // Récupérer les informations des produits substituts et leur stock
      const substitutesWithStock = await Promise.all(
        (data || []).map(async (sub) => {
          // Récupérer les infos du produit substitut
          const { data: produitData } = await supabase
            .from('produits_with_stock')
            .select('libelle_produit, code_cip, prix_vente_ttc, stock_actuel')
            .eq('id', sub.produit_substitut_id)
            .single();

          return {
            ...sub,
            substitut_info: produitData
              ? {
                  libelle_produit: produitData.libelle_produit,
                  code_cip: produitData.code_cip || '',
                  prix_vente_ttc: produitData.prix_vente_ttc || 0,
                  stock_actuel: produitData.stock_actuel || 0,
                }
              : undefined,
          };
        })
      );

      return substitutesWithStock;
    } catch (error) {
      console.error('Error fetching substitutes:', error);
      return [];
    }
  };

  // Rechercher des suggestions de substituts intelligents
  const searchSubstituteSuggestions = async (
    productId: string,
    familleId?: string,
    classeTherapeutiqueId?: string
  ): Promise<SubstituteSuggestion[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!personnel) return [];

      // Construire la requête de base
      let query = supabase
        .from('produits_with_stock')
        .select('id, libelle_produit, code_cip, famille_id, classe_therapeutique_id, prix_vente_ttc, stock_actuel')
        .eq('tenant_id', personnel.tenant_id)
        .eq('is_active', true)
        .neq('id', productId);

      // Filtrer par famille ou classe thérapeutique
      if (familleId) {
        query = query.eq('famille_id', familleId);
      }
      if (classeTherapeutiqueId) {
        query = query.eq('classe_therapeutique_id', classeTherapeutiqueId);
      }

      const { data: products, error } = await query.limit(20);
      if (error) throw error;

      // Calculer le stock pour chaque produit et son score de similarité
      const suggestions = await Promise.all(
        (products || []).map(async (product) => {
          const stockActuel = product.stock_actuel || 0;

          // Calculer un score de similarité simple (basé sur famille et classe)
          let similarityScore = 0;
          if (product.famille_id === familleId) similarityScore += 50;
          if (product.classe_therapeutique_id === classeTherapeutiqueId) similarityScore += 30;
          if (stockActuel > 0) similarityScore += 20;

          return {
            ...product,
            stock_actuel: stockActuel,
            similarity_score: similarityScore,
          };
        })
      );

      // Trier par score de similarité et stock disponible
      return suggestions
        .filter((s) => s.stock_actuel > 0)
        .sort((a, b) => b.similarity_score - a.similarity_score);
    } catch (error) {
      console.error('Error searching substitute suggestions:', error);
      return [];
    }
  };

  // Créer un nouveau substitut
  const createSubstitute = async (
    productPrincipalId: string,
    productSubstitutId: string,
    priorite: number = 1,
    raisonSubstitution?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!personnel) throw new Error('Personnel non trouvé');

      const { error } = await supabase.from('produits_substituts').insert({
        tenant_id: personnel.tenant_id,
        produit_principal_id: productPrincipalId,
        produit_substitut_id: productSubstitutId,
        priorite,
        raison_substitution: raisonSubstitution,
      });

      if (error) throw error;

      await refetch();
      queryClient.invalidateQueries({ queryKey: ['product-substitutes'] });
      return true;
    } catch (error) {
      console.error('Error creating substitute:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour un substitut
  const updateSubstitute = async (
    substituteId: string,
    updates: Partial<SubstituteProduct>
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('produits_substituts')
        .update(updates)
        .eq('id', substituteId);

      if (error) throw error;

      await refetch();
      queryClient.invalidateQueries({ queryKey: ['product-substitutes'] });
      return true;
    } catch (error) {
      console.error('Error updating substitute:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Enregistrer l'utilisation d'un substitut
  const recordSubstituteUsage = async (substituteId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: substitute } = await supabase
        .from('produits_substituts')
        .select('nombre_utilisations')
        .eq('id', substituteId)
        .single();

      if (!substitute) throw new Error('Substitut non trouvé');

      const { error } = await supabase
        .from('produits_substituts')
        .update({
          nombre_utilisations: substitute.nombre_utilisations + 1,
          date_derniere_utilisation: new Date().toISOString(),
        })
        .eq('id', substituteId);

      if (error) throw error;

      await refetch();
      return true;
    } catch (error) {
      console.error('Error recording substitute usage:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer un substitut
  const deleteSubstitute = async (substituteId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('produits_substituts')
        .update({ is_active: false })
        .eq('id', substituteId);

      if (error) throw error;

      await refetch();
      queryClient.invalidateQueries({ queryKey: ['product-substitutes'] });
      return true;
    } catch (error) {
      console.error('Error deleting substitute:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    substitutes,
    isLoading,
    getSubstitutesForProduct,
    searchSubstituteSuggestions,
    createSubstitute,
    updateSubstitute,
    recordSubstituteUsage,
    deleteSubstitute,
    refetch,
  };
};