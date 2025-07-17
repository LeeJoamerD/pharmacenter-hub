import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const SecurityIncidents = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Gestion des Incidents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Module de gestion des incidents en cours de développement...</p>
      </CardContent>
    </Card>
  );
};

export default SecurityIncidents;