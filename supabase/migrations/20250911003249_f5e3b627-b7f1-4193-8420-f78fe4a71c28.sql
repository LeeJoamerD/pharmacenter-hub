-- Add therapeutic class association to products
ALTER TABLE produits ADD COLUMN classe_therapeutique_id uuid NULL;

-- Add foreign key constraint
ALTER TABLE produits 
ADD CONSTRAINT fk_produits_classe_therapeutique 
FOREIGN KEY (classe_therapeutique_id) 
REFERENCES classes_therapeutiques(id) 
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_produits_classe_therapeutique ON produits (tenant_id, classe_therapeutique_id);

-- Create validation function to ensure same tenant
CREATE OR REPLACE FUNCTION validate_product_class_same_tenant()
RETURNS TRIGGER AS $$
BEGIN
  -- If classe_therapeutique_id is not null, validate same tenant
  IF NEW.classe_therapeutique_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM classes_therapeutiques 
      WHERE id = NEW.classe_therapeutique_id 
      AND tenant_id = NEW.tenant_id
    ) THEN
      RAISE EXCEPTION 'La classe thérapeutique doit appartenir au même tenant que le produit';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate tenant consistency
CREATE TRIGGER trigger_validate_product_class_tenant
  BEFORE INSERT OR UPDATE ON produits
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_class_same_tenant();