-- Fix creer_alerte_peremption_auto function to use correct column name
-- Replace with the original version that uses actions_recommandees (TEXT[]) instead of action_recommandee (TEXT)

DROP TRIGGER IF EXISTS trigger_alerte_peremption_auto ON public.lots;

CREATE OR REPLACE FUNCTION public.creer_alerte_peremption_auto()
RETURNS TRIGGER AS $$
DECLARE
  jours_restants INTEGER;
  niveau_urgence TEXT;
  param_record RECORD;
BEGIN
  -- Calculer les jours restants
  jours_restants := public.calculer_jours_restants_expiration(NEW.date_peremption);
  
  IF jours_restants IS NULL OR jours_restants > 365 THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer les paramètres d'expiration
  SELECT * INTO param_record 
  FROM public.parametres_expiration 
  WHERE tenant_id = NEW.tenant_id 
    AND (produit_id = NEW.produit_id OR famille_id IN (
      SELECT famille_id FROM public.produits WHERE id = NEW.produit_id
    ))
  ORDER BY 
    CASE WHEN produit_id IS NOT NULL THEN 1 ELSE 2 END,
    created_at DESC
  LIMIT 1;
  
  -- Utiliser les valeurs par défaut si aucun paramètre trouvé
  IF param_record IS NULL THEN
    param_record.delai_alerte_jours := 90;
    param_record.delai_critique_jours := 30;
  END IF;
  
  -- Créer une alerte si nécessaire
  IF jours_restants <= param_record.delai_alerte_jours THEN
    niveau_urgence := public.determiner_niveau_urgence(jours_restants);
    
    INSERT INTO public.alertes_peremption (
      tenant_id, lot_id, produit_id, type_alerte, niveau_urgence,
      jours_restants, quantite_concernee, actions_recommandees
    ) VALUES (
      NEW.tenant_id, NEW.id, NEW.produit_id,
      CASE 
        WHEN jours_restants <= 0 THEN 'expire'
        WHEN jours_restants <= param_record.delai_critique_jours THEN 'critique'
        ELSE 'peremption_proche'
      END,
      niveau_urgence,
      jours_restants,
      NEW.quantite_restante,
      ARRAY[
        CASE 
          WHEN jours_restants <= 7 THEN 'Retrait immédiat du stock'
          WHEN jours_restants <= 30 THEN 'Promotion ou vente prioritaire'
          ELSE 'Surveillance renforcée'
        END
      ]
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER trigger_alerte_peremption_auto
  AFTER INSERT OR UPDATE OF date_peremption, quantite_restante ON public.lots
  FOR EACH ROW
  EXECUTE FUNCTION public.creer_alerte_peremption_auto();