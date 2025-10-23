-- Créer les tables de référentiels de base

-- Table Catégorie Tarification
CREATE TABLE public.categorie_tarification (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    libelle_categorie TEXT NOT NULL,
    taux_tva DECIMAL(5,2) DEFAULT 0.00,
    taux_centime_additionnel DECIMAL(5,2) DEFAULT 0.00,
    coefficient_prix_vente DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, libelle_categorie)
);

-- Table Famille Produit
CREATE TABLE public.famille_produit (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    libelle_famille TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, libelle_famille)
);

-- Table Rayon Produit
CREATE TABLE public.rayon_produit (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    libelle_rayon TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, libelle_rayon)
);

-- Table Laboratoires
CREATE TABLE public.laboratoires (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    libelle TEXT NOT NULL,
    pays_siege TEXT,
    email_siege TEXT,
    email_delegation_local TEXT,
    telephone_appel_delegation_local TEXT,
    telephone_whatsapp_delegation_local TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, libelle)
);

-- Table Fournisseurs
CREATE TABLE public.fournisseurs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    nom TEXT NOT NULL,
    adresse TEXT,
    telephone_appel TEXT,
    telephone_whatsapp TEXT,
    email TEXT,
    niu TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, nom),
    UNIQUE(tenant_id, email),
    UNIQUE(tenant_id, niu)
);

-- Table Compte Dépenses
CREATE TABLE public.compte_depenses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    libelle_compte TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, libelle_compte)
);

-- Table Sous-Compte Dépenses
CREATE TABLE public.sous_compte_depenses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    libelle_sous_compte TEXT NOT NULL,
    compte_depenses_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (compte_depenses_id) REFERENCES public.compte_depenses(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.categorie_tarification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.famille_produit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rayon_produit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratoires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compte_depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sous_compte_depenses ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour toutes les tables
-- Catégorie Tarification
CREATE POLICY "Users can view categories from their tenant" 
ON public.categorie_tarification 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert categories in their tenant" 
ON public.categorie_tarification 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update categories from their tenant" 
ON public.categorie_tarification 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete categories from their tenant" 
ON public.categorie_tarification 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Famille Produit
CREATE POLICY "Users can view families from their tenant" 
ON public.famille_produit 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert families in their tenant" 
ON public.famille_produit 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update families from their tenant" 
ON public.famille_produit 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete families from their tenant" 
ON public.famille_produit 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Rayon Produit
CREATE POLICY "Users can view rayons from their tenant" 
ON public.rayon_produit 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert rayons in their tenant" 
ON public.rayon_produit 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update rayons from their tenant" 
ON public.rayon_produit 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete rayons from their tenant" 
ON public.rayon_produit 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Laboratoires
CREATE POLICY "Users can view laboratories from their tenant" 
ON public.laboratoires 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert laboratories in their tenant" 
ON public.laboratoires 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update laboratories from their tenant" 
ON public.laboratoires 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete laboratories from their tenant" 
ON public.laboratoires 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Fournisseurs
CREATE POLICY "Users can view suppliers from their tenant" 
ON public.fournisseurs 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert suppliers in their tenant" 
ON public.fournisseurs 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update suppliers from their tenant" 
ON public.fournisseurs 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete suppliers from their tenant" 
ON public.fournisseurs 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Compte Dépenses
CREATE POLICY "Users can view expense accounts from their tenant" 
ON public.compte_depenses 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert expense accounts in their tenant" 
ON public.compte_depenses 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update expense accounts from their tenant" 
ON public.compte_depenses 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete expense accounts from their tenant" 
ON public.compte_depenses 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Sous-Compte Dépenses
CREATE POLICY "Users can view sub expense accounts from their tenant" 
ON public.sous_compte_depenses 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert sub expense accounts in their tenant" 
ON public.sous_compte_depenses 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update sub expense accounts from their tenant" 
ON public.sous_compte_depenses 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete sub expense accounts from their tenant" 
ON public.sous_compte_depenses 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer les triggers pour updated_at
CREATE TRIGGER update_categorie_tarification_updated_at
BEFORE UPDATE ON public.categorie_tarification
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_famille_produit_updated_at
BEFORE UPDATE ON public.famille_produit
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rayon_produit_updated_at
BEFORE UPDATE ON public.rayon_produit
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_laboratoires_updated_at
BEFORE UPDATE ON public.laboratoires
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fournisseurs_updated_at
BEFORE UPDATE ON public.fournisseurs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compte_depenses_updated_at
BEFORE UPDATE ON public.compte_depenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sous_compte_depenses_updated_at
BEFORE UPDATE ON public.sous_compte_depenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Créer les triggers d'audit
CREATE TRIGGER audit_categorie_tarification
AFTER INSERT OR UPDATE OR DELETE ON public.categorie_tarification
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_famille_produit
AFTER INSERT OR UPDATE OR DELETE ON public.famille_produit
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_rayon_produit
AFTER INSERT OR UPDATE OR DELETE ON public.rayon_produit
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_laboratoires
AFTER INSERT OR UPDATE OR DELETE ON public.laboratoires
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_fournisseurs
AFTER INSERT OR UPDATE OR DELETE ON public.fournisseurs
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_compte_depenses
AFTER INSERT OR UPDATE OR DELETE ON public.compte_depenses
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_sous_compte_depenses
AFTER INSERT OR UPDATE OR DELETE ON public.sous_compte_depenses
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

-- Créer les triggers de sécurité cross-tenant
CREATE TRIGGER security_categorie_tarification
BEFORE INSERT OR UPDATE ON public.categorie_tarification
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER security_famille_produit
BEFORE INSERT OR UPDATE ON public.famille_produit
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER security_rayon_produit
BEFORE INSERT OR UPDATE ON public.rayon_produit
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER security_laboratoires
BEFORE INSERT OR UPDATE ON public.laboratoires
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER security_fournisseurs
BEFORE INSERT OR UPDATE ON public.fournisseurs
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER security_compte_depenses
BEFORE INSERT OR UPDATE ON public.compte_depenses
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER security_sous_compte_depenses
BEFORE INSERT OR UPDATE ON public.sous_compte_depenses
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

-- Créer les index pour optimiser les performances
CREATE INDEX idx_categorie_tarification_tenant_id ON public.categorie_tarification(tenant_id);
CREATE INDEX idx_famille_produit_tenant_id ON public.famille_produit(tenant_id);
CREATE INDEX idx_rayon_produit_tenant_id ON public.rayon_produit(tenant_id);
CREATE INDEX idx_laboratoires_tenant_id ON public.laboratoires(tenant_id);
CREATE INDEX idx_fournisseurs_tenant_id ON public.fournisseurs(tenant_id);
CREATE INDEX idx_compte_depenses_tenant_id ON public.compte_depenses(tenant_id);
CREATE INDEX idx_sous_compte_depenses_tenant_id ON public.sous_compte_depenses(tenant_id);
CREATE INDEX idx_sous_compte_depenses_compte_id ON public.sous_compte_depenses(compte_depenses_id);