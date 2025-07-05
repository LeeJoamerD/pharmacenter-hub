import React, { useState } from 'react';
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

const AccountingConfiguration = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activeYear, setActiveYear] = useState('2024');

  const handleSaveConfiguration = async () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres comptables ont été mis à jour avec succès",
      });
    }, 2000);
  };

  const fiscalYears = [
    { year: '2024', status: 'active', startDate: '01/01/2024', endDate: '31/12/2024' },
    { year: '2023', status: 'closed', startDate: '01/01/2023', endDate: '31/12/2023' },
    { year: '2022', status: 'archived', startDate: '01/01/2022', endDate: '31/12/2022' }
  ];

  const journals = [
    { code: 'VTE', name: 'Journal des Ventes', type: 'Ventes', auto: true },
    { code: 'ACH', name: 'Journal des Achats', type: 'Achats', auto: true },
    { code: 'BQ1', name: 'Banque Principale', type: 'Banque', auto: false },
    { code: 'CAI', name: 'Journal de Caisse', type: 'Caisse', auto: false },
    { code: 'OD', name: 'Opérations Diverses', type: 'Général', auto: false }
  ];

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuration Comptable</h2>
          <p className="text-muted-foreground">
            Paramètres généraux et exercices comptables
          </p>
        </div>
        <Button 
          onClick={handleSaveConfiguration}
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
              Sauvegarder
            </>
          )}
        </Button>
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
                  <Select defaultValue="ohada">
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
                  <Select defaultValue="2">
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
                  <Switch id="auto-lettrage" defaultChecked />
                  <Label htmlFor="auto-lettrage">Lettrage automatique</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="controle-equilibre" defaultChecked />
                  <Label htmlFor="controle-equilibre">Contrôle d'équilibre obligatoire</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="saisie-analytique" />
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
                  <Select defaultValue="reel">
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
                  <Input id="taux-tva-normal" defaultValue="18" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taux-tva-reduit">Taux TVA réduit (%)</Label>
                  <Input id="taux-tva-reduit" defaultValue="0" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodicite-tva">Périodicité déclaration</Label>
                  <Select defaultValue="mensuelle">
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
                  <Switch id="auto-calcul-tva" defaultChecked />
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
                    Exercice actif : {activeYear}
                  </p>
                </div>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nouvel Exercice
                </Button>
              </div>

              <div className="space-y-4">
                {fiscalYears.map((year, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg animate-fade-in">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getYearStatusColor(year.status)}`} />
                      <div>
                        <h4 className="font-medium">Exercice {year.year}</h4>
                        <p className="text-sm text-muted-foreground">
                          Du {year.startDate} au {year.endDate}
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
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-year">Nouvel exercice</Label>
                  <Input id="new-year" placeholder="2025" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Date de début</Label>
                  <Input type="date" id="start-date" />
                </div>
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
                  <Input id="raison-sociale" defaultValue="PHARMACIE CENTRALE SARL" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forme-juridique">Forme juridique</Label>
                  <Select defaultValue="sarl">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sarl">SARL</SelectItem>
                      <SelectItem value="sa">SA</SelectItem>
                      <SelectItem value="ei">Entreprise Individuelle</SelectItem>
                      <SelectItem value="sas">SAS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siret">N° RCCM</Label>
                  <Input id="siret" defaultValue="CI-ABJ-2019-B-12345" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="num-tva">N° TVA</Label>
                  <Input id="num-tva" defaultValue="CI123456789" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse complète</Label>
                <Textarea 
                  id="adresse" 
                  defaultValue="Boulevard de la République, Plateau, Abidjan, Côte d'Ivoire"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input id="telephone" defaultValue="+225 20 21 22 23" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="contact@pharmacie-centrale.ci" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-web">Site web</Label>
                  <Input id="site-web" defaultValue="www.pharmacie-centrale.ci" />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Représentant légal</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="representant-nom">Nom complet</Label>
                    <Input id="representant-nom" defaultValue="Dr. KOUAME Adjoua Marie" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="representant-fonction">Fonction</Label>
                    <Input id="representant-fonction" defaultValue="Gérant" />
                  </div>
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
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau Journal
                </Button>
              </div>

              <div className="space-y-4">
                {journals.map((journal, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg animate-fade-in">
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
                        {journal.auto && (
                          <Badge className="bg-blue-500">
                            Auto
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {journal.type}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="journal-code">Code journal</Label>
                  <Input id="journal-code" placeholder="ex: VTE" maxLength={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="journal-nom">Nom du journal</Label>
                  <Input id="journal-nom" placeholder="ex: Journal des Ventes" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="journal-type">Type</Label>
                  <Select>
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
                      <Input id="format-facture" defaultValue="FAC-{YYYY}-{MM}-{####}" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prochain-numero-facture">Prochain numéro</Label>
                      <Input id="prochain-numero-facture" defaultValue="FAC-2024-01-0001" readOnly />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Numérotation des écritures</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="format-ecriture">Format écritures</Label>
                      <Input id="format-ecriture" defaultValue="{JOURNAL}-{YYYY}{MM}-{####}" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reset-annuel">Remise à zéro</Label>
                      <Select defaultValue="annuel">
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
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter Devise
                  </Button>
                </div>

                <div className="space-y-2">
                  {[
                    { code: 'XOF', name: 'Franc CFA', rate: 1, base: true },
                    { code: 'EUR', name: 'Euro', rate: 655.957, base: false },
                    { code: 'USD', name: 'Dollar US', rate: 592.85, base: false },
                    { code: 'GBP', name: 'Livre Sterling', rate: 750.12, base: false }
                  ].map((currency, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg animate-fade-in">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="font-bold text-primary text-sm">{currency.code}</span>
                        </div>
                        <div>
                          <h5 className="font-medium">{currency.name}</h5>
                          <p className="text-sm text-muted-foreground">
                            1 {currency.code} = {currency.rate.toLocaleString()} XOF
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currency.base && (
                          <Badge className="bg-green-500">
                            Base
                          </Badge>
                        )}
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!currency.base && (
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