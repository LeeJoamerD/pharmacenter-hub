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
  Database,
  Download,
  Upload,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccountingConfiguration } from '@/hooks/useAccountingConfiguration';

const AccountingConfiguration = () => {
  const { toast } = useToast();
  const [newJournal, setNewJournal] = useState({ code: '', name: '', type: '' });
  const [newCurrency, setNewCurrency] = useState({ code: '', name: '', rate: 1 });
  const [newFiscalYear, setNewFiscalYear] = useState({ year: '', start_date: '', end_date: '' });
  const [editingGeneral, setEditingGeneral] = useState(false);
  const [generalForm, setGeneralForm] = useState<any>({});
  const [companyForm, setCompanyForm] = useState<any>({});
  const [editingCompany, setEditingCompany] = useState(false);

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
    saveJournal,
    deleteJournal,
    saveNumberingRule,
    saveCurrency,
    saveExchangeRate,
    updateCompanyInfo,
    saveFiscalYear,
    deleteFiscalYear
  } = useAccountingConfiguration();

  // Initialize forms when data loads
  useEffect(() => {
    if (generalConfig && !editingGeneral) {
      setGeneralForm(generalConfig);
    }
  }, [generalConfig, editingGeneral]);

  useEffect(() => {
    if (companyInfo && !editingCompany) {
      setCompanyForm(companyInfo);
    }
  }, [companyInfo, editingCompany]);

  const handleSaveGeneralConfig = () => {
    if (generalForm && Object.keys(generalForm).length > 0) {
      saveGeneralConfig(generalForm);
      setEditingGeneral(false);
    }
  };

  const handleSaveCompanyInfo = () => {
    if (companyForm && Object.keys(companyForm).length > 0) {
      updateCompanyInfo(companyForm);
      setEditingCompany(false);
    }
  };

  const handleAddJournal = () => {
    if (newJournal.code && newJournal.name && newJournal.type) {
      saveJournal({ 
        ...newJournal, 
        auto_generation: false,
        is_active: true 
      });
      setNewJournal({ code: '', name: '', type: '' });
    }
  };

  const handleAddCurrency = () => {
    if (newCurrency.code && newCurrency.name) {
      saveCurrency({ 
        ...newCurrency, 
        is_base_currency: false,
        is_active: true 
      });
      // Also create initial exchange rate
      setTimeout(() => {
        saveExchangeRate({
          currency_id: newCurrency.code, // Will be updated with actual ID
          rate: newCurrency.rate,
          rate_date: new Date().toISOString().split('T')[0],
          auto_update_enabled: false
        });
      }, 100);
      setNewCurrency({ code: '', name: '', rate: 1 });
    }
  };

  const handleAddFiscalYear = () => {
    if (newFiscalYear.year && newFiscalYear.start_date && newFiscalYear.end_date) {
      saveFiscalYear({
        ...newFiscalYear,
        status: 'active'
      });
      setNewFiscalYear({ year: '', start_date: '', end_date: '' });
    }
  };

  const handleUpdateNumberingRule = (ruleType: string, field: string, value: any) => {
    const existingRule = numberingRules.find(r => r.rule_type === ruleType);
    if (existingRule) {
      saveNumberingRule({
        ...existingRule,
        [field]: value
      });
    } else {
      saveNumberingRule({
        rule_type: ruleType,
        format_pattern: ruleType === 'facture' ? 'FAC-{YYYY}-{MM}-{####}' : '{JOURNAL}-{YYYY}{MM}-{####}',
        current_number: 1,
        reset_frequency: 'annuel',
        [field]: value
      });
    }
  };

  const getYearStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'closed': return 'bg-blue-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getYearStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'closed': return 'Clôturé';
      case 'archived': return 'Archivé';
      default: return 'Inconnu';
    }
  };

  const formatCurrencyRate = (rate: number) => {
    return rate.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  const getCurrentExchangeRate = (currency: any) => {
    if (!currency.exchange_rates || currency.exchange_rates.length === 0) return 1;
    const latestRate = currency.exchange_rates.sort((a: any, b: any) => 
      new Date(b.rate_date).getTime() - new Date(a.rate_date).getTime()
    )[0];
    return latestRate?.rate || 1;
  };

  const getNextPreview = (rule: any) => {
    if (!rule) return '';
    let preview = rule.format_pattern;
    const today = new Date();
    preview = preview.replace('{YYYY}', today.getFullYear().toString());
    preview = preview.replace('{YY}', today.getFullYear().toString().slice(-2));
    preview = preview.replace('{MM}', (today.getMonth() + 1).toString().padStart(2, '0'));
    preview = preview.replace('{DD}', today.getDate().toString().padStart(2, '0'));
    preview = preview.replace('{####}', rule.current_number.toString().padStart(4, '0'));
    preview = preview.replace('{JOURNAL}', 'XXX');
    return preview;
  };

  const getNumberingRule = (ruleType: string) => {
    return numberingRules.find(r => r.rule_type === ruleType);
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
          {editingGeneral && (
            <Button 
              onClick={handleSaveGeneralConfig}
              disabled={isSaving}
              className="animate-fade-in"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder Général
                </>
              )}
            </Button>
          )}
          {editingCompany && (
            <Button 
              onClick={handleSaveCompanyInfo}
              disabled={isSaving}
              className="animate-fade-in"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder Entreprise
                </>
              )}
            </Button>
          )}
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
            <Card className="hover-scale">
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
                <div className="space-y-2">
                  <Label htmlFor="plan-comptable">Plan comptable</Label>
                  <Select 
                    value={generalForm?.plan_comptable || 'ohada'}
                    onValueChange={(value) => {
                      setGeneralForm({ ...generalForm, plan_comptable: value });
                      setEditingGeneral(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ohada">OHADA (Système comptable)</SelectItem>
                      <SelectItem value="ohada-simplifie">OHADA Simplifié</SelectItem>
                      <SelectItem value="custom">Plan personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="decimal-places">Nombre de décimales</Label>
                  <Select 
                    value={generalForm?.decimal_places?.toString() || '2'}
                    onValueChange={(value) => {
                      setGeneralForm({ ...generalForm, decimal_places: parseInt(value) });
                      setEditingGeneral(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 décimale</SelectItem>
                      <SelectItem value="2">2 décimales</SelectItem>
                      <SelectItem value="3">3 décimales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="auto-lettrage" 
                    checked={generalForm?.auto_lettrage || false}
                    onCheckedChange={(checked) => {
                      setGeneralForm({ ...generalForm, auto_lettrage: checked });
                      setEditingGeneral(true);
                    }}
                  />
                  <Label htmlFor="auto-lettrage">Lettrage automatique</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="controle-equilibre" 
                    checked={generalForm?.controle_equilibre || false}
                    onCheckedChange={(checked) => {
                      setGeneralForm({ ...generalForm, controle_equilibre: checked });
                      setEditingGeneral(true);
                    }}
                  />
                  <Label htmlFor="controle-equilibre">Contrôle d'équilibre obligatoire</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="saisie-analytique" 
                    checked={generalForm?.saisie_analytique || false}
                    onCheckedChange={(checked) => {
                      setGeneralForm({ ...generalForm, saisie_analytique: checked });
                      setEditingGeneral(true);
                    }}
                  />
                  <Label htmlFor="saisie-analytique">Saisie analytique obligatoire</Label>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Configuration TVA
                </CardTitle>
                <CardDescription>
                  Paramètres de gestion de la TVA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regime-tva">Régime TVA</Label>
                  <Select 
                    value={generalForm?.regime_tva || 'reel'}
                    onValueChange={(value) => {
                      setGeneralForm({ ...generalForm, regime_tva: value });
                      setEditingGeneral(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reel">Régime réel</SelectItem>
                      <SelectItem value="simplifie">Régime simplifié</SelectItem>
                      <SelectItem value="franchise">Franchise de base</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taux-tva-normal">Taux TVA normal (%)</Label>
                  <Input 
                    id="taux-tva-normal" 
                    type="number"
                    step="0.01"
                    value={generalForm?.taux_tva_normal || 18}
                    onChange={(e) => {
                      setGeneralForm({ ...generalForm, taux_tva_normal: parseFloat(e.target.value) });
                      setEditingGeneral(true);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taux-tva-reduit">Taux TVA réduit (%)</Label>
                  <Input 
                    id="taux-tva-reduit" 
                    type="number"
                    step="0.01"
                    value={generalForm?.taux_tva_reduit || 0}
                    onChange={(e) => {
                      setGeneralForm({ ...generalForm, taux_tva_reduit: parseFloat(e.target.value) });
                      setEditingGeneral(true);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodicite-tva">Périodicité déclaration</Label>
                  <Select 
                    value={generalForm?.periodicite_tva || 'mensuelle'}
                    onValueChange={(value) => {
                      setGeneralForm({ ...generalForm, periodicite_tva: value });
                      setEditingGeneral(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensuelle">Mensuelle</SelectItem>
                      <SelectItem value="trimestrielle">Trimestrielle</SelectItem>
                      <SelectItem value="annuelle">Annuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="auto-calcul-tva" 
                    checked={generalForm?.auto_calcul_tva || false}
                    onCheckedChange={(checked) => {
                      setGeneralForm({ ...generalForm, auto_calcul_tva: checked });
                      setEditingGeneral(true);
                    }}
                  />
                  <Label htmlFor="auto-calcul-tva">Calcul automatique TVA</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              Les modifications des paramètres généraux nécessitent une validation par un administrateur 
              et peuvent affecter l'ensemble du système comptable.
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
              <CardDescription>
                Configuration et gestion des périodes comptables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Exercices comptables</h4>
                  <p className="text-sm text-muted-foreground">
                    {fiscalYears.length} exercice(s) configuré(s)
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Nouvel Exercice
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouvel Exercice Comptable</DialogTitle>
                      <DialogDescription>
                        Créer un nouvel exercice comptable
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-year">Année</Label>
                        <Input 
                          id="new-year" 
                          placeholder="2025"
                          value={newFiscalYear.year}
                          onChange={(e) => setNewFiscalYear({ ...newFiscalYear, year: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Date de début</Label>
                        <Input 
                          type="date" 
                          id="start-date"
                          value={newFiscalYear.start_date}
                          onChange={(e) => setNewFiscalYear({ ...newFiscalYear, start_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">Date de fin</Label>
                        <Input 
                          type="date" 
                          id="end-date"
                          value={newFiscalYear.end_date}
                          onChange={(e) => setNewFiscalYear({ ...newFiscalYear, end_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddFiscalYear} disabled={!newFiscalYear.year || !newFiscalYear.start_date || !newFiscalYear.end_date}>
                        Créer l'Exercice
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {fiscalYears.map((year) => (
                  <div key={year.id} className="flex items-center justify-between p-4 border rounded-lg animate-fade-in">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getYearStatusColor(year.status)}`} />
                      <div>
                        <h4 className="font-medium">Exercice {year.year}</h4>
                        <p className="text-sm text-muted-foreground">
                          Du {new Date(year.start_date).toLocaleDateString()} au {new Date(year.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getYearStatusText(year.status)}
                      </Badge>
                      {year.status === 'active' && (
                        <Badge className="bg-green-500">
                          Actuel
                        </Badge>
                      )}
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {year.status !== 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteFiscalYear(year.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Attention</AlertTitle>
                <AlertDescription>
                  La clôture d'un exercice est irréversible. Assurez-vous que toutes 
                  les écritures de l'exercice sont correctement saisies avant la clôture.
                </AlertDescription>
              </Alert>
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
              <CardDescription>
                Données légales et coordonnées de l'entreprise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="raison-sociale">Raison sociale</Label>
                  <Input 
                    id="raison-sociale" 
                    value={companyForm?.name || ''} 
                    onChange={(e) => {
                      setCompanyForm({ ...companyForm, name: e.target.value });
                      setEditingCompany(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forme-juridique">Type</Label>
                  <Select 
                    value={companyForm?.type || 'Pharmacie'}
                    onValueChange={(value) => {
                      setCompanyForm({ ...companyForm, type: value });
                      setEditingCompany(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pharmacie">Pharmacie</SelectItem>
                      <SelectItem value="SARL">SARL</SelectItem>
                      <SelectItem value="SA">SA</SelectItem>
                      <SelectItem value="SAS">SAS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code Pharmacie</Label>
                  <Input 
                    id="code" 
                    value={companyForm?.code || ''} 
                    onChange={(e) => {
                      setCompanyForm({ ...companyForm, code: e.target.value });
                      setEditingCompany(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Région</Label>
                  <Input 
                    id="region" 
                    value={companyForm?.region || ''} 
                    onChange={(e) => {
                      setCompanyForm({ ...companyForm, region: e.target.value });
                      setEditingCompany(true);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse complète</Label>
                <Textarea 
                  id="adresse" 
                  value={companyForm?.address || ''}
                  rows={3}
                  onChange={(e) => {
                    setCompanyForm({ ...companyForm, address: e.target.value });
                    setEditingCompany(true);
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input 
                    id="telephone" 
                    value={companyForm?.telephone_appel || ''} 
                    onChange={(e) => {
                      setCompanyForm({ ...companyForm, telephone_appel: e.target.value });
                      setEditingCompany(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={companyForm?.email || ''} 
                    onChange={(e) => {
                      setCompanyForm({ ...companyForm, email: e.target.value });
                      setEditingCompany(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input 
                    id="whatsapp" 
                    value={companyForm?.telephone_whatsapp || ''} 
                    onChange={(e) => {
                      setCompanyForm({ ...companyForm, telephone_whatsapp: e.target.value });
                      setEditingCompany(true);
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ville">Ville</Label>
                  <Input 
                    id="ville" 
                    value={companyForm?.city || ''} 
                    onChange={(e) => {
                      setCompanyForm({ ...companyForm, city: e.target.value });
                      setEditingCompany(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pays">Pays</Label>
                  <Input 
                    id="pays" 
                    value={companyForm?.pays || ''} 
                    onChange={(e) => {
                      setCompanyForm({ ...companyForm, pays: e.target.value });
                      setEditingCompany(true);
                    }}
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
              <CardDescription>
                Gestion des journaux comptables et de leurs paramètres
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Journaux comptables</h4>
                  <p className="text-sm text-muted-foreground">
                    {journals.length} journaux configurés
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Nouveau Journal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouveau Journal Comptable</DialogTitle>
                      <DialogDescription>
                        Créer un nouveau journal comptable
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="journal-code">Code journal</Label>
                        <Input 
                          id="journal-code" 
                          placeholder="ex: VTE" 
                          maxLength={3}
                          value={newJournal.code}
                          onChange={(e) => setNewJournal({ ...newJournal, code: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="journal-nom">Nom du journal</Label>
                        <Input 
                          id="journal-nom" 
                          placeholder="ex: Journal des Ventes"
                          value={newJournal.name}
                          onChange={(e) => setNewJournal({ ...newJournal, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="journal-type">Type</Label>
                        <Select 
                          value={newJournal.type}
                          onValueChange={(value) => setNewJournal({ ...newJournal, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type de journal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ventes">Ventes</SelectItem>
                            <SelectItem value="achats">Achats</SelectItem>
                            <SelectItem value="banque">Banque</SelectItem>
                            <SelectItem value="caisse">Caisse</SelectItem>
                            <SelectItem value="general">Général</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddJournal} disabled={!newJournal.code || !newJournal.name || !newJournal.type}>
                        Créer le Journal
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {journals.map((journal) => (
                  <div key={journal.id} className="flex items-center justify-between p-4 border rounded-lg animate-fade-in">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-primary">{journal.code}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{journal.name}</h4>
                        <p className="text-sm text-muted-foreground">Type : {journal.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {journal.auto_generation && (
                          <Badge className="bg-blue-500">
                            Auto
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {journal.type}
                        </Badge>
                        {journal.is_active && (
                          <Badge className="bg-green-500">
                            Actif
                          </Badge>
                        )}
                      </div>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteJournal(journal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
              <CardDescription>
                Configuration des formats de numérotation automatique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Numérotation des pièces comptables</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="format-facture">Format factures</Label>
                      <Input 
                        id="format-facture" 
                        value={getNumberingRule('facture')?.format_pattern || 'FAC-{YYYY}-{MM}-{####}'}
                        onChange={(e) => handleUpdateNumberingRule('facture', 'format_pattern', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prochain-numero-facture">Prochain numéro</Label>
                      <Input 
                        id="prochain-numero-facture" 
                        value={getNextPreview(getNumberingRule('facture'))}
                        readOnly 
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Numérotation des écritures</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="format-ecriture">Format écritures</Label>
                      <Input 
                        id="format-ecriture" 
                        value={getNumberingRule('ecriture')?.format_pattern || '{JOURNAL}-{YYYY}{MM}-{####}'}
                        onChange={(e) => handleUpdateNumberingRule('ecriture', 'format_pattern', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reset-annuel">Remise à zéro</Label>
                      <Select 
                        value={getNumberingRule('ecriture')?.reset_frequency || 'annuel'}
                        onValueChange={(value) => handleUpdateNumberingRule('ecriture', 'reset_frequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="jamais">Jamais</SelectItem>
                          <SelectItem value="annuel">Annuelle</SelectItem>
                          <SelectItem value="mensuel">Mensuelle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Variables disponibles</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-mono bg-muted px-2 py-1 rounded">{`{YYYY}`}</span>
                        <span className="text-muted-foreground">Année (4 chiffres)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-mono bg-muted px-2 py-1 rounded">{`{YY}`}</span>
                        <span className="text-muted-foreground">Année (2 chiffres)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-mono bg-muted px-2 py-1 rounded">{`{MM}`}</span>
                        <span className="text-muted-foreground">Mois (2 chiffres)</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-mono bg-muted px-2 py-1 rounded">{`{DD}`}</span>
                        <span className="text-muted-foreground">Jour (2 chiffres)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-mono bg-muted px-2 py-1 rounded">{`{####}`}</span>
                        <span className="text-muted-foreground">Numéro séquentiel</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-mono bg-muted px-2 py-1 rounded">{`{JOURNAL}`}</span>
                        <span className="text-muted-foreground">Code journal</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
              <CardDescription>
                Configuration des devises et taux de change
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Devise de base</AlertTitle>
                <AlertDescription>
                  La devise de base de votre comptabilité est le <strong>Franc CFA (XOF)</strong>.
                  Tous les montants sont convertis dans cette devise pour les calculs.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Devises configurées</h4>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Ajouter Devise
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nouvelle Devise</DialogTitle>
                        <DialogDescription>
                          Ajouter une nouvelle devise au système
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currency-code">Code devise</Label>
                          <Input 
                            id="currency-code" 
                            placeholder="ex: EUR" 
                            maxLength={3}
                            value={newCurrency.code}
                            onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currency-name">Nom de la devise</Label>
                          <Input 
                            id="currency-name" 
                            placeholder="ex: Euro"
                            value={newCurrency.name}
                            onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currency-rate">Taux de change (vs XOF)</Label>
                          <Input 
                            id="currency-rate" 
                            type="number"
                            step="0.000001"
                            placeholder="ex: 655.957"
                            value={newCurrency.rate}
                            onChange={(e) => setNewCurrency({ ...newCurrency, rate: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddCurrency} disabled={!newCurrency.code || !newCurrency.name}>
                          Ajouter la Devise
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-2">
                  {currencies.map((currency) => (
                    <div key={currency.id} className="flex items-center justify-between p-3 border rounded-lg animate-fade-in">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="font-bold text-primary text-sm">{currency.code}</span>
                        </div>
                        <div>
                          <h5 className="font-medium">{currency.name}</h5>
                          <p className="text-sm text-muted-foreground">
                            1 {currency.code} = {formatCurrencyRate(getCurrentExchangeRate(currency))} XOF
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currency.is_base_currency && (
                          <Badge className="bg-green-500">
                            Base
                          </Badge>
                        )}
                        {currency.is_active && (
                          <Badge className="bg-blue-500">
                            Actif
                          </Badge>
                        )}
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!currency.is_base_currency && (
                          <Button size="sm" variant="outline">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Mise à jour des taux</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="auto-update" />
                    <Label htmlFor="auto-update">Mise à jour automatique</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-frequency">Fréquence</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Toutes les heures</SelectItem>
                        <SelectItem value="daily">Quotidienne</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Mettre à jour tous les taux maintenant
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingConfiguration;