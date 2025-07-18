
-- Ajouter la colonne password à la table pharmacies
ALTER TABLE public.pharmacies 
ADD COLUMN password TEXT;

-- Créer un index pour optimiser les recherches par email/password
CREATE INDEX IF NOT EXISTS idx_pharmacies_email ON public.pharmacies(email);

-- Ajouter des contraintes de sécurité
ALTER TABLE public.pharmacies 
ADD CONSTRAINT check_password_length CHECK (password IS NULL OR LENGTH(password) >= 8);

-- Mettre à jour la politique RLS pour permettre l'insertion lors de la création de compte
DROP POLICY IF EXISTS "Users can insert pharmacies in their tenant" ON public.pharmacies;
CREATE POLICY "Allow pharmacy registration" 
  ON public.pharmacies 
  FOR INSERT 
  WITH CHECK (true);

-- Permettre la lecture pour l'authentification
DROP POLICY IF EXISTS "Users can view pharmacies from their tenant" ON public.pharmacies;
CREATE POLICY "Allow pharmacy authentication" 
  ON public.pharmacies 
  FOR SELECT 
  USING (true);
