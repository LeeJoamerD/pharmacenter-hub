-- Phase 1: Création des tables manquantes pour les améliorations avancées du Point de Vente
-- Tables: retours, lignes_retours, programme_fidelite, mouvements_points, recompenses_fidelite, 
-- prescriptions, lignes_prescriptions, analytiques_pos

-- ============================================================================
-- 1. TABLE RETOURS (Retours et Échanges)
-- ============================================================================
CREATE TABLE public.retours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  numero_retour text NOT NULL UNIQUE,
  date_retour timestamp with time zone DEFAULT now(),
  vente_origine_id uuid REFERENCES public.ventes(id) ON DELETE RESTRICT,
  numero_vente_origine text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  type_operation text CHECK (type_operation IN ('Retour', 'Échange', 'Avoir')),
  montant_total_retour numeric(15,2) DEFAULT 0,
  montant_rembourse numeric(15,2) DEFAULT 0,
  montant_avoir numeric(15,2) DEFAULT 0,
  mode_remboursement text CHECK (mode_remboursement IN ('Espèces', 'Virement', 'Avoir', 'Crédit compte')),
  statut text CHECK (statut IN ('En attente', 'Approuvé', 'Rejeté', 'Terminé')) DEFAULT 'En attente',
  motif_retour text NOT NULL,
  notes text,
  agent_id uuid REFERENCES public.personnel(id),
  validateur_id uuid REFERENCES public.personnel(id),
  date_validation timestamp with time zone,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.retours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view returns from their tenant" 
ON public.retours FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can create returns in their tenant" 
ON public.retours FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update returns from their tenant" 
ON public.retours FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE INDEX idx_retours_tenant ON public.retours(tenant_id);
CREATE INDEX idx_retours_date ON public.retours(tenant_id, date_retour DESC);
CREATE INDEX idx_retours_vente ON public.retours(vente_origine_id);
CREATE INDEX idx_retours_statut ON public.retours(tenant_id, statut);

-- ============================================================================
-- 2. TABLE LIGNES_RETOURS
-- ============================================================================
CREATE TABLE public.lignes_retours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  retour_id uuid NOT NULL REFERENCES public.retours(id) ON DELETE CASCADE,
  produit_id uuid REFERENCES public.produits(id),
  lot_id uuid REFERENCES public.lots(id),
  quantite_retournee integer NOT NULL CHECK (quantite_retournee > 0),
  prix_unitaire numeric(15,2) NOT NULL,
  montant_ligne numeric(15,2) NOT NULL,
  etat_produit text CHECK (etat_produit IN ('Parfait', 'Endommagé', 'Expiré', 'Non conforme')),
  taux_remboursement numeric(5,2) DEFAULT 100.00,
  motif_ligne text,
  remis_en_stock boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.lignes_retours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view return lines from their tenant" 
ON public.lignes_retours FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can create return lines in their tenant" 
ON public.lignes_retours FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update return lines from their tenant" 
ON public.lignes_retours FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE INDEX idx_lignes_retours_retour ON public.lignes_retours(retour_id);
CREATE INDEX idx_lignes_retours_produit ON public.lignes_retours(produit_id);

-- ============================================================================
-- 3. TABLE PROGRAMME_FIDELITE (Programme de Fidélité)
-- ============================================================================
CREATE TABLE public.programme_fidelite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  numero_carte text UNIQUE,
  points_actuels integer DEFAULT 0,
  points_cumules integer DEFAULT 0,
  points_utilises integer DEFAULT 0,
  niveau_fidelite text CHECK (niveau_fidelite IN ('Bronze', 'Silver', 'Gold', 'Platinum')) DEFAULT 'Bronze',
  date_adhesion date DEFAULT CURRENT_DATE,
  date_derniere_activite timestamp with time zone,
  montant_total_achats numeric(15,2) DEFAULT 0,
  nombre_achats integer DEFAULT 0,
  recompenses_gagnees integer DEFAULT 0,
  recompenses_utilisees integer DEFAULT 0,
  statut text CHECK (statut IN ('Actif', 'Inactif', 'Suspendu')) DEFAULT 'Actif',
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id, client_id)
);

