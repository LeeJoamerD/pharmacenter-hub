-- Créer un utilisateur de test complet avec authentification
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_pharmacy_id UUID := 'c01d1e49-22fd-40ae-98b3-ef9390a261b7';
BEGIN
    -- 1. Créer l'utilisateur dans auth.users
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        test_user_id,
        'admin@test-pharmacie.fr',
        crypt('TestAdmin123!', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('role', 'Admin', 'tenant_id', test_pharmacy_id),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    -- 2. Créer l'enregistrement personnel
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
        'Test_ADM',
        'admin@test-pharmacie.fr',
        'Admin',
        true
    );

    RAISE NOTICE 'Utilisateur de test créé avec succès: admin@test-pharmacie.fr / TestAdmin123!';
END $$;