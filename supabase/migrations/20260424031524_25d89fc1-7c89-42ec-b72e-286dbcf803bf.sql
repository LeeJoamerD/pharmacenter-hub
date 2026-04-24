-- Helper SECURITY DEFINER STABLE pour vérifier la participation à un canal sans récursion RLS
CREATE OR REPLACE FUNCTION public.is_channel_participant(p_channel_id uuid, p_pharmacy_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channel_participants
    WHERE channel_id = p_channel_id AND pharmacy_id = p_pharmacy_id
  );
$$;

-- network_channels : autoriser la lecture aux participants du canal
DROP POLICY IF EXISTS "View channels" ON public.network_channels;
CREATE POLICY "View channels"
ON public.network_channels
FOR SELECT
USING (
  tenant_id = get_current_user_tenant_id()
  OR type = 'public'
  OR public.is_channel_participant(id, get_current_user_tenant_id())
);

-- channel_participants : autoriser la lecture si la pharmacie courante est elle-même la participante,
-- ou si elle co-participe au même canal
DROP POLICY IF EXISTS "View participants" ON public.channel_participants;
CREATE POLICY "View participants"
ON public.channel_participants
FOR SELECT
USING (
  tenant_id = get_current_user_tenant_id()
  OR pharmacy_id = get_current_user_tenant_id()
  OR public.is_channel_participant(channel_id, get_current_user_tenant_id())
);

-- network_messages : autoriser la lecture aux participants du canal (via le helper SECURITY DEFINER)
DROP POLICY IF EXISTS "View messages" ON public.network_messages;
CREATE POLICY "View messages"
ON public.network_messages
FOR SELECT
USING (
  public.is_channel_participant(channel_id, get_current_user_tenant_id())
);

-- Realtime : s'assurer que network_messages est dans la publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'network_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.network_messages';
  END IF;
END $$;