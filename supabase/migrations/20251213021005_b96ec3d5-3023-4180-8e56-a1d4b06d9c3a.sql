-- Étape 1: SUPPRIMER la contrainte existante EN PREMIER
ALTER TABLE public.personnel DROP CONSTRAINT IF EXISTS personnel_role_check;

-- Étape 2: Migrer les anciens rôles vers les nouveaux
UPDATE public.personnel SET role = 'Pharmacien Titulaire' WHERE role = 'Pharmacien';
UPDATE public.personnel SET role = 'Stagiaire' WHERE role = 'Étudiant en pharmacie';
UPDATE public.personnel SET role = 'Pharmacien Adjoint' WHERE role = 'Manager';
UPDATE public.personnel SET role = 'Pharmacien Adjoint' WHERE role = 'Gérant';
UPDATE public.personnel SET role = 'Gestionnaire de stock' WHERE role = 'Gestionnaire';
UPDATE public.personnel SET role = 'Caissier' WHERE role = 'Employé' AND fonction ILIKE '%caiss%';
UPDATE public.personnel SET role = 'Vendeur' WHERE role = 'Employé';

-- Étape 3: Créer la nouvelle contrainte avec la liste unifiée
ALTER TABLE public.personnel ADD CONSTRAINT personnel_role_check 
CHECK (role IN (
  'Admin',
  'Pharmacien Titulaire',
  'Pharmacien Adjoint',
  'Préparateur',
  'Technicien',
  'Caissier',
  'Vendeur',
  'Gestionnaire de stock',
  'Comptable',
  'Secrétaire',
  'Livreur',
  'Stagiaire',
  'Invité'
));

-- Étape 4: Mettre à jour la policy RLS
DROP POLICY IF EXISTS "Admins and Pharmacien update personnel" ON public.personnel;
DROP POLICY IF EXISTS "Admins and Pharmaciens update personnel" ON public.personnel;

CREATE POLICY "Admins and Pharmaciens update personnel" ON public.personnel
FOR UPDATE TO authenticated
USING (
  tenant_id = get_current_user_tenant_id() 
  AND EXISTS (
    SELECT 1 FROM public.personnel p
    WHERE p.auth_user_id = auth.uid() 
    AND p.role IN ('Admin', 'Pharmacien Titulaire', 'Pharmacien Adjoint')
    AND p.tenant_id = personnel.tenant_id
  )
)
WITH CHECK (
  tenant_id = get_current_user_tenant_id() 
  AND EXISTS (
    SELECT 1 FROM public.personnel p
    WHERE p.auth_user_id = auth.uid() 
    AND p.role IN ('Admin', 'Pharmacien Titulaire', 'Pharmacien Adjoint')
    AND p.tenant_id = personnel.tenant_id
  )
);