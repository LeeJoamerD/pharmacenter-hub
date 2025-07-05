import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AIReports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Intelligence Artificielle</h2>
        <p className="text-muted-foreground">
          Analyses prédictives et détection d'anomalies par IA
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module en développement</CardTitle>
          <CardDescription>
            Les fonctionnalités IA seront disponibles dans la Phase 3
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ce module contiendra la détection d'anomalies, prévisions saisonnières et machine learning.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIReports;