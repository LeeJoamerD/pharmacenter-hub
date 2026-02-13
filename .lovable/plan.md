

# Ajouter la permission "Voir les dashboards" et le bouton Afficher/Masquer

## Objectif

1. Ajouter une nouvelle permission `dashboard.view` dans la table `permissions` de la base de donnees, visible dans Parametres/Utilisateurs/Roles et permissions
2. Verifier cette permission au chargement de chaque dashboard principal de module
3. Ajouter un bouton toggle dans l'en-tete de chaque dashboard pour afficher/masquer les informations (masque par defaut)
4. Rendre ce toggle operationnel sur tous les dashboards principaux

## Dashboards concernes

- **Dashboard principal** : `DashboardHome.tsx` (Tableau de bord)
- **Dashboard Stock** : `StockDashboardUnified.tsx` (default de StockModule)
- **Dashboard Ventes** : `SalesDashboard.tsx` (default de VentesModule)
- **Dashboard Comptabilite** : `AccountingDashboard.tsx` (default/tableaux de bord de ComptabiliteModule)
- **Dashboard Rapports** : `ReportsDashboard.tsx` (default de RapportsModule)

## Modifications

### 1. Migration SQL : Ajouter la permission `dashboard.view`

Inserer une nouvelle permission dans la table `permissions` :

```sql
INSERT INTO permissions (code_permission, nom_permission, description, categorie, is_system)
VALUES ('dashboard.view', 'Voir les tableaux de bord', 
        'Permet de voir les tableaux de bord principaux des modules', 
        'dashboard', true);
```

Puis attribuer cette permission a tous les roles existants via `roles_permissions` pour chaque tenant (par defaut activee pour Admin, Pharmacien Titulaire, Pharmacien Adjoint).

### 2. Nouveau composant : `DashboardVisibilityToggle.tsx`

Creer `src/components/dashboard/DashboardVisibilityToggle.tsx` :
- Un bouton avec icone Eye/EyeOff
- State `isVisible` (defaut: `false` = masque)
- Quand masque : affiche un message "Informations du tableau de bord masquees" avec le bouton pour afficher
- Quand visible : affiche le contenu children avec le bouton pour masquer
- Verifie aussi la permission `dashboard.view` via `useDynamicPermissions` : si l'utilisateur n'a pas la permission, affiche un message d'acces refuse

### 3. Modifier `DashboardHeader.tsx`

- Ajouter le bouton Eye/EyeOff a cote du bouton Rafraichir
- Accepter les props `isDashboardVisible` et `onToggleVisibility`

### 4. Modifier `DashboardHome.tsx`

- Ajouter le state `isDashboardVisible` (defaut `false`)
- Verifier la permission `dashboard.view` via `useDynamicPermissions`
- Passer les props au `DashboardHeader`
- Conditionner l'affichage de tout le contenu (KPIs, graphiques, etc.) selon `isDashboardVisible`
- Si pas de permission : afficher un message d'acces refuse

### 5. Modifier `StockDashboardUnified.tsx`

- Ajouter le state `isDashboardVisible` (defaut `false`)
- Verifier `dashboard.view`
- Ajouter le bouton Eye/EyeOff dans l'en-tete existant
- Conditionner tout le contenu sous l'en-tete

### 6. Modifier `SalesDashboard.tsx`

- Ajouter un en-tete avec bouton Eye/EyeOff
- Verifier `dashboard.view`
- State `isDashboardVisible` (defaut `false`)
- Conditionner le contenu (SalesMetrics, CashRegisterStatus, etc.)

### 7. Modifier `AccountingDashboard.tsx`

- Meme logique : en-tete + toggle + permission check

### 8. Modifier `ReportsDashboard.tsx`

- Meme logique : en-tete + toggle + permission check

### 9. Mettre a jour `getCategoryDisplayName` dans `useRolesPermissions.ts`

Ajouter le mapping `'dashboard': 'Tableaux de bord'` pour que la categorie s'affiche correctement dans l'interface de gestion des roles et permissions.

## Section technique

### Composant DashboardVisibilityToggle (pattern reutilisable)

```typescript
interface DashboardVisibilityWrapperProps {
  children: React.ReactNode;
  title?: string;
}

// Usage dans chaque dashboard:
const [isDashboardVisible, setIsDashboardVisible] = useState(false);
const { canAccess } = useDynamicPermissions();
const hasDashboardPermission = canAccess('dashboard.view');

// Dans le header:
<Button variant="ghost" size="sm" onClick={() => setIsDashboardVisible(!isDashboardVisible)}>
  {isDashboardVisible ? <EyeOff /> : <Eye />}
  {isDashboardVisible ? 'Masquer' : 'Afficher'}
</Button>

// Pour le contenu:
{!hasDashboardPermission ? (
  <Alert>Vous n'avez pas la permission de voir ce tableau de bord</Alert>
) : isDashboardVisible ? (
  // contenu du dashboard
) : (
  <Card className="text-center p-12">
    <EyeOff className="mx-auto mb-4" />
    <p>Informations masquees</p>
    <Button onClick={() => setIsDashboardVisible(true)}>Afficher</Button>
  </Card>
)}
```

### Comportement par defaut

- Le toggle est toujours sur **masque** au chargement de la page
- L'utilisateur peut cliquer pour **afficher** les informations
- Il peut recliquer pour **masquer** a nouveau
- Si l'utilisateur n'a pas la permission `dashboard.view`, le bouton toggle n'apparait pas et un message d'acces refuse est affiche

