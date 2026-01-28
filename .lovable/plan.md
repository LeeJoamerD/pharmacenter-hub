
# Plan de Correction : Erreur de Création de Pharmacie

## Problème Identifié

La fonction `register_pharmacy_simple` ne définit pas la colonne `tenant_id` lors de l'INSERT, ce qui cause une erreur car :

1. **Colonne NOT NULL** : `tenant_id` est obligatoire (pas de valeur par défaut)
2. **Contrainte CHECK** : `pharmacies_tenant_id_equals_id` exige que `tenant_id = id`
3. **Pas de trigger BEFORE INSERT** : Aucun trigger ne définit automatiquement `tenant_id`

### Extrait du code problématique (lignes 135-156)

```sql
INSERT INTO pharmacies (
  name, code, address, quartier, arrondissement, city, departement,
  region, pays, telephone_appel, telephone_whatsapp, email, type, status, password_hash
  -- ⚠️ MANQUE : tenant_id
)
VALUES (...) 
RETURNING id INTO v_pharmacy_id;
```

L'erreur retournée est probablement : `null value in column "tenant_id" violates not-null constraint` ou `new row violates check constraint "pharmacies_tenant_id_equals_id"`.

## Solution

Modifier la fonction `register_pharmacy_simple` pour :
1. Générer l'UUID avant l'INSERT
2. Utiliser cet UUID pour les deux colonnes `id` et `tenant_id`

## Migration SQL à Appliquer

```sql
CREATE OR REPLACE FUNCTION public.register_pharmacy_simple(
  pharmacy_data JSONB,
  pharmacy_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pharmacy_id UUID;
  v_session_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_password_hash TEXT;
BEGIN
  -- Vérifier si l'email existe déjà
  IF EXISTS (SELECT 1 FROM pharmacies WHERE lower(email) = lower(pharmacy_data->>'email')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Une pharmacie avec cet email existe déjà');
  END IF;
  
  -- Générer l'UUID AVANT l'insert pour l'utiliser dans id ET tenant_id
  v_pharmacy_id := gen_random_uuid();
  
  -- Hasher le mot de passe
  v_password_hash := extensions.crypt(pharmacy_password, extensions.gen_salt('bf'));
  
  -- Insérer avec id ET tenant_id définis au même UUID
  INSERT INTO pharmacies (
    id, tenant_id,  -- ✅ AJOUT : id et tenant_id explicites
    name, code, address, quartier, arrondissement, city, departement,
    region, pays, telephone_appel, telephone_whatsapp, email, type, status, password_hash
  )
  VALUES (
    v_pharmacy_id, v_pharmacy_id,  -- ✅ Les deux sont identiques
    pharmacy_data->>'name',
    COALESCE(pharmacy_data->>'code', 'PH' || extract(epoch from now())::text),
    pharmacy_data->>'address',
    pharmacy_data->>'quartier',
    pharmacy_data->>'arrondissement',
    pharmacy_data->>'city',
    pharmacy_data->>'departement',
    COALESCE(pharmacy_data->>'region', 'République du Congo'),
    COALESCE(pharmacy_data->>'pays', 'République du Congo'),
    pharmacy_data->>'telephone_appel',
    pharmacy_data->>'telephone_whatsapp',
    pharmacy_data->>'email',
    COALESCE(pharmacy_data->>'type', 'standard'),
    'active',
    v_password_hash
  );
  
  -- Générer le token de session
  v_session_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '7 days';
  
  -- Créer la session pharmacie
  INSERT INTO pharmacy_sessions (pharmacy_id, session_token, expires_at, is_active)
  VALUES (v_pharmacy_id, v_session_token, v_expires_at, true);
  
  RETURN jsonb_build_object(
    'success', true,
    'pharmacy_id', v_pharmacy_id,
    'session_token', v_session_token,
    'expires_at', v_expires_at
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
```

## Optimisation Additionnelle : Supprimer l'Appel Redondant

Puisque le trigger `trg_init_pharmacy_rbac` appelle déjà `initialize_tenant_roles_permissions` après chaque INSERT, l'appel explicite à la ligne 159 de l'ancienne fonction est **redondant**. La nouvelle version ci-dessus ne l'inclut pas car le trigger s'en charge automatiquement.

## Résumé des Modifications

| Élément | Avant | Après |
|---------|-------|-------|
| Génération UUID | Implicite (RETURNING) | Explicite (gen_random_uuid()) |
| Colonne `id` | Non spécifiée | Spécifiée |
| Colonne `tenant_id` | **MANQUANTE** | Spécifiée = id |
| Appel RBAC | Dans la fonction | Via trigger uniquement |

## Résultat Attendu

- La création de pharmacie fonctionnera sans erreur
- Les contraintes NOT NULL et CHECK seront respectées
- Les rôles/permissions seront automatiquement initialisés par le trigger
