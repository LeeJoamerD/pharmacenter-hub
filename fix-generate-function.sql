-- Correction de la fonction generate_sales_suggestions
-- Remplace la fonction EXTRACT par une soustraction directe de dates

CREATE OR REPLACE FUNCTION public.generate_sales_suggestions(p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  suggestion_count INTEGER := 0;
  lot_record RECORD;
  suggested_price NUMERIC(15,2);
  suggested_discount NUMERIC(5,2);
  priority_level TEXT;
  suggestion_reason TEXT;
BEGIN
  -- Supprimer les anciennes suggestions actives pour éviter les doublons
  DELETE FROM public.suggestions_vente 
  WHERE tenant_id = p_tenant_id AND statut = 'active';

  -- Parcourir les lots avec des dates d'expiration proches
  FOR lot_record IN
    SELECT 
      l.id as lot_id,
      l.produit_id,
      l.numero_lot,
      l.date_peremption,
      l.quantite_restante,
      p.prix_vente_ttc,
      p.libelle_produit,
      CASE 
        WHEN l.date_peremption IS NULL THEN NULL
        ELSE (l.date_peremption - CURRENT_DATE)
      END as days_to_expiry
    FROM public.lots l
    INNER JOIN public.produits p ON l.produit_id = p.id
    WHERE l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
      AND (
        l.date_peremption IS NULL OR 
        l.date_peremption > CURRENT_DATE
      )
    ORDER BY l.date_peremption ASC NULLS LAST
  LOOP
    -- Déterminer la priorité et la remise basée sur les jours avant expiration
    IF lot_record.days_to_expiry IS NULL THEN
      priority_level := 'faible';
      suggested_discount := 0.00;
      suggestion_reason := 'Lot sans date d''expiration - vente normale recommandée';
    ELSIF lot_record.days_to_expiry <= 30 THEN
      priority_level := 'haute';
      suggested_discount := 15.00;
      suggestion_reason := 'Expiration dans ' || lot_record.days_to_expiry || ' jours - vente urgente recommandée';
    ELSIF lot_record.days_to_expiry <= 90 THEN
      priority_level := 'moyenne';
      suggested_discount := 10.00;
      suggestion_reason := 'Expiration dans ' || lot_record.days_to_expiry || ' jours - vente prioritaire recommandée';
    ELSIF lot_record.days_to_expiry <= 180 THEN
      priority_level := 'faible';
      suggested_discount := 5.00;
      suggestion_reason := 'Expiration dans ' || lot_record.days_to_expiry || ' jours - vente normale avec légère remise';
    ELSE
      priority_level := 'faible';
      suggested_discount := 0.00;
      suggestion_reason := 'Lot avec longue durée de vie - vente normale';
    END IF;

    -- Calculer le prix suggéré avec remise
    suggested_price := lot_record.prix_vente_ttc * (1 - suggested_discount / 100);

    -- Insérer la suggestion
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
      p_tenant_id,
      lot_record.lot_id,
      lot_record.produit_id,
      priority_level,
      suggested_price,
      suggested_discount,
      suggestion_reason,
      'active'
    );

    suggestion_count := suggestion_count + 1;
  END LOOP;

  RETURN suggestion_count;
END;
$$ LANGUAGE plpgsql;