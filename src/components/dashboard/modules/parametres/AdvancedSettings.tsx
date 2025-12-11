import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cog, Database, Code, Terminal, FileJson, Trash2, Download, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AdvancedSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Cog className="h-5 w-5" />
        <span>Paramètres avancés réservés aux administrateurs système.</span>
      </div>

      <Alert variant="destructive">
        <AlertTitle className="flex items-center gap-2">
          <Cog className="h-4 w-4" />
          Zone sensible
        </AlertTitle>
        <AlertDescription>
          Ces paramètres peuvent affecter le fonctionnement du système. 
          Modifiez-les uniquement si vous savez ce que vous faites.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mode développeur</CardTitle>
          <CardDescription>
            Options de débogage et de développement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-lg">
                <Terminal className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div>
                <Label className="font-medium">Mode debug</Label>
                <p className="text-sm text-muted-foreground">
                  Activer les logs détaillés dans la console
                </p>
              </div>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-lg">
                <Code className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div>
                <Label className="font-medium">Afficher les erreurs détaillées</Label>
                <p className="text-sm text-muted-foreground">
                  Montrer les stack traces en cas d'erreur
                </p>
              </div>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gestion des données</CardTitle>
          <CardDescription>
            Import, export et maintenance des données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Button variant="outline" className="justify-start">
              <Download className="h-4 w-4 mr-2" />
              Exporter toutes les données
            </Button>
            <Button variant="outline" className="justify-start">
              <FileJson className="h-4 w-4 mr-2" />
              Exporter la configuration
            </Button>
            <Button variant="outline" className="justify-start">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Réinitialiser le cache
            </Button>
            <Button variant="outline" className="justify-start">
              <Database className="h-4 w-4 mr-2" />
              Optimiser la base de données
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Zone de danger</CardTitle>
          <CardDescription>
            Actions irréversibles - Procédez avec précaution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-destructive">
                  Réinitialiser tous les paramètres
                </h4>
                <p className="text-sm text-muted-foreground">
                  Restaurer tous les paramètres à leurs valeurs par défaut
                </p>
              </div>
              <Button variant="destructive" size="sm" disabled>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>
          <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-destructive">
                  Purger les données de test
                </h4>
                <p className="text-sm text-muted-foreground">
                  Supprimer toutes les données de démonstration
                </p>
              </div>
              <Button variant="destructive" size="sm" disabled>
                <Trash2 className="h-4 w-4 mr-2" />
                Purger
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedSettings;
