-- Create table for regional report parameters
CREATE TABLE IF NOT EXISTS public.parametres_regionaux_rapports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  pays TEXT NOT NULL DEFAULT 'Congo-Brazzaville',
  code_pays TEXT NOT NULL DEFAULT 'CG',
  systeme_comptable TEXT NOT NULL DEFAULT 'OHADA',
  devise_principale TEXT NOT NULL DEFAULT 'XAF',
  format_nombre TEXT NOT NULL DEFAULT 'space',
  format_date TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  champ_identification_1 TEXT NOT NULL DEFAULT 'RCCM',
  champ_identification_2 TEXT NOT NULL DEFAULT 'NIF',
  mention_legale_footer TEXT NOT NULL DEFAULT 'Conforme au Système Comptable OHADA',
  mention_signature TEXT NOT NULL DEFAULT 'Le Directeur / Le Comptable',
  seuil_ratio_liquidite NUMERIC NOT NULL DEFAULT 1.2,
  seuil_ratio_endettement NUMERIC NOT NULL DEFAULT 60,
  seuil_ratio_autonomie NUMERIC NOT NULL DEFAULT 30,
  seuil_marge_exploitation NUMERIC NOT NULL DEFAULT 10,
  seuil_marge_nette NUMERIC NOT NULL DEFAULT 5,
  seuil_rentabilite_capitaux NUMERIC NOT NULL DEFAULT 15,
  export_pdf_enabled BOOLEAN NOT NULL DEFAULT true,
  export_excel_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_tenant_regional_params UNIQUE (tenant_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_parametres_regionaux_tenant 
ON public.parametres_regionaux_rapports (tenant_id);

-- Enable RLS
ALTER TABLE public.parametres_regionaux_rapports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view regional params from their tenant" 
ON public.parametres_regionaux_rapports 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert regional params in their tenant" 
ON public.parametres_regionaux_rapports 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update regional params from their tenant" 
ON public.parametres_regionaux_rapports 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete regional params from their tenant" 
ON public.parametres_regionaux_rapports 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Create trigger for updated_at
CREATE TRIGGER update_parametres_regionaux_rapports_updated_at
BEFORE UPDATE ON public.parametres_regionaux_rapports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize regional parameters for a tenant with country template
CREATE OR REPLACE FUNCTION public.init_regional_params_for_tenant(
  p_tenant_id UUID,
  p_country_code TEXT DEFAULT 'CG'
)
RETURNS UUID AS $$
DECLARE
  v_params_id UUID;
  v_pays TEXT;
  v_code_pays TEXT;
  v_systeme_comptable TEXT;
  v_devise TEXT;
  v_format_nombre TEXT;
  v_format_date TEXT;
  v_champ_id_1 TEXT;
  v_champ_id_2 TEXT;
  v_mention_legale TEXT;
  v_mention_signature TEXT;
BEGIN
  -- Define country templates
  CASE p_country_code
    WHEN 'CG' THEN -- Congo-Brazzaville
      v_pays := 'Congo-Brazzaville';
      v_code_pays := 'CG';
      v_systeme_comptable := 'OHADA';
      v_devise := 'XAF';
      v_format_nombre := 'space';
      v_format_date := 'DD/MM/YYYY';
      v_champ_id_1 := 'RCCM';
      v_champ_id_2 := 'NIF';
      v_mention_legale := 'Conforme au Système Comptable OHADA - République du Congo';
      v_mention_signature := 'Le Directeur / Le Comptable';
    
    WHEN 'CM' THEN -- Cameroon
      v_pays := 'Cameroun';
      v_code_pays := 'CM';
      v_systeme_comptable := 'OHADA';
      v_devise := 'XAF';
      v_format_nombre := 'space';
      v_format_date := 'DD/MM/YYYY';
      v_champ_id_1 := 'RC';
      v_champ_id_2 := 'NIU';
      v_mention_legale := 'Conforme au Système Comptable OHADA - République du Cameroun';
      v_mention_signature := 'Le Directeur Général / Le Chef Comptable';
    
    WHEN 'SN' THEN -- Senegal
      v_pays := 'Sénégal';
      v_code_pays := 'SN';
      v_systeme_comptable := 'OHADA';
      v_devise := 'XOF';
      v_format_nombre := 'space';
      v_format_date := 'DD/MM/YYYY';
      v_champ_id_1 := 'NINEA';
      v_champ_id_2 := 'RC';
      v_mention_legale := 'Conforme au Système Comptable OHADA - République du Sénégal';
      v_mention_signature := 'Le Directeur / Le Comptable';
    
    WHEN 'CI' THEN -- Ivory Coast
      v_pays := 'Côte d''Ivoire';
      v_code_pays := 'CI';
      v_systeme_comptable := 'OHADA';
      v_devise := 'XOF';
      v_format_nombre := 'space';
      v_format_date := 'DD/MM/YYYY';
      v_champ_id_1 := 'CC';
      v_champ_id_2 := 'NIF';
      v_mention_legale := 'Conforme au Système Comptable OHADA - République de Côte d''Ivoire';
      v_mention_signature := 'Le Directeur Général / Le Comptable';
    
    WHEN 'FR' THEN -- France
      v_pays := 'France';
      v_code_pays := 'FR';
      v_systeme_comptable := 'PCG';
      v_devise := 'EUR';
      v_format_nombre := 'space';
      v_format_date := 'DD/MM/YYYY';
      v_champ_id_1 := 'SIRET';
      v_champ_id_2 := 'TVA';
      v_mention_legale := 'Conforme au Plan Comptable Général Français';
      v_mention_signature := 'Le Gérant / L''Expert-Comptable';
    
    WHEN 'BE' THEN -- Belgium
      v_pays := 'Belgique';
      v_code_pays := 'BE';
      v_systeme_comptable := 'PCN';
      v_devise := 'EUR';
      v_format_nombre := 'space';
      v_format_date := 'DD/MM/YYYY';
      v_champ_id_1 := 'BCE';
      v_champ_id_2 := 'TVA';
      v_mention_legale := 'Conforme au Plan Comptable Normalisé Belge';
      v_mention_signature := 'L''Administrateur / Le Comptable';
    
    ELSE -- Default to Congo-Brazzaville
      v_pays := 'Congo-Brazzaville';
      v_code_pays := 'CG';
      v_systeme_comptable := 'OHADA';
      v_devise := 'XAF';
      v_format_nombre := 'space';
      v_format_date := 'DD/MM/YYYY';
      v_champ_id_1 := 'RCCM';
      v_champ_id_2 := 'NIF';
      v_mention_legale := 'Conforme au Système Comptable OHADA - République du Congo';
      v_mention_signature := 'Le Directeur / Le Comptable';
  END CASE;

  -- Insert or update regional params
  INSERT INTO public.parametres_regionaux_rapports (
    tenant_id,
    pays,
    code_pays,
    systeme_comptable,
    devise_principale,
    format_nombre,
    format_date,
    champ_identification_1,
    champ_identification_2,
    mention_legale_footer,
    mention_signature
  ) VALUES (
    p_tenant_id,
    v_pays,
    v_code_pays,
    v_systeme_comptable,
    v_devise,
    v_format_nombre,
    v_format_date,
    v_champ_id_1,
    v_champ_id_2,
    v_mention_legale,
    v_mention_signature
  )
  ON CONFLICT (tenant_id) DO UPDATE SET
    pays = EXCLUDED.pays,
    code_pays = EXCLUDED.code_pays,
    systeme_comptable = EXCLUDED.systeme_comptable,
    devise_principale = EXCLUDED.devise_principale,
    format_nombre = EXCLUDED.format_nombre,
    format_date = EXCLUDED.format_date,
    champ_identification_1 = EXCLUDED.champ_identification_1,
    champ_identification_2 = EXCLUDED.champ_identification_2,
    mention_legale_footer = EXCLUDED.mention_legale_footer,
    mention_signature = EXCLUDED.mention_signature,
    updated_at = now()
  RETURNING id INTO v_params_id;

  RETURN v_params_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;