-- Créer les tables produits et stock

-- Table Produits
CREATE TABLE public.produits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    libelle_produit TEXT NOT NULL,
    stock_limite INTEGER DEFAULT 0,
    stock_alerte INTEGER DEFAULT 0,
    prix_achat DECIMAL(15,2) DEFAULT 0.00,
    prix_vente_ht DECIMAL(15,2) DEFAULT 0.00,
    tva DECIMAL(15,2) DEFAULT 0.00,
    centime_additionnel DECIMAL(15,2) DEFAULT 0.00,
    prix_vente_ttc DECIMAL(15,2) DEFAULT 0.00,
    famille_produit_id UUID,
    rayon_produit_id UUID,
    id_produit_source UUID,
    quantite_unites_details_source INTEGER,
    niveau_detail INTEGER DEFAULT 1,
    code_cip TEXT,
    categorie_tarification_id UUID,
    reference_agent_enregistrement_id UUID,
    reference_agent_modification_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (famille_produit_id) REFERENCES public.famille_produit(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (rayon_produit_id) REFERENCES public.rayon_produit(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_produit_source) REFERENCES public.produits(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (categorie_tarification_id) REFERENCES public.categorie_tarification(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (reference_agent_enregistrement_id) REFERENCES public.personnel(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (reference_agent_modification_id) REFERENCES public.personnel(id) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE(tenant_id, code_cip),
    UNIQUE(tenant_id, libelle_produit)
);

-- Table Lots
CREATE TABLE public.lots (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    produit_id UUID NOT NULL,
    numero_lot TEXT NOT NULL,
    date_peremption DATE,
    quantite_initiale INTEGER NOT NULL,
    quantite_restante INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (produit_id) REFERENCES public.produits(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(tenant_id, numero_lot)
);

-- Table Commandes Fournisseurs
CREATE TABLE public.commandes_fournisseurs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    fournisseur_id UUID NOT NULL,
    date_commande TIMESTAMP WITH TIME ZONE DEFAULT now(),
    statut TEXT DEFAULT 'En cours',
    agent_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (fournisseur_id) REFERENCES public.fournisseurs(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES public.personnel(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Table Lignes Commande Fournisseur
CREATE TABLE public.lignes_commande_fournisseur (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    commande_id UUID NOT NULL,
    produit_id UUID NOT NULL,
    quantite_commandee INTEGER NOT NULL,
    prix_achat_unitaire_attendu DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (commande_id) REFERENCES public.commandes_fournisseurs(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES public.produits(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Table Réceptions Fournisseurs
CREATE TABLE public.receptions_fournisseurs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    commande_id UUID,
    fournisseur_id UUID NOT NULL,
    date_reception TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reference_facture TEXT,
    agent_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (commande_id) REFERENCES public.commandes_fournisseurs(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (fournisseur_id) REFERENCES public.fournisseurs(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES public.personnel(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Table Lignes Réception Fournisseur
CREATE TABLE public.lignes_reception_fournisseur (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    reception_id UUID NOT NULL,
    produit_id UUID NOT NULL,
    quantite_recue INTEGER NOT NULL,
    prix_achat_unitaire_reel DECIMAL(15,2) NOT NULL,
    date_peremption DATE,
    lot_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (reception_id) REFERENCES public.receptions_fournisseurs(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES public.produits(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Table Stock Mouvements
CREATE TABLE public.stock_mouvements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    produit_id UUID NOT NULL,
    lot_id UUID,
    type_mouvement TEXT NOT NULL,
    quantite INTEGER NOT NULL,
    date_mouvement TIMESTAMP WITH TIME ZONE DEFAULT now(),
    agent_id UUID,
    reference_id UUID,
    reference_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (produit_id) REFERENCES public.produits(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES public.personnel(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Table Inventaire Sessions
CREATE TABLE public.inventaire_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    date_debut TIMESTAMP WITH TIME ZONE DEFAULT now(),
    date_fin TIMESTAMP WITH TIME ZONE,
    agent_id UUID NOT NULL,
    statut TEXT DEFAULT 'En cours',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (agent_id) REFERENCES public.personnel(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commandes_fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_commande_fournisseur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receptions_fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_reception_fournisseur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_mouvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventaire_sessions ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour Produits
CREATE POLICY "Users can view products from their tenant" 
ON public.produits 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert products in their tenant" 
ON public.produits 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update products from their tenant" 
ON public.produits 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete products from their tenant" 
ON public.produits 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer les politiques RLS pour Lots
CREATE POLICY "Users can view lots from their tenant" 
ON public.lots 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert lots in their tenant" 
ON public.lots 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update lots from their tenant" 
ON public.lots 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete lots from their tenant" 
ON public.lots 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer les politiques RLS pour Commandes Fournisseurs
CREATE POLICY "Users can view supplier orders from their tenant" 
ON public.commandes_fournisseurs 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert supplier orders in their tenant" 
ON public.commandes_fournisseurs 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update supplier orders from their tenant" 
ON public.commandes_fournisseurs 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete supplier orders from their tenant" 
ON public.commandes_fournisseurs 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer les politiques RLS pour Lignes Commande Fournisseur
CREATE POLICY "Users can view supplier order lines from their tenant" 
ON public.lignes_commande_fournisseur 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert supplier order lines in their tenant" 
ON public.lignes_commande_fournisseur 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update supplier order lines from their tenant" 
ON public.lignes_commande_fournisseur 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete supplier order lines from their tenant" 
ON public.lignes_commande_fournisseur 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer les politiques RLS pour Réceptions Fournisseurs
CREATE POLICY "Users can view supplier receptions from their tenant" 
ON public.receptions_fournisseurs 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert supplier receptions in their tenant" 
ON public.receptions_fournisseurs 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update supplier receptions from their tenant" 
ON public.receptions_fournisseurs 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete supplier receptions from their tenant" 
ON public.receptions_fournisseurs 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer les politiques RLS pour Lignes Réception Fournisseur
CREATE POLICY "Users can view supplier reception lines from their tenant" 
ON public.lignes_reception_fournisseur 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert supplier reception lines in their tenant" 
ON public.lignes_reception_fournisseur 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update supplier reception lines from their tenant" 
ON public.lignes_reception_fournisseur 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete supplier reception lines from their tenant" 
ON public.lignes_reception_fournisseur 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer les politiques RLS pour Stock Mouvements
CREATE POLICY "Users can view stock movements from their tenant" 
ON public.stock_mouvements 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert stock movements in their tenant" 
ON public.stock_mouvements 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update stock movements from their tenant" 
ON public.stock_mouvements 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete stock movements from their tenant" 
ON public.stock_mouvements 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer les politiques RLS pour Inventaire Sessions
CREATE POLICY "Users can view inventory sessions from their tenant" 
ON public.inventaire_sessions 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert inventory sessions in their tenant" 
ON public.inventaire_sessions 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update inventory sessions from their tenant" 
ON public.inventaire_sessions 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete inventory sessions from their tenant" 
ON public.inventaire_sessions 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer les triggers pour updated_at
CREATE TRIGGER update_produits_updated_at
BEFORE UPDATE ON public.produits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lots_updated_at
BEFORE UPDATE ON public.lots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commandes_fournisseurs_updated_at
BEFORE UPDATE ON public.commandes_fournisseurs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lignes_commande_fournisseur_updated_at
BEFORE UPDATE ON public.lignes_commande_fournisseur
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_receptions_fournisseurs_updated_at
BEFORE UPDATE ON public.receptions_fournisseurs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lignes_reception_fournisseur_updated_at
BEFORE UPDATE ON public.lignes_reception_fournisseur
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_mouvements_updated_at
BEFORE UPDATE ON public.stock_mouvements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventaire_sessions_updated_at
BEFORE UPDATE ON public.inventaire_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Créer les triggers d'audit
CREATE TRIGGER audit_produits
AFTER INSERT OR UPDATE OR DELETE ON public.produits
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_lots
AFTER INSERT OR UPDATE OR DELETE ON public.lots
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_commandes_fournisseurs
AFTER INSERT OR UPDATE OR DELETE ON public.commandes_fournisseurs
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_lignes_commande_fournisseur
AFTER INSERT OR UPDATE OR DELETE ON public.lignes_commande_fournisseur
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_receptions_fournisseurs
AFTER INSERT OR UPDATE OR DELETE ON public.receptions_fournisseurs
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_lignes_reception_fournisseur
AFTER INSERT OR UPDATE OR DELETE ON public.lignes_reception_fournisseur
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_stock_mouvements
AFTER INSERT OR UPDATE OR DELETE ON public.stock_mouvements
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_inventaire_sessions
AFTER INSERT OR UPDATE OR DELETE ON public.inventaire_sessions
FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

-- Créer les triggers de sécurité cross-tenant
CREATE TRIGGER security_produits
BEFORE INSERT OR UPDATE ON public.produits
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER security_lots
BEFORE INSERT OR UPDATE ON public.lots
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER security_commandes_fournisseurs
BEFORE INSERT OR UPDATE ON public.commandes_fournisseurs
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER security_lignes_commande_fournisseur
BEFORE INSERT OR UPDATE ON public.lignes_commande_fournisseur
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER security_receptions_fournisseurs
BEFORE INSERT OR UPDATE ON public.receptions_fournisseurs
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER security_lignes_reception_fournisseur
BEFORE INSERT OR UPDATE ON public.lignes_reception_fournisseur
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER security_stock_mouvements
BEFORE INSERT OR UPDATE ON public.stock_mouvements
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER security_inventaire_sessions
BEFORE INSERT OR UPDATE ON public.inventaire_sessions
FOR EACH ROW EXECUTE FUNCTION public.detect_cross_tenant_attempt();

-- Créer les index pour optimiser les performances
CREATE INDEX idx_produits_tenant_id ON public.produits(tenant_id);
CREATE INDEX idx_produits_famille_id ON public.produits(famille_produit_id);
CREATE INDEX idx_produits_rayon_id ON public.produits(rayon_produit_id);
CREATE INDEX idx_produits_categorie_id ON public.produits(categorie_tarification_id);
CREATE INDEX idx_produits_code_cip ON public.produits(tenant_id, code_cip);

CREATE INDEX idx_lots_tenant_id ON public.lots(tenant_id);
CREATE INDEX idx_lots_produit_id ON public.lots(produit_id);
CREATE INDEX idx_lots_date_peremption ON public.lots(tenant_id, date_peremption);
CREATE INDEX idx_lots_quantite_restante ON public.lots(tenant_id, quantite_restante);

CREATE INDEX idx_commandes_fournisseurs_tenant_id ON public.commandes_fournisseurs(tenant_id);
CREATE INDEX idx_commandes_fournisseurs_fournisseur_id ON public.commandes_fournisseurs(fournisseur_id);
CREATE INDEX idx_commandes_fournisseurs_statut ON public.commandes_fournisseurs(tenant_id, statut);

CREATE INDEX idx_lignes_commande_fournisseur_tenant_id ON public.lignes_commande_fournisseur(tenant_id);
CREATE INDEX idx_lignes_commande_fournisseur_commande_id ON public.lignes_commande_fournisseur(commande_id);
CREATE INDEX idx_lignes_commande_fournisseur_produit_id ON public.lignes_commande_fournisseur(produit_id);

CREATE INDEX idx_receptions_fournisseurs_tenant_id ON public.receptions_fournisseurs(tenant_id);
CREATE INDEX idx_receptions_fournisseurs_fournisseur_id ON public.receptions_fournisseurs(fournisseur_id);
CREATE INDEX idx_receptions_fournisseurs_commande_id ON public.receptions_fournisseurs(commande_id);

CREATE INDEX idx_lignes_reception_fournisseur_tenant_id ON public.lignes_reception_fournisseur(tenant_id);
CREATE INDEX idx_lignes_reception_fournisseur_reception_id ON public.lignes_reception_fournisseur(reception_id);
CREATE INDEX idx_lignes_reception_fournisseur_produit_id ON public.lignes_reception_fournisseur(produit_id);
CREATE INDEX idx_lignes_reception_fournisseur_lot_id ON public.lignes_reception_fournisseur(lot_id);

CREATE INDEX idx_stock_mouvements_tenant_id ON public.stock_mouvements(tenant_id);
CREATE INDEX idx_stock_mouvements_produit_id ON public.stock_mouvements(produit_id);
CREATE INDEX idx_stock_mouvements_lot_id ON public.stock_mouvements(lot_id);
CREATE INDEX idx_stock_mouvements_type ON public.stock_mouvements(tenant_id, type_mouvement);
CREATE INDEX idx_stock_mouvements_date ON public.stock_mouvements(tenant_id, date_mouvement);

CREATE INDEX idx_inventaire_sessions_tenant_id ON public.inventaire_sessions(tenant_id);
CREATE INDEX idx_inventaire_sessions_agent_id ON public.inventaire_sessions(agent_id);
CREATE INDEX idx_inventaire_sessions_statut ON public.inventaire_sessions(tenant_id, statut);