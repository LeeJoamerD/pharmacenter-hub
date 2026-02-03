
# Correction du Modal "Détails du Retour"

## Problemes Identifiés

### 1. Motif du retour affiché incorrectement
Le modal du Point de Vente (`ReturnExchangeModal.tsx`) utilise un motif fixe "Retour client" au lieu du motif saisi par l'utilisateur.

**Cause technique** : Ligne 103 du fichier `src/components/dashboard/modules/pos/ReturnExchangeModal.tsx` :
```typescript
motif_retour: 'Retour client', // Valeur fixe
```

Le motif saisi par l'utilisateur (ex: "Erreur") est stocké dans `motif_ligne` (motif par ligne de retour), mais le motif global du retour reste "Retour client".

### 2. Produits non affichés dans le modal de détails
Les produits existent en base de données mais ne s'affichent pas car :
- La requête Supabase retourne `lignes_retours` (nom de la table)
- L'interface `Return` attend `lignes`
- Le mapping n'est pas effectué entre les deux noms

---

## Solution Proposée

### Partie A : Corriger le motif du retour dans le POS

**Fichier** : `src/components/dashboard/modules/pos/ReturnExchangeModal.tsx`

1. Ajouter un champ de saisie pour le motif global
2. Utiliser le premier motif saisi si un seul article, ou demander une raison globale

```text
+--------------- Avant ----------------+--------------- Après ----------------+
| motif_retour: 'Retour client'        | motif_retour: globalReason ||        |
|                                      |   itemsToReturn[0].reason            |
+--------------------------------------+--------------------------------------+
```

### Partie B : Corriger l'affichage des produits dans le modal

**Fichier** : `src/hooks/useReturnsExchanges.ts`

Mapper `lignes_retours` vers `lignes` après la requête pour correspondre à l'interface `Return`.

**Fichier** : `src/components/dashboard/modules/sales/returns/ReturnDetailsModal.tsx`

S'assurer que le modal affiche toujours la section produits (même si vide avec un message explicite).

---

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/dashboard/modules/pos/ReturnExchangeModal.tsx` | Ajouter un champ pour le motif global et l'utiliser au lieu de la valeur fixe |
| `src/hooks/useReturnsExchanges.ts` | Mapper `lignes_retours` vers `lignes` dans la réponse |
| `src/components/dashboard/modules/sales/returns/ReturnDetailsModal.tsx` | Afficher toujours la section produits, corriger le fallback et améliorer l'affichage |

---

## Details Techniques

### 1. Modification `ReturnExchangeModal.tsx`

Ajouter un état pour la raison globale et un Select pour la saisir :
```typescript
const [globalReason, setGlobalReason] = useState('');

// Dans le JSX : ajouter un Select avant le bouton Enregistrer
<Select value={globalReason} onValueChange={setGlobalReason}>
  ...options...
</Select>

// À la soumission :
motif_retour: globalReason || itemsToReturn[0]?.reason || 'Retour client',
```

### 2. Modification `useReturnsExchanges.ts`

Mapper les données après la requête :
```typescript
const mappedData = data.map(retour => ({
  ...retour,
  lignes: retour.lignes_retours, // Mapper vers le nom attendu
}));
return { returns: mappedData, total: count || 0 };
```

### 3. Modification `ReturnDetailsModal.tsx`

Afficher toujours la section produits :
```typescript
{/* Articles retournés - toujours afficher cette section */}
<Separator />
<div>
  <Label>Articles retournés</Label>
  {returnData.lignes && returnData.lignes.length > 0 ? (
    <Table>...</Table>
  ) : (
    <p>Aucun article détaillé</p>
  )}
</div>
```

---

## Résultat Attendu

Après correction :
- Le motif affiché correspondra à ce que l'utilisateur a saisi ("Erreur" dans votre cas)
- Les produits concernés par le retour seront visibles dans le modal de détails
- L'interface sera cohérente entre le Point de Vente et le module Retours
