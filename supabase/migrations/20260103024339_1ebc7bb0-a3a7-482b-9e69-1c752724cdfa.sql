-- Correction complète des fonctions trigger avec les bons noms de colonnes
-- clients.nom_complet (pas nom), personnel/societes avec les bons champs

-- ==============================================
-- FONCTIONS POUR PERSONNEL
-- ==============================================

CREATE OR REPLACE FUNCTION public.create_client_for_personnel()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer un client uniquement pour les employés (pas les utilisateurs système)
  IF NEW.auth_user_id IS NULL THEN
    INSERT INTO public.clients (
      tenant_id,
      nom_complet,
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
      CONCAT(NEW.prenoms, ' ', NEW.noms),
      'Personnel'::public.type_client_enum,
      NEW.id,
      NEW.telephone_appel,
      NEW.email,
      NEW.adresse,
      COALESCE(NEW.limite_dette, 0),
      COALESCE(NEW.peut_prendre_bon, false),
      COALESCE(NEW.taux_remise_automatique, 0),
      COALESCE(NEW.taux_agent, 0),
      COALESCE(NEW.taux_ayant_droit, 0),
      NEW.assureur_id,
      COALESCE(NEW.taux_ticket_moderateur, 0),
      COALESCE(NEW.caution, 0)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_client_for_personnel()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.clients SET
    nom_complet = CONCAT(NEW.prenoms, ' ', NEW.noms),
    telephone = NEW.telephone_appel,
    email = NEW.email,
    adresse = NEW.adresse,
    limite_credit = COALESCE(NEW.limite_dette, 0),
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

-- ==============================================
-- FONCTIONS POUR SOCIETES
-- ==============================================

CREATE OR REPLACE FUNCTION public.create_client_for_societe()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.clients (
    tenant_id,
    nom_complet,
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
    NEW.libelle_societe,
    'Assuré'::public.type_client_enum,
    NEW.id,
    NEW.telephone_appel,
    NEW.email,
    NEW.adresse,
    COALESCE(NEW.limite_dette, 0),
    COALESCE(NEW.peut_prendre_bon, false),
    COALESCE(NEW.taux_remise_automatique, 0),
    COALESCE(NEW.taux_couverture_agent, 0),
    COALESCE(NEW.taux_couverture_ayant_droit, 0),
    NEW.assureur_id,
    COALESCE(NEW.taux_ticket_moderateur, 0),
    COALESCE(NEW.caution, 0)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_client_for_societe()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.clients SET
    nom_complet = NEW.libelle_societe,
    telephone = NEW.telephone_appel,
    email = NEW.email,
    adresse = NEW.adresse,
    limite_credit = COALESCE(NEW.limite_dette, 0),
    peut_prendre_bon = COALESCE(NEW.peut_prendre_bon, false),
    taux_remise_automatique = COALESCE(NEW.taux_remise_automatique, 0),
    taux_agent = COALESCE(NEW.taux_couverture_agent, 0),
    taux_ayant_droit = COALESCE(NEW.taux_couverture_ayant_droit, 0),
    assureur_id = NEW.assureur_id,
    taux_ticket_moderateur = COALESCE(NEW.taux_ticket_moderateur, 0),
    caution = COALESCE(NEW.caution, 0),
    updated_at = now()
  WHERE societe_id = NEW.id AND tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;