-- ============================================
-- Migration: Fonctions RPC atomiques pour génération de numéros
-- 2 fonctions: generate_retour_number, generate_fidelite_number
-- ============================================

-- 1. Fonction pour générer un numéro de retour atomique
CREATE OR REPLACE FUNCTION public.generate_retour_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date_prefix TEXT;
  v_sequence INTEGER;
  v_numero TEXT;
  v_lock_key BIGINT;
BEGIN
  -- Préfixe date du jour
  v_date_prefix := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Verrouillage par tenant + type + date pour éviter les collisions
  v_lock_key := hashtext(p_tenant_id::TEXT || 'RET' || v_date_prefix);
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- Obtenir le prochain numéro séquentiel pour ce tenant et cette date
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_retour FROM 'RET-\d{8}-(\d{4})') AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.retours
  WHERE tenant_id = p_tenant_id
    AND numero_retour LIKE 'RET-' || v_date_prefix || '-%';
  
  -- Construire le numéro final
  v_numero := 'RET-' || v_date_prefix || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_numero;
END;
$$;

-- 2. Fonction pour générer un numéro de carte fidélité atomique
CREATE OR REPLACE FUNCTION public.generate_fidelite_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sequence INTEGER;
  v_numero TEXT;
  v_lock_key BIGINT;
BEGIN
  -- Verrouillage par tenant + type pour éviter les collisions
  v_lock_key := hashtext(p_tenant_id::TEXT || 'FID');
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- Obtenir le prochain numéro séquentiel pour ce tenant
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_carte FROM 'FID-(\d{8})') AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.programme_fidelite
  WHERE tenant_id = p_tenant_id;
  
  -- Construire le numéro final
  v_numero := 'FID-' || LPAD(v_sequence::TEXT, 8, '0');
  
  RETURN v_numero;
END;
$$;

-- Notifier PostgREST du changement de schéma
NOTIFY pgrst, 'reload schema';