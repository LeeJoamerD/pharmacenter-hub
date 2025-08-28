import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Settings, 
  Calendar, 
  Building2, 
  BookOpen, 
  Hash, 
  Coins, 
  Receipt, 
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  Edit,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccountingConfiguration } from '@/hooks/useAccountingConfiguration';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const AccountingConfiguration = () => {
  const { toast } = useToast();
  const { settings: systemSettings } = useSystemSettings();
  
  // States
  const [editingGeneral, setEditingGeneral] = useState(false);
  const [generalForm, setGeneralForm] = useState<any>({});
  const [editingCompany, setEditingCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState<any>({});
  
  const {
    generalConfig,
    journals = [],
    numberingRules = [],
    currencies = [],
    companyInfo,
    fiscalYears = [],
    isLoading,
    isSaving,
    saveGeneralConfig,
    updateCompanyInfo
  } = useAccountingConfiguration();

  // Initialize forms when data loads
  useEffect(() => {
    if (generalConfig) {
      setGeneralForm(generalConfig);
    }
  }, [generalConfig]);
  
  useEffect(() => {
    if (companyInfo) {
      setCompanyForm(companyInfo);
    }
  }, [companyInfo]);

  const handleSaveGeneralConfig = () => {
    if (generalForm && Object.keys(generalForm).length > 0) {
      saveGeneralConfig(generalForm);
      setEditingGeneral(false);
      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres généraux ont été mis à jour.",
      });
    }
  };

  const handleSaveCompanyInfo = () => {
    if (companyForm && Object.keys(companyForm).length > 0) {
      updateCompanyInfo(companyForm);
      setEditingCompany(false);
      toast({
        title: "Informations mises à jour",
        description: "Les informations de l'entreprise ont été sauvegardées.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Chargement de la configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuration Comptable</h2>
          <p className="text-muted-foreground">
            Paramètres généraux et exercices comptables
          </p>
        </div>
        <div className="flex gap-2">
          {(editingGeneral || editingCompany) && (
            <Button 
              variant="outline"
              onClick={() => {
                setEditingGeneral(false);
                setEditingCompany(false);
                setGeneralForm(generalConfig || {});
                setCompanyForm(companyInfo || {});
              }}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          )}
          <Button 
            onClick={() => {
              if (editingGeneral) handleSaveGeneralConfig();
              if (editingCompany) handleSaveCompanyInfo();
            }}
            disabled={isSaving || (!editingGeneral && !editingCompany)}
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="exercices">Exercices</TabsTrigger>
          <TabsTrigger value="entreprise">Entreprise</TabsTrigger>
          <TabsTrigger value="journaux">Journaux</TabsTrigger>
          <TabsTrigger value="numerotation">Numérotation</TabsTrigger>
          <TabsTrigger value="devises">Devises</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres Généraux
                </CardTitle>
                <CardDescription>
                  Configuration de base du module comptable
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div></div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingGeneral(!editingGeneral)}
                  >
                    {editingGeneral ? 'Annuler' : 'Modifier'}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Plan comptable</Label>
                  <Select 
                    value={generalForm?.plan_comptable || 'ohada'} 
                    onValueChange={(value) => setGeneralForm({...generalForm, plan_comptable: value})}
                    disabled={!editingGeneral}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ohada">OHADA</SelectItem>
                      <SelectItem value="ohada-simplifie">OHADA Simplifié</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={generalForm?.auto_lettrage || false}
                    onCheckedChange={(checked) => setGeneralForm({...generalForm, auto_lettrage: checked})}
                    disabled={!editingGeneral}
                  />
                  <Label>Lettrage automatique</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Configuration TVA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Taux TVA normal (%) - Configuration Système</Label>
                  <Input 
                    value={systemSettings?.taux_tva || 19.25} 
                    readOnly
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Taux Centime Additionnel (%) - Configuration Système</Label>
                  <Input 
                    value={systemSettings?.taux_centime_additionnel || 0} 
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              Les taux TVA et Centime Additionnel sont synchronisés depuis la Configuration Système.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="exercices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Gestion des Exercices Comptables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Exercices comptables : {fiscalYears.length} configurés</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entreprise" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations de l'Entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div></div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (editingCompany) {
                      handleSaveCompanyInfo();
                    } else {
                      setEditingCompany(true);
                    }
                  }}
                >
                  {editingCompany ? 'Sauvegarder' : 'Modifier'}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Raison sociale</Label>
                  <Input 
                    value={companyForm?.name || ''}
                    onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})}
                    disabled={!editingCompany}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={companyForm?.email || ''}
                    onChange={(e) => setCompanyForm({...companyForm, email: e.target.value})}
                    disabled={!editingCompany}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journaux" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Configuration des Journaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Journaux comptables : {journals.length} configurés</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="numerotation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Règles de Numérotation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Règles de numérotation : {numberingRules.length} configurées</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devises" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Gestion des Devises
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Devises configurées : {currencies.length}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingConfiguration;