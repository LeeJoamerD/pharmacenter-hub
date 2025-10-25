-- Part 1: Clean up duplicate register_pharmacy_with_admin function
-- This must be done first to avoid conflicts

DROP FUNCTION IF EXISTS public.register_pharmacy_with_admin(
  p_pharmacy_name text, 
  p_pharmacy_data jsonb, 
  p_admin_noms text, 
  p_admin_prenoms text, 
  p_admin_email text
);