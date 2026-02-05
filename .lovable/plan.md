

# Plan de Correction - Erreur sur compliance_requirements

## Diagnostic

L'erreur 400 Bad Request est causée par une **faute de frappe** dans le nom de colonne :

| Code actuel (ligne 577) | Colonne réelle en base |
|------------------------|------------------------|
| `regulatory_reference` | `regulation_reference` |

Le schéma de la table `compliance_requirements` montre :
- `regulation_reference` (text, nullable) ✅

Le code utilise :
- `regulatory_reference` ❌ (nom de colonne invalide)

---

## Solution

### Fichier: `src/services/RegulatoryService.ts`

**Correction à la ligne 577 :**

```typescript
// Avant
regulatory_reference: 'Interne',

// Après
regulation_reference: 'Interne',
```

---

## Modification complète

```typescript
// Créer un requirement générique si aucun n'existe
const { data: newReq, error: reqError } = await supabase
  .from('compliance_requirements')
  .insert([{
    tenant_id: tenantId,
    category: 'Actions Correctives',
    title: 'Exigence générale',
    description: 'Exigence générique pour actions correctives',
    regulation_reference: 'Interne',  // ✅ Correction: regulation (sans 'y')
    priority_level: 'moyenne',
    is_active: true
  }])
  .select('id')
  .single();
```

---

## Résultat attendu

Après cette correction mineure :
1. L'insertion dans `compliance_requirements` fonctionnera
2. Le `compliance_control` sera créé avec succès
3. L'action corrective sera enregistrée correctement
4. Plus d'erreur 400

