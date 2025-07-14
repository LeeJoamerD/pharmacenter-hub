import { useCallback, useMemo } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useTenantQuery } from '@/hooks/useTenantQuery';

interface Permission {
  id: string;
  code_permission: string;
  nom_permission: string;
  description: string;
  categorie: string;
}

interface Role {
  id: string;
  nom_role: string;
  description: string;
  niveau_hierarchique: number;
}

interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  accorde: boolean;
}

interface UserPermissions {
  role: string;
  permissions: string[];
  canAccess: (permission: string) => boolean;
  canManage: (targetRole: string) => boolean;
}

export const useDynamicPermissions = (): UserPermissions => {
  const { currentUser } = useTenant();
  const { useTenantQueryWithCache } = useTenantQuery();

  // Récupérer les rôles depuis la base de données
  const { data: roles = [] } = useTenantQueryWithCache(
    ['roles'], 
    'roles', 
    '*'
  );

  // Récupérer les permissions depuis la base de données
  const { data: permissions = [] } = useTenantQueryWithCache(
    ['permissions'], 
    'permissions', 
    '*'
  );

  // Récupérer les associations rôles-permissions
  const { data: rolePermissions = [] } = useTenantQueryWithCache(
    ['role-permissions'], 
    'roles_permissions', 
    '*'
  );

  const userRole = currentUser?.role || 'Employé';
  
  // Trouver le rôle actuel dans la base de données
  const currentRoleData = (roles as Role[]).find((role: Role) => role.nom_role === userRole);
  
  // Récupérer les permissions accordées au rôle actuel
  const userPermissions = useMemo(() => {
    if (!currentRoleData) return [];
    
    const rolePermissionIds = (rolePermissions as RolePermission[])
      .filter((rp: RolePermission) => rp.role_id === currentRoleData.id && rp.accorde)
      .map((rp: RolePermission) => rp.permission_id);
    
    return (permissions as Permission[])
      .filter((permission: Permission) => rolePermissionIds.includes(permission.id))
      .map((permission: Permission) => permission.code_permission);
  }, [currentRoleData, rolePermissions, permissions]);

  const canAccess = useCallback((permission: string): boolean => {
    return userPermissions.includes(permission);
  }, [userPermissions]);

  const canManage = useCallback((targetRole: string): boolean => {
    if (!currentRoleData) return false;
    
    const targetRoleData = (roles as Role[]).find((role: Role) => role.nom_role === targetRole);
    if (!targetRoleData) return false;

    // Un utilisateur peut gérer des rôles de niveau inférieur ou égal
    // sauf pour l'admin qui peut tout gérer
    if (userRole === 'Admin') return true;
    
    return currentRoleData.niveau_hierarchique <= targetRoleData.niveau_hierarchique;
  }, [currentRoleData, userRole, roles]);

  return {
    role: userRole,
    permissions: userPermissions,
    canAccess,
    canManage
  };
};

// Hook pour vérifier une permission spécifique
export const useHasDynamicPermission = (permission: string): boolean => {
  const { canAccess } = useDynamicPermissions();
  return canAccess(permission);
};

// Hook pour vérifier plusieurs permissions
export const useHasDynamicPermissions = (requiredPermissions: string[], requireAll = true): boolean => {
  const { canAccess } = useDynamicPermissions();
  
  if (requireAll) {
    return requiredPermissions.every(permission => canAccess(permission));
  } else {
    return requiredPermissions.some(permission => canAccess(permission));
  }
};