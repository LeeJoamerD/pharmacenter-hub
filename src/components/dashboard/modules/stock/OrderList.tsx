import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
  ChevronRight
} from 'lucide-react';
import { useOrderLines } from '@/hooks/useOrderLines';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  tenant_id: string;
  fournisseur_id: string;
  date_commande: string;
  agent_id?: string;
  statut: string;
  created_at: string;
  updated_at: string;
  // Relations
  fournisseur?: {
    nom: string;
    email?: string;
    telephone_appel?: string;
  };
  agent?: {
    noms: string;
    prenoms: string;
  };
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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();
  const ordersPerPage = 10;

  // Display real orders data
  const orders = propOrders.map(order => ({
    ...order,
    numero: `CMD-${new Date(order.date_commande || order.created_at).getFullYear()}-${String(order.id).slice(-3).padStart(3, '0')}`,
    fournisseur: order.fournisseur?.nom || 'Fournisseur inconnu',
    fournisseur_nom: order.fournisseur?.nom || 'Fournisseur inconnu',
    dateCommande: order.date_commande || order.created_at,
    dateLivraison: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalHT: 0, // Will be calculated from order lines
    nbProduits: 0, // Will be calculated from order lines
    responsable: order.agent ? `${order.agent.prenoms} ${order.agent.noms}` : 'Non assigné'
  }));

  const fournisseurs = useMemo(() => 
    [...new Set(orders.map(order => order.fournisseur_nom || order.fournisseur))],
    [orders]
  );

  // Filter and paginate orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = (order.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (order.fournisseur || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'tous' || order.statut === selectedStatus;
      const matchesSupplier = selectedSupplier === 'tous' || order.fournisseur === selectedSupplier;
      
      return matchesSearch && matchesStatus && matchesSupplier;
    });
  }, [orders, searchTerm, selectedStatus, selectedSupplier]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(startIndex, startIndex + ordersPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Calculate real statistics from filtered data
  const statistics = useMemo(() => {
    const enCours = filteredOrders.filter(o => ['En cours', 'Confirmé', 'Expédié', 'En transit'].includes(o.statut)).length;
    const brouillons = filteredOrders.filter(o => o.statut === 'En cours').length;
    const livrees = filteredOrders.filter(o => o.statut === 'Livré').length;
    const total = filteredOrders.length;
    
    return { enCours, brouillons, livrees, total };
  }, [filteredOrders]);

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'En cours': return 'bg-gray-100 text-gray-800';
      case 'Confirmé': return 'bg-blue-100 text-blue-800';
      case 'Expédié': return 'bg-yellow-100 text-yellow-800';
      case 'En transit': return 'bg-orange-100 text-orange-800';
      case 'Livré': return 'bg-green-100 text-green-800';
      case 'Annulé': return 'bg-red-100 text-red-800';
      // Backward compatibility
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
      case 'En cours': case 'brouillon': return <Edit className="h-4 w-4" />;
      case 'Confirmé': case 'envoyee': return <ShoppingCart className="h-4 w-4" />;
      case 'Expédié': case 'confirmee': return <CheckCircle className="h-4 w-4" />;
      case 'En transit': case 'partielle': return <Package className="h-4 w-4" />;
      case 'Livré': case 'livree': return <Truck className="h-4 w-4" />;
      case 'Annulé': case 'annulee': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await onUpdateStatus(orderId, newStatus);
      toast({
        title: "Succès",
        description: "Statut de la commande mis à jour",
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await onDeleteOrder(orderId);
      toast({
        title: "Succès",
        description: "Commande supprimée avec succès",
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Erreur", 
        description: "Impossible de supprimer la commande",
        variant: "destructive",
      });
    }
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleDownloadOrder = (order: any) => {
    // Generate PDF or export functionality
    toast({
      title: "Téléchargement",
      description: `Téléchargement de la commande ${order.numero}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Statistiques rapides avec vraies données */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
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
              <Truck className="h-5 w-5 text-green-600" />
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
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Commandes</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
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
              <CardTitle className="flex items-center gap-2">
                Liste des Commandes
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
              <CardDescription>Gestion complète des commandes fournisseurs ({filteredOrders.length} commandes)</CardDescription>
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
                <SelectItem value="En cours">En cours</SelectItem>
                <SelectItem value="Confirmé">Confirmé</SelectItem>
                <SelectItem value="Expédié">Expédié</SelectItem>
                <SelectItem value="En transit">En transit</SelectItem>
                <SelectItem value="Livré">Livré</SelectItem>
                <SelectItem value="Annulé">Annulé</SelectItem>
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Aucune commande trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => (
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
                        <div className="font-medium">{(order.totalHT || 0).toLocaleString()} F CFA</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{order.nbProduits || 0} articles</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.statut}
                          onValueChange={(value) => handleStatusUpdate(order.id, value)}
                        >
                          <SelectTrigger className="w-fit">
                            <Badge className={`${getStatusColor(order.statut)} flex items-center gap-1`}>
                              {getStatusIcon(order.statut)}
                              {order.statut}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="En cours">En cours</SelectItem>
                            <SelectItem value="Confirmé">Confirmé</SelectItem>
                            <SelectItem value="Expédié">Expédié</SelectItem>
                            <SelectItem value="En transit">En transit</SelectItem>
                            <SelectItem value="Livré">Livré</SelectItem>
                            <SelectItem value="Annulé">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadOrder(order)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer la commande</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer la commande {order.numero} ? Cette action ne peut pas être annulée.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteOrder(order.id)}>
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} sur {totalPages} ({filteredOrders.length} commandes au total)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog pour les détails de commande */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Détails de la Commande</DialogTitle>
              <DialogDescription>
                Informations complètes de la commande {selectedOrder?.numero}
              </DialogDescription>
            </DialogHeader>
            
            {selectedOrder && <OrderDetailsContent order={selectedOrder} getStatusColor={getStatusColor} />}
          </DialogContent>
        </Dialog>
      </div>
    );
};

// Composant pour afficher les détails d'une commande
const OrderDetailsContent = ({ order, getStatusColor }: { order: any; getStatusColor: (statut: string) => string }) => {
  const { orderLines, loading: linesLoading } = useOrderLines(order.id);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Informations générales</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Numéro:</strong> {order.numero}</div>
            <div><strong>Fournisseur:</strong> {order.fournisseur}</div>
            <div><strong>Date commande:</strong> {new Date(order.dateCommande).toLocaleDateString('fr-FR')}</div>
            <div><strong>Livraison prévue:</strong> {new Date(order.dateLivraison).toLocaleDateString('fr-FR')}</div>
            <div><strong>Statut:</strong> <Badge className={getStatusColor(order.statut)}>{order.statut}</Badge></div>
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-2">Montants</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Sous-total HT:</strong> {(order.totalHT || 0).toLocaleString()} F CFA</div>
            <div><strong>TVA (18%):</strong> {Math.round((order.totalHT || 0) * 0.18).toLocaleString()} F CFA</div>
            <div><strong>Total TTC:</strong> {Math.round((order.totalHT || 0) * 1.18).toLocaleString()} F CFA</div>
            <div><strong>Nombre d'articles:</strong> {order.nbProduits || 0}</div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Lignes de commande</h4>
        {linesLoading ? (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            Chargement des lignes...
          </div>
        ) : orderLines.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Prix unitaire</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderLines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.produit?.libelle_produit || 'Produit inconnu'}</TableCell>
                  <TableCell>{line.quantite_commandee}</TableCell>
                  <TableCell>{(line.prix_achat_unitaire_attendu || 0).toLocaleString()} F CFA</TableCell>
                  <TableCell>{((line.quantite_commandee || 0) * (line.prix_achat_unitaire_attendu || 0)).toLocaleString()} F CFA</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Aucune ligne de commande trouvée
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;