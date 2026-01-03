-- =====================================================
-- SÉCURISATION DE LA TABLE pharmacy_sessions
-- Cette migration corrige l'exposition publique des tokens de session
-- =====================================================

-- 1. Supprimer les politiques dangereuses existantes
DROP POLICY IF EXISTS "Allow session operations" ON public.pharmacy_sessions;
DROP POLICY IF EXISTS "Pharmacies can manage their own sessions" ON public.pharmacy_sessions;

-- 2. S'assurer que RLS est activé
ALTER TABLE public.pharmacy_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Créer des politiques sécurisées (authenticated uniquement)

-- SELECT : Utilisateurs ne voient QUE leurs propres sessions
CREATE POLICY "Users can view own sessions"
ON public.pharmacy_sessions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR pharmacy_id = get_current_user_tenant_id()
);

-- INSERT : Utilisateurs créent des sessions pour eux-mêmes uniquement
CREATE POLICY "Users can create own sessions"
ON public.pharmacy_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  OR pharmacy_id = get_current_user_tenant_id()
);

-- UPDATE : Utilisateurs modifient leurs propres sessions uniquement
CREATE POLICY "Users can update own sessions"
ON public.pharmacy_sessions
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  OR pharmacy_id = get_current_user_tenant_id()
);

-- DELETE : Utilisateurs suppriment leurs propres sessions uniquement
CREATE POLICY "Users can delete own sessions"
ON public.pharmacy_sessions
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  OR pharmacy_id = get_current_user_tenant_id()
);

-- 4. Nettoyer les anciennes sessions expirées (réduction de la surface d'attaque)
DELETE FROM public.pharmacy_sessions 
WHERE expires_at < NOW() OR is_active = false;