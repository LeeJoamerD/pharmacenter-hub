-- Fonction de validation tenant (replace si existe déjà)
CREATE OR REPLACE FUNCTION public.validate_product_class_same_tenant()
RETURNS TRIGGER AS $$
BEGIN
  -- Si classe_therapeutique_id n'est pas null, valider le même tenant
  IF NEW.classe_therapeutique_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.classes_therapeutiques 
      WHERE id = NEW.classe_therapeutique_id 
      AND tenant_id = NEW.tenant_id
    ) THEN
      RAISE EXCEPTION 'La classe thérapeutique doit appartenir au même tenant que le produit';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour valider la cohérence des tenants (si il n'existe pas déjà)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_validate_product_class_tenant'
    AND event_object_table = 'produits'
  ) THEN
    CREATE TRIGGER trigger_validate_product_class_tenant
    BEFORE INSERT OR UPDATE ON public.produits
    FOR EACH ROW 
    EXECUTE FUNCTION public.validate_product_class_same_tenant();
  END IF;
END $$;

-- Ajouter quelques classes thérapeutiques de test pour votre pharmacie
INSERT INTO public.classes_therapeutiques (tenant_id, libelle_classe, systeme_anatomique, description)
SELECT 
  get_current_user_tenant_id(),
  classe.libelle,
  classe.systeme,
  classe.description
FROM (VALUES 
  ('Anti-inflammatoires', 'Système musculo-squelettique', 'Médicaments réduisant l''inflammation'),
  ('Antibiotiques', 'Système respiratoire', 'Médicaments contre les infections bactériennes'),
  ('Antalgiques', 'Système nerveux', 'Médicaments contre la douleur'),
  ('Antihypertenseurs', 'Système cardiovasculaire', 'Médicaments contre l''hypertension'),
  ('Antidiabétiques', 'Système endocrinien', 'Médicaments pour le diabète'),
  ('Vitamines', 'Métabolisme', 'Suppléments vitaminiques'),
  ('Antihistaminiques', 'Système immunitaire', 'Médicaments contre les allergies')
) AS classe(libelle, systeme, description)
WHERE get_current_user_tenant_id() IS NOT NULL
ON CONFLICT (tenant_id, libelle_classe) DO NOTHING;