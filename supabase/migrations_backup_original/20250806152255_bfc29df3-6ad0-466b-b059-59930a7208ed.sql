-- Phase 1: Nettoyage de la structure de la table produits

-- 1.1 Supprimer les colonnes dupliquées et obsolètes
ALTER TABLE public.produits DROP COLUMN IF EXISTS famille_produit_id;
ALTER TABLE public.produits DROP COLUMN IF EXISTS rayon_produit_id;
ALTER TABLE public.produits DROP COLUMN IF EXISTS quantite_stock;
ALTER TABLE public.produits DROP COLUMN IF EXISTS prix_vente;

-- 1.2 Ajouter la colonne manquante pour le taux de centime additionnel
ALTER TABLE public.produits ADD COLUMN IF NOT EXISTS taux_centime_additionnel numeric DEFAULT 0.00;

-- 1.3 Créer la table laboratoires si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.laboratoires (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  nom_laboratoire text NOT NULL,
  adresse text,
  telephone text,
  email text,
  site_web text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Activer RLS sur la table laboratoires
ALTER TABLE public.laboratoires ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour laboratoires
CREATE POLICY "Users can view laboratories from their tenant" 
ON public.laboratoires FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert laboratories in their tenant" 
ON public.laboratoires FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update laboratories from their tenant" 
ON public.laboratoires FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete laboratories from their tenant" 
ON public.laboratoires FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- 1.4 Transformer la colonne laboratoire en laboratoires_id
-- D'abord, ajouter la nouvelle colonne
ALTER TABLE public.produits ADD COLUMN IF NOT EXISTS laboratoires_id uuid;

-- Supprimer l'ancienne colonne laboratoire si elle existe
ALTER TABLE public.produits DROP COLUMN IF EXISTS laboratoire;

-- Ajouter une contrainte de clé étrangère vers la table laboratoires
ALTER TABLE public.produits 
ADD CONSTRAINT fk_produits_laboratoires 
FOREIGN KEY (laboratoires_id) REFERENCES public.laboratoires(id);

-- Trigger pour mettre à jour updated_at sur laboratoires
CREATE OR REPLACE FUNCTION public.update_laboratoires_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_laboratoires_updated_at
  BEFORE UPDATE ON public.laboratoires
  FOR EACH ROW EXECUTE FUNCTION public.update_laboratoires_updated_at();