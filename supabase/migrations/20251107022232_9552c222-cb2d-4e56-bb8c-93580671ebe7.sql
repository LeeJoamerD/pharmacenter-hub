-- Structure LOTS complète - Version finale
ALTER TABLE public.lots 
  ADD COLUMN IF NOT EXISTS date_peremption DATE,
  ADD COLUMN IF NOT EXISTS prix_achat_unitaire NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS fournisseur_id UUID REFERENCES public.fournisseurs(id),
  ADD COLUMN IF NOT EXISTS reception_id UUID REFERENCES public.receptions_fournisseurs(id),
  ADD COLUMN IF NOT EXISTS emplacement TEXT,
  ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'Disponible',
  ADD COLUMN IF NOT EXISTS date_fabrication DATE,
  ADD COLUMN IF NOT EXISTS date_reception DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS prix_vente_suggere NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.lots DROP CONSTRAINT IF EXISTS lots_statut_check;
ALTER TABLE public.lots ADD CONSTRAINT lots_statut_check CHECK (statut IN ('Disponible', 'Réservé', 'Expiré', 'Quarantaine', 'Épuisé'));

-- Tables annexes
CREATE TABLE IF NOT EXISTS public.configurations_fifo (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, tenant_id UUID NOT NULL, produit_id UUID REFERENCES public.produits(id) ON DELETE CASCADE, famille_id UUID REFERENCES public.famille_produit(id) ON DELETE CASCADE, priorite_fifo INTEGER DEFAULT 1 CHECK (priorite_fifo BETWEEN 1 AND 10), delai_alerte_jours INTEGER DEFAULT 30, action_automatique TEXT CHECK (action_automatique IN ('none', 'notify', 'block_sale', 'suggest_discount')), actif BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), CHECK ((produit_id IS NOT NULL AND famille_id IS NULL) OR (produit_id IS NULL AND famille_id IS NOT NULL)));

CREATE TABLE IF NOT EXISTS public.alertes_peremption (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, tenant_id UUID NOT NULL, lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE, produit_id UUID NOT NULL, niveau_urgence TEXT NOT NULL CHECK (niveau_urgence IN ('faible', 'moyen', 'eleve', 'critique')), date_peremption DATE NOT NULL, jours_restants INTEGER, quantite_concernee INTEGER NOT NULL, statut TEXT DEFAULT 'active' CHECK (statut IN ('active', 'traitee', 'ignoree', 'archivee')), action_recommandee TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), UNIQUE (tenant_id, lot_id));

CREATE TABLE IF NOT EXISTS public.mouvements_lots (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, tenant_id UUID NOT NULL, lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE, produit_id UUID NOT NULL, type_mouvement TEXT NOT NULL CHECK (type_mouvement IN ('entree', 'sortie', 'ajustement', 'transfert', 'retour', 'perime')), quantite INTEGER NOT NULL, quantite_avant INTEGER, quantite_apres INTEGER, prix_unitaire NUMERIC(10,2), valeur_totale NUMERIC(15,2), motif TEXT, reference_document TEXT, effectue_par UUID, date_mouvement TIMESTAMPTZ DEFAULT now(), created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE IF NOT EXISTS public.parametres_expiration (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, tenant_id UUID NOT NULL, produit_id UUID REFERENCES public.produits(id) ON DELETE CASCADE, famille_id UUID REFERENCES public.famille_produit(id) ON DELETE CASCADE, jours_alerte_peremption INTEGER DEFAULT 90, jours_blocage_vente INTEGER DEFAULT 0, notification_email BOOLEAN DEFAULT true, notification_sms BOOLEAN DEFAULT false, action_automatique TEXT CHECK (action_automatique IN ('none', 'alert', 'block', 'discount')), created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), CHECK ((produit_id IS NOT NULL AND famille_id IS NULL) OR (produit_id IS NULL AND famille_id IS NOT NULL) OR (produit_id IS NULL AND famille_id IS NULL)));

