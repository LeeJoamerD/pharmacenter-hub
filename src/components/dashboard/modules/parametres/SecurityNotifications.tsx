import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

/**
 * SecurityNotifications Component - Désactivé temporairement
 * 
 * Ce composant nécessite une table 'preferences_utilisateur' qui n'existe pas encore.
 */
const SecurityNotifications = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Notifications de sécurité
          </CardTitle>
          <CardDescription>
            Configuration des notifications de sécurité et d'audit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fonctionnalité en développement</h3>
            <p className="text-muted-foreground max-w-md">
              Les notifications de sécurité nécessitent la création d'une table preferences_utilisateur.
              Cette fonctionnalité sera disponible prochainement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityNotifications;
