-- Nettoyer les données de test et tester avec le bon enum
DELETE FROM clients WHERE tenant_id = 'c6dde9fb-2ae8-442b-ad95-39be58f4eb4c';
DELETE FROM societes WHERE tenant_id = 'c6dde9fb-2ae8-442b-ad95-39be58f4eb4c';
DELETE FROM conventionnes WHERE tenant_id = 'c6dde9fb-2ae8-442b-ad95-39be58f4eb4c';

-- Test d'insertion d'une société
INSERT INTO public.societes (
  tenant_id,
  libelle_societe,
  adresse,
  telephone_appel,
  email,
  limite_dette,
  taux_couverture_agent,
  taux_couverture_ayant_droit
) VALUES (
  'c6dde9fb-2ae8-442b-ad95-39be58f4eb4c',
  'TOTAL E&P Congo',
  'Zone Industrielle, Pointe-Noire',
  '+242 22 24 10 00',
  'contact@total.cg',
  500000,
  80,
  60
);

-- Test d'insertion d'un conventionné
INSERT INTO public.conventionnes (
  tenant_id,
  noms,
  adresse,
  ville,
  telephone_appel,
  email,
  limite_dette,
  taux_remise_automatique
) VALUES (
  'c6dde9fb-2ae8-442b-ad95-39be58f4eb4c',
  'Cabinet Médical Central',
  'Avenue Charles de Gaulle',
  'Brazzaville',
  '+242 05 55 55 55',
  'contact@cabinet-medical.cg',
  200000,
  15.00
);