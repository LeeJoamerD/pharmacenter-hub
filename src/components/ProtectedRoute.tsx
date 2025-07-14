import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
  fallbackPath?: string;
  allowGuests?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  requireAuth = true,
  permissions = [],
  roles = [],
  requireAll = true,
  fallbackPath = '/auth',
  allowGuests = false
}) => {
  const { user, loading, personnel } = useAuth();
  const { canAccess, role } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [accessDenied, setAccessDenied] = useState(false);

  // Log des tentatives d'accès
  const logAccessAttempt = async (success: boolean, reason?: string) => {
    if (!user) return;

    try {
      await supabase.from('audit_logs').insert({
        tenant_id: personnel?.tenant_id,
        user_id: user.id,
        personnel_id: personnel?.id,
        action: success ? 'ROUTE_ACCESS_GRANTED' : 'ROUTE_ACCESS_DENIED',
        table_name: 'route_protection',
        new_values: {
          route: location.pathname,
          required_permissions: permissions,
          required_roles: roles,
          user_role: role,
          reason: reason || 'unauthorized_access'
        },
        status: success ? 'success' : 'denied'
      });
    } catch (error) {
      console.error('Erreur lors de l\'audit de sécurité:', error);
    }
  };

  const checkAccess = () => {
    // Si aucune authentification requise et invités autorisés
    if (!requireAuth && allowGuests) {
      return true;
    }

    // Si authentification requise mais utilisateur non connecté
    if (requireAuth && !user) {
      return false;
    }

    // Si rôles spécifiques requis
    if (roles.length > 0) {
      if (requireAll) {
        // Tous les rôles requis (pour le cas d'utilisateurs multi-rôles)
        if (!roles.includes(role)) {
          logAccessAttempt(false, 'insufficient_role');
          return false;
        }
      } else {
        // Au moins un rôle requis
        if (!roles.includes(role)) {
          logAccessAttempt(false, 'insufficient_role');
          return false;
        }
      }
    }

    // Si permissions spécifiques requises
    if (permissions.length > 0) {
      if (requireAll) {
        // Toutes les permissions requises
        if (!permissions.every(permission => canAccess(permission))) {
          logAccessAttempt(false, 'insufficient_permissions');
          return false;
        }
      } else {
        // Au moins une permission requise
        if (!permissions.some(permission => canAccess(permission))) {
          logAccessAttempt(false, 'insufficient_permissions');
          return false;
        }
      }
    }

    logAccessAttempt(true);
    return true;
  };

  useEffect(() => {
    if (loading) return;

    const hasAccess = checkAccess();
    
    if (!hasAccess) {
      if (!user && requireAuth) {
        // Rediriger vers la page de connexion avec retour
        navigate(`${fallbackPath}?returnUrl=${encodeURIComponent(location.pathname)}`);
      } else {
        // Accès refusé pour utilisateur connecté
        setAccessDenied(true);
      }
    } else {
      setAccessDenied(false);
    }
  }, [user, loading, personnel, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Vérification des autorisations...</p>
        </div>
      </div>
    );
  }

  if (!user && requireAuth) {
    return null; // La redirection est gérée dans useEffect
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Accès refusé
            </h1>
            <p className="text-muted-foreground">
              Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
            </p>
          </div>

          <Alert className="border-destructive/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Votre rôle :</strong> {role}</p>
                {permissions.length > 0 && (
                  <p><strong>Permissions requises :</strong> {permissions.join(', ')}</p>
                )}
                {roles.length > 0 && (
                  <p><strong>Rôles autorisés :</strong> {roles.join(', ')}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button 
              onClick={() => navigate(-1)} 
              variant="outline" 
              className="flex-1"
            >
              Retour
            </Button>
            <Button 
              onClick={() => navigate('/tableau-de-bord')} 
              className="flex-1"
            >
              Tableau de bord
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;