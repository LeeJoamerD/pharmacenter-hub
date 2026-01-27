-- Phase 2a: Nettoyer TOUTES les sessions pharmacy liées aux auth.users ciblés
DELETE FROM public.pharmacy_sessions 
WHERE user_id IN (
  'b9cc5585-2d79-4efb-81d1-1d8eb69eea05',
  '6fde48b4-a5dd-442d-beb1-d74cc3caa2b2',
  'c8e0dd73-ff05-46bc-ae8a-95272ce0ef15',
  '4a75b9ac-6d37-4cba-b0e3-9dc5c32e1c3e',
  'e4b74dc9-c247-480d-a715-ecfe38d4ad29'
);