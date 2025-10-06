-- Migration pour créer la table suggestions_vente
-- À exécuter dans l'éditeur SQL de Supabase Cloud

CREATE TABLE IF NOT EXISTS public.suggestions_vente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
  priorite TEXT NOT NULL CHECK (priorite IN ('haute', 'moyenne', 'faible')) DEFAULT 'moyenne',
  prix_vente_suggere NUMERIC(15,2) NOT NULL,
  remise_suggere NUMERIC(5,2) DEFAULT 0.00,
  motif_suggestion TEXT NOT NULL,
  statut TEXT NOT NULL CHECK (statut IN ('active', 'ignoree', 'vendue', 'promue')) DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Index pour optimiser les requêtes
  CONSTRAINT unique_suggestion_per_lot UNIQUE(tenant_id, lot_id, statut)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_suggestions_vente_tenant_id ON public.suggestions_vente(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_vente_lot_id ON public.suggestions_vente(lot_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_vente_produit_id ON public.suggestions_vente(produit_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_vente_statut ON public.suggestions_vente(statut);
CREATE INDEX IF NOT EXISTS idx_suggestions_vente_priorite ON public.suggestions_vente(priorite);
CREATE INDEX IF NOT EXISTS idx_suggestions_vente_created_at ON public.suggestions_vente(created_at);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_suggestions_vente_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_suggestions_vente_timestamp
  BEFORE UPDATE ON public.suggestions_vente
  FOR EACH ROW
  EXECUTE FUNCTION public.update_suggestions_vente_timestamp();

-- Fonction pour générer automatiquement des suggestions de vente
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
        ELSE EXTRACT(DAYS FROM (l.date_peremption - CURRENT_DATE))
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

-- Politique de sécurité RLS (Row Level Security)
ALTER TABLE public.suggestions_vente ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir seulement leurs données tenant
CREATE POLICY "Users can view their tenant suggestions" ON public.suggestions_vente
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert their tenant suggestions" ON public.suggestions_vente
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update their tenant suggestions" ON public.suggestions_vente
  FOR UPDATE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete their tenant suggestions" ON public.suggestions_vente
  FOR DELETE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);