-- Migration simplifiée: Tables et colonnes essentielles manquantes
-- Sans références aux tables qui n'existent pas encore

-- =========================================
-- 1. TABLE EMAILS
-- =========================================
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  subject TEXT,
  from_email VARCHAR(255),
  to_email VARCHAR(255),
  content TEXT,
  summary TEXT,
  suggested_response TEXT,
  classification VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'normal',
  processed BOOLEAN DEFAULT FALSE,
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_access_emails" ON public.emails;
CREATE POLICY "tenant_access_emails" ON public.emails
  FOR ALL USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE INDEX IF NOT EXISTS idx_emails_tenant_classification ON public.emails(tenant_id, classification);
CREATE INDEX IF NOT EXISTS idx_emails_processed ON public.emails(processed);

-- =========================================
-- 2. TABLE PREFERENCES_UTILISATEUR
-- =========================================
CREATE TABLE IF NOT EXISTS public.preferences_utilisateur (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  cle_preference TEXT NOT NULL,
  valeur_preference TEXT,
  type_preference TEXT NOT NULL DEFAULT 'string' CHECK (type_preference IN ('string', 'number', 'boolean', 'json')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_preference_per_user UNIQUE (tenant_id, personnel_id, cle_preference)
);

ALTER TABLE public.preferences_utilisateur ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_access_preferences_utilisateur" ON public.preferences_utilisateur;
CREATE POLICY "tenant_access_preferences_utilisateur" ON public.preferences_utilisateur
  FOR ALL USING (
    tenant_id = get_current_user_tenant_id() AND
    personnel_id IN (SELECT id FROM public.personnel WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    tenant_id = get_current_user_tenant_id() AND
    personnel_id IN (SELECT id FROM public.personnel WHERE auth_user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_preferences_utilisateur_tenant_id ON public.preferences_utilisateur(tenant_id);
CREATE INDEX IF NOT EXISTS idx_preferences_utilisateur_personnel ON public.preferences_utilisateur(personnel_id);

DROP TRIGGER IF EXISTS update_preferences_utilisateur_updated_at ON public.preferences_utilisateur;
CREATE TRIGGER update_preferences_utilisateur_updated_at
  BEFORE UPDATE ON public.preferences_utilisateur
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 3. TABLE CONVENTIONNES
-- =========================================
CREATE TABLE IF NOT EXISTS public.conventionnes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  noms TEXT NOT NULL,
  adresse TEXT,
  ville TEXT,
  telephone_appel TEXT,
  telephone_whatsapp TEXT,
  email TEXT,
  niu TEXT,
  limite_dette NUMERIC DEFAULT 0.00,
  taux_ticket_moderateur NUMERIC DEFAULT 0.00,
  caution NUMERIC DEFAULT 0.00,
  taux_remise_automatique NUMERIC DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conventionnes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_access_conventionnes" ON public.conventionnes;
CREATE POLICY "tenant_access_conventionnes" ON public.conventionnes
  FOR ALL USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE INDEX IF NOT EXISTS idx_conventionnes_tenant_id ON public.conventionnes(tenant_id);

DROP TRIGGER IF EXISTS update_conventionnes_updated_at ON public.conventionnes;
CREATE TRIGGER update_conventionnes_updated_at
  BEFORE UPDATE ON public.conventionnes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 4. TABLE MOUVEMENTS_LOTS
-- =========================================
CREATE TABLE IF NOT EXISTS public.mouvements_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL,
  type_mouvement TEXT NOT NULL CHECK (type_mouvement IN ('entree', 'sortie', 'transfert', 'ajustement', 'peremption', 'retour', 'reservation')),
  quantite_avant INTEGER NOT NULL,
  quantite_mouvement INTEGER NOT NULL,
  quantite_apres INTEGER NOT NULL,
  prix_unitaire NUMERIC(10,2),
  valeur_mouvement NUMERIC(10,2),
  motif TEXT,
  reference_document TEXT,
  reference_id UUID,
  reference_type TEXT,
  agent_id UUID REFERENCES public.personnel(id),
  lot_destination_id UUID REFERENCES public.lots(id),
  emplacement_source TEXT,
  emplacement_destination TEXT,
  date_mouvement TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.mouvements_lots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_access_mouvements_lots_select" ON public.mouvements_lots;
DROP POLICY IF EXISTS "tenant_access_mouvements_lots_insert" ON public.mouvements_lots;

CREATE POLICY "tenant_access_mouvements_lots_select" ON public.mouvements_lots
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "tenant_access_mouvements_lots_insert" ON public.mouvements_lots
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE INDEX IF NOT EXISTS idx_mouvements_lots_tenant_lot ON public.mouvements_lots(tenant_id, lot_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_lots_date ON public.mouvements_lots(date_mouvement);

-- =========================================
-- 5. COLONNES MANQUANTES DANS PRODUITS
-- =========================================

-- Ajouter is_active
ALTER TABLE public.produits ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Ajouter laboratoires_id (sans foreign key car table peut ne pas exister)
ALTER TABLE public.produits ADD COLUMN IF NOT EXISTS laboratoires_id UUID;

-- Ajouter famille_id comme alias de famille_produit_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'produits' 
    AND column_name = 'famille_id'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN famille_id UUID;
    -- Copier les valeurs de famille_produit_id vers famille_id si famille_produit_id existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'produits' 
      AND column_name = 'famille_produit_id'
    ) THEN
      UPDATE public.produits SET famille_id = famille_produit_id WHERE famille_produit_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- Ajouter rayon_id comme alias de rayon_produit_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'produits' 
    AND column_name = 'rayon_id'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN rayon_id UUID;
    -- Copier les valeurs si rayon_produit_id existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'produits' 
      AND column_name = 'rayon_produit_id'
    ) THEN
      UPDATE public.produits SET rayon_id = rayon_produit_id WHERE rayon_produit_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- Ajouter forme_id, dci_id, classe_therapeutique_id (sans foreign keys)
ALTER TABLE public.produits ADD COLUMN IF NOT EXISTS forme_id UUID;
ALTER TABLE public.produits ADD COLUMN IF NOT EXISTS dci_id UUID;
ALTER TABLE public.produits ADD COLUMN IF NOT EXISTS classe_therapeutique_id UUID;

-- Créer les index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_produits_is_active ON public.produits(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_produits_laboratoires_id ON public.produits(laboratoires_id) WHERE laboratoires_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_produits_famille_id ON public.produits(famille_id) WHERE famille_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_produits_rayon_id ON public.produits(rayon_id) WHERE rayon_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_produits_forme_id ON public.produits(forme_id) WHERE forme_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_produits_dci_id ON public.produits(dci_id) WHERE dci_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_produits_classe_therapeutique_id ON public.produits(classe_therapeutique_id) WHERE classe_therapeutique_id IS NOT NULL;

-- =========================================
-- 6. COLONNES MANQUANTES DANS LOTS
-- =========================================
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS prix_achat_unitaire NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS fournisseur_id UUID;

-- =========================================
-- 7. FONCTION RPC POUR MOUVEMENTS DE LOTS
-- =========================================
CREATE OR REPLACE FUNCTION public.rpc_stock_record_movement(
  p_tenant_id UUID,
  p_lot_id UUID,
  p_produit_id UUID,
  p_type_mouvement TEXT,
  p_quantite INTEGER,
  p_motif TEXT DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_lot_record RECORD;
  v_quantite_avant INTEGER;
  v_quantite_apres INTEGER;
  v_mouvement_id UUID;
BEGIN
  -- Récupérer l'état actuel du lot
  SELECT * INTO v_lot_record FROM public.lots WHERE id = p_lot_id AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Lot non trouvé');
  END IF;
  
  v_quantite_avant := v_lot_record.quantite_restante;
  
  -- Calculer la quantité après
  IF p_type_mouvement IN ('sortie', 'peremption') THEN
    v_quantite_apres := v_quantite_avant - p_quantite;
  ELSIF p_type_mouvement IN ('entree', 'retour') THEN
    v_quantite_apres := v_quantite_avant + p_quantite;
  ELSIF p_type_mouvement = 'ajustement' THEN
    v_quantite_apres := p_quantite;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Type de mouvement invalide');
  END IF;
  
  -- Vérifier que la quantité ne devient pas négative
  IF v_quantite_apres < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Stock insuffisant');
  END IF;
  
  -- Insérer le mouvement
  INSERT INTO public.mouvements_lots (
    tenant_id, lot_id, produit_id, type_mouvement,
    quantite_avant, quantite_mouvement, quantite_apres,
    motif, agent_id
  ) VALUES (
    p_tenant_id, p_lot_id, p_produit_id, p_type_mouvement,
    v_quantite_avant, p_quantite, v_quantite_apres,
    p_motif, p_agent_id
  ) RETURNING id INTO v_mouvement_id;
  
  -- Mettre à jour le lot
  UPDATE public.lots 
  SET quantite_restante = v_quantite_apres,
      updated_at = NOW()
  WHERE id = p_lot_id;
  
  RETURN json_build_object(
    'success', true,
    'mouvement_id', v_mouvement_id,
    'quantite_avant', v_quantite_avant,
    'quantite_apres', v_quantite_apres
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;