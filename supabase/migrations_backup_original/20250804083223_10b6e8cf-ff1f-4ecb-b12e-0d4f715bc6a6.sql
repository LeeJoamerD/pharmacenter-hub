-- Créer d'abord un assureur par défaut si nécessaire
INSERT INTO public.assureurs (tenant_id, libelle_assureur, adresse, telephone_appel, email)
SELECT DISTINCT s.tenant_id, 'Assureur par défaut', 'Adresse par défaut', '00000000', 'default@assureur.com'
FROM public.societes s
WHERE s.assureur_id IS NULL
AND NOT EXISTS (
  SELECT 1 FROM public.assureurs a 
  WHERE a.tenant_id = s.tenant_id 
  AND a.libelle_assureur = 'Assureur par défaut'
);

-- Assigner l'assureur par défaut aux sociétés sans assureur
UPDATE public.societes 
SET assureur_id = (
  SELECT a.id 
  FROM public.assureurs a 
  WHERE a.tenant_id = societes.tenant_id 
  AND a.libelle_assureur = 'Assureur par défaut'
  LIMIT 1
)
WHERE assureur_id IS NULL;

-- Maintenant rendre assureur_id obligatoire
ALTER TABLE public.societes 
ALTER COLUMN assureur_id SET NOT NULL;

-- Mettre à jour la fonction trigger pour utiliser le bon type de client "Assuré"
CREATE OR REPLACE FUNCTION public.create_client_for_societe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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