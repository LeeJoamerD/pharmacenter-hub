import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useDynamicPermissions } from '@/hooks/useDynamicPermissions';

interface DashboardVisibilityToggleProps {
  children: React.ReactNode;
}

export const DashboardVisibilityToggle = ({ children }: DashboardVisibilityToggleProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { canAccess } = useDynamicPermissions();
  const hasDashboardPermission = canAccess('dashboard.view');

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
          <Button onClick={() => setIsVisible(true)} variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            Afficher les informations
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {children}
    </>
  );
};

// Hook to use in dashboard headers for the toggle button
export const useDashboardVisibility = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { canAccess } = useDynamicPermissions();
  const hasDashboardPermission = canAccess('dashboard.view');

  const toggleVisibility = () => setIsVisible(prev => !prev);

  return {
    isVisible,
    setIsVisible,
    toggleVisibility,
    hasDashboardPermission,
  };
};
