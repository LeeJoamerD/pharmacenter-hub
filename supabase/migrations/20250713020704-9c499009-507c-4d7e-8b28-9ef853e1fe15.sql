-- Phase 1: Nettoyer l'utilisateur incorrect
DELETE FROM public.personnel WHERE email = 'admin@test-pharmacie.fr';
DELETE FROM auth.users WHERE email = 'admin@test-pharmacie.fr';

-- Phase 2: Créer l'utilisateur correctement avec la fonction existante
SELECT public.register_pharmacy_with_admin(
    -- Données de la pharmacie (utiliser la pharmacie existante)
    jsonb_build_object(
        'name', 'Pharmacie du Centre',
        'code', 'PHARM_001',
        'address', '123 Avenue Principale',
        'quartier', 'Centre-ville',
        'arrondissement', '1er',
        'city', 'Yaoundé',
        'region', 'Centre',
        'pays', 'Cameroun',
        'email', 'contact@pharmacie-centre.com',
        'telephone_appel', '+237 222 123 456',
        'telephone_whatsapp', '+237 677 123 456',
        'departement', 'Mfoundi',
        'type', 'Moderne'
    ),
    -- Données de l'administrateur
    jsonb_build_object(
        'noms', 'ADMIN',
        'prenoms', 'Test',
        'reference_agent', 'TEST_ADM_001',
        'telephone', '+237 677 123 456'
    ),
    -- Email et mot de passe
    'admin@test-pharmacie.fr',
    'TestAdmin123!'
);