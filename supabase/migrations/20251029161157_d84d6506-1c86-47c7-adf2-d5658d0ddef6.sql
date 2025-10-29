-- ============================================
-- PHASE 1: Restauration de la table print_printers
-- ============================================

-- Create printers table for print settings
CREATE TABLE IF NOT EXISTS public.print_printers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'standard', -- 'standard', 'receipt', 'thermal'
  connection_type TEXT NOT NULL DEFAULT 'usb', -- 'usb', 'network', 'bluetooth'
  ip_address TEXT,
  port TEXT,
  driver_name TEXT,
  paper_sizes TEXT[] DEFAULT ARRAY['A4'],
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.print_printers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view printers from their tenant"
ON public.print_printers
FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert printers in their tenant"
ON public.print_printers
FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update printers from their tenant"
ON public.print_printers
FOR UPDATE
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete printers from their tenant"
ON public.print_printers
FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Create updated_at trigger
CREATE TRIGGER update_print_printers_updated_at
  BEFORE UPDATE ON public.print_printers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default printers for existing tenants
INSERT INTO public.print_printers (tenant_id, name, type, connection_type)
SELECT DISTINCT tenant_id, 'Imprimante par défaut', 'standard', 'usb'
FROM public.pharmacies
WHERE status = 'active'
ON CONFLICT DO NOTHING;

-- ============================================
-- PHASE 2: Restauration de la fonction refresh_network_system_stats
-- ============================================

CREATE OR REPLACE FUNCTION public.refresh_network_system_stats(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_database_size_bytes BIGINT;
  v_database_size_mb NUMERIC;
  v_log_entries_count INTEGER;
  v_log_size_mb NUMERIC;
  v_temp_files_count INTEGER;
  v_temp_files_mb NUMERIC;
  v_disk_usage NUMERIC;
  v_memory_usage NUMERIC;
  v_cpu_usage NUMERIC;
  current_stats public.network_system_stats%ROWTYPE;
  result JSONB;
BEGIN
  -- Estimation de la taille "BD" par comptage de lignes (approximatif)
  SELECT COALESCE(
    (SELECT COUNT(*) FROM public.produits  WHERE tenant_id = p_tenant_id) +
    (SELECT COUNT(*) FROM public.lots      WHERE tenant_id = p_tenant_id) +
    (SELECT COUNT(*) FROM public.ventes    WHERE tenant_id = p_tenant_id) +
    (SELECT COUNT(*) FROM public.personnel WHERE tenant_id = p_tenant_id) +
    (SELECT COUNT(*) FROM public.audit_logs WHERE tenant_id = p_tenant_id),
    0
  ) * 1024
  INTO v_database_size_bytes;

  v_database_size_mb := ROUND((v_database_size_bytes / 1024.0 / 1024.0)::numeric, 2);

  -- Taille des logs (très approximative)
  SELECT COUNT(*) INTO v_log_entries_count
  FROM public.audit_logs
  WHERE tenant_id = p_tenant_id;

  v_log_size_mb := ROUND((v_log_entries_count * 0.5)::numeric, 2);

  -- "Fichiers temporaires" estimés
  SELECT COUNT(*) INTO v_temp_files_count
  FROM public.audit_logs
  WHERE tenant_id = p_tenant_id
    AND created_at > NOW() - INTERVAL '24 hours';

  v_temp_files_mb := ROUND((v_temp_files_count * 0.1)::numeric, 2);

  -- Valeurs dynamiques simulées - Cast to numeric before ROUND
  v_disk_usage   := ROUND((45 + (RANDOM() * 30))::numeric, 1);
  v_memory_usage := ROUND((35 + (RANDOM() * 25))::numeric, 1);
  v_cpu_usage    := ROUND((20 + (RANDOM() * 40))::numeric, 1);

  -- Récupérer la ligne existante (la plus récente s'il y en avait plusieurs)
  SELECT *
  INTO current_stats
  FROM public.network_system_stats
  WHERE tenant_id = p_tenant_id
  ORDER BY updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.network_system_stats (
      tenant_id, database_size_mb, log_size_mb, temp_files_mb,
      disk_usage, memory_usage, cpu_usage, uptime_seconds
    ) VALUES (
      p_tenant_id, v_database_size_mb, v_log_size_mb, v_temp_files_mb,
      v_disk_usage, v_memory_usage, v_cpu_usage,
      EXTRACT(
        EPOCH FROM (
          NOW() - COALESCE(
            (SELECT created_at FROM public.pharmacies WHERE id = p_tenant_id LIMIT 1),
            NOW()
          )
        )
      )::INTEGER
    )
    RETURNING * INTO current_stats;
  ELSE
    UPDATE public.network_system_stats
    SET database_size_mb = v_database_size_mb,
        log_size_mb      = v_log_size_mb,
        temp_files_mb    = v_temp_files_mb,
        disk_usage       = v_disk_usage,
        memory_usage     = v_memory_usage,
        cpu_usage        = v_cpu_usage,
        updated_at       = NOW()
    WHERE tenant_id = p_tenant_id
    RETURNING * INTO current_stats;
  END IF;

  result := jsonb_build_object(
    'database_size_mb', current_stats.database_size_mb,
    'log_size_mb',      current_stats.log_size_mb,
    'temp_files_mb',    current_stats.temp_files_mb,
    'disk_usage',       current_stats.disk_usage,
    'memory_usage',     current_stats.memory_usage,
    'cpu_usage',        current_stats.cpu_usage,
    'uptime_seconds',   current_stats.uptime_seconds,
    'updated_at',       current_stats.updated_at
  );

  RETURN result;
END;
$$;