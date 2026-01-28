
# Plan d'Intégration : Formulaire de Création Utilisateur Optimisé

## Contexte

Le formulaire actuel de création d'utilisateur dans `Paramètres/Utilisateurs` est minimaliste, tandis que la page `/user-register` offre une expérience bien plus complète avec :
- Validation de mot de passe en temps réel
- Indicateur de force du mot de passe
- Affichage de la politique de sécurité
- Champ téléphone
- Confirmation du mot de passe

## Approche Proposée

Plutôt que de rediriger vers `/user-register` (qui est conçu pour l'auto-inscription), je recommande de **créer un composant de formulaire réutilisable** qui peut être utilisé dans les deux contextes. Cela permettra :

1. Une expérience unifiée pour la création d'utilisateurs
2. Le maintien du flux admin (sans vérification OTP, avec sélection de rôle)
3. La réutilisation des fonctionnalités avancées (indicateur de force, politique de mot de passe)

## Modifications Prévues

### 1. Création d'un Composant Réutilisable

Nouveau fichier : `src/components/users/UserCreationForm.tsx`

Ce composant inclura :
- Champs : Prénoms, Noms, Email, Téléphone (optionnel), Mot de passe, Confirmation
- Indicateur de force du mot de passe (`PasswordStrengthIndicator`)
- Affichage de la politique de mot de passe
- Validation en temps réel
- Props pour personnaliser le comportement :
  - `showRoleSelector` : pour l'admin
  - `onSuccess` : callback après création
  - `showPhoneVerification` : désactivé pour l'admin

### 2. Modification de UserSettings.tsx

Remplacer le formulaire inline dans le Dialog par le nouveau composant :

```text
Avant:
  <Dialog>
    <Form> (formulaire minimaliste inline)
    </Form>
  </Dialog>

Après:
  <Dialog>
    <UserCreationForm 
      mode="admin"
      showRoleSelector={true}
      skipVerification={true}
      onSuccess={() => setIsCreateDialogOpen(false)}
    />
  </Dialog>
```

### 3. Structure du Nouveau Formulaire

| Champ | Admin Mode | Public Mode |
|-------|------------|-------------|
| Prénoms | Oui | Oui |
| Noms | Oui | Oui |
| Email | Oui | Oui |
| Téléphone | Oui (optionnel) | Oui (requis) |
| Mot de passe | Oui + indicateur | Oui + indicateur |
| Confirmation MdP | Oui | Oui |
| Sélection Rôle | Oui | Non (défaut: Vendeur) |
| Statut Actif | Oui | Non (défaut: true) |
| Vérification OTP | Non | Oui |

### 4. Fichiers à Modifier

| Fichier | Action |
|---------|--------|
| `src/components/users/UserCreationForm.tsx` | Créer (nouveau composant) |
| `src/components/dashboard/modules/parametres/UserSettings.tsx` | Modifier (remplacer le formulaire inline) |
| `src/pages/UserRegister.tsx` | Optionnel - refactoriser pour utiliser le composant partagé |

## Détails Techniques

### Fonctionnalités du Nouveau Composant

1. **Validation mot de passe en temps réel** via `useAdvancedAuth().validatePassword()`
2. **Indicateur visuel** avec `PasswordStrengthIndicator`
3. **Politique affichée** via `useAdvancedAuth().getPasswordPolicy()`
4. **Création via Edge Function** `create-user-with-personnel` (mode admin)
5. **Gestion d'erreurs localisée** avec `parseCreateUserError`

### Props du Composant

```text
interface UserCreationFormProps {
  mode: 'admin' | 'public';
  showRoleSelector?: boolean;
  skipVerification?: boolean;
  defaultRole?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

### Logique de Soumission (Mode Admin)

1. Valider le mot de passe côté client
2. Vérifier la correspondance password/confirmation
3. Appeler l'Edge Function `create-user-with-personnel`
4. Invalider les queries et fermer le dialog

## Avantages de Cette Approche

- **Cohérence UX** : Même expérience de création partout
- **Sécurité renforcée** : Indicateur de force obligatoire
- **Maintenabilité** : Un seul composant à mettre à jour
- **Flexibilité** : Props permettent différents comportements

## Alternative Considérée (Non Retenue)

Rediriger vers `/user-register` depuis le bouton admin. Non retenu car :
- La page publique requiert une pharmacie connectée différemment
- Le flux de vérification OTP n'est pas approprié pour la création admin
- Le rôle ne peut pas être sélectionné dans le flux public
