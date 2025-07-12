import React, { useCallback, useMemo } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { ROLES, PERMISSIONS, UserPermissions } from '@/types/permissions';

export const usePermissions = (): UserPermissions => {
  const { currentUser } = useTenant();

  const userRole = currentUser?.role || 'Employé';
  const roleConfig = ROLES[userRole];

  const permissions = useMemo(() => {
    return roleConfig ? roleConfig.permissions : ROLES.Employé.permissions;
  }, [roleConfig]);

  const canAccess = useCallback((permission: string): boolean => {
    // TEMPORAIRE : Désactiver les permissions pour le développement
    return true;
    // return permissions.includes(permission);
  }, [permissions]);

  const canManage = useCallback((targetRole: string): boolean => {
    // TEMPORAIRE : Désactiver les permissions pour le développement
    return true;
    /* if (!roleConfig) return false;
    
    const targetRoleConfig = ROLES[targetRole];
    if (!targetRoleConfig) return false;

    // Un utilisateur peut gérer des rôles de niveau inférieur ou égal
    // sauf pour l'admin qui peut tout gérer
    if (userRole === 'Admin') return true;
    
    return roleConfig.level <= targetRoleConfig.level; */
  }, [roleConfig, userRole]);

  return {
    role: userRole,
    permissions,
    canAccess,
    canManage
  };
};

// Hook pour vérifier une permission spécifique
export const useHasPermission = (permission: string): boolean => {
  const { canAccess } = usePermissions();
  return canAccess(permission);
};

// Hook pour vérifier plusieurs permissions
export const useHasPermissions = (requiredPermissions: string[], requireAll = true): boolean => {
  const { canAccess } = usePermissions();
  
  if (requireAll) {
    return requiredPermissions.every(permission => canAccess(permission));
  } else {
    return requiredPermissions.some(permission => canAccess(permission));
  }
};

// Hook pour composants conditionnels basés sur les permissions
export const usePermissionGate = () => {
  const { canAccess, canManage } = usePermissions();

  const PermissionGate = ({ 
    permission, 
    permissions = [], 
    requireAll = true, 
    fallback = null, 
    children 
  }: {
    permission?: string;
    permissions?: string[];
    requireAll?: boolean;
    fallback?: React.ReactNode;
    children: React.ReactNode;
  }) => {
    let hasAccess = false;

    if (permission) {
      hasAccess = canAccess(permission);
    } else if (permissions.length > 0) {
      if (requireAll) {
        hasAccess = permissions.every(p => canAccess(p));
      } else {
        hasAccess = permissions.some(p => canAccess(p));
      }
    } else {
      hasAccess = true; // Pas de restriction
    }

    return hasAccess ? (children as React.ReactElement) : (fallback as React.ReactElement);
  };

  return { PermissionGate, canAccess, canManage };
};