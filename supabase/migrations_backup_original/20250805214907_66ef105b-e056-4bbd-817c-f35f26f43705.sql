-- Phase 1: Supprimer la colonne code_produit de la table produits
ALTER TABLE public.produits DROP COLUMN IF EXISTS code_produit;