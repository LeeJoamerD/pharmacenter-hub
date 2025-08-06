import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Truck
} from 'lucide-react';

interface Order {
  id: string;
  numero: string;
  fournisseur: string;
  dateCommande: string;
  dateLivraison: string;
  statut: 'brouillon' | 'envoyee' | 'confirmee' | 'partielle' | 'livree' | 'annulee';
  totalHT: number;
  nbProduits: number;
  responsable: string;
}

interface OrderListProps {
  orders: any[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onUpdateStatus: (id: string, statut: string) => Promise<any>;
  onDeleteOrder: (id: string) => Promise<any>;
}

const OrderList: React.FC<OrderListProps> = ({ orders: propOrders = [], loading, onRefresh, onUpdateStatus, onDeleteOrder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('tous');
  const [selectedSupplier, setSelectedSupplier] = useState('tous');

  // Use real orders or fallback to mock data
  const orders = propOrders.length > 0 ? propOrders : [
    {
      id: '1',
      numero: 'CMD-2024-001',
      fournisseur: 'Laboratoire Alpha',
      dateCommande: '2024-12-01',
      dateLivraison: '2024-12-15',
      statut: 'confirmee',
      totalHT: 125000,
      nbProduits: 15,
      responsable: 'Marie Dupont'
    },
    {
      id: '2',
      numero: 'CMD-2024-002',
      fournisseur: 'Pharma Beta',
      dateCommande: '2024-12-02',
      dateLivraison: '2024-12-16',
      statut: 'envoyee',
      totalHT: 85000,
      nbProduits: 8,
      responsable: 'Jean Martin'
    }
  ];

  const fournisseurs = [...new Set(orders.map(order => order.fournisseur_nom || order.fournisseur))];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.fournisseur.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'tous' || order.statut === selectedStatus;
    const matchesSupplier = selectedSupplier === 'tous' || order.fournisseur === selectedSupplier;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'brouillon': return 'bg-gray-100 text-gray-800';
      case 'envoyee': return 'bg-blue-100 text-blue-800';
      case 'confirmee': return 'bg-yellow-100 text-yellow-800';
      case 'partielle': return 'bg-orange-100 text-orange-800';
      case 'livree': return 'bg-green-100 text-green-800';
      case 'annulee': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'brouillon': return <Edit className="h-4 w-4" />;
      case 'envoyee': return <ShoppingCart className="h-4 w-4" />;
      case 'confirmee': return <CheckCircle className="h-4 w-4" />;
      case 'partielle': return <Package className="h-4 w-4" />;
      case 'livree': return <Truck className="h-4 w-4" />;
      case 'annulee': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">En Cours</p>
                <p className="text-2xl font-bold">{orders.filter(o => ['envoyee', 'confirmee', 'partielle'].includes(o.statut)).length}</p>
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
                <p className="text-2xl font-bold">{orders.filter(o => o.statut === 'brouillon').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Livrées</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.statut === 'livree').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Commandes</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des commandes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des Commandes</CardTitle>
              <CardDescription>Gestion complète des commandes fournisseurs</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Commande
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par numéro ou fournisseur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
            
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les fournisseurs</SelectItem>
                {fournisseurs.map(fournisseur => (
                  <SelectItem key={fournisseur} value={fournisseur}>
                    {fournisseur}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tableau des commandes */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Date Commande</TableHead>
                  <TableHead>Livraison Prévue</TableHead>
                  <TableHead>Montant HT</TableHead>
                  <TableHead>Produits</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.numero}</TableCell>
                    <TableCell>{order.fournisseur}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(order.dateCommande).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        {new Date(order.dateLivraison).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.totalHT.toLocaleString()} F CFA</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{order.nbProduits} articles</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(order.statut)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(order.statut)}
                        {order.statut}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderList;