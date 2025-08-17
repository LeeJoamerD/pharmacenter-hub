
-- 1) Backfill ciblé des comptes Personnel manquants pour deux pharmacies données
-- - Lien par email: pharmacies.email = auth.users.email
-- - N'insère que si aucune ligne personnel correspondante n'existe déjà

WITH targets AS (
  SELECT 
    p.id                      AS tenant_id,
    p.name                    AS pharmacy_name,
    p.email                   AS email,
    u.id                      AS auth_user_id
  FROM public.pharmacies p
  JOIN auth.users u 
    ON lower(u.email) = lower(p.email)
  LEFT JOIN public.personnel pe 
    ON pe.auth_user_id = u.id 
   AND pe.tenant_id = p.id
  WHERE lower(p.email) IN (
    'djl.computersciences@gmail.com',
    'permistravailef.poleagrogac@gmail.com'
  )
  AND pe.id IS NULL
)
INSERT INTO public.personnel (
  tenant_id,
  auth_user_id,
  noms,
  prenoms,
  reference_agent,
  email,
  telephone_appel,
  role,
  is_active,
  google_verified,
  created_at,
  updated_at
)
SELECT 
  t.tenant_id,
  t.auth_user_id,
  'Administrateur'::text                                   AS noms,
  t.pharmacy_name::text                                    AS prenoms,
  'ADMIN-' || to_char(now(),'YYYYMMDDHH24MISS') 
           || '-' || substr(t.auth_user_id::text,1,8)      AS reference_agent,
  t.email,
  NULL::text                                               AS telephone_appel,
  'Admin'::text                                            AS role,
  true                                                     AS is_active,
  true                                                     AS google_verified,
  now()                                                    AS created_at,
  now()                                                    AS updated_at
FROM targets t;

-- 2) (Optionnel mais recommandé) Vérification rapide
-- SELECT id, tenant_id, auth_user_id, email, role, is_active FROM public.personnel
-- WHERE lower(email) IN ('djl.computersciences@gmail.com','permistravailef.poleagrogac@gmail.com');
