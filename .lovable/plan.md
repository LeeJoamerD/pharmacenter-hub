
# Plan : Bouton "Créer votre compte Admin" dans le Hero

## Contexte

Le composant Hero affiche les informations de la pharmacie connectée. Si cette pharmacie n'a aucun compte administrateur (role = 'Admin' dans la table personnel), un nouveau bouton doit apparaître pour permettre la création d'un administrateur via le `AdminCreationDialog` existant.

## Architecture de la Solution

```text
┌──────────────────────────────────────────────────────────────┐
│                        HERO (pharmacie connectée)            │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────┐                        │
│  │ [Nom Pharmacie]                  │                        │
│  │ email@pharmacie.com              │                        │
│  │ Session active                   │                        │
│  │ ─────────────────────────────    │                        │
│  │ [→ Se déconnecter]               │                        │
│  │                                  │                        │
│  │ ══════════════════════════════   │  ← NOUVEAU             │
│  │ [👤 Créer votre compte Admin]    │  ← Conditionnel        │
│  └──────────────────────────────────┘                        │
│                                                              │
│  Condition: hasAdmin === false                               │
└──────────────────────────────────────────────────────────────┘
```

## Fichiers à Créer/Modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/hooks/usePharmacyAdmin.ts` | CRÉER | Hook pour vérifier si une pharmacie a un admin |
| `src/components/Hero.tsx` | MODIFIER | Ajouter bouton conditionnel + intégrer AdminCreationDialog |

## Détails Techniques

### 1. Nouveau Hook : usePharmacyAdmin

Ce hook vérifie si la pharmacie connectée possède au moins un utilisateur avec le rôle 'Admin' :

```typescript
// src/hooks/usePharmacyAdmin.ts
export function usePharmacyAdmin(tenantId: string | undefined) {
  const { data: hasAdmin, isLoading } = useQuery({
    queryKey: ['pharmacy-has-admin', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      
      const { count, error } = await supabase
        .from('personnel')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('role', 'Admin');
      
      if (error) {
        console.error('Erreur vérification admin:', error);
        return null;
      }
      
      return (count ?? 0) > 0;
    },
    enabled: !!tenantId,
    staleTime: 30000, // Cache 30 secondes
  });

  return { hasAdmin, isLoading };
}
```

### 2. Modification du Hero

Intégrer le bouton et le dialog dans le composant Hero :

```typescript
// Dans Hero.tsx
import { AdminCreationDialog } from '@/components/pharmacy-creation/AdminCreationDialog';
import { usePharmacyAdmin } from '@/hooks/usePharmacyAdmin';

// Nouveaux états
const [showAdminCreation, setShowAdminCreation] = useState(false);

// Vérifier si la pharmacie a un admin
const { hasAdmin, isLoading: isCheckingAdmin } = usePharmacyAdmin(activePharmacy?.id);

// Dans le dropdown menu (après "Se déconnecter")
{isPharmacyConnected && hasAdmin === false && (
  <DropdownMenuItem onClick={() => setShowAdminCreation(true)}>
    <UserPlus className="mr-2 h-4 w-4" />
    Créer votre compte Admin
  </DropdownMenuItem>
)}

// Ou comme bouton séparé visible dans le dropdown
```

### 3. Placement du Bouton

Le bouton sera ajouté dans le `DropdownMenuContent` du menu pharmacie, sous l'option "Se déconnecter" :

```typescript
<DropdownMenuContent align="start" className="bg-white dark:bg-gray-800 border shadow-lg">
  <DropdownMenuItem onClick={handlePharmacyDisconnect}>
    <LogOut className="mr-2 h-4 w-4" />
    Se déconnecter
  </DropdownMenuItem>
  
  {/* NOUVEAU: Bouton création admin (visible seulement si pas d'admin) */}
  {hasAdmin === false && (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem 
        onClick={() => setShowAdminCreation(true)}
        className="text-primary"
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Créer votre compte Admin
      </DropdownMenuItem>
    </>
  )}
</DropdownMenuContent>
```

### 4. Intégration du Dialog

Le `AdminCreationDialog` sera rendu conditionnellement :

```typescript
{/* Dialog création admin (réutilisation du composant existant) */}
{activePharmacy && (
  <AdminCreationDialog
    open={showAdminCreation}
    pharmacyId={activePharmacy.id}
    pharmacyEmail={activePharmacy.email}
    pharmacyName={activePharmacy.name}
    onSuccess={() => {
      setShowAdminCreation(false);
      // Invalider le cache pour mettre à jour hasAdmin
      queryClient.invalidateQueries({ queryKey: ['pharmacy-has-admin'] });
      toast({
        title: "Administrateur créé",
        description: "Votre compte administrateur a été créé avec succès.",
      });
    }}
  />
)}
```

## Comportement Attendu

| Condition | Affichage |
|-----------|-----------|
| Pharmacie connectée + a un admin | Seulement "Se déconnecter" |
| Pharmacie connectée + pas d'admin | "Se déconnecter" + "Créer votre compte Admin" |
| Pas de pharmacie connectée | Bouton "Connecter votre pharmacie" |
| Vérification en cours | Attendre avant d'afficher le bouton admin |

## Requête SQL Utilisée

```sql
SELECT COUNT(id) 
FROM personnel 
WHERE tenant_id = '{pharmacy_id}' 
  AND role = 'Admin';
```

Cette requête retourne le nombre d'administrateurs pour la pharmacie. Si count = 0, le bouton est affiché.

## Résumé des Modifications

1. **Créer** `src/hooks/usePharmacyAdmin.ts` - Hook de vérification admin
2. **Modifier** `src/components/Hero.tsx` :
   - Importer `AdminCreationDialog`, `usePharmacyAdmin`, `UserPlus`, `DropdownMenuSeparator`
   - Ajouter état `showAdminCreation`
   - Utiliser le hook `usePharmacyAdmin` 
   - Ajouter le bouton conditionnel dans le dropdown
   - Rendre le `AdminCreationDialog` conditionnellement
   - Invalider le cache React Query après création réussie
