-- Enregistrer lee.joamer@gmail.com comme Platform Admin
INSERT INTO public.platform_admins (auth_user_id, email, nom, prenoms, is_active)
VALUES (
  'b9cc5585-2d79-4efb-81d1-1d8eb69eea05',
  'lee.joamer@gmail.com',
  'DIAMBOMBA',
  'LEE JOAMER',
  true
)
ON CONFLICT (auth_user_id) DO UPDATE SET
  is_active = true,
  updated_at = now();