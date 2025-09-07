-- Fix security warnings from Phase 1 migration
-- 1. Fix search_path for RPC functions
ALTER FUNCTION rpc_stock_record_movement SET search_path = public;
ALTER FUNCTION rpc_stock_update_movement SET search_path = public;
ALTER FUNCTION rpc_stock_delete_movement SET search_path = public;

-- 2. Recreate the view without SECURITY DEFINER (it's a view, not a function)
-- The view is already safe as it uses regular SELECT permissions