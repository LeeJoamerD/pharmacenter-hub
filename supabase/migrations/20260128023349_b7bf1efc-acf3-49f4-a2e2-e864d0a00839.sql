-- Définir le mot de passe temporaire "Pharma2026!" pour TOUTES les pharmacies existantes
-- Utilise extensions.crypt directement car nous avons les droits admin via migration

-- DJL - Computer Sciences
UPDATE public.pharmacies 
SET password_hash = extensions.crypt('Pharma2026!', extensions.gen_salt('bf')),
    updated_at = now()
WHERE id = 'b51e3719-13d1-4cfb-96ed-2429bb62b411';

-- Pharmacie MAZAYU
UPDATE public.pharmacies 
SET password_hash = extensions.crypt('Pharma2026!', extensions.gen_salt('bf')),
    updated_at = now()
WHERE id = 'aa8717d1-d450-48dd-a484-66402e435797';

-- Pharmacie Nuit Rond Point de la Paix
UPDATE public.pharmacies 
SET password_hash = extensions.crypt('Pharma2026!', extensions.gen_salt('bf')),
    updated_at = now()
WHERE id = '58a29961-293d-40de-901d-90e1fba81c19';

-- Pharmacie La GLOIRE
UPDATE public.pharmacies 
SET password_hash = extensions.crypt('Pharma2026!', extensions.gen_salt('bf')),
    updated_at = now()
WHERE id = '5b752062-3e24-47bd-93b8-004a4dcfb5b0';

-- Pharmacie TESTS
UPDATE public.pharmacies 
SET password_hash = extensions.crypt('Pharma2026!', extensions.gen_salt('bf')),
    updated_at = now()
WHERE id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8';