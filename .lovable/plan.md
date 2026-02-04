

# Correction des erreurs 400 - Module Rapports Comparatifs

## Diagnostic

Les erreurs 400 Bad Request dans le module "Analyses Comparatives" sont causées par des noms de colonnes et relations incorrects dans les requêtes Supabase du hook `useComparativeReports.ts`.

### Erreurs dans la requête actuelle :
```
select=montant_ligne,produits(famille_produit_id,famille_produit(libelle_famille)),ventes!inner(...)
```

### Colonnes/relations incorrectes :
| Utilisé | Correct |
|---------|---------|
| `montant_ligne` | `montant_ligne_ttc` |
| `famille_produit_id` | `famille_id` |

---

## Modifications à implémenter

### Fichier : `src/hooks/useComparativeReports.ts`

#### Modification 1 - Query categoryQuery période courante (lignes 223-233)

**Avant :**
```typescript
const { data: currentSales } = await supabase
  .from('lignes_ventes')
  .select(`
    montant_ligne,
    produits(famille_produit_id, famille_produit(libelle_famille)),
    ventes!inner(tenant_id, statut, date_vente)
  `)
  .eq('ventes.tenant_id', tenantId)
  .eq('ventes.statut', 'Validée')
  .gte('ventes.date_vente', format(dateRanges.current.start, 'yyyy-MM-dd'))
  .lte('ventes.date_vente', format(dateRanges.current.end, 'yyyy-MM-dd'));
```

**Après :**
```typescript
const { data: currentSales } = await supabase
  .from('lignes_ventes')
  .select(`
    montant_ligne_ttc,
    produits(famille_id, famille_produit(libelle_famille)),
    ventes!inner(tenant_id, statut, date_vente)
  `)
  .eq('ventes.tenant_id', tenantId)
  .eq('ventes.statut', 'Validée')
  .gte('ventes.date_vente', format(dateRanges.current.start, 'yyyy-MM-dd'))
  .lte('ventes.date_vente', format(dateRanges.current.end, 'yyyy-MM-dd'));
```

#### Modification 2 - Query categoryQuery période précédente (lignes 235-245)

**Avant :**
```typescript
const { data: previousSales } = await supabase
  .from('lignes_ventes')
  .select(`
    montant_ligne,
    produits(famille_produit_id, famille_produit(libelle_famille)),
    ventes!inner(tenant_id, statut, date_vente)
  `)
  .eq('ventes.tenant_id', tenantId)
  .eq('ventes.statut', 'Validée')
  .gte('ventes.date_vente', format(dateRanges.previous.start, 'yyyy-MM-dd'))
  .lte('ventes.date_vente', format(dateRanges.previous.end, 'yyyy-MM-dd'));
```

**Après :**
```typescript
const { data: previousSales } = await supabase
  .from('lignes_ventes')
  .select(`
    montant_ligne_ttc,
    produits(famille_id, famille_produit(libelle_famille)),
    ventes!inner(tenant_id, statut, date_vente)
  `)
  .eq('ventes.tenant_id', tenantId)
  .eq('ventes.statut', 'Validée')
  .gte('ventes.date_vente', format(dateRanges.previous.start, 'yyyy-MM-dd'))
  .lte('ventes.date_vente', format(dateRanges.previous.end, 'yyyy-MM-dd'));
```

#### Modification 3 - Mise à jour des références dans le traitement des données (lignes 251-258)

**Avant :**
```typescript
(currentSales as any[])?.forEach(ligne => {
  const cat = ligne.produits?.famille_produit?.libelle_famille || 'Autre';
  currentByCategory.set(cat, (currentByCategory.get(cat) || 0) + (ligne.montant_ligne || 0));
});

(previousSales as any[])?.forEach(ligne => {
  const cat = ligne.produits?.famille_produit?.libelle_famille || 'Autre';
  previousByCategory.set(cat, (previousByCategory.get(cat) || 0) + (ligne.montant_ligne || 0));
});
```

**Après :**
```typescript
(currentSales as any[])?.forEach(ligne => {
  const cat = ligne.produits?.famille_produit?.libelle_famille || 'Autre';
  currentByCategory.set(cat, (currentByCategory.get(cat) || 0) + (ligne.montant_ligne_ttc || 0));
});

(previousSales as any[])?.forEach(ligne => {
  const cat = ligne.produits?.famille_produit?.libelle_famille || 'Autre';
  previousByCategory.set(cat, (previousByCategory.get(cat) || 0) + (ligne.montant_ligne_ttc || 0));
});
```

---

## Résumé des corrections

| Ligne | Avant | Après |
|-------|-------|-------|
| 225 | `montant_ligne` | `montant_ligne_ttc` |
| 226 | `famille_produit_id` | `famille_id` |
| 237 | `montant_ligne` | `montant_ligne_ttc` |
| 238 | `famille_produit_id` | `famille_id` |
| 253 | `ligne.montant_ligne` | `ligne.montant_ligne_ttc` |
| 258 | `ligne.montant_ligne` | `ligne.montant_ligne_ttc` |

---

## Fichier impacté

| Fichier | Modifications |
|---------|---------------|
| `src/hooks/useComparativeReports.ts` | Correction des noms de colonnes dans les requêtes et le traitement |

---

## Validation

Après les corrections :
1. Le dashboard "Analyses Comparatives" se chargera sans erreur 400
2. L'onglet "Temporel" affichera les données correctement
3. L'onglet "Catégories" affichera la performance par famille de produits

