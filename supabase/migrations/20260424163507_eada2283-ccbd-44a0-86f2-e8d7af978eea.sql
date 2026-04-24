CREATE OR REPLACE FUNCTION public.get_network_collaborations()
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  members_count int,
  messages_count int,
  last_activity timestamptz,
  status text,
  is_owner boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (SELECT public.get_current_user_tenant_id() AS tid)
  SELECT
    c.id,
    c.name,
    c.description,
    (SELECT count(*) FROM public.channel_participants cp WHERE cp.channel_id = c.id)::int AS members_count,
    (SELECT count(*) FROM public.network_messages m WHERE m.channel_id = c.id)::int AS messages_count,
    GREATEST(
      c.created_at,
      COALESCE(
        (SELECT max(m.created_at) FROM public.network_messages m WHERE m.channel_id = c.id),
        c.created_at
      )
    ) AS last_activity,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.network_messages m
        WHERE m.channel_id = c.id
          AND m.created_at >= now() - interval '7 days'
      ) THEN 'active'
      ELSE 'inactive'
    END AS status,
    (c.tenant_id = (SELECT tid FROM me)) AS is_owner
  FROM public.network_channels c, me
  WHERE c.type = 'collaboration'
    AND (
      c.tenant_id = me.tid
      OR EXISTS (
        SELECT 1 FROM public.channel_participants cp
        WHERE cp.channel_id = c.id
          AND cp.pharmacy_id = me.tid
      )
    )
  ORDER BY 6 DESC
  LIMIT 10;
$$;

GRANT EXECUTE ON FUNCTION public.get_network_collaborations() TO authenticated;