-- Ajouter les colonnes taux_ticket_moderateur et caution aux tables societes et personnel

-- Table societes
ALTER TABLE public.societes 
ADD COLUMN IF NOT EXISTS taux_ticket_moderateur numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS caution numeric DEFAULT 0;

-- Table personnel
ALTER TABLE public.personnel 
ADD COLUMN IF NOT EXISTS taux_ticket_moderateur numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS caution numeric DEFAULT 0;

-- Mise à jour du trigger create_client_for_societe
CREATE OR REPLACE FUNCTION public.create_client_for_societe()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.clients (
    tenant_id,
    nom,
    type_client,
    societe_id,
    telephone,
    email,
    adresse,
    limite_credit,
    peut_prendre_bon,
    taux_remise_automatique,
    taux_agent,
    taux_ayant_droit,
    assureur_id,
    taux_ticket_moderateur,
    caution
  ) VALUES (
    NEW.tenant_id,
    NEW.nom,
    'societe',
    NEW.id,
    NEW.telephone,
    NEW.email,
    NEW.adresse,
    COALESCE(NEW.limite_credit, 0),
    COALESCE(NEW.peut_prendre_bon, false),
    COALESCE(NEW.taux_remise_automatique, 0),
    COALESCE(NEW.taux_agent, 0),
    COALESCE(NEW.taux_ayant_droit, 0),
    NEW.assureur_id,
    COALESCE(NEW.taux_ticket_moderateur, 0),
    COALESCE(NEW.caution, 0)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Mise à jour du trigger update_client_for_societe
CREATE OR REPLACE FUNCTION public.update_client_for_societe()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.clients SET
    nom = NEW.nom,
    telephone = NEW.telephone,
    email = NEW.email,
    adresse = NEW.adresse,
    limite_credit = COALESCE(NEW.limite_credit, 0),
    peut_prendre_bon = COALESCE(NEW.peut_prendre_bon, false),
    taux_remise_automatique = COALESCE(NEW.taux_remise_automatique, 0),
    taux_agent = COALESCE(NEW.taux_agent, 0),
    taux_ayant_droit = COALESCE(NEW.taux_ayant_droit, 0),
    assureur_id = NEW.assureur_id,
    taux_ticket_moderateur = COALESCE(NEW.taux_ticket_moderateur, 0),
    caution = COALESCE(NEW.caution, 0),
    updated_at = now()
  WHERE societe_id = NEW.id AND tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Mise à jour du trigger create_client_for_personnel
CREATE OR REPLACE FUNCTION public.create_client_for_personnel()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne pas créer de compte client pour les utilisateurs système
  IF NEW.is_system_user = true THEN
    RETURN NEW;
  END IF;
  
  INSERT INTO public.clients (
    tenant_id,
    nom,
    type_client,
    personnel_id,
    telephone,
    email,
    adresse,
    limite_credit,
    peut_prendre_bon,
    taux_remise_automatique,
    taux_agent,
    taux_ayant_droit,
    assureur_id,
    taux_ticket_moderateur,
    caution
  ) VALUES (
    NEW.tenant_id,
    NEW.prenom || ' ' || NEW.nom,
    'personnel',
    NEW.id,
    NEW.telephone,
    NEW.email,
    NEW.adresse,
    COALESCE(NEW.limite_credit, 0),
    COALESCE(NEW.peut_prendre_bon, false),
    COALESCE(NEW.taux_remise_automatique, 0),
    COALESCE(NEW.taux_agent, 0),
    COALESCE(NEW.taux_ayant_droit, 0),
    NEW.assureur_id,
    COALESCE(NEW.taux_ticket_moderateur, 0),
    COALESCE(NEW.caution, 0)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Mise à jour du trigger update_client_for_personnel
CREATE OR REPLACE FUNCTION public.update_client_for_personnel()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.clients SET
    nom = NEW.prenom || ' ' || NEW.nom,
    telephone = NEW.telephone,
    email = NEW.email,
    adresse = NEW.adresse,
    limite_credit = COALESCE(NEW.limite_credit, 0),
    peut_prendre_bon = COALESCE(NEW.peut_prendre_bon, false),
    taux_remise_automatique = COALESCE(NEW.taux_remise_automatique, 0),
    taux_agent = COALESCE(NEW.taux_agent, 0),
    taux_ayant_droit = COALESCE(NEW.taux_ayant_droit, 0),
    assureur_id = NEW.assureur_id,
    taux_ticket_moderateur = COALESCE(NEW.taux_ticket_moderateur, 0),
    caution = COALESCE(NEW.caution, 0),
    updated_at = now()
  WHERE personnel_id = NEW.id AND tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;