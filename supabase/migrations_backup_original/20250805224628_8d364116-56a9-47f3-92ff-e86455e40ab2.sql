-- Phase 1: Achèvement de la Structure Backend pour la Section "Lots"

-- 1. Amélioration de la table lots existante (ajout des colonnes manquantes)
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS prix_achat_unitaire NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS fournisseur_id UUID REFERENCES public.fournisseurs(id);
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS reception_id UUID REFERENCES public.receptions_fournisseurs(id);
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS emplacement TEXT;
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'Disponible' CHECK (statut IN ('Disponible', 'Réservé', 'Expiré', 'Quarantaine', 'Épuisé'));
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS date_fabrication DATE;
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS date_reception DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS prix_vente_suggere NUMERIC(10,2);
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Table des configurations FIFO
CREATE TABLE IF NOT EXISTS public.configurations_fifo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  famille_id UUID REFERENCES public.famille_produit(id),
  produit_id UUID REFERENCES public.produits(id),
  actif BOOLEAN DEFAULT true,
  priorite INTEGER DEFAULT 1 CHECK (priorite >= 1 AND priorite <= 5),
  delai_alerte_jours INTEGER DEFAULT 30,
  action_automatique BOOLEAN DEFAULT false,
  type_regle TEXT DEFAULT 'famille' CHECK (type_regle IN ('famille', 'produit', 'global')),
  tolerance_delai_jours INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Table des alertes de péremption
CREATE TABLE IF NOT EXISTS public.alertes_peremption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL,
  type_alerte TEXT NOT NULL CHECK (type_alerte IN ('peremption_proche', 'expire', 'critique')),
  niveau_urgence TEXT DEFAULT 'moyen' CHECK (niveau_urgence IN ('faible', 'moyen', 'eleve', 'critique')),
  jours_restants INTEGER,
  quantite_concernee INTEGER,
  statut TEXT DEFAULT 'active' CHECK (statut IN ('active', 'traitee', 'ignoree')),
  date_alerte TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date_traitement TIMESTAMP WITH TIME ZONE,
  traite_par_id UUID REFERENCES public.personnel(id),
  actions_recommandees TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Table des mouvements de lots (traçabilité détaillée)
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

-- 5. Table des paramètres d'expiration
CREATE TABLE IF NOT EXISTS public.parametres_expiration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  famille_id UUID REFERENCES public.famille_produit(id),
  produit_id UUID REFERENCES public.produits(id),
  delai_alerte_jours INTEGER DEFAULT 90,
  delai_critique_jours INTEGER DEFAULT 30,
  delai_bloquant_jours INTEGER DEFAULT 7,
  action_auto_alerte BOOLEAN DEFAULT true,
  action_auto_blocage BOOLEAN DEFAULT false,
  type_parametre TEXT DEFAULT 'famille' CHECK (type_parametre IN ('famille', 'produit', 'global')),
  notifications_email BOOLEAN DEFAULT true,
  notifications_dashboard BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Trigger pour les timestamps automatiques
CREATE OR REPLACE FUNCTION public.update_lots_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour les nouvelles tables
CREATE TRIGGER update_configurations_fifo_timestamp
  BEFORE UPDATE ON public.configurations_fifo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alertes_peremption_timestamp
  BEFORE UPDATE ON public.alertes_peremption
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parametres_expiration_timestamp
  BEFORE UPDATE ON public.parametres_expiration
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Fonctions utilitaires pour la gestion des lots

-- Fonction pour calculer les jours restants avant expiration
CREATE OR REPLACE FUNCTION public.calculer_jours_restants_expiration(date_peremption DATE)
RETURNS INTEGER AS $$
BEGIN
  IF date_peremption IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN (date_peremption - CURRENT_DATE);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour déterminer le niveau d'urgence basé sur les jours restants
CREATE OR REPLACE FUNCTION public.determiner_niveau_urgence(jours_restants INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF jours_restants IS NULL THEN
    RETURN 'none';
  ELSIF jours_restants <= 0 THEN
    RETURN 'critique';
  ELSIF jours_restants <= 7 THEN
    RETURN 'eleve';
  ELSIF jours_restants <= 30 THEN
    RETURN 'moyen';
  ELSE
    RETURN 'faible';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour créer automatiquement des alertes de péremption
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

-- Trigger pour créer automatiquement les alertes
CREATE TRIGGER trigger_alerte_peremption_auto
  AFTER INSERT OR UPDATE OF date_peremption, quantite_restante ON public.lots
  FOR EACH ROW
  EXECUTE FUNCTION public.creer_alerte_peremption_auto();

-- 8. Politiques RLS pour toutes les nouvelles tables

-- RLS pour configurations_fifo
ALTER TABLE public.configurations_fifo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view FIFO configs from their tenant"
  ON public.configurations_fifo FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert FIFO configs in their tenant"
  ON public.configurations_fifo FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update FIFO configs from their tenant"
  ON public.configurations_fifo FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete FIFO configs from their tenant"
  ON public.configurations_fifo FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- RLS pour alertes_peremption
ALTER TABLE public.alertes_peremption ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expiration alerts from their tenant"
  ON public.alertes_peremption FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert expiration alerts in their tenant"
  ON public.alertes_peremption FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update expiration alerts from their tenant"
  ON public.alertes_peremption FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete expiration alerts from their tenant"
  ON public.alertes_peremption FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- RLS pour mouvements_lots
ALTER TABLE public.mouvements_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lot movements from their tenant"
  ON public.mouvements_lots FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert lot movements in their tenant"
  ON public.mouvements_lots FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- RLS pour parametres_expiration
ALTER TABLE public.parametres_expiration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expiration params from their tenant"
  ON public.parametres_expiration FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert expiration params in their tenant"
  ON public.parametres_expiration FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update expiration params from their tenant"
  ON public.parametres_expiration FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete expiration params from their tenant"
  ON public.parametres_expiration FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- 9. Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_lots_tenant_produit ON public.lots(tenant_id, produit_id);
CREATE INDEX IF NOT EXISTS idx_lots_date_peremption ON public.lots(date_peremption) WHERE date_peremption IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lots_statut ON public.lots(statut);
CREATE INDEX IF NOT EXISTS idx_alertes_peremption_tenant_statut ON public.alertes_peremption(tenant_id, statut);
CREATE INDEX IF NOT EXISTS idx_alertes_peremption_urgence ON public.alertes_peremption(niveau_urgence);
CREATE INDEX IF NOT EXISTS idx_mouvements_lots_tenant_lot ON public.mouvements_lots(tenant_id, lot_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_lots_date ON public.mouvements_lots(date_mouvement);
CREATE INDEX IF NOT EXISTS idx_configurations_fifo_tenant ON public.configurations_fifo(tenant_id, actif);