import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CustomerReports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Rapports Clients</h2>
        <p className="text-muted-foreground">
          Analyses du comportement et de la segmentation clientèle
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module en développement</CardTitle>
          <CardDescription>
            Les analyses clientèle seront disponibles dans la Phase 2
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ce module contiendra les analyses de comportement, segmentation, fidélisation et assurances.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerReports;