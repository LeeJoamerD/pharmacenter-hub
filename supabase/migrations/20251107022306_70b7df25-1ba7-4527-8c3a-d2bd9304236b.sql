-- ===========================================
-- MIGRATION COMPLÈTE: Structure LOTS + Alertes Péremption
-- Gère tables existantes et partielles
-- ===========================================

-- PHASE 1: Table LOTS - Ajouter colonnes manquantes
ALTER TABLE public.lots 
  ADD COLUMN IF NOT EXISTS date_peremption DATE,
  ADD COLUMN IF NOT EXISTS prix_achat_unitaire NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS fournisseur_id UUID,
  ADD COLUMN IF NOT EXISTS reception_id UUID,
  ADD COLUMN IF NOT EXISTS emplacement TEXT,
  ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'Disponible',
  ADD COLUMN IF NOT EXISTS date_fabrication DATE,
  ADD COLUMN IF NOT EXISTS date_reception DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS prix_vente_suggere NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Contraintes FK pour lots (conditionnelles)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fournisseurs') THEN
    ALTER TABLE public.lots DROP CONSTRAINT IF EXISTS lots_fournisseur_id_fkey;
    ALTER TABLE public.lots ADD CONSTRAINT lots_fournisseur_id_fkey FOREIGN KEY (fournisseur_id) REFERENCES public.fournisseurs(id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'receptions_fournisseurs') THEN
    ALTER TABLE public.lots DROP CONSTRAINT IF EXISTS lots_reception_id_fkey;
    ALTER TABLE public.lots ADD CONSTRAINT lots_reception_id_fkey FOREIGN KEY (reception_id) REFERENCES public.receptions_fournisseurs(id);
  END IF;
  ALTER TABLE public.lots DROP CONSTRAINT IF EXISTS lots_statut_check;
  ALTER TABLE public.lots ADD CONSTRAINT lots_statut_check CHECK (statut IN ('Disponible', 'Réservé', 'Expiré', 'Quarantaine', 'Épuisé'));
END $$;

-- PHASE 2: Tables auxiliaires
CREATE TABLE IF NOT EXISTS public.configurations_fifo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  produit_id UUID,
  priorite_fifo INTEGER DEFAULT 1,
  delai_alerte_jours INTEGER DEFAULT 30,
  action_automatique TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter colonnes manquantes à configurations_fifo si elle existe déjà
ALTER TABLE public.configurations_fifo ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT true;
ALTER TABLE public.configurations_fifo ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
ALTER TABLE public.configurations_fifo ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Contraintes FK pour configurations_fifo
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'configurations_fifo_produit_id_fkey') THEN
    ALTER TABLE public.configurations_fifo ADD CONSTRAINT configurations_fifo_produit_id_fkey FOREIGN KEY (produit_id) REFERENCES public.produits(id) ON DELETE CASCADE;
  END IF;
  ALTER TABLE public.configurations_fifo DROP CONSTRAINT IF EXISTS configurations_fifo_priorite_check;
  ALTER TABLE public.configurations_fifo ADD CONSTRAINT configurations_fifo_priorite_check CHECK (priorite_fifo BETWEEN 1 AND 10);
  ALTER TABLE public.configurations_fifo DROP CONSTRAINT IF EXISTS configurations_fifo_action_check;
  ALTER TABLE public.configurations_fifo ADD CONSTRAINT configurations_fifo_action_check CHECK (action_automatique IN ('none', 'notify', 'block_sale', 'suggest_discount'));
END $$;

