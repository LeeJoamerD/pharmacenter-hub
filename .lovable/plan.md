

# Plan de correction : Administration Centrale (Chat-PharmaSoft)

## Erreurs identifiees

### Erreur 1 : `Math.random()` pour l'activite des pharmacies dans le graphique (ligne 287)

Dans `CentralAdministration.tsx`, le composant `NetworkHealthChart` recoit `pharmacyActivity` avec des messages generes aleatoirement :
```
messages: Math.floor(Math.random() * 100)
```
Cela produit des valeurs differentes a chaque rendu. Il faut utiliser les donnees reelles de messages par pharmacie.

### Erreur 2 : Duplication de `useEffect` pour `loadNetworkData` dans le hook (lignes 1013-1017 et 1138-1142)

Le hook `useNetworkChatAdmin.ts` contient **deux** `useEffect` identiques qui appellent `loadNetworkData` quand `tenantId` change. Cela provoque un double chargement de toutes les donnees a chaque montage ou changement de tenant, soit 16 requetes inutiles.

### Erreur 3 : `system_uptime` est code en dur a '99.9%' (ligne 452)

Dans `loadStats`, la valeur `system_uptime` est toujours `'99.9%'`. Ce n'est pas une erreur bloquante mais c'est un faux indicateur. Il serait plus coherent de le calculer a partir du ratio de pharmacies actives ou de le marquer comme non disponible.

### Erreur 4 : `loadChannels` ne filtre pas par tenant (lignes 203-210)

La requete charge **tous** les canaux de la table `network_channels` sans filtre `tenant_id`. Pour une administration centrale cela peut etre intentionnel, mais cela expose les canaux de tous les tenants. Il faudrait au minimum ajouter un commentaire explicatif ou filtrer par participation du tenant.

### Erreur 5 : `getChannelDistribution` utilise le state `channels` en closure (lignes 1128-1136)

La fonction `getChannelDistribution` accede au state `channels` via closure. Si elle est appelee avant que les canaux soient charges, elle retournera des valeurs a zero. Le `useEffect` de la ligne 71-79 qui appelle `getChannelDistribution` se declenche quand `channels` change, ce qui compense partiellement, mais cree un cycle inutile.

### Erreur 6 : `loadPharmacies` expose toutes les pharmacies sans filtre (lignes 152-196)

Toutes les pharmacies de la plateforme sont chargees avec leur personnel. Pour une vue d'administration centrale reseau, cela peut etre voulu, mais il manque un commentaire expliquant ce choix.

### Erreur 7 : `pharmacyActivity` devrait utiliser des donnees reelles (ligne 287)

En plus du `Math.random()`, les donnees d'activite des pharmacies devraient venir d'un comptage reel des messages par pharmacie via `network_messages`, pas d'un calcul fictif.

---

## Plan de corrections

### Fichier `src/hooks/useNetworkChatAdmin.ts`

1. **Supprimer le `useEffect` duplique** (lignes 1138-1142) : Retirer le second `useEffect` identique qui cause un double-chargement.

2. **Ajouter une fonction `getPharmacyActivity`** : Creer une nouvelle fonction qui charge les comptages de messages par pharmacie via une requete batchee sur `network_messages` groupee par `sender_pharmacy_id` ou `tenant_id`, et l'exposer dans le return du hook.

3. **Ajouter un commentaire sur `loadChannels`** : Clarifier que le chargement global est intentionnel pour l'administration centrale.

4. **Remplacer `system_uptime` hardcode** : Calculer un pourcentage base sur `activePharmacies / totalPharmacies` et le formater en string.

### Fichier `src/components/dashboard/modules/chat/CentralAdministration.tsx`

5. **Remplacer `Math.random()`** (ligne 287) : Utiliser la nouvelle fonction `getPharmacyActivity` du hook pour passer des donnees reelles au composant `NetworkHealthChart`. Charger les comptages de messages par pharmacie et les passer au graphique.

---

## Fichiers impactes

| Action | Fichier |
|--------|---------|
| Modifier | `src/hooks/useNetworkChatAdmin.ts` |
| Modifier | `src/components/dashboard/modules/chat/CentralAdministration.tsx` |

