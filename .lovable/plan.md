
# Plan de Correction Universelle : Authentification Pharmacies

## Objectif
Corriger le problème d'authentification pour **TOUTES** les pharmacies actuelles et futures en :
1. Corrigeant les fonctions RPC pour accéder correctement aux fonctions `pgcrypto`
2. Permettant de définir les mots de passe pour les pharmacies existantes

---

## Phase 1 : Correction des Fonctions RPC (Migration SQL)

Recréer les 3 fonctions RPC en préfixant explicitement les appels à `crypt()` et `gen_salt()` avec `extensions.` :

### Fonctions à corriger

| Fonction | Utilisation | Correction |
|----------|-------------|------------|
| `authenticate_pharmacy` | Vérification du mot de passe | `crypt(...)` → `extensions.crypt(...)` |
| `register_pharmacy_simple` | Création du hash à l'inscription | `crypt(..., gen_salt(...))` → `extensions.crypt(..., extensions.gen_salt(...))` |
| `update_pharmacy_password` | Mise à jour du mot de passe | Idem |

### Impact
- Toutes les nouvelles inscriptions de pharmacies fonctionneront correctement
- Toutes les connexions de pharmacies (avec mot de passe défini) fonctionneront
- La mise à jour de mot de passe fonctionnera

---

## Phase 2 : Définition des Mots de Passe Existants

Après la correction des RPC, définir un mot de passe pour chaque pharmacie existante.

### Option A : Mot de passe unique par pharmacie
Vous fournissez un mot de passe spécifique pour chaque pharmacie :
- DJL - Computer Sciences (`lee.joamer@gmail.com`)
- Pharmacie MAZAYU (`mdorefr@gmail.com`)
- Pharmacie Nuit Rond Point de la Paix (`pharmacienuitrondpointdelapaix@gmail.com`)
- Pharmacie La GLOIRE (`louzolocatherine@gmail.com`)
- Pharmacie TESTS (`mdorelfr@yahoo.fr`)

### Option B : Mot de passe temporaire identique
Définir un mot de passe temporaire (ex: `Pharma2026!`) pour toutes les pharmacies, puis les propriétaires le changent via l'interface.

---

## Phase 3 : Vérification et Validation

1. Tester la connexion pour chaque pharmacie
2. Tester la création d'une nouvelle pharmacie
3. Tester la modification de mot de passe

---

## Détails Techniques

### Migration SQL - Correction des Fonctions RPC

