# 📋 Remarques Critiques de Lovable.dev - Guidelines

> **Date de création :** Janvier 2025  
> **Source :** Rapport d'analyse Lovable.dev sur le module de réconciliation  
> **Objectif :** Éviter de répéter les mêmes erreurs dans les futures implémentations

---

## 🚨 **ERREURS CRITIQUES À ÉVITER ABSOLUMENT**

### **4. FAILLE DE SÉCURITÉ MAJEURE : Fonctions RPC mal sécurisées**

**❌ ERREUR CRITIQUE :**
```sql
-- DANGEREUX : Accepte tenant_id depuis le client
CREATE OR REPLACE FUNCTION public.generate_sales_suggestions(p_tenant_id UUID)
```

**🔴 RISQUES :**
- Utilisateur malveillant peut passer n'importe quel tenant_id
- Accès aux données d'autres pharmacies
- Pas de `SECURITY DEFINER` = problèmes de permissions
- Aucune validation des droits d'accès

**✅ SOLUTION SÉCURISÉE :**
```sql
-- Fonction sécurisée qui récupère automatiquement le tenant
CREATE OR REPLACE FUNCTION public.generate_sales_suggestions()
RETURNS TABLE(...)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    -- Récupérer le tenant de l'utilisateur authentifié
    SELECT get_current_user_tenant_id() INTO current_tenant_id;
    
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non authentifié ou tenant non trouvé';
    END IF;
    
    -- Utiliser current_tenant_id dans la logique
    RETURN QUERY
    SELECT ... FROM suggestions_vente 
    WHERE tenant_id = current_tenant_id;
END;
$$;
```

**📝 RÈGLE :** JAMAIS de tenant_id en paramètre. Toujours récupérer via `get_current_user_tenant_id()`.

---

### **5. POLITIQUES RLS INCORRECTES**

**❌ ERREUR COMMUNE :**
```sql
-- Ne fonctionne PAS dans ce projet
CREATE POLICY "Users can view their tenant suggestions" ON public.suggestions_vente
FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);
```

**🔴 PROBLÈME :** 
- `auth.jwt() ->> 'tenant_id'` ne retourne rien dans ce projet
- Bloque TOUS les accès aux données
- Utilise un pattern d'authentification incorrect

**✅ SOLUTION CORRECTE :**
```sql
-- Pattern RLS correct pour ce projet
CREATE POLICY "Users can view their tenant suggestions" ON public.suggestions_vente
FOR SELECT USING (tenant_id = get_current_user_tenant_id());

-- Ou pour plus de sécurité
CREATE POLICY "Users can view their tenant suggestions" ON public.suggestions_vente
FOR SELECT USING (
    tenant_id IN (
        SELECT p.tenant_id 
        FROM personnel p 
        WHERE p.auth_user_id = auth.uid()
    )
);
```

**📝 RÈGLE :** Toujours utiliser `get_current_user_tenant_id()` ou la table `personnel` pour les RLS.

---

### **6. SCHÉMA TYPESCRIPT NON SYNCHRONISÉ**

**❌ PROBLÈME FRÉQUENT :**
- Table existe en DB mais pas dans `database.types.ts`
- Cause des erreurs de build TypeScript
- Hooks frontend cassés

**✅ SOLUTION :**
```bash
# Régénérer le schéma TypeScript
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

**📝 RÈGLE :** Toujours régénérer les types après modification de schéma DB.

---

### **1. CONTRAINTE CHECK sur le champ `type`**

**❌ ERREUR COMMUNE :**
```typescript
type: 'reconciliation',  // INVALIDE - Cause erreur 23514
```

**✅ SOLUTION :**
```typescript
type: 'complet',  // Valeurs acceptées : 'complet', 'partiel', 'cyclique'
```

**📝 RÈGLE :** Toujours vérifier les contraintes CHECK en base avant d'insérer des données.

---

### **2. FAILLE DE SÉCURITÉ : UUID hardcodé**

**❌ ERREUR CRITIQUE :**
```typescript
agent_id: '00000000-0000-0000-0000-000000000000'  // DANGEREUX
```

**✅ SOLUTION SÉCURISÉE :**
```typescript
// Option 1 : Utiliser l'utilisateur authentifié
agent_id: auth.uid()

// Option 2 : Récupérer le personnel associé
const { data: personnel } = await supabase
  .from('personnel')
  .select('id')
  .eq('auth_user_id', auth.uid())
  .single();
