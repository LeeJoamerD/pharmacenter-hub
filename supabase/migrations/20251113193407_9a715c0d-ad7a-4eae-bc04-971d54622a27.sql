-- ============================================
-- PHASE 1: Résolution de l'erreur 400 critique
-- Nettoyage des FK dupliquées sur la table produits
-- ============================================

-- Supprimer la FK auto-générée qui cause l'ambiguïté PostgREST
-- On garde uniquement la FK explicitement nommée
ALTER TABLE public.produits 
DROP CONSTRAINT IF EXISTS produits_categorie_tarification_id_fkey;

-- Vérifier qu'on garde bien la FK explicite
-- Celle-ci doit rester: fk_produits_categorie_tarification

-- Ajouter un commentaire pour documentation
COMMENT ON CONSTRAINT fk_produits_categorie_tarification ON public.produits IS 
'Foreign key vers categorie_tarification - unique constraint pour éviter les ambiguïtés PostgREST';