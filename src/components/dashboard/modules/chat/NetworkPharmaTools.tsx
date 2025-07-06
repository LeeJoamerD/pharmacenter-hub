import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill } from 'lucide-react';

const NetworkPharmaTools = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            <CardTitle>Pharma Tools Réseau</CardTitle>
          </div>
          <CardDescription>
            Outils pharmaceutiques spécialisés pour le réseau
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Module Pharma Tools Réseau en cours de développement
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkPharmaTools;