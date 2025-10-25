import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertTriangle } from 'lucide-react';

/**
 * ReportsConfiguration Component - Désactivé temporairement
 */
const ReportsConfiguration = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configuration des rapports
          </CardTitle>
          <CardDescription>
            Paramètres de génération et d'archivage des rapports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fonctionnalité en développement</h3>
            <p className="text-muted-foreground max-w-md">
              La configuration des rapports nécessite une mise à jour du schéma de base de données.
              Cette fonctionnalité sera disponible prochainement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsConfiguration;
