import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const RegulatoryReports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Rapports Réglementaires</h2>
        <p className="text-muted-foreground">
          Conformité et rapports obligatoires pour le secteur pharmaceutique
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module en développement</CardTitle>
          <CardDescription>
            Les rapports réglementaires seront disponibles dans la Phase 3
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ce module contiendra le registre stupéfiants, traçabilité médicaments et pharmacovigilance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegulatoryReports;