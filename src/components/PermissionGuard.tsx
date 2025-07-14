import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PermissionGuardProps {
  children: React.ReactNode;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showFallback?: boolean;
  requireAuth?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAll = true,
  fallback,
  showFallback = true,
  requireAuth = true
}) => {
  const { user } = useAuth();
  const { canAccess, role } = usePermissions();

  // Si authentification requise mais utilisateur non connecté
  if (requireAuth && !user) {
    if (!showFallback) return null;
    
    return fallback || (
      <Alert className="border-destructive/50">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Vous devez être connecté pour accéder à cette fonctionnalité.
        </AlertDescription>
      </Alert>
    );
  }

  // Vérification des rôles
  if (roles.length > 0) {
    const hasRequiredRole = roles.includes(role);
    if (!hasRequiredRole) {
      if (!showFallback) return null;
      
      return fallback || (
        <Alert className="border-destructive/50">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Rôle insuffisant. Rôles autorisés : {roles.join(', ')}
          </AlertDescription>
        </Alert>
      );
    }
  }

  // Vérification des permissions
  if (permissions.length > 0) {
    let hasAccess = false;
    
    if (requireAll) {
      hasAccess = permissions.every(permission => canAccess(permission));
    } else {
      hasAccess = permissions.some(permission => canAccess(permission));
    }

    if (!hasAccess) {
      if (!showFallback) return null;
      
      return fallback || (
        <Alert className="border-destructive/50">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Permissions insuffisantes. Permissions requises : {permissions.join(', ')}
          </AlertDescription>
        </Alert>
      );
    }
  }

  return <>{children}</>;
};

export default PermissionGuard;