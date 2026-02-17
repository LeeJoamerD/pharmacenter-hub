

# Optimisation de la hauteur des tickets de caisse

## Probleme

Les 3 generateurs de tickets (`receiptPrinter.ts`, `salesTicketPrinter.ts` -- 2 fonctions, `advancedReceiptPrinter.ts`) utilisent des espacements genereux entre les lignes et des hauteurs de page fixes surdimensionnees. Cela gaspille du papier sur les imprimantes thermiques a rouleau.

## Optimisations appliquees (les 3 fichiers)

### 1. Espacement reduit entre les lignes
- Interligne standard : de **4mm** a **3mm**
- Interligne apres sous-section : de **5-6mm** a **4mm**
- Separateurs : de **y += 5** apres ligne a **y += 3**
- Pied de page : de **y += 8** a **y += 4**

### 2. Hauteur de page dynamique
Au lieu d'une hauteur fixe (220mm, 270mm, 297mm), la page sera dimensionnee au contenu reel. Le PDF sera cree avec une hauteur initiale generique, puis **redimensionne a la fin** en utilisant `y + marge` comme hauteur finale. Cela evite les grandes zones blanches en bas du ticket.

### 3. Polices legerement reduites
- En-tete pharmacie : de **12pt** a **10pt**
- Titre "A ENCAISSER" / "RECU" : de **14pt/12pt** a **12pt/10pt**
- "NET A PAYER" / "TOTAL TTC" : de **10-12pt** a **9pt**
- Bandeau colore : hauteur de **12mm** a **9mm**

### 4. Articles sur une seule ligne (quand possible)
Condenser nom du produit et prix sur la meme ligne quand ca tient, au lieu de systematiquement les mettre sur 2 lignes. Format compact :
```
Produit                    2x5000 = 10 000
```
au lieu de :
```
Produit
  2 x 5 000 FCFA = 10 000 FCFA
```

### 5. Suppression des espaces inutiles
- Retirer les `y += 2` et `y += 3` entre sections qui s'accumulent
- Le footer "Conservez ce ticket" fusionne sur la meme ligne que "Merci"

## Fichiers modifies

| Fichier | Modifications |
|---------|--------------|
| `src/utils/receiptPrinter.ts` | Espacement, polices, hauteur dynamique, articles compacts |
| `src/utils/salesTicketPrinter.ts` | Idem pour `printSalesTicket` et `printCashReceipt` |
| `src/utils/advancedReceiptPrinter.ts` | Idem |

## Estimation du gain

Pour un ticket moyen de 3-4 articles :
- Avant : environ 140-160mm de hauteur
- Apres : environ 85-100mm de hauteur
- **Gain : environ 40% de papier economise**

## Details techniques

### Hauteur dynamique (principe)

Le PDF est d'abord cree avec une hauteur maximale (300mm), puis a la fin :
```typescript
// Creer un nouveau doc avec la hauteur exacte
const finalDoc = new jsPDF({ format: [paperWidth, y + 5] });
// Copier le contenu du premier doc
```

Alternative plus simple : garder la grande hauteur mais ca n'affecte pas l'impression thermique (l'imprimante coupe au contenu). L'optimisation des espacements seule suffit pour reduire la consommation de papier.

### Format compact des articles

```typescript
// Ancien: 2 lignes par article (8-9mm)
doc.text(productName, margins.left, y);
y += 4;
doc.text(`${qty} x ${prix} = ${total}`, margins.left + 5, y);
y += 5;

// Nouveau: 1 ligne si possible (3mm), 2 lignes si nom trop long (6mm)
const qtyTotal = `${qty}x${formatShort(total)}`;
const maxNameWidth = margins.right - margins.left - doc.getTextWidth(qtyTotal) - 2;
const truncName = productName.length > 25 ? productName.substring(0, 25) : productName;
doc.text(truncName, margins.left, y);
doc.text(qtyTotal, margins.right, y, { align: 'right' });
y += 3;
```

