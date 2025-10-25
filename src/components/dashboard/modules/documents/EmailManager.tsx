import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, AlertTriangle } from 'lucide-react';

/**
 * EmailManager Component - Désactivé temporairement
 * 
 * Ce composant nécessite une table 'emails' qui n'existe pas encore dans la base de données.
 * Pour activer ce composant, veuillez d'abord créer la table emails avec les colonnes appropriées.
 */
const EmailManager = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gestion des Emails
          </CardTitle>
          <CardDescription>
            Emails intelligemment classifiés et analysés par IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fonctionnalité en développement</h3>
            <p className="text-muted-foreground max-w-md">
              Le gestionnaire d'emails nécessite la création d'une table de base de données.
              Cette fonctionnalité sera disponible prochainement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailManager;