CREATE TABLE IF NOT EXISTS public.alertes_peremption (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  lot_id UUID NOT NULL,
  produit_id UUID NOT NULL,
  niveau_urgence TEXT NOT NULL,
  date_peremption DATE NOT NULL,
  jours_restants INTEGER,
  quantite_concernee INTEGER NOT NULL,
  statut TEXT DEFAULT 'active',
  action_recommandee TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contraintes pour alertes_peremption
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alertes_peremption_lot_id_fkey') THEN
    ALTER TABLE public.alertes_peremption ADD CONSTRAINT alertes_peremption_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE;
  END IF;
  ALTER TABLE public.alertes_peremption DROP CONSTRAINT IF EXISTS alertes_peremption_niveau_check;
  ALTER TABLE public.alertes_peremption ADD CONSTRAINT alertes_peremption_niveau_check CHECK (niveau_urgence IN ('faible', 'moyen', 'eleve', 'critique'));
  ALTER TABLE public.alertes_peremption DROP CONSTRAINT IF EXISTS alertes_peremption_statut_check;
  ALTER TABLE public.alertes_peremption ADD CONSTRAINT alertes_peremption_statut_check CHECK (statut IN ('active', 'traitee', 'ignoree', 'archivee'));
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alertes_peremption_tenant_lot_unique') THEN
    ALTER TABLE public.alertes_peremption ADD CONSTRAINT alertes_peremption_tenant_lot_unique UNIQUE (tenant_id, lot_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.mouvements_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  lot_id UUID NOT NULL,
  produit_id UUID NOT NULL,
  type_mouvement TEXT NOT NULL,
  quantite INTEGER NOT NULL,
  quantite_avant INTEGER,
  quantite_apres INTEGER,
  prix_unitaire NUMERIC(10,2),
  valeur_totale NUMERIC(15,2),
  motif TEXT,
  reference_document TEXT,
  effectue_par UUID,
  date_mouvement TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mouvements_lots_lot_id_fkey') THEN
    ALTER TABLE public.mouvements_lots ADD CONSTRAINT mouvements_lots_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE;
  END IF;
  ALTER TABLE public.mouvements_lots DROP CONSTRAINT IF EXISTS mouvements_lots_type_check;
  ALTER TABLE public.mouvements_lots ADD CONSTRAINT mouvements_lots_type_check CHECK (type_mouvement IN ('entree', 'sortie', 'ajustement', 'transfert', 'retour', 'perime'));
END $$;

CREATE TABLE IF NOT EXISTS public.parametres_expiration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  produit_id UUID,
  jours_alerte_peremption INTEGER DEFAULT 90,
  jours_blocage_vente INTEGER DEFAULT 0,
  notification_email BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT false,
  action_automatique TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'parametres_expiration_produit_id_fkey') THEN
    ALTER TABLE public.parametres_expiration ADD CONSTRAINT parametres_expiration_produit_id_fkey FOREIGN KEY (produit_id) REFERENCES public.produits(id) ON DELETE CASCADE;
  END IF;
  ALTER TABLE public.parametres_expiration DROP CONSTRAINT IF EXISTS parametres_expiration_action_check;
  ALTER TABLE public.parametres_expiration ADD CONSTRAINT parametres_expiration_action_check CHECK (action_automatique IN ('none', 'alert', 'block', 'discount'));
END $$;

-- PHASE 3: Fonctions
CREATE OR REPLACE FUNCTION public.calculer_jours_restants_expiration(date_peremption DATE)
RETURNS INTEGER LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN IF date_peremption IS NULL THEN RETURN NULL; END IF; RETURN (date_peremption - CURRENT_DATE); END; $$;

CREATE OR REPLACE FUNCTION public.determiner_niveau_urgence(jours_restants INTEGER)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN IF jours_restants IS NULL THEN RETURN 'none'; ELSIF jours_restants <= 0 THEN RETURN 'critique'; ELSIF jours_restants <= 7 THEN RETURN 'eleve'; ELSIF jours_restants <= 30 THEN RETURN 'moyen'; ELSE RETURN 'faible'; END IF; END; $$;

CREATE OR REPLACE FUNCTION public.update_lots_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.creer_alerte_peremption_auto()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_jours_restants INTEGER; v_niveau_urgence TEXT; v_action_recommandee TEXT;
BEGIN
  IF NEW.date_peremption IS NULL OR NEW.quantite_restante <= 0 THEN RETURN NEW; END IF;
  v_jours_restants := calculer_jours_restants_expiration(NEW.date_peremption);
  v_niveau_urgence := determiner_niveau_urgence(v_jours_restants);
  IF v_niveau_urgence IN ('critique', 'eleve', 'moyen') THEN
    v_action_recommandee := CASE v_niveau_urgence
      WHEN 'critique' THEN 'RETRAIT IMMÉDIAT' WHEN 'eleve' THEN 'VENTE PRIORITAIRE' WHEN 'moyen' THEN 'Surveiller' ELSE 'Normal' END;
    INSERT INTO public.alertes_peremption (tenant_id, lot_id, produit_id, niveau_urgence, date_peremption, jours_restants, quantite_concernee, statut, action_recommandee)
    VALUES (NEW.tenant_id, NEW.id, NEW.produit_id, v_niveau_urgence, NEW.date_peremption, v_jours_restants, NEW.quantite_restante, 'active', v_action_recommandee)
    ON CONFLICT (tenant_id, lot_id) DO UPDATE SET niveau_urgence = EXCLUDED.niveau_urgence, jours_restants = EXCLUDED.jours_restants, 
    quantite_concernee = EXCLUDED.quantite_concernee, action_recommandee = EXCLUDED.action_recommandee, 
    statut = CASE WHEN alertes_peremption.statut = 'ignoree' THEN 'ignoree' ELSE 'active' END, updated_at = now();
  END IF; RETURN NEW;
END; $$;

-- PHASE 4: Triggers
DROP TRIGGER IF EXISTS update_lots_timestamp ON public.lots;
CREATE TRIGGER update_lots_timestamp BEFORE UPDATE ON public.lots FOR EACH ROW EXECUTE FUNCTION public.update_lots_timestamp();

DROP TRIGGER IF EXISTS trigger_alerte_peremption_auto ON public.lots;
CREATE TRIGGER trigger_alerte_peremption_auto AFTER INSERT OR UPDATE OF date_peremption, quantite_restante ON public.lots FOR EACH ROW EXECUTE FUNCTION public.creer_alerte_peremption_auto();

DROP TRIGGER IF EXISTS update_configurations_fifo_timestamp ON public.configurations_fifo;
CREATE TRIGGER update_configurations_fifo_timestamp BEFORE UPDATE ON public.configurations_fifo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_alertes_peremption_timestamp ON public.alertes_peremption;
CREATE TRIGGER update_alertes_peremption_timestamp BEFORE UPDATE ON public.alertes_peremption FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_parametres_expiration_timestamp ON public.parametres_expiration;
CREATE TRIGGER update_parametres_expiration_timestamp BEFORE UPDATE ON public.parametres_expiration FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PHASE 5: Index
CREATE INDEX IF NOT EXISTS idx_lots_tenant_produit ON public.lots(tenant_id, produit_id);
CREATE INDEX IF NOT EXISTS idx_lots_date_peremption ON public.lots(date_peremption) WHERE date_peremption IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lots_statut ON public.lots(statut);
CREATE INDEX IF NOT EXISTS idx_lots_reception ON public.lots(reception_id) WHERE reception_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alertes_peremption_tenant_statut ON public.alertes_peremption(tenant_id, statut);
CREATE INDEX IF NOT EXISTS idx_alertes_peremption_urgence ON public.alertes_peremption(niveau_urgence) WHERE statut = 'active';
CREATE INDEX IF NOT EXISTS idx_mouvements_lots_tenant_lot ON public.mouvements_lots(tenant_id, lot_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_lots_date ON public.mouvements_lots(date_mouvement DESC);
CREATE INDEX IF NOT EXISTS idx_configurations_fifo_tenant ON public.configurations_fifo(tenant_id);

-- PHASE 6: RLS
ALTER TABLE public.configurations_fifo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertes_peremption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouvements_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_expiration ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilisateurs peuvent voir configurations FIFO de leur tenant" ON public.configurations_fifo;
CREATE POLICY "Utilisateurs peuvent voir configurations FIFO de leur tenant" ON public.configurations_fifo FOR SELECT USING (tenant_id = get_current_user_tenant_id());
DROP POLICY IF EXISTS "Utilisateurs peuvent créer configurations FIFO dans leur tenant" ON public.configurations_fifo;
CREATE POLICY "Utilisateurs peuvent créer configurations FIFO dans leur tenant" ON public.configurations_fifo FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());
DROP POLICY IF EXISTS "Utilisateurs peuvent modifier configurations FIFO de leur tenant" ON public.configurations_fifo;
CREATE POLICY "Utilisateurs peuvent modifier configurations FIFO de leur tenant" ON public.configurations_fifo FOR UPDATE USING (tenant_id = get_current_user_tenant_id());
DROP POLICY IF EXISTS "Utilisateurs peuvent supprimer configurations FIFO de leur tenant" ON public.configurations_fifo;
CREATE POLICY "Utilisateurs peuvent supprimer configurations FIFO de leur tenant" ON public.configurations_fifo FOR DELETE USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Utilisateurs peuvent voir alertes péremption de leur tenant" ON public.alertes_peremption;
CREATE POLICY "Utilisateurs peuvent voir alertes péremption de leur tenant" ON public.alertes_peremption FOR SELECT USING (tenant_id = get_current_user_tenant_id());
DROP POLICY IF EXISTS "Utilisateurs peuvent créer alertes péremption dans leur tenant" ON public.alertes_peremption;
CREATE POLICY "Utilisateurs peuvent créer alertes péremption dans leur tenant" ON public.alertes_peremption FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());
DROP POLICY IF EXISTS "Utilisateurs peuvent modifier alertes péremption de leur tenant" ON public.alertes_peremption;
CREATE POLICY "Utilisateurs peuvent modifier alertes péremption de leur tenant" ON public.alertes_peremption FOR UPDATE USING (tenant_id = get_current_user_tenant_id());
DROP POLICY IF EXISTS "Utilisateurs peuvent supprimer alertes péremption de leur tenant" ON public.alertes_peremption;
CREATE POLICY "Utilisateurs peuvent supprimer alertes péremption de leur tenant" ON public.alertes_peremption FOR DELETE USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Utilisateurs peuvent voir mouvements lots de leur tenant" ON public.mouvements_lots;
CREATE POLICY "Utilisateurs peuvent voir mouvements lots de leur tenant" ON public.mouvements_lots FOR SELECT USING (tenant_id = get_current_user_tenant_id());
DROP POLICY IF EXISTS "Utilisateurs peuvent créer mouvements lots dans leur tenant" ON public.mouvements_lots;
CREATE POLICY "Utilisateurs peuvent créer mouvements lots dans leur tenant" ON public.mouvements_lots FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());
DROP POLICY IF EXISTS "Utilisateurs peuvent modifier mouvements lots de leur tenant" ON public.mouvements_lots;
CREATE POLICY "Utilisateurs peuvent modifier mouvements lots de leur tenant" ON public.mouvements_lots FOR UPDATE USING (tenant_id = get_current_user_tenant_id());
DROP POLICY IF EXISTS "Utilisateurs peuvent supprimer mouvements lots de leur tenant" ON public.mouvements_lots;
CREATE POLICY "Utilisateurs peuvent supprimer mouvements lots de leur tenant" ON public.mouvements_lots FOR DELETE USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Utilisateurs peuvent voir paramètres expiration de leur tenant" ON public.parametres_expiration;
CREATE POLICY "Utilisateurs peuvent voir paramètres expiration de leur tenant" ON public.parametres_expiration FOR SELECT USING (tenant_id = get_current_user_tenant_id());
DROP POLICY IF EXISTS "Utilisateurs peuvent créer paramètres expiration dans leur tenant" ON public.parametres_expiration;
CREATE POLICY "Utilisateurs peuvent créer paramètres expiration dans leur tenant" ON public.parametres_expiration FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());
DROP POLICY IF EXISTS "Utilisateurs peuvent modifier paramètres expiration de leur tenant" ON public.parametres_expiration;
CREATE POLICY "Utilisateurs peuvent modifier paramètres expiration de leur tenant" ON public.parametres_expiration FOR UPDATE USING (tenant_id = get_current_user_tenant_id());
DROP POLICY IF EXISTS "Utilisateurs peuvent supprimer paramètres expiration de leur tenant" ON public.parametres_expiration;
CREATE POLICY "Utilisateurs peuvent supprimer paramètres expiration de leur tenant" ON public.parametres_expiration FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- PHASE 7: Migration données
UPDATE public.lots SET statut = 'Disponible', date_reception = COALESCE(date_reception, created_at::DATE) WHERE statut IS NULL OR date_reception IS NULL;