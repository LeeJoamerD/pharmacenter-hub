-- Table pour stocker les codes de vérification OTP
CREATE TABLE public.verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche rapide par email et type
CREATE INDEX idx_verification_codes_email_type ON public.verification_codes(email, type);
CREATE INDEX idx_verification_codes_expires_at ON public.verification_codes(expires_at);

-- RLS activé mais avec politique permissive pour les edge functions
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion depuis les edge functions (service role)
CREATE POLICY "Service role can manage verification codes"
ON public.verification_codes
FOR ALL
USING (true)
WITH CHECK (true);

-- Table pour les paramètres de la plateforme (API keys, etc.)
CREATE TABLE public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  description TEXT,
  is_secret BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS pour platform_settings - seulement les platform admins
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view settings"
ON public.platform_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.platform_admins 
    WHERE auth_user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Platform admins can manage settings"
ON public.platform_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.platform_admins 
    WHERE auth_user_id = auth.uid() AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.platform_admins 
    WHERE auth_user_id = auth.uid() AND is_active = true
  )
);

-- Insérer les paramètres par défaut
INSERT INTO public.platform_settings (setting_key, setting_value, description, is_secret) VALUES
  ('RESEND_API_KEY', '', 'Clé API Resend pour l''envoi d''emails', true),
  ('TWILIO_ACCOUNT_SID', '', 'Account SID Twilio pour l''envoi de SMS', true),
  ('TWILIO_AUTH_TOKEN', '', 'Auth Token Twilio', true),
  ('TWILIO_PHONE_NUMBER', '', 'Numéro de téléphone Twilio (format +1...)', false),
  ('VERIFICATION_CODE_EXPIRY_MINUTES', '10', 'Durée de validité des codes OTP en minutes', false),
  ('VERIFICATION_MAX_ATTEMPTS', '3', 'Nombre maximum de tentatives de vérification', false);

-- Fonction pour récupérer le téléphone d'une pharmacie par email
CREATE OR REPLACE FUNCTION public.get_pharmacy_phone_by_email(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
BEGIN
  SELECT telephone INTO v_phone
  FROM public.pharmacies
  WHERE email = p_email
  LIMIT 1;
  
  RETURN v_phone;
END;
$$;

-- Fonction pour nettoyer les codes expirés (à appeler périodiquement)
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.verification_codes
  WHERE expires_at < now()
  RETURNING COUNT(*) INTO deleted_count;
  
  RETURN COALESCE(deleted_count, 0);
END;
$$;

-- Trigger pour mettre à jour updated_at sur platform_settings
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();