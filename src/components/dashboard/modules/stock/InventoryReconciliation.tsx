import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useInventoryReconciliation, ReconciliationItem } from '@/hooks/useInventoryReconciliation';
import { 
  Search,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Package,
  FileText,
  Eye,
  Edit,
  Check,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ReconciliationSummary {
  totalProduits: number;
  produitsEcart: number;
  ecartPositif: number;
  ecartNegatif: number;
  valeurEcartTotal: number;
  tauxPrecision: number;
}

const InventoryReconciliation = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'valide' | 'rejete'>('valide');
  const [motifEcart, setMotifEcart] = useState('');
  const [actionCorrective, setActionCorrective] = useState('');
  const [conformItems, setConformItems] = useState<ReconciliationItem[]>([]);
  const [activeTab, setActiveTab] = useState('ecarts');
  
  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentConformPage, setCurrentConformPage] = useState(1);
  const [conformItemsPerPage, setConformItemsPerPage] = useState(10);

  // Utilisation du hook de réconciliation
  const {
    reconciliationItems,
    summary,
    sessions,
    selectedSession,
    isLoading,
    setSelectedSession,
    fetchReconciliationItems,
    fetchConformItems,
    validateEcart,
    rejectEcart
  } = useInventoryReconciliation();

  // Charger les données au montage du composant
  useEffect(() => {
    if (selectedSession) {
      console.log('📊 [Réconciliation Component] Session changée:', selectedSession);
      // Forcer le rechargement des données avec la nouvelle session
      fetchReconciliationItems(selectedSession);
      fetchConformItems(selectedSession).then(items => {
        console.log(`✅ Chargé ${items.length} produits conformes`);
        setConformItems(items);
      });
    } else {
      // Vider les données si pas de session
      setConformItems([]);
    }
  }, [selectedSession]);

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'valide':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejete':
        return <X className="h-4 w-4 text-red-600" />;
      case 'corrige':
        return <Check className="h-4 w-4 text-blue-600" />;
      case 'en_attente':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (statut: string) => {
    const colors = {
      valide: 'bg-green-100 text-green-800 border-green-200',
      rejete: 'bg-red-100 text-red-800 border-red-200',
      corrige: 'bg-blue-100 text-blue-800 border-blue-200',
      en_attente: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    const labels = {
      valide: 'Validé',
      rejete: 'Rejeté',
      corrige: 'Corrigé',
      en_attente: 'En attente'
    };

    return (
      <Badge className={colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[statut as keyof typeof labels] || statut}
      </Badge>
    );
  };

  const filteredItems = reconciliationItems.filter(item => {
    const matchesSearch = item.produit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.lot.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.statut === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filtrer les produits conformes selon la recherche
  const filteredConformItems = conformItems.filter(item => {
    return item.produit.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.lot.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination pour les écarts
  const ecartItems = useMemo(() => {
    return filteredItems.filter(item => item.ecart !== 0);
  }, [filteredItems]);

  const paginatedEcartItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return ecartItems.slice(startIndex, startIndex + itemsPerPage);
  }, [ecartItems, currentPage, itemsPerPage]);

  const totalEcartPages = Math.ceil(ecartItems.length / itemsPerPage);

  // Pagination pour les produits conformes
  const paginatedConformItems = useMemo(() => {
    const startIndex = (currentConformPage - 1) * conformItemsPerPage;
    return filteredConformItems.slice(startIndex, startIndex + conformItemsPerPage);
  }, [filteredConformItems, currentConformPage, conformItemsPerPage]);

  const totalConformPages = Math.ceil(filteredConformItems.length / conformItemsPerPage);

  // Réinitialiser les pages lors des changements de filtres
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentConformPage(1);
  }, [searchTerm]);

  const handleValidateItem = async (itemId: string, action: 'valide' | 'rejete') => {
    // Ouvrir le dialog d'action avec motifs
    const item = reconciliationItems.find(i => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setActionType(action);
      setIsActionDialogOpen(true);
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedItem) return;
    
    try {
      if (actionType === 'valide') {
        await validateEcart(selectedItem.id, motifEcart, actionCorrective);
      } else {
        await rejectEcart(selectedItem.id, motifEcart, actionCorrective);
      }
      
      // Recharger les données après l'action
      if (selectedSession) {
        await fetchReconciliationItems(selectedSession);
        // Recharger aussi les produits conformes
        const conformData = await fetchConformItems(selectedSession);
        setConformItems(conformData);
      }
      
      // Fermer le dialog et réinitialiser
      setIsActionDialogOpen(false);
      setMotifEcart('');
      setActionCorrective('');
      setSelectedItem(null);
    } catch (error) {
      console.error(`Erreur lors de l'action ${actionType}:`, error);
    }
  };

  const handleValidateWithDetails = async (itemId: string, motif: string, action: string) => {
    try {
      await validateEcart(itemId);
      
      // Recharger les données
      if (selectedSession) {
        await fetchReconciliationItems(selectedSession);
      }
      
      // Fermer le dialog
      setIsDetailsDialogOpen(false);
      setMotifEcart('');
      setActionCorrective('');
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
    }
  };

  const openDetailsDialog = (item: ReconciliationItem) => {
    setSelectedItem(item);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Sélecteur de session */}
      <Card>
        <CardHeader>
          <CardTitle>Sélection de Session d'Inventaire</CardTitle>
          <CardDescription>Choisissez une session pour voir les écarts de réconciliation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Sélectionner une session..." />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.nom} - {new Date(session.date_debut).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {isLoading && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Affichage conditionnel du contenu */}
      {!selectedSession ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune session sélectionnée</h3>
            <p className="text-muted-foreground">
              Veuillez sélectionner une session d'inventaire pour voir les écarts de réconciliation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Résumé de la réconciliation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Produits avec Écart</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.produitsEcart}</p>
                  <p className="text-xs text-muted-foreground">sur {summary.totalProduits} produits</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taux de Précision</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.tauxPrecision.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Conformité inventaire</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valeur Écart Total</p>
                  <p className={`text-2xl font-bold ${summary.valeurEcartTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.valeurEcartTotal >= 0 ? '+' : ''}{summary.valeurEcartTotal.toFixed(2)} F CFA
                  </p>
                  <p className="text-xs text-muted-foreground">Impact financier</p>
                </div>
                {summary.valeurEcartTotal >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </CardContent>
            </Card>
          </div>

      {/* Onglets de réconciliation */}
      <Tabs defaultValue="ecarts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ecarts">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Écarts Détectés</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="conformes">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Produits Conformes</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="synthese">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Synthèse</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ecarts">
          <Card>
            <CardHeader>
              <CardTitle>Écarts d'Inventaire</CardTitle>
              <CardDescription>Produits nécessitant une validation ou correction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher produits..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="valide">Validé</SelectItem>
                    <SelectItem value="rejete">Rejeté</SelectItem>
                    <SelectItem value="corrige">Corrigé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Lot</TableHead>
                      <TableHead>Qté Théorique</TableHead>
                      <TableHead>Qté Comptée</TableHead>
                      <TableHead>Écart</TableHead>
                      <TableHead>Valeur Écart</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEcartItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.produit}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.lot}</Badge>
                        </TableCell>
                        <TableCell>{item.quantiteTheorique} {item.unite}</TableCell>
                        <TableCell>{item.quantiteComptee} {item.unite}</TableCell>
                        <TableCell>
                          <span className={item.ecart > 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.ecart > 0 ? '+' : ''}{item.ecart} {item.unite}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={item.valeurEcart > 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.valeurEcart > 0 ? '+' : ''}{item.valeurEcart.toFixed(2)} F CFA
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.statut)}
                            {getStatusBadge(item.statut)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openDetailsDialog(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {item.statut === 'en_attente' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleValidateItem(item.id, 'valide')}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleValidateItem(item.id, 'rejete')}
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination pour les écarts */}
              {totalEcartPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, ecartItems.length)} sur {ecartItems.length} écarts
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {Array.from({ length: Math.min(5, totalEcartPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalEcartPages - 4, currentPage - 2)) + i;
                        if (pageNum > totalEcartPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalEcartPages, currentPage + 1))}
                        disabled={currentPage === totalEcartPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conformes">
          <Card>
            <CardHeader>
              <CardTitle>Produits Conformes</CardTitle>
              <CardDescription>Produits sans écart détecté ({filteredConformItems.length} produits)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher produits conformes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Lot</TableHead>
                      <TableHead>Emplacement</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedConformItems.length > 0 ? (
                      paginatedConformItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.produit}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.lot}</Badge>
                          </TableCell>
                          <TableCell>{item.emplacement}</TableCell>
                          <TableCell>{item.quantiteComptee} {item.unite}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Conforme
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {conformItems.length === 0 
                            ? "Aucun produit conforme trouvé pour cette session"
                            : "Aucun produit conforme ne correspond à votre recherche"
                          }
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination pour les produits conformes */}
              {totalConformPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Affichage de {((currentConformPage - 1) * conformItemsPerPage) + 1} à {Math.min(currentConformPage * conformItemsPerPage, filteredConformItems.length)} sur {filteredConformItems.length} produits conformes
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select value={conformItemsPerPage.toString()} onValueChange={(value) => setConformItemsPerPage(Number(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentConformPage(Math.max(1, currentConformPage - 1))}
                        disabled={currentConformPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {Array.from({ length: Math.min(5, totalConformPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalConformPages - 4, currentConformPage - 2)) + i;
                        if (pageNum > totalConformPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentConformPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentConformPage(pageNum)}
                            className="w-8"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentConformPage(Math.min(totalConformPages, currentConformPage + 1))}
                        disabled={currentConformPage === totalConformPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="synthese">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Écarts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span>Écarts Positifs</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">{summary.ecartPositif}</div>
                      <div className="text-sm text-muted-foreground">produits</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span>Écarts Négatifs</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">{summary.ecartNegatif}</div>
                      <div className="text-sm text-muted-foreground">produits</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions Requises</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Écarts en attente de validation</span>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      {reconciliationItems.filter(item => item.statut === 'en_attente').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Écarts nécessitant correction</span>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      {reconciliationItems.filter(item => item.statut === 'rejete').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Écarts validés</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      {reconciliationItems.filter(item => item.statut === 'valide').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
        </>
      )}

      {/* Dialog détails */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de l'Écart</DialogTitle>
            <DialogDescription>
              Informations détaillées sur l'écart d'inventaire
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Produit</Label>
                  <p className="font-medium">{selectedItem.produit}</p>
                </div>
                <div>
                  <Label>Lot</Label>
                  <p>{selectedItem.lot}</p>
                </div>
                <div>
                  <Label>Quantité Théorique</Label>
                  <p>{selectedItem.quantiteTheorique} {selectedItem.unite}</p>
                </div>
                <div>
                  <Label>Quantité Comptée</Label>
                  <p>{selectedItem.quantiteComptee} {selectedItem.unite}</p>
                </div>
              </div>
              {selectedItem.motifEcart && (
                <div>
                  <Label>Motif de l'Écart</Label>
                  <p className="text-sm text-muted-foreground">{selectedItem.motifEcart}</p>
                </div>
              )}
              {selectedItem.actionCorrective && (
                <div>
                  <Label>Action Corrective</Label>
                  <p className="text-sm text-muted-foreground">{selectedItem.actionCorrective}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'action avec motifs */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'valide' ? 'Valider l\'écart' : 'Rejeter l\'écart'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <>
                  Produit: {selectedItem.produit} - Lot: {selectedItem.lot}
                  <br />
                  Écart: {selectedItem.ecart > 0 ? '+' : ''}{selectedItem.ecart} {selectedItem.unite}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="motif">Motif de l'écart *</Label>
              <Select value={motifEcart} onValueChange={setMotifEcart}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un motif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="erreur_saisie">Erreur de saisie</SelectItem>
                  <SelectItem value="produit_perime">Produit périmé</SelectItem>
                  <SelectItem value="produit_endommage">Produit endommagé</SelectItem>
                  <SelectItem value="vol_perte">Vol/Perte</SelectItem>
                  <SelectItem value="erreur_reception">Erreur de réception</SelectItem>
                  <SelectItem value="erreur_comptage">Erreur de comptage</SelectItem>
                  <SelectItem value="mouvement_non_enregistre">Mouvement non enregistré</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="action">Action corrective</Label>
              <Textarea
                id="action"
                placeholder="Décrire l'action corrective à entreprendre..."
                value={actionCorrective}
                onChange={(e) => setActionCorrective(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmAction}
              disabled={!motifEcart}
              variant={actionType === 'valide' ? 'default' : 'destructive'}
            >
              {actionType === 'valide' ? 'Valider' : 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryReconciliation;