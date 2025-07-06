import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';

const MultiPharmacyManagement = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <CardTitle>Multi-Officines</CardTitle>
          </div>
          <CardDescription>
            Gestion et coordination des multiples officines du réseau
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Module Multi-Officines en cours de développement
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiPharmacyManagement;