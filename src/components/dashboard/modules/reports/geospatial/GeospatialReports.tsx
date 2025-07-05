import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const GeospatialReports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analyses Géospatiales</h2>
        <p className="text-muted-foreground">
          Cartographie des ventes et analyses territoriales
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module en développement</CardTitle>
          <CardDescription>
            Les analyses géospatiales seront disponibles dans la Phase 3
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ce module contiendra la cartographie des ventes, zones de chalandise et optimisation logistique.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeospatialReports;