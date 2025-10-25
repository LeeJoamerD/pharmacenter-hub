-- Add missing columns to audit_logs table
-- These columns are used by register_pharmacy_with_admin and other audit functions

-- Add status column to track action status (success, failed, pending, etc.)
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS status text;

-- Add error_message column to store error details for debugging
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS error_message text;

-- Create index for status queries to improve monitoring performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_status 
ON public.audit_logs(status) 
WHERE status IS NOT NULL;

-- Create index for failed status queries to quickly find errors
CREATE INDEX IF NOT EXISTS idx_audit_logs_error 
ON public.audit_logs(status) 
WHERE status = 'failed';

-- Update existing records with default status
-- Mark as 'success' if action doesn't indicate failure
UPDATE public.audit_logs 
SET status = 'success' 
WHERE status IS NULL 
  AND action NOT ILIKE '%failed%' 
  AND action NOT ILIKE '%error%';

-- Mark as 'failed' if action indicates failure
UPDATE public.audit_logs 
SET status = 'failed' 
WHERE status IS NULL 
  AND (action ILIKE '%failed%' OR action ILIKE '%error%');

-- Add comment for documentation
COMMENT ON COLUMN public.audit_logs.status IS 'Status of the audit action: success, failed, pending, etc.';
COMMENT ON COLUMN public.audit_logs.error_message IS 'Detailed error message when status is failed';