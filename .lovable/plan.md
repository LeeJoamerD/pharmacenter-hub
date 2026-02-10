

# Correction du bouton de connexion utilisateur en mode smartphone

## Probleme

Dans le Header mobile (lignes 175-207), un `if/else if/else` a trois branches controle l'icone affichee :
1. Si un **utilisateur** est connecte : affiche l'avatar utilisateur
2. Sinon, si une **pharmacie** est connectee : affiche l'icone pharmacie (Building2)
3. Sinon : affiche l'icone de connexion utilisateur (User)

Le probleme : quand une pharmacie est connectee **sans utilisateur**, la branche 2 s'active et l'icone User disparait completement. L'utilisateur ne peut plus acceder a la page de connexion.

Le meme probleme existe dans le menu hamburger (lignes 278-295) : quand une pharmacie est connectee, le menu ne montre que les infos pharmacie et le bouton de deconnexion, sans option "Se connecter".

## Correction prevue

### 1. Zone des icones mobiles (avant le bouton hamburger)

Remplacer le `if/else if/else` par une logique qui affiche **toujours** l'icone de connexion utilisateur quand aucun utilisateur n'est connecte, meme si une pharmacie est connectee :

```text
Avant :  user ? Avatar : pharmacy ? Building2 : User
Apres :  user ? Avatar : User    (toujours visible)
```

L'icone Building2 seule dans le header n'apportait pas de valeur (elle ne faisait rien au clic). Elle sera supprimee de cette zone.

### 2. Menu hamburger mobile (section deroulante)

Quand une pharmacie est connectee mais pas d'utilisateur, ajouter le bouton "Se connecter" en plus des infos pharmacie :

```text
Avant (pharmacie connectee) :
  - Infos pharmacie
  - Deconnecter pharmacie

Apres (pharmacie connectee, pas d'utilisateur) :
  - Infos pharmacie
  - Bouton "Se connecter" (vers /user-login)
  - Bouton "Connexion Pharmacie" (vers /pharmacy-connection)
  - Deconnecter pharmacie
```

### Fichier modifie

| Fichier | Modification |
|---------|-------------|
| `src/components/Header.tsx` | Lignes 175-207 : remplacer le ternaire triple par un affichage conditionnel qui montre toujours l'icone User quand pas d'utilisateur connecte. Lignes 278-295 : ajouter les options de connexion utilisateur dans le menu hamburger quand pharmacie connectee |

