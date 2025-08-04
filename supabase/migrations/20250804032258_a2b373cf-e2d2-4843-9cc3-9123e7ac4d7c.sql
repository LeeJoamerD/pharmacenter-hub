-- PHASE 1 : Migration sélective des données d'employes_rh vers personnel
-- Éviter les doublons d'email

-- Migrer uniquement les employés qui n'existent pas déjà dans personnel
INSERT INTO public.personnel (
  tenant_id, 
  noms, 
  prenoms, 
  fonction, 
  adresse, 
  telephone_appel, 
  telephone_whatsapp, 
  email, 
  niu_cni, 
  profession, 
  date_naissance, 
  date_recrutement, 
  photo_identite, 
  salaire_base, 
  situation_familiale, 
  nombre_enfants, 
  numero_cnss, 
  statut_contractuel,
  role,
  is_active,
  reference_agent
)
SELECT DISTINCT ON (er.email)
  er.tenant_id,
  er.noms,
  er.prenoms,
  er.fonction,
  er.adresse,
  er.telephone_appel,
  er.telephone_whatsapp,
  er.email,
  er.niu_cni,
  er.profession,
  er.date_naissance,
  er.date_recrutement,
  er.photo_identite,
  er.salaire_base,
  er.situation_familiale::situation_familiale_enum,
  er.nombre_enfants,
  er.numero_cnss,
  er.statut_contractuel::statut_contractuel_enum,
  'Employé'::text as role,
  true as is_active,
  -- Générer reference_agent automatiquement
  CONCAT(
    SPLIT_PART(er.prenoms, ' ', 1), 
    '_', 
    UPPER(LEFT(SPLIT_PART(er.noms, ' ', 1), 4))
  ) as reference_agent
FROM public.employes_rh er
WHERE NOT EXISTS (
  SELECT 1 FROM public.personnel p 
  WHERE p.email = er.email AND p.tenant_id = er.tenant_id
)
ORDER BY er.email, er.created_at; -- Prendre le plus ancien en cas de doublons

-- PHASE 2 : Créer les clients pour les nouveaux employés migrés
INSERT INTO public.clients (
  tenant_id,
  type_client,
  personnel_id,
  nom_complet,
  telephone,
  adresse,
  taux_remise_automatique
)
SELECT 
  p.tenant_id,
  'personnel'::type_client_enum,
  p.id,
  CONCAT(p.prenoms, ' ', p.noms),
  p.telephone_appel,
  p.adresse,
  0.00
FROM public.personnel p
WHERE p.auth_user_id IS NULL  -- Employés uniquement (pas les utilisateurs système)
  AND NOT EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.personnel_id = p.id
  );

-- PHASE 3 : Supprimer l'ancienne contrainte foreign key sur clients.personnel_id
ALTER TABLE public.clients 
DROP CONSTRAINT IF EXISTS clients_personnel_id_fkey;

-- Créer la nouvelle contrainte foreign key vers personnel.id
ALTER TABLE public.clients 
ADD CONSTRAINT clients_personnel_id_fkey 
FOREIGN KEY (personnel_id) REFERENCES public.personnel(id) ON DELETE SET NULL;

-- PHASE 4 : Supprimer les triggers et fonctions liés à employes_rh
DROP TRIGGER IF EXISTS trigger_create_client_for_personnel ON public.employes_rh;

-- PHASE 5 : Créer le nouveau trigger pour la table personnel
CREATE OR REPLACE FUNCTION public.create_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Créer un client uniquement pour les employés (pas pour les utilisateurs système)
  IF NEW.auth_user_id IS NULL THEN
    INSERT INTO public.clients (
      tenant_id,
      type_client,
      personnel_id,
      nom_complet,
      telephone,
      adresse,
      taux_remise_automatique
    ) VALUES (
      NEW.tenant_id,
      'personnel'::type_client_enum,
      NEW.id,
      CONCAT(NEW.prenoms, ' ', NEW.noms),
      NEW.telephone_appel,
      NEW.adresse,
      0.00
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur lors de la création du client pour le personnel %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- Créer le trigger pour la table personnel
CREATE TRIGGER trigger_create_client_for_personnel
  AFTER INSERT ON public.personnel
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_for_personnel();

-- PHASE 6 : Supprimer la table employes_rh
DROP TABLE IF EXISTS public.employes_rh CASCADE;