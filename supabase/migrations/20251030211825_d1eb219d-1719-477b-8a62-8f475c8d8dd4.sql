-- Ajouter les valeurs manquantes à l'enum type_client pour correspondre au frontend
-- Le frontend utilise: Ordinaire, Personnel, Assuré, Conventionné

-- Ajouter "Ordinaire" si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Ordinaire' 
    AND enumtypid = 'type_client'::regtype
  ) THEN
    ALTER TYPE type_client ADD VALUE 'Ordinaire';
  END IF;
END $$;

-- Ajouter "Assuré" si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Assuré' 
    AND enumtypid = 'type_client'::regtype
  ) THEN
    ALTER TYPE type_client ADD VALUE 'Assuré';
  END IF;
END $$;