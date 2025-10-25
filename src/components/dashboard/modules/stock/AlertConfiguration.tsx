import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertTriangle } from 'lucide-react';

/**
 * AlertConfiguration Component - Désactivé temporairement
 */
const AlertConfiguration = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configuration des alertes
          </CardTitle>
          <CardDescription>
            Paramètres des notifications pour les alertes de stock
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fonctionnalité en développement</h3>
            <p className="text-muted-foreground max-w-md">
              La configuration des alertes nécessite une mise à jour du schéma de base de données.
              Cette fonctionnalité sera disponible prochainement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertConfiguration;
