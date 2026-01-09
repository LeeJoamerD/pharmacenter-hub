import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Check,
  XCircle,
  Send,
  Loader2
} from 'lucide-react';
import { PharmaMLService } from '@/services/PharmaMLService';
import PharmaMLHistory from './PharmaMLHistory';
import { useAuth } from '@/contexts/AuthContext';
import { useOrderLines } from '@/hooks/useOrderLines';
import { OrderPDFService } from '@/services/OrderPDFService';
import { OrderExcelService } from '@/services/OrderExcelService';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

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
    pharmaml_enabled?: boolean;
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
  const [sendingPharmaML, setSendingPharmaML] = useState<string | null>(null);
  const [pharmamlStatus, setPharmamlStatus] = useState<Record<string, { configured: boolean; sent: boolean; lastStatus?: string }>>({});
  const { orderLines } = useOrderLines();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { pharmacy } = useAuth();
  const ordersPerPage = 10;

  // Calculate real totals for each order using useOrderLines data
  const [ordersWithTotals, setOrdersWithTotals] = useState<any[]>([]);

  useEffect(() => {
    const processOrders = () => {
      const ordersWithCalculatedTotals = propOrders.map((order) => {
        // Filter order lines for this specific order
        const orderSpecificLines = orderLines.filter(line => line.commande_id === order.id);
        
        // Calculate totals from order lines
        const orderTotal = orderSpecificLines.reduce((sum, line) => {
          const lineTotal = (line.quantite_commandee || 0) * (line.prix_achat_unitaire_attendu || 0);
          return sum + lineTotal;
        }, 0);
        
        const orderQuantity = orderSpecificLines.reduce((sum, line) => sum + (line.quantite_commandee || 0), 0);
        const orderProductCount = orderSpecificLines.length;

        return {
          ...order,
          numero: `CMD-${new Date(order.date_commande || order.created_at).getFullYear()}-${String(order.id).slice(-3).padStart(3, '0')}`,
          fournisseur: order.fournisseur?.nom || 'Fournisseur inconnu',
          fournisseur_nom: order.fournisseur?.nom || 'Fournisseur inconnu',
          dateCommande: order.date_commande || order.created_at,
          dateLivraison: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          // Montants directement depuis Supabase
          totalHT: order.montant_ht || 0,
          montantTVA: order.montant_tva || 0,
          montantCAdd: order.montant_centime_additionnel || 0,
          montantASDI: order.montant_asdi || 0,
          totalTTC: order.montant_ttc || 0,
          nbProduits: orderProductCount,
          totalQuantity: orderQuantity,
          responsable: order.agent ? `${order.agent.prenoms} ${order.agent.noms}` : 'Non assigné'
        };
      });
      
      setOrdersWithTotals(ordersWithCalculatedTotals);
    };

    if (propOrders.length > 0) {
      processOrders();
    }
  }, [propOrders, orderLines]);

  // Check PharmaML status for orders
  useEffect(() => {
    const checkPharmaMLStatus = async () => {
      const statusMap: Record<string, { configured: boolean; sent: boolean; lastStatus?: string }> = {};
      
      for (const order of propOrders) {
        if (order.fournisseur_id) {
          const configured = await PharmaMLService.isSupplierConfigured(order.fournisseur_id);
          const { sent, lastStatus } = await PharmaMLService.hasBeenSent(order.id);
          statusMap[order.id] = { configured, sent, lastStatus };
        }
      }
      
      setPharmamlStatus(statusMap);
    };
    
    if (propOrders.length > 0) {
      checkPharmaMLStatus();
    }
  }, [propOrders]);

  // Use orders with calculated totals
  const orders = ordersWithTotals;

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
      case 'Brouillon': return 'bg-gray-100 text-gray-800';
      case 'En cours': return 'bg-blue-100 text-blue-800';
      case 'Confirmé': return 'bg-green-100 text-green-800';
      case 'Expédié': return 'bg-yellow-100 text-yellow-800';
      case 'En transit': return 'bg-orange-100 text-orange-800';
      case 'Livré': return 'bg-purple-100 text-purple-800';
      case 'Réceptionné': return 'bg-emerald-100 text-emerald-800';
      case 'Annulé': return 'bg-red-100 text-red-800';
      // Backward compatibility
      case 'brouillon': return 'bg-gray-100 text-gray-800';
      case 'envoyee': return 'bg-blue-100 text-blue-800';
      case 'confirmee': return 'bg-yellow-100 text-yellow-800';
      case 'partielle': return 'bg-orange-100 text-orange-800';
      case 'livree': return 'bg-purple-100 text-purple-800';
      case 'annulee': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'Brouillon': case 'brouillon': return <Edit className="h-4 w-4" />;
      case 'En cours': return <Clock className="h-4 w-4" />;
      case 'Confirmé': case 'envoyee': return <CheckCircle className="h-4 w-4" />;
      case 'Expédié': case 'confirmee': return <Package className="h-4 w-4" />;
      case 'En transit': case 'partielle': return <Truck className="h-4 w-4" />;
      case 'Livré': case 'livree': return <CheckSquare className="h-4 w-4" />;
      case 'Réceptionné': return <Check className="h-4 w-4" />;
      case 'Annulé': case 'annulee': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await onUpdateStatus(orderId, newStatus);
      toast({
        title: t('orderListSuccess'),
        description: t('orderListStatusUpdated'),
      });
      onRefresh();
    } catch (error) {
      toast({
        title: t('orderListError'),
        description: t('orderListCannotUpdateStatus'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await onDeleteOrder(orderId);
      toast({
        title: t('orderListSuccess'),
        description: t('orderListDeleteSuccess'),
      });
      onRefresh();
    } catch (error) {
      toast({
        title: t('orderListError'), 
        description: t('orderListCannotDelete'),
        variant: "destructive",
      });
    }
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleDownloadOrder = async (order: any) => {
    try {
      // Get order lines for this specific order and convert format
      const orderSpecificLines = orderLines
        .filter(line => line.commande_id === order.id)
        .map(line => ({
          id: line.id,
          produit_id: line.produit_id,
          quantite: line.quantite_commandee || 0,
          prix_unitaire: line.prix_achat_unitaire_attendu || 0,
          remise: 0,
          produit: line.produit ? {
            libelle_produit: line.produit.libelle_produit,
            code_cip: line.produit.code_cip,
            ancien_code_cip: line.produit.ancien_code_cip
          } : undefined,
          commande_id: line.commande_id
        }));
      
      // Créer l'objet order avec les montants de Supabase
      const orderWithAmounts = {
        ...order,
        montantHT: order.totalHT,
        montantTVA: order.montantTVA,
        montantCAdd: order.montantCAdd,
        montantASDI: order.montantASDI,
        montantTTC: order.totalTTC
      };
      
      const result = await OrderPDFService.generateOrderPDF(orderWithAmounts, orderSpecificLines);
      
      if (result.success && result.downloadUrl) {
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: t('orderListSuccess'),
          description: t('orderListDownloadSuccess', { orderNumber: order.numero }),
        });
      }
    } catch (error) {
      toast({
        title: t('orderListError'),
        description: t('orderListCannotGeneratePDF'),
        variant: "destructive",
      });
    }
  };

  const handleDownloadExcel = async (order: any) => {
    try {
      const orderSpecificLines = orderLines
        .filter(line => line.commande_id === order.id)
        .map(line => ({
          id: line.id,
          produit_id: line.produit_id,
          quantite: line.quantite_commandee || 0,
          prix_unitaire: line.prix_achat_unitaire_attendu || 0,
          produit: line.produit ? {
            libelle_produit: line.produit.libelle_produit,
            code_cip: line.produit.code_cip,
            ancien_code_cip: line.produit.ancien_code_cip
          } : undefined
        }));
      
      const orderWithAmounts = {
        id: order.id,
        numero: order.numero,
        fournisseur: order.fournisseur,
        dateCommande: order.dateCommande,
        dateLivraison: order.dateLivraison,
        statut: order.statut,
        responsable: order.responsable,
        montantHT: order.totalHT,
        montantTVA: order.montantTVA,
        montantCAdd: order.montantCAdd,
        montantASDI: order.montantASDI,
        montantTTC: order.totalTTC
      };
      
      await OrderExcelService.generateOrderExcel(orderWithAmounts, orderSpecificLines);
      
      toast({
        title: t('orderListSuccess'),
        description: `Excel téléchargé pour ${order.numero}`,
      });
    } catch (error) {
      toast({
        title: t('orderListError'),
        description: 'Erreur lors de la génération Excel',
        variant: "destructive",
      });
    }
  };

  const handleSendPharmaML = async (order: any) => {
    if (!pharmacy?.id) {
      toast({
        title: t('orderListError'),
        description: 'Pharmacie non identifiée',
        variant: "destructive",
      });
      return;
    }

    setSendingPharmaML(order.id);
    
    try {
      const result = await PharmaMLService.sendOrder(
        order.id,
        order.fournisseur_id,
        pharmacy.id
      );

      if (result.success) {
        toast({
          title: t('pharmamlSendSuccess'),
          description: result.orderNumber ? `N° PharmaML: ${result.orderNumber}` : result.message,
        });
        // Update local status
        setPharmamlStatus(prev => ({
          ...prev,
          [order.id]: { ...prev[order.id], sent: true, lastStatus: 'success' }
        }));
        onRefresh();
      } else {
        toast({
          title: t('pharmamlSendError'),
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t('pharmamlSendError'),
        description: error.message || 'Erreur inattendue',
        variant: "destructive",
      });
    } finally {
      setSendingPharmaML(null);
    }
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
                <p className="text-sm text-muted-foreground">{t('orderListInProgress')}</p>
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
                <p className="text-sm text-muted-foreground">{t('orderListDrafts')}</p>
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
                <p className="text-sm text-muted-foreground">{t('orderListDelivered')}</p>
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
                <p className="text-sm text-muted-foreground">{t('orderListTotalOrders')}</p>
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
                {t('orderListTitle')}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
              <CardDescription>{t('orderListDescription')} ({filteredOrders.length} {t('orderListOrders')})</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('orderListNewOrder')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('orderListSearchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('orderListStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">{t('orderListAllStatuses')}</SelectItem>
                <SelectItem value="Brouillon">{t('orderListDraft')}</SelectItem>
                <SelectItem value="En cours">{t('orderListInProgress')}</SelectItem>
                <SelectItem value="Confirmé">{t('orderListConfirmed')}</SelectItem>
                <SelectItem value="Expédié">{t('orderListShipped')}</SelectItem>
                <SelectItem value="En transit">{t('orderListInTransit')}</SelectItem>
                <SelectItem value="Livré">{t('orderListDelivered')}</SelectItem>
                <SelectItem value="Réceptionné">{t('orderListReceived')}</SelectItem>
                <SelectItem value="Annulé">{t('orderListCancelled')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('orderListSupplier')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">{t('orderListAllSuppliers')}</SelectItem>
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
                  <TableHead>{t('orderListNumber')}</TableHead>
                  <TableHead>{t('orderListSupplier')}</TableHead>
                  <TableHead>{t('orderListOrderDate')}</TableHead>
                  <TableHead>{t('orderListExpectedDelivery')}</TableHead>
                  <TableHead>{t('orderListAmountHT')}</TableHead>
                  <TableHead>{t('orderListProducts')}</TableHead>
                  <TableHead>{t('orderListStatus')}</TableHead>
                  <TableHead>{t('orderFormActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      {t('orderListLoading')}
                    </TableCell>
                  </TableRow>
                ) : paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      {t('orderListNoOrderFound')}
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
                          <div>{order.nbProduits || 0} {t('orderListArticles')}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.statut}
                          onValueChange={(value) => handleStatusUpdate(order.id, value)}
                        >
                          <SelectTrigger className="w-fit border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0">
                            <Badge className={`${getStatusColor(order.statut)} flex items-center gap-1 cursor-pointer`}>
                              {getStatusIcon(order.statut)}
                              {order.statut}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Brouillon">{t('orderListStatusDraft')}</SelectItem>
                            <SelectItem value="En cours">{t('orderListStatusInProgress')}</SelectItem>
                            <SelectItem value="Confirmé">{t('orderListStatusConfirmed')}</SelectItem>
                            <SelectItem value="Expédié">{t('orderListStatusShipped')}</SelectItem>
                            <SelectItem value="En transit">{t('orderListStatusInTransit')}</SelectItem>
                            <SelectItem value="Livré">{t('orderListStatusDelivered')}</SelectItem>
                            <SelectItem value="Réceptionné">{t('orderListStatusReceived')}</SelectItem>
                            <SelectItem value="Annulé">{t('orderListStatusCancelled')}</SelectItem>
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
                            title="Télécharger PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadExcel(order)}
                            title="Télécharger Excel"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                          </Button>
                          {/* PharmaML Send Button */}
                          {pharmamlStatus[order.id]?.configured && (
                            <Button 
                              variant={pharmamlStatus[order.id]?.sent ? "secondary" : 
                                       pharmamlStatus[order.id]?.lastStatus === 'error' ? "destructive" : "default"}
                              size="sm"
                              onClick={() => handleSendPharmaML(order)}
                              disabled={sendingPharmaML === order.id || pharmamlStatus[order.id]?.sent}
                              title={pharmamlStatus[order.id]?.sent ? 'Envoyé avec succès' : 
                                     pharmamlStatus[order.id]?.lastStatus === 'error' ? 'Erreur - Cliquez pour réessayer' :
                                     t('pharmamlSendOrder')}
                            >
                              {sendingPharmaML === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : pharmamlStatus[order.id]?.lastStatus === 'error' ? (
                                <XCircle className="h-4 w-4" />
                              ) : pharmamlStatus[order.id]?.sent ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('orderListDeleteOrder')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('orderListDeleteConfirmation')} {order.numero} ?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('orderListCancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteOrder(order.id)}>
                                  {t('orderListDelete')}
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
                  {t('orderListPage')} {currentPage} {t('orderListOf')} {totalPages} ({filteredOrders.length} {t('orderListOrdersTotal')})
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('orderListPrevious')}
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
                    {t('orderListNext')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog pour les détails de commande */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{t('orderListOrderDetails')}</DialogTitle>
              <DialogDescription>
                {t('orderListOrderDetailsDescription')} {selectedOrder?.numero}
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 overflow-auto pr-4">
              {selectedOrder && <OrderDetailsContent order={selectedOrder} getStatusColor={getStatusColor} t={t} />}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    );
};

// Composant pour afficher les détails d'une commande
const OrderDetailsContent = ({ order, getStatusColor, t }: { order: any; getStatusColor: (statut: string) => string; t: (key: string, params?: Record<string, string | number>) => string }) => {
  const { orderLines, loading: linesLoading } = useOrderLines(order.id);
  const [pharmamlConfigured, setPharmamlConfigured] = useState(false);
  const [hasTransmissions, setHasTransmissions] = useState(false);

  useEffect(() => {
    const checkPharmaML = async () => {
      if (order?.fournisseur_id) {
        const configured = await PharmaMLService.isSupplierConfigured(order.fournisseur_id);
        setPharmamlConfigured(configured);
      }
      
      if (order?.id) {
        const { hasTransmissions: hasTx } = await PharmaMLService.hasBeenSent(order.id);
        setHasTransmissions(hasTx);
      }
    };
    checkPharmaML();
  }, [order?.id, order?.fournisseur_id]);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">{t('orderListGeneralInfo')}</h4>
          <div className="space-y-2 text-sm">
            <div><strong>{t('orderListNumber')}:</strong> {order.numero}</div>
            <div><strong>{t('orderListSupplier')}:</strong> {order.fournisseur}</div>
            <div><strong>{t('orderListOrderDate')}:</strong> {new Date(order.dateCommande).toLocaleDateString('fr-FR')}</div>
            <div><strong>{t('orderListExpectedDelivery')}:</strong> {new Date(order.dateLivraison).toLocaleDateString('fr-FR')}</div>
            <div><strong>{t('orderListStatus')}:</strong> <Badge className={getStatusColor(order.statut)}>{order.statut}</Badge></div>
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-2">{t('orderListAmounts')}</h4>
          <div className="space-y-2 text-sm">
            <div><strong>{t('orderListSubtotalHT')}:</strong> {(order.totalHT || 0).toLocaleString()} F CFA</div>
            <div><strong>{t('orderListVAT')}:</strong> {(order.montantTVA || 0).toLocaleString()} F CFA</div>
            <div><strong>{t('orderListCAdd')}:</strong> {(order.montantCAdd || 0).toLocaleString()} F CFA</div>
            <div><strong>{t('orderListASDI')}:</strong> {(order.montantASDI || 0).toLocaleString()} F CFA</div>
            <div><strong>{t('orderListTotalTTC')}:</strong> {(order.totalTTC || 0).toLocaleString()} F CFA</div>
            <div><strong>{t('orderListArticlesCount')}:</strong> {order.nbProduits || 0}</div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">{t('orderListOrderLines')}</h4>
        {linesLoading ? (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            {t('orderListLoadingLines')}
          </div>
        ) : orderLines.length > 0 ? (
          <div className="max-h-[300px] overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orderListProduct')}</TableHead>
                  <TableHead>{t('orderListQuantity')}</TableHead>
                  <TableHead>{t('orderListUnitPrice')}</TableHead>
                  <TableHead>{t('orderListTotal')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderLines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.produit?.libelle_produit || t('orderListUnknownProduct')}</TableCell>
                    <TableCell>{line.quantite_commandee}</TableCell>
                    <TableCell>{(line.prix_achat_unitaire_attendu || 0).toLocaleString()} F CFA</TableCell>
                    <TableCell>{((line.quantite_commandee || 0) * (line.prix_achat_unitaire_attendu || 0)).toLocaleString()} F CFA</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            {t('orderListNoOrderLines')}
          </div>
        )}
      </div>

      {/* Historique PharmaML */}
      {(pharmamlConfigured || hasTransmissions) && (
        <div className="mt-4">
          <PharmaMLHistory orderId={order.id} />
        </div>
      )}
    </div>
  );
};

export default OrderList;