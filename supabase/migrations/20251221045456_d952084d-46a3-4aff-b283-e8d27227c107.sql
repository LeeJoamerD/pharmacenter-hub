-- Migration: Ajouter colonnes pour Centime Additionnel dans lignes_ventes et ventes
-- Permet la traçabilité fiscale multi-localité (TVA + Centime Additionnel)

-- 1. Ajouter colonnes à lignes_ventes pour stocker les détails fiscaux par ligne
ALTER TABLE public.lignes_ventes 
ADD COLUMN IF NOT EXISTS taux_centime_additionnel NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS montant_tva_ligne NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS montant_centime_ligne NUMERIC(15,2) DEFAULT 0;

-- 2. Ajouter colonne montant_centime_additionnel à la table ventes
ALTER TABLE public.ventes 
ADD COLUMN IF NOT EXISTS montant_centime_additionnel NUMERIC(15,2) DEFAULT 0;

-- 3. Commentaires pour documentation
COMMENT ON COLUMN public.lignes_ventes.taux_centime_additionnel IS 'Taux de centime additionnel en % (ex: 1 pour 1%)';
COMMENT ON COLUMN public.lignes_ventes.montant_tva_ligne IS 'Montant TVA calculé pour cette ligne';
COMMENT ON COLUMN public.lignes_ventes.montant_centime_ligne IS 'Montant Centime Additionnel calculé pour cette ligne (uniquement si taux_tva > 0)';
COMMENT ON COLUMN public.ventes.montant_centime_additionnel IS 'Total Centime Additionnel pour la vente (somme des lignes avec TVA)';