import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Permission {
  id: string;
  code_permission: string;
  nom_permission: string;
  description: string;
  categorie: string;
  is_system: boolean;
}

export interface Role {
  id: string;
  nom_role: string;
  description: string;
  niveau_hierarchique: number;
  is_active: boolean;
  is_system: boolean;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  accorde: boolean;
}

// Hook pour récupérer tous les rôles
export const useRoles = () => {
  const { useTenantQueryWithCache } = useTenantQuery();
  
  return useTenantQueryWithCache(
    ['roles'],
    'roles',
    '*',
    { is_active: true },
    { 
      orderBy: { column: 'niveau_hierarchique', ascending: true },
      tenantScoped: true // Les rôles sont maintenant multi-tenant
    }
  );
};

// Hook pour récupérer toutes les permissions
export const usePermissions = () => {
  const { useTenantQueryWithCache } = useTenantQuery();
  
  return useTenantQueryWithCache(
    ['permissions'],
    'permissions',
    '*',
    undefined,
    { 
      orderBy: { column: 'categorie', ascending: true },
      tenantScoped: false
    }
  );
};

// Hook pour récupérer les associations rôles-permissions
export const useRolePermissions = () => {
  const { useTenantQueryWithCache } = useTenantQuery();
  
  return useTenantQueryWithCache(
    ['roles-permissions'],
    'roles_permissions',
    '*, role:roles!role_id(nom_role), permission:permissions!permission_id(code_permission, nom_permission)'
  );
};

// Hook pour récupérer les permissions d'un rôle spécifique
export const useRolePermissionsByRole = (roleId: string) => {
  const { useTenantQueryWithCache } = useTenantQuery();
  
  return useTenantQueryWithCache(
    ['role-permissions', roleId],
    'roles_permissions',
    '*, permission:permissions!permission_id(*)',
    { role_id: roleId },
    { enabled: !!roleId }
  );
};

// Hook pour sauvegarder les permissions d'un rôle
export const useUpdateRolePermissions = () => {
  const { tenantId } = useTenantQuery();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      roleId, 
      permissionIds 
    }: { 
      roleId: string; 
      permissionIds: string[] 
    }) => {
      if (!tenantId) throw new Error('Tenant ID required');

      // Récupérer les permissions actuelles de la base
      const { data: currentPermissions, error: fetchError } = await (supabase as any)
        .from('roles_permissions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('role_id', roleId);

      if (fetchError) throw fetchError;

      // Calculer les permissions à ajouter et supprimer
      const currentPermissionIds = (currentPermissions || [])
        .filter((rp: RolePermission) => rp.accorde)
        .map((rp: RolePermission) => rp.permission_id);

      const toAdd = permissionIds.filter(id => !currentPermissionIds.includes(id));
      const toRemove = currentPermissionIds.filter((id: string) => !permissionIds.includes(id));
      const toActivate = permissionIds.filter(id => {
        const existingPerm = (currentPermissions || [])
          .find((rp: RolePermission) => rp.permission_id === id);
        return existingPerm && !existingPerm.accorde;
      });

      const results = [];

      // Ajouter nouvelles permissions
      for (const permissionId of toAdd) {
        const { error } = await (supabase as any)
          .from('roles_permissions')
          .insert({
            tenant_id: tenantId,
            role_id: roleId,
            permission_id: permissionId,
            accorde: true
          });
        if (error) throw error;
        results.push({ action: 'add', permissionId });
      }

      // Activer permissions existantes
      for (const permissionId of toActivate) {
        const existingPerm = (currentPermissions || [])
          .find((rp: RolePermission) => rp.permission_id === permissionId);
        if (existingPerm) {
          const { error } = await (supabase as any)
            .from('roles_permissions')
            .update({ accorde: true })
            .eq('id', existingPerm.id)
            .eq('tenant_id', tenantId);
          if (error) throw error;
          results.push({ action: 'activate', permissionId });
        }
      }

      // Désactiver permissions supprimées
      for (const permissionId of toRemove) {
        const existingPerm = (currentPermissions || [])
          .find((rp: RolePermission) => rp.permission_id === permissionId);
        if (existingPerm) {
          const { error } = await (supabase as any)
            .from('roles_permissions')
            .update({ accorde: false })
            .eq('id', existingPerm.id)
            .eq('tenant_id', tenantId);
          if (error) throw error;
          results.push({ action: 'deactivate', permissionId });
        }
      }

      return { roleId, permissionIds, results };
    },
    onSuccess: (data) => {
      // Invalider les caches pertinents
      queryClient.invalidateQueries({ queryKey: [tenantId, 'roles-permissions'] });
      queryClient.invalidateQueries({ queryKey: [tenantId, 'role-permissions', data.roleId] });
      
      toast({
        title: "Permissions mises à jour",
        description: "Les permissions du rôle ont été sauvegardées avec succès.",
      });
    },
    onError: (error: any) => {
      console.error('Erreur lors de la sauvegarde des permissions:', error);
      
      // Messages d'erreur spécifiques
      let errorMessage = "Une erreur est survenue lors de la sauvegarde des permissions.";
      
      if (error?.message?.includes('row-level security') || error?.code === 'PGRST301') {
        errorMessage = "Vous devez être administrateur de cette pharmacie pour modifier les permissions.";
      } else if (error?.message?.includes('permission denied') || error?.code === 'PGRST000') {
        errorMessage = "Permissions insuffisantes pour effectuer cette opération.";
      } else if (error?.message?.includes('violates foreign key constraint')) {
        errorMessage = "Erreur de référence: rôle ou permission introuvable.";
      }
      
      toast({
        title: "Erreur de sauvegarde",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });
};

// Utilitaire pour grouper les permissions par catégorie
export const groupPermissionsByCategory = (permissions: Permission[]) => {
  return permissions.reduce((acc, permission) => {
    const category = permission.categorie;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
};

// Utilitaire pour mapper les noms de catégories
export const getCategoryDisplayName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'users': 'Gestion des Utilisateurs',
    'pharmacy': 'Gestion de la Pharmacie',
    'sales': 'Gestion des Ventes',
    'stock': 'Gestion du Stock',
    'suppliers': 'Gestion des Fournisseurs',
    'accounting': 'Comptabilité',
    'reports': 'Rapports',
    'network': 'Réseau',
    'security': 'Sécurité'
  };
  
  return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
};