import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';

interface RouteConfig {
  path: string;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
  requireAuth?: boolean;
  description?: string;
}

interface UseRouteProtectionOptions {
  onUnauthorized?: (reason: string) => void;
  onAccessGranted?: () => void;
  logAttempts?: boolean;
}

export const useRouteProtection = (
  routeConfig: RouteConfig,
  options: UseRouteProtectionOptions = {}
) => {
  const { user, personnel } = useAuth();
  const { canAccess, role } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [denialReason, setDenialReason] = useState<string | null>(null);

  const {
    onUnauthorized,
    onAccessGranted,
    logAttempts = true
  } = options;

  const logSecurityEvent = async (
    eventType: 'access_granted' | 'access_denied',
    reason?: string
  ) => {
    if (!logAttempts || !user) return;

    try {
      await supabase.from('audit_logs').insert({
        tenant_id: personnel?.tenant_id,
        user_id: user.id,
        personnel_id: personnel?.id,
        action: `ROUTE_${eventType.toUpperCase()}`,
        table_name: 'route_security',
        new_values: {
          route: routeConfig.path,
          current_path: location.pathname,
          required_permissions: routeConfig.permissions || [],
          required_roles: routeConfig.roles || [],
          user_role: role,
          reason: reason || 'security_check',
          description: routeConfig.description
        },
        status: eventType === 'access_granted' ? 'success' : 'denied'
      });
    } catch (error) {
      console.error('Erreur lors du log de sécurité:', error);
    }
  };

  const checkAuthorization = async () => {
    setIsChecking(true);
    setDenialReason(null);

    // Vérification de l'authentification
    if (routeConfig.requireAuth !== false && !user) {
      setDenialReason('authentication_required');
      setIsAuthorized(false);
      await logSecurityEvent('access_denied', 'not_authenticated');
      onUnauthorized?.('authentication_required');
      setIsChecking(false);
      return;
    }

    // Vérification des rôles
    if (routeConfig.roles && routeConfig.roles.length > 0) {
      if (!routeConfig.roles.includes(role)) {
        setDenialReason('insufficient_role');
        setIsAuthorized(false);
        await logSecurityEvent('access_denied', 'insufficient_role');
        onUnauthorized?.('insufficient_role');
        setIsChecking(false);
        return;
      }
    }

    // Vérification des permissions
    if (routeConfig.permissions && routeConfig.permissions.length > 0) {
      let hasAccess = false;

      if (routeConfig.requireAll !== false) {
        hasAccess = routeConfig.permissions.every(permission => 
          canAccess(permission)
        );
      } else {
        hasAccess = routeConfig.permissions.some(permission => 
          canAccess(permission)
        );
      }

      if (!hasAccess) {
        setDenialReason('insufficient_permissions');
        setIsAuthorized(false);
        await logSecurityEvent('access_denied', 'insufficient_permissions');
        onUnauthorized?.('insufficient_permissions');
        setIsChecking(false);
        return;
      }
    }

    // Accès autorisé
    setIsAuthorized(true);
    setDenialReason(null);
    await logSecurityEvent('access_granted');
    onAccessGranted?.();
    setIsChecking(false);
  };

  useEffect(() => {
    checkAuthorization();
  }, [user, personnel, role, location.pathname]);

  const redirectToAuth = (returnUrl?: string) => {
    const redirectPath = returnUrl || location.pathname;
    navigate(`/auth?returnUrl=${encodeURIComponent(redirectPath)}`);
  };

  const redirectToDashboard = () => {
    navigate('/tableau-de-bord');
  };

  return {
    isAuthorized,
    isChecking,
    denialReason,
    user,
    role,
    redirectToAuth,
    redirectToDashboard,
    checkAuthorization
  };
};

export default useRouteProtection;