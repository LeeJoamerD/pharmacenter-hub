-- Étape 7 : Tables comptabilité
-- Gestion complète de la comptabilité

-- Table du plan comptable
CREATE TABLE public.plan_comptable (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    numero_compte TEXT NOT NULL,
    libelle_compte TEXT NOT NULL,
    type_compte TEXT NOT NULL CHECK (type_compte IN ('Actif', 'Passif', 'Charge', 'Produit', 'Immobilisation')),
    classe_compte INTEGER NOT NULL CHECK (classe_compte BETWEEN 1 AND 9),
    sous_classe TEXT,
    niveau_compte INTEGER NOT NULL DEFAULT 1 CHECK (niveau_compte BETWEEN 1 AND 5),
    compte_parent_id UUID REFERENCES public.plan_comptable(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_collectif BOOLEAN NOT NULL DEFAULT false,
    sens_normal TEXT NOT NULL CHECK (sens_normal IN ('Débit', 'Crédit')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT unique_compte_per_tenant UNIQUE (tenant_id, numero_compte)
);

-- Table des exercices comptables
CREATE TABLE public.exercices_comptables (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    libelle_exercice TEXT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    statut TEXT NOT NULL DEFAULT 'Ouvert' CHECK (statut IN ('Ouvert', 'Clôturé', 'Archivé')),
    is_current BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT unique_exercice_per_tenant UNIQUE (tenant_id, libelle_exercice),
    CONSTRAINT valid_period CHECK (date_debut < date_fin),
    CONSTRAINT one_current_per_tenant UNIQUE (tenant_id, is_current) DEFERRABLE INITIALLY DEFERRED
);

-- Table des journaux comptables
CREATE TABLE public.journaux_comptables (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    code_journal TEXT NOT NULL,
    libelle_journal TEXT NOT NULL,
    type_journal TEXT NOT NULL CHECK (type_journal IN ('Ventes', 'Achats', 'Banque', 'Caisse', 'OD', 'A-nouveaux')),
    numero_dernier_mouvement INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    compte_contrepartie_id UUID REFERENCES public.plan_comptable(id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT unique_journal_per_tenant UNIQUE (tenant_id, code_journal)
);

-- Table des écritures comptables
CREATE TABLE public.ecritures_comptables (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    exercice_id UUID NOT NULL REFERENCES public.exercices_comptables(id),
    journal_id UUID NOT NULL REFERENCES public.journaux_comptables(id),
    numero_piece TEXT NOT NULL,
    date_ecriture DATE NOT NULL,
    date_valeur DATE,
    libelle_ecriture TEXT NOT NULL,
    montant_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    statut TEXT NOT NULL DEFAULT 'Brouillon' CHECK (statut IN ('Brouillon', 'Validé', 'Clôturé')),
    reference_externe TEXT,
    reference_type TEXT,
    reference_id UUID,
    personnel_id UUID REFERENCES public.personnel(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT unique_piece_per_journal UNIQUE (tenant_id, journal_id, numero_piece),
    CONSTRAINT positive_amount CHECK (montant_total >= 0)
);

-- Table des lignes d'écriture
CREATE TABLE public.lignes_ecriture (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    ecriture_id UUID NOT NULL REFERENCES public.ecritures_comptables(id) ON DELETE CASCADE,
    compte_id UUID NOT NULL REFERENCES public.plan_comptable(id),
    numero_ligne INTEGER NOT NULL,
    libelle_ligne TEXT NOT NULL,
    montant_debit NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    montant_credit NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    quantite NUMERIC(10,3),
    date_echeance DATE,
    lettrage TEXT,
    is_lettree BOOLEAN NOT NULL DEFAULT false,
    analytique_code TEXT,
    piece_jointe TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT unique_ligne_per_ecriture UNIQUE (tenant_id, ecriture_id, numero_ligne),
    CONSTRAINT positive_amounts CHECK (montant_debit >= 0 AND montant_credit >= 0),
    CONSTRAINT exclusive_debit_credit CHECK (
        (montant_debit > 0 AND montant_credit = 0) OR 
        (montant_debit = 0 AND montant_credit > 0)
    )
);

-- Table des balances
CREATE TABLE public.balances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    exercice_id UUID NOT NULL REFERENCES public.exercices_comptables(id),
    compte_id UUID NOT NULL REFERENCES public.plan_comptable(id),
    periode TEXT NOT NULL, -- Format: YYYY-MM ou YYYY pour balance annuelle
    solde_debit_ouverture NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    solde_credit_ouverture NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_debit_periode NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_credit_periode NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    solde_debit_cloture NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    solde_credit_cloture NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    date_calcul TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT unique_balance_per_periode UNIQUE (tenant_id, exercice_id, compte_id, periode),
    CONSTRAINT positive_amounts_balance CHECK (
        solde_debit_ouverture >= 0 AND solde_credit_ouverture >= 0 AND
        total_debit_periode >= 0 AND total_credit_periode >= 0 AND
        solde_debit_cloture >= 0 AND solde_credit_cloture >= 0
    )
);

-- Table de la TVA
CREATE TABLE public.tva_declaration (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    exercice_id UUID NOT NULL REFERENCES public.exercices_comptables(id),
    periode TEXT NOT NULL, -- Format: YYYY-MM
    tva_collectee NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    tva_deductible NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    tva_a_payer NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    credit_tva_anterieur NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    acompte_verse NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    solde_a_payer NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    date_declaration DATE,
    statut TEXT NOT NULL DEFAULT 'Brouillon' CHECK (statut IN ('Brouillon', 'Déclarée', 'Payée')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT unique_tva_per_periode UNIQUE (tenant_id, exercice_id, periode),
    CONSTRAINT positive_amounts_tva CHECK (
        tva_collectee >= 0 AND tva_deductible >= 0 AND 
        credit_tva_anterieur >= 0 AND acompte_verse >= 0
    )
);

-- Table des immobilisations
CREATE TABLE public.immobilisations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    numero_immobilisation TEXT NOT NULL,
    libelle_immobilisation TEXT NOT NULL,
    compte_immobilisation_id UUID NOT NULL REFERENCES public.plan_comptable(id),
    compte_amortissement_id UUID REFERENCES public.plan_comptable(id),
    date_acquisition DATE NOT NULL,
    valeur_acquisition NUMERIC(15,2) NOT NULL,
    duree_amortissement INTEGER, -- en mois
    taux_amortissement NUMERIC(5,2), -- en pourcentage
    mode_amortissement TEXT CHECK (mode_amortissement IN ('Linéaire', 'Dégressif', 'Variable')),
    valeur_residuelle NUMERIC(15,2) DEFAULT 0.00,
    cumul_amortissement NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valeur_nette_comptable NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    date_sortie DATE,
    motif_sortie TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT unique_numero_immobilisation UNIQUE (tenant_id, numero_immobilisation),
    CONSTRAINT positive_amounts_immo CHECK (
        valeur_acquisition > 0 AND valeur_residuelle >= 0 AND 
        cumul_amortissement >= 0 AND valeur_nette_comptable >= 0
    ),
    CONSTRAINT valid_amortissement CHECK (
        (duree_amortissement IS NULL AND taux_amortissement IS NULL) OR
        (duree_amortissement > 0 OR (taux_amortissement > 0 AND taux_amortissement <= 100))
    )
);

-- Table des rapports comptables
CREATE TABLE public.rapports_comptables (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    exercice_id UUID NOT NULL REFERENCES public.exercices_comptables(id),
    type_rapport TEXT NOT NULL CHECK (type_rapport IN ('Bilan', 'Compte_de_resultat', 'Livre_journal', 'Grand_livre', 'Balance', 'TVA')),
    nom_rapport TEXT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    parametres JSONB,
    contenu_rapport JSONB,
    statut TEXT NOT NULL DEFAULT 'Généré' CHECK (statut IN ('Généré', 'Validé', 'Archivé')),
    personnel_id UUID REFERENCES public.personnel(id),
    fichier_export TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_plan_comptable_tenant_id ON public.plan_comptable(tenant_id);
CREATE INDEX idx_plan_comptable_numero ON public.plan_comptable(tenant_id, numero_compte);
CREATE INDEX idx_plan_comptable_type ON public.plan_comptable(tenant_id, type_compte);
CREATE INDEX idx_plan_comptable_classe ON public.plan_comptable(tenant_id, classe_compte);

CREATE INDEX idx_exercices_comptables_tenant_id ON public.exercices_comptables(tenant_id);
CREATE INDEX idx_exercices_comptables_current ON public.exercices_comptables(tenant_id, is_current);
CREATE INDEX idx_exercices_comptables_statut ON public.exercices_comptables(tenant_id, statut);

CREATE INDEX idx_journaux_comptables_tenant_id ON public.journaux_comptables(tenant_id);
CREATE INDEX idx_journaux_comptables_type ON public.journaux_comptables(tenant_id, type_journal);
CREATE INDEX idx_journaux_comptables_active ON public.journaux_comptables(tenant_id, is_active);

CREATE INDEX idx_ecritures_comptables_tenant_id ON public.ecritures_comptables(tenant_id);
CREATE INDEX idx_ecritures_comptables_exercice ON public.ecritures_comptables(exercice_id);
CREATE INDEX idx_ecritures_comptables_journal ON public.ecritures_comptables(journal_id);
CREATE INDEX idx_ecritures_comptables_date ON public.ecritures_comptables(tenant_id, date_ecriture);
CREATE INDEX idx_ecritures_comptables_statut ON public.ecritures_comptables(tenant_id, statut);
CREATE INDEX idx_ecritures_comptables_reference ON public.ecritures_comptables(tenant_id, reference_type, reference_id);

CREATE INDEX idx_lignes_ecriture_tenant_id ON public.lignes_ecriture(tenant_id);
CREATE INDEX idx_lignes_ecriture_ecriture ON public.lignes_ecriture(ecriture_id);
CREATE INDEX idx_lignes_ecriture_compte ON public.lignes_ecriture(compte_id);
CREATE INDEX idx_lignes_ecriture_lettrage ON public.lignes_ecriture(tenant_id, lettrage) WHERE lettrage IS NOT NULL;

CREATE INDEX idx_balances_tenant_id ON public.balances(tenant_id);
CREATE INDEX idx_balances_exercice ON public.balances(exercice_id);
CREATE INDEX idx_balances_compte ON public.balances(compte_id);
CREATE INDEX idx_balances_periode ON public.balances(tenant_id, exercice_id, periode);

CREATE INDEX idx_tva_declaration_tenant_id ON public.tva_declaration(tenant_id);
CREATE INDEX idx_tva_declaration_exercice ON public.tva_declaration(exercice_id);
CREATE INDEX idx_tva_declaration_periode ON public.tva_declaration(tenant_id, exercice_id, periode);
CREATE INDEX idx_tva_declaration_statut ON public.tva_declaration(tenant_id, statut);

CREATE INDEX idx_immobilisations_tenant_id ON public.immobilisations(tenant_id);
CREATE INDEX idx_immobilisations_numero ON public.immobilisations(tenant_id, numero_immobilisation);
CREATE INDEX idx_immobilisations_active ON public.immobilisations(tenant_id, is_active);
CREATE INDEX idx_immobilisations_date_acquisition ON public.immobilisations(tenant_id, date_acquisition);

CREATE INDEX idx_rapports_comptables_tenant_id ON public.rapports_comptables(tenant_id);
CREATE INDEX idx_rapports_comptables_exercice ON public.rapports_comptables(exercice_id);
CREATE INDEX idx_rapports_comptables_type ON public.rapports_comptables(tenant_id, type_rapport);
CREATE INDEX idx_rapports_comptables_date ON public.rapports_comptables(tenant_id, date_debut, date_fin);

-- Triggers pour updated_at
CREATE TRIGGER update_plan_comptable_updated_at
    BEFORE UPDATE ON public.plan_comptable
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercices_comptables_updated_at
    BEFORE UPDATE ON public.exercices_comptables
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journaux_comptables_updated_at
    BEFORE UPDATE ON public.journaux_comptables
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ecritures_comptables_updated_at
    BEFORE UPDATE ON public.ecritures_comptables
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lignes_ecriture_updated_at
    BEFORE UPDATE ON public.lignes_ecriture
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_balances_updated_at
    BEFORE UPDATE ON public.balances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tva_declaration_updated_at
    BEFORE UPDATE ON public.tva_declaration
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_immobilisations_updated_at
    BEFORE UPDATE ON public.immobilisations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rapports_comptables_updated_at
    BEFORE UPDATE ON public.rapports_comptables
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers d'audit
CREATE TRIGGER plan_comptable_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.plan_comptable
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER exercices_comptables_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.exercices_comptables
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER journaux_comptables_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.journaux_comptables
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER ecritures_comptables_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.ecritures_comptables
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER lignes_ecriture_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.lignes_ecriture
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER balances_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.balances
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER tva_declaration_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.tva_declaration
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER immobilisations_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.immobilisations
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER rapports_comptables_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.rapports_comptables
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_trail();

-- Triggers de sécurité cross-tenant
CREATE TRIGGER plan_comptable_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.plan_comptable
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER exercices_comptables_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.exercices_comptables
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER journaux_comptables_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.journaux_comptables
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER ecritures_comptables_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.ecritures_comptables
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER lignes_ecriture_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.lignes_ecriture
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER balances_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.balances
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER tva_declaration_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.tva_declaration
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER immobilisations_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.immobilisations
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

CREATE TRIGGER rapports_comptables_cross_tenant_security
    BEFORE INSERT OR UPDATE ON public.rapports_comptables
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_cross_tenant_attempt();

-- Activation du RLS
ALTER TABLE public.plan_comptable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercices_comptables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journaux_comptables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecritures_comptables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_ecriture ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tva_declaration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immobilisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapports_comptables ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour plan_comptable
CREATE POLICY "Users can view chart of accounts from their tenant" 
ON public.plan_comptable 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Accountants can insert accounts in their tenant" 
ON public.plan_comptable 
FOR INSERT 
WITH CHECK (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien', 'Comptable')
    )
);

CREATE POLICY "Accountants can update accounts from their tenant" 
ON public.plan_comptable 
FOR UPDATE 
USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien', 'Comptable')
    )
);

CREATE POLICY "Admins can delete accounts from their tenant" 
ON public.plan_comptable 
FOR DELETE 
USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien')
    )
);

