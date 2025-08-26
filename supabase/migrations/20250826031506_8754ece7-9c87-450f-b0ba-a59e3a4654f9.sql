-- Ensure network_system_stats table exists with proper structure
CREATE TABLE IF NOT EXISTS public.network_system_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  database_size_mb NUMERIC DEFAULT 0,
  log_size_mb NUMERIC DEFAULT 0,
  temp_files_mb NUMERIC DEFAULT 0,
  disk_usage NUMERIC DEFAULT 0,
  memory_usage NUMERIC DEFAULT 0,
  cpu_usage NUMERIC DEFAULT 0,
  uptime_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on network_system_stats
ALTER TABLE public.network_system_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for network_system_stats
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view network system stats from their tenant" ON public.network_system_stats;
  DROP POLICY IF EXISTS "Users can insert network system stats in their tenant" ON public.network_system_stats;
  DROP POLICY IF EXISTS "Users can update network system stats from their tenant" ON public.network_system_stats;
  
  -- Create new policies
  CREATE POLICY "Users can view network system stats from their tenant" 
    ON public.network_system_stats FOR SELECT 
    USING (tenant_id = get_current_user_tenant_id());
    
  CREATE POLICY "Users can insert network system stats in their tenant" 
    ON public.network_system_stats FOR INSERT 
    WITH CHECK (tenant_id = get_current_user_tenant_id());
    
  CREATE POLICY "Users can update network system stats from their tenant" 
    ON public.network_system_stats FOR UPDATE 
    USING (tenant_id = get_current_user_tenant_id());
END $$;

-- Grant permissions on the RPC function
GRANT EXECUTE ON FUNCTION public.refresh_network_system_stats(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.refresh_network_system_stats(uuid) TO authenticated;