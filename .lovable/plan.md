

# Diagnostic : Widget VidalNewsWidget invisible sur le tableau de bord pharmacie

## Constat

Le code est correctement en place dans `DashboardHome.tsx` (ligne 98, entre `RecentActivitiesTimeline` et `QuickActionsPanel`). Le composant `VidalNewsWidget` rend toujours un `<Card>` visible, même en cas d'erreur API ou de liste vide. Pourtant, il n'apparaît pas sur la capture.

## Cause probable

L'Edge Function `vidal-search` ne retourne aucun log, ce qui suggère soit qu'elle n'est pas déployée, soit que l'appel `supabase.functions.invoke` échoue avec une erreur CORS/réseau qui fait crasher le composant avant le rendu. Le `try/catch` actuel dans le composant ne protège pas contre un crash au niveau du rendu React lui-même (si l'état `error` contenait un objet non-string, par exemple).

## Plan de correction

### 1. Sécuriser le composant VidalNewsWidget contre tout crash

**Fichier** : `src/components/shared/VidalNewsWidget.tsx`

- Wrapper le composant avec un Error Boundary local (ou un `try/catch` dans le rendu) pour éviter qu'une erreur silencieuse ne fasse disparaître toute la Card.
- Dans le `catch` de `fetchNews`, forcer `setError(String(e?.message || e || 'Erreur inconnue'))` pour éviter qu'un objet Error ne cause un crash de rendu.
- S'assurer que `loading` démarre à `true` (actuellement `false`, donc le premier rendu montre "Aucune actualité" pendant une fraction de seconde avant le `useEffect`).

### 2. Redéployer l'Edge Function vidal-search

- Déclencher un redéploiement de l'Edge Function pour s'assurer qu'elle est active et accessible.

### 3. Ajouter un fallback visible quand l'API VIDAL n'est pas configurée

- Si le tenant n'a pas de credentials VIDAL configurées, afficher un message explicite dans la Card plutôt qu'une erreur générique, pour que le widget reste toujours visible et informatif.

### Fichiers modifiés
- `src/components/shared/VidalNewsWidget.tsx` (sécurisation rendu + loading initial)
- Redéploiement de `supabase/functions/vidal-search`