-- Politiques RLS similaires pour les autres tables (exercices_comptables)
CREATE POLICY "Users can view fiscal years from their tenant" 
ON public.exercices_comptables 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Accountants can manage fiscal years in their tenant" 
ON public.exercices_comptables 
FOR ALL 
USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien', 'Comptable')
    )
);

-- Politiques RLS pour journaux_comptables
CREATE POLICY "Users can view journals from their tenant" 
ON public.journaux_comptables 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Accountants can manage journals in their tenant" 
ON public.journaux_comptables 
FOR ALL 
USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien', 'Comptable')
    )
);

-- Politiques RLS pour ecritures_comptables
CREATE POLICY "Users can view accounting entries from their tenant" 
ON public.ecritures_comptables 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Accountants can manage accounting entries in their tenant" 
ON public.ecritures_comptables 
FOR ALL 
USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien', 'Comptable')
    )
);

-- Politiques RLS pour lignes_ecriture
CREATE POLICY "Users can view entry lines from their tenant" 
ON public.lignes_ecriture 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Accountants can manage entry lines in their tenant" 
ON public.lignes_ecriture 
FOR ALL 
USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien', 'Comptable')
    )
);

-- Politiques RLS pour balances
CREATE POLICY "Users can view balances from their tenant" 
ON public.balances 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Accountants can manage balances in their tenant" 
ON public.balances 
FOR ALL 
USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien', 'Comptable')
    )
);

-- Politiques RLS pour tva_declaration
CREATE POLICY "Users can view VAT declarations from their tenant" 
ON public.tva_declaration 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Accountants can manage VAT declarations in their tenant" 
ON public.tva_declaration 
FOR ALL 
USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien', 'Comptable')
    )
);

-- Politiques RLS pour immobilisations
CREATE POLICY "Users can view fixed assets from their tenant" 
ON public.immobilisations 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Accountants can manage fixed assets in their tenant" 
ON public.immobilisations 
FOR ALL 
USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien', 'Comptable')
    )
);

-- Politiques RLS pour rapports_comptables
CREATE POLICY "Users can view accounting reports from their tenant" 
ON public.rapports_comptables 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Accountants can manage accounting reports in their tenant" 
ON public.rapports_comptables 
FOR ALL 
USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien', 'Comptable')
    )
);