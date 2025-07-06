import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const CentralAdministration = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Administration Centrale</CardTitle>
          </div>
          <CardDescription>
            Administration centralisée du réseau PharmaSoft multi-officines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Module Administration Centrale en cours de développement
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CentralAdministration;