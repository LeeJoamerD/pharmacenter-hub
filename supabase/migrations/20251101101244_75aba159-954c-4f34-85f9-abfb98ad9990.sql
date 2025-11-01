-- Renommer la colonne montant_total_ligne en montant_ligne_ttc pour correspondre au frontend
-- Cette colonne est nécessaire pour l'analyse ABC et d'autres modules de ventes

ALTER TABLE public.lignes_ventes 
RENAME COLUMN montant_total_ligne TO montant_ligne_ttc;

-- Créer un index pour optimiser les requêtes d'analyse ABC
CREATE INDEX IF NOT EXISTS idx_lignes_ventes_analysis 
ON public.lignes_ventes(tenant_id, produit_id, vente_id);