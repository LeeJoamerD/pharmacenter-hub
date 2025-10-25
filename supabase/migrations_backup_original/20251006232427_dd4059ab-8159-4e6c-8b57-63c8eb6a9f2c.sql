-- Créer l'index unique partiel nécessaire pour ON CONFLICT
-- Cet index garantit qu'il n'y a qu'une seule suggestion active par combinaison tenant/lot/produit

CREATE UNIQUE INDEX IF NOT EXISTS idx_suggestions_vente_unique_active
ON public.suggestions_vente (tenant_id, lot_id, produit_id)
WHERE statut = 'active';