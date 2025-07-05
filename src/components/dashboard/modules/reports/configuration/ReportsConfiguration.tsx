import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ReportsConfiguration = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuration Rapports</h2>
        <p className="text-muted-foreground">
          Paramètres généraux et droits d'accès aux rapports
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module en développement</CardTitle>
          <CardDescription>
            La configuration sera disponible dans la Phase 3
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ce module contiendra les paramètres généraux, droits d'accès et automatisation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsConfiguration;