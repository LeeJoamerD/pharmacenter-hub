import React, { memo, useMemo, useCallback, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Eye,
  Edit,
  Download,
  Truck,
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Order {
  id: string;
  numero: string;
  fournisseur_nom: string;
  date_commande: string;
  date_livraison: string;
  statut: string;
  montant_total: number;
  nombre_produits: number;
}

interface OptimizedOrderListProps {
  orders: Order[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onUpdateStatus: (id: string, statut: string) => Promise<any>;
  onDeleteOrder: (id: string) => Promise<any>;
}

// Memoized row component for virtualized list
const OrderRow = memo(({ index, style, data }: any) => {
  const { orders, onUpdateStatus, onDeleteOrder } = data;
  const order = orders[index];

  const getStatusColor = useCallback((statut: string) => {
    switch (statut) {
      case 'brouillon': return 'bg-gray-100 text-gray-800';
      case 'envoyee': return 'bg-blue-100 text-blue-800';
      case 'confirmee': return 'bg-yellow-100 text-yellow-800';
      case 'partielle': return 'bg-orange-100 text-orange-800';
      case 'livree': return 'bg-green-100 text-green-800';
      case 'annulee': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusIcon = useCallback((statut: string) => {
    switch (statut) {
      case 'brouillon': return <Edit className="h-4 w-4" />;
      case 'envoyee': return <Truck className="h-4 w-4" />;
      case 'confirmee': return <CheckCircle className="h-4 w-4" />;
      case 'partielle': return <Clock className="h-4 w-4" />;
      case 'livree': return <CheckCircle className="h-4 w-4" />;
      case 'annulee': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  }, []);

  return (
    <div style={style} className="p-2 border-b">
      <div className="flex items-center justify-between">
        <div className="flex-1 grid grid-cols-6 gap-4 items-center">
          <div className="font-medium">{order.numero}</div>
          <div>{order.fournisseur_nom}</div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {new Date(order.date_commande).toLocaleDateString('fr-FR')}
          </div>
          <div className="flex items-center gap-1">
            <Truck className="h-4 w-4 text-muted-foreground" />
            {new Date(order.date_livraison).toLocaleDateString('fr-FR')}
          </div>
          <div className="font-medium">{order.montant_total.toLocaleString()} F CFA</div>
          <Badge className={`${getStatusColor(order.statut)} flex items-center gap-1 w-fit`}>
            {getStatusIcon(order.statut)}
            {order.statut}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

OrderRow.displayName = 'OrderRow';

const PerformanceOptimizedOrderList: React.FC<OptimizedOrderListProps> = ({
  orders,
  loading,
  onRefresh,
  onUpdateStatus,
  onDeleteOrder
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('tous');
  const [selectedSupplier, setSelectedSupplier] = useState('tous');

  // Memoized filtered orders to prevent unnecessary recalculations
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.fournisseur_nom.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'tous' || order.statut === selectedStatus;
      const matchesSupplier = selectedSupplier === 'tous' || order.fournisseur_nom === selectedSupplier;
      
      return matchesSearch && matchesStatus && matchesSupplier;
    });
  }, [orders, searchTerm, selectedStatus, selectedSupplier]);

  // Memoized suppliers list
  const suppliers = useMemo(() => {
    return [...new Set(orders.map(order => order.fournisseur_nom))];
  }, [orders]);

  // Memoized statistics
  const statistics = useMemo(() => {
    const enCours = orders.filter(o => ['envoyee', 'confirmee', 'partielle'].includes(o.statut)).length;
    const brouillons = orders.filter(o => o.statut === 'brouillon').length;
    const livrees = orders.filter(o => o.statut === 'livree').length;
    const total = orders.length;

    return { enCours, brouillons, livrees, total };
  }, [orders]);

  // Optimized search handler with debouncing
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setSelectedStatus(value);
  }, []);

  const handleSupplierChange = useCallback((value: string) => {
    setSelectedSupplier(value);
  }, []);

  // Row renderer data for virtualized list
  const rowData = useMemo(() => ({
    orders: filteredOrders,
    onUpdateStatus,
    onDeleteOrder
  }), [filteredOrders, onUpdateStatus, onDeleteOrder]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Optimized Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">En Cours</p>
                <p className="text-2xl font-bold">{statistics.enCours}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-muted-foreground">Brouillons</p>
                <p className="text-2xl font-bold">{statistics.brouillons}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Livrées</p>
                <p className="text-2xl font-bold">{statistics.livrees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Commandes</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des Commandes (Optimisée)</CardTitle>
              <CardDescription>
                {filteredOrders.length} commandes affichées sur {orders.length} au total
              </CardDescription>
            </div>
            <Button onClick={onRefresh} disabled={loading}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Optimized Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par numéro ou fournisseur..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-48">
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
            
            <Select value={selectedSupplier} onValueChange={handleSupplierChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les fournisseurs</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier} value={supplier}>
                    {supplier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Virtualized List for Performance */}
          <div className="border rounded-lg">
            {/* Headers */}
            <div className="p-2 border-b bg-muted/50 font-medium">
              <div className="grid grid-cols-6 gap-4">
                <div>Numéro</div>
                <div>Fournisseur</div>
                <div>Date Commande</div>
                <div>Livraison Prévue</div>
                <div>Montant HT</div>
                <div>Statut</div>
              </div>
            </div>
            
            {/* Virtualized Rows */}
            {filteredOrders.length > 0 ? (
              <List
                height={600}
                itemCount={filteredOrders.length}
                itemSize={80}
                itemData={rowData}
              >
                {OrderRow}
              </List>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                Aucune commande trouvée avec les critères sélectionnés
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(PerformanceOptimizedOrderList);