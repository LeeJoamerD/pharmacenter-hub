-- Restauration des index manquants de la table personnel
-- Ces index existaient dans le backend fonctionnel et ont été perdus

-- 1. Recréer les index manquants (présents dans l'ancienne migration 20250708014550)
CREATE INDEX IF NOT EXISTS idx_personnel_reference_agent ON public.personnel(reference_agent);
CREATE INDEX IF NOT EXISTS idx_personnel_email ON public.personnel(email);
CREATE INDEX IF NOT EXISTS idx_personnel_role ON public.personnel(role);

-- 2. Corriger les données existantes avec fonction NULL
UPDATE public.personnel
SET fonction = 'Non spécifié'
WHERE fonction IS NULL;

-- 3. Ajouter une valeur par défaut pour éviter les NULL futures
ALTER TABLE public.personnel 
ALTER COLUMN fonction SET DEFAULT 'Non spécifié';

-- Commentaire pour traçabilité
COMMENT ON INDEX idx_personnel_reference_agent IS 'Index pour améliorer les performances de recherche par référence agent';
COMMENT ON INDEX idx_personnel_email IS 'Index pour améliorer les performances de recherche par email';
COMMENT ON INDEX idx_personnel_role IS 'Index pour améliorer les performances de recherche par rôle';