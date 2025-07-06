import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';

const NetworkMultichannelHub = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle>Multi-canaux Réseau</CardTitle>
          </div>
          <CardDescription>
            Hub de communication multi-canaux pour le réseau
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Module Multi-canaux Réseau en cours de développement
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkMultichannelHub;