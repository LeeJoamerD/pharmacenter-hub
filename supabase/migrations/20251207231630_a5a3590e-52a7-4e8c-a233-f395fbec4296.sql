-- Supprimer l'ancienne contrainte
ALTER TABLE public.network_channels 
DROP CONSTRAINT IF EXISTS network_channels_type_check;

-- Ajouter la nouvelle contrainte avec tous les types valides
ALTER TABLE public.network_channels 
ADD CONSTRAINT network_channels_type_check 
CHECK (type IN ('public', 'private', 'direct', 'team', 'collaboration', 'function', 'supplier', 'system'));