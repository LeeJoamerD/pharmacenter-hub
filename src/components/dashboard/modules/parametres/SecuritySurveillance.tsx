import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

const SecuritySurveillance = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Surveillance Sécuritaire
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Module de surveillance en cours de développement...</p>
      </CardContent>
    </Card>
  );
};

export default SecuritySurveillance;