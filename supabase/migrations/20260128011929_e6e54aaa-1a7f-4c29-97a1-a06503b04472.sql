-- Phase 4 : Synchronisation des tables après consolidation des comptes

-- Étape 4.1 : Mettre à jour l'email de la pharmacie DJL
UPDATE public.pharmacies 
SET email = 'djl.computersciences@gmail.com',
    updated_at = now()
WHERE id = 'b51e3719-13d1-4cfb-96ed-2429bb62b411';

-- Étape 4.2 : Mettre à jour l'email du platform_admin
UPDATE public.platform_admins 
SET email = 'djl.computersciences@gmail.com',
    updated_at = now()
WHERE id = 'fd9b4cff-f8d0-4d51-a25c-5a08a4589c06';

-- Étape 4.3 : Re-lier le personnel DJL au compte A et mettre à jour l'email
UPDATE public.personnel 
SET auth_user_id = 'b9cc5585-2d79-4efb-81d1-1d8eb69eea05',
    email = 'djl.computersciences@gmail.com',
    updated_at = now()
WHERE id = 'fce2a75d-a28f-49fa-9a34-66ca1a8f64c0';

-- Étape 4.4 : Mettre à jour l'email du personnel archivé (cohérence)
UPDATE public.personnel 
SET email = 'djl.computersciences@gmail.com',
    updated_at = now()
WHERE id = '7a3dcaaa-1f81-4b46-86c5-12715ee00e7f';

-- Étape 4.5 : Transférer les audit_logs du compte B vers le compte A
UPDATE public.audit_logs 
SET user_id = 'b9cc5585-2d79-4efb-81d1-1d8eb69eea05'
WHERE user_id = '414f0849-d89d-48c0-bb7d-f14ae19aac07';