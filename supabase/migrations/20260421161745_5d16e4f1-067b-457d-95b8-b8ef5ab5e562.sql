CREATE OR REPLACE FUNCTION public.send_direct_network_message(
  recipient_pharmacy_ids uuid[],
  p_content text,
  p_priority text DEFAULT 'normal'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_pharmacy_id uuid;
  v_sender_name text;
  v_recipient_id uuid;
  v_channel_id uuid;
  v_channel_name text;
  v_recipient_name text;
  v_sent_count int := 0;
  v_failed_count int := 0;
  v_channel_ids uuid[] := ARRAY[]::uuid[];
  v_errors jsonb := '[]'::jsonb;
BEGIN
  SELECT p.id, p.name
  INTO v_sender_pharmacy_id, v_sender_name
  FROM public.pharmacies p
  JOIN public.personnel pe ON pe.tenant_id = p.id
  WHERE pe.auth_user_id = auth.uid()
  LIMIT 1;

  IF v_sender_pharmacy_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non rattaché à une pharmacie';
  END IF;

  IF p_content IS NULL OR length(trim(p_content)) = 0 THEN
    RAISE EXCEPTION 'Le contenu du message est requis';
  END IF;

  FOREACH v_recipient_id IN ARRAY recipient_pharmacy_ids
  LOOP
    BEGIN
      IF v_recipient_id = v_sender_pharmacy_id THEN
        v_failed_count := v_failed_count + 1;
        v_errors := v_errors || jsonb_build_object('pharmacy_id', v_recipient_id, 'error', 'self');
        CONTINUE;
      END IF;

      v_channel_name := 'Direct: ' || (
        SELECT string_agg(x::text, '-' ORDER BY x::text)
        FROM unnest(ARRAY[v_sender_pharmacy_id, v_recipient_id]) AS x
      );

      SELECT id INTO v_channel_id
      FROM public.network_channels
      WHERE type = 'direct' AND name = v_channel_name
      LIMIT 1;

      IF v_channel_id IS NULL THEN
        SELECT name INTO v_recipient_name FROM public.pharmacies WHERE id = v_recipient_id;

        INSERT INTO public.network_channels (
          name, description, type, is_public, tenant_id, created_by
        ) VALUES (
          v_channel_name,
          'Conversation directe entre ' || coalesce(v_sender_name, '') || ' et ' || coalesce(v_recipient_name, ''),
          'direct',
          false,
          v_sender_pharmacy_id,
          v_sender_pharmacy_id
        )
        RETURNING id INTO v_channel_id;

        INSERT INTO public.channel_participants (channel_id, pharmacy_id, tenant_id)
        VALUES
          (v_channel_id, v_sender_pharmacy_id, v_sender_pharmacy_id),
          (v_channel_id, v_recipient_id, v_recipient_id)
        ON CONFLICT DO NOTHING;
      ELSE
        INSERT INTO public.channel_participants (channel_id, pharmacy_id, tenant_id)
        SELECT v_channel_id, v_sender_pharmacy_id, v_sender_pharmacy_id
        WHERE NOT EXISTS (
          SELECT 1 FROM public.channel_participants
          WHERE channel_id = v_channel_id AND pharmacy_id = v_sender_pharmacy_id
        );
        INSERT INTO public.channel_participants (channel_id, pharmacy_id, tenant_id)
        SELECT v_channel_id, v_recipient_id, v_recipient_id
        WHERE NOT EXISTS (
          SELECT 1 FROM public.channel_participants
          WHERE channel_id = v_channel_id AND pharmacy_id = v_recipient_id
        );
      END IF;

      INSERT INTO public.network_messages (
        channel_id, sender_pharmacy_id, sender_name, content,
        priority, message_type, tenant_id, metadata
      ) VALUES (
        v_channel_id,
        v_sender_pharmacy_id,
        v_sender_name,
        p_content,
        coalesce(p_priority, 'normal'),
        'text',
        v_sender_pharmacy_id,
        jsonb_build_object('sender_user_id', auth.uid(), 'direct', true)
      );

      v_sent_count := v_sent_count + 1;
      v_channel_ids := v_channel_ids || v_channel_id;
    EXCEPTION WHEN OTHERS THEN
      v_failed_count := v_failed_count + 1;
      v_errors := v_errors || jsonb_build_object('pharmacy_id', v_recipient_id, 'error', SQLERRM);
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'sent_count', v_sent_count,
    'failed_count', v_failed_count,
    'channel_ids', to_jsonb(v_channel_ids),
    'errors', v_errors
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_direct_network_message(uuid[], text, text) TO authenticated;