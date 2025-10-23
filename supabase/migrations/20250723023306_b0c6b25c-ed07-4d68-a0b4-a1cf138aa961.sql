
-- Phase 1: Mise à jour du backend pour le composant Général des Paramètres Système

-- 1. Ajouter le champ taux_centime_additionnel à la table pharmacies
ALTER TABLE public.pharmacies 
ADD COLUMN taux_centime_additionnel NUMERIC(5,2) DEFAULT 0.00;

-- Ajouter un commentaire pour documenter le nouveau champ
COMMENT ON COLUMN public.pharmacies.taux_centime_additionnel IS 'Taux de centime additionnel en pourcentage';

-- 2. Créer ou mettre à jour les paramètres système pour les devises
INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, valeur_defaut, type_parametre, categorie, description, is_modifiable, is_visible)
SELECT 
    p.id as tenant_id,
    'currencies_available',
    '[
        {"code": "XAF", "name": "Franc CFA", "symbol": "FCFA", "rate": 1, "countries": ["Cameroun", "Congo", "Gabon", "Centrafrique", "Tchad", "Guinée Équatoriale"]},
        {"code": "XOF", "name": "Franc CFA Ouest", "symbol": "FCFA", "rate": 1, "countries": ["Sénégal", "Mali", "Burkina Faso", "Côte d\'Ivoire", "Niger", "Bénin", "Togo", "Guinée-Bissau"]},
        {"code": "EUR", "name": "Euro", "symbol": "€", "rate": 0.00152, "countries": ["France", "Belgique", "Allemagne", "Italie", "Espagne"]},
        {"code": "USD", "name": "Dollar US", "symbol": "$", "rate": 0.00166, "countries": ["États-Unis", "Canada"]},
        {"code": "MAD", "name": "Dirham Marocain", "symbol": "MAD", "rate": 0.016, "countries": ["Maroc"]},
        {"code": "DZD", "name": "Dinar Algérien", "symbol": "DZD", "rate": 0.0075, "countries": ["Algérie"]},
        {"code": "TND", "name": "Dinar Tunisien", "symbol": "TND", "rate": 0.32, "countries": ["Tunisie"]}
    ]'::text,
    'XAF',
    'json',
    'devise',
    'Liste des devises disponibles avec focus sur l\'Afrique, France, Belgique et USA',
    true,
    true
FROM public.pharmacies p
WHERE NOT EXISTS (
    SELECT 1 FROM public.parametres_systeme ps 
    WHERE ps.tenant_id = p.id AND ps.cle_parametre = 'currencies_available'
);

-- 3. Ajouter les fuseaux horaires pour l'Afrique, France, Belgique et USA
INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, valeur_defaut, type_parametre, categorie, description, is_modifiable, is_visible)
SELECT 
    p.id as tenant_id,
    'timezones_available',
    '[
        {"code": "Africa/Douala", "name": "Douala (GMT+1)", "offset": "+01:00", "region": "Afrique Centrale"},
        {"code": "Africa/Libreville", "name": "Libreville (GMT+1)", "offset": "+01:00", "region": "Afrique Centrale"},
        {"code": "Africa/Bangui", "name": "Bangui (GMT+1)", "offset": "+01:00", "region": "Afrique Centrale"},
        {"code": "Africa/Brazzaville", "name": "Brazzaville (GMT+1)", "offset": "+01:00", "region": "Afrique Centrale"},
        {"code": "Africa/Kinshasa", "name": "Kinshasa (GMT+1)", "offset": "+01:00", "region": "Afrique Centrale"},
        {"code": "Africa/Abidjan", "name": "Abidjan (GMT+0)", "offset": "+00:00", "region": "Afrique de l\'Ouest"},
        {"code": "Africa/Dakar", "name": "Dakar (GMT+0)", "offset": "+00:00", "region": "Afrique de l\'Ouest"},
        {"code": "Africa/Casablanca", "name": "Casablanca (GMT+1)", "offset": "+01:00", "region": "Afrique du Nord"},
        {"code": "Africa/Algiers", "name": "Alger (GMT+1)", "offset": "+01:00", "region": "Afrique du Nord"},
        {"code": "Africa/Tunis", "name": "Tunis (GMT+1)", "offset": "+01:00", "region": "Afrique du Nord"},
        {"code": "Europe/Paris", "name": "Paris (GMT+1)", "offset": "+01:00", "region": "Europe"},
        {"code": "Europe/Brussels", "name": "Bruxelles (GMT+1)", "offset": "+01:00", "region": "Europe"},
        {"code": "America/New_York", "name": "New York (GMT-5)", "offset": "-05:00", "region": "Amérique du Nord"},
        {"code": "America/Los_Angeles", "name": "Los Angeles (GMT-8)", "offset": "-08:00", "region": "Amérique du Nord"}
    ]'::text,
    'Africa/Douala',
    'json',
    'fuseau_horaire',
    'Liste des fuseaux horaires disponibles avec focus sur l\'Afrique, France, Belgique et USA',
    true,
    true
FROM public.pharmacies p
WHERE NOT EXISTS (
    SELECT 1 FROM public.parametres_systeme ps 
    WHERE ps.tenant_id = p.id AND ps.cle_parametre = 'timezones_available'
);

