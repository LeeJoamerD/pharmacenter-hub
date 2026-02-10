

# Correction du calcul theorique dans la fonction RPC et le trigger

## Probleme identifie

Le modal de fermeture affiche le bon montant theorique (224 400 FCFA) car il utilise `getSessionBalance` (corrige). Mais quand on clique "Fermer la Session", le code appelle la fonction RPC PostgreSQL `calculate_expected_closing` pour calculer la valeur sauvegardee en base. Cette fonction a le meme bug : elle fait un simple `SUM(montant)` sur tous les mouvements sans soustraire les sorties.

De plus, un trigger `trg_calculate_closing` appelle aussi cette fonction automatiquement quand le statut passe a "Fermee", ce qui ecrase les valeurs.

### Flux actuel (bugge)

```text
Fond: 100 000
+ Ventes: 125 700
+ Depenses: 1 300   <-- devrait etre soustrait
= Theorique: 227 000  (faux, sauvegarde en base)
```

### Flux attendu

```text
Fond: 100 000
+ Ventes: 125 700
- Depenses: 1 300
= Theorique: 224 400  (correct)
```

## Corrections prevues

### 1. Migration SQL : corriger `calculate_expected_closing`

Remplacer le simple `SUM(montant)` par un calcul qui soustrait les mouvements sortants :

```sql
SELECT COALESCE(SUM(
  CASE 
    WHEN type_mouvement IN ('Sortie', 'Remboursement', 'Dépense') THEN -montant
    ELSE montant
  END
), 0) INTO v_total_mouvements
FROM public.mouvements_caisse
WHERE session_caisse_id = p_session_id
  AND tenant_id = v_tenant_id
  AND type_mouvement != 'Fond_initial';
```

Terminer par `NOTIFY pgrst, 'reload schema';` comme requis.

### 2. Corriger la valeur en base pour la session actuelle

Utiliser l'outil d'insertion/update pour corriger les valeurs de la session deja fermee avec les bonnes valeurs (montant theorique = 224 400, ecart = 224 350 - 224 400 = -50).

### 3. Optionnel : simplifier `closeSession` dans useCashRegister.ts

Le code appelle le RPC puis sauvegarde les valeurs, mais le trigger recalcule aussi. On pourrait simplifier en laissant le trigger faire le travail, mais ce n'est pas indispensable pour cette correction. Les deux chemins utiliseront desormais la meme formule corrigee.

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| Nouvelle migration SQL | Corriger la fonction `calculate_expected_closing` pour soustraire les mouvements sortants |
| Base de donnees (update) | Corriger les valeurs `montant_theorique_fermeture` et `ecart` de la session deja fermee |

