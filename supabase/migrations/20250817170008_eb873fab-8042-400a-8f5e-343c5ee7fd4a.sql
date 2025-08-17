-- Just update the admin accounts with correct data
UPDATE public.personnel 
SET 
  role = 'Admin',
  is_active = true,
  fonction = 'Administrateur Pharmacie',
  reference_agent = 'ADMIN_DJL'
WHERE email = 'djl.computersciences@gmail.com' 
AND tenant_id = (SELECT id FROM public.pharmacies WHERE email = 'djl.computersciences@gmail.com');

UPDATE public.personnel 
SET 
  role = 'Admin',
  is_active = true,
  fonction = 'Administrateur Pharmacie',
  reference_agent = 'ADMIN_PGA'
WHERE email = 'permistravailef.poleagrogac@gmail.com' 
AND tenant_id = (SELECT id FROM public.pharmacies WHERE email = 'permistravailef.poleagrogac@gmail.com');