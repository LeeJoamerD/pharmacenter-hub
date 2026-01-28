
# Plan de Correction : Synchronisation des Rôles et Permissions

## Problèmes Identifiés

### 1. Source du Template Incorrecte
La fonction `initialize_tenant_roles_permissions` utilise actuellement l'ID `2f7365aa-eadd-4aa9-a5c8-330b97d55ea8` en commentant "Pharmacie MAZAYU". Or, cet ID correspond en réalité à **"Pharmacie TESTS"**.

Le tenant **Pharmacie MAZAYU** (`aa8717d1-d450-48dd-a484-66402e435797`) possède 179 permissions accordées contre 173 pour les autres. Il a 6 permissions supplémentaires pour le rôle **Secrétaire** :
- `reports.advanced` - Rapports avancés
- `reports.export` - Exporter les rapports
- `sales.cashier` - Encaisser les ventes
- `sales.discount` - Appliquer des remises
- `sales.edit` - Modifier les ventes
- `sales.view` - Consulter les ventes

### 2. Fonction `register_pharmacy_simple` Incomplète
La fonction `register_pharmacy_simple` (utilisée pour le nouveau flux de création de pharmacie) **n'appelle pas** `initialize_tenant_roles_permissions`. Les pharmacies créées via ce flux n'ont donc pas de rôles ni de permissions automatiquement.

### 3. Aucun Trigger Automatique
Il n'existe pas de trigger sur la table `pharmacies` pour initialiser automatiquement les rôles/permissions lors de chaque création.

## Solution Proposée

### Phase 1 : Corriger le Template Source
Mettre à jour la fonction `initialize_tenant_roles_permissions` pour utiliser **Pharmacie MAZAYU** comme source (elle a le jeu de permissions le plus complet).

### Phase 2 : Synchroniser Tous les Tenants Existants
Créer une fonction de synchronisation qui :
1. Prend le tenant MAZAYU comme référence
2. Pour chaque autre tenant, ajoute les permissions manquantes par rôle

### Phase 3 : Automatiser pour les Futures Créations
1. Modifier `register_pharmacy_simple` pour appeler `initialize_tenant_roles_permissions`
2. Créer un trigger `AFTER INSERT` sur la table `pharmacies` comme filet de sécurité

## Détails Techniques

### Migration SQL à Créer

```text
-- 1. Corriger la fonction avec le bon template (MAZAYU)
CREATE OR REPLACE FUNCTION public.initialize_tenant_roles_permissions(p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role RECORD;
  v_new_role_id UUID;
  v_template_tenant_id UUID := 'aa8717d1-d450-48dd-a484-66402e435797'; -- Pharmacie MAZAYU (correcte)
BEGIN
  -- Vérifier que le tenant existe
  IF NOT EXISTS (SELECT 1 FROM public.pharmacies WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Tenant % not found', p_tenant_id;
  END IF;
  
  -- Ne rien faire si le tenant a déjà des rôles (idempotent)
  IF EXISTS (SELECT 1 FROM public.roles WHERE tenant_id = p_tenant_id) THEN
    RETURN;
  END IF;

  -- Copier les rôles depuis le template MAZAYU
  FOR v_role IN 
    SELECT * FROM public.roles 
    WHERE tenant_id = v_template_tenant_id AND is_active = true
    ORDER BY niveau_hierarchique
  LOOP
    v_new_role_id := gen_random_uuid();
    
    INSERT INTO public.roles (id, tenant_id, nom_role, description, niveau_hierarchique, is_active, is_system, created_at, updated_at)
    VALUES (v_new_role_id, p_tenant_id, v_role.nom_role, v_role.description, 
            v_role.niveau_hierarchique, true, v_role.is_system, now(), now());
    
    INSERT INTO public.roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
    SELECT p_tenant_id, v_new_role_id, rp.permission_id, rp.accorde, now(), now()
    FROM public.roles_permissions rp
    WHERE rp.role_id = v_role.id AND rp.accorde = true;
  END LOOP;
END;
$$;

-- 2. Fonction de synchronisation pour les tenants existants
CREATE OR REPLACE FUNCTION public.sync_tenant_permissions_from_template()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_tenant_id UUID := 'aa8717d1-d450-48dd-a484-66402e435797';
  v_tenant RECORD;
  v_template_role RECORD;
  v_target_role RECORD;
BEGIN
  FOR v_tenant IN 
    SELECT id FROM pharmacies WHERE id != v_template_tenant_id
  LOOP
    FOR v_template_role IN
      SELECT r.id, r.nom_role 
      FROM roles r 
      WHERE r.tenant_id = v_template_tenant_id AND r.is_active = true
    LOOP
      SELECT id INTO v_target_role
      FROM roles
      WHERE tenant_id = v_tenant.id AND nom_role = v_template_role.nom_role;
      
      IF v_target_role.id IS NOT NULL THEN
        INSERT INTO roles_permissions (tenant_id, role_id, permission_id, accorde, created_at, updated_at)
        SELECT v_tenant.id, v_target_role.id, rp.permission_id, true, now(), now()
        FROM roles_permissions rp
        WHERE rp.role_id = v_template_role.id AND rp.accorde = true
        AND NOT EXISTS (
          SELECT 1 FROM roles_permissions existing
          WHERE existing.role_id = v_target_role.id 
          AND existing.permission_id = rp.permission_id
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- 3. Exécuter la synchronisation
SELECT public.sync_tenant_permissions_from_template();

-- 4. Modifier register_pharmacy_simple pour appeler l'initialisation
CREATE OR REPLACE FUNCTION public.register_pharmacy_simple(...)
  -- Ajouter après le RETURNING id INTO v_pharmacy_id:
  PERFORM public.initialize_tenant_roles_permissions(v_pharmacy_id);
...

-- 5. Créer un trigger de sécurité
CREATE OR REPLACE FUNCTION public.trigger_initialize_pharmacy_rbac()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.initialize_tenant_roles_permissions(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_init_pharmacy_rbac ON public.pharmacies;
CREATE TRIGGER trg_init_pharmacy_rbac
  AFTER INSERT ON public.pharmacies
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_initialize_pharmacy_rbac();
```

## Résumé des Actions

| Action | Description |
|--------|-------------|
| Corriger `initialize_tenant_roles_permissions` | Utiliser MAZAYU comme source |
| Créer `sync_tenant_permissions_from_template` | Synchroniser les permissions manquantes |
| Exécuter la synchronisation | Corriger tous les tenants existants |
| Modifier `register_pharmacy_simple` | Ajouter l'appel d'initialisation RBAC |
| Créer trigger `trg_init_pharmacy_rbac` | Automatiser pour toute nouvelle pharmacie |

## Résultat Attendu

- Tous les tenants existants auront **179 permissions accordées** (comme MAZAYU)
- Le rôle **Secrétaire** aura les 6 permissions manquantes dans tous les tenants
- Toute nouvelle pharmacie créée (quel que soit le flux) recevra automatiquement tous les rôles et permissions
