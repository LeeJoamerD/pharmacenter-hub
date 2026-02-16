

# Correction du calcul inverse des prix -- coefficient non charge

## Probleme

Dans `PriceEditDialog.tsx` ligne 47, la requete Supabase reference la table `categories_tarification` (avec un "s") alors que la table reelle s'appelle `categorie_tarification` (sans "s"). La requete echoue silencieusement (grace a `maybeSingle()`), donc `categorieData` reste `null` et le coefficient retombe a la valeur par defaut de 1. Resultat : Prix Achat = HT / 1 = HT, ce qui est faux.

Verification en base : le produit PARACETAMOL UBI 500MG est bien dans la categorie MEDICAMENTS avec `coefficient_prix_vente = 1.41`.

## Correction

### Fichier : `src/components/dashboard/modules/sales/pos/PriceEditDialog.tsx`

Ligne 47 : remplacer `categories_tarification` par `categorie_tarification` dans la requete Supabase.

```
// Avant (incorrect)
.select('categorie_tarification_id, categorie_tarification:categories_tarification(coefficient_prix_vente, taux_tva, taux_centime_additionnel)')

// Apres (correct)
.select('categorie_tarification_id, categorie_tarification:categorie_tarification(coefficient_prix_vente, taux_tva, taux_centime_additionnel)')
```

C'est la seule modification necessaire. Le reste du code (calcul inverse, affichage, mise a jour DB) est correct -- il manquait simplement les bonnes donnees en entree.

### Resultat attendu

Pour PARACETAMOL UBI 500MG avec TTC = 10 000, TVA = 0%, coefficient = 1.41 :
- Prix HT = 10 000 FCFA (car TVA = 0%)
- TVA = 0 FCFA
- Centime Add. = 0 FCFA
- Prix Achat = 10 000 / 1.41 = **7 092 FCFA**

