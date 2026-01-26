-- =====================================================
-- CORRECTION: Remplacer "categories" par "famille_produit"
-- =====================================================

-- Supprimer les anciennes fonctions
DROP FUNCTION IF EXISTS public.get_pos_products(uuid, text, integer, integer);
DROP FUNCTION IF EXISTS public.search_product_by_barcode(uuid, text);

-- =====================================================
-- FONCTION 1: get_pos_products (corrigée)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_pos_products(
  p_tenant_id UUID,
  p_search TEXT DEFAULT '',
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  libelle_produit TEXT,
  code_cip TEXT,
  code_ean TEXT,
  prix_vente NUMERIC,
  prix_achat NUMERIC,
  tva NUMERIC,
  stock_actuel BIGINT,
  stock_alerte INTEGER,
  stock_limite INTEGER,
  image_url TEXT,
  description TEXT,
  forme_pharmaceutique TEXT,
  dosage TEXT,
  conditionnement TEXT,
  dci_nom TEXT,
  category TEXT,
  famille_id UUID,
  rayon_id UUID,
  is_ordonnance_required BOOLEAN,
  is_stupefiant BOOLEAN,
  updated_at TIMESTAMPTZ,
  has_valid_stock BOOLEAN,
  all_lots_expired BOOLEAN,
  lots JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH product_lots AS (
    SELECT 
      l.produit_id,
      COALESCE(SUM(l.quantite_restante), 0) AS total_stock,
      jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'numero_lot', l.numero_lot,
          'date_peremption', l.date_peremption,
          'quantite_restante', l.quantite_restante,
          'prix_achat_unitaire', l.prix_achat_unitaire,
          'emplacement', l.emplacement
        ) ORDER BY l.date_peremption NULLS LAST, l.created_at
      ) FILTER (WHERE l.quantite_restante > 0) AS lots_data
    FROM lots l
    WHERE l.tenant_id = p_tenant_id
      AND l.quantite_restante > 0
    GROUP BY l.produit_id
  )
  SELECT 
    p.id,
    p.tenant_id,
    p.libelle_produit,
    p.code_cip,
    p.code_ean,
    p.prix_vente,
    p.prix_achat,
    p.tva,
    COALESCE(pl.total_stock, 0)::BIGINT AS stock_actuel,
    p.stock_alerte,
    p.stock_limite,
    p.image_url,
    p.description,
    p.forme_pharmaceutique,
    p.dosage,
    p.conditionnement,
    d.nom AS dci_nom,
    COALESCE(f.libelle_famille, 'Non catégorisé') AS category,
    p.famille_id,
    p.rayon_id,
    p.is_ordonnance_required,
    p.is_stupefiant,
    p.updated_at,
    -- has_valid_stock: au moins un lot valide (date NULL = valide)
    EXISTS(
      SELECT 1 FROM lots l
      WHERE l.produit_id = p.id 
        AND l.tenant_id = p_tenant_id
        AND l.quantite_restante > 0
        AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
    ) AS has_valid_stock,
    -- all_lots_expired: tous les lots sont expirés (date NULL = pas expiré)
    (
      COALESCE(pl.total_stock, 0) > 0 
      AND NOT EXISTS(
        SELECT 1 FROM lots l
        WHERE l.produit_id = p.id 
          AND l.tenant_id = p_tenant_id
          AND l.quantite_restante > 0
          AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
      )
    ) AS all_lots_expired,
    COALESCE(pl.lots_data, '[]'::jsonb) AS lots
  FROM produits p
  LEFT JOIN dci d ON d.id = p.dci_id
  LEFT JOIN famille_produit f ON f.id = p.famille_id
  LEFT JOIN product_lots pl ON pl.produit_id = p.id
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
    AND (
      p_search = '' 
      OR p.libelle_produit ILIKE '%' || p_search || '%'
      OR p.code_cip ILIKE '%' || p_search || '%'
      OR p.code_ean ILIKE '%' || p_search || '%'
      OR d.nom ILIKE '%' || p_search || '%'
    )
  ORDER BY p.libelle_produit
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =====================================================
-- FONCTION 2: search_product_by_barcode (corrigée)
-- =====================================================
CREATE OR REPLACE FUNCTION public.search_product_by_barcode(
  p_tenant_id UUID,
  p_barcode TEXT
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  libelle_produit TEXT,
  code_cip TEXT,
  code_ean TEXT,
  prix_vente NUMERIC,
  prix_achat NUMERIC,
  tva NUMERIC,
  stock_actuel BIGINT,
  stock_alerte INTEGER,
  stock_limite INTEGER,
  image_url TEXT,
  description TEXT,
  forme_pharmaceutique TEXT,
  dosage TEXT,
  conditionnement TEXT,
  dci_nom TEXT,
  category TEXT,
  famille_id UUID,
  rayon_id UUID,
  is_ordonnance_required BOOLEAN,
  is_stupefiant BOOLEAN,
  updated_at TIMESTAMPTZ,
  has_valid_stock BOOLEAN,
  all_lots_expired BOOLEAN,
  lots JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH product_lots AS (
    SELECT 
      l.produit_id,
      COALESCE(SUM(l.quantite_restante), 0) AS total_stock,
      jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'numero_lot', l.numero_lot,
          'date_peremption', l.date_peremption,
          'quantite_restante', l.quantite_restante,
          'prix_achat_unitaire', l.prix_achat_unitaire,
          'emplacement', l.emplacement
        ) ORDER BY l.date_peremption NULLS LAST, l.created_at
      ) FILTER (WHERE l.quantite_restante > 0) AS lots_data
    FROM lots l
    WHERE l.tenant_id = p_tenant_id
      AND l.quantite_restante > 0
    GROUP BY l.produit_id
  )
  SELECT 
    p.id,
    p.tenant_id,
    p.libelle_produit,
    p.code_cip,
    p.code_ean,
    p.prix_vente,
    p.prix_achat,
    p.tva,
    COALESCE(pl.total_stock, 0)::BIGINT AS stock_actuel,
    p.stock_alerte,
    p.stock_limite,
    p.image_url,
    p.description,
    p.forme_pharmaceutique,
    p.dosage,
    p.conditionnement,
    d.nom AS dci_nom,
    COALESCE(f.libelle_famille, 'Non catégorisé') AS category,
    p.famille_id,
    p.rayon_id,
    p.is_ordonnance_required,
    p.is_stupefiant,
    p.updated_at,
    -- has_valid_stock: au moins un lot valide (date NULL = valide)
    EXISTS(
      SELECT 1 FROM lots l
      WHERE l.produit_id = p.id 
        AND l.tenant_id = p_tenant_id
        AND l.quantite_restante > 0
        AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
    ) AS has_valid_stock,
    -- all_lots_expired: tous les lots sont expirés (date NULL = pas expiré)
    (
      COALESCE(pl.total_stock, 0) > 0 
      AND NOT EXISTS(
        SELECT 1 FROM lots l
        WHERE l.produit_id = p.id 
          AND l.tenant_id = p_tenant_id
          AND l.quantite_restante > 0
          AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
      )
    ) AS all_lots_expired,
    COALESCE(pl.lots_data, '[]'::jsonb) AS lots
  FROM produits p
  LEFT JOIN dci d ON d.id = p.dci_id
  LEFT JOIN famille_produit f ON f.id = p.famille_id
  LEFT JOIN product_lots pl ON pl.produit_id = p.id
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
    AND (
      p.code_cip = p_barcode 
      OR p.code_ean = p_barcode
    )
  LIMIT 1;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.get_pos_products(uuid, text, integer, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.search_product_by_barcode(uuid, text) TO authenticated, anon;