agent_id: personnel?.id
```

**📝 RÈGLE :** JAMAIS d'UUID hardcodé. Toujours utiliser l'authentification réelle.

---

### **3. DONNÉES MOCKÉES vs DONNÉES RÉELLES**

**❌ PROBLÈME FRÉQUENT :**
- Composants utilisant uniquement des données mockées
- Boutons de validation qui ne font rien
- Aucune persistance en base de données

**✅ BONNES PRATIQUES :**
- Toujours connecter les composants à Supabase
- Implémenter la persistance des données
- Tester les actions utilisateur avec de vraies données

---

## 🔐 **SÉCURITÉ RLS - Points d'Attention**

### **Problèmes identifiés par Lovable :**
- Policies RLS trop permissives
- Accès anonyme autorisé sur certaines tables
- Système d'authentification des pharmacies bloqué

### **Vérifications obligatoires :**
1. **Avant chaque requête Supabase :**
   - Vérifier que l'utilisateur est authentifié
   - S'assurer que le `tenant_id` est correct
   - Valider les permissions RLS

2. **Pour les insertions :**
   - Utiliser des IDs réels (pas de hardcoding)
   - Respecter les contraintes de clé étrangère
   - Valider les formats de données

---

## 📊 **STRUCTURE DE DONNÉES - Bonnes Pratiques**

### **Formats de dates :**
```typescript
// ❌ Éviter
date_debut: currentSession.date,

// ✅ Recommandé
date_debut: new Date(currentSession.date).toISOString(),
```

### **Noms et responsables :**
```typescript
// ❌ Éviter
responsable: 'Utilisateur actuel',

