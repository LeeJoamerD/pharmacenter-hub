-- Créer la table reglementations
CREATE TABLE public.reglementations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nom_reglementation TEXT NOT NULL,
  type_reglementation TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'Actif',
  description TEXT,
  date_application DATE NOT NULL,
  date_expiration DATE,
  autorite_competente TEXT NOT NULL,
  reference_legale TEXT NOT NULL,
  niveau_restriction TEXT NOT NULL,
  produits_concernes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.reglementations ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Users can view regulations from their tenant"
ON public.reglementations FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert regulations in their tenant"
ON public.reglementations FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update regulations from their tenant"
ON public.reglementations FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete regulations from their tenant"
ON public.reglementations FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Créer trigger pour updated_at
CREATE TRIGGER update_reglementations_updated_at
  BEFORE UPDATE ON public.reglementations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Créer des index pour la performance
CREATE INDEX idx_reglementations_tenant_id ON public.reglementations(tenant_id);
CREATE INDEX idx_reglementations_type ON public.reglementations(type_reglementation);
CREATE INDEX idx_reglementations_statut ON public.reglementations(statut);

-- Insérer quelques données d'exemple
INSERT INTO public.reglementations (
  tenant_id, nom_reglementation, type_reglementation, statut,
  description, date_application, autorite_competente, reference_legale,
  niveau_restriction, produits_concernes
) VALUES
  (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'Liste I - Substances vénéneuses',
    'Classification pharmaceutique',
    'Actif',
    'Médicaments délivrés uniquement sur prescription médicale',
    '2020-01-01',
    'Ministère de la Santé',
    'Arrêté n°2020-001',
    'Élevé',
    245
  ),
  (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'Stupéfiants',
    'Substances contrôlées',
    'Actif',
    'Médicaments soumis à réglementation spéciale',
    '2019-06-15',
    'ANSM',
    'Code de la santé publique',
    'Très élevé',
    67
  );