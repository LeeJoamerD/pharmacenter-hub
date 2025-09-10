import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Settings, 
  Bell, 
  AlertTriangle, 
  Clock, 
  Package, 
  Mail, 
  MessageSquare, 
  Save,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { useAlertConfiguration } from '@/hooks/useAlertConfiguration';

const AlertConfiguration = () => {
  const [activeTab, setActiveTab] = useState('regles');
  const { alertRules, globalSettings, isLoading, actions } = useAlertConfiguration();
  const [editingRule, setEditingRule] = useState<any>(null);

  // Configuration avec les hooks
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stock_faible':
        return <Package className="h-4 w-4 text-orange-500" />;
      case 'peremption':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'rupture':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'surstockage':
        return <Package className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      stock_faible: 'Stock Faible',
      peremption: 'Péremption',
      rupture: 'Rupture',
      surstockage: 'Surstockage'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handleSaveGlobalSettings = () => {
    if (globalSettings) {
      actions.saveGlobalSettings(globalSettings);
    }
  };

  const handleToggleRule = (ruleId: string) => {
    actions.toggleAlertRule(ruleId);
  };

  const handleDeleteRule = (ruleId: string) => {
    actions.deleteAlertRule(ruleId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Configuration des Alertes</h3>
        <p className="text-muted-foreground">
          Paramétrage des seuils et notifications pour la surveillance automatique du stock
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="regles">
            <Bell className="h-4 w-4 mr-2" />
            Règles d'Alerte
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Mail className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres Généraux
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Règles d'Alerte Actives</CardTitle>
                  <CardDescription>
                    Configuration des conditions qui déclenchent les alertes automatiques
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Règle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Nom de la Règle</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Seuil</TableHead>
                      <TableHead>Notifications</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(rule.type)}
                            <Badge variant="outline">
                              {getTypeLabel(rule.type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{rule.nom}</TableCell>
                        <TableCell className="text-sm font-mono">{rule.condition}</TableCell>
                        <TableCell>
                          <div className="text-center">
                            <span className="font-medium">{rule.seuil}</span>
                            <div className="text-xs text-muted-foreground">{rule.unite}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {rule.notifications.email && <Mail className="h-3 w-3 text-blue-500" />}
                            {rule.notifications.sms && <MessageSquare className="h-3 w-3 text-green-500" />}
                            {rule.notifications.dashboard && <Bell className="h-3 w-3 text-orange-500" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.actif}
                            onCheckedChange={() => handleToggleRule(rule.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setEditingRule(rule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteRule(rule.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Email</CardTitle>
                <CardDescription>Paramètres du serveur de messagerie</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email-server">Serveur SMTP</Label>
                  <Input
                    id="email-server"
                    value={globalSettings?.emailServeur || ''}
                    onChange={(e) => globalSettings && actions.saveGlobalSettings({
                      ...globalSettings,
                      emailServeur: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="email-port">Port</Label>
                  <Input id="email-port" type="number" placeholder="587" />
                </div>
                <div>
                  <Label htmlFor="email-user">Utilisateur</Label>
                  <Input id="email-user" type="email" placeholder="alerts@pharmacie.sn" />
                </div>
                <div>
                  <Label htmlFor="email-template">Modèle d'Email</Label>
                  <Textarea 
                    id="email-template" 
                    placeholder="Bonjour,\n\nUne alerte a été déclenchée : {alerte}\n\nCordialement,\nSystème de gestion"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration SMS</CardTitle>
                <CardDescription>Paramètres du service SMS</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sms-provider">Fournisseur SMS</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un fournisseur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orange">Orange SMS</SelectItem>
                      <SelectItem value="tigo">Tigo SMS</SelectItem>
                      <SelectItem value="expresso">Expresso SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sms-api-key">Clé API</Label>
                  <Input id="sms-api-key" type="password" placeholder="••••••••••••" />
                </div>
                <div>
                  <Label htmlFor="sms-sender">Expéditeur</Label>
                  <Input id="sms-sender" placeholder="PHARMACIE" maxLength={11} />
                </div>
                <div>
                  <Label htmlFor="sms-template">Modèle de SMS</Label>
                  <Textarea 
                    id="sms-template" 
                    placeholder="ALERTE STOCK: {produit} - {message}"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 160 caractères
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>Configuration globale du système d'alertes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="alerts-enabled" className="text-base font-medium">
                    Système d'Alertes Activé
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Active ou désactive toutes les alertes automatiques
                  </p>
                </div>
                <Switch
                  id="alerts-enabled"
                  checked={globalSettings?.alertesActives || false}
                  onCheckedChange={(checked) => globalSettings && actions.saveGlobalSettings({
                    ...globalSettings,
                    alertesActives: checked
                  })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="check-frequency">Fréquence de Vérification</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="check-frequency"
                      type="number"
                      value={globalSettings?.frequenceVerification || 15}
                      onChange={(e) => globalSettings && actions.saveGlobalSettings({
                        ...globalSettings,
                        frequenceVerification: parseInt(e.target.value) || 15
                      })}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Intervalle entre les vérifications automatiques
                  </p>
                </div>

                <div>
                  <Label htmlFor="retention-period">Rétention Historique</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="retention-period"
                      type="number"
                      value={globalSettings?.retentionHistorique || 90}
                      onChange={(e) => globalSettings && actions.saveGlobalSettings({
                        ...globalSettings,
                        retentionHistorique: parseInt(e.target.value) || 90
                      })}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">jours</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Durée de conservation de l'historique des alertes
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveGlobalSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button variant="outline">
                  Tester Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertConfiguration;