-- Sécuriser la table verification_codes (données PII sensibles)
-- Problème: Table accessible publiquement avec emails et numéros de téléphone

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Service role can manage verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Users can view their own verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Users can insert verification codes" ON public.verification_codes;

-- S'assurer que RLS est activé
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Les codes de vérification sont gérés uniquement par les edge functions via service_role
-- Aucun accès direct depuis le client n'est nécessaire

-- Politique pour le service role uniquement (edge functions)
CREATE POLICY "Service role full access to verification codes"
ON public.verification_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Bloquer tout accès public et authenticated direct
-- Les utilisateurs ne doivent pas pouvoir lire les codes directement
-- La vérification se fait via edge function qui utilise service_role

-- Note: Si un utilisateur a besoin de voir ses propres codes (cas rare),
-- décommenter et adapter cette politique:
-- CREATE POLICY "Users can view their own verification codes"
-- ON public.verification_codes
-- FOR SELECT
-- TO authenticated
-- USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));