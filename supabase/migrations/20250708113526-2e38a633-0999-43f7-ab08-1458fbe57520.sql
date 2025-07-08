-- Permettre l'insertion de nouvelles pharmacies lors de l'inscription
-- Cette politique permet la création de pharmacies même sans utilisateur authentifié
CREATE POLICY "Allow pharmacy registration" 
ON public.pharmacies 
FOR INSERT 
WITH CHECK (true);

-- Ajouter aussi une politique pour permettre l'insertion de personnel lors de l'inscription
CREATE POLICY "Allow admin creation during registration" 
ON public.personnel 
FOR INSERT 
WITH CHECK (role = 'Admin');