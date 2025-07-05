import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ComparativeReports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analyses Comparatives</h2>
        <p className="text-muted-foreground">
          Comparaisons temporelles et benchmarking
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module en développement</CardTitle>
          <CardDescription>
            Les analyses comparatives seront disponibles dans la Phase 3
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ce module contiendra les comparaisons période vs période et analyses de variance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparativeReports;