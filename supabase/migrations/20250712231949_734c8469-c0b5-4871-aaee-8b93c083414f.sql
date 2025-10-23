-- Étape 5 : Tables ventes et caisse
-- Séparation claire entre vente (ticket) et encaissement

-- Table des ventes (tickets)
CREATE TABLE public.ventes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    numero_ticket TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id),
    agent_vendeur_id UUID REFERENCES public.personnel(id),
    montant_brut NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    montant_remise_automatique NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    montant_remise_manuelle NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    taux_remise_manuelle NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    montant_net NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    statut TEXT NOT NULL DEFAULT 'En attente' CHECK (statut IN ('En attente', 'Encaissé', 'Annulé')),
    date_vente TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT unique_numero_ticket_per_tenant UNIQUE (tenant_id, numero_ticket),
    CONSTRAINT positive_amounts CHECK (
        montant_brut >= 0 AND 
        montant_remise_automatique >= 0 AND 
        montant_remise_manuelle >= 0 AND 
        montant_net >= 0 AND
        taux_remise_manuelle >= 0 AND taux_remise_manuelle <= 100
    )
);

-- Table des lignes de vente
CREATE TABLE public.lignes_ventes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    vente_id UUID NOT NULL REFERENCES public.ventes(id) ON DELETE CASCADE,
    produit_id UUID NOT NULL REFERENCES public.produits(id),
    lot_id UUID REFERENCES public.lots(id),
    quantite INTEGER NOT NULL,
    prix_unitaire_ht NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    prix_unitaire_ttc NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    remise_ligne NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    montant_ligne_ht NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    montant_ligne_ttc NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT positive_quantities_and_amounts CHECK (
        quantite > 0 AND 
        prix_unitaire_ht >= 0 AND 
        prix_unitaire_ttc >= 0 AND 
        remise_ligne >= 0 AND
        montant_ligne_ht >= 0 AND
        montant_ligne_ttc >= 0
    )
);

-- Table des sessions de caisse
CREATE TABLE public.sessions_caisse (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    caissier_id UUID NOT NULL REFERENCES public.personnel(id),
    numero_session TEXT NOT NULL,
    date_ouverture TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    date_fermeture TIMESTAMP WITH TIME ZONE,
    fond_caisse_ouverture NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    montant_theorique_fermeture NUMERIC(10,2) DEFAULT 0.00,
    montant_reel_fermeture NUMERIC(10,2),
    ecart NUMERIC(10,2),
    statut TEXT NOT NULL DEFAULT 'Ouverte' CHECK (statut IN ('Ouverte', 'Fermée')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT unique_session_per_tenant UNIQUE (tenant_id, numero_session),
    CONSTRAINT positive_amounts_session CHECK (fond_caisse_ouverture >= 0)
);

-- Table des encaissements
CREATE TABLE public.encaissements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    vente_id UUID NOT NULL REFERENCES public.ventes(id),
    session_caisse_id UUID REFERENCES public.sessions_caisse(id),
    numero_encaissement TEXT NOT NULL,
    caissier_id UUID NOT NULL REFERENCES public.personnel(id),
    montant_a_encaisser NUMERIC(10,2) NOT NULL,
    montant_recu NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    montant_rendu NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    mode_paiement TEXT NOT NULL CHECK (mode_paiement IN ('Espèces', 'Carte', 'Mobile Money', 'Chèque', 'Crédit', 'Mixte')),
    reference_paiement TEXT,
    statut TEXT NOT NULL DEFAULT 'En cours' CHECK (statut IN ('En cours', 'Validé', 'Annulé')),
    date_encaissement TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT unique_encaissement_per_tenant UNIQUE (tenant_id, numero_encaissement),
    CONSTRAINT positive_amounts_encaissement CHECK (
        montant_a_encaisser >= 0 AND 
        montant_recu >= 0 AND 
        montant_rendu >= 0
    )
);

