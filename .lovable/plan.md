
# Script de Nettoyage : Suppression des Comptes Admin Dupliqués

## Comptes Identifiés à Supprimer

| Pharmacie | Email | Personnel ID | Auth User ID |
|-----------|-------|--------------|--------------|
| DJL - Computer Sciences | lee.joamer@gmail.com | 7a3dcaaa-1f81-4b46-86c5-12715ee00e7f | b9cc5585-2d79-4efb-81d1-1d8eb69eea05 |
| Pharmacie La GLOIRE | louzolocatherine@gmail.com | 8aee9f32-e9a0-44a5-b2fe-093447bbb2f2 | 6fde48b4-a5dd-442d-beb1-d74cc3caa2b2 |
| Pharmacie MAZAYU | mdorefr@gmail.com | 4080b193-fcc8-4b05-841d-6245aeb54bcd | c8e0dd73-ff05-46bc-ae8a-95272ce0ef15 |
| Pharmacie Nuit Rond Point de la Paix | pharmacienuitrondpointdelapaix@gmail.com | 0044355e-c511-4cb3-827b-8843e577a869 | 4a75b9ac-6d37-4cba-b0e3-9dc5c32e1c3e |
| Pharmacie TESTS | mdorelfr@yahoo.fr | ec20fca7-88d7-4a25-aded-c90e08cf6fb6 | e4b74dc9-c247-480d-a715-ecfe38d4ad29 |

## Actions du Script

### Etape 1 : Supprimer les enregistrements Personnel Admin dupliqués
Suppression des 5 enregistrements dans la table `personnel` où l'email correspond à celui de la pharmacie.

### Etape 2 : Supprimer les comptes auth.users dupliqués
Suppression des 5 comptes dans `auth.users` dont l'email est utilisé par une pharmacie.

### Etape 3 : Nettoyer les sessions orphelines
Suppression des entrées dans `pharmacy_sessions` liées aux anciens `user_id` supprimés.

## Script SQL à Exécuter

Le script sera créé sous forme de migration SQL sécurisée avec :

```sql
-- 1. Supprimer les enregistrements personnel admin dupliqués
DELETE FROM public.personnel 
WHERE id IN (
  '7a3dcaaa-1f81-4b46-86c5-12715ee00e7f',
  '8aee9f32-e9a0-44a5-b2fe-093447bbb2f2',
  '4080b193-fcc8-4b05-841d-6245aeb54bcd',
  '0044355e-c511-4cb3-827b-8843e577a869',
  'ec20fca7-88d7-4a25-aded-c90e08cf6fb6'
);

-- 2. Nettoyer les sessions pharmacy liées aux anciens user_id
DELETE FROM public.pharmacy_sessions 
WHERE user_id IN (
  'b9cc5585-2d79-4efb-81d1-1d8eb69eea05',
  '6fde48b4-a5dd-442d-beb1-d74cc3caa2b2',
  'c8e0dd73-ff05-46bc-ae8a-95272ce0ef15',
  '4a75b9ac-6d37-4cba-b0e3-9dc5c32e1c3e',
  'e4b74dc9-c247-480d-a715-ecfe38d4ad29'
);

-- 3. Supprimer les comptes auth.users dupliqués
DELETE FROM auth.users 
WHERE id IN (
  'b9cc5585-2d79-4efb-81d1-1d8eb69eea05',
  '6fde48b4-a5dd-442d-beb1-d74cc3caa2b2',
  'c8e0dd73-ff05-46bc-ae8a-95272ce0ef15',
  '4a75b9ac-6d37-4cba-b0e3-9dc5c32e1c3e',
  'e4b74dc9-c247-480d-a715-ecfe38d4ad29'
);
```

## Conséquences

| Element | Avant | Après |
|---------|-------|-------|
| Personnel Admin dupliqués | 5 | 0 |
| Comptes auth.users pharmacies | 5 | 0 |
| Emails pharmacies libres | Non | Oui |
| Sessions orphelines | Possibles | Nettoyées |

## Prochaines Etapes Apres Nettoyage

1. Les pharmacies devront se reconnecter avec `/pharmacy-connection`
2. Elles devront réinitialiser leur mot de passe via `/pharmacy-password-reset` (car les anciens mots de passe étaient dans `auth.users`)
3. Les administrateurs devront être recréés manuellement dans Paramètres > Utilisateurs avec des emails différents

## Securite

- Script idempotent (peut être exécuté plusieurs fois sans erreur)
- Utilise des IDs explicites pour éviter les suppressions accidentelles
- Ordre de suppression respecte les contraintes FK (personnel avant auth.users)
