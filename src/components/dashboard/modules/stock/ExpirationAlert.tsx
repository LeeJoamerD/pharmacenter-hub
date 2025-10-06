import { useState, useMemo, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  AlertTriangle, 
  Calendar, 
  Package, 
  Settings, 
  Search, 
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  X,
  XCircle,
  Clock,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useExpirationAlerts } from '@/hooks/useExpirationAlerts';
import { useLots } from '@/hooks/useLots';

export const ExpirationAlert = () => {
  // États pour la gestion des alertes
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [actionNotes, setActionNotes] = useState('');
  
  // États pour la gestion des paramètres
  const [showParametersDialog, setShowParametersDialog] = useState(false);
  const [parameters, setParameters] = useState({
    seuil_critique: 7,
    seuil_alerte: 30,
    seuil_avertissement: 60,
    notification_email: true,
    notification_dashboard: true
  });

  // États pour l'autocomplete
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hooks pour les données
  const {
    useExpirationAlertsQuery,
    useCriticalAlertsQuery,
    useAlertStatsQuery,
    updateAlertStatus,
    isUpdatingStatus: hookIsUpdatingStatus,
    generateExpirationAlerts,
    getUrgencyColor,
    getAlertTypeLabel,
    getRecommendedActions
  } = useExpirationAlerts();

  const { data: alerts = [], isLoading, refetch } = useExpirationAlertsQuery();
  const { data: criticalAlerts = [] } = useCriticalAlertsQuery();
  const { data: alertStats } = useAlertStatsQuery();
  const { useLotsQuery } = useLots();
  const { data: lots = [] } = useLotsQuery();

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtrage des produits pour l'autocomplete
  const filteredProducts = useMemo(() => {
    if (!lots || searchTerm.length < 1) return [];
    
    const searchLower = searchTerm.toLowerCase();
    const uniqueProducts = new Map();
    
    lots.forEach(lot => {
      if (lot.produit && !uniqueProducts.has(lot.produit.id)) {
        const product = lot.produit;
        if (
          product.libelle_produit.toLowerCase().includes(searchLower) ||
          product.code_cip?.toLowerCase().includes(searchLower)
        ) {
          uniqueProducts.set(product.id, product);
        }
      }
    });
    
    return Array.from(uniqueProducts.values()).slice(0, 10);
  }, [lots, searchTerm]);

  // Fonction pour sélectionner un produit depuis le champ de recherche
  const handleProductSelection = (productId: string, productName: string) => {
    setSelectedProductId(productId);
    setSearchTerm(productName);
    setShowDropdown(false);
  };

  // Fonction pour effacer la sélection
  const clearSelection = () => {
    setSelectedProductId("");
    setSearchTerm("");
    setShowDropdown(false);
  };

  // Filtrage des alertes avec recherche améliorée
  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    
    return alerts.filter((alert: any) => {
      // Filtre par urgence
      if (urgencyFilter !== "all" && alert.niveau_urgence !== urgencyFilter) {
        return false;
      }
      
      // Filtre par produit sélectionné (via autocomplete)
      if (selectedProductId && alert.produit_id !== selectedProductId) {
        return false;
      }
      
      // Recherche textuelle (si pas de produit sélectionné)
      if (!selectedProductId && searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const produitNom = alert.produit?.libelle_produit?.toLowerCase() || '';
        const codeCip = alert.produit?.code_cip?.toLowerCase() || '';
        const numeroLot = alert.lot?.numero_lot?.toLowerCase() || '';
        
        return produitNom.includes(searchLower) || 
               codeCip.includes(searchLower) || 
               numeroLot.includes(searchLower);
      }
      
      return true;
    });
  }, [alerts, urgencyFilter, selectedProductId, searchTerm]);

  const handleMarkAsTreated = async (alert: any) => {
    try {
      await updateAlertStatus({
        id: alert.id,
        statut: 'traitee',
        notes: actionNotes || 'Alerte marquée comme traitée',
        traite_par_id: 'current-user-id' // À remplacer par l'ID utilisateur réel
      });
      setActionNotes('');
      toast({
        title: "Alerte traitée",
        description: "L'alerte a été marquée comme traitée avec succès.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'alerte.",
        variant: "destructive",
      });
    }
  };

  const handleIgnoreAlert = async (alert: any) => {
    try {
      await updateAlertStatus({
        id: alert.id,
        statut: 'ignoree',
        notes: actionNotes || 'Alerte ignorée',
        traite_par_id: 'current-user-id' // À remplacer par l'ID utilisateur réel
      });
      setActionNotes('');
      toast({
        title: "Alerte ignorée",
        description: "L'alerte a été ignorée avec succès.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ignorer l'alerte.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateAlerts = async () => {
    try {
      await generateExpirationAlerts();
      toast({
        title: "Alertes générées",
        description: "Les alertes d'expiration ont été générées avec succès.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer les alertes d'expiration.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Alertes Actives</p>
                <p className="text-2xl font-bold text-red-600">{alertStats?.active || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {alertStats?.activeQuantity || 0} unités concernées
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Critiques</p>
                <p className="text-2xl font-bold text-orange-600">{alertStats?.critical || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {alertStats?.criticalQuantity || 0} unités concernées
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-blue-600">{alertStats?.total || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {alertStats?.totalQuantity || 0} unités concernées
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Élevées</p>
                <p className="text-2xl font-bold text-green-600">{alertStats?.high || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {alertStats?.highQuantity || 0} unités concernées
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface principale des alertes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alertes d'Expiration</CardTitle>
              <CardDescription>Gestion des alertes de péremption des produits</CardDescription>
            </div>
            <Button 
              onClick={handleGenerateAlerts}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Générer Alertes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres et recherche */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative" ref={dropdownRef}>
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par produit, code CIP ou lot..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowDropdown(searchTerm.length > 0)}
                  className="pl-10 pr-10"
                />
                {selectedProductId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    ×
                  </Button>
                )}
                
                {/* Dropdown de suggestions */}
                {showDropdown && filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductSelection(product.id, product.libelle_produit)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{product.libelle_produit}</p>
                            {product.code_cip && (
                              <p className="text-xs text-gray-500">CIP: {product.code_cip}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredProducts.length === 10 && (
                      <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50">
                        Tapez pour affiner la recherche...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Urgence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="critique">Critique</SelectItem>
                  <SelectItem value="eleve">Élevée</SelectItem>
                  <SelectItem value="moyen">Moyenne</SelectItem>
                  <SelectItem value="faible">Faible</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
              onClick={() => setShowParametersDialog(true)}
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
          </div>
        </div>

        {/* Boîte de dialogue des paramètres */}
        <Dialog open={showParametersDialog} onOpenChange={setShowParametersDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Paramètres des Alertes</DialogTitle>
              <DialogDescription>
                Configurez les seuils et notifications pour les alertes d'expiration.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="seuil-critique" className="text-right">
                  Seuil Critique
                </Label>
                <Input
                  id="seuil-critique"
                  type="number"
                  value={parameters.seuil_critique}
                  onChange={(e) => setParameters(prev => ({
                    ...prev,
                    seuil_critique: parseInt(e.target.value)
                  }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="seuil-alerte" className="text-right">
                  Seuil Alerte
                </Label>
                <Input
                  id="seuil-alerte"
                  type="number"
                  value={parameters.seuil_alerte}
                  onChange={(e) => setParameters(prev => ({
                    ...prev,
                    seuil_alerte: parseInt(e.target.value)
                  }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="seuil-avertissement" className="text-right">
                  Seuil Avertissement
                </Label>
                <Input
                  id="seuil-avertissement"
                  type="number"
                  value={parameters.seuil_avertissement}
                  onChange={(e) => setParameters(prev => ({
                    ...prev,
                    seuil_avertissement: parseInt(e.target.value)
                  }))}
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowParametersDialog(false)}>
                Annuler
              </Button>
              <Button onClick={() => {
                // Ici on sauvegarderait les paramètres
                toast({
                  title: "Paramètres sauvegardés",
                  description: "Les paramètres ont été mis à jour avec succès.",
                });
                setShowParametersDialog(false);
              }}>
                Sauvegarder
              </Button>
            </div>
          </DialogContent>
        </Dialog>

          {/* Tableau des alertes */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Date Expiration</TableHead>
                  <TableHead>Jours Restants</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Urgence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Chargement des alertes...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {searchTerm || selectedProductId ? 
                        "Aucune alerte trouvée pour cette recherche" : 
                        "Aucune alerte d'expiration trouvée"
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((alert: any) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{alert.produit?.libelle_produit}</p>
                          {alert.produit?.code_cip && (
                            <p className="text-sm text-muted-foreground">CIP: {alert.produit.code_cip}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{alert.lot?.numero_lot}</p>
                          {alert.lot?.emplacement && (
                            <p className="text-sm text-muted-foreground">{alert.lot.emplacement}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {alert.lot?.date_peremption ? 
                          format(new Date(alert.lot.date_peremption), 'dd/MM/yyyy', { locale: fr }) : 
                          'Non définie'
                        }
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          alert.jours_restants <= 0 ? 'text-red-600' :
                          alert.jours_restants <= 7 ? 'text-orange-600' :
                          alert.jours_restants <= 30 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {alert.jours_restants <= 0 ? 'Expiré' : `${alert.jours_restants} jours`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{alert.quantite_concernee}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getAlertTypeLabel(alert.type_alerte)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getUrgencyColor(alert.niveau_urgence)}>
                          {alert.niveau_urgence}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          alert.statut === 'active' ? 'destructive' :
                          alert.statut === 'traitee' ? 'default' : 'secondary'
                        }>
                          {alert.statut === 'active' ? 'Active' :
                           alert.statut === 'traitee' ? 'Traitée' : 'Ignorée'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {alert.statut === 'active' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsTreated(alert)}
                                disabled={hookIsUpdatingStatus}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleIgnoreAlert(alert)}
                                disabled={hookIsUpdatingStatus}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Boîte de dialogue pour voir les détails d'une alerte */}
      {selectedAlert && (
        <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Détails de l'Alerte</DialogTitle>
              <DialogDescription>
                Informations détaillées sur l'alerte d'expiration
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Produit</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAlert.produit?.libelle_produit}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Code CIP</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAlert.produit?.code_cip || 'Non défini'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Numéro de Lot</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAlert.lot?.numero_lot}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date d'Expiration</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAlert.lot?.date_peremption ? 
                      format(new Date(selectedAlert.lot.date_peremption), 'dd/MM/yyyy', { locale: fr }) : 
                      'Non définie'
                    }
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Quantité Concernée</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAlert.quantite_concernee} unités
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Jours Restants</Label>
                  <p className={`text-sm font-medium ${
                    selectedAlert.jours_restants <= 0 ? 'text-red-600' :
                    selectedAlert.jours_restants <= 7 ? 'text-orange-600' :
                    selectedAlert.jours_restants <= 30 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {selectedAlert.jours_restants <= 0 ? 'Expiré' : `${selectedAlert.jours_restants} jours`}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type d'Alerte</Label>
                  <Badge variant="outline" className="mt-1">
                    {getAlertTypeLabel(selectedAlert.type_alerte)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Niveau d'Urgence</Label>
                  <Badge className={`mt-1 ${getUrgencyColor(selectedAlert.niveau_urgence)}`}>
                    {selectedAlert.niveau_urgence}
                  </Badge>
                </div>
              </div>
              {selectedAlert.recommandation && (
                <div>
                  <Label className="text-sm font-medium">Recommandation</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedAlert.recommandation}
                  </p>
                </div>
              )}
              {selectedAlert.statut === 'active' && (
                <div>
                  <Label htmlFor="action-notes">Notes d'Action</Label>
                  <Textarea
                    id="action-notes"
                    placeholder="Ajouter des notes sur l'action à prendre..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              {selectedAlert.statut === 'active' && (
                <>
                  <Button 
                    onClick={() => handleMarkAsTreated(selectedAlert)}
                    disabled={hookIsUpdatingStatus}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Traiter
                  </Button>
                  <Button 
                     variant="outline"
                     onClick={() => handleIgnoreAlert(selectedAlert)}
                     disabled={hookIsUpdatingStatus}
                   >
                     <X className="h-4 w-4 mr-2" />
                     Ignorer
                   </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};