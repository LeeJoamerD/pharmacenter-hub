-- Créer les tables partenaires et clients

-- Table Assureurs
CREATE TABLE public.assureurs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    libelle_assureur TEXT NOT NULL,
    adresse TEXT,
    telephone_appel TEXT,
    telephone_whatsapp TEXT,
    email TEXT,
    limite_dette DECIMAL(15,2) DEFAULT 0.00,
    niu TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, libelle_assureur),
    UNIQUE(tenant_id, email),
    UNIQUE(tenant_id, niu)
);

-- Table Sociétés
CREATE TABLE public.societes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    libelle_societe TEXT NOT NULL,
    adresse TEXT,
    telephone_appel TEXT,
    telephone_whatsapp TEXT,
    email TEXT,
    limite_dette DECIMAL(15,2) DEFAULT 0.00,
    niu TEXT,
    assureur_id UUID NOT NULL,
    taux_couverture_agent DECIMAL(5,2) DEFAULT 0.00,
    taux_couverture_ayant_droit DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (assureur_id) REFERENCES public.assureurs(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE(tenant_id, libelle_societe),
    UNIQUE(tenant_id, email),
    UNIQUE(tenant_id, niu)
);

-- Table Conventionnés
CREATE TABLE public.conventionnes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    noms TEXT NOT NULL,
    adresse TEXT,
    ville TEXT,
    telephone_appel TEXT,
    telephone_whatsapp TEXT,
    email TEXT,
    limite_dette DECIMAL(15,2) DEFAULT 0.00,
    niu TEXT,
    taux_ticket_moderateur DECIMAL(5,2) DEFAULT 0.00,
    caution DECIMAL(15,2) DEFAULT 0.00,
    taux_remise_automatique DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, noms),
    UNIQUE(tenant_id, email),
    UNIQUE(tenant_id, niu)
);

-- Table Clients (table unifiée)
CREATE TABLE public.clients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    type_client public.type_client_enum NOT NULL,
    nom_complet TEXT,
    telephone TEXT,
    adresse TEXT,
    -- Foreign Keys pour les types spécifiques
    personnel_id UUID,
    conventionne_id UUID,
    societe_id UUID,
    taux_remise_automatique DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (personnel_id) REFERENCES public.personnel(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (conventionne_id) REFERENCES public.conventionnes(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (societe_id) REFERENCES public.societes(id) ON DELETE SET NULL ON UPDATE CASCADE,
    -- Contraintes pour assurer l'intégrité selon le type
    CONSTRAINT check_personnel_type CHECK (
        (type_client = 'Personnel' AND personnel_id IS NOT NULL AND conventionne_id IS NULL AND societe_id IS NULL) OR
        (type_client != 'Personnel')
    ),
    CONSTRAINT check_conventionne_type CHECK (
        (type_client = 'Conventionné' AND conventionne_id IS NOT NULL AND personnel_id IS NULL AND societe_id IS NULL) OR
        (type_client != 'Conventionné')
    ),
    CONSTRAINT check_assure_type CHECK (
        (type_client = 'Assuré' AND societe_id IS NOT NULL AND personnel_id IS NULL AND conventionne_id IS NULL) OR
        (type_client != 'Assuré')
    ),
    CONSTRAINT check_ordinaire_type CHECK (
        (type_client = 'Ordinaire' AND personnel_id IS NULL AND conventionne_id IS NULL AND societe_id IS NULL) OR
        (type_client != 'Ordinaire')
    ),
    -- Contraintes d'unicité pour les liens
    UNIQUE(tenant_id, personnel_id),
    UNIQUE(tenant_id, conventionne_id)
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.assureurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.societes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conventionnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour Assureurs
CREATE POLICY "Users can view insurers from their tenant" 
ON public.assureurs 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert insurers in their tenant" 
ON public.assureurs 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update insurers from their tenant" 
ON public.assureurs 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete insurers from their tenant" 
ON public.assureurs 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer les politiques RLS pour Sociétés
CREATE POLICY "Users can view companies from their tenant" 
ON public.societes 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert companies in their tenant" 
ON public.societes 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update companies from their tenant" 
ON public.societes 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete companies from their tenant" 
ON public.societes 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer les politiques RLS pour Conventionnés
CREATE POLICY "Users can view contracted partners from their tenant" 
ON public.conventionnes 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert contracted partners in their tenant" 
ON public.conventionnes 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update contracted partners from their tenant" 
ON public.conventionnes 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete contracted partners from their tenant" 
ON public.conventionnes 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer les politiques RLS pour Clients
CREATE POLICY "Users can view clients from their tenant" 
ON public.clients 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert clients in their tenant" 
ON public.clients 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update clients from their tenant" 
ON public.clients 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete clients from their tenant" 
ON public.clients 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer les triggers pour updated_at
CREATE TRIGGER update_assureurs_updated_at
BEFORE UPDATE ON public.assureurs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_societes_updated_at
BEFORE UPDATE ON public.societes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conventionnes_updated_at
BEFORE UPDATE ON public.conventionnes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Créer les triggers d'audit
CREATE TRIGGER audit_assureurs
AFTER INSERT OR UPDATE OR DELETE ON public.assureurs
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_societes
AFTER INSERT OR UPDATE OR DELETE ON public.societes
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_conventionnes
AFTER INSERT OR UPDATE OR DELETE ON public.conventionnes
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_clients
AFTER INSERT OR UPDATE OR DELETE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

-- Créer les triggers de sécurité cross-tenant
CREATE TRIGGER security_assureurs
BEFORE INSERT OR UPDATE ON public.assureurs
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER security_societes
BEFORE INSERT OR UPDATE ON public.societes
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER security_conventionnes
BEFORE INSERT OR UPDATE ON public.conventionnes
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER security_clients
BEFORE INSERT OR UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

-- Créer les index pour optimiser les performances
CREATE INDEX idx_assureurs_tenant_id ON public.assureurs(tenant_id);
CREATE INDEX idx_assureurs_is_active ON public.assureurs(tenant_id, is_active);

CREATE INDEX idx_societes_tenant_id ON public.societes(tenant_id);
CREATE INDEX idx_societes_assureur_id ON public.societes(assureur_id);

CREATE INDEX idx_conventionnes_tenant_id ON public.conventionnes(tenant_id);

CREATE INDEX idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX idx_clients_type ON public.clients(tenant_id, type_client);
CREATE INDEX idx_clients_personnel_id ON public.clients(personnel_id);
CREATE INDEX idx_clients_conventionne_id ON public.clients(conventionne_id);
CREATE INDEX idx_clients_societe_id ON public.clients(societe_id);