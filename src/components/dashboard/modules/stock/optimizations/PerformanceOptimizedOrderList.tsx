import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  Calendar, 
  Package, 
  ShoppingCart, 
  CheckCircle, 
  Clock,
  Eye,
  Edit,
  Plus,
  Download,
  Truck,
  Trash2,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle
} from 'lucide-react';
import { useOptimizedQueries, useSmartPagination, useLoadingStates } from '@/hooks/useOptimizedQueries';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PerformanceOptimizedOrderListProps {
  onCreateOrder?: () => void;
  onEditOrder?: (orderId: string) => void;
  onViewOrder?: (orderId: string) => void;
}

// Composant pour l'état de chargement
const OrderListSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Composant pour la pagination optimisée
const SmartPagination = ({ 
  pagination, 
  isLoading 
}: { 
  pagination: ReturnType<typeof useSmartPagination>;
  isLoading: boolean;
}) => {
  const { currentPage, totalPages, hasNextPage, hasPrevPage, goToPage, nextPage, prevPage, getPageNumbers } = pagination;
  
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-muted-foreground">
          Page {currentPage} sur {totalPages}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(1)}
          disabled={!hasPrevPage || isLoading}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={prevPage}
          disabled={!hasPrevPage || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === 'number' ? goToPage(page) : undefined}
              disabled={typeof page !== 'number' || isLoading}
              className={cn(
                "min-w-[32px]",
                typeof page === 'string' && "cursor-default"
              )}
            >
              {page}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={!hasNextPage || isLoading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(totalPages)}
          disabled={!hasNextPage || isLoading}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Composant principal optimisé
export const PerformanceOptimizedOrderList: React.FC<PerformanceOptimizedOrderListProps> = ({
  onCreateOrder,
  onEditOrder,
  onViewOrder
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('tous');
  const [selectedSupplier, setSelectedSupplier] = useState('tous');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const { toast } = useToast();
  const { setLoading, isLoading } = useLoadingStates();
  const { useOptimizedOrders, useOptimizedSuppliers, invalidateCache } = useOptimizedQueries();

  // Pagination intelligente avec données initiales
  const pagination = useSmartPagination(0, 20);

  // Requêtes optimisées
  const { 
    data: ordersData, 
    isLoading: ordersLoading, 
    error: ordersError,
    refetch: refetchOrders
  } = useOptimizedOrders({
    page: pagination.currentPage,
    pageSize: 20,
    status: selectedStatus,
    supplier: selectedSupplier,
    dateFrom,
    dateTo
  });

  const { 
    data: suppliers = [], 
    isLoading: suppliersLoading 
  } = useOptimizedSuppliers();

  // Mettre à jour la pagination quand les données changent
  React.useEffect(() => {
    if (ordersData?.count !== undefined) {
      // Ne pas réinitialiser la page si on a des données
      const newTotalPages = Math.ceil(ordersData.count / 20);
      if (pagination.currentPage > newTotalPages && newTotalPages > 0) {
        pagination.goToPage(1);
      }
    }
  }, [ordersData?.count]);

  // Actions optimisées avec gestion d'état
  const handleRefresh = useCallback(async () => {
    setLoading('refresh', true);
    try {
      await refetchOrders();
      invalidateCache('orders');
      toast({
        title: "Données actualisées",
        description: "Les commandes ont été rechargées avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de recharger les données.",
        variant: "destructive"
      });
    } finally {
      setLoading('refresh', false);
    }
  }, [refetchOrders, invalidateCache, setLoading, toast]);

  const handleStatusUpdate = useCallback(async (orderId: string, newStatus: string) => {
    setLoading(`status-${orderId}`, true);
    try {
      // Simuler la mise à jour du statut
      await new Promise(resolve => setTimeout(resolve, 500));
      
      invalidateCache('orders');
      toast({
        title: "Statut mis à jour",
        description: `La commande a été marquée comme ${newStatus}.`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive"
      });
    } finally {
      setLoading(`status-${orderId}`, false);
    }
  }, [invalidateCache, setLoading, toast]);

  // Mémos pour les données calculées
  const statistics = useMemo(() => {
    const stats = ordersData?.stats || {};
    return {
      total: ordersData?.count || 0,
      envoyees: stats['envoyee'] || 0,
      confirmees: stats['confirmee'] || 0,
      livrees: stats['livree'] || 0
    };
  }, [ordersData]);

  const filteredOrders = useMemo(() => {
    if (!ordersData?.data) return [];
    
    return ordersData.data.filter(order => {
      const matchesSearch = !searchTerm || 
        order.fournisseur?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [ordersData?.data, searchTerm]);

  // Créer la pagination avec le bon compte
  const paginationWithCount = useSmartPagination(ordersData?.count || 0, 20);

  // Rendu conditionnel pour les erreurs
  if (ordersError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des commandes. 
          <Button variant="link" onClick={handleRefresh} className="p-0 h-auto ml-2">
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Rendu du squelette pendant le chargement initial
  if (ordersLoading && !ordersData) {
    return <OrderListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{statistics.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Envoyées</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{statistics.envoyees}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-muted-foreground">Confirmées</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{statistics.confirmees}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Livrées</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{statistics.livrees}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des commandes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Commandes fournisseurs
              </CardTitle>
              <CardDescription>
                Gestion optimisée des commandes avec pagination intelligente
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading('refresh')}
              >
                <RefreshCw className={cn(
                  "h-4 w-4 mr-2",
                  isLoading('refresh') && "animate-spin"
                )} />
                Actualiser
              </Button>
              {onCreateOrder && (
                <Button onClick={onCreateOrder}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle commande
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filtres optimisés */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par fournisseur ou numéro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="envoyee">Envoyée</SelectItem>
                <SelectItem value="confirmee">Confirmée</SelectItem>
                <SelectItem value="partielle">Partielle</SelectItem>
                <SelectItem value="livree">Livrée</SelectItem>
                <SelectItem value="annulee">Annulée</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedSupplier} 
              onValueChange={setSelectedSupplier}
              disabled={suppliersLoading}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les fournisseurs</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tableau avec état de chargement */}
          <div className="relative">
            {ordersLoading && (
              <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Chargement...</span>
                </div>
              </div>
            )}
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Date commande</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Produits</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune commande trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        CMD-{new Date(order.date_commande || order.created_at).getFullYear()}-
                        {String(order.id).slice(-3).padStart(3, '0')}
                      </TableCell>
                      <TableCell>{order.fournisseur?.nom || 'Fournisseur inconnu'}</TableCell>
                      <TableCell>
                        {new Date(order.date_commande || order.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.statut}</Badge>
                      </TableCell>
                      <TableCell>
                        {order.lignes?.reduce((total: number, ligne: any) => 
                          total + (ligne.quantite_commandee * (ligne.prix_achat_unitaire_attendu || 0)), 0
                        ).toLocaleString('fr-FR')} FCFA
                      </TableCell>
                      <TableCell>{order.lignes?.length || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {onViewOrder && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewOrder(order.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {onEditOrder && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditOrder(order.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination intelligente */}
          <div className="mt-6">
            <SmartPagination pagination={paginationWithCount} isLoading={ordersLoading} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceOptimizedOrderList;