

# Plan de correction - Affichage DCI et date d'expiration sur étiquettes lots

## Diagnostic

Après analyse, j'ai identifié **deux problèmes distincts** :

### 1. Données manquantes dans la base de données (problème principal)

Le lot que vous avez imprimé (`LOT-UBIP-260201-00001` / `LOT-3443873-260201-001`) a :
- **DCI = null** : Le produit associé (VENTOLINE BUCC FL AERO 200DOSE, id: `565366e8-...`) n'a pas de DCI enregistré
- **Date d'expiration = null** : Le lot n'a pas de date de péremption saisie

Même si les options sont cochées, le code ne peut pas afficher des informations qui n'existent pas.

### 2. Problème UX - Aucun feedback visuel

Lorsque le DCI ou la date d'expiration sont manquants, l'utilisateur ne sait pas pourquoi ils n'apparaissent pas sur l'étiquette.

---

## Solutions proposées

### Solution A : Améliorer le feedback dans le tableau (recommandé)

Afficher visuellement dans le tableau des lots quand les données sont manquantes, pour que l'utilisateur sache à l'avance ce qui sera affiché sur l'étiquette.

**Fichier** : `src/components/dashboard/modules/stock/labels/LabelPrintingTab.tsx`

| Colonne | Modification |
|---------|--------------|
| DCI | Afficher le DCI s'il existe, sinon afficher un badge "N/A" ou "-" |
| Expiration | Afficher la date si elle existe, sinon afficher "Non définie" |

### Solution B : Afficher un texte par défaut sur l'étiquette

Lorsque les données sont manquantes, afficher un texte par défaut comme "DCI: N/A" ou "Exp: N/A" au lieu de ne rien afficher.

**Fichier** : `src/utils/labelPrinterEnhanced.ts`

Modifier `drawLotLabel()` pour :
- Si `config.includeDci` est coché mais `lot.dci` est null → afficher "DCI: -"
- Si `config.includeExpiry` est coché mais `lot.date_peremption` est null → afficher "Exp: -"

---

## Implémentation détaillée

### 1. Ajouter une colonne DCI dans le tableau des lots

**Fichier** : `src/components/dashboard/modules/stock/labels/LabelPrintingTab.tsx`

Ajouter dans l'en-tête du tableau (section lots) :
```tsx
<TableHead>DCI</TableHead>
```

Ajouter dans les lignes du tableau :
```tsx
<TableCell>
  {lot.produit.dci_nom || <span className="text-muted-foreground">-</span>}
</TableCell>
```

### 2. Afficher un indicateur visuel pour les dates manquantes

Modifier la cellule "Expiration" existante pour afficher clairement "N/D" quand il n'y a pas de date.

### 3. Modifier `drawLotLabel()` pour gérer les valeurs nulles

```typescript
// DCI (afficher si option cochée)
if (config.includeDci) {
  pdf.setFontSize(5);
  pdf.setFont('helvetica', 'italic');
  const dciText = lot.dci ? truncateText(lot.dci, 30) : '-';
  pdf.text(dciText, innerX + innerWidth / 2, currentY + 2, { align: 'center' });
  currentY += 3;
}

// Date expiration (afficher si option cochée)
if (config.includeExpiry) {
  pdf.setFont('helvetica', 'normal');
  const expDate = lot.date_peremption 
    ? formatExpiryDate(lot.date_peremption) 
    : 'N/D';
  pdf.text(`Exp: ${expDate}`, innerX + innerWidth, currentY + 2.5, { align: 'right' });
}
```

---

## Fichiers à modifier

| Fichier | Modifications |
|---------|---------------|
| `src/utils/labelPrinterEnhanced.ts` | Afficher DCI/date même si null (avec texte "-" ou "N/D") quand l'option est cochée |
| `src/components/dashboard/modules/stock/labels/LabelPrintingTab.tsx` | Ajouter colonne DCI + indicateurs visuels dans le tableau des lots |

---

## Résultat attendu

1. **Tableau des lots** : Affiche clairement quelles données sont présentes ou manquantes
2. **Étiquettes** : Si l'option est cochée, l'élément apparaît toujours sur l'étiquette (avec "-" ou "N/D" si données manquantes)
3. **Transparence** : L'utilisateur comprend immédiatement pourquoi certaines infos n'apparaissent pas

---

## Note importante

Pour que le DCI et la date d'expiration apparaissent correctement, il faudra également :
- Associer un DCI au produit dans le module Catalogue
- Saisir la date d'expiration lors de la réception du lot dans le module Approvisionnement

