-- Ajouter la valeur 'Personnel' à l'enum type_client_enum de manière sécurisée
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'Personnel' 
        AND enumtypid = 'type_client_enum'::regtype
    ) THEN
        ALTER TYPE type_client_enum ADD VALUE 'Personnel';
    END IF;
END $$;