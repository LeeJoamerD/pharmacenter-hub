-- Create ai_conversations table for network AI chat
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  ai_model_id UUID NULL,
  context TEXT DEFAULT 'general',
  participants JSONB DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_conversation_messages table
CREATE TABLE IF NOT EXISTS public.ai_conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sender_pharmacy_id UUID NULL REFERENCES public.pharmacies(id) ON DELETE SET NULL,
  sender_name TEXT,
  confidence NUMERIC(5,4) NULL,
  suggestions JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_models table for configurable AI models
CREATE TABLE IF NOT EXISTS public.ai_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL DEFAULT 'lovable' CHECK (provider IN ('lovable', 'gemini', 'openai')),
  model_identifier TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  capabilities JSONB DEFAULT '[]'::jsonb,
  specialization TEXT DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  max_tokens INTEGER DEFAULT 2048,
  temperature NUMERIC(3,2) DEFAULT 0.7,
  is_default BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  system_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_insights table
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('recommendation', 'alert', 'trend', 'optimization')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT NOT NULL DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high', 'critical')),
  pharmacies_affected JSONB DEFAULT '[]'::jsonb,
  confidence NUMERIC(5,4) DEFAULT 0.8,
  is_read BOOLEAN DEFAULT false,
  is_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMP WITH TIME ZONE NULL,
  applied_by UUID NULL REFERENCES public.pharmacies(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_tenant ON public.ai_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON public.ai_conversations(status);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_participants ON public.ai_conversations USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_messages_conversation ON public.ai_conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_messages_tenant ON public.ai_conversation_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_tenant ON public.ai_models(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_status ON public.ai_models(status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_tenant ON public.ai_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON public.ai_insights(type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_is_read ON public.ai_insights(is_read);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS for ai_conversations (multi-tenant + inter-tenant via participants)
CREATE POLICY "Users can view conversations from their tenant or as participant"
ON public.ai_conversations FOR SELECT
USING (
  tenant_id = get_current_user_tenant_id() 
  OR participants ? get_current_user_tenant_id()::text
);

CREATE POLICY "Users can create conversations in their tenant"
ON public.ai_conversations FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update conversations from their tenant"
ON public.ai_conversations FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete conversations from their tenant"
ON public.ai_conversations FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- RLS for ai_conversation_messages (follows conversation access)
CREATE POLICY "Users can view messages from accessible conversations"
ON public.ai_conversation_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = conversation_id
    AND (c.tenant_id = get_current_user_tenant_id() OR c.participants ? get_current_user_tenant_id()::text)
  )
);

CREATE POLICY "Users can insert messages in accessible conversations"
ON public.ai_conversation_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = conversation_id
    AND (c.tenant_id = get_current_user_tenant_id() OR c.participants ? get_current_user_tenant_id()::text)
  )
);

-- RLS for ai_models (tenant + system models visible to all)
CREATE POLICY "Users can view their tenant models or system models"
ON public.ai_models FOR SELECT
USING (tenant_id = get_current_user_tenant_id() OR is_system = true);

CREATE POLICY "Users can create models in their tenant"
ON public.ai_models FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update models in their tenant"
ON public.ai_models FOR UPDATE
USING (tenant_id = get_current_user_tenant_id() AND is_system = false);

CREATE POLICY "Users can delete models in their tenant"
ON public.ai_models FOR DELETE
USING (tenant_id = get_current_user_tenant_id() AND is_system = false);

-- RLS for ai_insights
CREATE POLICY "Users can view insights from their tenant or affecting them"
ON public.ai_insights FOR SELECT
USING (
  tenant_id = get_current_user_tenant_id() 
  OR pharmacies_affected ? get_current_user_tenant_id()::text
);

CREATE POLICY "Users can insert insights in their tenant"
ON public.ai_insights FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update insights from their tenant"
ON public.ai_insights FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete insights from their tenant"
ON public.ai_insights FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_ai_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW EXECUTE FUNCTION update_ai_tables_updated_at();

CREATE TRIGGER update_ai_models_updated_at
BEFORE UPDATE ON public.ai_models
FOR EACH ROW EXECUTE FUNCTION update_ai_tables_updated_at();

-- Insert default system AI models
INSERT INTO public.ai_models (id, tenant_id, name, description, provider, model_identifier, capabilities, specialization, status, is_system, system_prompt)
SELECT 
  gen_random_uuid(),
  p.id,
  'PharmaSoft Assistant Pro',
  'IA spécialisée dans les questions pharmaceutiques et réglementaires',
  'lovable',
  'google/gemini-2.5-flash',
  '["Consultation médicaments", "Réglementation", "Interactions", "Conseils"]'::jsonb,
  'Pharmacie',
  'active',
  true,
  'Tu es PharmaSoft Assistant Pro, un assistant IA spécialisé dans le domaine pharmaceutique. Tu aides les pharmaciens avec les questions sur les médicaments, la réglementation, les interactions médicamenteuses et les conseils patients. Réponds de manière professionnelle et précise.'
FROM public.pharmacies p
WHERE NOT EXISTS (SELECT 1 FROM public.ai_models WHERE is_system = true AND tenant_id = p.id)
LIMIT 10;

INSERT INTO public.ai_models (id, tenant_id, name, description, provider, model_identifier, capabilities, specialization, status, is_system, system_prompt)
SELECT 
  gen_random_uuid(),
  p.id,
  'Business Intelligence AI',
  'IA d''analyse de performance et optimisation business',
  'lovable',
  'google/gemini-2.5-flash',
  '["Analytics", "Prédictions", "Optimisation", "Reporting"]'::jsonb,
  'Business',
  'active',
  true,
  'Tu es Business Intelligence AI, un assistant spécialisé dans l''analyse de performance et l''optimisation business pour les pharmacies. Tu analyses les données de ventes, stocks, et performances pour proposer des recommandations stratégiques.'
FROM public.pharmacies p
WHERE NOT EXISTS (SELECT 1 FROM public.ai_models WHERE is_system = true AND name = 'Business Intelligence AI' AND tenant_id = p.id)
LIMIT 10;

INSERT INTO public.ai_models (id, tenant_id, name, description, provider, model_identifier, capabilities, specialization, status, is_system, system_prompt)
SELECT 
  gen_random_uuid(),
  p.id,
  'Technical Support Bot',
  'Support technique et résolution de problèmes',
  'lovable',
  'google/gemini-2.5-flash',
  '["Diagnostic", "Dépannage", "Configuration", "Maintenance"]'::jsonb,
  'Technique',
  'active',
  true,
  'Tu es Technical Support Bot, un assistant technique pour PharmaSoft. Tu aides les utilisateurs à résoudre les problèmes techniques, configurer le système et effectuer la maintenance.'
FROM public.pharmacies p
WHERE NOT EXISTS (SELECT 1 FROM public.ai_models WHERE is_system = true AND name = 'Technical Support Bot' AND tenant_id = p.id)
LIMIT 10;