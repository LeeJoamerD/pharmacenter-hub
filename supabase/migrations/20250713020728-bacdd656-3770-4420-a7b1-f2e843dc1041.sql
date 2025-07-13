-- Phase 1: Nettoyer l'utilisateur incorrect (si existe)
DELETE FROM public.personnel WHERE email = 'admin@test-pharmacie.fr';
DELETE FROM auth.users WHERE email = 'admin@test-pharmacie.fr';

-- Phase 2: Créer l'utilisateur de test directement 
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_pharmacy_id UUID;
BEGIN
    -- Récupérer l'ID d'une pharmacie existante ou créer une pharmacie de test
    SELECT id INTO test_pharmacy_id FROM public.pharmacies LIMIT 1;
    
    IF test_pharmacy_id IS NULL THEN
        INSERT INTO public.pharmacies (
            name, code, address, city, region, pays, email, status
        ) VALUES (
            'Pharmacie du Centre',
            'PHARM_TEST_001',
            '123 Avenue Principale',
            'Yaoundé',
            'Centre',
            'Cameroun',
            'contact@pharmacie-centre.com',
            'active'
        ) RETURNING id INTO test_pharmacy_id;
    END IF;

    -- Créer l'utilisateur dans auth.users avec le bon format de hash
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        aud,
        role
    ) VALUES (
        test_user_id,
        '00000000-0000-0000-0000-000000000000',
        'admin@test-pharmacie.fr',
        '$2a$10$rU8/Z9JKCUgSJgKrr./EZO8XYf5ZEG5kJj5H5qMmXKkKxTqQq5.E6', -- TestAdmin123! avec bcrypt
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    );

    -- Créer l'enregistrement personnel
    INSERT INTO public.personnel (
        tenant_id,
        auth_user_id,
        noms,
        prenoms,
        reference_agent,
        email,
        role,
        is_active
    ) VALUES (
        test_pharmacy_id,
        test_user_id,
        'ADMIN',
        'Test',
        'TEST_ADM_001',
        'admin@test-pharmacie.fr',
        'Admin',
        true
    );

    RAISE NOTICE 'Utilisateur de test créé: admin@test-pharmacie.fr / TestAdmin123!';
END $$;