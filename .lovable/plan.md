
# Ameliorations du formulaire de reception (Module Stock/Approvisionnement/Reception)

## 3 modifications a apporter dans `src/components/dashboard/modules/stock/ReceptionForm.tsx`

### 1. Rendre le champ "Bon de livraison" obligatoire

- Ajouter un asterisque (*) au label du champ `bonLivraison` (ligne 1017)
- Ajouter `bonLivraison.trim()` comme condition de desactivation des boutons "Sauvegarder" et "Valider Reception" (lignes 1380 et 1387)
- Ajouter une verification au debut de `handleSaveReception` : si `bonLivraison` est vide, afficher un toast d'erreur et bloquer

### 2. Ajouter un indicateur de progression pendant la validation

Reprendre le meme pattern que dans `ReceptionExcelImport.tsx` :
- Ajouter un state `processingStep` (string) pour decrire l'etape en cours
- Mettre a jour `processingStep` a chaque etape de `handleSaveReception` :
  - "Verification des donnees..." 
  - "Creation de la reception..."
  - "Mise a jour du stock..."
  - "Finalisation..."
- Afficher un bloc `Alert` (bleu, avec icone Loader2 animee et barre de progression) juste au-dessus des boutons d'action quand `isProcessing` est true
- Meme style visuel que dans ReceptionExcelImport : fond bleu, barre de progression animee

### 3. Interdire les doublons de numero de bon de livraison

- Dans `handleSaveReception`, avant de creer la reception, ajouter une requete Supabase :
  ```
  SELECT id FROM receptions_fournisseurs 
  WHERE reference_facture = bonLivraison 
  AND tenant_id = (tenant de l'utilisateur)
  LIMIT 1
  ```
- Si un resultat est trouve, afficher un toast d'erreur "Un bon de livraison avec ce numero existe deja" et bloquer la validation
- Cette verification sera aussi ajoutee dans `handleConfirmWithWarnings` et `handleConfirmZeroWarning` (les 3 chemins de sauvegarde)

## Details techniques

### Fichier modifie
| Fichier | Action |
|---|---|
| `src/components/dashboard/modules/stock/ReceptionForm.tsx` | Modifier - champ obligatoire, progression, doublon |

### Imports a ajouter
- `Loader2` depuis `lucide-react`
- `Alert, AlertTitle, AlertDescription` depuis `@/components/ui/alert`

### Aucune modification SQL necessaire
La verification de doublon se fait via une simple requete SELECT sur `receptions_fournisseurs.reference_facture` existant.
