import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, Shield, Calendar, FileText, Database, Key, Archive,
  Save, Plus, Edit, Trash2, AlertTriangle, Check
} from 'lucide-react';
import { useReportSettings } from '@/hooks/useReportSettings';
import { useReportTemplates } from '@/hooks/useReportTemplates';
import { useReportPermissions } from '@/hooks/useReportPermissions';
import { useReportSchedules } from '@/hooks/useReportSchedules';
import { useReportConnectors } from '@/hooks/useReportConnectors';
import { useReportAPI } from '@/hooks/useReportAPI';
import { useReportArchiving } from '@/hooks/useReportArchiving';

const ReportsConfiguration = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [localSettings, setLocalSettings] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const reportSettings = useReportSettings();
  const reportTemplates = useReportTemplates();
  const reportPermissions = useReportPermissions();
  const reportSchedules = useReportSchedules();
  const reportConnectors = useReportConnectors();
  const reportAPI = useReportAPI();
  const reportArchiving = useReportArchiving();

  React.useEffect(() => {
    if (reportSettings.settings) {
      setLocalSettings(reportSettings.settings);
    }
  }, [reportSettings.settings]);

  const handleSettingsChange = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = () => {
    reportSettings.saveSettings(localSettings);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuration Rapports</h2>
          <p className="text-muted-foreground">
            Paramètres généraux et droits d'accès aux rapports
          </p>
        </div>
        {hasUnsavedChanges && activeTab === 'general' && (
          <Button onClick={handleSaveSettings} disabled={reportSettings.isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Droits d'accès
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Automatisation
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Modèles
          </TabsTrigger>
          <TabsTrigger value="connectors" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Connecteurs BI
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Rapports
          </TabsTrigger>
          <TabsTrigger value="archiving" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archivage
          </TabsTrigger>
        </TabsList>

        {/* Paramètres Généraux */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>Configuration globale du module de reporting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Plage de dates par défaut</Label>
                  <Select
                    value={localSettings.default_date_range || '30_days'}
                    onValueChange={(value) => handleSettingsChange('default_date_range', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7_days">7 derniers jours</SelectItem>
                      <SelectItem value="30_days">30 derniers jours</SelectItem>
                      <SelectItem value="90_days">90 derniers jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Formats d'export</Label>
                  <Select
                    value={localSettings.default_export_formats || 'pdf,xlsx'}
                    onValueChange={(value) => handleSettingsChange('default_export_formats', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF uniquement</SelectItem>
                      <SelectItem value="xlsx">Excel uniquement</SelectItem>
                      <SelectItem value="pdf,xlsx">PDF et Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Notifications activées</Label>
                  <Switch
                    checked={localSettings.notifications_enabled === 'true'}
                    onCheckedChange={(checked) => handleSettingsChange('notifications_enabled', checked.toString())}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Masquage des données sensibles</Label>
                  <Switch
                    checked={localSettings.data_masking_enabled === 'true'}
                    onCheckedChange={(checked) => handleSettingsChange('data_masking_enabled', checked.toString())}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Autres onglets avec tables de données réelles */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Droits d'accès aux rapports</CardTitle>
              <CardDescription>Gérez les permissions par utilisateur et rôle</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sujet</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rapport</TableHead>
                    <TableHead>Permissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportPermissions.permissions.map((permission: any) => (
                    <TableRow key={permission.id}>
                      <TableCell>{permission.subject_id}</TableCell>
                      <TableCell>
                        <Badge variant={permission.subject_type === 'role' ? 'default' : 'secondary'}>
                          {permission.subject_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{permission.report_key}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {permission.can_view && <Badge variant="outline">Voir</Badge>}
                          {permission.can_export && <Badge variant="outline">Exporter</Badge>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Planification automatique</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {reportSchedules.schedules.length} planifications configurées
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Modèles de rapports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {reportTemplates.templates.length} modèles disponibles
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connectors">
          <Card>
            <CardHeader>
              <CardTitle>Connecteurs BI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {reportConnectors.connectors.length} connecteurs configurés
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>Jetons API</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {reportAPI.tokens.length} tokens actifs
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archiving">
          <Card>
            <CardHeader>
              <CardTitle>Politique d'archivage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rétention (jours)</Label>
                    <Input
                      type="number"
                      value={reportArchiving.policy?.retention_days || 365}
                      onChange={(e) => reportArchiving.upsertPolicy({
                        retention_days: parseInt(e.target.value) || 365,
                        purge_enabled: reportArchiving.policy?.purge_enabled || false
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Purge automatique</Label>
                    <Switch
                      checked={reportArchiving.policy?.purge_enabled || false}
                      onCheckedChange={(checked) => reportArchiving.upsertPolicy({
                        retention_days: reportArchiving.policy?.retention_days || 365,
                        purge_enabled: checked
                      })}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => reportArchiving.applyArchivingPolicy()}
                  disabled={reportArchiving.isPurging}
                  variant="destructive"
                >
                  Purger maintenant
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsConfiguration;