

# Correction des erreurs 400 - Module Rapports Clients

## Diagnostic des erreurs

### Erreur 1 : Requête clients avec assureurs
```
clients?select=id,assureur_id,taux_couverture,assureurs(id,nom)&assureur_id=not.is.null
```
**Problème** : La colonne `nom` n'existe pas dans la table `assureurs`. La bonne colonne est `libelle_assureur`.

### Erreur 2 : Requête ventes avec clients
```
ventes?select=client_id,montant_net,date_vente,clients(id,nom,prenom,type_client)&client_id=not.is.null
```
**Problème** : Les colonnes `nom` et `prenom` n'existent pas dans la table `clients`. La bonne colonne est `nom_complet`.

### Erreur 3 : Filtre in.(none)
```
ventes?select=client_id,montant_net&client_id=in.(none)
```
**Problème** : `['none']` est une syntaxe invalide pour PostgREST. Si aucun ID n'est disponible, la requête ne devrait pas être exécutée ou utiliser un tableau vide.

---

## Schema de la base de données

| Table | Colonnes existantes | Colonnes utilisées (erreur) |
|-------|--------------------|-----------------------------|
| `assureurs` | `id`, `libelle_assureur` | ~~`nom`~~ |
| `clients` | `id`, `nom_complet`, `type_client` | ~~`nom`, `prenom`~~ |

---

## Modifications à implémenter

### Fichier : `src/hooks/useCustomerReports.ts`

#### Modification 1 - Corriger insuranceQuery (lignes 293-313)

**Avant :**
```typescript
const { data: clients } = await supabase
  .from('clients')
  .select(`
    id,
    assureur_id,
    taux_couverture,
    assureurs(id, nom)
  `)
  .eq('tenant_id', tenantId)
  .not('assureur_id', 'is', null);

// ...
const { data: ventes } = await supabase
  .from('ventes')
  .select('client_id, montant_net')
  .eq('tenant_id', tenantId)
  .eq('statut', 'Validée')
  .in('client_id', clientIds.length > 0 ? clientIds : ['none']);
```

**Après :**
```typescript
const { data: clients } = await supabase
  .from('clients')
  .select(`
    id,
    assureur_id,
    taux_couverture,
    assureurs(id, libelle_assureur)
  `)
  .eq('tenant_id', tenantId)
  .not('assureur_id', 'is', null);

// ...
// Si pas de clients assurés, retourner tableau vide
if (clientIds.length === 0) {
  return [];
}

const { data: ventes } = await supabase
  .from('ventes')
  .select('client_id, montant_net')
  .eq('tenant_id', tenantId)
  .eq('statut', 'Validée')
  .in('client_id', clientIds);
```

#### Modification 2 - Corriger le traitement assureur (lignes 318-324)

**Avant :**
```typescript
clients?.forEach(client => {
  const assureurNom = (client.assureurs as any)?.nom || 'Autre';
  // ...
});
```

**Après :**
```typescript
clients?.forEach(client => {
  const assureurNom = (client.assureurs as any)?.libelle_assureur || 'Autre';
  // ...
});
```

#### Modification 3 - Corriger le traitement ventes (ligne 330)

**Avant :**
```typescript
const assureurNom = (client.assureurs as any)?.nom || 'Autre';
```

**Après :**
```typescript
const assureurNom = (client.assureurs as any)?.libelle_assureur || 'Autre';
```

#### Modification 4 - Corriger topClientsQuery (lignes 358-370)

**Avant :**
```typescript
const { data: ventes } = await supabase
  .from('ventes')
  .select(`
    client_id,
    montant_net,
    date_vente,
    clients(id, nom, prenom, type_client)
  `)
  .eq('tenant_id', tenantId)
  .eq('statut', 'Validée')
  .gte('date_vente', format(dateRange.start, 'yyyy-MM-dd'))
  .lte('date_vente', format(dateRange.end, 'yyyy-MM-dd'))
  .not('client_id', 'is', null);
```

**Après :**
```typescript
const { data: ventes } = await supabase
  .from('ventes')
  .select(`
    client_id,
    montant_net,
    date_vente,
    clients(id, nom_complet, type_client)
  `)
  .eq('tenant_id', tenantId)
  .eq('statut', 'Validée')
  .gte('date_vente', format(dateRange.start, 'yyyy-MM-dd'))
  .lte('date_vente', format(dateRange.end, 'yyyy-MM-dd'))
  .not('client_id', 'is', null);
```

#### Modification 5 - Corriger le traitement du nom client (lignes 384-385)

**Avant :**
```typescript
const existing = clientMap.get(v.client_id) || {
  name: `${client.prenom || ''} ${client.nom || 'Client'}`.trim(),
  // ...
};
```

**Après :**
```typescript
const existing = clientMap.get(v.client_id) || {
  name: client.nom_complet || 'Client',
  // ...
};
```

---

## Résumé des corrections

| Ligne | Avant | Après |
|-------|-------|-------|
| 300 | `assureurs(id, nom)` | `assureurs(id, libelle_assureur)` |
| 313 | `clientIds.length > 0 ? clientIds : ['none']` | Vérification préalable + `clientIds` seul |
| 319 | `client.assureurs?.nom` | `client.assureurs?.libelle_assureur` |
| 330 | `client.assureurs?.nom` | `client.assureurs?.libelle_assureur` |
| 364 | `clients(id, nom, prenom, type_client)` | `clients(id, nom_complet, type_client)` |
| 385 | `` `${client.prenom} ${client.nom}` `` | `client.nom_complet` |

---

## Fichier impacté

| Fichier | Modifications |
|---------|---------------|
| `src/hooks/useCustomerReports.ts` | Correction des noms de colonnes et gestion du tableau vide |

---

## Validation

Après les corrections :
1. Le dashboard "Rapports Clients" se chargera sans erreur 400
2. L'onglet "Segmentation" affichera les données correctement
3. L'onglet "Assurances" listera les assureurs avec leurs noms corrects
4. Le Top Clients affichera les noms complets des clients

