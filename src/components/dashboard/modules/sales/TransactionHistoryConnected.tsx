import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Download, 
  Eye, 
  DollarSign,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

const TransactionHistoryConnected = () => {
  const { tenantId } = useTenant();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    paymentMethod: 'all',
    status: 'all',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'reference'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Récupérer les transactions avec filtres
  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['transactions', tenantId, filters, currentPage, sortBy, sortOrder],
    queryFn: async () => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage - 1;

      let query = supabase
        .from('ventes')
        .select(`
          *,
          client:client_id(nom_complet, telephone, email),
          agent:agent_id(noms, prenoms),
          caisse:caisse_id(nom),
          lignes_ventes(*)
        `, { count: 'exact' })
        .eq('tenant_id', tenantId!)
        .range(startIndex, endIndex);

      // Appliquer filtres
      if (filters.search) {
        query = query.or(`numero_vente.ilike.%${filters.search}%,client.nom_complet.ilike.%${filters.search}%`);
      }
      if (filters.dateFrom) {
        query = query.gte('date_vente', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('date_vente', filters.dateTo);
      }
      if (filters.paymentMethod !== 'all') {
        query = query.eq('mode_paiement', filters.paymentMethod as any);
      }
      if (filters.status !== 'all') {
        query = query.eq('statut', filters.status as any);
      }

      // Tri
      const sortColumn = sortBy === 'date' ? 'date_vente' : sortBy === 'amount' ? 'montant_net' : 'numero_vente';
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

      const { data, error, count } = await query;
      if (error) throw error;

      return { transactions: data || [], total: count || 0 };
    },
    enabled: !!tenantId,
  });

  // Statistiques calculées
  const { data: stats } = useQuery({
    queryKey: ['transaction-stats', tenantId, filters],
    queryFn: async () => {
      let query = supabase
        .from('ventes')
        .select('montant_net, statut, date_vente')
        .eq('tenant_id', tenantId!);

      if (filters.dateFrom) query = query.gte('date_vente', filters.dateFrom);
      if (filters.dateTo) query = query.lte('date_vente', filters.dateTo);

      const { data, error } = await query;
      if (error) throw error;

      const totalAmount = data?.reduce((sum, t) => sum + Number(t.montant_net), 0) || 0;
      const totalTransactions = data?.length || 0;
      const completed = data?.filter(t => t.statut === 'Validée' || t.statut === 'Finalisée').length || 0;
      const pending = data?.filter(t => t.statut === 'En cours').length || 0;
      const average = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

      return {
        totalTransactions,
        totalAmount,
        completedTransactions: completed,
        pendingTransactions: pending,
        averageTransaction: average,
      };
    },
    enabled: !!tenantId,
  });

  const handleSort = (field: 'date' | 'amount' | 'reference') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleExport = async () => {
    try {
      const { data, error } = await supabase
        .from('ventes')
        .select(`
          numero_vente,
          date_vente,
          montant_net,
          mode_paiement,
          statut,
          client:client_id(nom_complet),
          agent:agent_id(noms, prenoms)
        `)
        .eq('tenant_id', tenantId!);

      if (error) throw error;

      const exportData = data?.map(t => ({
        'Numéro': t.numero_vente,
        'Date': new Date(t.date_vente).toLocaleDateString('fr-FR'),
        'Montant': t.montant_net,
        'Mode Paiement': t.mode_paiement,
        'Statut': t.statut,
        'Client': (t.client as any)?.nom_complet || 'Anonyme',
        'Caissier': `${(t.agent as any)?.noms || ''} ${(t.agent as any)?.prenoms || ''}`.trim(),
      })) || [];

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
      XLSX.writeFile(wb, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: 'Export réussi',
        description: 'Les transactions ont été exportées avec succès',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur d\'export',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const totalPages = Math.ceil((transactions?.total || 0) / itemsPerPage);

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">-</Badge>;
    
    const variants = {
      'Validée': 'default',
      'Finalisée': 'default',
      'En cours': 'secondary',
      'Annulée': 'destructive',
      'Remboursée': 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
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
            <div className="text-2xl font-bold text-primary">
              {stats?.totalTransactions || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatPrice(stats?.totalAmount || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.completedTransactions || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.pendingTransactions || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatPrice(stats?.averageTransaction || 0)}
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
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
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
                  <SelectItem value="Espèces">Espèces</SelectItem>
                  <SelectItem value="Carte Bancaire">Carte Bancaire</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  <SelectItem value="Chèque">Chèque</SelectItem>
                  <SelectItem value="Virement">Virement</SelectItem>
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
                  <SelectItem value="Validée">Validée</SelectItem>
                  <SelectItem value="Finalisée">Finalisée</SelectItem>
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="Annulée">Annulée</SelectItem>
                  <SelectItem value="Remboursée">Remboursée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tableau */}
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : transactions?.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune transaction trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions?.transactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.numero_vente}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(transaction.date_vente).toLocaleDateString('fr-FR')}</div>
                          <div className="text-muted-foreground text-xs">
                            {new Date(transaction.date_vente).toLocaleTimeString('fr-FR')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.client?.nom_complet || 'Anonyme'}
                      </TableCell>
                      <TableCell>{transaction.mode_paiement}</TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(transaction.montant_net)}
                      </TableCell>
                      <TableCell>
                        {transaction.agent ? `${transaction.agent.noms} ${transaction.agent.prenoms}` : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.statut)}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Détails de la transaction</DialogTitle>
                              <DialogDescription>
                                {transaction.numero_vente}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Date</Label>
                                  <p className="text-sm">{new Date(transaction.date_vente).toLocaleString('fr-FR')}</p>
                                </div>
                                <div>
                                  <Label>Mode de paiement</Label>
                                  <p className="text-sm">{transaction.mode_paiement}</p>
                                </div>
                              </div>
                              <div>
                                <Label>Articles</Label>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Produit</TableHead>
                                      <TableHead>Qté</TableHead>
                                      <TableHead>Prix unitaire</TableHead>
                                      <TableHead>Total</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {transaction.lignes_ventes?.map((line: any) => (
                                      <TableRow key={line.id}>
                                        <TableCell>{line.libelle_produit}</TableCell>
                                        <TableCell>{line.quantite}</TableCell>
                                        <TableCell>{formatPrice(line.prix_unitaire)}</TableCell>
                                        <TableCell>{formatPrice(line.montant_ligne_ttc)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              <div className="border-t pt-4">
                                <div className="flex justify-between font-bold">
                                  <span>Total</span>
                                  <span>{formatPrice(transaction.montant_net)}</span>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages || 1}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistoryConnected;
