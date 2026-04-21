CREATE OR REPLACE FUNCTION public.get_network_global_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_pharmacies',      (SELECT count(*) FROM pharmacies),
    'active_pharmacies',     (SELECT count(*) FROM pharmacies WHERE status = 'active'),
    'total_users',           (SELECT count(*) FROM personnel WHERE is_active = true),
    'regions_count',         (SELECT count(DISTINCT region) FROM pharmacies WHERE region IS NOT NULL),
    'total_messages',        (SELECT count(*) FROM network_messages),
    'today_messages',        (SELECT count(*) FROM network_messages WHERE created_at >= date_trunc('day', now())),
    'recent_messages_24h',   (SELECT count(*) FROM network_messages WHERE created_at >= now() - interval '24 hours'),
    'total_channels',        (SELECT count(*) FROM network_channels),
    'active_collaborations', (SELECT count(*) FROM network_channels WHERE type = 'collaboration')
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_network_global_stats() TO authenticated;