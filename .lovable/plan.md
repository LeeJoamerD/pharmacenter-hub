

## Diagnostic du problème "rôles qui passent silencieusement à Vendeur"

### Cause racine confirmée

Dans `src/components/dashboard/personnel/EmployeeManagement.tsx` (module Personnel → onglet Employés), la fonction `handleSubmit` force le champ `role` à `'Vendeur'` à **chaque** appel, aussi bien pour la création que pour la **mise à jour** :

```ts
// ligne 144-159
if (editingEmployee) {
  updateMutation.mutate({
    id: editingEmployee.id,
    ...normalizedData,
    role: 'Vendeur', // <-- ÉCRASE le rôle existant
    is_active: true
  });
} else {
  createMutation.mutate({
    ...normalizedData,
    role: 'Vendeur', // <-- création en Vendeur
    is_active: true,
    ...
  });
}
```

Le formulaire `EmployeeForm` n'expose pas de sélecteur de rôle, donc l'utilisateur (souvent un admin) ne se rend pas compte qu'il modifie le rôle. Conséquences observées :

- Modifier le téléphone, l'adresse, le salaire ou les infos compte client d'un employé via Personnel → Employés ⇒ son rôle redevient **Vendeur**.
- Si l'admin édite plusieurs employés à la suite (ou utilise une opération en masse via cette interface), tout le tenant tombe en Vendeur.
- Si l'admin édite **sa propre fiche personnel** depuis cet écran, il perd son rôle Admin → plus personne ne peut corriger sans passer par Supabase. Exactement ce qui s'est passé pour Pharmacie Jeannelle.

Aucun trigger SQL ni RLS n'est en cause : c'est bien le frontend qui envoie `role='Vendeur'` dans le `UPDATE`.

À noter aussi : `is_active: true` est lui aussi forcé, ce qui peut réactiver silencieusement un employé désactivé.

### Correction proposée

1. **Arrêter d'écraser le rôle lors d'une mise à jour**
   - Dans `EmployeeManagement.tsx`, retirer `role` et `is_active` du payload `updateMutation.mutate(...)`. Une édition de fiche personnel ne doit jamais toucher au rôle ni au statut actif.

2. **Ne plus forcer le rôle lors d'une création depuis ce module**
   - Conserver un rôle par défaut uniquement si le champ est vide, mais idéalement ne pas créer de comptes "utilisateurs" via cet écran orienté RH.
   - Option retenue : garder `role: 'Vendeur'` UNIQUEMENT à la création (cas `else`), car ce module est destiné aux employés RH sans accès applicatif. La gestion du rôle reste centralisée dans Paramètres → Utilisateurs (`UserSettings` / `UserManagement`) qui, eux, exposent un sélecteur de rôle.

3. **Filet de sécurité côté base (recommandé)**
   - Ajouter un trigger `BEFORE UPDATE ON public.personnel` qui, si `NEW.role` diffère de `OLD.role`, vérifie via `has_role(auth.uid(), 'admin')` ou via la vérification d'appartenance au tenant + rôle administratif que l'appelant a bien le droit de modifier un rôle. Sinon, restaurer `OLD.role`. Cela empêchera toute régression future où un autre écran enverrait par erreur un rôle.
   - Ce trigger doit aussi journaliser la tentative dans une table d'audit (ex. `audit_role_changes`) pour traçabilité.

4. **Audit immédiat**
   - Lister les pharmacies où **tous** les `personnel.role = 'Vendeur'` afin de proposer une restauration manuelle ciblée, et vérifier qu'au moins un Admin existe par tenant. Aucune modification automatique sans validation de l'utilisateur.

### Détail technique des changements

| Fichier | Changement |
|---|---|
| `src/components/dashboard/personnel/EmployeeManagement.tsx` | Retirer `role` et `is_active` du payload `updateMutation.mutate`. Conserver `role: 'Vendeur'` uniquement dans la branche `createMutation`, ou mieux : retirer aussi et laisser le `default` SQL gérer. |
| `supabase/migrations/<new>.sql` | Créer `audit_role_changes(id, tenant_id, personnel_id, old_role, new_role, changed_by, changed_at)` + trigger `protect_personnel_role_change` BEFORE UPDATE ON personnel qui bloque/log les changements de `role` venant d'un caller non admin. |
| (Vérification) | Lancer une requête de diagnostic SQL sur `personnel` groupé par `tenant_id, role` pour détecter d'autres tenants impactés, sans écrire. |

### Résultat attendu

- Modifier la fiche RH d'un employé ne change plus son rôle ni son statut actif.
- Même en cas de bug futur côté client, la base refusera tout changement de rôle non autorisé et le journalisera.
- Plus jamais de tenant "vidé" de ses admins par une simple édition de profil.

