-- ========================================
-- RESTAURATION BACKEND SECTION PARTENAIRES
-- ========================================
-- Création de l'enum type_client et des tables manquantes

-- ========================================
-- PHASE 0: Création de l'enum type_client
-- ========================================
DO $$ 
BEGIN
  -- Créer l'enum type_client_enum s'il n'existe pas
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_client_enum') THEN
    CREATE TYPE type_client_enum AS ENUM (
      'Particulier',
      'Assuré',
      'Conventionné',
      'Entreprise'
    );
  ELSE
    -- Ajouter les valeurs manquantes si l'enum existe déjà
    BEGIN
      ALTER TYPE type_client_enum ADD VALUE IF NOT EXISTS 'Assuré';
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    
    BEGIN
      ALTER TYPE type_client_enum ADD VALUE IF NOT EXISTS 'Conventionné';
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- ========================================
-- PHASE 1: Création table ASSUREURS
-- ========================================
CREATE TABLE IF NOT EXISTS public.assureurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  libelle_assureur TEXT NOT NULL,
  adresse TEXT,
  telephone_appel TEXT,
  telephone_whatsapp TEXT,
  email TEXT,
  niu TEXT,
  limite_dette NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT assureurs_tenant_id_fkey FOREIGN KEY (tenant_id) 
    REFERENCES public.pharmacies(id) ON DELETE CASCADE
);

-- Activer RLS sur assureurs
ALTER TABLE public.assureurs ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour assureurs
DROP POLICY IF EXISTS "tenant_access_assureurs" ON public.assureurs;
CREATE POLICY "tenant_access_assureurs" 
ON public.assureurs 
FOR ALL 
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Index pour assureurs
CREATE INDEX IF NOT EXISTS idx_assureurs_tenant_id ON public.assureurs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assureurs_libelle ON public.assureurs(libelle_assureur);
CREATE INDEX IF NOT EXISTS idx_assureurs_email ON public.assureurs(email);

-- Trigger updated_at pour assureurs
DROP TRIGGER IF EXISTS update_assureurs_updated_at ON public.assureurs;
CREATE TRIGGER update_assureurs_updated_at
  BEFORE UPDATE ON public.assureurs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.assureurs IS 'Compagnies d''assurance partenaires';

-- ========================================
-- PHASE 2: Création table SOCIETES
-- ========================================
CREATE TABLE IF NOT EXISTS public.societes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  libelle_societe TEXT NOT NULL,
  niu TEXT,
  adresse TEXT,
  telephone_appel TEXT,
  telephone_whatsapp TEXT,
  email TEXT,
  limite_dette NUMERIC(15,2) DEFAULT 0,
  assureur_id UUID NOT NULL,
  taux_couverture_agent NUMERIC(5,2) DEFAULT 0,
  taux_couverture_ayant_droit NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT societes_tenant_id_fkey FOREIGN KEY (tenant_id) 
    REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  CONSTRAINT societes_assureur_id_fkey FOREIGN KEY (assureur_id) 
    REFERENCES public.assureurs(id) ON DELETE RESTRICT
);

-- Activer RLS sur societes
ALTER TABLE public.societes ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour societes
DROP POLICY IF EXISTS "tenant_access_societes" ON public.societes;
CREATE POLICY "tenant_access_societes" 
ON public.societes 
FOR ALL 
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Index pour societes
CREATE INDEX IF NOT EXISTS idx_societes_tenant_id ON public.societes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_societes_assureur_id ON public.societes(assureur_id);
CREATE INDEX IF NOT EXISTS idx_societes_libelle ON public.societes(libelle_societe);

-- Trigger updated_at pour societes
DROP TRIGGER IF EXISTS update_societes_updated_at ON public.societes;
CREATE TRIGGER update_societes_updated_at
  BEFORE UPDATE ON public.societes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.societes IS 'Sociétés/Entreprises partenaires assurées';

-- ========================================
-- PHASE 3: Ajout colonnes FK dans CLIENTS
-- ========================================
-- Ajouter societe_id si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clients' 
    AND column_name = 'societe_id'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN societe_id UUID;
    ALTER TABLE public.clients ADD CONSTRAINT clients_societe_id_fkey 
      FOREIGN KEY (societe_id) REFERENCES public.societes(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_clients_societe_id ON public.clients(societe_id);
  END IF;
END $$;

-- Ajouter conventionne_id si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clients' 
    AND column_name = 'conventionne_id'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN conventionne_id UUID;
    ALTER TABLE public.clients ADD CONSTRAINT clients_conventionne_id_fkey 
      FOREIGN KEY (conventionne_id) REFERENCES public.conventionnes(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_clients_conventionne_id ON public.clients(conventionne_id);
  END IF;
END $$;

-- ========================================
-- PHASE 4: Trigger auto-création client SOCIETE
-- ========================================
CREATE OR REPLACE FUNCTION public.create_client_for_societe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Créer automatiquement un client de type "Assuré" pour la société
  INSERT INTO public.clients (
    tenant_id,
    type_client,
    societe_id,
    nom_complet,
    telephone,
    adresse,
    taux_remise_automatique
  ) VALUES (
    NEW.tenant_id,
    'Assuré'::type_client_enum,
    NEW.id,
    NEW.libelle_societe,
    NEW.telephone_appel,
    NEW.adresse,
    0.00
  );
  RETURN NEW;
END;
$function$;

-- Créer le trigger AFTER INSERT sur societes
DROP TRIGGER IF EXISTS trigger_create_client_for_societe ON public.societes;
CREATE TRIGGER trigger_create_client_for_societe
  AFTER INSERT ON public.societes
  FOR EACH ROW EXECUTE FUNCTION public.create_client_for_societe();

-- ========================================
-- PHASE 5: Trigger auto-création client CONVENTIONNE
-- ========================================
CREATE OR REPLACE FUNCTION public.create_client_for_conventionne()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Créer automatiquement un client de type "Conventionné"
  INSERT INTO public.clients (
    tenant_id,
    type_client,
    conventionne_id,
    nom_complet,
    telephone,
    adresse,
    limite_credit,
    taux_remise_automatique
  ) VALUES (
    NEW.tenant_id,
    'Conventionné'::type_client_enum,
    NEW.id,
    NEW.noms,
    NEW.telephone_appel,
    NEW.adresse,
    COALESCE(NEW.limite_dette, 0),
    COALESCE(NEW.taux_remise_automatique, 0)
  );
  RETURN NEW;
END;
$function$;

-- Créer le trigger AFTER INSERT sur conventionnes
DROP TRIGGER IF EXISTS trigger_create_client_for_conventionne ON public.conventionnes;
CREATE TRIGGER trigger_create_client_for_conventionne
  AFTER INSERT ON public.conventionnes
  FOR EACH ROW EXECUTE FUNCTION public.create_client_for_conventionne();

-- ========================================
-- AUDIT: Trigger pour assureurs
-- ========================================
DROP TRIGGER IF EXISTS audit_assureurs ON public.assureurs;
CREATE TRIGGER audit_assureurs
  AFTER INSERT OR UPDATE OR DELETE ON public.assureurs
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

-- ========================================
-- AUDIT: Trigger pour societes
-- ========================================
DROP TRIGGER IF EXISTS audit_societes ON public.societes;
CREATE TRIGGER audit_societes
  AFTER INSERT OR UPDATE OR DELETE ON public.societes
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

-- ========================================
-- FIN MIGRATION - Backend Partenaires restauré
-- ========================================