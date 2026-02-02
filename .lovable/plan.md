
# Plan - Gestion des erreurs sans blocage de l'import

## Problème identifié

L'erreur `duplicate key value violates unique constraint "lots_tenant_id_numero_lot_produit_id_key"` (code 23505) bloque toute la création de réception car le code actuel utilise `throw lotError` qui stoppe l'exécution.

**Code actuel (ligne 446-452 de `useReceptions.ts`)** :
```typescript
const { data: newLot, error: lotError } = await supabase
  .from('lots')
  .insert(lotData as any)
  .select('id')
  .single();

if (lotError) throw lotError;  // ← BLOQUE TOUT L'IMPORT
```

---

## Solution proposée

Implémenter une gestion des erreurs qui :
1. Capture les erreurs par ligne individuellement
2. Ignore les lignes en erreur (notamment les doublons)
3. Continue le traitement des autres lignes
4. Affiche un rapport final indiquant les lignes ignorées

---

## Modifications à effectuer

### Fichier : `src/hooks/useReceptions.ts`

#### 1. Ajouter un compteur de lignes ignorées (après ligne 286)

```typescript
const lotsToInsert: any[] = [];
const lotsToUpdate: { id: string; quantite_restante: number; updateData: any }[] = [];
const mouvementsToInsert: any[] = [];
const produitsToUpdate: { id: string; updateData: any }[] = [];
const skippedLines: { produit_id: string; numero_lot: string; reason: string }[] = []; // NOUVEAU
```

#### 2. Remplacer le throw par une gestion gracieuse (lignes 446-454)

**Avant** :
```typescript
const { data: newLot, error: lotError } = await supabase
  .from('lots')
  .insert(lotData as any)
  .select('id')
  .single();

if (lotError) throw lotError;
```

**Après** :
```typescript
const { data: newLot, error: lotError } = await supabase
  .from('lots')
  .insert(lotData as any)
  .select('id')
  .single();

// Gestion gracieuse des erreurs - ignorer la ligne et continuer
if (lotError) {
  // Erreur 23505 = duplicate key constraint violation
  if (lotError.code === '23505') {
    console.warn(`⚠️ Lot dupliqué ignoré: produit=${ligneInfo.produit_id}, lot=${lotData.numero_lot}`);
    skippedLines.push({
      produit_id: ligneInfo.produit_id,
      numero_lot: lotData.numero_lot,
      reason: 'Lot déjà existant (doublon)'
    });
    continue; // Passer à la ligne suivante sans bloquer
  }
  // Pour les autres erreurs, log et continuer aussi
  console.error('❌ Erreur création lot (ignorée):', lotError);
  skippedLines.push({
    produit_id: ligneInfo.produit_id,
    numero_lot: lotData.numero_lot,
    reason: lotError.message || 'Erreur inconnue'
  });
  continue;
}
```

#### 3. Modifier le message de succès final (lignes 501-504)

**Avant** :
```typescript
toast({
  title: "Succès",
  description: "Réception enregistrée avec succès",
});
```

**Après** :
```typescript
// Message de succès avec indication des lignes ignorées
const successCount = lotsToInsert.length - skippedLines.length + lotsToUpdate.length;
const skippedCount = skippedLines.length;

if (skippedCount > 0) {
  toast({
    title: "Réception enregistrée avec avertissements",
    description: `${successCount} lot(s) créé(s), ${skippedCount} ligne(s) ignorée(s) (doublons)`,
    variant: "default",
  });
  console.log('📋 Lignes ignorées:', skippedLines);
} else {
  toast({
    title: "Succès",
    description: `Réception enregistrée avec succès (${successCount} lot(s))`,
  });
}
```

---

## Flux de traitement après modification

```text
┌─────────────────────────────────────┐
│  Boucle sur les lots à insérer     │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Insertion lot dans Supabase       │
└─────────────┬───────────────────────┘
              │
       ┌──────┴──────┐
       │             │
    Succès        Erreur
       │             │
       ▼             ▼
┌──────────────┐  ┌──────────────────────────────┐
│ Créer        │  │ Code 23505 (doublon)?        │
│ mouvement    │  │   OUI → Log + skippedLines   │
│              │  │         + continue           │
└──────────────┘  │   NON → Log + skippedLines   │
                  │         + continue           │
                  └──────────────────────────────┘
                              │
                              ▼
                  ┌─────────────────────────────┐
                  │  Ligne suivante...          │
                  └─────────────────────────────┘
```

---

## Fichiers modifiés

| Fichier | Modifications |
|---------|---------------|
| `src/hooks/useReceptions.ts` | Gestion try-catch par lot, compteur de lignes ignorées, message toast adaptatif |

---

## Résultat attendu

1. **Import résilient** : Les erreurs de doublons n'arrêtent plus tout l'import
2. **Traçabilité** : Les lignes ignorées sont loggées dans la console
3. **Feedback utilisateur** : Un message indique combien de lots ont été créés vs ignorés
4. **Continuité** : Le reste des lignes valides est traité normalement

---

## Note technique

Cette approche est conforme à la recommandation du Stack Overflow qui suggère d'utiliser `upsert` avec `ignoreDuplicates: true`. Cependant, comme nous avons besoin de l'ID du lot créé pour les mouvements (`newLot.id`), une approche try-catch avec `continue` est plus adaptée ici.
