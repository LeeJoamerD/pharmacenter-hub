

# Plan: Localisation des onglets + Nouveaux types de sessions d'inventaire

## 1. Localisation des titres d'onglets (Bug fix)

Le composant `InventorySessions.tsx` contient environ 60+ chaines codees en dur en francais (titres, boutons, labels, placeholders). Il faut:

- Importer `useLanguage` dans `InventorySessions.tsx`
- Ajouter toutes les cles de traduction manquantes dans `LanguageContext.tsx` (FR, EN, ES, LN)
- Remplacer toutes les chaines codees en dur par des appels `t('cle')`

Exemples de chaines a localiser:
- "Sessions d'Inventaire", "Nouvelle Session", "Creer une Session d'Inventaire"
- "Complet", "Partiel", "Cyclique", "Planifiee", "En cours", "Terminee", "Suspendue"
- "Responsable", "Participants", "Description", "Nom", tous les labels de filtres

## 2. Deux nouveaux types de sessions d'inventaire

### Architecture proposee

Ajout de 2 nouveaux types dans le selecteur de type de session:

| Type | Valeur DB | Description |
|------|-----------|-------------|
| Inventaire Reception | `reception` | Inventorier les produits d'une reception fournisseur |
| Inventaire Vente | `vente` | Inventorier les produits vendus pendant une session de caisse |

### Schema de donnees

Migration SQL pour ajouter 2 colonnes a `inventaire_sessions`:

```text
reception_id UUID (FK -> receptions_fournisseurs.id, nullable)
session_caisse_id UUID (FK -> sessions_caisse.id, nullable)
```

### Flux utilisateur - Type "Reception"

1. L'utilisateur selectionne le type "Inventaire Reception"
2. Un champ de recherche apparait pour chercher une reception (par numero, fournisseur, date)
3. Une fois la reception selectionnee, le systeme affiche un resume (numero, fournisseur, date, nb produits)
4. A la creation, le systeme pre-charge automatiquement dans `inventaire_items` les produits de cette reception avec:
   - `quantite_theorique` = quantite initiale AVANT reception + quantite recue (y compris unites gratuites) = stock final theorique
   - Les colonnes affichees: Produit | Lot | Qty Initiale (avant reception) | Qty Recue | Final Theorique | Final Reelle (a saisir)

### Flux utilisateur - Type "Vente"

1. L'utilisateur selectionne le type "Inventaire Session de Vente"
2. Un champ de recherche apparait pour chercher une session de caisse (par numero, caissier, date)
3. Une fois la session selectionnee, le systeme affiche un resume (numero, caissier, date, nb ventes)
4. A la creation, le systeme pre-charge dans `inventaire_items` les produits vendus avec:
   - `quantite_theorique` = stock initial AVANT les ventes de cette session - quantites vendues = stock final theorique
   - Les colonnes affichees: Produit | Lot | Qty Initiale (avant ventes) | Qty Vendues | Final Theorique | Final Reelle (a saisir)

### Composants de saisie specialises

Pour la saisie (onglet "Saisie Inventaire"), quand une session de type `reception` ou `vente` est selectionnee, le tableau affiche des colonnes specifiques au lieu du format generique:

- **Reception**: Produit | Lot | Stock Avant Reception | Qty Recue | Stock Theorique | Stock Reel | Ecart
- **Vente**: Produit | Lot | Stock Avant Ventes | Qty Vendues | Stock Theorique | Stock Reel | Ecart

---

## Details techniques

### Fichiers modifies/crees

| Fichier | Action |
|---------|--------|
| `LanguageContext.tsx` | Ajouter ~40 cles de traduction pour les sessions d'inventaire (4 langues) |
| `InventorySessions.tsx` | Localiser toutes les chaines + ajouter les 2 nouveaux types avec UI de selection reception/session caisse |
| `useInventorySessions.ts` | Ajouter `reception_id` et `session_caisse_id` dans le type et la creation |
| `InventoryEntry.tsx` | Adapter l'affichage des colonnes selon le type de session |
| Migration SQL | Ajouter colonnes `reception_id`, `session_caisse_id` + modifier `inventaire_items` pour stocker `quantite_initiale` et `quantite_mouvement` |
| `useInventoryEntry.ts` | Ajouter la logique de pre-chargement des produits depuis reception ou ventes |

### Migration SQL

```text
ALTER TABLE inventaire_sessions
  ADD COLUMN reception_id UUID REFERENCES receptions_fournisseurs(id),
  ADD COLUMN session_caisse_id UUID REFERENCES sessions_caisse(id);

ALTER TABLE inventaire_items
  ADD COLUMN quantite_initiale INTEGER DEFAULT 0,
  ADD COLUMN quantite_mouvement INTEGER DEFAULT 0;

NOTIFY pgrst, 'reload schema';
```

- `quantite_initiale`: stock avant l'evenement (reception ou vente)
- `quantite_mouvement`: quantite recue ou vendue
- `quantite_theorique`: stock final attendu (= initiale + mouvement pour reception, = initiale - mouvement pour vente)

### Logique de pre-chargement (dans useInventoryEntry ou hook dedie)

**Pour type "reception"**:
- Requete `lignes_reception_fournisseur` filtree par `reception_id`
- Pour chaque ligne: recuperer le lot associe, calculer `quantite_initiale = lot.quantite_restante - quantite_recue`, `quantite_mouvement = quantite_recue`

**Pour type "vente"**:
- Requete `lignes_ventes` JOIN `ventes` filtree par `session_caisse_id`
- Agreger par produit/lot: `quantite_mouvement = SUM(quantite)`, `quantite_initiale = lot.quantite_restante + quantite_mouvement`

