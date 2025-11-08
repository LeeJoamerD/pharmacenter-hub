-- Phase 1: Supprimer les foreign keys dupliquées qui causent l'ambiguïté PostgREST
-- Ces anciennes FK créent un conflit avec les nouvelles (fk_produits_famille_id et fk_produits_dci_id)

ALTER TABLE public.produits DROP CONSTRAINT IF EXISTS fk_produits_famille;
ALTER TABLE public.produits DROP CONSTRAINT IF EXISTS fk_produits_dci;

-- Les nouvelles foreign keys restent en place :
-- - fk_produits_famille_id → famille_produit(id) 
-- - fk_produits_dci_id → dci(id)

-- Note: Cette correction résout l'erreur PostgREST "more than one relationship was found"