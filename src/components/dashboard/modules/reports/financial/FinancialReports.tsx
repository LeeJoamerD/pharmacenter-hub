import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const FinancialReports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Rapports Financiers</h2>
        <p className="text-muted-foreground">
          Analyses financières et comptables détaillées
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module en développement</CardTitle>
          <CardDescription>
            Les rapports financiers seront disponibles dans la Phase 2
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ce module contiendra les analyses de revenus, rentabilité, coûts et trésorerie.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReports;