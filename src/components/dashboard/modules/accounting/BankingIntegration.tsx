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
import { Switch } from '@/components/ui/switch';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { 
  Banknote, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Upload, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Plus,
  Eye,
  Link,
  Unlink,
  Settings,
  FileText,
  PieChart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BankingIntegration = () => {
  const [activeTab, setActiveTab] = useState('comptes');
  const [syncInProgress, setSyncInProgress] = useState(false);
  const { toast } = useToast();

  // Mock data for bank accounts
  const bankAccounts = [
    { 
      id: 1, 
      name: 'Compte Principal BCEAO', 
      bank: 'BCEAO', 
      number: '****1234', 
      type: 'Courant',
      balance: 2850000,
      lastSync: '2024-12-10 14:30',
      status: 'Connecté',
      currency: 'FCFA'
    },
    { 
      id: 2, 
      name: 'Compte Épargne UBA', 
      bank: 'UBA Côte d\'Ivoire', 
      number: '****5678', 
      type: 'Épargne',
      balance: 1200000,
      lastSync: '2024-12-10 12:15',
      status: 'Connecté',
      currency: 'FCFA'
    },
    { 
      id: 3, 
      name: 'Compte USD Ecobank', 
      bank: 'Ecobank', 
      number: '****9012', 
      type: 'Devise',
      balance: 5420,
      lastSync: '2024-12-09 16:45',
      status: 'Erreur',
      currency: 'USD'
    }
  ];

  // Mock data for transactions
  const transactions = [
    { 
      id: 1, 
      date: '2024-12-10', 
      description: 'Virement Client Pharmacie Central', 
      amount: 450000, 
      type: 'Crédit',
      category: 'Ventes',
      matched: true,
      account: 'BCEAO ****1234'
    },
    { 
      id: 2, 
      date: '2024-12-10', 
      description: 'Paiement Fournisseur COPHARMED', 
      amount: -280000, 
      type: 'Débit',
      category: 'Achats',
      matched: true,
      account: 'BCEAO ****1234'
    },
    { 
      id: 3, 
      date: '2024-12-09', 
      description: 'Frais bancaires mensuels', 
      amount: -15000, 
      type: 'Débit',
      category: 'Frais bancaires',
      matched: false,
      account: 'BCEAO ****1234'
    },
    { 
      id: 4, 
      date: '2024-12-09', 
      description: 'Virement inconnu', 
      amount: 125000, 
      type: 'Crédit',
      category: 'Non catégorisé',
      matched: false,
      account: 'UBA ****5678'
    }
  ];

  // Mock data for cash flow forecast
  const cashFlowData = [
    { month: 'Jan', entrees: 2800000, sorties: 2200000, solde: 600000 },
    { month: 'Fév', entrees: 3200000, sorties: 2400000, solde: 800000 },
    { month: 'Mar', entrees: 2900000, sorties: 2300000, solde: 600000 },
    { month: 'Avr', entrees: 3400000, sorties: 2600000, solde: 800000 },
    { month: 'Mai', entrees: 3100000, sorties: 2500000, solde: 600000 },
    { month: 'Juin', entrees: 3300000, sorties: 2700000, solde: 600000 }
  ];

  // Mock data for reconciliation
  const reconciliationItems = [
    { id: 1, date: '2024-12-10', bankTransaction: 'Virement 450000 FCFA', bookEntry: 'Facture FC-2024-1205', difference: 0, status: 'Rapproché' },
    { id: 2, date: '2024-12-10', bankTransaction: 'Paiement 280000 FCFA', bookEntry: 'Facture FF-2024-0892', difference: 0, status: 'Rapproché' },
    { id: 3, date: '2024-12-09', bankTransaction: 'Frais 15000 FCFA', bookEntry: 'Non trouvé', difference: 15000, status: 'À rapprocher' },
    { id: 4, date: '2024-12-09', bankTransaction: 'Non trouvé', bookEntry: 'Écriture diverse 125000 FCFA', difference: -125000, status: 'À rapprocher' }
  ];

  const handleSyncAccounts = async () => {
    setSyncInProgress(true);
    toast({
      title: "Synchronisation en cours",
      description: "Mise à jour des comptes bancaires..."
    });
    
    // Simulate sync process
    setTimeout(() => {
      setSyncInProgress(false);
      toast({
        title: "Synchronisation terminée",
        description: "Tous les comptes ont été mis à jour avec succès."
      });
    }, 3000);
  };

  const handleAutoReconcile = () => {
    toast({
      title: "Rapprochement automatique lancé",
      description: "Analyse des transactions en cours..."
    });
  };

  const handleConnectBank = () => {
    toast({
      title: "Configuration bancaire",
      description: "Interface de connexion bancaire ouverte."
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Connecté':
      case 'Rapproché':
        return 'default';
      case 'En cours':
        return 'secondary';
      case 'Erreur':
      case 'À rapprocher':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getTotalBalance = () => {
    return bankAccounts.reduce((sum, account) => {
      if (account.currency === 'FCFA') {
        return sum + account.balance;
      } else {
        // Convert USD to FCFA (approximate rate)
        return sum + (account.balance * 610);
      }
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Intégration Bancaire</h3>
          <p className="text-muted-foreground">
            Synchronisation bancaire et gestion de trésorerie
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSyncAccounts} disabled={syncInProgress} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncInProgress ? 'animate-spin' : ''}`} />
            {syncInProgress ? 'Synchronisation...' : 'Synchroniser'}
          </Button>
          <Button onClick={handleConnectBank}>
            <Plus className="h-4 w-4 mr-2" />
            Connecter Banque
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="comptes">Comptes</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="rapprochement">Rapprochement</TabsTrigger>
          <TabsTrigger value="tresorerie">Trésorerie</TabsTrigger>
          <TabsTrigger value="previsions">Prévisions</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="comptes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Solde Total</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalBalance().toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">FCFA (équivalent)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comptes Connectés</CardTitle>
                <Link className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-success">2 actifs, 1 erreur</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions Aujourd'hui</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-success">+5 vs hier</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rapprochement</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-xs text-muted-foreground">Taux de rapprochement</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comptes Bancaires</CardTitle>
              <CardDescription>État de la synchronisation avec vos banques</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Compte</TableHead>
                    <TableHead>Banque</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Solde</TableHead>
                    <TableHead>Dernière Sync</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-muted-foreground">{account.number}</p>
                        </div>
                      </TableCell>
                      <TableCell>{account.bank}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{account.type}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {account.balance.toLocaleString()} {account.currency}
                      </TableCell>
                      <TableCell className="text-sm">{account.lastSync}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(account.status)}>
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          {account.status === 'Erreur' && (
                            <Button variant="ghost" size="sm">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transactions Récentes</CardTitle>
              <CardDescription>Dernières opérations synchronisées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrer par compte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les comptes</SelectItem>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.bank} {account.number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="matched">Rapprochées</SelectItem>
                      <SelectItem value="unmatched">Non rapprochées</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Compte</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                        <TableCell className="text-sm">{transaction.account}</TableCell>
                        <TableCell className={`font-semibold ${transaction.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.matched ? 'default' : 'destructive'}>
                            {transaction.matched ? 'Rapprochée' : 'À rapprocher'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!transaction.matched && (
                              <Button variant="ghost" size="sm">
                                <Link className="h-4 w-4" />
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

        <TabsContent value="rapprochement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Éléments Rapprochés</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45</div>
                <Progress value={85} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">85% du total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">À Rapprocher</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-destructive">Éléments en attente</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Écart Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">140,000</div>
                <p className="text-xs text-muted-foreground">FCFA à justifier</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rapprochement Bancaire</CardTitle>
              <CardDescription>Correspondance entre relevés bancaires et écritures comptables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={handleAutoReconcile}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rapprochement Auto
                  </Button>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Importer Relevé
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Transaction Bancaire</TableHead>
                      <TableHead>Écriture Comptable</TableHead>
                      <TableHead>Écart</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reconciliationItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.bankTransaction}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.bookEntry}</TableCell>
                        <TableCell className={`font-semibold ${item.difference === 0 ? '' : 'text-destructive'}`}>
                          {item.difference === 0 ? '-' : `${item.difference.toLocaleString()} FCFA`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {item.status === 'À rapprocher' && (
                              <Button variant="ghost" size="sm">
                                <Link className="h-4 w-4" />
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

        <TabsContent value="tresorerie" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Position de Trésorerie</CardTitle>
              <CardDescription>Vue consolidée des flux de trésorerie</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
                  <Area type="monotone" dataKey="entrees" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="Entrées" />
                  <Area type="monotone" dataKey="sorties" stackId="2" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.6} name="Sorties" />
                  <Line type="monotone" dataKey="solde" stroke="hsl(var(--accent))" strokeWidth={3} name="Solde Net" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Flux de Trésorerie</CardTitle>
                <CardDescription>Analyse des mouvements mensuels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium">Entrées de Trésorerie</p>
                        <p className="text-sm text-muted-foreground">Ce mois</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-success">+3,300,000</p>
                      <p className="text-sm text-muted-foreground">FCFA</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                      <div>
                        <p className="font-medium">Sorties de Trésorerie</p>
                        <p className="text-sm text-muted-foreground">Ce mois</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-destructive">-2,700,000</p>
                      <p className="text-sm text-muted-foreground">FCFA</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                    <div>
                      <p className="font-bold">Flux Net</p>
                      <p className="text-sm text-muted-foreground">Résultat mensuel</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl text-primary">+600,000</p>
                      <p className="text-sm text-muted-foreground">FCFA</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes de Trésorerie</CardTitle>
                <CardDescription>Surveillance des seuils critiques</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Position Saine:</strong> Trésorerie supérieure au seuil minimal (2M FCFA)
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Attention:</strong> Compte USD en erreur de synchronisation
                    </AlertDescription>
                  </Alert>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Seuils Configurés</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Seuil d'alerte bas:</span>
                        <span className="font-medium">1,000,000 FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seuil critique:</span>
                        <span className="font-medium">500,000 FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trésorerie actuelle:</span>
                        <span className="font-bold text-success">4,050,000 FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="previsions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prévisions de Trésorerie</CardTitle>
              <CardDescription>Projections basées sur l'historique et les engagements</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
                  <Line type="monotone" dataKey="solde" stroke="hsl(var(--primary))" strokeWidth={2} name="Solde Réel" />
                  <Line type="monotone" dataKey="entrees" stroke="hsl(var(--secondary))" strokeWidth={2} strokeDasharray="5 5" name="Prévision" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Scénarios Prévisionnels</CardTitle>
                <CardDescription>Analyse de différents scénarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-success">Scénario Optimiste</h4>
                      <Badge variant="default">+15%</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Croissance soutenue des ventes</p>
                    <div className="flex justify-between">
                      <span>Trésorerie fin mois:</span>
                      <span className="font-bold">4,650,000 FCFA</span>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Scénario Réaliste</h4>
                      <Badge variant="secondary">Stable</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Maintien du niveau actuel</p>
                    <div className="flex justify-between">
                      <span>Trésorerie fin mois:</span>
                      <span className="font-bold">4,050,000 FCFA</span>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-destructive">Scénario Pessimiste</h4>
                      <Badge variant="destructive">-10%</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Baisse temporaire d'activité</p>
                    <div className="flex justify-between">
                      <span>Trésorerie fin mois:</span>
                      <span className="font-bold">3,450,000 FCFA</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagements à Venir</CardTitle>
                <CardDescription>Échéances et flux prévisibles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-medium">Salaires Décembre</p>
                      <p className="text-sm text-muted-foreground">28/12/2024</p>
                    </div>
                    <span className="font-bold text-destructive">-850,000 FCFA</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-medium">Règlement Fournisseurs</p>
                      <p className="text-sm text-muted-foreground">31/12/2024</p>
                    </div>
                    <span className="font-bold text-destructive">-1,200,000 FCFA</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-medium">Encaissement Clients</p>
                      <p className="text-sm text-muted-foreground">05/01/2025</p>
                    </div>
                    <span className="font-bold text-success">+2,100,000 FCFA</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-medium">TVA à Payer</p>
                      <p className="text-sm text-muted-foreground">15/01/2025</p>
                    </div>
                    <span className="font-bold text-destructive">-165,000 FCFA</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Bancaire</CardTitle>
                <CardDescription>Paramètres de connexion aux banques</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    La connexion bancaire nécessite l'activation d'APIs bancaires spécialisées
                  </AlertDescription>
                </Alert>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Synchronisation automatique</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Rapprochement auto</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Alertes trésorerie</Label>
                    <Switch />
                  </div>
                </div>
                <Separator />
                <div>
                  <Label htmlFor="sync-frequency">Fréquence de synchronisation</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Temps réel</SelectItem>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="manual">Manuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Règles de Catégorisation</CardTitle>
                <CardDescription>Automatisation du classement des transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Virements fournisseurs</p>
                      <Button variant="ghost" size="sm">Modifier</Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Si libellé contient "COPHARMED" → Catégorie "Achats"
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Frais bancaires</p>
                      <Button variant="ghost" size="sm">Modifier</Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Si libellé contient "FRAIS" → Catégorie "Frais bancaires"
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Règle
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seuils et Alertes</CardTitle>
              <CardDescription>Configuration des alertes de trésorerie</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="threshold-low">Seuil d'alerte bas (FCFA)</Label>
                  <Input id="threshold-low" defaultValue="1000000" />
                </div>
                <div>
                  <Label htmlFor="threshold-critical">Seuil critique (FCFA)</Label>
                  <Input id="threshold-critical" defaultValue="500000" />
                </div>
                <div>
                  <Label htmlFor="alert-email">Email d'alerte</Label>
                  <Input id="alert-email" type="email" placeholder="tresorier@pharmacie.com" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BankingIntegration;