ALTER TABLE public.programme_fidelite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view loyalty programs from their tenant" 
ON public.programme_fidelite FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can create loyalty programs in their tenant" 
ON public.programme_fidelite FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update loyalty programs from their tenant" 
ON public.programme_fidelite FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE INDEX idx_programme_fidelite_tenant ON public.programme_fidelite(tenant_id);
CREATE INDEX idx_programme_fidelite_client ON public.programme_fidelite(client_id);
CREATE INDEX idx_programme_fidelite_niveau ON public.programme_fidelite(tenant_id, niveau_fidelite);

-- ============================================================================
-- 4. TABLE MOUVEMENTS_POINTS (Historique des Points)
-- ============================================================================
CREATE TABLE public.mouvements_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  programme_id uuid NOT NULL REFERENCES public.programme_fidelite(id) ON DELETE CASCADE,
  type_mouvement text CHECK (type_mouvement IN ('Gain', 'Utilisation', 'Expiration', 'Ajustement', 'Bonus')) NOT NULL,
  montant_points integer NOT NULL,
  points_avant integer NOT NULL,
  points_apres integer NOT NULL,
  reference_type text,
  reference_id uuid,
  description text,
  agent_id uuid REFERENCES public.personnel(id),
  date_mouvement timestamp with time zone DEFAULT now(),
  date_expiration date,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.mouvements_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view point movements from their tenant" 
ON public.mouvements_points FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can create point movements in their tenant" 
ON public.mouvements_points FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE INDEX idx_mouvements_points_programme ON public.mouvements_points(programme_id);
CREATE INDEX idx_mouvements_points_date ON public.mouvements_points(tenant_id, date_mouvement DESC);

-- ============================================================================
-- 5. TABLE RECOMPENSES_FIDELITE (Catalogue de Récompenses)
-- ============================================================================
CREATE TABLE public.recompenses_fidelite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  nom text NOT NULL,
  description text,
  type_recompense text CHECK (type_recompense IN ('Remise', 'Produit gratuit', 'Cashback', 'Service')) NOT NULL,
  cout_points integer NOT NULL CHECK (cout_points > 0),
  valeur numeric(15,2),
  produit_id uuid REFERENCES public.produits(id),
  niveau_requis text CHECK (niveau_requis IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  duree_validite_jours integer DEFAULT 30,
  est_actif boolean DEFAULT true,
  stock_disponible integer,
  utilisations integer DEFAULT 0,
  image_url text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.recompenses_fidelite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rewards from their tenant" 
ON public.recompenses_fidelite FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can create rewards in their tenant" 
ON public.recompenses_fidelite FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update rewards from their tenant" 
ON public.recompenses_fidelite FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE INDEX idx_recompenses_tenant ON public.recompenses_fidelite(tenant_id);
CREATE INDEX idx_recompenses_actif ON public.recompenses_fidelite(tenant_id, est_actif);

-- ============================================================================
-- 6. TABLE PRESCRIPTIONS (Gestion des Ordonnances)
-- ============================================================================
CREATE TABLE public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  numero_prescription text NOT NULL UNIQUE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  medecin_nom text,
  medecin_specialite text,
  medecin_telephone text,
  date_prescription date NOT NULL,
  date_expiration date,
  type_prescription text CHECK (type_prescription IN ('Ordinaire', 'Renouvelable', 'Urgence')),
  diagnostic text,
  instructions text,
  fichier_url text,
  est_validee boolean DEFAULT false,
  validateur_id uuid REFERENCES public.personnel(id),
  date_validation timestamp with time zone,
  vente_id uuid REFERENCES public.ventes(id),
  statut text CHECK (statut IN ('En attente', 'Validée', 'Partiellement servie', 'Servie', 'Expirée', 'Rejetée')) DEFAULT 'En attente',
  metadata jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view prescriptions from their tenant" 
ON public.prescriptions FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can create prescriptions in their tenant" 
ON public.prescriptions FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update prescriptions from their tenant" 
ON public.prescriptions FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE INDEX idx_prescriptions_tenant ON public.prescriptions(tenant_id);
CREATE INDEX idx_prescriptions_client ON public.prescriptions(client_id);
CREATE INDEX idx_prescriptions_statut ON public.prescriptions(tenant_id, statut);
CREATE INDEX idx_prescriptions_date ON public.prescriptions(tenant_id, date_prescription DESC);

-- ============================================================================
-- 7. TABLE LIGNES_PRESCRIPTIONS
-- ============================================================================
CREATE TABLE public.lignes_prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  prescription_id uuid NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  produit_id uuid REFERENCES public.produits(id),
  nom_medicament text NOT NULL,
  dosage text,
  posologie text,
  duree_traitement text,
  quantite_prescrite integer NOT NULL,
  quantite_servie integer DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.lignes_prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view prescription lines from their tenant" 
ON public.lignes_prescriptions FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can create prescription lines in their tenant" 
ON public.lignes_prescriptions FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update prescription lines from their tenant" 
ON public.lignes_prescriptions FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE INDEX idx_lignes_prescriptions_prescription ON public.lignes_prescriptions(prescription_id);
CREATE INDEX idx_lignes_prescriptions_produit ON public.lignes_prescriptions(produit_id);

-- ============================================================================
-- 8. TABLE ANALYTIQUES_POS (Métriques Temps Réel)
-- ============================================================================
CREATE TABLE public.analytiques_pos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  heure integer CHECK (heure >= 0 AND heure < 24),
  caisse_id uuid REFERENCES public.caisses(id),
  agent_id uuid REFERENCES public.personnel(id),
  nombre_transactions integer DEFAULT 0,
  montant_total_ventes numeric(15,2) DEFAULT 0,
  montant_moyen_transaction numeric(15,2) DEFAULT 0,
  panier_moyen_articles numeric(10,2) DEFAULT 0,
  ventes_especes numeric(15,2) DEFAULT 0,
  ventes_carte numeric(15,2) DEFAULT 0,
  ventes_mobile numeric(15,2) DEFAULT 0,
  ventes_assurance numeric(15,2) DEFAULT 0,
  nouveaux_clients integer DEFAULT 0,
  clients_fidelite integer DEFAULT 0,
  points_distribues integer DEFAULT 0,
  articles_vendus integer DEFAULT 0,
  retours integer DEFAULT 0,
  temps_moyen_transaction interval,
  temps_attente_moyen interval,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id, date, heure, caisse_id)
);

ALTER TABLE public.analytiques_pos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics from their tenant" 
ON public.analytiques_pos FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can create analytics in their tenant" 
ON public.analytiques_pos FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update analytics from their tenant" 
ON public.analytiques_pos FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE INDEX idx_analytiques_tenant_date ON public.analytiques_pos(tenant_id, date DESC);
CREATE INDEX idx_analytiques_caisse ON public.analytiques_pos(caisse_id, date DESC);
CREATE INDEX idx_analytiques_agent ON public.analytiques_pos(agent_id, date DESC);

-- ============================================================================
-- 9. AJOUT COLONNES MANQUANTES DANS TABLES EXISTANTES
-- ============================================================================

-- Ajouter support split payment dans ventes
ALTER TABLE public.ventes 
ADD COLUMN IF NOT EXISTS mode_paiement_secondaire text,
ADD COLUMN IF NOT EXISTS montant_paiement_secondaire numeric(15,2),
ADD COLUMN IF NOT EXISTS reference_paiement text,
ADD COLUMN IF NOT EXISTS reference_paiement_secondaire text,
ADD COLUMN IF NOT EXISTS terminal_id text,
ADD COLUMN IF NOT EXISTS prescription_id uuid REFERENCES public.prescriptions(id);

-- Ajouter champ prescription_requise dans produits
ALTER TABLE public.produits
ADD COLUMN IF NOT EXISTS prescription_requise boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS code_barre_externe text,
ADD COLUMN IF NOT EXISTS scanner_config jsonb;

-- Ajouter points de fidélité dans ventes
ALTER TABLE public.ventes
ADD COLUMN IF NOT EXISTS points_gagnes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS points_utilises integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS recompense_appliquee_id uuid;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_ventes_prescription ON public.ventes(prescription_id);
CREATE INDEX IF NOT EXISTS idx_produits_code_barre ON public.produits(code_barre_externe);

-- ============================================================================
-- 10. TRIGGERS POUR UPDATED_AT
-- ============================================================================

CREATE TRIGGER trigger_update_retours_updated_at
  BEFORE UPDATE ON public.retours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_programme_fidelite_updated_at
  BEFORE UPDATE ON public.programme_fidelite
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_recompenses_fidelite_updated_at
  BEFORE UPDATE ON public.recompenses_fidelite
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_analytiques_pos_updated_at
  BEFORE UPDATE ON public.analytiques_pos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();