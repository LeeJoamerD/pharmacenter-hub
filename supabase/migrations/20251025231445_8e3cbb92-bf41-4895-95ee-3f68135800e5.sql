-- ============================================================================
-- Restauration complète de parametres_systeme avec is_modifiable et RLS
-- ============================================================================

-- Étape 1: Créer la fonction is_system_admin()
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role text;
  user_tenant_id uuid;
BEGIN
  -- Récupérer tenant_id et rôle en une seule requête
  SELECT tenant_id, role INTO user_tenant_id, user_role
  FROM public.personnel
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  -- Retourner true si l'utilisateur est Admin ou Pharmacien
  RETURN (user_tenant_id IS NOT NULL AND user_role IN ('Admin', 'Pharmacien'));
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_system_admin() TO authenticated;

COMMENT ON FUNCTION public.is_system_admin() IS 
'SECURITY DEFINER: Vérifie si l''utilisateur actuel est Admin ou Pharmacien';

-- Étape 2: Ajouter la colonne is_modifiable à parametres_systeme
ALTER TABLE public.parametres_systeme
ADD COLUMN IF NOT EXISTS is_modifiable BOOLEAN DEFAULT true;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_parametres_systeme_modifiable 
ON public.parametres_systeme(tenant_id, is_modifiable) 
WHERE is_modifiable = true;

COMMENT ON COLUMN public.parametres_systeme.is_modifiable IS 
'Indique si le paramètre peut être modifié par les utilisateurs (false pour les paramètres système critiques)';

-- Étape 3: Remplacer les policies RLS par des policies spécifiques
-- Supprimer la policy générique existante
DROP POLICY IF EXISTS "tenant_access_parametres_systeme" ON public.parametres_systeme;

-- Policy SELECT : Tous les utilisateurs peuvent lire leurs paramètres
DROP POLICY IF EXISTS "Users can view system parameters from their tenant" ON public.parametres_systeme;
CREATE POLICY "Users can view system parameters from their tenant"
ON public.parametres_systeme
FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

-- Policy INSERT : Seulement Admin/Pharmacien ou system_admin
DROP POLICY IF EXISTS "Admins can insert system parameters in their tenant" ON public.parametres_systeme;
CREATE POLICY "Admins can insert system parameters in their tenant" 
ON public.parametres_systeme 
FOR INSERT 
WITH CHECK (
  (tenant_id = get_current_user_tenant_id()) AND 
  (
    is_system_admin() OR 
    EXISTS (
      SELECT 1 FROM personnel 
      WHERE auth_user_id = auth.uid() 
      AND role = ANY(ARRAY['Admin', 'Pharmacien'])
    )
  )
);

-- Policy UPDATE : Seulement Admin/Pharmacien ET seulement les paramètres modifiables
DROP POLICY IF EXISTS "Admins can update modifiable system parameters from their tenant" ON public.parametres_systeme;
CREATE POLICY "Admins can update modifiable system parameters from their tenant" 
ON public.parametres_systeme 
FOR UPDATE 
USING (
  (tenant_id = get_current_user_tenant_id()) AND 
  (is_modifiable = true) AND 
  (
    is_system_admin() OR 
    EXISTS (
      SELECT 1 FROM personnel 
      WHERE auth_user_id = auth.uid() 
      AND role = ANY(ARRAY['Admin', 'Pharmacien'])
    )
  )
);

-- Étape 4: S'assurer que la contrainte unique existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_tenant_cle_parametre'
    AND conrelid = 'public.parametres_systeme'::regclass
  ) THEN
    ALTER TABLE public.parametres_systeme
    ADD CONSTRAINT unique_tenant_cle_parametre 
    UNIQUE (tenant_id, cle_parametre);
  END IF;
END $$;

-- Index pour améliorer les performances des upserts
CREATE INDEX IF NOT EXISTS idx_parametres_systeme_tenant_cle 
ON public.parametres_systeme(tenant_id, cle_parametre);

-- Étape 5: Mettre à jour les paramètres existants
-- Marquer certains paramètres système critiques comme non modifiables
UPDATE public.parametres_systeme
SET is_modifiable = false
WHERE cle_parametre IN (
  'system_version',
  'system_initialized',
  'database_version'
)
AND is_modifiable = true;

-- Vérification finale: Afficher le résumé des policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'parametres_systeme'
ORDER BY policyname;