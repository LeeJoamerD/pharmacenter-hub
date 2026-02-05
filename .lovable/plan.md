

# Plan de Correction - Erreur 400 sur Création d'Action Corrective

## Diagnostic

L'erreur 400 Bad Request est causée par la ligne 565 du fichier `RegulatoryService.ts` :

```typescript
control_id: crypto.randomUUID()
```

### Problème identifié

La table `compliance_actions` a une **contrainte de clé étrangère** sur la colonne `control_id` :

```
compliance_actions_control_id_fkey → FOREIGN KEY (control_id) REFERENCES compliance_controls(id) ON DELETE CASCADE
```

Le code génère un **UUID aléatoire** qui ne correspond à **aucun enregistrement** dans la table `compliance_controls`, ce qui viole la contrainte FK et déclenche l'erreur 400.

### Schema de la table `compliance_actions`

| Colonne | Type | Nullable | Contrainte |
|---------|------|----------|------------|
| `id` | uuid | NON | PK auto-générée |
| `tenant_id` | uuid | NON | |
| `control_id` | uuid | NON | **FK → compliance_controls(id)** |
| `action_type` | text | NON | default: 'corrective' |
| `action_description` | text | NON | |
| `due_date` | date | OUI | |
| `status` | text | NON | default: 'pending' |
| `priority` | text | NON | default: 'normal' |

---

## Solution

### Option choisie : Créer automatiquement un control_id valide

Puisque des `compliance_requirements` existent déjà dans la base, nous allons :

1. **Récupérer un requirement existant** (ou en créer un générique si nécessaire)
2. **Créer un `compliance_control`** associé à ce requirement
3. **Utiliser cet ID** pour créer l'action corrective

### Modifications à effectuer

| Fichier | Action |
|---------|--------|
| `src/services/RegulatoryService.ts` | Refactorer `createComplianceAction()` pour créer d'abord un control valide |

---

## Détail de l'implémentation

### Fichier: `src/services/RegulatoryService.ts`

**Méthode `createComplianceAction` (lignes 555-568)**

**Avant :**
```typescript
async createComplianceAction(tenantId: string, titre: string, description: string, echeance?: string): Promise<void> {
  const { error } = await supabase
    .from('compliance_actions')
    .insert([{
      tenant_id: tenantId,
      action_description: description,
      action_type: titre,
      status: 'pending',
      due_date: echeance,
      priority: 'medium',
      control_id: crypto.randomUUID()  // ❌ UUID invalide
    }]);
  if (error) throw error;
}
```

**Après :**
```typescript
async createComplianceAction(tenantId: string, titre: string, description: string, echeance?: string): Promise<void> {
  // 1. Récupérer ou créer un requirement générique pour ce tenant
  let requirementId: string;
  
  const { data: existingReq } = await supabase
    .from('compliance_requirements')
    .select('id')
    .eq('tenant_id', tenantId)
    .limit(1)
    .single();
  
  if (existingReq) {
    requirementId = existingReq.id;
  } else {
    // Créer un requirement générique si aucun n'existe
    const { data: newReq, error: reqError } = await supabase
      .from('compliance_requirements')
      .insert([{
        tenant_id: tenantId,
        category_id: null, // ou une catégorie par défaut
        requirement_code: 'GEN-001',
        requirement_name: 'Exigence générale',
        description: 'Exigence générique pour actions correctives',
        regulatory_reference: 'Interne',
        priority_level: 'normal',
        status: 'active'
      }])
      .select('id')
      .single();
    
    if (reqError) throw reqError;
    requirementId = newReq.id;
  }

  // 2. Créer un control associé à ce requirement
  const { data: newControl, error: controlError } = await supabase
    .from('compliance_controls')
    .insert([{
      tenant_id: tenantId,
      requirement_id: requirementId,
      control_type: 'corrective',
      control_frequency: 'ponctuel',
      status: 'pending'
    }])
    .select('id')
    .single();
  
  if (controlError) throw controlError;

  // 3. Créer l'action avec un control_id valide
  const { error } = await supabase
    .from('compliance_actions')
    .insert([{
      tenant_id: tenantId,
      action_description: description,
      action_type: titre,
      status: 'pending',
      due_date: echeance || null,
      priority: 'medium',
      control_id: newControl.id  // ✅ UUID valide
    }]);
  
  if (error) throw error;
}
```

---

## Alternative considérée

Une autre approche serait de modifier le schéma de la base de données pour rendre `control_id` nullable, mais cela :
- Nécessite une migration de schéma
- Peut impacter l'intégrité des données existantes
- Est moins aligné avec le modèle de conformité (chaque action devrait être liée à un contrôle)

**Conclusion :** La solution choisie respecte le schéma existant et crée automatiquement les enregistrements parents nécessaires.

---

## Résultat attendu

Après correction :
1. Le bouton "Créer" fonctionnera sans erreur 400
2. Chaque nouvelle action corrective sera liée à un control valide
3. Le modèle de conformité reste cohérent (requirement → control → action)

