CREATE OR REPLACE FUNCTION public.send_network_alert(
  p_title text,
  p_message text,
  p_priority text,
  p_recipient_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_pharmacy_id uuid;
  v_sender_name text;
  v_sender_user_id uuid := auth.uid();
  v_channel_id uuid;
  v_message_id uuid;
  v_cleaned_recipients uuid[] := ARRAY[]::uuid[];
  v_all_participants uuid[] := ARRAY[]::uuid[];
  v_sent_count integer := 0;
BEGIN
  IF v_sender_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  IF length(trim(coalesce(p_title, ''))) = 0 THEN
    RAISE EXCEPTION 'Le titre de l''alerte est obligatoire';
  END IF;

  IF length(trim(coalesce(p_message, ''))) = 0 THEN
    RAISE EXCEPTION 'Le message de l''alerte est obligatoire';
  END IF;

  IF coalesce(p_priority, '') NOT IN ('high', 'urgent') THEN
    RAISE EXCEPTION 'Priorité d''alerte invalide';
  END IF;

  SELECT pe.tenant_id, ph.name
  INTO v_sender_pharmacy_id, v_sender_name
  FROM public.personnel pe
  JOIN public.pharmacies ph ON ph.id = pe.tenant_id
  WHERE pe.auth_user_id = v_sender_user_id
  LIMIT 1;

  IF v_sender_pharmacy_id IS NULL THEN
    RAISE EXCEPTION 'Officine expéditrice introuvable pour l''utilisateur connecté';
  END IF;

  SELECT coalesce(array_agg(DISTINCT ph.id), ARRAY[]::uuid[])
  INTO v_cleaned_recipients
  FROM unnest(coalesce(p_recipient_ids, ARRAY[]::uuid[])) AS rid(id)
  JOIN public.pharmacies ph ON ph.id = rid.id
  WHERE ph.id <> v_sender_pharmacy_id;

  v_sent_count := coalesce(array_length(v_cleaned_recipients, 1), 0);

  IF v_sent_count = 0 THEN
    RAISE EXCEPTION 'Aucun destinataire valide pour cette alerte';
  END IF;

  SELECT id
  INTO v_channel_id
  FROM public.network_channels
  WHERE name = 'Alertes Réseau'
    AND is_system = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_channel_id IS NULL THEN
    INSERT INTO public.network_channels (
      name,
      description,
      type,
      is_system,
      is_public,
      tenant_id,
      created_by
    )
    VALUES (
      'Alertes Réseau',
      'Canal système pour les alertes urgentes',
      'system',
      true,
      true,
      v_sender_pharmacy_id,
      v_sender_pharmacy_id
    )
    RETURNING id INTO v_channel_id;
  END IF;

  v_all_participants := array_append(v_cleaned_recipients, v_sender_pharmacy_id);

  INSERT INTO public.channel_participants (channel_id, pharmacy_id, role)
  SELECT v_channel_id, participant_id, CASE WHEN participant_id = v_sender_pharmacy_id THEN 'admin' ELSE 'member' END
  FROM unnest(v_all_participants) AS participant_id
  ON CONFLICT (channel_id, pharmacy_id) DO NOTHING;

  INSERT INTO public.network_messages (
    channel_id,
    sender_pharmacy_id,
    sender_name,
    content,
    priority,
    message_type,
    tenant_id,
    metadata
  )
  VALUES (
    v_channel_id,
    v_sender_pharmacy_id,
    coalesce(v_sender_name, 'Système'),
    '🚨 **' || trim(p_title) || E'**\n\n' || trim(p_message),
    p_priority,
    'system',
    v_sender_pharmacy_id,
    jsonb_build_object(
      'sender_user_id', v_sender_user_id,
      'alert_type', 'network',
      'title', trim(p_title),
      'recipients', v_cleaned_recipients,
      'recipients_count', v_sent_count
    )
  )
  RETURNING id INTO v_message_id;

  INSERT INTO public.network_audit_logs (
    tenant_id,
    user_id,
    action_type,
    action_category,
    target_type,
    target_id,
    target_name,
    source_tenant_id,
    details,
    severity,
    is_sensitive,
    is_reviewed
  )
  VALUES (
    v_sender_pharmacy_id,
    v_sender_user_id,
    'alert_sent',
    'message',
    'network_message',
    v_message_id,
    trim(p_title),
    v_sender_pharmacy_id,
    jsonb_build_object(
      'actor_pharmacy_name', v_sender_name,
      'action_description', 'Alerte "' || trim(p_title) || '" diffusée à ' || v_sent_count || ' officine(s)',
      'channel_id', v_channel_id,
      'scope', 'network_alert',
      'recipients', v_cleaned_recipients,
      'recipients_count', v_sent_count
    ),
    CASE WHEN p_priority = 'urgent' THEN 'critical' ELSE 'warning' END,
    p_priority = 'urgent',
    false
  );

  RETURN jsonb_build_object(
    'sent_count', v_sent_count,
    'failed_count', 0,
    'channel_id', v_channel_id,
    'message_id', v_message_id,
    'recipients', v_cleaned_recipients
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_network_alert(text, text, text, uuid[]) TO authenticated;