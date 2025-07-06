import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

const NetworkMessaging = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle>Messagerie Réseau</CardTitle>
          </div>
          <CardDescription>
            Communication inter-officines et gestion des messages réseau
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Module Messagerie Réseau en cours de développement
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkMessaging;