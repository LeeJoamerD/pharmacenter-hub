
# Rendre toutes les sessions de caisse accessibles dans l'import

## Probleme identifie

Les requetes dans `useSmartOrderSuggestions.ts` filtrent par `statut = 'Fermee'`. Or, les sessions d'hier et avant-hier ont le statut `'Ouverte'` en base de donnees (elles n'ont pas ete cloturees proprement). Elles sont donc invisibles dans le modal d'import.

## Correction

### Fichier : `src/hooks/useSmartOrderSuggestions.ts`

**A) Query `recentSessions` (ligne 154)** : Retirer le filtre `.eq('statut', 'Fermee')` pour charger toutes les sessions, quel que soit leur statut. Augmenter la limite a 100 pour couvrir un historique plus large.

**B) Query `searchSessions` (ligne 192)** : Retirer le meme filtre `.eq('statut', 'Fermee')` pour que la recherche par numero retrouve n'importe quelle session.

Deux lignes a supprimer au total. Les sessions ouvertes et fermees seront toutes accessibles.
