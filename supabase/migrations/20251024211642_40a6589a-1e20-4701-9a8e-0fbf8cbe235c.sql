-- ===================================
-- Migration 04: Réseau PharmaSoft
-- ===================================

CREATE TABLE public.network_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT,
  type TEXT DEFAULT 'public' CHECK (type IN ('public', 'private', 'direct')),
  is_system BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_network_channels_tenant_id ON public.network_channels(tenant_id);
CREATE TRIGGER update_network_channels_updated_at BEFORE UPDATE ON public.network_channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.channel_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.network_channels(id) ON DELETE CASCADE,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id, pharmacy_id)
);

CREATE INDEX idx_channel_participants_channel_id ON public.channel_participants(channel_id);

CREATE TABLE public.network_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.network_channels(id) ON DELETE CASCADE,
  sender_pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL, content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  metadata JSONB DEFAULT '{}', read_by JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_network_messages_channel_id ON public.network_messages(channel_id);
CREATE TRIGGER update_network_messages_updated_at BEFORE UPDATE ON public.network_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pharmacy_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMPTZ DEFAULT now(),
  current_users INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(pharmacy_id)
);

CREATE TRIGGER update_pharmacy_presence_updated_at BEFORE UPDATE ON public.pharmacy_presence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.network_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View channels" ON public.network_channels FOR SELECT USING (tenant_id = get_current_user_tenant_id() OR type = 'public');
CREATE POLICY "Manage channels" ON public.network_channels FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.channel_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View participants" ON public.channel_participants FOR SELECT USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Manage participants" ON public.channel_participants FOR ALL USING (tenant_id = get_current_user_tenant_id()) WITH CHECK (tenant_id = get_current_user_tenant_id());

ALTER TABLE public.network_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View messages" ON public.network_messages FOR SELECT USING (channel_id IN (SELECT channel_id FROM public.channel_participants WHERE pharmacy_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid())));
CREATE POLICY "Insert messages" ON public.network_messages FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Update own messages" ON public.network_messages FOR UPDATE USING (sender_pharmacy_id = get_current_user_tenant_id());
CREATE POLICY "Delete own messages" ON public.network_messages FOR DELETE USING (sender_pharmacy_id = get_current_user_tenant_id());

ALTER TABLE public.pharmacy_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View all presence" ON public.pharmacy_presence FOR SELECT USING (true);
CREATE POLICY "Manage own presence" ON public.pharmacy_presence FOR ALL USING (pharmacy_id = get_current_user_tenant_id()) WITH CHECK (pharmacy_id = get_current_user_tenant_id());

ALTER PUBLICATION supabase_realtime ADD TABLE public.network_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pharmacy_presence;