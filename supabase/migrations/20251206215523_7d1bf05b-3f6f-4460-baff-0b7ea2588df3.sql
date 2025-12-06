-- =====================================================
-- Migration: Network Chat Customization Tables
-- Description: Tables for network customization, user preferences, notifications, themes
-- =====================================================

-- 1. Table des préférences utilisateur réseau
CREATE TABLE IF NOT EXISTS public.network_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  
  -- Apparence
  theme_id TEXT NOT NULL DEFAULT 'default',
  font_size INTEGER NOT NULL DEFAULT 14,
  language TEXT NOT NULL DEFAULT 'fr',
  
  -- Interface
  layout_compact BOOLEAN DEFAULT false,
  animations_enabled BOOLEAN DEFAULT true,
  auto_save BOOLEAN DEFAULT true,
  display_quality TEXT DEFAULT 'high' CHECK (display_quality IN ('low', 'medium', 'high')),
  device_mode TEXT DEFAULT 'desktop' CHECK (device_mode IN ('desktop', 'tablet', 'mobile')),
  
  -- Accessibilité
  high_contrast BOOLEAN DEFAULT false,
  keyboard_focus BOOLEAN DEFAULT true,
  screen_reader BOOLEAN DEFAULT false,
  reduced_motion BOOLEAN DEFAULT false,
  
  -- Avancé - Réseau
  connection_timeout INTEGER DEFAULT 30,
  auto_retry BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  offline_mode BOOLEAN DEFAULT false,
  
  -- Métadonnées
  is_network_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(tenant_id, user_id)
);

-- 2. Table des préférences de notifications
CREATE TABLE IF NOT EXISTS public.network_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  
  notification_type TEXT NOT NULL CHECK (notification_type IN ('direct_messages', 'network_mentions', 'system_alerts', 'collaborations')),
  name TEXT NOT NULL,
  description TEXT,
  
  enabled BOOLEAN DEFAULT true,
  sound BOOLEAN DEFAULT true,
  popup BOOLEAN DEFAULT true,
  email BOOLEAN DEFAULT false,
  
  priority INTEGER DEFAULT 0,
  is_network_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(tenant_id, user_id, notification_type)
);

-- 3. Table des thèmes de personnalisation
CREATE TABLE IF NOT EXISTS public.network_customization_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  
  theme_id TEXT NOT NULL,
  name TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  background_color TEXT NOT NULL,
  preview_class TEXT,
  
  is_default BOOLEAN DEFAULT false,
  is_network_shared BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.personnel(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(theme_id)
);

-- Insérer les thèmes par défaut
INSERT INTO public.network_customization_themes (theme_id, name, primary_color, secondary_color, accent_color, background_color, preview_class, is_default, is_network_shared) VALUES
  ('default', 'Défaut', '#0ea5e9', '#64748b', '#8b5cf6', '#ffffff', 'bg-blue-500', true, true),
  ('dark', 'Sombre', '#3b82f6', '#94a3b8', '#a855f7', '#0f172a', 'bg-gray-900', false, true),
  ('green', 'Vert Pharmacie', '#10b981', '#6b7280', '#f59e0b', '#f9fafb', 'bg-green-500', false, true),
  ('purple', 'Violet Moderne', '#8b5cf6', '#6b7280', '#06b6d4', '#fafafa', 'bg-purple-500', false, true)
ON CONFLICT (theme_id) DO NOTHING;

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_network_user_prefs_tenant ON public.network_user_preferences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_user_prefs_user ON public.network_user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_network_notif_prefs_tenant ON public.network_notification_preferences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_notif_prefs_user ON public.network_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_network_themes_tenant ON public.network_customization_themes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_themes_shared ON public.network_customization_themes(is_network_shared);

-- Enable RLS
ALTER TABLE public.network_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_customization_themes ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour network_user_preferences
CREATE POLICY "Users can view own and network shared preferences" 
ON public.network_user_preferences FOR SELECT 
USING (tenant_id = get_current_user_tenant_id() OR is_network_shared = true);

CREATE POLICY "Users can insert own preferences" 
ON public.network_user_preferences FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update own preferences" 
ON public.network_user_preferences FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete own preferences" 
ON public.network_user_preferences FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies pour network_notification_preferences
CREATE POLICY "Users can view own notification preferences" 
ON public.network_notification_preferences FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert own notification preferences" 
ON public.network_notification_preferences FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update own notification preferences" 
ON public.network_notification_preferences FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete own notification preferences" 
ON public.network_notification_preferences FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies pour network_customization_themes
CREATE POLICY "Users can view global and tenant themes" 
ON public.network_customization_themes FOR SELECT 
USING (tenant_id IS NULL OR tenant_id = get_current_user_tenant_id() OR is_network_shared = true);

CREATE POLICY "Users can insert tenant themes" 
ON public.network_customization_themes FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update own tenant themes" 
ON public.network_customization_themes FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete own tenant themes" 
ON public.network_customization_themes FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_network_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_network_user_preferences_timestamp
  BEFORE UPDATE ON public.network_user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_network_preferences_timestamp();

CREATE TRIGGER update_network_notification_preferences_timestamp
  BEFORE UPDATE ON public.network_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_network_preferences_timestamp();

CREATE TRIGGER update_network_customization_themes_timestamp
  BEFORE UPDATE ON public.network_customization_themes
  FOR EACH ROW EXECUTE FUNCTION update_network_preferences_timestamp();

-- RPC Function pour les métriques de personnalisation
CREATE OR REPLACE FUNCTION get_customization_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  v_total_users INTEGER;
  v_most_used_theme TEXT;
  v_notifications_enabled INTEGER;
  v_accessibility_active INTEGER;
  v_available_themes INTEGER;
BEGIN
  -- Utilisateurs avec préférences
  SELECT COUNT(DISTINCT user_id) INTO v_total_users
  FROM network_user_preferences WHERE tenant_id = p_tenant_id;
  
  -- Thème le plus utilisé
  SELECT theme_id INTO v_most_used_theme
  FROM network_user_preferences WHERE tenant_id = p_tenant_id
  GROUP BY theme_id ORDER BY COUNT(*) DESC LIMIT 1;
  
  -- Notifications activées
  SELECT COUNT(*) INTO v_notifications_enabled
  FROM network_notification_preferences 
  WHERE tenant_id = p_tenant_id AND enabled = true;
  
  -- Fonctionnalités accessibilité actives
  SELECT COUNT(*) INTO v_accessibility_active
  FROM network_user_preferences 
  WHERE tenant_id = p_tenant_id 
    AND (high_contrast = true OR screen_reader = true OR reduced_motion = true);
  
  -- Thèmes disponibles
  SELECT COUNT(*) INTO v_available_themes
  FROM network_customization_themes 
  WHERE tenant_id IS NULL OR tenant_id = p_tenant_id OR is_network_shared = true;
  
  result := jsonb_build_object(
    'total_users_with_preferences', COALESCE(v_total_users, 0),
    'most_used_theme', COALESCE(v_most_used_theme, 'default'),
    'notifications_enabled_count', COALESCE(v_notifications_enabled, 0),
    'accessibility_features_active', COALESCE(v_accessibility_active, 0),
    'available_themes', COALESCE(v_available_themes, 4)
  );
  
  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_customization_metrics TO authenticated;