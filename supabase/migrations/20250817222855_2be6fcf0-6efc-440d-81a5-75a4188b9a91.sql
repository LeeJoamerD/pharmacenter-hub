-- Improve get_current_user_tenant_id function with fallback mechanisms
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
  user_tenant_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- If no authenticated user, return null
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Try to get tenant_id from personnel table
  SELECT tenant_id INTO user_tenant_id
  FROM public.personnel 
  WHERE auth_user_id = current_user_id
  AND is_active = true
  LIMIT 1;
  
  -- If found in personnel, return it
  IF user_tenant_id IS NOT NULL THEN
    RETURN user_tenant_id;
  END IF;
  
  -- Fallback: Try to find an active pharmacy for this user
  SELECT ph.id INTO user_tenant_id
  FROM public.pharmacies ph
  WHERE ph.email IN (
    SELECT email FROM auth.users WHERE id = current_user_id
  )
  AND ph.status = 'active'
  LIMIT 1;
  
  -- If found pharmacy, return its id
  IF user_tenant_id IS NOT NULL THEN
    RETURN user_tenant_id;
  END IF;
  
  -- Final fallback: Try to find any active pharmacy session for this user
  SELECT ps.pharmacy_id INTO user_tenant_id
  FROM public.pharmacy_sessions ps
  WHERE ps.user_id = current_user_id
  AND ps.is_active = true
  AND ps.expires_at > now()
  ORDER BY ps.last_activity DESC
  LIMIT 1;
  
  RETURN user_tenant_id;
END;
$function$