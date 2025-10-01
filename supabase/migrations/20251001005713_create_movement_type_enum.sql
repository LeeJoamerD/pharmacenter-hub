-- Create movement_type enum
CREATE TYPE public.movement_type AS ENUM (
    'in',
    'out',
    'ajustement',
    'transfert',
    'destruction',
    'retour'
);

-- Add a down migration to revert the change
DROP TYPE public.movement_type;