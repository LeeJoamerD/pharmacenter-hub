-- Migration: Ajouter "En transit" aux statuts de commande autorisés
-- Fix: Erreur 400 lors du changement de statut Expédié → En transit

ALTER TABLE public.commandes_fournisseurs 
DROP CONSTRAINT IF EXISTS commandes_fournisseurs_statut_check;

ALTER TABLE public.commandes_fournisseurs 
ADD CONSTRAINT commandes_fournisseurs_statut_check 
CHECK (statut = ANY (ARRAY[
  'Brouillon'::text, 
  'En cours'::text, 
  'Confirmé'::text, 
  'Expédié'::text, 
  'En transit'::text,
  'Livré'::text, 
  'Réceptionné'::text, 
  'Annulé'::text
]));