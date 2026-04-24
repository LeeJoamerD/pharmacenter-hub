

## Plan — Corriger le clignotement et borner la hauteur du bloc "Activité Globale Réseau"

### Problème 1 — Clignotement (re-rendus en boucle)

Dans `GlobalActivity.tsx`, le `useEffect` principal a `pharmacyMap` comme dépendance. Or `loadActivities()` appelle `setPharmacyMap(map)` avec un **nouvel objet à chaque exécution** (même contenu, nouvelle référence). Conséquence en cascade :

1. `loadActivities` → `setPharmacyMap(newObj)` → `pharmacyMap` change de référence
2. `useEffect` se ré-exécute → désabonne le canal, réabonne, et re-déclenche le fetch
3. Le canal Supabase reçoit aussi des INSERT temps réel qui prepend des activités sans dédoublonnage → l'élément apparaît, puis le `loadActivities` suivant le remplace, etc.

D'où le clignotement permanent.

### Problème 2 — Hauteur non bornée

Le bloc "Activité Globale Réseau" s'étire selon le contenu, alors que "Répertoire Officines" utilise `max-h-96 overflow-y-auto` sur sa liste interne.

### Solution

#### A. `src/components/dashboard/modules/chat/GlobalActivity.tsx`

1. **Stabiliser le `useEffect`** :
   - Retirer `pharmacyMap` des dépendances → `useEffect(() => { … }, [])`.
   - Stocker `pharmacyMap` dans un `useRef` (`pharmacyMapRef.current`) pour que le callback realtime y accède toujours à jour, sans re-déclencher l'effet.
   - Mettre à jour la ref dans `loadActivities` après le fetch des pharmacies (`pharmacyMapRef.current = map`), conserver également un `setState` si on en a besoin pour le rendu (sinon on peut le supprimer, le formatage se faisant lors de la construction des `ActivityItem`).
2. **Déduplication realtime** : dans le handler INSERT, vérifier que `newMsg.id` n'est pas déjà présent dans `prev` avant de prepend (`if (prev.some(a => a.id === newMsg.id)) return prev;`).
3. **Borner la liste** : envelopper la liste des activités (`<div className="space-y-4">…</div>` lignes 226-268) dans un conteneur `max-h-96 overflow-y-auto pr-1` pour aligner la hauteur sur celle de `PharmacyDirectory` (qui utilise `max-h-96`). Le bouton "Voir toute l'activité réseau" reste hors du scroll, fixe en bas.

#### B. Aucune autre modification

- Pas de changement sur `PharmacyDirectory.tsx` (référence de hauteur).
- Pas de changement DB ni de RPC.

### Vérifications

1. Le bloc ne clignote plus : un seul abonnement realtime persistant, pas de boucle de re-render.
2. Les nouveaux messages reçus en temps réel s'ajoutent en tête sans doublon ni disparition.
3. La liste d'activités a une hauteur maximale identique à "Répertoire Officines" (`max-h-96`) avec scroll vertical interne.
4. Les libellés `Direct · <Nom Pharmacie>` continuent de s'afficher correctement.

### Fichier modifié

- `src/components/dashboard/modules/chat/GlobalActivity.tsx`

