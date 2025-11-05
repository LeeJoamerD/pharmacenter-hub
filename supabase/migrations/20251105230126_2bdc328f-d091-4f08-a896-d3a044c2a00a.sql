-- Supprimer l'ancienne contrainte sur type_mouvement
ALTER TABLE public.mouvements_caisse 
  DROP CONSTRAINT IF EXISTS mouvements_caisse_type_mouvement_check;

-- Créer la nouvelle contrainte avec toutes les valeurs métier étendues
ALTER TABLE public.mouvements_caisse 
  ADD CONSTRAINT mouvements_caisse_type_mouvement_check 
  CHECK (type_mouvement IN (
    'Entrée',        -- Ajout d'argent en caisse
    'Sortie',        -- Retrait d'argent de la caisse
    'Ajustement',    -- Correction d'écart
    'Fond_initial',  -- Fond de caisse à l'ouverture
    'Vente',         -- Encaissement d'une vente
    'Remboursement', -- Remboursement client
    'Dépense'        -- Dépense opérationnelle
  ));