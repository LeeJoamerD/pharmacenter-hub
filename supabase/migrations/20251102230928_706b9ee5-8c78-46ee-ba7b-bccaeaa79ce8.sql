-- Phase 1: Étendre la table plan_comptable avec les colonnes manquantes
ALTER TABLE public.plan_comptable 
ADD COLUMN IF NOT EXISTS niveau INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS analytique BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rapprochement BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Modifier le type_compte pour accepter les bonnes valeurs
ALTER TABLE public.plan_comptable 
DROP CONSTRAINT IF EXISTS plan_comptable_type_compte_check;

ALTER TABLE public.plan_comptable
ADD CONSTRAINT plan_comptable_type_compte_check 
CHECK (type_compte IN ('detail', 'titre', 'sous-titre'));

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_plan_comptable_tenant_classe 
ON public.plan_comptable (tenant_id, classe);

CREATE INDEX IF NOT EXISTS idx_plan_comptable_tenant_analytique 
ON public.plan_comptable (tenant_id, analytique) 
WHERE analytique = true;

CREATE INDEX IF NOT EXISTS idx_plan_comptable_tenant_parent 
ON public.plan_comptable (tenant_id, compte_parent_id) 
WHERE compte_parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_plan_comptable_numero 
ON public.plan_comptable (tenant_id, numero_compte);

-- Fonction récursive pour calculer automatiquement le niveau d'un compte
CREATE OR REPLACE FUNCTION public.calculate_account_level(p_account_id UUID, p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_parent_id UUID;
  v_parent_level INTEGER;
BEGIN
  -- Récupérer le parent du compte
  SELECT compte_parent_id INTO v_parent_id
  FROM public.plan_comptable
  WHERE id = p_account_id AND tenant_id = p_tenant_id;
  
  -- Si pas de parent, c'est un compte de niveau 1
  IF v_parent_id IS NULL THEN
    RETURN 1;
  END IF;
  
  -- Sinon, calculer récursivement le niveau du parent + 1
  SELECT niveau INTO v_parent_level
  FROM public.plan_comptable
  WHERE id = v_parent_id AND tenant_id = p_tenant_id;
  
  -- Si le parent n'a pas de niveau, le calculer
  IF v_parent_level IS NULL THEN
    v_parent_level := calculate_account_level(v_parent_id, p_tenant_id);
  END IF;
  
  RETURN v_parent_level + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour automatiquement le niveau avant insert/update
CREATE OR REPLACE FUNCTION public.trg_update_account_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer automatiquement le niveau en fonction du parent
  NEW.niveau := calculate_account_level(NEW.id, NEW.tenant_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_before_plan_comptable_level ON public.plan_comptable;
CREATE TRIGGER trg_before_plan_comptable_level
  BEFORE INSERT OR UPDATE OF compte_parent_id ON public.plan_comptable
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_update_account_level();

-- Vue pour joindre les comptes avec leurs soldes actuels
CREATE OR REPLACE VIEW public.v_comptes_avec_soldes AS
SELECT 
  pc.id,
  pc.tenant_id,
  pc.numero_compte AS code,
  pc.libelle_compte AS libelle,
  pc.type_compte AS type,
  pc.classe,
  pc.compte_parent_id AS parent_id,
  pc.niveau,
  pc.is_active AS actif,
  pc.analytique,
  pc.rapprochement,
  pc.description,
  pc.created_at,
  pc.updated_at,
  COALESCE(SUM(b.solde_debit), 0) AS solde_debiteur,
  COALESCE(SUM(b.solde_credit), 0) AS solde_crediteur
FROM public.plan_comptable pc
LEFT JOIN public.balances b ON b.compte_id = pc.id AND b.tenant_id = pc.tenant_id
GROUP BY 
  pc.id, pc.tenant_id, pc.numero_compte, pc.libelle_compte, 
  pc.type_compte, pc.classe, pc.compte_parent_id, pc.niveau,
  pc.is_active, pc.analytique, pc.rapprochement, pc.description,
  pc.created_at, pc.updated_at;

-- Accorder les permissions sur la vue
GRANT SELECT ON public.v_comptes_avec_soldes TO authenticated;

-- RLS pour la vue (elle hérite des permissions de plan_comptable)
ALTER VIEW public.v_comptes_avec_soldes SET (security_invoker = true);

-- Fonction pour obtenir la hiérarchie complète d'un compte
CREATE OR REPLACE FUNCTION public.get_account_hierarchy(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  code TEXT,
  libelle TEXT,
  type TEXT,
  classe INTEGER,
  parent_id UUID,
  niveau INTEGER,
  actif BOOLEAN,
  analytique BOOLEAN,
  rapprochement BOOLEAN,
  description TEXT,
  solde_debiteur NUMERIC,
  solde_crediteur NUMERIC,
  path TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE account_tree AS (
    -- Comptes racines (sans parent)
    SELECT 
      v.id,
      v.code,
      v.libelle,
      v.type,
      v.classe,
      v.parent_id,
      v.niveau,
      v.actif,
      v.analytique,
      v.rapprochement,
      v.description,
      v.solde_debiteur,
      v.solde_crediteur,
      v.code::TEXT AS path
    FROM public.v_comptes_avec_soldes v
    WHERE v.tenant_id = p_tenant_id
      AND v.parent_id IS NULL
    
    UNION ALL
    
    -- Comptes enfants (récursif)
    SELECT 
      v.id,
      v.code,
      v.libelle,
      v.type,
      v.classe,
      v.parent_id,
      v.niveau,
      v.actif,
      v.analytique,
      v.rapprochement,
      v.description,
      v.solde_debiteur,
      v.solde_crediteur,
      (at.path || ' > ' || v.code)::TEXT AS path
    FROM public.v_comptes_avec_soldes v
    INNER JOIN account_tree at ON v.parent_id = at.id
    WHERE v.tenant_id = p_tenant_id
  )
  SELECT * FROM account_tree
  ORDER BY path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_account_hierarchy(UUID) TO authenticated;

-- Fonction pour vérifier si un compte peut être supprimé
CREATE OR REPLACE FUNCTION public.can_delete_account(p_account_id UUID, p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_has_children BOOLEAN;
  v_has_entries BOOLEAN;
  v_result JSONB;
BEGIN
  -- Vérifier s'il y a des comptes enfants
  SELECT EXISTS(
    SELECT 1 FROM public.plan_comptable 
    WHERE compte_parent_id = p_account_id 
      AND tenant_id = p_tenant_id
  ) INTO v_has_children;
  
  -- Vérifier s'il y a des écritures comptables (dans la table balances)
  SELECT EXISTS(
    SELECT 1 FROM public.balances 
    WHERE compte_id = p_account_id 
      AND tenant_id = p_tenant_id
  ) INTO v_has_entries;
  
  v_result := jsonb_build_object(
    'can_delete', NOT (v_has_children OR v_has_entries),
    'has_children', v_has_children,
    'has_entries', v_has_entries,
    'message', CASE 
      WHEN v_has_children THEN 'Ce compte a des comptes enfants et ne peut pas être supprimé'
      WHEN v_has_entries THEN 'Ce compte a des écritures comptables et ne peut pas être supprimé'
      ELSE 'Ce compte peut être supprimé'
    END
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.can_delete_account(UUID, UUID) TO authenticated;