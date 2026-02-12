

# Ajout de la configuration VIDAL dans Platform Admin

## Objectif

Creer une section dediee a la base medicamenteuse VIDAL dans la page Configuration de Platform Admin, permettant de gerer les cles API et identifiants VIDAL avec les actions Modifier/Supprimer/Sauvegarder.

## Donnees a enregistrer depuis le PDF

Les credentials suivants seront pre-remplis dans la base `platform_settings` :

| Cle | Valeur | Secret |
|-----|--------|--------|
| VIDAL_APP_ID | 4a795113 | Non |
| VIDAL_APP_KEY | aa8690d575d7ea7f626099ef2f9a6b9c | Oui |
| VIDAL_EDITEUR_LOGIN | editeurs | Non |
| VIDAL_EDITEUR_PASSWORD | e@PJT*BrgUit^piw6PTK2p%5 | Oui |
| VIDAL_DEMO_LOGIN | outil_editeur@vidal.fr | Non |
| VIDAL_DEMO_PASSWORD | outil_editeur_2024 | Oui |
| VIDAL_API_URL | https://api.vidal.fr/rest/api | Non |

## Modifications

### 1. Migration SQL - Inserer les parametres VIDAL

Inserer les 7 lignes ci-dessus dans la table `platform_settings` avec les descriptions appropriees et le flag `is_secret` pour les mots de passe et cles.

### 2. Modifier `PlatformConfiguration.tsx`

Ajouter une carte VIDAL entre les cartes existantes (Email, SMS), qui :
- Filtre les settings dont la cle commence par `VIDAL_`
- Affiche chaque champ avec masquage pour les secrets (oeil/oeil barre)
- Inclut un bouton "Supprimer" par champ pour vider la valeur
- Affiche un lien externe vers la documentation VIDAL (`https://support-editeur.vidal.fr`)
- Ajoute un indicateur de statut dans la section "Etat de la Configuration" en bas de page

Le pattern existant (`renderSettingInput`) sera reutilise tel quel, avec ajout d'un bouton Supprimer (mise a vide du champ) par parametre.

### 3. Aucune modification de layout/routing

La page Configuration existe deja dans le menu Platform Admin et le composant `PlatformConfiguration` est deja rendu. Aucun changement de routing necessaire.

## Details techniques

- La migration utilise `INSERT ... ON CONFLICT DO NOTHING` sur `setting_key` pour eviter les doublons si re-executee
- Les champs secrets utilisent `is_secret = true` pour le masquage automatique via le `renderSettingInput` existant
- Le bouton Supprimer met la valeur a chaine vide (pas de suppression de la ligne, coherent avec le pattern existant)
- `NOTIFY pgrst, 'reload schema'` en fin de migration

