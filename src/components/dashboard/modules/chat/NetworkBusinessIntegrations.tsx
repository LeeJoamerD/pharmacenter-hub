import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Link,
  ShoppingCart,
  Package,
  AlertTriangle,
  Bell,
  FileText,
  Users,
  Database,
  Settings,
  Search,
  Plus,
  XCircle,
  RefreshCw,
  Eye,
  Download,
  Upload,
  Zap,
  Calendar,
  Stethoscope,
  Pill,
  Shield,
  Target,
  Save,
  Filter,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';
import { useNetworkBusinessIntegrations, NetworkProduct, NetworkOrder, NetworkPatient, NetworkStockAlert, NetworkPrescription, NetworkIntegration } from '@/hooks/useNetworkBusinessIntegrations';
import { ProductInteractionsDialog } from './dialogs/ProductInteractionsDialog';
import { OrderDetailDialog } from './dialogs/OrderDetailDialog';
import { PatientDetailDialog } from './dialogs/PatientDetailDialog';
import { AlertTreatmentDialog } from './dialogs/AlertTreatmentDialog';
import { PrescriptionViewDialog } from './dialogs/PrescriptionViewDialog';
import { IntegrationConfigDialog } from './dialogs/IntegrationConfigDialog';
import { ReminderSettingsDialog } from './dialogs/ReminderSettingsDialog';
import { exportProductsToExcel, exportOrdersToExcel, exportPatientsToExcel, exportAlertsToExcel, exportProductsToPDF, exportOrdersToPDF, exportPatientsToPDF, exportAlertsToPDF } from '@/utils/networkBusinessExportUtils';
import { toast } from 'sonner';

