import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  User,
  CreditCard,
  DollarSign,
  Receipt,
  FileText,
  Smartphone,
  Building2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  Clock
} from 'lucide-react';

interface TransactionDetail {
  id: string;
  date: Date;
  reference: string;
  customer: {
    name: string;
    type: 'regular' | 'insurance' | 'corporate';
    id?: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    discount?: number;
  }>;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
  payment: {
    method: 'cash' | 'card' | 'mobile' | 'insurance' | 'mixed';
    status: 'completed' | 'pending' | 'failed' | 'refunded';
    details?: any;
  };
  cashier: {
    name: string;
    id: string;
  };
  register: {
    name: string;
    id: number;
  };
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  notes?: string;
}

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<TransactionDetail[]>([
    {
      id: 'TXN-2024-001',
      date: new Date('2024-01-15T14:35:00'),
      reference: 'VT-001-2024',
      customer: {
        name: 'Jean Baptiste Kouakou',
        type: 'regular'
      },
      items: [
        { id: '1', name: 'Paracétamol 500mg', quantity: 2, unitPrice: 1500, total: 3000 },
        { id: '2', name: 'Vitamine C', quantity: 1, unitPrice: 2500, total: 2500 }
      ],
      totals: {
        subtotal: 5500,
        discount: 0,
        tax: 0,
        total: 5500
      },
      payment: {
        method: 'cash',
        status: 'completed'
      },
      cashier: {
        name: 'Marie Diallo',
        id: 'CSH-001'
      },
      register: {
        name: 'Caisse 1',
        id: 1
      },
      status: 'completed'
    },
    {
      id: 'TXN-2024-002',
      date: new Date('2024-01-15T13:20:00'),
      reference: 'VT-002-2024',
      customer: {
        name: 'Assurance NSIA',
        type: 'insurance'
      },
      items: [
        { id: '3', name: 'Antibiotique Amoxicilline', quantity: 1, unitPrice: 8500, total: 8500 },
        { id: '4', name: 'Sirop contre la toux', quantity: 1, unitPrice: 3500, total: 3500 }
      ],
      totals: {
        subtotal: 12000,
        discount: 0,
        tax: 0,
        total: 12000
      },
      payment: {
        method: 'insurance',
        status: 'pending'
      },
      cashier: {
        name: 'Amadou Sow',
        id: 'CSH-002'
      },
      register: {
        name: 'Caisse 2',
        id: 2
      },
      status: 'pending'
    },
    {
      id: 'TXN-2024-003',
      date: new Date('2024-01-15T12:10:00'),
      reference: 'VT-003-2024',
      customer: {
        name: 'Fatou Ba',
        type: 'regular'
      },
      items: [
        { id: '5', name: 'Doliprane 1000mg', quantity: 3, unitPrice: 2000, total: 6000 }
      ],
      totals: {
        subtotal: 6000,
        discount: 300,
        tax: 0,
        total: 5700
      },
      payment: {
        method: 'card',
        status: 'completed'
      },
      cashier: {
        name: 'Marie Diallo',
        id: 'CSH-001'
      },
      register: {
        name: 'Caisse 1',
        id: 1
      },
      status: 'completed'
    }
  ]);

  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    paymentMethod: 'all',
    status: 'all',
    cashier: 'all',
    customer: 'all'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'reference'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Statistiques calculées
  const stats = {
    totalTransactions: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + t.totals.total, 0),
    completedTransactions: transactions.filter(t => t.status === 'completed').length,
    pendingTransactions: transactions.filter(t => t.status === 'pending').length,
    averageTransaction: transactions.length > 0 ? 
      transactions.reduce((sum, t) => sum + t.totals.total, 0) / transactions.length : 0
  };

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

    const labels = {
      completed: 'Terminé',
      pending: 'En attente',
      cancelled: 'Annulé',
      refunded: 'Remboursé'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getCustomerTypeBadge = (type: string) => {
    const variants = {
      regular: 'outline',
      insurance: 'secondary',
      corporate: 'default'
    } as const;

    const labels = {
      regular: 'Régulier',
      insurance: 'Assurance',
      corporate: 'Entreprise'
    };

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'outline'} className="text-xs">
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  // Filtrage et tri des transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch = filters.search === '' || 
        transaction.reference.toLowerCase().includes(filters.search.toLowerCase()) ||
        transaction.customer.name.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesPayment = filters.paymentMethod === 'all' || 
        transaction.payment.method === filters.paymentMethod;
      
      const matchesStatus = filters.status === 'all' || 
        transaction.status === filters.status;
      
      return matchesSearch && matchesPayment && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'date':
          aValue = a.date.getTime();
          bValue = b.date.getTime();
          break;
        case 'amount':
          aValue = a.totals.total;
          bValue = b.totals.total;
          break;
        case 'reference':
          aValue = a.reference;
          bValue = b.reference;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: 'date' | 'amount' | 'reference') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.totalAmount.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.round(stats.averageTransaction).toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et Actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Historique des Transactions</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Actualiser
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <div className="space-y-2">
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Référence, client..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date début</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Mode de Paiement</Label>
              <Select value={filters.paymentMethod} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, paymentMethod: value }))}>
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
              <Select value={filters.status} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, status: value }))}>
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
          </div>

          {/* Tableau des transactions */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('reference')}>
                    <div className="flex items-center gap-1">
                      Référence
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                    <div className="flex items-center gap-1">
                      Montant
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Caissier</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.reference}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{transaction.date.toLocaleDateString()}</div>
                        <div className="text-muted-foreground text-xs">
                          {transaction.date.toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{transaction.customer.name}</div>
                        {getCustomerTypeBadge(transaction.customer.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(transaction.payment.method)}
                        <span className="text-sm">
                          {transaction.payment.method === 'cash' ? 'Espèces' :
                           transaction.payment.method === 'card' ? 'Carte' :
                           transaction.payment.method === 'mobile' ? 'Mobile' : 'Assurance'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-primary">
                        {transaction.totals.total.toLocaleString()} FCFA
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{transaction.cashier.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {transaction.register.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Détails de la Transaction</DialogTitle>
                            <DialogDescription>
                              Référence: {transaction.reference}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Informations générales */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Date et Heure</Label>
                                <p className="text-sm">{transaction.date.toLocaleString()}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Statut</Label>
                                <div className="mt-1">{getStatusBadge(transaction.status)}</div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Client</Label>
                                <p className="text-sm">{transaction.customer.name}</p>
                                <div className="mt-1">{getCustomerTypeBadge(transaction.customer.type)}</div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Caissier</Label>
                                <p className="text-sm">{transaction.cashier.name}</p>
                                <p className="text-xs text-muted-foreground">{transaction.register.name}</p>
                              </div>
                            </div>

                            {/* Articles */}
                            <div>
                              <Label className="text-sm font-medium">Articles</Label>
                              <div className="mt-2 border rounded-lg">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Article</TableHead>
                                      <TableHead>Qté</TableHead>
                                      <TableHead>Prix Unit.</TableHead>
                                      <TableHead>Total</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {transaction.items.map((item) => (
                                      <TableRow key={item.id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.unitPrice.toLocaleString()} FCFA</TableCell>
                                        <TableCell>{item.total.toLocaleString()} FCFA</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>

                            {/* Totaux */}
                            <div className="border-t pt-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Sous-total:</span>
                                  <span>{transaction.totals.subtotal.toLocaleString()} FCFA</span>
                                </div>
                                {transaction.totals.discount > 0 && (
                                  <div className="flex justify-between text-green-600">
                                    <span>Remise:</span>
                                    <span>-{transaction.totals.discount.toLocaleString()} FCFA</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                  <span>Total:</span>
                                  <span>{transaction.totals.total.toLocaleString()} FCFA</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} sur {filteredTransactions.length} transactions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <span className="text-sm">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistory;