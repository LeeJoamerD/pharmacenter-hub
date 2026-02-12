
INSERT INTO public.platform_settings (setting_key, setting_value, description, is_secret)
VALUES
  ('VIDAL_APP_ID', '4a795113', 'VIDAL - Application ID', false),
  ('VIDAL_APP_KEY', 'aa8690d575d7ea7f626099ef2f9a6b9c', 'VIDAL - Application Key', true),
  ('VIDAL_EDITEUR_LOGIN', 'editeurs', 'VIDAL - Login éditeur', false),
  ('VIDAL_EDITEUR_PASSWORD', 'e@PJT*BrgUit^piw6PTK2p%5', 'VIDAL - Mot de passe éditeur', true),
  ('VIDAL_DEMO_LOGIN', 'outil_editeur@vidal.fr', 'VIDAL - Login démo', false),
  ('VIDAL_DEMO_PASSWORD', 'outil_editeur_2024', 'VIDAL - Mot de passe démo', true),
  ('VIDAL_API_URL', 'https://api.vidal.fr/rest/api', 'VIDAL - URL de l''API REST', false)
ON CONFLICT (setting_key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
