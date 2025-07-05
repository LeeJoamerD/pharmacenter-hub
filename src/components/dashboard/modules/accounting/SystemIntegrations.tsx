import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Database,
  FileText,
  Link,
  Zap,
  Calendar,
  ExternalLink,
  ArrowRightLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SystemIntegrations = () => {
  const { toast } = useToast();
  const [syncProgress, setSyncProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [lastSync, setLastSync] = useState('2024-01-15 14:30');

  const handleModuleSync = async (module: string) => {
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          toast({
            title: "Synchronisation terminée",
            description: `Module ${module} synchronisé avec succès`,
          });
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleFECExport = async () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: "Export FEC généré",
        description: "Le fichier FEC a été généré et téléchargé",
      });
    }, 3000);
  };

  const moduleIntegrations = [
    {
      name: 'Module Stock',
      status: 'connected',
      lastSync: '15/01/2024 14:30',
      autoSync: true,
      description: 'Synchronisation des mouvements de stock et valorisation'
    },
    {
      name: 'Module Ventes',
      status: 'connected',
      lastSync: '15/01/2024 14:25',
      autoSync: true,
      description: 'Import automatique des factures et encaissements'
    },
    {
      name: 'Module Personnel',
      status: 'warning',
      lastSync: '14/01/2024 16:45',
      autoSync: false,
      description: 'Synchronisation des charges sociales et salaires'
    },
    {
      name: 'Module Partenaires',
      status: 'connected',
      lastSync: '15/01/2024 14:30',
      autoSync: true,
      description: 'Mise à jour des données fournisseurs et clients'
    }
  ];

  const externalIntegrations = [
    {
      name: 'Banque Populaire',
      type: 'bank',
      status: 'connected',
      description: 'Relevés bancaires automatiques'
    },
    {
      name: 'Expert-Comptable Portal',
      type: 'accounting',
      status: 'pending',
      description: 'Transmission des documents comptables'
    },
    {
      name: 'Administration Fiscale',
      type: 'tax',
      status: 'configured',
      description: 'Déclarations TVA et fiscales'
    },
    {
      name: 'CNSS',
      type: 'social',
      status: 'disconnected',
      description: 'Déclarations sociales automatiques'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'pending': return 'bg-blue-500';
      case 'configured': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connecté';
      case 'warning': return 'Attention';
      case 'pending': return 'En attente';
      case 'configured': return 'Configuré';
      default: return 'Déconnecté';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Intégrations Système</h2>
        <p className="text-muted-foreground">
          Synchronisation modules et intégrations externes
        </p>
      </div>

      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules">Modules Internes</TabsTrigger>
          <TabsTrigger value="external">Intégrations Externes</TabsTrigger>
          <TabsTrigger value="fec">Export FEC</TabsTrigger>
          <TabsTrigger value="api">API & Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Synchronisation des Modules
              </CardTitle>
              <CardDescription>
                Gestion de la synchronisation automatique entre les modules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Synchronisation Globale</h4>
                  <p className="text-sm text-muted-foreground">
                    Dernière synchronisation : {lastSync}
                  </p>
                </div>
                <Button onClick={() => handleModuleSync('Tous')} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Synchroniser Tout
                </Button>
              </div>

              {syncProgress > 0 && syncProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Synchronisation en cours...</span>
                    <span className="text-sm text-muted-foreground">{syncProgress}%</span>
                  </div>
                  <Progress value={syncProgress} className="w-full" />
                </div>
              )}

              <Separator />

              <div className="grid gap-4">
                {moduleIntegrations.map((module, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(module.status)}`} />
                      <div>
                        <h4 className="font-medium">{module.name}</h4>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Dernière sync : {module.lastSync}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`auto-${index}`} className="text-sm">Auto</Label>
                        <Switch 
                          id={`auto-${index}`}
                          checked={module.autoSync}
                          onCheckedChange={() => {}} 
                        />
                      </div>
                      <Badge variant="outline">
                        {getStatusText(module.status)}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleModuleSync(module.name)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="external" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Intégrations Externes
              </CardTitle>
              <CardDescription>
                Connexions avec les services externes et partenaires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {externalIntegrations.map((integration, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(integration.status)}`} />
                      <div>
                        <h4 className="font-medium">{integration.name}</h4>
                        <p className="text-sm text-muted-foreground">{integration.description}</p>
                        <Badge variant="secondary" className="mt-1">
                          {integration.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getStatusText(integration.status)}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Ajouter une Nouvelle Intégration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="integration-type">Type d'intégration</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank">Banque</SelectItem>
                        <SelectItem value="accounting">Expert-Comptable</SelectItem>
                        <SelectItem value="tax">Administration Fiscale</SelectItem>
                        <SelectItem value="social">Organisme Social</SelectItem>
                        <SelectItem value="erp">ERP Externe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="integration-name">Nom du service</Label>
                    <Input id="integration-name" placeholder="Nom du service" />
                  </div>
                </div>
                <Button className="w-full">
                  <Link className="h-4 w-4 mr-2" />
                  Configurer l'Intégration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fec" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Export FEC
              </CardTitle>
              <CardDescription>
                Fichier des Écritures Comptables pour l'administration fiscale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Information Importante</AlertTitle>
                <AlertDescription>
                  Le FEC est obligatoire pour les entreprises soumises aux BIC/BNC 
                  et tenant une comptabilité informatisée.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fec-start">Date de début</Label>
                  <Input type="date" id="fec-start" defaultValue="2024-01-01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fec-end">Date de fin</Label>
                  <Input type="date" id="fec-end" defaultValue="2024-12-31" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fec-format">Format d'export</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Format FEC" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">FEC Standard (TXT)</SelectItem>
                    <SelectItem value="excel">FEC Excel (XLSX)</SelectItem>
                    <SelectItem value="xml">FEC XML</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="include-analytics" />
                <Label htmlFor="include-analytics">Inclure la comptabilité analytique</Label>
              </div>

              <Button 
                onClick={handleFECExport}
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Générer et Télécharger le FEC
                  </>
                )}
              </Button>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Historique des Exports</h4>
                <div className="space-y-2">
                  {[
                    { date: '15/01/2024', period: '2023', format: 'TXT', size: '2.5 MB' },
                    { date: '10/07/2023', period: '2023 S1', format: 'Excel', size: '1.8 MB' },
                    { date: '15/01/2023', period: '2022', format: 'TXT', size: '2.1 MB' }
                  ].map((export_, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">FEC {export_.period}</p>
                        <p className="text-sm text-muted-foreground">
                          {export_.date} • {export_.format} • {export_.size}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                API & Webhooks
              </CardTitle>
              <CardDescription>
                Configuration des API et notifications automatiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">API REST</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>URL de base</Label>
                      <Input value="https://api.votresite.com/v1" readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Clé d'API</Label>
                      <div className="flex gap-2">
                        <Input value="sk_prod_••••••••••••••••" readOnly />
                        <Button size="sm" variant="outline">
                          Copier
                        </Button>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Documentation API
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Webhooks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>URL de notification</Label>
                      <Input placeholder="https://votre-site.com/webhook" />
                    </div>
                    <div className="space-y-2">
                      <Label>Événements</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner les événements" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="invoice.created">Facture créée</SelectItem>
                          <SelectItem value="payment.received">Paiement reçu</SelectItem>
                          <SelectItem value="account.updated">Compte mis à jour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Zap className="h-4 w-4 mr-2" />
                      Tester Webhook
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Synchronisation Programmée</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Fréquence</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Fréquence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Toutes les heures</SelectItem>
                        <SelectItem value="daily">Quotidienne</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        <SelectItem value="monthly">Mensuelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Heure</Label>
                    <Input type="time" defaultValue="02:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch defaultChecked />
                      <Label>Activé</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Logs d'Intégration</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[
                    { time: '14:30:15', type: 'success', message: 'Synchronisation module Stock réussie' },
                    { time: '14:25:32', type: 'info', message: 'Import automatique factures - 15 éléments' },
                    { time: '14:20:08', type: 'warning', message: 'Tentative de reconnexion API bancaire' },
                    { time: '14:15:45', type: 'error', message: 'Échec synchronisation CNSS - Token expiré' },
                    { time: '14:10:22', type: 'success', message: 'Export FEC généré avec succès' }
                  ].map((log, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 text-sm border-l-2 border-l-blue-500">
                      <span className="text-muted-foreground">{log.time}</span>
                      <Badge 
                        variant={log.type === 'error' ? 'destructive' : 
                               log.type === 'warning' ? 'secondary' : 'default'}
                      >
                        {log.type}
                      </Badge>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemIntegrations;