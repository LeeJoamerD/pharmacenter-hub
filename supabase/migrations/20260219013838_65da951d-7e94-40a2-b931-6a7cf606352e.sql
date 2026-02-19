-- Fix: Set pharmacies_public view to SECURITY INVOKER
-- This ensures RLS policies of the querying user are applied, not the view creator
ALTER VIEW public.pharmacies_public SET (security_invoker = true);