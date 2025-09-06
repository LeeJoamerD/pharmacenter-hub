-- Ajouter un paramètre pour la politique de création de lots par réception
INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, categorie, description) 
SELECT 
  id as tenant_id,
  'stock_one_lot_per_reception' as cle_parametre,
  'false' as valeur_parametre,
  'stock' as categorie,
  'Créer un lot distinct pour chaque réception même avec le même numéro de lot fabricant' as description
FROM public.pharmacies
ON CONFLICT (tenant_id, cle_parametre) DO NOTHING;

-- Ajouter des colonnes pour améliorer le suivi des réceptions
ALTER TABLE public.receptions_fournisseurs 
ADD COLUMN IF NOT EXISTS numero_reception text,
ADD COLUMN IF NOT EXISTS statut text DEFAULT 'En cours',
ADD COLUMN IF NOT EXISTS notes text;

-- Créer un trigger pour auto-générer le numéro de réception
CREATE OR REPLACE FUNCTION generate_reception_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_reception IS NULL THEN
    NEW.numero_reception := 'REC-' || EXTRACT(YEAR FROM NEW.created_at) || '-' || 
                           LPAD((SELECT COUNT(*) + 1 FROM public.receptions_fournisseurs WHERE tenant_id = NEW.tenant_id)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_reception_number ON public.receptions_fournisseurs;
CREATE TRIGGER trigger_generate_reception_number
  BEFORE INSERT ON public.receptions_fournisseurs
  FOR EACH ROW
  EXECUTE FUNCTION generate_reception_number();

-- Ajouter un champ prix_achat_reel aux lignes de réception si pas déjà présent
ALTER TABLE public.lignes_reception_fournisseur 
ADD COLUMN IF NOT EXISTS prix_achat_reel numeric(10,2) DEFAULT 0.00;

-- Index pour améliorer les performances des requêtes d'historique
CREATE INDEX IF NOT EXISTS idx_receptions_date_tenant ON public.receptions_fournisseurs(tenant_id, date_reception DESC);
CREATE INDEX IF NOT EXISTS idx_lignes_reception_reception ON public.lignes_reception_fournisseur(reception_id);