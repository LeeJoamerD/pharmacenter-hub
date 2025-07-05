import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const BIDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Business Intelligence</h2>
        <p className="text-muted-foreground">
          Tableaux de bord intelligents et analyses prédictives
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module en développement</CardTitle>
          <CardDescription>
            Les fonctionnalités BI seront disponibles dans la Phase 2
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ce module contiendra les dashboards exécutifs, analyses prédictives et KPI personnalisés.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BIDashboard;