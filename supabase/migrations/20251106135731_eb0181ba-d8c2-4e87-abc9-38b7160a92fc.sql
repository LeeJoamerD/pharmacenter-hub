-- =====================================================
-- GESTION DES PROMOTIONS
-- =====================================================

-- Table principale des promotions
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  type_promotion TEXT NOT NULL CHECK (type_promotion IN ('Pourcentage', 'Montant fixe', 'Achetez-Obtenez', 'Quantité')),
  valeur_promotion NUMERIC NOT NULL,
  montant_minimum NUMERIC DEFAULT 0,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  heure_debut TIME,
  heure_fin TIME,
  est_actif BOOLEAN NOT NULL DEFAULT true,
  conditions JSONB DEFAULT '{}'::jsonb,
  cible_clients TEXT NOT NULL DEFAULT 'Tous' CHECK (cible_clients IN ('Tous', 'Fidélité', 'Nouveaux', 'VIP')),
  nombre_utilisations INTEGER NOT NULL DEFAULT 0,
  limite_utilisations INTEGER,
  limite_par_client INTEGER DEFAULT 1,
  priorite INTEGER DEFAULT 0,
  combinable BOOLEAN DEFAULT false,
  code_promo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Table de liaison promotions <-> produits
CREATE TABLE IF NOT EXISTS public.produits_eligibles_promotion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
  categorie_id UUID REFERENCES public.categorie_tarification(id) ON DELETE CASCADE,
  classe_therapeutique_id UUID REFERENCES public.classes_therapeutiques(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(promotion_id, produit_id)
);

-- Table d'historique des utilisations de promotions
CREATE TABLE IF NOT EXISTS public.utilisations_promotion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  vente_id UUID REFERENCES public.ventes(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  montant_remise NUMERIC NOT NULL,
  date_utilisation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agent_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produits_eligibles_promotion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utilisations_promotion ENABLE ROW LEVEL SECURITY;

-- Policies pour promotions
CREATE POLICY "Users can view promotions from their tenant"
  ON public.promotions FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage promotions in their tenant"
  ON public.promotions FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policies pour produits_eligibles_promotion
CREATE POLICY "Users can view eligible products from their tenant"
  ON public.produits_eligibles_promotion FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage eligible products in their tenant"
  ON public.produits_eligibles_promotion FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policies pour utilisations_promotion
CREATE POLICY "Users can view promotion usages from their tenant"
  ON public.utilisations_promotion FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can create promotion usages in their tenant"
  ON public.utilisations_promotion FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- =====================================================
-- FONCTIONS & TRIGGERS
-- =====================================================

-- Fonction pour incrémenter le compteur d'utilisations
CREATE OR REPLACE FUNCTION increment_promotion_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.promotions
  SET nombre_utilisations = nombre_utilisations + 1
  WHERE id = NEW.promotion_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_increment_promotion_usage
  AFTER INSERT ON public.utilisations_promotion
  FOR EACH ROW
  EXECUTE FUNCTION increment_promotion_usage();

-- Fonction pour vérifier la validité d'une promotion
CREATE OR REPLACE FUNCTION check_promotion_validity(
  p_promotion_id UUID,
  p_client_id UUID DEFAULT NULL,
  p_montant NUMERIC DEFAULT 0
)
RETURNS TABLE (
  est_valide BOOLEAN,
  message TEXT,
  valeur_remise NUMERIC
) AS $$
DECLARE
  v_promo RECORD;
  v_usage_count INTEGER;
  v_remise NUMERIC;
BEGIN
  -- Récupérer la promotion
  SELECT * INTO v_promo
  FROM public.promotions
  WHERE id = p_promotion_id;

  -- Vérifier si la promotion existe
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Promotion non trouvée'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;

  -- Vérifier si active
  IF NOT v_promo.est_actif THEN
    RETURN QUERY SELECT false, 'Promotion inactive'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;

  -- Vérifier les dates
  IF CURRENT_DATE < v_promo.date_debut OR CURRENT_DATE > v_promo.date_fin THEN
    RETURN QUERY SELECT false, 'Promotion hors période de validité'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;

  -- Vérifier montant minimum
  IF p_montant < v_promo.montant_minimum THEN
    RETURN QUERY SELECT false, 'Montant minimum non atteint'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;

  -- Vérifier limite globale
  IF v_promo.limite_utilisations IS NOT NULL AND 
     v_promo.nombre_utilisations >= v_promo.limite_utilisations THEN
    RETURN QUERY SELECT false, 'Limite d''utilisations atteinte'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;

  -- Vérifier limite par client
  IF p_client_id IS NOT NULL AND v_promo.limite_par_client IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM public.utilisations_promotion
    WHERE promotion_id = p_promotion_id
      AND client_id = p_client_id;
    
    IF v_usage_count >= v_promo.limite_par_client THEN
      RETURN QUERY SELECT false, 'Limite par client atteinte'::TEXT, 0::NUMERIC;
      RETURN;
    END IF;
  END IF;

  -- Calculer la remise
  IF v_promo.type_promotion = 'Pourcentage' THEN
    v_remise := p_montant * (v_promo.valeur_promotion / 100);
  ELSIF v_promo.type_promotion = 'Montant fixe' THEN
    v_remise := v_promo.valeur_promotion;
  ELSE
    v_remise := 0;
  END IF;

  RETURN QUERY SELECT true, 'Promotion valide'::TEXT, v_remise;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES POUR PERFORMANCE
-- =====================================================

CREATE INDEX idx_promotions_tenant_actif ON public.promotions(tenant_id, est_actif);
CREATE INDEX idx_promotions_dates ON public.promotions(date_debut, date_fin);
CREATE INDEX idx_promotions_code ON public.promotions(code_promo) WHERE code_promo IS NOT NULL;
CREATE INDEX idx_produits_eligibles_promotion ON public.produits_eligibles_promotion(promotion_id, produit_id);
CREATE INDEX idx_utilisations_promotion_tenant ON public.utilisations_promotion(tenant_id, date_utilisation);
CREATE INDEX idx_utilisations_promotion_client ON public.utilisations_promotion(client_id, promotion_id);