const NetworkBusinessIntegrations = () => {
  const {
    products,
    orders,
    patients,
    stockAlerts,
    prescriptions,
    integrations,
    reminderSettings,
    stats,
    isLoading,
    searchTerm,
    setSearchTerm,
    refetchProducts,
    refetchOrders,
    refetchPatients,
    refetchAlerts,
    refetchPrescriptions,
    refetchIntegrations,
    updateOrderStatus,
    isUpdatingOrder,
    treatAlert,
    isTreatingAlert,
    saveReminderSettings,
    isSavingSettings,
    saveIntegration,
    isSavingIntegration,
    testIntegration,
    isTestingIntegration
  } = useNetworkBusinessIntegrations();

  // Local filter states
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [alertPriorityFilter, setAlertPriorityFilter] = useState<string>('all');

  // Dialog states
  const [showProductInteractions, setShowProductInteractions] = useState(false);
  
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<NetworkOrder | null>(null);
  
  const [showPatientDetail, setShowPatientDetail] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<NetworkPatient | null>(null);
  
  const [showAlertTreatment, setShowAlertTreatment] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<NetworkStockAlert | null>(null);
  
  const [showPrescriptionView, setShowPrescriptionView] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<NetworkPrescription | null>(null);
  
  const [showIntegrationConfig, setShowIntegrationConfig] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<NetworkIntegration | null>(null);
  
  const [showReminderSettings, setShowReminderSettings] = useState(false);

  // Local reminder settings state
  const [localRenewalEnabled, setLocalRenewalEnabled] = useState(reminderSettings?.renewal_reminders_enabled ?? true);
  const [localVaccinationEnabled, setLocalVaccinationEnabled] = useState(reminderSettings?.vaccination_reminders_enabled ?? true);
  const [localControlEnabled, setLocalControlEnabled] = useState(reminderSettings?.control_reminders_enabled ?? false);
  const [localDaysBeforeExpiry, setLocalDaysBeforeExpiry] = useState(reminderSettings?.days_before_expiry ?? 7);
  const [localReminderFrequency, setLocalReminderFrequency] = useState<'daily' | 'weekly' | 'monthly'>(reminderSettings?.reminder_frequency ?? 'weekly');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-muted-foreground';
      case 'error': return 'bg-destructive';
      case 'available': return 'bg-green-500';
      case 'low_stock': return 'bg-yellow-500';
      case 'out_of_stock': return 'bg-destructive';
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-destructive';
      default: return 'bg-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'urgent': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Basse';
      case 'medium': return 'Moyenne';
      case 'high': return 'Haute';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  };

  const handleOpenProductInteractions = () => {
    setShowProductInteractions(true);
  };

  const handleViewOrderDetail = (order: NetworkOrder) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const handleTrackOrder = (order: NetworkOrder) => {
    updateOrderStatus({ orderId: order.id, status: 'processing' });
    toast.success('Statut de commande mis à jour');
  };

  const handleDownloadInvoice = (order: NetworkOrder) => {
    exportOrdersToPDF([order], `facture_${order.id}.pdf`);
    toast.success('Facture téléchargée');
  };

  const handleViewPatientDossier = (patient: NetworkPatient) => {
    setSelectedPatient(patient);
    setShowPatientDetail(true);
  };

  const handleTreatAlert = (alert: NetworkStockAlert) => {
    setSelectedAlert(alert);
    setShowAlertTreatment(true);
  };

  const handleAlertAction = (alertId: string, action: string, notes?: string) => {
    treatAlert({ alertId, action, notes });
    setShowAlertTreatment(false);
    toast.success('Alerte traitée avec succès');
  };

  const handleViewPrescription = (prescription: NetworkPrescription) => {
    setSelectedPrescription(prescription);
    setShowPrescriptionView(true);
  };

  const handleUploadPrescription = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implement file upload
      toast.success('Ordonnance téléchargée avec succès');
    }
  };

  const handleSaveReminderSettings = () => {
    saveReminderSettings({
      renewal_reminders_enabled: localRenewalEnabled,
      vaccination_reminders_enabled: localVaccinationEnabled,
      control_reminders_enabled: localControlEnabled,
      days_before_expiry: localDaysBeforeExpiry,
      reminder_frequency: localReminderFrequency
    });
    toast.success('Configuration des rappels sauvegardée');
  };

  const handleConfigureIntegration = (integration: NetworkIntegration) => {
    setSelectedIntegration(integration);
    setShowIntegrationConfig(true);
  };

  const handleNewIntegration = () => {
    setSelectedIntegration(null);
    setShowIntegrationConfig(true);
  };

  const handleExportProducts = (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      exportProductsToExcel(products, 'produits_reseau.xlsx');
    } else {
      exportProductsToPDF(products, 'produits_reseau.pdf');
    }
    toast.success(`Export ${format.toUpperCase()} généré`);
  };

  const handleExportOrders = (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      exportOrdersToExcel(orders, 'commandes_reseau.xlsx');
    } else {
      exportOrdersToPDF(orders, 'commandes_reseau.pdf');
    }
    toast.success(`Export ${format.toUpperCase()} généré`);
  };

  const handleExportPatients = (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      exportPatientsToExcel(patients, 'patients_reseau.xlsx');
    } else {
      exportPatientsToPDF(patients, 'patients_reseau.pdf');
    }
    toast.success(`Export ${format.toUpperCase()} généré`);
  };

  const handleExportAlerts = (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      exportAlertsToExcel(stockAlerts, 'alertes_stock.xlsx');
    } else {
      exportAlertsToPDF(stockAlerts, 'alertes_stock.pdf');
    }
    toast.success(`Export ${format.toUpperCase()} généré`);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    orderStatusFilter === 'all' || o.status === orderStatusFilter
  );

  const filteredAlerts = stockAlerts.filter(a =>
    alertPriorityFilter === 'all' || a.priority === alertPriorityFilter
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Chargement des données...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Link className="h-8 w-8 text-primary" />
            Intégrations Métiers Réseau
          </h1>
          <p className="text-muted-foreground">
            Connectivité et synchronisation avec les systèmes métiers pharmaceutiques
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            refetchProducts();
            refetchOrders();
            refetchPatients();
            refetchAlerts();
            refetchPrescriptions();
            refetchIntegrations();
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={handleNewIntegration}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Intégration
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commandes en cours</p>
                <p className="text-2xl font-bold">{stats.pendingOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertes actives</p>
                <p className="text-2xl font-bold">{stats.totalAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Patients</p>
                <p className="text-2xl font-bold">{stats.totalPatients}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="products">Fiches Produits</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="patients">Dossiers Patients</TabsTrigger>
          <TabsTrigger value="alerts">Alertes Stock</TabsTrigger>
          <TabsTrigger value="prescriptions">Ordonnances</TabsTrigger>
          <TabsTrigger value="integrations">Intégrations</TabsTrigger>
        </TabsList>

        {/* Fiches Produits */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Catalogue Produits Intégré
                    </CardTitle>
                    <CardDescription>
                      Accès direct aux informations médicaments depuis le chat
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExportProducts('excel')}>
                      <FileSpreadsheet className="h-4 w-4 mr-1" />
                      Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportProducts('pdf')}>
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Search className="h-4 w-4" />
                    <Input 
                      placeholder="Rechercher un médicament..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Aucun produit trouvé</p>
                    ) : (
                      filteredProducts.map((product) => (
                        <div key={product.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Pill className="h-5 w-5 text-primary" />
                              <div>
                                <h4 className="font-medium">{product.name}</h4>
                                <p className="text-sm text-muted-foreground">{product.code} • {product.type}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(product.status)}`}></div>
                              <Badge variant="outline">{product.price.toLocaleString()} FCFA</Badge>
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Stock: </span>
                              <span className="font-medium">{product.stock}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Prescription: </span>
                              <span className="font-medium">{product.prescriptionRequired ? 'Oui' : 'Non'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Interactions: </span>
                              <span className="font-medium">{product.interactions.length}</span>
                            </div>
                          </div>

                          {product.interactions.length > 0 && (
                            <div className="mt-2">
                              <Label className="text-sm">Interactions:</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {product.interactions.map((interaction, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {interaction}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Vérification Interactions
                </CardTitle>
                <CardDescription>
                  Contrôle automatique des interactions médicamenteuses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-2 border-dashed rounded-lg text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Sélectionnez des médicaments pour vérifier les interactions
                  </p>
                  <Button variant="outline" size="sm" onClick={handleOpenProductInteractions}>
                    <Search className="h-4 w-4 mr-2" />
                    Analyser Prescription
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Alertes Actives</h4>
                  <div className="space-y-2">
                    {stockAlerts.filter(a => a.priority === 'urgent' || a.priority === 'high').slice(0, 3).map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`flex items-center gap-3 p-2 rounded border ${
                          alert.priority === 'urgent' 
                            ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' 
                            : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
                        }`}
                      >
                        <AlertTriangle className={`h-4 w-4 ${getPriorityColor(alert.priority)}`} />
                        <div className="text-sm">
                          <span className="font-medium">{alert.type === 'rupture' ? 'Rupture de stock' : 'Alerte'}</span>
                          <p className="text-muted-foreground">{alert.product}</p>
                        </div>
                      </div>
                    ))}
                    {stockAlerts.filter(a => a.priority === 'urgent' || a.priority === 'high').length === 0 && (
                      <p className="text-sm text-muted-foreground">Aucune alerte urgente</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Commandes */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Suivi des Commandes Clients
                  </CardTitle>
                  <CardDescription>
                    Consultation et gestion des commandes depuis le chat réseau
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filtrer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="processing">En traitement</SelectItem>
                      <SelectItem value="completed">Terminée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => handleExportOrders('excel')}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExportOrders('pdf')}>
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune commande trouvée</p>
                ) : (
                  filteredOrders.map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-medium">#{order.numero_vente || order.id.slice(0, 8)}</h4>
                            <p className="text-sm text-muted-foreground">{order.customer} • {order.pharmacy}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`}></div>
                          <Badge variant="outline">{order.total.toLocaleString()} FCFA</Badge>
                          <Button variant="outline" size="sm" onClick={() => handleViewOrderDetail(order)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Articles: </span>
                          <span className="font-medium">{order.items}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Statut: </span>
                          <span className="font-medium capitalize">{order.status}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date: </span>
                          <span className="font-medium">
                            {new Date(order.date).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleTrackOrder(order)}
                            disabled={isUpdatingOrder}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Suivre
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(order)}>
                            <Download className="h-4 w-4 mr-1" />
                            Facture
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dossiers Patients */}
        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Dossiers Patients Sécurisés
                  </CardTitle>
                  <CardDescription>
                    Accès contrôlé aux historiques et informations patients
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportPatients('excel')}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExportPatients('pdf')}>
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patients.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucun patient trouvé</p>
                ) : (
                  patients.map((patient) => (
                    <div key={patient.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Stethoscope className="h-5 w-5 text-primary" />
                          <div>
                            <h4 className="font-medium">{patient.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {patient.age ? `${patient.age} ans • ` : ''}{patient.pharmacy}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewPatientDossier(patient)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Dossier
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleViewPatientDossier(patient)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Historique
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Dernière visite: </span>
                          <span className="font-medium">
                            {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString('fr-FR') : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prescriptions actives: </span>
                          <span className="font-medium">{patient.prescriptions}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Allergies: </span>
                          <span className="font-medium">{patient.allergies.length}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm">Allergies connues:</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {patient.allergies.length > 0 ? (
                              patient.allergies.map((allergy, index) => (
                                <Badge key={index} variant="destructive" className="text-xs">
                                  {allergy}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">Aucune allergie connue</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">Conditions chroniques:</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {patient.chronicConditions.length > 0 ? (
                              patient.chronicConditions.map((condition, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {condition}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">Aucune condition chronique</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertes Stock */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Alertes Stock Automatiques
                  </CardTitle>
                  <CardDescription>
                    Notifications automatiques des ruptures et péremptions
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={alertPriorityFilter} onValueChange={setAlertPriorityFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="urgent">Urgentes</SelectItem>
                      <SelectItem value="high">Hautes</SelectItem>
                      <SelectItem value="medium">Moyennes</SelectItem>
                      <SelectItem value="low">Basses</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => handleExportAlerts('excel')}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExportAlerts('pdf')}>
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAlerts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune alerte trouvée</p>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`h-5 w-5 ${getPriorityColor(alert.priority)}`} />
                          <div>
                            <h4 className="font-medium">{alert.product}</h4>
                            <p className="text-sm text-muted-foreground">{alert.pharmacy}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={alert.priority === 'urgent' ? 'destructive' : 'secondary'}>
                            {getPriorityLabel(alert.priority)}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleTreatAlert(alert)}
                            disabled={isTreatingAlert}
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            Traiter
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Stock actuel: </span>
                          <span className="font-medium">{alert.currentStock}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Seuil minimum: </span>
                          <span className="font-medium">{alert.minThreshold}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type: </span>
                          <span className="font-medium capitalize">{alert.type.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Créée: </span>
                          <span className="font-medium">
                            {new Date(alert.created_at).toLocaleString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-muted rounded">
                        <div className="flex items-center gap-2 text-sm">
                          <RefreshCw className="h-4 w-4" />
                          <span>Action suggérée: </span>
                          <span className="font-medium">
                            {alert.type === 'rupture' ? 'Commande urgente' : 
                             alert.type === 'expiry' ? 'Écoulement prioritaire' : 
                             'Réapprovisionnement'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ordonnances */}
        <TabsContent value="prescriptions" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Gestion des Ordonnances
                </CardTitle>
                <CardDescription>
                  Consultation et traitement des ordonnances depuis le chat
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-2 border-dashed rounded-lg text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Glissez une ordonnance ici ou cliquez pour sélectionner
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleUploadPrescription}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Charger Ordonnance
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Ordonnances Récentes</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {prescriptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucune ordonnance récente</p>
                    ) : (
                      prescriptions.map((prescription) => (
                        <div key={prescription.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <span className="font-medium">{prescription.doctorName}</span>
                              <p className="text-sm text-muted-foreground">
                                {prescription.patientName} • {new Date(prescription.date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleViewPrescription(prescription)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Rappels Automatisés
                    </CardTitle>
                    <CardDescription>
                      Système de rappels programmables pour patients
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowReminderSettings(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Avancé
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Rappels de renouvellement</Label>
                    <Switch 
                      checked={localRenewalEnabled} 
                      onCheckedChange={setLocalRenewalEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Rappels de vaccination</Label>
                    <Switch 
                      checked={localVaccinationEnabled} 
                      onCheckedChange={setLocalVaccinationEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Rappels de contrôle</Label>
                    <Switch 
                      checked={localControlEnabled} 
                      onCheckedChange={setLocalControlEnabled}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Délai avant expiration (jours)</Label>
                  <Input 
                    type="number" 
                    value={localDaysBeforeExpiry} 
                    onChange={(e) => setLocalDaysBeforeExpiry(parseInt(e.target.value) || 7)}
                    className="mt-2" 
                  />
                </div>

                <div>
                  <Label>Fréquence des rappels</Label>
                  <Select 
                    value={localReminderFrequency} 
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setLocalReminderFrequency(value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleSaveReminderSettings}
                  disabled={isSavingSettings}
                >
                  {isSavingSettings ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Sauvegarder Configuration
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Intégrations */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                État des Intégrations Système
              </CardTitle>
              <CardDescription>
                Monitoring et configuration des connexions métiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune intégration configurée</p>
                ) : (
                  integrations.map((integration) => (
                    <div key={integration.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(integration.status)}`}></div>
                          <div>
                            <h4 className="font-medium">{integration.name}</h4>
                            <p className="text-sm text-muted-foreground">{integration.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                            {integration.status === 'connected' ? 'Connecté' :
                             integration.status === 'error' ? 'Erreur' : 'Déconnecté'}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => handleConfigureIntegration(integration)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Configurer
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Type: </span>
                          <span className="font-medium">{integration.type}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dernière sync: </span>
                          <span className="font-medium">
                            {integration.lastSync ? new Date(integration.lastSync).toLocaleString('fr-FR') : 'Jamais'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fonctionnalités: </span>
                          <span className="font-medium">{integration.features?.length || 0}</span>
                        </div>
                      </div>

                      {integration.features && integration.features.length > 0 && (
                        <div>
                          <Label className="text-sm">Fonctionnalités actives:</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {integration.features.map((feature, index) => (
                              <Badge key={index} variant="outline">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {integration.status === 'error' && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <XCircle className="h-4 w-4" />
                            <span>Erreur de connexion - Vérifier la configuration</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ProductInteractionsDialog
        open={showProductInteractions}
        onOpenChange={setShowProductInteractions}
        products={products}
      />

      <OrderDetailDialog
        open={showOrderDetail}
        onOpenChange={setShowOrderDetail}
        order={selectedOrder}
        onUpdateStatus={(orderId, status) => {
          updateOrderStatus({ orderId, status });
          setShowOrderDetail(false);
        }}
      />

      <PatientDetailDialog
        open={showPatientDetail}
        onOpenChange={setShowPatientDetail}
        patient={selectedPatient}
      />

      <AlertTreatmentDialog
        open={showAlertTreatment}
        onOpenChange={setShowAlertTreatment}
        alert={selectedAlert}
        onTreatAlert={handleAlertAction}
      />

      <PrescriptionViewDialog
        open={showPrescriptionView}
        onOpenChange={setShowPrescriptionView}
        prescription={selectedPrescription}
      />

      <IntegrationConfigDialog
        open={showIntegrationConfig}
        onOpenChange={setShowIntegrationConfig}
        integration={selectedIntegration}
        onSave={(config) => {
          saveIntegration(config);
          setShowIntegrationConfig(false);
        }}
        onTest={(integrationId) => {
          testIntegration(integrationId);
        }}
        isSaving={isSavingIntegration}
        isTesting={isTestingIntegration}
      />

      <ReminderSettingsDialog
        open={showReminderSettings}
        onOpenChange={setShowReminderSettings}
        settings={reminderSettings}
        onSave={(settings) => {
          saveReminderSettings(settings);
          setShowReminderSettings(false);
        }}
      />
    </div>
  );
};

export default NetworkBusinessIntegrations;
