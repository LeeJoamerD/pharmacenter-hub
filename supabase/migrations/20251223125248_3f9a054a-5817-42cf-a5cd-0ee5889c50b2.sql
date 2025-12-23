-- Initialiser les paramètres bancaires pour les tenants existants qui n'en ont pas
INSERT INTO parametres_bancaires (
  tenant_id,
  synchronisation_auto,
  frequence_sync,
  rapprochement_auto,
  tolerance_rapprochement_jours,
  tolerance_rapprochement_montant_xaf,
  alertes_actives,
  seuil_alerte_bas_xaf,
  seuil_alerte_critique_xaf,
  format_import_defaut,
  devise_principale,
  code_pays
)
SELECT 
  p.id,
  true,
  'Quotidien',
  false,
  3,
  100,
  true,
  500000,
  100000,
  'CSV_BEAC',
  'XAF',
  'CG'
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM parametres_bancaires pb WHERE pb.tenant_id = p.id
);

-- Créer ou remplacer la fonction de trigger pour nouveaux tenants
CREATE OR REPLACE FUNCTION init_banking_parameters_for_new_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insérer les paramètres bancaires par défaut
  INSERT INTO parametres_bancaires (
    tenant_id,
    synchronisation_auto,
    frequence_sync,
    rapprochement_auto,
    tolerance_rapprochement_jours,
    tolerance_rapprochement_montant_xaf,
    alertes_actives,
    seuil_alerte_bas_xaf,
    seuil_alerte_critique_xaf,
    format_import_defaut,
    devise_principale,
    code_pays
  ) VALUES (
    NEW.id,
    true,
    'Quotidien',
    false,
    3,
    100,
    true,
    500000,
    100000,
    'CSV_BEAC',
    'XAF',
    'CG'
  ) ON CONFLICT (tenant_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_init_banking_params ON pharmacies;

-- Créer le trigger
CREATE TRIGGER trigger_init_banking_params
  AFTER INSERT ON pharmacies
  FOR EACH ROW
  EXECUTE FUNCTION init_banking_parameters_for_new_tenant();