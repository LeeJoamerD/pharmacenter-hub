import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, Building2, MapPin, Users, Settings2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const MultiSitesSettings = () => {
  const sites = [
    {
      id: '1',
      name: 'Pharmacie Centrale',
      address: '123 Avenue Principale',
      status: 'active',
      isPrimary: true,
      usersCount: 8,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Network className="h-5 w-5" />
        <span>Gérez plusieurs sites et synchronisez les données entre pharmacies.</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Sites configurés</CardTitle>
              <CardDescription>
                Liste des pharmacies connectées au réseau
              </CardDescription>
            </div>
            <Button size="sm" disabled>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un site
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sites.map((site) => (
            <div 
              key={site.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{site.name}</h4>
                    {site.isPrimary && (
                      <Badge variant="secondary">Principal</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {site.address}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {site.usersCount} utilisateurs
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={site.status === 'active' ? 'default' : 'secondary'}>
                  {site.status === 'active' ? 'Actif' : 'Inactif'}
                </Badge>
                <Button variant="ghost" size="icon">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Options de synchronisation</CardTitle>
          <CardDescription>
            Configurez la synchronisation des données entre sites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Synchronisation automatique</Label>
              <p className="text-sm text-muted-foreground">
                Synchroniser automatiquement les données entre tous les sites
              </p>
            </div>
            <Switch disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Partage du catalogue produits</Label>
              <p className="text-sm text-muted-foreground">
                Utiliser un catalogue produits commun entre sites
              </p>
            </div>
            <Switch disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Transferts inter-sites</Label>
              <p className="text-sm text-muted-foreground">
                Permettre les transferts de stock entre pharmacies
              </p>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Network className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Fonctionnalité Multi-Sites</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            La gestion multi-sites permet de connecter plusieurs pharmacies 
            et de centraliser la gestion. Cette fonctionnalité sera disponible 
            dans une prochaine mise à jour.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiSitesSettings;
