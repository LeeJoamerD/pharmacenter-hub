-- Créer un compte temporaire de pharmacie et administrateur pour test
-- 1. D'abord créer l'utilisateur auth (sera fait via le code côté client)

-- 2. Créer la pharmacie temporaire
INSERT INTO public.pharmacies (
  id,
  tenant_id,
  name,
  code,
  address,
  quartier,
  arrondissement,
  city,
  region,
  pays,
  email,
  telephone_appel,
  telephone_whatsapp,
  departement,
  type,
  status
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  'Pharmacie Test Temporaire',
  'TEMP_' || EXTRACT(EPOCH FROM NOW())::bigint,
  '123 Rue de Test',
  'Quartier Test',
  'Arrondissement Test',
  'Yaoundé',
  'Centre',
  'Cameroun',
  'test.temp@pharmacie.cm',
  '+237670000000',
  '+237670000001',
  'Test Department',
  'Pharmacie',
  'active'
) ON CONFLICT DO NOTHING;

-- Note: Le personnel administrateur sera créé par le code côté client après l'authentification
-- car il nécessite une liaison avec l'auth.users qui doit être créé via supabase.auth.signUp()