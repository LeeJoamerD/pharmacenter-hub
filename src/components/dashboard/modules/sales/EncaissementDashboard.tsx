import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { 
  Receipt, 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Smartphone,
  Building2,
  Calendar,
  Filter,
  Download,
  Eye,
  Search
} from 'lucide-react';

interface Transaction {
  id: string;
  date: Date;
  customer: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'insurance';
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  items: number;
  cashier: string;
  reference: string;
}

interface EncaissementStats {
  totalToday: number;
  totalWeek: number;
  totalMonth: number;
  transactionCount: number;
  averageTransaction: number;
  paymentMethodBreakdown: Record<string, number>;
}

const EncaissementDashboard = () => {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const stats: EncaissementStats = {
    totalToday: 2450000,
    totalWeek: 15680000,
    totalMonth: 47250000,
    transactionCount: 234,
    averageTransaction: 104700,
    paymentMethodBreakdown: {
      cash: 1200000,
      card: 800000,
      mobile: 350000,
      insurance: 100000
    }
  };

  const transactions: Transaction[] = [
    {
      id: 'TXN-001',
      date: new Date(),
      customer: 'Amadou Diallo',
      amount: 45500,
      paymentMethod: 'cash',
      status: 'completed',
      items: 3,
      cashier: 'Marie Koné',
      reference: 'REF-2024-001'
    },
    {
      id: 'TXN-002',
      date: new Date(Date.now() - 3600000),
      customer: 'Fatou Ba',
      amount: 127800,
      paymentMethod: 'card',
      status: 'completed',
      items: 5,
      cashier: 'Ibrahima Sow',
      reference: 'REF-2024-002'
    },
    {
      id: 'TXN-003',
      date: new Date(Date.now() - 7200000),
      customer: 'Moussa Traoré',
      amount: 67200,
      paymentMethod: 'mobile',
      status: 'pending',
      items: 2,
      cashier: 'Aissata Diop',
      reference: 'REF-2024-003'
    }
  ];

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <DollarSign className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'insurance': return <Building2 className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      refunded: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status === 'completed' ? 'Terminé' :
         status === 'pending' ? 'En attente' :
         status === 'cancelled' ? 'Annulé' : 'Remboursé'}
      </Badge>
    );
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesPayment = paymentFilter === 'all' || transaction.paymentMethod === paymentFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      transaction.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesPayment && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aujourd'hui</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.totalToday.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              +12% par rapport à hier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Semaine</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.totalWeek.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              +8% par rapport à la semaine dernière
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.transactionCount}</div>
            <p className="text-xs text-muted-foreground">
              Moyenne: {stats.averageTransaction.toLocaleString()} FCFA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modes de Paiement</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Espèces</span>
                <span className="font-medium">
                  {((stats.paymentMethodBreakdown.cash / stats.totalToday) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cartes</span>
                <span className="font-medium">
                  {((stats.paymentMethodBreakdown.card / stats.totalToday) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="summary">Résumé</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtres et Recherche</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Recherche</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Client, référence..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mode de Paiement</Label>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="card">Carte</SelectItem>
                      <SelectItem value="mobile">Mobile Money</SelectItem>
                      <SelectItem value="insurance">Assurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                      <SelectItem value="refunded">Remboursé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Actions</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-1" />
                      Filtrer
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(transaction.paymentMethod)}
                        <div>
                          <p className="font-medium">{transaction.customer}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.date.toLocaleString()} • {transaction.cashier}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {transaction.amount.toLocaleString()} FCFA
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.items} article(s)
                        </p>
                      </div>
                      
                      {getStatusBadge(transaction.status)}
                      
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Résumé des Encaissements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Payment Methods Breakdown */}
                <div>
                  <h4 className="font-medium mb-3">Répartition par Mode de Paiement</h4>
                  <div className="space-y-3">
                    {Object.entries(stats.paymentMethodBreakdown).map(([method, amount]) => (
                      <div key={method} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(method)}
                          <span className="capitalize">
                            {method === 'cash' ? 'Espèces' :
                             method === 'card' ? 'Carte Bancaire' :
                             method === 'mobile' ? 'Mobile Money' : 'Assurance'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{amount.toLocaleString()} FCFA</p>
                          <p className="text-sm text-muted-foreground">
                            {((amount / stats.totalToday) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Génération de Rapports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                    <Receipt className="h-8 w-8" />
                    <span>Rapport Journalier</span>
                    <span className="text-sm text-muted-foreground">
                      Encaissements du jour
                    </span>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                    <TrendingUp className="h-8 w-8" />
                    <span>Rapport Hebdomadaire</span>
                    <span className="text-sm text-muted-foreground">
                      Analyse de la semaine
                    </span>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                    <Calendar className="h-8 w-8" />
                    <span>Rapport Mensuel</span>
                    <span className="text-sm text-muted-foreground">
                      Synthèse mensuelle
                    </span>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                    <DollarSign className="h-8 w-8" />
                    <span>Rapport Fiscal</span>
                    <span className="text-sm text-muted-foreground">
                      Documents fiscaux
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EncaissementDashboard;