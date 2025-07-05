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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Plus, Building2, Target, TrendingUp, Calculator, FileBarChart, AlertTriangle, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AnalyticalAccounting = () => {
  const [activeTab, setActiveTab] = useState('centres-couts');
  const { toast } = useToast();

  // Mock data for cost centers
  const costCenters = [
    { id: 1, code: 'CC001', name: 'Production Médicaments', type: 'Opérationnel', manager: 'Dr. Kouassi', budget: 850000, actual: 782000, variance: -8 },
    { id: 2, code: 'CC002', name: 'Vente Retail', type: 'Commercial', manager: 'Mme Diallo', budget: 420000, actual: 465000, variance: 10.7 },
    { id: 3, code: 'CC003', name: 'Administration', type: 'Support', manager: 'M. Traoré', budget: 320000, actual: 298000, variance: -6.9 },
    { id: 4, code: 'CC004', name: 'Logistique', type: 'Support', manager: 'Mme Sanogo', budget: 280000, actual: 315000, variance: 12.5 }
  ];

  // Mock data for profitability analysis
  const profitabilityData = [
    { product: 'Paracétamol', revenue: 450000, costs: 280000, margin: 170000, marginRate: 37.8 },
    { product: 'Amoxicilline', revenue: 380000, costs: 245000, margin: 135000, marginRate: 35.5 },
    { product: 'Vitamines', revenue: 220000, costs: 125000, margin: 95000, marginRate: 43.2 },
    { product: 'Antiseptiques', revenue: 180000, costs: 98000, margin: 82000, marginRate: 45.6 }
  ];

  // Mock data for budget analysis
  const budgetAnalysis = [
    { month: 'Jan', budget: 180000, actual: 175000, variance: -2.8 },
    { month: 'Fév', budget: 185000, actual: 192000, variance: 3.8 },
    { month: 'Mar', budget: 190000, actual: 185000, variance: -2.6 },
    { month: 'Avr', budget: 175000, actual: 182000, variance: 4.0 },
    { month: 'Mai', budget: 195000, actual: 188000, variance: -3.6 },
    { month: 'Juin', budget: 200000, actual: 205000, variance: 2.5 }
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  const handleCreateCostCenter = () => {
    toast({
      title: "Centre de coûts créé",
      description: "Le nouveau centre de coûts a été ajouté avec succès."
    });
  };

  const handleAllocateCharges = () => {
    toast({
      title: "Charges réparties",
      description: "La répartition des charges indirectes a été mise à jour."
    });
  };

  const handleGenerateReport = () => {
    toast({
      title: "Rapport généré",
      description: "Le rapport d'analyse de rentabilité a été créé."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Comptabilité Analytique</h3>
          <p className="text-muted-foreground">
            Centres de coûts, analyse de rentabilité et pilotage budgétaire
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateReport} variant="outline">
            <FileBarChart className="h-4 w-4 mr-2" />
            Rapport Analytique
          </Button>
          <Button onClick={handleCreateCostCenter}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Centre
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="centres-couts">Centres de Coûts</TabsTrigger>
          <TabsTrigger value="rentabilite">Rentabilité</TabsTrigger>
          <TabsTrigger value="repartition">Répartition</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="tableaux-bord">Tableaux de Bord</TabsTrigger>
        </TabsList>

        <TabsContent value="centres-couts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Centres Actifs</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">+2 ce mois</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,87M</div>
                <p className="text-xs text-muted-foreground">Budget alloué</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Réalisé</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,86M</div>
                <p className="text-xs text-success">-0.5% vs budget</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Écart Moyen</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.1%</div>
                <p className="text-xs text-muted-foreground">Variance globale</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gestion des Centres de Coûts</CardTitle>
              <CardDescription>Configuration et suivi des centres de responsabilité</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <Label htmlFor="center-code">Code Centre</Label>
                    <Input id="center-code" placeholder="CC005" />
                  </div>
                  <div>
                    <Label htmlFor="center-name">Nom du Centre</Label>
                    <Input id="center-name" placeholder="Nouveau centre" />
                  </div>
                  <div>
                    <Label htmlFor="center-type">Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">Opérationnel</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="profit">Centre de Profit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="center-manager">Responsable</Label>
                    <Input id="center-manager" placeholder="Nom du responsable" />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Centre</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Réalisé</TableHead>
                      <TableHead>Écart</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costCenters.map((center) => (
                      <TableRow key={center.id}>
                        <TableCell className="font-medium">{center.code}</TableCell>
                        <TableCell>{center.name}</TableCell>
                        <TableCell>
                          <Badge variant={center.type === 'Opérationnel' ? 'default' : 'secondary'}>
                            {center.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{center.manager}</TableCell>
                        <TableCell>{center.budget.toLocaleString()} FCFA</TableCell>
                        <TableCell>{center.actual.toLocaleString()} FCFA</TableCell>
                        <TableCell>
                          <span className={center.variance < 0 ? 'text-success' : 'text-destructive'}>
                            {center.variance > 0 ? '+' : ''}{center.variance}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Modifier</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rentabilite" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Analyse de Rentabilité par Produit</CardTitle>
                <CardDescription>Marges et contribution par ligne de produits</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={profitabilityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Chiffre d'affaires" />
                    <Bar dataKey="costs" fill="hsl(var(--secondary))" name="Coûts" />
                    <Bar dataKey="margin" fill="hsl(var(--accent))" name="Marge" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des Marges</CardTitle>
                <CardDescription>Contribution par catégorie de produits</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={profitabilityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="margin"
                    >
                      {profitabilityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Détail Rentabilité</CardTitle>
              <CardDescription>Analyse détaillée par ligne de produits</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Chiffre d'Affaires</TableHead>
                    <TableHead>Coûts Directs</TableHead>
                    <TableHead>Marge Brute</TableHead>
                    <TableHead>Taux de Marge</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitabilityData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.product}</TableCell>
                      <TableCell>{item.revenue.toLocaleString()} FCFA</TableCell>
                      <TableCell>{item.costs.toLocaleString()} FCFA</TableCell>
                      <TableCell>{item.margin.toLocaleString()} FCFA</TableCell>
                      <TableCell>{item.marginRate}%</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={item.marginRate} className="w-16" />
                          <Badge variant={item.marginRate > 40 ? 'default' : item.marginRate > 30 ? 'secondary' : 'destructive'}>
                            {item.marginRate > 40 ? 'Excellent' : item.marginRate > 30 ? 'Bon' : 'Faible'}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repartition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Répartition des Charges Indirectes</CardTitle>
              <CardDescription>Allocation automatique et manuelle des coûts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  La répartition automatique utilise les clés de répartition configurées.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="charge-type">Type de Charge</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Frais Administratifs</SelectItem>
                      <SelectItem value="utilities">Services Généraux</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="insurance">Assurances</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="allocation-key">Clé de Répartition</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="turnover">Chiffre d'affaires</SelectItem>
                      <SelectItem value="employees">Nombre d'employés</SelectItem>
                      <SelectItem value="surface">Surface occupée</SelectItem>
                      <SelectItem value="direct-costs">Coûts directs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Montant à Répartir</Label>
                  <Input id="amount" placeholder="0 FCFA" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAllocateCharges}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Répartir Automatiquement
                </Button>
                <Button variant="outline">
                  Répartition Manuelle
                </Button>
              </div>

              <Separator />

              <div>
                <h4 className="text-lg font-semibold mb-3">Historique des Répartitions</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type de Charge</TableHead>
                      <TableHead>Montant Total</TableHead>
                      <TableHead>Clé Utilisée</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>15/12/2024</TableCell>
                      <TableCell>Frais Administratifs</TableCell>
                      <TableCell>85,000 FCFA</TableCell>
                      <TableCell>Chiffre d'affaires</TableCell>
                      <TableCell><Badge>Validé</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="sm">Détail</Button></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>12/12/2024</TableCell>
                      <TableCell>Services Généraux</TableCell>
                      <TableCell>45,000 FCFA</TableCell>
                      <TableCell>Surface occupée</TableCell>
                      <TableCell><Badge variant="secondary">En cours</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="sm">Modifier</Button></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suivi Budgétaire</CardTitle>
              <CardDescription>Analyse des écarts budget vs réalisé</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={budgetAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
                  <Line type="monotone" dataKey="budget" stroke="hsl(var(--primary))" name="Budget" strokeWidth={2} />
                  <Line type="monotone" dataKey="actual" stroke="hsl(var(--accent))" name="Réalisé" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Budget Prévisionnel</CardTitle>
                <CardDescription>Configuration des budgets par centre</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="budget-center">Centre de Coûts</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un centre" />
                      </SelectTrigger>
                      <SelectContent>
                        {costCenters.map((center) => (
                          <SelectItem key={center.id} value={center.code}>
                            {center.code} - {center.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="budget-period">Période</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">Exercice 2024</SelectItem>
                        <SelectItem value="2025">Exercice 2025</SelectItem>
                        <SelectItem value="q1-2025">Q1 2025</SelectItem>
                        <SelectItem value="q2-2025">Q2 2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="budget-amount">Montant Budget</Label>
                    <Input id="budget-amount" placeholder="0 FCFA" />
                  </div>
                </div>
                <Button className="w-full">Enregistrer Budget</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes Budgétaires</CardTitle>
                <CardDescription>Dépassements et écarts significatifs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Logistique:</strong> Dépassement de 12.5% du budget mensuel
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Vente Retail:</strong> Dépassement de 10.7% prévu ce mois
                    </AlertDescription>
                  </Alert>
                  <div className="text-sm text-muted-foreground">
                    2 centres sous budget, 2 centres en dépassement
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tableaux-bord" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Globale</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <Progress value={87} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">Objectifs atteints</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Marge Moyenne</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">38.2%</div>
                <p className="text-xs text-success">+2.1% vs période précédente</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Écart Budget</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-0.5%</div>
                <p className="text-xs text-success">Sous budget global</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Centres les plus performants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {costCenters
                    .filter(center => center.variance < 0)
                    .sort((a, b) => a.variance - b.variance)
                    .slice(0, 3)
                    .map((center) => (
                      <div key={center.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{center.name}</p>
                          <p className="text-sm text-muted-foreground">{center.code}</p>
                        </div>
                        <Badge variant="default">
                          {center.variance}%
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Points d'Attention</CardTitle>
                <CardDescription>Centres nécessitant un suivi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {costCenters
                    .filter(center => center.variance > 5)
                    .map((center) => (
                      <div key={center.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{center.name}</p>
                          <p className="text-sm text-muted-foreground">{center.code}</p>
                        </div>
                        <Badge variant="destructive">
                          +{center.variance}%
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticalAccounting;