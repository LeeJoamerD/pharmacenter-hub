

# Diagnostic : Bouton Package invisible - Build cassé

## Cause racine identifiée

L'application affiche une version **en cache** (ancienne). Le build actuel est **cassé** à cause d'erreurs de duplicate `data-lov-id` injectées par le plugin Lovable dans `main.tsx` et `App.tsx`. Ces erreurs empêchent toute nouvelle compilation, donc le code du bouton Package (qui est correctement écrit) n'est jamais déployé.

Les données en base sont confirmées :
- `POS-20260320-0001` → retour `RET-20260320-0001` statut **Approuvé**
- `POS-20260320-0002` → retour `RET-20260320-0002` statut **En attente**

Le code dans `CashRegisterInterface.tsx` (lignes 563-604) est correct et devrait afficher les boutons.

## Plan de correction

### 1. Forcer la reconstruction en touchant `main.tsx`

**Fichier** : `src/main.tsx`

Réécrire le fichier identique à l'original pour forcer un rebuild propre et éliminer l'erreur de duplicate attributes :

```tsx
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
```

### 2. Réécrire `src/App.tsx` de la même façon

Toucher le fichier pour forcer le rebuild sans duplicate data-lov-id.

### 3. Vérification

Si le build passe après cette correction, les boutons Package apparaîtront automatiquement car le code est déjà en place et les données en base sont correctes.

### Fichiers modifiés
- `src/main.tsx` (réécriture identique pour forcer rebuild)
- `src/App.tsx` (réécriture identique pour forcer rebuild)