```text
-- ==============================================
-- PHASE 1 : CORRECTION DES FONCTIONS RPC
-- Problème : crypt() et gen_salt() sont dans le schema 'extensions'
-- Solution : Préfixer avec 'extensions.'
-- ==============================================

-- 1.1 Recréer authenticate_pharmacy avec extensions.crypt
CREATE OR REPLACE FUNCTION public.authenticate_pharmacy(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pharmacy RECORD;
  v_session_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Vérifier les credentials avec extensions.crypt
  SELECT * INTO v_pharmacy 
  FROM pharmacies 
  WHERE lower(email) = lower(p_email)
  AND password_hash IS NOT NULL
  AND password_hash = extensions.crypt(p_password, password_hash)
  AND status = 'active';
  
  IF NOT FOUND THEN
    -- Vérifier si l'email existe
    IF EXISTS (SELECT 1 FROM pharmacies WHERE lower(email) = lower(p_email)) THEN
      -- Vérifier si le mot de passe est défini
      IF EXISTS (SELECT 1 FROM pharmacies WHERE lower(email) = lower(p_email) AND password_hash IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Mot de passe non configuré. Contactez l''administrateur.');
      END IF;
      RETURN jsonb_build_object('success', false, 'error', 'Mot de passe incorrect');
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'Aucune pharmacie trouvée avec cet email');
  END IF;
  
  -- Créer une session pharmacie
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '7 days';
  
  -- Désactiver les anciennes sessions
  UPDATE pharmacy_sessions 
  SET is_active = false 
  WHERE pharmacy_id = v_pharmacy.id AND is_active = true;
  
  -- Créer la nouvelle session
  INSERT INTO pharmacy_sessions (pharmacy_id, session_token, expires_at, is_active)
  VALUES (v_pharmacy.id, v_session_token, v_expires_at, true);
  
  -- Retourner les données
  RETURN jsonb_build_object(
    'success', true,
    'pharmacy', jsonb_build_object(
      'id', v_pharmacy.id,
      'name', v_pharmacy.name,
      'email', v_pharmacy.email,
      'code', v_pharmacy.code,
      'address', v_pharmacy.address,
      'city', v_pharmacy.city,
      'quartier', v_pharmacy.quartier,
      'arrondissement', v_pharmacy.arrondissement,
      'departement', v_pharmacy.departement,
      'region', v_pharmacy.region,
      'pays', v_pharmacy.pays,
      'type', v_pharmacy.type,
      'status', v_pharmacy.status,
      'telephone_appel', v_pharmacy.telephone_appel,
      'telephone_whatsapp', v_pharmacy.telephone_whatsapp,
      'logo', v_pharmacy.logo,
      'created_at', v_pharmacy.created_at,
      'updated_at', v_pharmacy.updated_at
    ),
    'session_token', v_session_token,
    'expires_at', v_expires_at
  );
END;
$$;

-- 1.2 Recréer register_pharmacy_simple avec extensions.crypt/gen_salt
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
  -- Vérifier que l'email n'existe pas déjà
  IF EXISTS (SELECT 1 FROM pharmacies WHERE lower(email) = lower(pharmacy_data->>'email')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Une pharmacie avec cet email existe déjà');
  END IF;
  
  -- Générer le hash du mot de passe avec extensions.crypt
  v_password_hash := extensions.crypt(pharmacy_password, extensions.gen_salt('bf'));
  
  -- Créer la pharmacie avec le password_hash
  INSERT INTO pharmacies (
    name, code, address, quartier, arrondissement, city, departement,
    region, pays, telephone_appel, telephone_whatsapp, email, type, status, password_hash
  )
  VALUES (
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
  )
  RETURNING id INTO v_pharmacy_id;
  
  -- Créer une session pharmacie immédiatement
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '7 days';
  
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

-- 1.3 Recréer update_pharmacy_password avec extensions.crypt/gen_salt
CREATE OR REPLACE FUNCTION public.update_pharmacy_password(
  p_pharmacy_id UUID,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_password_hash TEXT;
BEGIN
  -- Générer le nouveau hash avec extensions.crypt
  v_password_hash := extensions.crypt(p_new_password, extensions.gen_salt('bf'));
  
  UPDATE pharmacies 
  SET password_hash = v_password_hash, updated_at = NOW()
  WHERE id = p_pharmacy_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pharmacie non trouvée');
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.authenticate_pharmacy(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_pharmacy_simple(JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_pharmacy_password(UUID, TEXT) TO authenticated;
```

### Phase 2 - Définition des Mots de Passe (après migration)

```text
-- Définir les mots de passe pour TOUTES les pharmacies existantes
-- Remplacer '<MOT_DE_PASSE>' par le mot de passe choisi

-- DJL - Computer Sciences
UPDATE public.pharmacies 
SET password_hash = extensions.crypt('<MOT_DE_PASSE_DJL>', extensions.gen_salt('bf')),
    updated_at = now()
WHERE id = 'b51e3719-13d1-4cfb-96ed-2429bb62b411';

-- Pharmacie MAZAYU
UPDATE public.pharmacies 
SET password_hash = extensions.crypt('<MOT_DE_PASSE_MAZAYU>', extensions.gen_salt('bf')),
    updated_at = now()
WHERE id = 'aa8717d1-d450-48dd-a484-66402e435797';

-- Pharmacie Nuit Rond Point de la Paix
UPDATE public.pharmacies 
SET password_hash = extensions.crypt('<MOT_DE_PASSE_NUIT>', extensions.gen_salt('bf')),
    updated_at = now()
WHERE id = '58a29961-293d-40de-901d-90e1fba81c19';

-- Pharmacie La GLOIRE
UPDATE public.pharmacies 
SET password_hash = extensions.crypt('<MOT_DE_PASSE_GLOIRE>', extensions.gen_salt('bf')),
    updated_at = now()
WHERE id = '5b752062-3e24-47bd-93b8-004a4dcfb5b0';

-- Pharmacie TESTS
UPDATE public.pharmacies 
SET password_hash = extensions.crypt('<MOT_DE_PASSE_TESTS>', extensions.gen_salt('bf')),
    updated_at = now()
WHERE id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8';
```

---

## Résultat Attendu

Après l'exécution de ce plan :
- Toutes les pharmacies existantes pourront se connecter
- Les nouvelles inscriptions de pharmacies fonctionneront correctement
- La modification de mot de passe fonctionnera
- Le message d'erreur sera plus explicite pour les pharmacies sans mot de passe configuré

---

## Question Préalable

**Souhaitez-vous utiliser un mot de passe temporaire identique pour toutes les pharmacies (Option B) ou des mots de passe différents (Option A) ?**

Si Option B : Quel mot de passe temporaire souhaitez-vous utiliser ?
