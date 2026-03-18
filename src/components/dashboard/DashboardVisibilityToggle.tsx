import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useDynamicPermissions } from '@/hooks/useDynamicPermissions';

interface DashboardVisibilityToggleProps {
  /** Whether the dashboard content is currently visible */
  isVisible: boolean;
  /** Callback to show the dashboard */
  onShow: () => void;
  /** Whether the user has permission to view the dashboard */
  hasDashboardPermission: boolean;
  /** Content to render when visible */
  children: React.ReactNode;
}

/**
 * Props-driven visibility guard for dashboard content.
 * Does NOT manage its own state — the parent is the single source of truth.
 */
export const DashboardVisibilityToggle = ({
  isVisible,
  onShow,
  hasDashboardPermission,
  children,
}: DashboardVisibilityToggleProps) => {
  if (!hasDashboardPermission) {
    return (
      <Alert variant="destructive" className="mt-4">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Accès refusé</AlertTitle>
        <AlertDescription>
          Vous n'avez pas la permission de voir ce tableau de bord. Contactez votre administrateur.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isVisible) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <EyeOff className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-4">
            Informations du tableau de bord masquées
          </p>
          <Button onClick={onShow} variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            Afficher les informations
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

// Hook to use in dashboard components — single source of truth for visibility
export const useDashboardVisibility = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { canAccess } = useDynamicPermissions();
  const hasDashboardPermission = canAccess('dashboard.view');

  const toggleVisibility = () => setIsVisible(prev => !prev);
  const show = () => setIsVisible(true);

  return {
    isVisible,
    setIsVisible,
    toggleVisibility,
    show,
    hasDashboardPermission,
  };
};
