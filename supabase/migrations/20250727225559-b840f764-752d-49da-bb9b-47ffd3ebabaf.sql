-- Créer l'enum pour les types de clients
CREATE TYPE public.type_client AS ENUM ('Ordinaire', 'Conventionné', 'Personnel', 'Assuré');

-- Créer la table assureurs
CREATE TABLE public.assureurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nom TEXT NOT NULL,
  adresse TEXT,
  ville TEXT,
  telephone_appel TEXT,
  telephone_whatsapp TEXT,
  email TEXT,
  niu TEXT,
  contact_principal TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS sur assureurs
ALTER TABLE public.assureurs ENABLE ROW LEVEL SECURITY;

-- Créer la table laboratoires
CREATE TABLE public.laboratoires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nom TEXT NOT NULL,
  adresse TEXT,
  ville TEXT,
  telephone_appel TEXT,
  telephone_whatsapp TEXT,
  email TEXT,
  niu TEXT,
  specialites TEXT[],
  contact_principal TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS sur laboratoires
ALTER TABLE public.laboratoires ENABLE ROW LEVEL SECURITY;

-- Créer la table societes (si elle n'existe pas déjà)
CREATE TABLE IF NOT EXISTS public.societes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  libelle_societe TEXT NOT NULL,
  adresse TEXT,
  telephone_appel TEXT,
  telephone_whatsapp TEXT,
  email TEXT,
  limite_dette NUMERIC DEFAULT 0.00,
  niu TEXT,
  assureur_id UUID,
  taux_couverture_agent NUMERIC DEFAULT 0.00,
  taux_couverture_ayant_droit NUMERIC DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS sur societes si elle n'était pas déjà activée
ALTER TABLE public.societes ENABLE ROW LEVEL SECURITY;

-- Modifier la table clients pour utiliser l'enum
ALTER TABLE public.clients ALTER COLUMN type_client TYPE public.type_client USING type_client::public.type_client;

-- Fonction pour créer automatiquement un client lors de la création d'une société
CREATE OR REPLACE FUNCTION public.create_client_for_societe()
RETURNS TRIGGER AS $$
BEGIN
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
    'Assuré'::type_client,
    NEW.id,
    NEW.libelle_societe,
    NEW.telephone_appel,
    NEW.adresse,
    0.00
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer automatiquement un client lors de la création d'un conventionné
CREATE OR REPLACE FUNCTION public.create_client_for_conventionne()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.clients (
    tenant_id,
    type_client,
    conventionne_id,
    nom_complet,
    telephone,
    adresse,
    taux_remise_automatique
  ) VALUES (
    NEW.tenant_id,
    'Conventionné'::type_client,
    NEW.id,
    NEW.noms,
    NEW.telephone_appel,
    NEW.adresse,
    NEW.taux_remise_automatique
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le client lors de la mise à jour d'une société
CREATE OR REPLACE FUNCTION public.update_client_for_societe()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.clients SET
    nom_complet = NEW.libelle_societe,
    telephone = NEW.telephone_appel,
    adresse = NEW.adresse,
    updated_at = now()
  WHERE societe_id = NEW.id AND tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le client lors de la mise à jour d'un conventionné
CREATE OR REPLACE FUNCTION public.update_client_for_conventionne()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.clients SET
    nom_complet = NEW.noms,
    telephone = NEW.telephone_appel,
    adresse = NEW.adresse,
    taux_remise_automatique = NEW.taux_remise_automatique,
    updated_at = now()
  WHERE conventionne_id = NEW.id AND tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour supprimer le client lors de la suppression d'une société
CREATE OR REPLACE FUNCTION public.delete_client_for_societe()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.clients 
  WHERE societe_id = OLD.id AND tenant_id = OLD.tenant_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour supprimer le client lors de la suppression d'un conventionné
CREATE OR REPLACE FUNCTION public.delete_client_for_conventionne()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.clients 
  WHERE conventionne_id = OLD.id AND tenant_id = OLD.tenant_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer les triggers pour les sociétés
CREATE TRIGGER trigger_create_client_societe
  AFTER INSERT ON public.societes
  FOR EACH ROW EXECUTE FUNCTION public.create_client_for_societe();

CREATE TRIGGER trigger_update_client_societe
  AFTER UPDATE ON public.societes
  FOR EACH ROW EXECUTE FUNCTION public.update_client_for_societe();

CREATE TRIGGER trigger_delete_client_societe
  BEFORE DELETE ON public.societes
  FOR EACH ROW EXECUTE FUNCTION public.delete_client_for_societe();

-- Créer les triggers pour les conventionnés
CREATE TRIGGER trigger_create_client_conventionne
  AFTER INSERT ON public.conventionnes
  FOR EACH ROW EXECUTE FUNCTION public.create_client_for_conventionne();

CREATE TRIGGER trigger_update_client_conventionne
  AFTER UPDATE ON public.conventionnes
  FOR EACH ROW EXECUTE FUNCTION public.update_client_for_conventionne();

CREATE TRIGGER trigger_delete_client_conventionne
  BEFORE DELETE ON public.conventionnes
  FOR EACH ROW EXECUTE FUNCTION public.delete_client_for_conventionne();

-- Triggers pour mise à jour automatique des timestamps
CREATE TRIGGER update_assureurs_updated_at
  BEFORE UPDATE ON public.assureurs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_laboratoires_updated_at
  BEFORE UPDATE ON public.laboratoires
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_societes_updated_at
  BEFORE UPDATE ON public.societes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Politiques RLS pour assureurs
CREATE POLICY "Users can view insurers from their tenant" 
ON public.assureurs FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert insurers in their tenant" 
ON public.assureurs FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update insurers from their tenant" 
ON public.assureurs FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete insurers from their tenant" 
ON public.assureurs FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour laboratoires
CREATE POLICY "Users can view laboratories from their tenant" 
ON public.laboratoires FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert laboratories in their tenant" 
ON public.laboratoires FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update laboratories from their tenant" 
ON public.laboratoires FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete laboratories from their tenant" 
ON public.laboratoires FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour societes (si elles n'existent pas déjà)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'societes' AND policyname = 'Users can view companies from their tenant'
  ) THEN
    CREATE POLICY "Users can view companies from their tenant" 
    ON public.societes FOR SELECT 
    USING (tenant_id = get_current_user_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'societes' AND policyname = 'Users can insert companies in their tenant'
  ) THEN
    CREATE POLICY "Users can insert companies in their tenant" 
    ON public.societes FOR INSERT 
    WITH CHECK (tenant_id = get_current_user_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'societes' AND policyname = 'Users can update companies from their tenant'
  ) THEN
    CREATE POLICY "Users can update companies from their tenant" 
    ON public.societes FOR UPDATE 
    USING (tenant_id = get_current_user_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'societes' AND policyname = 'Users can delete companies from their tenant'
  ) THEN
    CREATE POLICY "Users can delete companies from their tenant" 
    ON public.societes FOR DELETE 
    USING (tenant_id = get_current_user_tenant_id());
  END IF;
END
$$;