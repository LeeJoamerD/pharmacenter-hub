-- Phase 1: Extension de la table documents (final)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'document',
ADD COLUMN IF NOT EXISTS recipient TEXT,
ADD COLUMN IF NOT EXISTS sender TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS template_id UUID,
ADD COLUMN IF NOT EXISTS email_subject TEXT,
ADD COLUMN IF NOT EXISTS email_from VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_to VARCHAR(255);

-- Création de la table ai_templates
CREATE TABLE IF NOT EXISTS ai_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  prompt_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ai_templates
ALTER TABLE ai_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_templates
CREATE POLICY "Users can view templates from their tenant" 
ON ai_templates FOR SELECT 
USING (
  tenant_id IN (
    SELECT tenant_id FROM personnel WHERE auth_user_id = auth.uid()
  ) OR is_system = TRUE
);

CREATE POLICY "Users can create templates in their tenant" 
ON ai_templates FOR INSERT 
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM personnel WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update templates in their tenant" 
ON ai_templates FOR UPDATE 
USING (
  tenant_id IN (
    SELECT tenant_id FROM personnel WHERE auth_user_id = auth.uid()
  ) AND is_system = FALSE
);

CREATE POLICY "Users can delete templates in their tenant" 
ON ai_templates FOR DELETE 
USING (
  tenant_id IN (
    SELECT tenant_id FROM personnel WHERE auth_user_id = auth.uid()
  ) AND is_system = FALSE
);

