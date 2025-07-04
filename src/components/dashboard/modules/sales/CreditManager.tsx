import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CreditCard,
  Plus,
  Search,
  Filter,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Download
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';

// Types pour la gestion des crédits
interface CreditAccount {
  id: number;
  customerName: string;
  customerPhone: string;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  status: 'active' | 'suspended' | 'closed';
  createdAt: Date;
  lastActivity: Date;
}

interface CreditTransaction {
  id: number;
  accountId: number;
  customerName: string;
  type: 'purchase' | 'payment' | 'adjustment';
  amount: number;
  balance: number;
  description: string;
  timestamp: Date;
  invoiceNumber?: string;
}

// Données mockées
const creditAccounts: CreditAccount[] = [
  {
    id: 1,
    customerName: 'Jean Kouassi',
    customerPhone: '07 12 34 56 78',
    creditLimit: 500000,
    usedCredit: 325000,
    availableCredit: 175000,
    status: 'active',
    createdAt: new Date('2024-01-15'),
    lastActivity: new Date('2024-01-20')
  },
  {
    id: 2,
    customerName: 'Marie Traoré',
    customerPhone: '05 87 65 43 21',
    creditLimit: 300000,
    usedCredit: 280000,
    availableCredit: 20000,
    status: 'active',
    createdAt: new Date('2024-01-10'),
    lastActivity: new Date('2024-01-18')
  },
  {
    id: 3,
    customerName: 'Amadou Diabaté',
    customerPhone: '01 23 45 67 89',
    creditLimit: 200000,
    usedCredit: 0,
    availableCredit: 200000,
    status: 'suspended',
    createdAt: new Date('2024-01-05'),
    lastActivity: new Date('2024-01-12')
  }
];

const creditTransactions: CreditTransaction[] = [
  {
    id: 1,
    accountId: 1,
    customerName: 'Jean Kouassi',
    type: 'purchase',
    amount: -125000,
    balance: 325000,
    description: 'Achat médicaments - Facture VT-2024-145',
    timestamp: new Date('2024-01-20T14:30:00'),
    invoiceNumber: 'VT-2024-145'
  },
  {
    id: 2,
    accountId: 1,
    customerName: 'Jean Kouassi',
    type: 'payment',
    amount: 200000,
    balance: 450000,
    description: 'Remboursement partiel',
    timestamp: new Date('2024-01-18T10:15:00')
  },
  {
    id: 3,
    accountId: 2,
    customerName: 'Marie Traoré',
    type: 'purchase',
    amount: -80000,
    balance: 280000,
    description: 'Achat équipements médicaux',
    timestamp: new Date('2024-01-18T16:45:00'),
    invoiceNumber: 'VT-2024-142'
  }
];

const CreditManager = () => {
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null);

  // Filtrage des comptes
  const filteredAccounts = creditAccounts.filter(account => {
    const matchesSearch = account.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.customerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-800">Suspendu</Badge>;
      case 'closed':
        return <Badge className="bg-red-100 text-red-800">Fermé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <CreditCard className="h-4 w-4 text-red-500" />;
      case 'payment':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'adjustment':
        return <RefreshCw className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleCreateAccount = () => {
    toast({
      title: "Compte créé",
      description: "Le nouveau compte crédit a été créé avec succès.",
    });
    setIsNewAccountOpen(false);
  };

  const handleRecordPayment = () => {
    toast({
      title: "Paiement enregistré",
      description: "Le paiement a été enregistré avec succès.",
    });
    setIsPaymentModalOpen(false);
  };

  const totalCreditsOutstanding = creditAccounts.reduce((sum, account) => sum + account.usedCredit, 0);
  const totalCreditLimit = creditAccounts.reduce((sum, account) => sum + account.creditLimit, 0);
  const activeAccounts = creditAccounts.filter(account => account.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Crédits</h2>
          <p className="text-muted-foreground">
            Suivi des comptes clients et des paiements à crédit
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsPaymentModalOpen(true)}>
            <DollarSign className="h-4 w-4 mr-2" />
            Enregistrer Paiement
          </Button>
          <Dialog open={isNewAccountOpen} onOpenChange={setIsNewAccountOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Compte
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un Nouveau Compte Crédit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Nom du Client</Label>
                  <Input id="customerName" placeholder="Nom complet" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Téléphone</Label>
                  <Input id="customerPhone" placeholder="07 12 34 56 78" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">Limite de Crédit</Label>
                  <Input id="creditLimit" type="number" placeholder="500000" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Notes optionnelles..." />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsNewAccountOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateAccount}>
                    Créer le Compte
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crédits en Cours</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalCreditsOutstanding)}</div>
            <p className="text-xs text-muted-foreground">
              Sur {formatPrice(totalCreditLimit)} de limite totale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comptes Actifs</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAccounts}</div>
            <p className="text-xs text-muted-foreground">
              Sur {creditAccounts.length} comptes totaux
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Utilisation</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((totalCreditsOutstanding / totalCreditLimit) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Moyenne d'utilisation des crédits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Comptes Crédit</TabsTrigger>
          <TabsTrigger value="transactions">Historique</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          {/* Filtres */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des comptes */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Limite de Crédit</TableHead>
                  <TableHead>Crédit Utilisé</TableHead>
                  <TableHead>Crédit Disponible</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière Activité</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{account.customerName}</p>
                        <p className="text-sm text-muted-foreground">{account.customerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(account.creditLimit)}</TableCell>
                    <TableCell className="text-red-600">
                      {formatPrice(account.usedCredit)}
                    </TableCell>
                    <TableCell className="text-green-600">
                      {formatPrice(account.availableCredit)}
                    </TableCell>
                    <TableCell>{getStatusBadge(account.status)}</TableCell>
                    <TableCell>
                      {account.lastActivity.toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          Voir Détails
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setSelectedAccount(account);
                            setIsPaymentModalOpen(true);
                          }}
                        >
                          Paiement
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Solde</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {transaction.timestamp.toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>{transaction.customerName}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(transaction.type)}
                          <span className="capitalize">{transaction.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className={transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatPrice(Math.abs(transaction.amount))}
                      </TableCell>
                      <TableCell>{formatPrice(transaction.balance)}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Génération de Rapports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Type de Rapport</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balance">Balance des Comptes</SelectItem>
                      <SelectItem value="aging">Ancienneté des Créances</SelectItem>
                      <SelectItem value="activity">Activité par Période</SelectItem>
                      <SelectItem value="summary">Résumé Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date de Début</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date de Fin</Label>
                    <Input type="date" />
                  </div>
                </div>
                
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Générer Rapport
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes Crédit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
                      <span className="text-sm font-medium">Marie Traoré</span>
                    </div>
                    <Badge variant="outline" className="text-orange-600">93% utilisé</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-sm font-medium">Créance + 30 jours</span>
                    </div>
                    <Badge variant="outline" className="text-red-600">2 comptes</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Paiement */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer un Paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {creditAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.customerName} - {formatPrice(account.usedCredit)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Montant du Paiement</Label>
              <Input id="paymentAmount" type="number" placeholder="0" />
            </div>
            
            <div className="space-y-2">
              <Label>Mode de Paiement</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="card">Carte</SelectItem>
                  <SelectItem value="mobile">Mobile Money</SelectItem>
                  <SelectItem value="transfer">Virement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentNotes">Notes</Label>
              <Textarea id="paymentNotes" placeholder="Notes du paiement..." />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleRecordPayment}>
                Enregistrer Paiement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreditManager;