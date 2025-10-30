-- Création module Documents - Version simplifiée

-- Tables
CREATE TABLE IF NOT EXISTS public.document_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  file_path TEXT,
  file_url TEXT,
  author_id UUID,
  document_type VARCHAR(50) DEFAULT 'document',
  recipient TEXT,
  sender TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  priority VARCHAR(20) DEFAULT 'normal',
  due_date DATE,
  ai_generated BOOLEAN DEFAULT FALSE,
  template_id UUID,
  email_subject TEXT,
  email_from VARCHAR(255),
  email_to VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  prompt_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  subject TEXT,
  from_email VARCHAR(255),
  to_email VARCHAR(255),
  content TEXT,
  summary TEXT,
  suggested_response TEXT,
  classification VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'normal',
  processed BOOLEAN DEFAULT FALSE,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  provider VARCHAR(50) DEFAULT 'gemini',
  model VARCHAR(100) DEFAULT 'gemini-2.0-flash-001',
  max_tokens INTEGER DEFAULT 2000,
  temperature DECIMAL(2,1) DEFAULT 0.7,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_configurations ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view document categories from their tenant or system" ON document_categories;
  DROP POLICY IF EXISTS "Users can insert document categories in their tenant" ON document_categories;
  DROP POLICY IF EXISTS "Users can update document categories from their tenant" ON document_categories;
  DROP POLICY IF EXISTS "Users can delete document categories from their tenant" ON document_categories;
  DROP POLICY IF EXISTS "Users can view documents from their tenant" ON documents;
  DROP POLICY IF EXISTS "Users can insert documents in their tenant" ON documents;
  DROP POLICY IF EXISTS "Users can update documents from their tenant" ON documents;
  DROP POLICY IF EXISTS "Users can delete documents from their tenant" ON documents;
  DROP POLICY IF EXISTS "Users can view templates from their tenant or system" ON ai_templates;
  DROP POLICY IF EXISTS "Users can view templates from their tenant" ON ai_templates;
  DROP POLICY IF EXISTS "Users can create templates in their tenant" ON ai_templates;
  DROP POLICY IF EXISTS "Users can update templates in their tenant" ON ai_templates;
  DROP POLICY IF EXISTS "Users can delete templates in their tenant" ON ai_templates;
  DROP POLICY IF EXISTS "Users can view emails from their tenant" ON emails;
  DROP POLICY IF EXISTS "Users can create emails in their tenant" ON emails;
  DROP POLICY IF EXISTS "Users can update emails in their tenant" ON emails;
  DROP POLICY IF EXISTS "Users can view AI config from their tenant" ON ai_configurations;
  DROP POLICY IF EXISTS "Users can manage AI config in their tenant" ON ai_configurations;
END $$;

-- New policies
CREATE POLICY "Users can view document categories from their tenant or system" 
ON document_categories FOR SELECT 
USING (tenant_id IS NULL OR tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert document categories in their tenant" 
ON document_categories FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update document categories from their tenant" 
ON document_categories FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id() AND is_system = false);

CREATE POLICY "Users can delete document categories from their tenant" 
ON document_categories FOR DELETE 
USING (tenant_id = get_current_user_tenant_id() AND is_system = false);

CREATE POLICY "Users can view documents from their tenant" 
ON documents FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert documents in their tenant" 
ON documents FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update documents from their tenant" 
ON documents FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete documents from their tenant" 
ON documents FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view templates from their tenant or system" 
ON ai_templates FOR SELECT 
USING (tenant_id IS NULL OR tenant_id = get_current_user_tenant_id() OR is_system = TRUE);

CREATE POLICY "Users can create templates in their tenant" 
ON ai_templates FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update templates in their tenant" 
ON ai_templates FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id() AND is_system = FALSE);

CREATE POLICY "Users can delete templates in their tenant" 
ON ai_templates FOR DELETE 
USING (tenant_id = get_current_user_tenant_id() AND is_system = FALSE);

CREATE POLICY "Users can view emails from their tenant" 
ON emails FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can create emails in their tenant" 
ON emails FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update emails in their tenant" 
ON emails FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view AI config from their tenant" 
ON ai_configurations FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage AI config in their tenant" 
ON ai_configurations FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

-- Triggers
DROP TRIGGER IF EXISTS update_document_categories_updated_at ON document_categories;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_ai_templates_updated_at ON ai_templates;
DROP TRIGGER IF EXISTS update_emails_updated_at ON emails;
DROP TRIGGER IF EXISTS update_ai_configurations_updated_at ON ai_configurations;

CREATE TRIGGER update_document_categories_updated_at BEFORE UPDATE ON document_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_templates_updated_at BEFORE UPDATE ON ai_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_configurations_updated_at BEFORE UPDATE ON ai_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_document_categories_tenant_id ON document_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_author_id ON documents(author_id);
CREATE INDEX IF NOT EXISTS idx_ai_templates_tenant_type ON ai_templates(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_emails_tenant_classification ON emails(tenant_id, classification);
CREATE INDEX IF NOT EXISTS idx_emails_document_id ON emails(document_id);

-- Data (only if not exists)
INSERT INTO document_categories (tenant_id, name, description, color, is_system) 
SELECT NULL, name, description, color, true FROM (VALUES 
  ('Manuel', 'Manuels d''utilisation', '#10b981'),
  ('Procédure', 'Procédures internes', '#3b82f6'),
  ('Rapport', 'Rapports', '#f59e0b'),
  ('Réglementaire', 'Documents réglementaires', '#06b6d4')
) AS v(name, description, color)
WHERE NOT EXISTS (SELECT 1 FROM document_categories WHERE document_categories.name = v.name);