
-- 1) Sécuriser la table: au plus 1 ligne par tenant (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS network_system_stats_unique_tenant_idx
ON public.network_system_stats(tenant_id);

-- 2) Corriger la fonction: utiliser des variables locales correctement
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

  v_database_size_mb := ROUND(v_database_size_bytes / 1024.0 / 1024.0, 2);

  -- Taille des logs (très approximative)
  SELECT COUNT(*) INTO v_log_entries_count
  FROM public.audit_logs
  WHERE tenant_id = p_tenant_id;

  v_log_size_mb := ROUND(v_log_entries_count * 0.5, 2);

  -- "Fichiers temporaires" estimés
  SELECT COUNT(*) INTO v_temp_files_count
  FROM public.audit_logs
  WHERE tenant_id = p_tenant_id
    AND created_at > NOW() - INTERVAL '24 hours';

  v_temp_files_mb := ROUND(v_temp_files_count * 0.1, 2);

  -- Valeurs dynamiques simulées
  v_disk_usage   := ROUND(45 + (RANDOM() * 30), 1);
  v_memory_usage := ROUND(35 + (RANDOM() * 25), 1);
  v_cpu_usage    := ROUND(20 + (RANDOM() * 40), 1);

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

-- 3) S'assurer que les permissions d'exécution sont bien en place (idempotent)
GRANT EXECUTE ON FUNCTION public.refresh_network_system_stats(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.refresh_network_system_stats(uuid) TO authenticated;
