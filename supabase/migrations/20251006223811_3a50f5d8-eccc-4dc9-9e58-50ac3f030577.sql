-- Correction de la fonction generate_sales_suggestions
-- Retirer le paramètre p_tenant_id et utiliser get_current_user_tenant_id() pour la sécurité

CREATE OR REPLACE FUNCTION public.generate_sales_suggestions()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_tenant_id UUID;
  lot_record RECORD;
  suggestion_count INTEGER := 0;
  jours_restants INTEGER;
  priority_level TEXT;
  suggested_discount NUMERIC;
  suggestion_reason TEXT;
  suggested_price NUMERIC;
BEGIN
  -- Récupérer automatiquement le tenant de l'utilisateur connecté
  current_tenant_id := public.get_current_user_tenant_id();
  
  -- Validation de sécurité
  IF current_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: Invalid tenant_id for current user';
  END IF;

  -- Supprimer les anciennes suggestions actives pour ce tenant
  DELETE FROM public.suggestions_vente 
  WHERE tenant_id = current_tenant_id 
    AND statut = 'active';

  -- Parcourir les lots avec stock restant et date de péremption proche
  FOR lot_record IN
    SELECT 
      l.id as lot_id,
      l.produit_id,
      l.numero_lot,
      l.date_peremption,
      l.quantite_restante,
      p.prix_vente_ttc,
      EXTRACT(DAY FROM (l.date_peremption - CURRENT_DATE))::INTEGER as jours_avant_expiration
    FROM public.lots l
    INNER JOIN public.produits p ON l.produit_id = p.id
    WHERE l.tenant_id = current_tenant_id
      AND l.quantite_restante > 0
      AND l.date_peremption IS NOT NULL
      AND l.date_peremption BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '180 days'
    ORDER BY l.date_peremption ASC
  LOOP
    jours_restants := lot_record.jours_avant_expiration;
    
    -- Déterminer la priorité et la remise suggérée
    IF jours_restants <= 7 THEN
      priority_level := 'haute';
      suggested_discount := 30.00;
      suggestion_reason := 'Péremption imminente - action urgente requise';
    ELSIF jours_restants <= 30 THEN
      priority_level := 'haute';
      suggested_discount := 20.00;
      suggestion_reason := 'Péremption proche - promotion recommandée';
    ELSIF jours_restants <= 60 THEN
      priority_level := 'moyenne';
      suggested_discount := 15.00;
      suggestion_reason := 'Péremption dans 2 mois - surveillance active';
    ELSIF jours_restants <= 90 THEN
      priority_level := 'moyenne';
      suggested_discount := 10.00;
      suggestion_reason := 'Péremption dans 3 mois - écoulement progressif';
    ELSE
      priority_level := 'faible';
      suggested_discount := 5.00;
      suggestion_reason := 'Stock à rotation normale';
    END IF;

    -- Calculer le prix de vente suggéré après remise
    suggested_price := lot_record.prix_vente_ttc * (1 - suggested_discount / 100);

    -- Insérer la suggestion avec gestion du conflit
    INSERT INTO public.suggestions_vente (
      tenant_id,
      lot_id,
      produit_id,
      priorite,
      prix_vente_suggere,
      remise_suggere,
      motif_suggestion,
      statut
    ) VALUES (
      current_tenant_id,
      lot_record.lot_id,
      lot_record.produit_id,
      priority_level::TEXT,
      suggested_price,
      suggested_discount,
      suggestion_reason,
      'active'
    )
    ON CONFLICT (tenant_id, lot_id, produit_id) WHERE statut = 'active'
    DO UPDATE SET
      priorite = EXCLUDED.priorite,
      prix_vente_suggere = EXCLUDED.prix_vente_suggere,
      remise_suggere = EXCLUDED.remise_suggere,
      motif_suggestion = EXCLUDED.motif_suggestion,
      updated_at = NOW();

    suggestion_count := suggestion_count + 1;
  END LOOP;

  RETURN suggestion_count;
END;
$$;

-- Corriger les politiques RLS de suggestions_vente pour utiliser get_current_user_tenant_id()
DROP POLICY IF EXISTS "Users can view their tenant suggestions" ON public.suggestions_vente;
DROP POLICY IF EXISTS "Users can insert their tenant suggestions" ON public.suggestions_vente;
DROP POLICY IF EXISTS "Users can update their tenant suggestions" ON public.suggestions_vente;
DROP POLICY IF EXISTS "Users can delete their tenant suggestions" ON public.suggestions_vente;

-- Créer les nouvelles politiques sécurisées
CREATE POLICY "Users can view suggestions from their tenant" 
ON public.suggestions_vente
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert suggestions in their tenant" 
ON public.suggestions_vente
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update suggestions from their tenant" 
ON public.suggestions_vente
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete suggestions from their tenant" 
ON public.suggestions_vente
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.generate_sales_suggestions() TO authenticated;