-- Fonctions
CREATE OR REPLACE FUNCTION public.calculer_jours_restants_expiration(date_peremption DATE) RETURNS INTEGER LANGUAGE plpgsql IMMUTABLE AS $$ BEGIN IF date_peremption IS NULL THEN RETURN NULL; END IF; RETURN (date_peremption - CURRENT_DATE); END; $$;

CREATE OR REPLACE FUNCTION public.determiner_niveau_urgence(jours_restants INTEGER) RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$ BEGIN IF jours_restants IS NULL THEN RETURN 'none'; ELSIF jours_restants <= 0 THEN RETURN 'critique'; ELSIF jours_restants <= 7 THEN RETURN 'eleve'; ELSIF jours_restants <= 30 THEN RETURN 'moyen'; ELSE RETURN 'faible'; END IF; END; $$;

CREATE OR REPLACE FUNCTION public.update_lots_timestamp() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.creer_alerte_peremption_auto() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_jours_restants INTEGER; v_niveau_urgence TEXT; v_action_recommandee TEXT;
BEGIN
  IF NEW.date_peremption IS NULL OR NEW.quantite_restante <= 0 THEN RETURN NEW; END IF;
  v_jours_restants := calculer_jours_restants_expiration(NEW.date_peremption);
  v_niveau_urgence := determiner_niveau_urgence(v_jours_restants);
  IF v_niveau_urgence IN ('critique', 'eleve', 'moyen') THEN
    v_action_recommandee := CASE v_niveau_urgence WHEN 'critique' THEN 'RETRAIT IMMÉDIAT' WHEN 'eleve' THEN 'VENTE PRIORITAIRE' ELSE 'Surveiller' END;
    INSERT INTO public.alertes_peremption (tenant_id, lot_id, produit_id, niveau_urgence, date_peremption, jours_restants, quantite_concernee, statut, action_recommandee)
    VALUES (NEW.tenant_id, NEW.id, NEW.produit_id, v_niveau_urgence, NEW.date_peremption, v_jours_restants, NEW.quantite_restante, 'active', v_action_recommandee)
    ON CONFLICT (tenant_id, lot_id) DO UPDATE SET niveau_urgence = EXCLUDED.niveau_urgence, jours_restants = EXCLUDED.jours_restants, quantite_concernee = EXCLUDED.quantite_concernee, action_recommandee = EXCLUDED.action_recommandee, statut = CASE WHEN alertes_peremption.statut = 'ignoree' THEN 'ignoree' ELSE 'active' END, updated_at = now();
  END IF;
  RETURN NEW;
END; $$;

-- Triggers
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

-- Index
CREATE INDEX IF NOT EXISTS idx_lots_tenant_produit ON public.lots(tenant_id, produit_id);
CREATE INDEX IF NOT EXISTS idx_lots_date_peremption ON public.lots(date_peremption) WHERE date_peremption IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lots_statut ON public.lots(statut);
CREATE INDEX IF NOT EXISTS idx_lots_reception ON public.lots(reception_id) WHERE reception_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alertes_peremption_tenant_statut ON public.alertes_peremption(tenant_id, statut);
CREATE INDEX IF NOT EXISTS idx_mouvements_lots_tenant_lot ON public.mouvements_lots(tenant_id, lot_id);

-- RLS
ALTER TABLE public.configurations_fifo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertes_peremption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouvements_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_expiration ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "RLS configurations_fifo" ON public.configurations_fifo;
CREATE POLICY "RLS configurations_fifo" ON public.configurations_fifo USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "RLS alertes_peremption" ON public.alertes_peremption;
CREATE POLICY "RLS alertes_peremption" ON public.alertes_peremption USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "RLS mouvements_lots" ON public.mouvements_lots;
CREATE POLICY "RLS mouvements_lots" ON public.mouvements_lots USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "RLS parametres_expiration" ON public.parametres_expiration;
CREATE POLICY "RLS parametres_expiration" ON public.parametres_expiration USING (tenant_id = get_current_user_tenant_id());

-- Migration données
UPDATE public.lots SET statut = 'Disponible', date_reception = created_at::DATE WHERE statut IS NULL OR date_reception IS NULL;