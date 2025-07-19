-- Phase 5: Correction gestion utilisateurs - Séparer authentification pharmacie/utilisateur

-- 1. Modifier la fonction get_current_user_tenant_id pour permettre NULL
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid();
$$;

-- 2. Créer une fonction pour vérifier si l'utilisateur est admin système
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND tenant_id IS NULL 
    AND role = 'Super Admin'
  );
$$;

-- 3. Modifier la fonction check_user_permission pour gérer les admins système
CREATE OR REPLACE FUNCTION public.check_user_permission(required_roles text[])
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
  user_role TEXT;
  user_tenant_id UUID;
BEGIN
  -- Vérifier si l'utilisateur est admin système
  IF public.is_system_admin() THEN
    RETURN true;
  END IF;
  
  SELECT role, tenant_id INTO user_role, user_tenant_id
  FROM public.personnel 
  WHERE auth_user_id = auth.uid();
  
  -- Si pas de tenant_id et pas admin système, refuser
  IF user_tenant_id IS NULL AND user_role != 'Super Admin' THEN
    RETURN false;
  END IF;
  
  RETURN user_role = ANY(required_roles);
END;
$function$;

-- 4. Modifier personnel table pour permettre tenant_id NULL pour admins système
ALTER TABLE public.personnel ALTER COLUMN tenant_id DROP NOT NULL;

-- 5. Ajouter contrainte pour s'assurer que seuls les Super Admin peuvent avoir tenant_id NULL
ALTER TABLE public.personnel 
ADD CONSTRAINT personnel_tenant_id_check 
CHECK (
  (tenant_id IS NOT NULL) OR 
  (tenant_id IS NULL AND role = 'Super Admin')
);

-- 6. Modifier les RLS policies des tables critiques pour permettre l'accès aux admins système

-- Table pharmacies - permettre aux admins système de voir toutes les pharmacies
DROP POLICY IF EXISTS "Users can view pharmacies from their tenant" ON public.pharmacies;
CREATE POLICY "Users can view pharmacies from their tenant" 
ON public.pharmacies 
FOR SELECT 
USING (
  public.is_system_admin() OR 
  id = public.get_current_user_tenant_id()
);

-- Permettre aux admins système de modifier les pharmacies
CREATE POLICY "System admins can manage all pharmacies" 
ON public.pharmacies 
FOR ALL 
USING (public.is_system_admin()) 
WITH CHECK (public.is_system_admin());

-- Table personnel - permettre aux admins système de voir tout le personnel
DROP POLICY IF EXISTS "Users can view personnel from their tenant" ON public.personnel;
CREATE POLICY "Users can view personnel from their tenant" 
ON public.personnel 
FOR SELECT 
USING (
  public.is_system_admin() OR 
  tenant_id = public.get_current_user_tenant_id()
);

-- Permettre aux admins système de gérer tout le personnel
CREATE POLICY "System admins can manage all personnel" 
ON public.personnel 
FOR ALL 
USING (public.is_system_admin()) 
WITH CHECK (public.is_system_admin());

-- 7. Créer une table pour gérer les sessions pharmacies (séparées des sessions utilisateurs)
CREATE TABLE IF NOT EXISTS public.pharmacy_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  last_activity timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text,
  is_active boolean DEFAULT true
);

-- RLS pour pharmacy_sessions
ALTER TABLE public.pharmacy_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pharmacy sessions are private" 
ON public.pharmacy_sessions 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- 8. Fonction pour créer une session pharmacie
CREATE OR REPLACE FUNCTION public.create_pharmacy_session(
  p_pharmacy_id uuid,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_token text;
  session_record record;
BEGIN
  -- Générer un token unique
  session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Insérer la session
  INSERT INTO public.pharmacy_sessions (
    pharmacy_id, session_token, ip_address, user_agent
  ) VALUES (
    p_pharmacy_id, session_token, p_ip_address, p_user_agent
  ) RETURNING * INTO session_record;
  
  -- Retourner les données de session
  RETURN jsonb_build_object(
    'session_id', session_record.id,
    'session_token', session_record.session_token,
    'pharmacy_id', session_record.pharmacy_id,
    'expires_at', session_record.expires_at
  );
END;
$$;

-- 9. Fonction pour valider une session pharmacie
CREATE OR REPLACE FUNCTION public.validate_pharmacy_session(p_session_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record record;
  pharmacy_record record;
BEGIN
  -- Vérifier la session
  SELECT ps.*, p.name, p.email, p.code
  INTO session_record
  FROM public.pharmacy_sessions ps
  JOIN public.pharmacies p ON ps.pharmacy_id = p.id
  WHERE ps.session_token = p_session_token
    AND ps.is_active = true
    AND ps.expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false);
  END IF;
  
  -- Mettre à jour la dernière activité
  UPDATE public.pharmacy_sessions 
  SET last_activity = now() 
  WHERE id = session_record.id;
  
  -- Retourner les données
  RETURN jsonb_build_object(
    'valid', true,
    'pharmacy', jsonb_build_object(
      'id', session_record.pharmacy_id,
      'name', session_record.name,
      'email', session_record.email,
      'code', session_record.code
    ),
    'session_id', session_record.id,
    'expires_at', session_record.expires_at
  );
END;
$$;

-- 10. Fonction pour déconnecter une session pharmacie
CREATE OR REPLACE FUNCTION public.disconnect_pharmacy_session(p_session_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.pharmacy_sessions 
  SET is_active = false 
  WHERE session_token = p_session_token;
  
  RETURN FOUND;
END;
$$;