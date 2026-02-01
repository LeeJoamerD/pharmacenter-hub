-- ============================================
-- Phase A: Migration schéma lots + séquences + RPC
-- ============================================

-- 1) Ajouter la colonne code_barre à public.lots
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS code_barre text;

-- Index unique partiel par tenant pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS lots_tenant_code_barre_uniq 
ON public.lots(tenant_id, code_barre) 
WHERE code_barre IS NOT NULL;

-- Index de recherche pour les lookups rapides
CREATE INDEX IF NOT EXISTS lots_code_barre_lookup 
ON public.lots(code_barre) 
WHERE code_barre IS NOT NULL;

-- 2) Créer la table lot_barcode_sequences
CREATE TABLE IF NOT EXISTS public.lot_barcode_sequences (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  date_key text NOT NULL, -- Format YYMMDD
  last_sequence integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lot_barcode_sequences_tenant_date_uniq UNIQUE (tenant_id, date_key)
);

-- 3) RLS sur lot_barcode_sequences
ALTER TABLE public.lot_barcode_sequences ENABLE ROW LEVEL SECURITY;

-- Politique tenant access basée sur get_current_user_tenant_id()
CREATE POLICY "Tenant can access own barcode sequences"
ON public.lot_barcode_sequences
FOR ALL
USING (tenant_id = public.get_current_user_tenant_id())
WITH CHECK (tenant_id = public.get_current_user_tenant_id());

-- 4) Créer la RPC generate_lot_barcode
CREATE OR REPLACE FUNCTION public.generate_lot_barcode(p_tenant_id uuid, p_fournisseur_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fournisseur_nom text;
  v_prefix text;
  v_date_key text;
  v_sequence integer;
  v_barcode text;
BEGIN
  -- Récupérer le nom du fournisseur
  SELECT nom INTO v_fournisseur_nom
  FROM public.fournisseurs
  WHERE id = p_fournisseur_id AND tenant_id = p_tenant_id;
  
  IF v_fournisseur_nom IS NULL THEN
    -- Fallback si fournisseur non trouvé
    v_fournisseur_nom := 'XXXX';
  END IF;
  
  -- Produire un préfixe de 4 lettres:
  -- uppercase, sans espaces, sans accents, complété avec X si < 4 caractères
  v_prefix := upper(
    translate(
      replace(v_fournisseur_nom, ' ', ''),
      'àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ',
      'aaaeeeeiioouucAAAAEEEEIIOOUUUC'
    )
  );
  v_prefix := substring(v_prefix from 1 for 4);
  
  -- Compléter avec X si moins de 4 caractères
  WHILE length(v_prefix) < 4 LOOP
    v_prefix := v_prefix || 'X';
  END LOOP;
  
  -- Date key au format YYMMDD
  v_date_key := to_char(current_date, 'YYMMDD');
  
  -- Incrément atomique de la séquence
  INSERT INTO public.lot_barcode_sequences (tenant_id, date_key, last_sequence)
  VALUES (p_tenant_id, v_date_key, 1)
  ON CONFLICT (tenant_id, date_key) 
  DO UPDATE SET 
    last_sequence = public.lot_barcode_sequences.last_sequence + 1,
    updated_at = now()
  RETURNING last_sequence INTO v_sequence;
  
  -- Format final: LOT-{FOUR}-{YYMMDD}-{00001}
  v_barcode := 'LOT-' || v_prefix || '-' || v_date_key || '-' || lpad(v_sequence::text, 5, '0');
  
  RETURN v_barcode;
END;
$$;

-- Permissions d'exécution pour les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.generate_lot_barcode(uuid, uuid) TO authenticated;

-- 5) Recharger le schéma PostgREST
NOTIFY pgrst, 'reload schema';