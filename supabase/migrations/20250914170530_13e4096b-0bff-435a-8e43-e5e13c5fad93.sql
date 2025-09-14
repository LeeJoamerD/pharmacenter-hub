-- Fonction RPC pour générer automatiquement les alertes d'expiration
CREATE OR REPLACE FUNCTION public.generer_alertes_expiration_automatiques()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_tenant_id UUID;
  lot_record RECORD;
  param_record RECORD;
  alerte_count INTEGER := 0;
  jours_restants INTEGER;
  niveau_urgence TEXT;
  type_alerte TEXT;
  actions_recommandees TEXT[];
  result JSONB;
BEGIN
  -- Récupérer le tenant de l'utilisateur actuel
  current_tenant_id := public.get_current_user_tenant_id();
  
  IF current_tenant_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur non authentifié ou tenant non trouvé'
    );
  END IF;

  -- Parcourir tous les lots du tenant qui ne sont pas expirés depuis plus de 30 jours
  FOR lot_record IN
    SELECT 
      l.id, l.tenant_id, l.produit_id, l.numero_lot, 
      l.date_peremption, l.quantite_restante,
      p.libelle_produit, p.famille_id
    FROM public.lots l
    JOIN public.produits p ON l.produit_id = p.id
    WHERE l.tenant_id = current_tenant_id
      AND l.date_peremption IS NOT NULL
      AND l.quantite_restante > 0
      AND l.date_peremption >= CURRENT_DATE - INTERVAL '30 days'
      AND l.date_peremption <= CURRENT_DATE + INTERVAL '365 days'
  LOOP
    -- Calculer les jours restants
    jours_restants := public.calculer_jours_restants_expiration(lot_record.date_peremption);
    
    -- Récupérer les paramètres d'expiration (produit spécifique d'abord, puis famille)
    SELECT * INTO param_record 
    FROM public.parametres_expiration 
    WHERE tenant_id = current_tenant_id 
      AND (produit_id = lot_record.produit_id OR famille_id = lot_record.famille_id)
    ORDER BY 
      CASE WHEN produit_id IS NOT NULL THEN 1 ELSE 2 END,
      created_at DESC
    LIMIT 1;
    
    -- Utiliser les valeurs par défaut si aucun paramètre trouvé
    IF param_record IS NULL THEN
      param_record.delai_alerte_jours := 90;
      param_record.delai_critique_jours := 30;
      param_record.delai_bloquant_jours := 7;
    END IF;
    
    -- Déterminer si une alerte doit être créée
    IF jours_restants <= param_record.delai_alerte_jours THEN
      -- Déterminer le niveau d'urgence et le type d'alerte
      niveau_urgence := public.determiner_niveau_urgence(jours_restants);
      
      IF jours_restants <= 0 THEN
        type_alerte := 'expire';
      ELSIF jours_restants <= param_record.delai_bloquant_jours THEN
        type_alerte := 'critique';
      ELSE
        type_alerte := 'peremption_proche';
      END IF;
      
      -- Déterminer les actions recommandées
      IF jours_restants <= 0 THEN
        actions_recommandees := ARRAY['Retrait immédiat du stock', 'Destruction selon protocole'];
      ELSIF jours_restants <= 7 THEN
        actions_recommandees := ARRAY['Promotion urgente', 'Vente prioritaire', 'Don possible'];
      ELSIF jours_restants <= 30 THEN
        actions_recommandees := ARRAY['Surveillance renforcée', 'Promotion préventive'];
      ELSE
        actions_recommandees := ARRAY['Surveillance normale'];
      END IF;
      
      -- Créer ou mettre à jour l'alerte (éviter les doublons)
      INSERT INTO public.alertes_peremption (
        tenant_id, lot_id, produit_id, type_alerte, niveau_urgence,
        jours_restants, quantite_concernee, actions_recommandees,
        statut, date_alerte
      ) VALUES (
        current_tenant_id, lot_record.id, lot_record.produit_id,
        type_alerte, niveau_urgence, jours_restants, lot_record.quantite_restante,
        actions_recommandees, 'active', NOW()
      ) 
      ON CONFLICT (tenant_id, lot_id, produit_id) 
      DO UPDATE SET
        jours_restants = EXCLUDED.jours_restants,
        quantite_concernee = EXCLUDED.quantite_concernee,
        niveau_urgence = EXCLUDED.niveau_urgence,
        type_alerte = EXCLUDED.type_alerte,
        actions_recommandees = EXCLUDED.actions_recommandees,
        updated_at = NOW()
      WHERE alertes_peremption.statut = 'active'; -- Ne mettre à jour que les alertes actives
      
      alerte_count := alerte_count + 1;
    END IF;
  END LOOP;
  
  -- Retourner le résultat
  result := jsonb_build_object(
    'success', true,
    'alertes_generees', alerte_count,
    'tenant_id', current_tenant_id,
    'timestamp', NOW()
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'tenant_id', current_tenant_id
  );
END;
$$;

-- Ajouter un index unique pour éviter les doublons d'alertes
CREATE UNIQUE INDEX IF NOT EXISTS idx_alertes_peremption_unique 
ON public.alertes_peremption (tenant_id, lot_id, produit_id) 
WHERE statut = 'active';

-- Fonction pour nettoyer les anciennes alertes traitées
CREATE OR REPLACE FUNCTION public.nettoyer_alertes_expiration_anciennes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_tenant_id UUID;
  deleted_count INTEGER := 0;
BEGIN
  current_tenant_id := public.get_current_user_tenant_id();
  
  IF current_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié ou tenant non trouvé';
  END IF;

  -- Supprimer les alertes traitées ou ignorées de plus de 90 jours
  DELETE FROM public.alertes_peremption 
  WHERE tenant_id = current_tenant_id
    AND statut IN ('traitee', 'ignoree')
    AND updated_at < NOW() - INTERVAL '90 days';
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;