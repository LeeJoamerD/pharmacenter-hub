-- ============================================================================
-- RESTAURATION COMPLÈTE DU MODULE DOCUMENTS
-- Basé sur: 20250805084918, 20250916001548
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Restauration de la structure complète de documents
-- ============================================================================

-- Ajouter les colonnes manquantes à documents
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS original_filename TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS author_id UUID,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.ai_templates(id),
ADD COLUMN IF NOT EXISTS email_subject TEXT,
ADD COLUMN IF NOT EXISTS email_from TEXT,
ADD COLUMN IF NOT EXISTS email_to TEXT;

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_documents_author_id ON public.documents(author_id);
CREATE INDEX IF NOT EXISTS idx_documents_template_id ON public.documents(template_id);
CREATE INDEX IF NOT EXISTS idx_documents_ai_generated ON public.documents(ai_generated);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_category ON public.documents(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_status ON public.documents(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_type ON public.documents(tenant_id, document_type);

-- ============================================================================
-- ÉTAPE 2: Restauration de la structure complète de document_categories
-- ============================================================================

-- Ajouter les colonnes manquantes à document_categories
ALTER TABLE public.document_categories
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- ÉTAPE 3: Correction des RLS policies pour document_categories
-- ============================================================================

-- Supprimer la policy ALL actuelle
DROP POLICY IF EXISTS "tenant_access_document_categories" ON public.document_categories;

-- Créer des policies granulaires
CREATE POLICY "Users can view document categories from their tenant" 
ON public.document_categories 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert document categories in their tenant" 
ON public.document_categories 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update document categories from their tenant" 
ON public.document_categories 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete document categories from their tenant" 
ON public.document_categories 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id() AND is_system = FALSE);

-- ============================================================================
-- ÉTAPE 4: Correction des RLS policies pour documents
-- ============================================================================

-- Supprimer la policy ALL actuelle
DROP POLICY IF EXISTS "tenant_access_documents" ON public.documents;

-- Créer des policies granulaires
CREATE POLICY "Users can view documents from their tenant" 
ON public.documents 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert documents in their tenant" 
ON public.documents 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update documents from their tenant" 
ON public.documents 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete documents from their tenant" 
ON public.documents 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- ÉTAPE 5: Correction des RLS policies pour ai_templates
-- ============================================================================

-- Supprimer la policy ALL actuelle
DROP POLICY IF EXISTS "tenant_access_ai_templates" ON public.ai_templates;

-- Créer des policies granulaires
CREATE POLICY "Users can view templates from their tenant" 
ON public.ai_templates 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id() OR is_system = TRUE);

CREATE POLICY "Users can create templates in their tenant" 
ON public.ai_templates 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update templates in their tenant" 
ON public.ai_templates 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id() AND is_system = FALSE);

CREATE POLICY "Users can delete templates in their tenant" 
ON public.ai_templates 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id() AND is_system = FALSE);

-- ============================================================================
-- ÉTAPE 6: Correction des RLS policies pour emails
-- ============================================================================

-- Supprimer la policy ALL actuelle
DROP POLICY IF EXISTS "tenant_access_emails" ON public.emails;

-- Créer des policies granulaires
CREATE POLICY "Users can view emails from their tenant" 
ON public.emails 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can create emails in their tenant" 
ON public.emails 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update emails in their tenant" 
ON public.emails 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- ÉTAPE 7: Insertion des catégories système par défaut
-- ============================================================================

-- Créer une fonction temporaire pour insérer les catégories pour tous les tenants
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Insérer pour chaque tenant existant (utiliser personnel comme source)
  FOR v_tenant_id IN SELECT DISTINCT tenant_id FROM public.personnel WHERE tenant_id IS NOT NULL
  LOOP
    INSERT INTO public.document_categories (tenant_id, name, description, color, is_system) VALUES
    (v_tenant_id, 'Manuel', 'Manuels d''utilisation et guides', '#10b981', TRUE),
    (v_tenant_id, 'Procédure', 'Procédures internes et processus', '#3b82f6', TRUE),
    (v_tenant_id, 'Rapport', 'Rapports et analyses', '#f59e0b', TRUE),
    (v_tenant_id, 'Certification', 'Certificats et accréditations', '#8b5cf6', TRUE),
    (v_tenant_id, 'Formation', 'Documents de formation', '#ef4444', TRUE),
    (v_tenant_id, 'Réglementaire', 'Documents réglementaires', '#06b6d4', TRUE),
    (v_tenant_id, 'Courrier Officiel', 'Correspondances officielles', '#3B82F6', TRUE),
    (v_tenant_id, 'Correspondance Patient', 'Communications patients', '#10B981', TRUE),
    (v_tenant_id, 'Commercial', 'Documents commerciaux', '#8B5CF6', TRUE),
    (v_tenant_id, 'Qualité', 'Documentation qualité', '#EF4444', TRUE)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ============================================================================
-- ÉTAPE 8: Insertion des templates IA système
-- ============================================================================

-- Créer une fonction temporaire pour insérer les templates pour tous les tenants
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  FOR v_tenant_id IN SELECT DISTINCT tenant_id FROM public.personnel WHERE tenant_id IS NOT NULL
  LOOP
    -- Templates pour correspondance patient
    INSERT INTO public.ai_templates (tenant_id, name, type, category, prompt_template, variables, is_system, is_active) VALUES
    (v_tenant_id, 'Lettre de rappel patient', 'patient_communication', 'Correspondance Patient',
     'Rédigez une lettre courtoise de rappel pour un patient concernant son traitement. Incluez: le nom du patient, le médicament concerné, la date de prescription, et les coordonnées de la pharmacie. Ton professionnel et bienveillant.',
     '["patient_name", "medication", "prescription_date", "pharmacy_name", "pharmacy_contact"]'::jsonb,
     TRUE, TRUE),
    
    (v_tenant_id, 'Ordonnance non disponible', 'patient_communication', 'Correspondance Patient',
     'Rédigez une lettre pour informer un patient que son ordonnance n''est pas disponible et proposer des alternatives. Incluez: nom du patient, médicament demandé, alternatives possibles, et délai de disponibilité.',
     '["patient_name", "requested_medication", "alternatives", "availability_date", "pharmacy_contact"]'::jsonb,
     TRUE, TRUE),

    -- Templates pour courrier officiel
    (v_tenant_id, 'Réponse autorité sanitaire', 'official_correspondence', 'Courrier Officiel',
     'Rédigez une réponse officielle à une demande d''autorité sanitaire. Ton formel et professionnel. Incluez: référence du courrier, sujet, réponse détaillée, et coordonnées.',
     '["reference_number", "subject", "authority_name", "response_content", "pharmacy_info"]'::jsonb,
     TRUE, TRUE),

    (v_tenant_id, 'Demande administrative', 'official_correspondence', 'Courrier Officiel',
     'Rédigez une demande administrative formelle. Incluez: objet de la demande, justification, documents joints, et coordonnées complètes.',
     '["request_subject", "justification", "attached_documents", "pharmacy_info"]'::jsonb,
     TRUE, TRUE),

    -- Templates commerciaux
    (v_tenant_id, 'Lettre fournisseur', 'supplier_communication', 'Commercial',
     'Rédigez une lettre professionnelle à un fournisseur. Incluez: référence de commande, produits concernés, délais souhaités, et conditions.',
     '["supplier_name", "order_reference", "products", "desired_date", "conditions"]'::jsonb,
     TRUE, TRUE),

    (v_tenant_id, 'Proposition commerciale', 'commercial_proposal', 'Commercial',
     'Rédigez une proposition commerciale pour un client professionnel. Incluez: produits/services proposés, tarifs, conditions, et avantages.',
     '["client_name", "products_services", "pricing", "conditions", "benefits"]'::jsonb,
     TRUE, TRUE),

    -- Templates qualité
    (v_tenant_id, 'Rapport d''incident', 'incident_report', 'Qualité',
     'Rédigez un rapport d''incident qualité. Structure: description de l''incident, analyse des causes, actions correctives, et prévention.',
     '["incident_date", "description", "root_cause", "corrective_actions", "prevention_measures"]'::jsonb,
     TRUE, TRUE),

    (v_tenant_id, 'Procédure opérationnelle', 'procedure', 'Procédure',
     'Rédigez une procédure opérationnelle standardisée. Incluez: objectif, domaine d''application, responsabilités, étapes détaillées, et documents de référence.',
     '["procedure_name", "objective", "scope", "responsibilities", "steps", "references"]'::jsonb,
     TRUE, TRUE)
    
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;