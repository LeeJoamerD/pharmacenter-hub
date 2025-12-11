import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Link2, Database, Cloud, Settings2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const IntegrationsSettings = () => {
  const integrations = [
    {
      id: 'supabase',
      name: 'Supabase',
      description: 'Base de données et authentification',
      icon: Database,
      status: 'connected',
      statusLabel: 'Connecté',
    },
    {
      id: 'api-externe',
      name: 'API Externe',
      description: 'Intégration avec des systèmes tiers',
      icon: Link2,
      status: 'disconnected',
      statusLabel: 'Non configuré',
    },
    {
      id: 'cloud-storage',
      name: 'Stockage Cloud',
      description: 'Sauvegarde des fichiers et documents',
      icon: Cloud,
      status: 'disconnected',
      statusLabel: 'Non configuré',
    },
    {
      id: 'webhook',
      name: 'Webhooks',
      description: 'Notifications et événements automatiques',
      icon: ExternalLink,
      status: 'disconnected',
      statusLabel: 'Non configuré',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Globe className="h-5 w-5" />
        <span>Gérez les connexions avec les services externes et les API tierces.</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <integration.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {integration.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge 
                  variant={integration.status === 'connected' ? 'default' : 'secondary'}
                >
                  {integration.statusLabel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                disabled={integration.status === 'connected'}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                {integration.status === 'connected' ? 'Configurer' : 'Connecter'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Plus d'intégrations à venir</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            De nouvelles intégrations seront disponibles prochainement pour connecter 
            PharmaSoft à vos outils et services préférés.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsSettings;
