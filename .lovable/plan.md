
# Fix: Modal "Nouveau Reapprovisionnement" - Fournisseurs et Navigation

## Probleme

Le modal `QuickSupplyDialog.tsx` a 3 problemes :

1. **Liste fournisseurs factice** : La liste deroulante affiche des valeurs codees en dur (`Supplier A`, `Supplier B`) au lieu de charger les fournisseurs reels du tenant depuis la table `fournisseurs`.
2. **Bouton "Page complete" -> 404** : Utilise `navigate('/stock/approvisionnement')` au lieu de `navigateToModule`.
3. **Redirection post-soumission -> 404** : Apres creation de la commande, meme probleme de navigation.

## Solution

### Modifier `src/components/dashboard/modules/stock/dashboard/dialogs/QuickSupplyDialog.tsx`

**A. Charger les fournisseurs reels du tenant**

- Ajouter un `useEffect` ou `useQuery` pour recuperer les fournisseurs depuis Supabase au chargement du modal (meme pattern que `EmergencyOrderModal.tsx` qui fonctionne deja correctement)
- Requete : `supabase.from('fournisseurs').select('id, nom').eq('tenant_id', tenantId).eq('statut', 'actif').order('nom')`
- Recuperer le `tenant_id` via `personnel` + `auth.getUser()` comme dans les autres composants
- Remplacer les `<SelectItem>` en dur par un `.map()` sur les fournisseurs charges

**B. Corriger les 2 navigations**

- Remplacer `useNavigate` par `useNavigation` du `NavigationContext`
- Bouton "Page complete" : `navigateToModule('stock', 'approvisionnement')`
- Post-soumission : `navigateToModule('stock', 'approvisionnement')`

## Section technique

### Imports a modifier

```text
SUPPRIMER : import { useNavigate } from 'react-router-dom'
AJOUTER  : import { useNavigation } from '@/contexts/NavigationContext'
AJOUTER  : import { useEffect } from 'react'
```

### Chargement des fournisseurs (pattern identique a EmergencyOrderModal)

- Ajouter un state `suppliers` et un `useEffect` qui fetch les fournisseurs quand le modal s'ouvre
- Remplacer les SelectItem statiques par un mapping dynamique sur les fournisseurs charges
- Afficher un message de chargement si les donnees ne sont pas encore pretes

### Mapping navigation

```text
AVANT                                      APRES
navigate('/stock/approvisionnement')    -> navigateToModule('stock', 'approvisionnement')
```

Les deux appels (ligne 86 post-submit et ligne 102 bouton "Page complete") sont concernes.

### Fichier modifie

- `src/components/dashboard/modules/stock/dashboard/dialogs/QuickSupplyDialog.tsx`

Aucune migration SQL necessaire.
