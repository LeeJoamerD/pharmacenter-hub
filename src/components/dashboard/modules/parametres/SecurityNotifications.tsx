import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

const SecurityNotifications = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications Sécurité
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Module de notifications en cours de développement...</p>
      </CardContent>
    </Card>
  );
};

export default SecurityNotifications;