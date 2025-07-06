import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder } from 'lucide-react';

const NetworkChannelManagement = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary" />
            <CardTitle>Canaux Réseau</CardTitle>
          </div>
          <CardDescription>
            Gestion des canaux de communication spécialisés du réseau
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Module Canaux Réseau en cours de développement
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkChannelManagement;