import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, AlertTriangle } from 'lucide-react';

/**
 * ConventionedManager Component - Désactivé temporairement
 * 
 * Ce composant nécessite une table 'conventionnes' qui n'existe pas encore dans la base de données.
 * Pour activer ce composant, veuillez d'abord créer la table conventionnes avec les colonnes appropriées.
 */
const ConventionedManager = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Gestion des Conventionnés
          </CardTitle>
          <CardDescription>
            Gestion des établissements conventionnés (hôpitaux, cliniques, mutuelles)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fonctionnalité en développement</h3>
            <p className="text-muted-foreground max-w-md">
              Le gestionnaire de conventionnés nécessite la création d'une table de base de données.
              Cette fonctionnalité sera disponible prochainement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConventionedManager;