-- Création de la table emails
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on emails
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- RLS policies for emails
CREATE POLICY "Users can view emails from their tenant" 
ON emails FOR SELECT 
USING (
  tenant_id IN (
    SELECT tenant_id FROM personnel WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create emails in their tenant" 
ON emails FOR INSERT 
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM personnel WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update emails in their tenant" 
ON emails FOR UPDATE 
USING (
  tenant_id IN (
    SELECT tenant_id FROM personnel WHERE auth_user_id = auth.uid()
  )
);

-- Création de la table ai_configurations pour Gemini
CREATE TABLE IF NOT EXISTS ai_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  provider VARCHAR(50) DEFAULT 'gemini',
  model VARCHAR(100) DEFAULT 'gemini-2.0-flash-001',
  max_tokens INTEGER DEFAULT 2000,
  temperature DECIMAL(2,1) DEFAULT 0.7,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ai_configurations
ALTER TABLE ai_configurations ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_configurations
CREATE POLICY "Users can view AI config from their tenant" 
ON ai_configurations FOR SELECT 
USING (
  tenant_id IN (
    SELECT tenant_id FROM personnel WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage AI config in their tenant" 
ON ai_configurations FOR ALL 
USING (
  tenant_id IN (
    SELECT tenant_id FROM personnel WHERE auth_user_id = auth.uid()
  )
);

-- Insertion des nouvelles catégories de documents (structure correcte)
INSERT INTO document_categories (tenant_id, name, description, color, is_system) 
SELECT 
  NULL as tenant_id, 
  name,
  description,
  color,
  TRUE as is_system
FROM (VALUES 
  ('Courrier Officiel', 'Correspondances officielles avec autorités', '#3B82F6'),
  ('Correspondance Patient', 'Communications avec les patients', '#10B981'),
  ('Réglementaire', 'Documents réglementaires et conformité', '#F59E0B'),
  ('Commercial', 'Documents commerciaux et partenariats', '#8B5CF6'),
  ('Qualité', 'Documentation qualité et procédures', '#EF4444'),
  ('Formation', 'Documents de formation et éducation', '#06B6D4')
) AS new_categories(name, description, color)
ON CONFLICT (name) DO NOTHING;

-- Insertion des templates système pour pharmacie avec Gemini
INSERT INTO ai_templates (tenant_id, name, type, category, prompt_template, variables, is_system, is_active)
SELECT 
  NULL as tenant_id,
  name,
  type,
  category,
  prompt_template,
  variables::jsonb,
  TRUE as is_system,
  TRUE as is_active
FROM (VALUES 
  (
    'Lettre de rappel patient',
    'patient_communication',
    'Correspondance Patient',
    'Rédigez une lettre courtoise de rappel pour un patient qui n''a pas retiré son médicament. Utilisez un ton professionnel mais bienveillant.\n\nInformations:\n- Nom du patient: {patient_name}\n- Médicament: {medication}\n- Date de prescription: {prescription_date}\n- Pharmacie: {pharmacy_name}\n- Contact pharmacie: {pharmacy_contact}\n\nStructure:\n1. En-tête avec informations pharmacie\n2. Salutation personnalisée\n3. Rappel bienveillant\n4. Information sur le médicament\n5. Invitation à contacter\n6. Formule de politesse\n\nFormat: Lettre professionnelle française avec formules de courtoisie appropriées.',
    '["patient_name", "medication", "prescription_date", "pharmacy_name", "pharmacy_contact"]'
  ),
  (
    'Correspondance médecin',
    'professional_communication', 
    'Courrier Officiel',
    'Rédigez une lettre professionnelle à un médecin concernant un patient. Respectez le protocole médical et la confidentialité.\n\nInformations:\n- Dr. {doctor_name}\n- Patient: {patient_name}\n- Sujet: {subject}\n- Détails: {details}\n- Pharmacien: {pharmacist_name}\n- Pharmacie: {pharmacy_name}\n\nFormat: Correspondance médicale officielle avec respect des protocoles et confidentialité RGPD.',
    '["doctor_name", "patient_name", "subject", "details", "pharmacist_name", "pharmacy_name"]'
  ),
  (
    'Rapport incident ANSM',
    'regulatory',
    'Réglementaire', 
    'Rédigez un rapport d''incident conforme aux exigences ANSM. Soyez précis, factuel et exhaustif.\n\nDétails de l''incident:\n- Type: {incident_type}\n- Date: {incident_date}\n- Produit concerné: {product_name}\n- Lot: {batch_number}\n- Description: {description}\n- Actions prises: {actions_taken}\n- Pharmacien responsable: {pharmacist_name}\n\nFormat: Rapport réglementaire strict conforme aux standards ANSM français.',
    '["incident_type", "incident_date", "product_name", "batch_number", "description", "actions_taken", "pharmacist_name"]'
  ),
  (
    'Procédure interne',
    'procedure',
    'Qualité',
    'Rédigez une procédure interne claire et détaillée pour l''officine selon les standards qualité pharmaceutiques.\n\nÉléments:\n- Titre: {procedure_title}\n- Objectif: {objective}\n- Domaine: {scope}\n- Étapes: {steps}\n- Responsables: {responsible_staff}\n- Références: {references}\n\nFormat: Procédure ISO avec numérotation, points de contrôle et traçabilité.',
    '["procedure_title", "objective", "scope", "steps", "responsible_staff", "references"]'
  ),
  (
    'Courrier fournisseur',
    'commercial',
    'Commercial',
    'Rédigez une correspondance commerciale professionnelle avec un fournisseur pharmaceutique.\n\nInformations:\n- Type: {letter_type}\n- Fournisseur: {supplier_name}\n- Sujet: {subject}\n- Contexte: {context}\n- Demande: {request}\n- Pharmacie: {pharmacy_name}\n- Contact: {contact_person}\n\nFormat: Lettre commerciale française avec ton professionnel et courtois.',
    '["letter_type", "supplier_name", "subject", "context", "request", "pharmacy_name", "contact_person"]'
  ),
  (
    'Communication rappel de lot',
    'safety_communication',
    'Réglementaire',
    'Rédigez une communication officielle pour informer du rappel de lots selon obligations réglementaires françaises.\n\nDétails:\n- Produit: {product_name}\n- Lot(s): {batch_numbers}\n- Motif: {recall_reason}\n- Niveau: {recall_level}\n- Actions patients: {patient_actions}\n- Contact: {pharmacy_contact}\n- Échéance: {deadline}\n\nFormat: Communication réglementaire claire, rassurante mais ferme conforme aux standards ANSM.',
    '["product_name", "batch_numbers", "recall_reason", "recall_level", "patient_actions", "pharmacy_contact", "deadline"]'
  )
) AS templates(name, type, category, prompt_template, variables)
ON CONFLICT DO NOTHING;

-- Index pour optimisation des performances
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_due_date ON documents(due_date);
CREATE INDEX IF NOT EXISTS idx_ai_templates_tenant_type ON ai_templates(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_emails_tenant_classification ON emails(tenant_id, classification);
CREATE INDEX IF NOT EXISTS idx_emails_processed ON emails(processed);