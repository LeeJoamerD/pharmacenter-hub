CREATE OR REPLACE FUNCTION public.get_network_pharmacy_directory()
RETURNS TABLE (
  id uuid,
  name text,
  city text,
  region text,
  pays text,
  type text,
  status text,
  email text,
  telephone_appel text,
  created_at timestamptz,
  personnel_count bigint,
  last_activity timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    p.id, p.name, p.city, p.region, p.pays, p.type, p.status,
    p.email, p.telephone_appel, p.created_at,
    (SELECT count(*) FROM personnel pe 
       WHERE pe.tenant_id = p.id AND pe.is_active = true) AS personnel_count,
    COALESCE(
      (SELECT max(nm.created_at) FROM network_messages nm 
         WHERE nm.sender_pharmacy_id = p.id),
      p.created_at
    ) AS last_activity
  FROM pharmacies p
  ORDER BY p.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_network_pharmacy_directory() TO authenticated;