-- 4. Configurer les 4 langues spécifiées : Français, Anglais, Espagnol, Lingala
INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, valeur_defaut, type_parametre, categorie, description, is_modifiable, is_visible)
SELECT 
    p.id as tenant_id,
    'languages_available',
    '[
        {"code": "fr", "name": "Français", "flag": "🇫🇷", "native_name": "Français", "region": "France/Afrique Francophone"},
        {"code": "en", "name": "English", "flag": "🇬🇧", "native_name": "English", "region": "International"},
        {"code": "es", "name": "Español", "flag": "🇪🇸", "native_name": "Español", "region": "Espagne/Amérique Latine"},
        {"code": "ln", "name": "Lingala", "flag": "🇨🇩", "native_name": "Lingala", "region": "Congo/Afrique Centrale"}
    ]'::text,
    'fr',
    'json',
    'langue',
    'Liste des langues disponibles dans PharmaSoft : Français, Anglais, Espagnol, Lingala',
    true,
    true
FROM public.pharmacies p
WHERE NOT EXISTS (
    SELECT 1 FROM public.parametres_systeme ps 
    WHERE ps.tenant_id = p.id AND ps.cle_parametre = 'languages_available'
);

-- 5. Ajouter les paramètres par défaut pour les nouvelles pharmacies
INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, valeur_defaut, type_parametre, categorie, description, is_modifiable, is_visible)
SELECT 
    p.id as tenant_id,
    'default_currency',
    'XAF',
    'XAF',
    'string',
    'devise',
    'Devise par défaut de la pharmacie',
    true,
    true
FROM public.pharmacies p
WHERE NOT EXISTS (
    SELECT 1 FROM public.parametres_systeme ps 
    WHERE ps.tenant_id = p.id AND ps.cle_parametre = 'default_currency'
);

INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, valeur_defaut, type_parametre, categorie, description, is_modifiable, is_visible)
SELECT 
    p.id as tenant_id,
    'default_timezone',
    'Africa/Douala',
    'Africa/Douala',
    'string',
    'fuseau_horaire',
    'Fuseau horaire par défaut de la pharmacie',
    true,
    true
FROM public.pharmacies p
WHERE NOT EXISTS (
    SELECT 1 FROM public.parametres_systeme ps 
    WHERE ps.tenant_id = p.id AND ps.cle_parametre = 'default_timezone'
);

INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, valeur_defaut, type_parametre, categorie, description, is_modifiable, is_visible)
SELECT 
    p.id as tenant_id,
    'default_language',
    'fr',
    'fr',
    'string',
    'langue',
    'Langue par défaut de la pharmacie',
    true,
    true
FROM public.pharmacies p
WHERE NOT EXISTS (
    SELECT 1 FROM public.parametres_systeme ps 
    WHERE ps.tenant_id = p.id AND ps.cle_parametre = 'default_language'
);

-- 6. Ajouter le paramètre pour l'année fiscale
INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, valeur_defaut, type_parametre, categorie, description, is_modifiable, is_visible)
SELECT 
    p.id as tenant_id,
    'fiscal_year',
    EXTRACT(YEAR FROM CURRENT_DATE)::text,
    EXTRACT(YEAR FROM CURRENT_DATE)::text,
    'string',
    'comptabilite',
    'Année fiscale en cours',
    true,
    true
FROM public.pharmacies p
WHERE NOT EXISTS (
    SELECT 1 FROM public.parametres_systeme ps 
    WHERE ps.tenant_id = p.id AND ps.cle_parametre = 'fiscal_year'
);

-- 7. Mettre à jour les paramètres de TVA s'ils n'existent pas
INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, valeur_defaut, type_parametre, categorie, description, is_modifiable, is_visible)
SELECT 
    p.id as tenant_id,
    'taux_tva',
    '19.25',
    '19.25',
    'numeric',
    'comptabilite',
    'Taux de TVA en pourcentage',
    true,
    true
FROM public.pharmacies p
WHERE NOT EXISTS (
    SELECT 1 FROM public.parametres_systeme ps 
    WHERE ps.tenant_id = p.id AND ps.cle_parametre = 'taux_tva'
);

-- 8. Créer un trigger pour initialiser automatiquement les paramètres système pour les nouvelles pharmacies
CREATE OR REPLACE FUNCTION public.initialize_pharmacy_system_parameters()
RETURNS TRIGGER AS $$
BEGIN
    -- Initialiser les paramètres système pour la nouvelle pharmacie
    INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, valeur_defaut, type_parametre, categorie, description, is_modifiable, is_visible) VALUES
    (NEW.id, 'default_currency', 'XAF', 'XAF', 'string', 'devise', 'Devise par défaut de la pharmacie', true, true),
    (NEW.id, 'default_timezone', 'Africa/Douala', 'Africa/Douala', 'string', 'fuseau_horaire', 'Fuseau horaire par défaut de la pharmacie', true, true),
    (NEW.id, 'default_language', 'fr', 'fr', 'string', 'langue', 'Langue par défaut de la pharmacie', true, true),
    (NEW.id, 'fiscal_year', EXTRACT(YEAR FROM CURRENT_DATE)::text, EXTRACT(YEAR FROM CURRENT_DATE)::text, 'string', 'comptabilite', 'Année fiscale en cours', true, true),
    (NEW.id, 'taux_tva', '19.25', '19.25', 'numeric', 'comptabilite', 'Taux de TVA en pourcentage', true, true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_initialize_pharmacy_system_parameters ON public.pharmacies;
CREATE TRIGGER trigger_initialize_pharmacy_system_parameters
    AFTER INSERT ON public.pharmacies
    FOR EACH ROW
    EXECUTE FUNCTION public.initialize_pharmacy_system_parameters();