// ✅ Recommandé
responsable: `${currentPersonnel?.prenoms} ${currentPersonnel?.noms}`,
```

---

## 🔧 **HOOKS ET INTÉGRATIONS**

### **Pattern recommandé pour les hooks Supabase :**

```typescript
export const useInventoryReconciliation = (sessionId?: string) => {
  const { tenantId } = useTenant();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReconciliationData = async () => {
    try {
      setLoading(true);
      
      // ✅ Requête réelle avec relations
      const { data, error } = await supabase
        .from('inventaire_lignes')
        .select(`
          *,
          produits (libelle_produit),
          lots (numero_lot, quantite_restante)
        `)
        .eq('tenant_id', tenantId)
        .eq('session_id', sessionId);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId && tenantId) {
      fetchReconciliationData();
    }
  }, [sessionId, tenantId]);

  return { items, loading, refetch: fetchReconciliationData };
};
```

---

### 8. **❌ ERREUR CRITIQUE : Conflit de Surcharge de Fonction PostgreSQL (PGRST203)**

**Problème** : L'erreur `PGRST203` indique un conflit de surcharge de fonction (`function overloading`) dans PostgreSQL. Cela se produit lorsque plusieurs versions d'une même fonction (ex: `rpc_stock_record_movement`) existent dans la base de données avec des signatures de paramètres incompatibles. PostgreSQL ne peut pas déterminer quelle version utiliser, même si le code client appelle une version spécifique.

**Exemple Concret** :
- **Version 1 (Utilisée par le code TypeScript)** :
  ```sql
  CREATE OR REPLACE FUNCTION rpc_stock_record_movement(
      p_lot_id UUID,
      p_produit_id UUID,
      p_type_mouvement TEXT,
      p_quantite_mouvement INTEGER,
      p_motif TEXT DEFAULT NULL,
      p_quantite_reelle INTEGER DEFAULT NULL
  )
  ```
- **Version 2 (Conflictuelle)** :
  ```sql
  CREATE OR REPLACE FUNCTION rpc_stock_record_movement(
      p_type_mouvement text,
      p_produit_id uuid,
      p_quantite_mouvement integer,
      p_lot_id uuid DEFAULT NULL
  )
  ```
Le code TypeScript appelait la Version 1, mais la présence de la Version 2 créait une ambiguïté pour PostgreSQL.

**Solution** :
1.  **Identifier les versions conflictuelles** : Examiner les migrations et le schéma de la base de données pour trouver toutes les définitions de la fonction en question.
2.  **Supprimer toutes les versions conflictuelles** : Créer une migration SQL qui supprime explicitement toutes les versions de la fonction.
    ```sql
    DROP FUNCTION IF EXISTS rpc_stock_record_movement(UUID, UUID, TEXT, INTEGER, TEXT, INTEGER);
    DROP FUNCTION IF EXISTS rpc_stock_record_movement(TEXT, UUID, INTEGER, UUID);
    -- Ajouter toutes les signatures existantes à supprimer
    ```
3.  **Recréer la fonction correcte** : Après avoir supprimé toutes les versions, recréer la fonction avec la signature et la logique désirées.

**Règle d'Or** : Avant de créer ou de modifier une fonction PostgreSQL, toujours vérifier s'il existe des versions antérieures avec des signatures similaires. En cas de doute, supprimer explicitement toutes les versions possibles avant de recréer la fonction pour éviter les ambiguïtés.

### 9. **📝 CHECKLIST D'IMPLÉMENTATION**

### **Avant de coder :**
- [ ] Vérifier les contraintes de base de données
- [ ] Identifier les clés étrangères requises
- [ ] Planifier l'authentification et les permissions
- [ ] Définir les formats de données attendus
- [ ] **S'assurer que les fonctions RPC sont sécurisées (pas de tenant_id en paramètre)**
- [ ] **Vérifier que les politiques RLS utilisent `get_current_user_tenant_id()`**

### **Pendant le développement :**
- [ ] Utiliser des données réelles (pas de mock)
- [ ] Implémenter la gestion d'erreurs
- [ ] Tester avec différents utilisateurs/tenants
- [ ] Valider les contraintes RLS
- [ ] **Tester l'isolation des tenants (sécurité multi-tenant)**
- [ ] **Vérifier que les fonctions RPC ont `SECURITY DEFINER`**

### **Avant le commit :**
- [ ] Tester toutes les actions utilisateur
- [ ] Vérifier les logs d'erreur
- [ ] S'assurer que les données sont persistées
- [ ] Valider la sécurité des requêtes
- [ ] **Régénérer les types TypeScript si schéma DB modifié**
- [ ] **Tester l'accès cross-tenant (doit être bloqué)**

---

## 🎯 **RÈGLES D'OR**

1. **SÉCURITÉ FIRST** : Jamais d'UUID hardcodé, toujours authentifier
2. **DONNÉES RÉELLES** : Connecter tous les composants à Supabase
3. **CONTRAINTES DB** : Vérifier les contraintes avant d'insérer
4. **GESTION D'ERREURS** : Toujours implémenter try/catch et feedback utilisateur
5. **TENANT ISOLATION** : Toujours filtrer par tenant_id
6. **AUDIT TRAIL** : Tracer toutes les actions avec les vrais utilisateurs
7. **🔐 FONCTIONS RPC SÉCURISÉES** : Jamais de tenant_id en paramètre, toujours `SECURITY DEFINER`
8. **🛡️ RLS CORRECT** : Utiliser `get_current_user_tenant_id()` pas `auth.jwt()`
9. **📊 TYPES SYNCHRONISÉS** : Régénérer les types après chaque modification de schéma

---

## 🔑 **ACCÈS SUPABASE CLOUD**

**IMPORTANT :** L'assistant a accès aux clés Supabase Cloud via le fichier `.env` et peut :
- Générer les types TypeScript directement depuis Supabase Cloud
- Exécuter des requêtes et tester les fonctions RPC
- Vérifier la structure des tables et schémas
- Créer ou modifier des fonctions SQL

**Commande pour générer les types :**
```bash
npx supabase gen types typescript --project-id PROJECT_ID > src/lib/database.types.ts
```

---

## 📚 **RESSOURCES UTILES**

- **Contraintes DB :** Consulter `database.types.ts` pour les types
- **RLS Policies :** Vérifier dans les migrations Supabase
- **Authentification :** Utiliser `useAuth()` et `useTenant()`
- **Gestion d'erreurs :** Pattern avec toast.error() pour le feedback

---

## 📚 **LOGIQUE EN CASCADE**
- Le système utilise maintenant pour les alertes de stock 
- 1) valeurs produit (stock_limite, stock_alert et stock critique) → 2) paramètres utilisateur (alert_settings) → 3) valeurs par défaut.

> **💡 RAPPEL :** Ce document doit être consulté avant chaque implémentation majeure pour éviter de répéter les erreurs identifiées par Lovable.dev.