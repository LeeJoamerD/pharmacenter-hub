import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const MobileReports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reporting Mobile</h2>
        <p className="text-muted-foreground">
          Accès aux rapports optimisé pour mobile et tablette
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module en développement</CardTitle>
          <CardDescription>
            L'interface mobile sera disponible dans la Phase 3
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ce module contiendra les notifications KPI, consultation offline et dashboard mobile.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileReports;