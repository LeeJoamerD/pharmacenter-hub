import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ArrowRightLeft,
  Calendar as CalendarIcon,
  Download,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  ArrowUpDown,
  FileX,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLotMovements } from '@/hooks/useLotMovements';
import { toast } from 'sonner';

const StockMovementJournal = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('tous');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // Hook pour les mouvements de lots
  const { 
    useLotMovementsQuery, 
    updateLotMovement, 
    deleteLotMovement,
    isUpdating,
    isDeleting,
    getMovementTypeLabel,
    getMovementTypeColor,
    getMovementIcon
  } = useLotMovements();

  // Filtres pour la query
  const filters = {
    ...(selectedType !== 'tous' && { type_mouvement: selectedType }),
    ...(dateFrom && { date_debut: format(dateFrom, 'yyyy-MM-dd') }),
    ...(dateTo && { date_fin: format(dateTo, 'yyyy-MM-dd') })
  };

  // Query pour récupérer les mouvements
  const { data: movements = [], isLoading, error } = useLotMovementsQuery(filters);

  // Filtrage côté client pour la recherche
  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    
    let filtered = movements;
    
    // Recherche plein-texte côté client
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((movement: any) => 
        movement.produit?.libelle_produit?.toLowerCase().includes(search) ||
        movement.lot?.numero_lot?.toLowerCase().includes(search) ||
        movement.motif?.toLowerCase().includes(search) ||
        movement.reference_document?.toLowerCase().includes(search) ||
        JSON.stringify(movement.metadata || {}).toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [movements, searchTerm]);

  // Pagination côté client
  const paginatedMovements = useMemo(() => {
    const startIndex = page * pageSize;
    return filteredMovements.slice(startIndex, startIndex + pageSize);
  }, [filteredMovements, page, pageSize]);

  // Calcul des statistiques
  const stats = useMemo(() => {
    if (!movements) return { total: 0, entrees: 0, sorties: 0, ajustements: 0, transferts: 0, retours: 0, destructions: 0 };
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayMovements = movements.filter((m: any) => 
      format(new Date(m.date_mouvement), 'yyyy-MM-dd') === today
    );
    
    return {
      total: movements.length,
      entrees: todayMovements.filter((m: any) => m.type_mouvement === 'entree').length,
      sorties: todayMovements.filter((m: any) => m.type_mouvement === 'sortie').length,
      ajustements: todayMovements.filter((m: any) => m.type_mouvement === 'ajustement').length,
      transferts: todayMovements.filter((m: any) => m.type_mouvement === 'transfert').length,
      retours: todayMovements.filter((m: any) => m.type_mouvement === 'retour').length,
      destructions: todayMovements.filter((m: any) => m.type_mouvement === 'destruction').length
    };
  }, [movements]);

  // Handlers pour les actions
  const handleViewDetails = (movement: any) => {
    setSelectedMovement(movement);
    setIsDetailsOpen(true);
  };

  const handleEdit = (movement: any) => {
    setSelectedMovement(movement);
    setEditData({
      quantite_mouvement: movement.quantite_mouvement,
      motif: movement.motif || '',
      reference_document: movement.reference_document || ''
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedMovement) return;
    
    try {
      await updateLotMovement({
        movementId: selectedMovement.id,
        updates: {
          quantite_mouvement: editData.quantite_mouvement,
          notes: editData.motif,
          reference_document: editData.reference_document
        }
      });
      setIsEditOpen(false);
      setSelectedMovement(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleDelete = async (movementId: string) => {
    try {
      await deleteLotMovement(movementId);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredMovements.length) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    const headers = [
      'Date/Heure',
      'Type',
      'Produit',
      'Lot',
      'Quantité Avant',
      'Quantité Mouvement',
      'Quantité Après',
      'Motif',
      'Référence',
      'Agent'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredMovements.map((movement: any) => [
        format(new Date(movement.date_mouvement), 'dd/MM/yyyy HH:mm'),
        getMovementTypeLabel(movement.type_mouvement),
        `"${movement.produit?.libelle_produit || ''}"`,
        movement.lot?.numero_lot || '',
        movement.quantite_avant || 0,
        movement.quantite_mouvement || 0,
        movement.quantite_apres || 0,
        `"${movement.motif || ''}"`,
        movement.reference_document || '',
        movement.agent_id || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mouvements_stock_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Export CSV généré avec succès');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'entree':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'sortie':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'transfert':
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      case 'ajustement':
        return <ArrowUpDown className="h-4 w-4 text-orange-600" />;
      case 'retour':
        return <RotateCcw className="h-4 w-4 text-purple-600" />;
      case 'destruction':
        return <FileX className="h-4 w-4 text-gray-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      entree: 'bg-green-100 text-green-800 border-green-200',
      sortie: 'bg-red-100 text-red-800 border-red-200',
      transfert: 'bg-blue-100 text-blue-800 border-blue-200',
      ajustement: 'bg-orange-100 text-orange-800 border-orange-200',
      retour: 'bg-purple-100 text-purple-800 border-purple-200',
      destruction: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {getMovementTypeLabel(type)}
      </Badge>
    );
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            Erreur lors du chargement des mouvements: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Entrées</p>
              <p className="text-2xl font-bold text-green-600">{stats.entrees}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sorties</p>
              <p className="text-2xl font-bold text-red-600">{stats.sorties}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ajustements</p>
              <p className="text-2xl font-bold text-orange-600">{stats.ajustements}</p>
            </div>
            <ArrowUpDown className="h-8 w-8 text-orange-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transferts</p>
              <p className="text-2xl font-bold text-blue-600">{stats.transferts}</p>
            </div>
            <ArrowRightLeft className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Retours</p>
              <p className="text-2xl font-bold text-purple-600">{stats.retours}</p>
            </div>
            <RotateCcw className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Journal des Mouvements</CardTitle>
          <CardDescription>Historique complet de tous les mouvements de stock</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher produit, lot, motif, référence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Type mouvement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                <SelectItem value="entree">Entrée</SelectItem>
                <SelectItem value="sortie">Sortie</SelectItem>
                <SelectItem value="transfert">Transfert</SelectItem>
                <SelectItem value="ajustement">Ajustement</SelectItem>
                <SelectItem value="retour">Retour</SelectItem>
                <SelectItem value="destruction">Destruction</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Du
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Au
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </div>

          {/* Tableau des mouvements */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Chargement des mouvements...</p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Heure</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Lot</TableHead>
                      <TableHead>Quantité Avant</TableHead>
                      <TableHead>Mouvement</TableHead>
                      <TableHead>Quantité Après</TableHead>
                      <TableHead>Motif</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMovements.map((movement: any) => (
                      <TableRow key={movement.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(movement.date_mouvement), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(movement.type_mouvement)}
                            {getTypeBadge(movement.type_mouvement)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {movement.produit?.libelle_produit || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{movement.lot?.numero_lot || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>{movement.quantite_avant || 0}</TableCell>
                        <TableCell>
                          <span className={
                            movement.quantite_mouvement > 0 ? 'text-green-600' : 'text-red-600'
                          }>
                            {movement.quantite_mouvement > 0 ? '+' : ''}{movement.quantite_mouvement || 0}
                          </span>
                        </TableCell>
                        <TableCell>{movement.quantite_apres || 0}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {movement.motif || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewDetails(movement)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(movement)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer le mouvement</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action va supprimer le mouvement et restaurer l'état antérieur du stock.
                                    Cette action ne peut pas être annulée.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(movement.id)}
                                    disabled={isDeleting}
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Affichage de {page * pageSize + 1} à {Math.min((page + 1) * pageSize, filteredMovements.length)} sur {filteredMovements.length} mouvements
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={(page + 1) * pageSize >= filteredMovements.length}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {!isLoading && filteredMovements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun mouvement trouvé pour les critères sélectionnés
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal détails du mouvement */}
      <Drawer open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Détails du Mouvement</DrawerTitle>
            <DrawerDescription>
              Informations complètes sur ce mouvement de stock
            </DrawerDescription>
          </DrawerHeader>
          
          {selectedMovement && (
            <div className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date/Heure</Label>
                  <p className="text-sm font-mono">
                    {format(new Date(selectedMovement.date_mouvement), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type de mouvement</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeIcon(selectedMovement.type_mouvement)}
                    {getTypeBadge(selectedMovement.type_mouvement)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Produit</Label>
                  <p className="text-sm">{selectedMovement.produit?.libelle_produit || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Lot</Label>
                  <Badge variant="outline">{selectedMovement.lot?.numero_lot || 'N/A'}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Quantité avant</Label>
                  <p className="text-sm">{selectedMovement.quantite_avant || 0}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Quantité mouvement</Label>
                  <p className={`text-sm ${selectedMovement.quantite_mouvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedMovement.quantite_mouvement > 0 ? '+' : ''}{selectedMovement.quantite_mouvement || 0}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Quantité après</Label>
                  <p className="text-sm">{selectedMovement.quantite_apres || 0}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Référence</Label>
                  <p className="text-sm">{selectedMovement.reference_document || 'N/A'}</p>
                </div>
              </div>
              
              {selectedMovement.motif && (
                <div>
                  <Label className="text-sm font-medium">Motif</Label>
                  <p className="text-sm">{selectedMovement.motif}</p>
                </div>
              )}
              
              {selectedMovement.metadata && Object.keys(selectedMovement.metadata).length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Métadonnées</Label>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(selectedMovement.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Fermer</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Modal d'édition */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Mouvement</DialogTitle>
            <DialogDescription>
              Modifiez les détails de ce mouvement de stock
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="quantite">Quantité mouvement</Label>
              <Input
                id="quantite"
                type="number"
                value={editData.quantite_mouvement || ''}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  quantite_mouvement: parseInt(e.target.value) || 0
                }))}
              />
            </div>

            <div>
              <Label htmlFor="motif">Motif</Label>
              <Textarea
                id="motif"
                value={editData.motif || ''}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  motif: e.target.value
                }))}
                placeholder="Motif du mouvement..."
              />
            </div>

            <div>
              <Label htmlFor="reference">Référence</Label>
              <Input
                id="reference"
                value={editData.reference_document || ''}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  reference_document: e.target.value
                }))}
                placeholder="Référence du mouvement..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating}>
              {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockMovementJournal;