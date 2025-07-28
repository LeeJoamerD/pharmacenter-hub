-- Test d'insertion d'une société pour voir l'erreur
DO $$
DECLARE
    test_tenant_id uuid := 'c6dde9fb-2ae8-442b-ad95-39be58f4eb4c';
BEGIN
    INSERT INTO public.societes (
        tenant_id,
        libelle_societe,
        adresse,
        telephone_appel,
        email,
        limite_dette,
        taux_couverture_agent,
        taux_couverture_ayant_droit
    ) VALUES (
        test_tenant_id,
        'Test Société',
        '123 Rue Test',
        '+242123456789',
        'test@societe.cg',
        100000,
        80,
        60
    );
    
    RAISE NOTICE 'Société inserée avec succès';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors de l''insertion de la société: %', SQLERRM;
END $$;