-- Ajouter la valeur 'Personnel' au BON enum: type_client (sans _enum)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'Personnel' 
        AND enumtypid = 'type_client'::regtype
    ) THEN
        ALTER TYPE type_client ADD VALUE 'Personnel';
    END IF;
END $$;