import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { 
  FileText, 
  Calculator, 
  AlertTriangle, 
  Download, 
  Upload, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Receipt, 
  Shield,
  TrendingUp,
  DollarSign,
  Plus,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FiscalManagement = () => {
  const [activeTab, setActiveTab] = useState('tva');
  const { toast } = useToast();

  // Mock data for VAT declarations
  const vatDeclarations = [
    { 
      id: 1, 
      period: 'Décembre 2024', 
      type: 'TVA Mensuelle', 
      status: 'En cours', 
      dueDate: '2024-01-15',
      vatCollected: 245000,
      vatPaid: 180000,
      vatDue: 65000
    },
    { 
      id: 2, 
      period: 'Novembre 2024', 
      type: 'TVA Mensuelle', 
      status: 'Déclarée', 
      dueDate: '2024-12-15',
      vatCollected: 320000,
      vatPaid: 210000,
      vatDue: 110000
    },
    { 
      id: 3, 
      period: 'Octobre 2024', 
      type: 'TVA Mensuelle', 
      status: 'Payée', 
      dueDate: '2024-11-15',
      vatCollected: 280000,
      vatPaid: 195000,
      vatDue: 85000
    }
  ];

  // Mock data for tax obligations
  const taxObligations = [
    { id: 1, type: 'TVA Mensuelle', frequency: 'Mensuel', nextDue: '2024-01-15', status: 'En attente' },
    { id: 2, type: 'IS - Impôt sur Sociétés', frequency: 'Annuel', nextDue: '2024-04-30', status: 'Planifié' },
    { id: 3, type: 'Taxe Professionnelle', frequency: 'Annuel', nextDue: '2024-03-31', status: 'Planifié' },
    { id: 4, type: 'Déclaration Annuelle', frequency: 'Annuel', nextDue: '2024-05-31', status: 'Planifié' }
  ];

  // Mock data for VAT rates
  const vatRates = [
    { id: 1, name: 'Taux Normal', rate: 18, type: 'Standard', products: 'Médicaments non essentiels' },
    { id: 2, name: 'Taux Réduit', rate: 0, type: 'Exonéré', products: 'Médicaments essentiels' },
    { id: 3, name: 'Taux Spécial', rate: 10, type: 'Réduit', products: 'Matériel médical' }
  ];

  // Mock data for compliance tracking
  const complianceItems = [
    { id: 1, item: 'Registre des achats', status: 'Conforme', lastUpdate: '2024-12-10', score: 100 },
    { id: 2, item: 'Registre des ventes', status: 'Conforme', lastUpdate: '2024-12-10', score: 100 },
    { id: 3, item: 'Facturation électronique', status: 'En cours', lastUpdate: '2024-12-05', score: 75 },
    { id: 4, item: 'Archivage numérique', status: 'À améliorer', lastUpdate: '2024-11-30', score: 60 }
  ];

  // Mock data for tax analytics
  const taxAnalytics = [
    { month: 'Jul', tva: 85000, is: 120000, autres: 25000 },
    { month: 'Aug', tva: 92000, is: 0, autres: 28000 },
    { month: 'Sep', tva: 88000, is: 0, autres: 22000 },
    { month: 'Oct', tva: 95000, is: 0, autres: 30000 },
    { month: 'Nov', tva: 110000, is: 0, autres: 35000 },
    { month: 'Dec', tva: 105000, is: 0, autres: 28000 }
  ];

  const handleGenerateDeclaration = () => {
    toast({
      title: "Déclaration générée",
      description: "La déclaration TVA a été générée avec succès."
    });
  };

  const handleSubmitDeclaration = () => {
    toast({
      title: "Déclaration soumise",
      description: "La déclaration a été transmise aux autorités fiscales."
    });
  };

  const handleCalculateVAT = () => {
    toast({
      title: "TVA calculée",
      description: "Le calcul de la TVA a été mis à jour automatiquement."
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Conforme':
      case 'Payée':
      case 'Déclarée':
        return 'default';
      case 'En cours':
      case 'Planifié':
        return 'secondary';
      case 'En attente':
      case 'À améliorer':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Gestion Fiscale</h3>
          <p className="text-muted-foreground">
            TVA, déclarations fiscales et conformité réglementaire
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCalculateVAT} variant="outline">
            <Calculator className="h-4 w-4 mr-2" />
            Calculer TVA
          </Button>
          <Button onClick={handleGenerateDeclaration}>
            <FileText className="h-4 w-4 mr-2" />
            Nouvelle Déclaration
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="tva">TVA</TabsTrigger>
          <TabsTrigger value="declarations">Déclarations</TabsTrigger>
          <TabsTrigger value="obligations">Obligations</TabsTrigger>
          <TabsTrigger value="conformite">Conformité</TabsTrigger>
          <TabsTrigger value="rapports">Rapports</TabsTrigger>
          <TabsTrigger value="parametres">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="tva" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">TVA Collectée</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">245,000</div>
                <p className="text-xs text-muted-foreground">FCFA ce mois</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">TVA Déductible</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">180,000</div>
                <p className="text-xs text-muted-foreground">FCFA ce mois</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">TVA à Payer</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">65,000</div>
                <p className="text-xs text-success">-15% vs mois précédent</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux Moyen</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12.5%</div>
                <p className="text-xs text-muted-foreground">Taux effectif</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Calcul TVA du Mois</CardTitle>
                <CardDescription>Résumé automatique des opérations TVA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Ventes HT</span>
                    <span className="font-medium">1,358,000 FCFA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>TVA Collectée (18%)</span>
                    <span className="font-medium">245,000 FCFA</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span>Achats HT</span>
                    <span className="font-medium">1,000,000 FCFA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>TVA Déductible</span>
                    <span className="font-medium">180,000 FCFA</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center font-bold">
                    <span>TVA à Payer</span>
                    <span className="text-primary">65,000 FCFA</span>
                  </div>
                </div>
                <Button className="w-full" onClick={handleCalculateVAT}>
                  Recalculer TVA
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taux de TVA Configurés</CardTitle>
                <CardDescription>Gestion des taux par catégorie</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vatRates.map((rate) => (
                    <div key={rate.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{rate.name}</p>
                        <p className="text-sm text-muted-foreground">{rate.products}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{rate.rate}%</p>
                        <Badge variant="outline">{rate.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Taux
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="declarations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Déclarations Fiscales</CardTitle>
              <CardDescription>Suivi et gestion des déclarations obligatoires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Type de déclaration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tva-monthly">TVA Mensuelle</SelectItem>
                      <SelectItem value="tva-quarterly">TVA Trimestrielle</SelectItem>
                      <SelectItem value="is-annual">IS Annuel</SelectItem>
                      <SelectItem value="other">Autres</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Mois en cours</SelectItem>
                      <SelectItem value="previous">Mois précédent</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleGenerateDeclaration}>
                    Générer
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Période</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>TVA Collectée</TableHead>
                      <TableHead>TVA Déductible</TableHead>
                      <TableHead>À Payer</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vatDeclarations.map((declaration) => (
                      <TableRow key={declaration.id}>
                        <TableCell className="font-medium">{declaration.period}</TableCell>
                        <TableCell>{declaration.type}</TableCell>
                        <TableCell>{declaration.vatCollected.toLocaleString()} FCFA</TableCell>
                        <TableCell>{declaration.vatPaid.toLocaleString()} FCFA</TableCell>
                        <TableCell className="font-semibold">{declaration.vatDue.toLocaleString()} FCFA</TableCell>
                        <TableCell>{declaration.dueDate}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(declaration.status)}>
                            {declaration.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            {declaration.status === 'En cours' && (
                              <Button variant="ghost" size="sm" onClick={handleSubmitDeclaration}>
                                <Upload className="h-4 w-4" />
                              </Button>
                            )}
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

        <TabsContent value="obligations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Obligations Actives</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">Types d'obligations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prochaine Échéance</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15 Jan</div>
                <p className="text-xs text-destructive">TVA Mensuelle</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conformité</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">95%</div>
                <p className="text-xs text-success">Score global</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Calendrier des Obligations</CardTitle>
              <CardDescription>Suivi automatique des échéances fiscales</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Obligation</TableHead>
                    <TableHead>Fréquence</TableHead>
                    <TableHead>Prochaine Échéance</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Rappels</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxObligations.map((obligation) => (
                    <TableRow key={obligation.id}>
                      <TableCell className="font-medium">{obligation.type}</TableCell>
                      <TableCell>{obligation.frequency}</TableCell>
                      <TableCell>{obligation.nextDue}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(obligation.status)}>
                          {obligation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Checkbox />
                          <span className="text-sm">Email</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Configurer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conformite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tableau de Bord Conformité</CardTitle>
              <CardDescription>Suivi de la conformité réglementaire</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={complianceItems}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="item" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Points de Contrôle</CardTitle>
              <CardDescription>Vérifications réglementaires obligatoires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {item.status === 'Conforme' ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : item.status === 'En cours' ? (
                          <Clock className="h-5 w-5 text-warning" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{item.item}</p>
                        <p className="text-sm text-muted-foreground">
                          Dernière mise à jour: {item.lastUpdate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <Progress value={item.score} className="w-20 mb-1" />
                        <p className="text-sm font-medium">{item.score}%</p>
                      </div>
                      <Badge variant={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        Vérifier
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rapports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Charges Fiscales</CardTitle>
              <CardDescription>Analyse des coûts fiscaux sur 6 mois</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={taxAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
                  <Line type="monotone" dataKey="tva" stroke="hsl(var(--primary))" name="TVA" strokeWidth={2} />
                  <Line type="monotone" dataKey="is" stroke="hsl(var(--secondary))" name="IS" strokeWidth={2} />
                  <Line type="monotone" dataKey="autres" stroke="hsl(var(--accent))" name="Autres" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Rapports Disponibles</CardTitle>
                <CardDescription>Génération de rapports fiscaux</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Journal TVA</p>
                    <p className="text-sm text-muted-foreground">Détail des opérations TVA</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">État de TVA</p>
                    <p className="text-sm text-muted-foreground">Résumé mensuel TVA</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Annexe Fiscale</p>
                    <p className="text-sm text-muted-foreground">Détails pour déclaration</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Archivage Fiscal</CardTitle>
                <CardDescription>Conservation des documents</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Conservation légale: 10 ans pour les documents fiscaux
                  </AlertDescription>
                </Alert>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Déclarations TVA</span>
                    <Badge>Archivées</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Factures clients/fournisseurs</span>
                    <Badge>Archivées</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pièces justificatives</span>
                    <Badge>Archivées</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center font-medium">
                    <span>Capacité utilisée</span>
                    <span>2.3 GB / 10 GB</span>
                  </div>
                  <Progress value={23} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="parametres" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Configuration TVA</CardTitle>
                <CardDescription>Paramètres généraux de la TVA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="vat-regime">Régime TVA</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le régime" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Régime Normal</SelectItem>
                      <SelectItem value="simplifie">Régime Simplifié</SelectItem>
                      <SelectItem value="franchise">Franchise en Base</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="declaration-frequency">Fréquence Déclaration</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                      <SelectItem value="quarterly">Trimestrielle</SelectItem>
                      <SelectItem value="annual">Annuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tva-number">Numéro TVA</Label>
                  <Input id="tva-number" placeholder="CI-xxx-xxx-xxx-xxx" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes et Notifications</CardTitle>
                <CardDescription>Configuration des rappels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox />
                  <Label>Rappel échéances fiscales (7 jours avant)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox />
                  <Label>Alerte dépassement seuil TVA</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox />
                  <Label>Notification nouvelles réglementations</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox />
                  <Label>Rapport mensuel automatique</Label>
                </div>
                <Separator />
                <div>
                  <Label htmlFor="email-alerts">Email pour les alertes</Label>
                  <Input id="email-alerts" type="email" placeholder="comptable@pharmacie.com" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Intégration avec Administrations</CardTitle>
              <CardDescription>Configuration des connexions officielles</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Fonctionnalités d'intégration disponibles selon la réglementation locale
                </AlertDescription>
              </Alert>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Télédéclaration TVA</p>
                    <p className="text-sm text-muted-foreground">Envoi automatique des déclarations</p>
                  </div>
                  <Badge variant="secondary">Disponible</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Signature Électronique</p>
                    <p className="text-sm text-muted-foreground">Certification des documents</p>
                  </div>
                  <Badge variant="secondary">En développement</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Archivage Légal</p>
                    <p className="text-sm text-muted-foreground">Conservation conforme</p>
                  </div>
                  <Badge>Actif</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FiscalManagement;