-- Table des mouvements de caisse
CREATE TABLE public.mouvements_caisse (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    session_caisse_id UUID NOT NULL REFERENCES public.sessions_caisse(id),
    type_mouvement TEXT NOT NULL CHECK (type_mouvement IN ('Encaissement', 'Retrait', 'Fond_initial', 'Ajustement')),
    montant NUMERIC(10,2) NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    description TEXT,
    agent_id UUID REFERENCES public.personnel(id),
    date_mouvement TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_ventes_tenant_id ON public.ventes(tenant_id);
CREATE INDEX idx_ventes_statut ON public.ventes(tenant_id, statut);
CREATE INDEX idx_ventes_date ON public.ventes(tenant_id, date_vente);
CREATE INDEX idx_ventes_numero_ticket ON public.ventes(tenant_id, numero_ticket);

CREATE INDEX idx_lignes_ventes_tenant_id ON public.lignes_ventes(tenant_id);
CREATE INDEX idx_lignes_ventes_vente_id ON public.lignes_ventes(vente_id);
CREATE INDEX idx_lignes_ventes_produit_id ON public.lignes_ventes(produit_id);

CREATE INDEX idx_sessions_caisse_tenant_id ON public.sessions_caisse(tenant_id);
CREATE INDEX idx_sessions_caisse_caissier ON public.sessions_caisse(caissier_id);
CREATE INDEX idx_sessions_caisse_statut ON public.sessions_caisse(tenant_id, statut);

CREATE INDEX idx_encaissements_tenant_id ON public.encaissements(tenant_id);
CREATE INDEX idx_encaissements_vente_id ON public.encaissements(vente_id);
CREATE INDEX idx_encaissements_session ON public.encaissements(session_caisse_id);
CREATE INDEX idx_encaissements_statut ON public.encaissements(tenant_id, statut);

CREATE INDEX idx_mouvements_caisse_tenant_id ON public.mouvements_caisse(tenant_id);
CREATE INDEX idx_mouvements_caisse_session ON public.mouvements_caisse(session_caisse_id);
CREATE INDEX idx_mouvements_caisse_type ON public.mouvements_caisse(tenant_id, type_mouvement);

-- Triggers pour updated_at
CREATE TRIGGER update_ventes_updated_at
    BEFORE UPDATE ON public.ventes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lignes_ventes_updated_at
    BEFORE UPDATE ON public.lignes_ventes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_caisse_updated_at
    BEFORE UPDATE ON public.sessions_caisse
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_encaissements_updated_at
    BEFORE UPDATE ON public.encaissements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mouvements_caisse_updated_at
    BEFORE UPDATE ON public.mouvements_caisse
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers d'audit
CREATE TRIGGER ventes_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.ventes
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER lignes_ventes_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.lignes_ventes
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER sessions_caisse_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.sessions_caisse
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER encaissements_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.encaissements
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER mouvements_caisse_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.mouvements_caisse
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

-- Triggers de sécurité cross-tenant
CREATE TRIGGER ventes_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.ventes
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER lignes_ventes_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.lignes_ventes
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER sessions_caisse_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.sessions_caisse
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER encaissements_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.encaissements
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER mouvements_caisse_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.mouvements_caisse
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

-- Activation du RLS
ALTER TABLE public.ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions_caisse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encaissements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouvements_caisse ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour ventes
CREATE POLICY "Users can view sales from their tenant" 
ON public.ventes 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert sales in their tenant" 
ON public.ventes 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update sales from their tenant" 
ON public.ventes 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete sales from their tenant" 
ON public.ventes 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour lignes_ventes
CREATE POLICY "Users can view sale lines from their tenant" 
ON public.lignes_ventes 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert sale lines in their tenant" 
ON public.lignes_ventes 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update sale lines from their tenant" 
ON public.lignes_ventes 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete sale lines from their tenant" 
ON public.lignes_ventes 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour sessions_caisse
CREATE POLICY "Users can view cash sessions from their tenant" 
ON public.sessions_caisse 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert cash sessions in their tenant" 
ON public.sessions_caisse 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update cash sessions from their tenant" 
ON public.sessions_caisse 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete cash sessions from their tenant" 
ON public.sessions_caisse 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour encaissements
CREATE POLICY "Users can view payments from their tenant" 
ON public.encaissements 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert payments in their tenant" 
ON public.encaissements 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update payments from their tenant" 
ON public.encaissements 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete payments from their tenant" 
ON public.encaissements 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour mouvements_caisse
CREATE POLICY "Users can view cash movements from their tenant" 
ON public.mouvements_caisse 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert cash movements in their tenant" 
ON public.mouvements_caisse 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update cash movements from their tenant" 
ON public.mouvements_caisse 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete cash movements from their tenant" 
ON public.mouvements_caisse 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());