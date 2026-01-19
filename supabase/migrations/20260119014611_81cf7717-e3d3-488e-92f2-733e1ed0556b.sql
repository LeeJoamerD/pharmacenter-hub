-- Fonction RPC paginée pour récupérer la hiérarchie des comptes sans limite de 1000
CREATE OR REPLACE FUNCTION public.get_account_hierarchy_paginated(
  p_tenant_id UUID,
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 1000
)
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
      v.id, v.code, v.libelle, v.type, v.classe,
      v.parent_id, v.niveau, v.actif, v.analytique,
      v.rapprochement, v.description,
      v.solde_debiteur, v.solde_crediteur,
      v.code::TEXT AS path
    FROM public.v_comptes_avec_soldes v
    WHERE v.tenant_id = p_tenant_id AND v.parent_id IS NULL
    
    UNION ALL
    
    -- Comptes enfants (avec parent)
    SELECT 
      v.id, v.code, v.libelle, v.type, v.classe,
      v.parent_id, v.niveau, v.actif, v.analytique,
      v.rapprochement, v.description,
      v.solde_debiteur, v.solde_crediteur,
      (at.path || ' > ' || v.code)::TEXT AS path
    FROM public.v_comptes_avec_soldes v
    INNER JOIN account_tree at ON v.parent_id = at.id
    WHERE v.tenant_id = p_tenant_id
  )
  SELECT * FROM account_tree
  ORDER BY account_tree.code
  OFFSET p_offset
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;