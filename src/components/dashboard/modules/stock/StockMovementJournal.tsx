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
import StockMovementDetails from './StockMovementDetails';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import ExportButton from '@/components/ui/export-button';
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
  ChevronRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLotMovements } from '@/hooks/useLotMovements';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  
  // Récupérer les hooks au niveau du composant
  const lotMovementsHook = useLotMovements();
  const { data: movementsData } = lotMovementsHook.useLotMovementsQuery();
  
  // Fonction pour gérer l'exportation des données
  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    const dataToExport = movementsData || [];
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `journal-mouvements-${timestamp}`;
    
    try {
      switch (format) {
        case 'csv':
          exportToCSV(dataToExport, filename);
          break;
        case 'xlsx':
          exportToExcel(dataToExport, filename);
          break;
        case 'pdf':
          exportToPDF(dataToExport, filename);
          break;
      }
      
      toast(`Les données ont été exportées au format ${format.toUpperCase()}.`);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast.error("Une erreur est survenue lors de l'exportation des données.");
    }
  };
  
  // Fonction pour exporter au format CSV
  const exportToCSV = (data: any[], filename: string) => {
    const headers = [
      'ID', 'Date', 'Type', 'Produit', 'Lot', 'Quantité', 
      'Origine', 'Destination', 'Utilisateur', 'Statut'
    ];
    
    const rows = data.map(item => [
      item.id,
      new Date(item.date).toLocaleDateString('fr-FR'),
      item.type,
      item.produit,
      item.lot,
      item.quantite,
      item.origine || 'N/A',
      item.destination || 'N/A',
      item.utilisateur,
      item.statut
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
  };
  
  // Fonction pour exporter au format Excel
  const exportToExcel = (data: any[], filename: string) => {
    const worksheetData = data.map(item => ({
      'ID': item.id,
      'Date': new Date(item.date).toLocaleDateString('fr-FR'),
      'Type': item.type,
      'Produit': item.produit,
      'Lot': item.lot,
      'Quantité': item.quantite,
      'Origine': item.origine || 'N/A',
      'Destination': item.destination || 'N/A',
      'Utilisateur': item.utilisateur,
      'Statut': item.statut
    }));
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // Ajuster les largeurs de colonnes
    const columnWidths = [
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
      { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 15 }
    ];
    worksheet['!cols'] = columnWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mouvements');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };
  
  // Fonction pour exporter au format PDF
  const exportToPDF = (data: any[], filename: string) => {
    const doc = new jsPDF('landscape');
    
    // Titre
    doc.setFontSize(16);
    doc.text('Journal des Mouvements de Stock', 14, 15);
    
    // Date d'export
    doc.setFontSize(10);
    doc.text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);
    
    // Tableau
    const tableData = data.map(item => [
      item.id,
      new Date(item.date).toLocaleDateString('fr-FR'),
      item.type,
      item.produit,
      item.lot,
      item.quantite,
      item.origine || 'N/A',
      item.destination || 'N/A',
      item.statut
    ]);
    
    autoTable(doc, {
      startY: 28,
      head: [['ID', 'Date', 'Type', 'Produit', 'Lot', 'Qté', 'Origine', 'Destination', 'Statut']],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    doc.save(`${filename}.pdf`);
  };

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
  const filters = useMemo(() => {
    const filterObj: any = {};
    
    if (selectedType !== 'tous') {
      filterObj.type_mouvement = selectedType;
    }
    
    if (dateFrom) {
      filterObj.date_debut = format(dateFrom, 'yyyy-MM-dd');
    }
    
    if (dateTo) {
      filterObj.date_fin = format(dateTo, 'yyyy-MM-dd');
    }
    
    return filterObj;
  }, [selectedType, dateFrom, dateTo]);

  // Query pour récupérer les mouvements avec gestion d'erreurs améliorée
  const { data: movements = [], isLoading, error, refetch } = useLotMovementsQuery(filters);

  // Filtrage côté client pour la recherche avec gestion d'erreurs
  const filteredMovements = useMemo(() => {
    try {
      if (!movements || !Array.isArray(movements)) return [];
      
      let filtered = movements;
      
      // Recherche plein-texte côté client
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter((movement: any) => {
          try {
            return (
              movement.produit?.libelle_produit?.toLowerCase().includes(search) ||
              movement.lot?.numero_lot?.toLowerCase().includes(search) ||
              movement.motif?.toLowerCase().includes(search) ||
              movement.reference_document?.toLowerCase().includes(search) ||
              JSON.stringify(movement.metadata || {}).toLowerCase().includes(search)
            );
          } catch (err) {
            console.warn('Erreur lors du filtrage d\'un mouvement:', err);
            return false;
          }
        });
      }
      
      return filtered;
    } catch (err) {
      console.error('Erreur lors du filtrage des mouvements:', err);
      return [];
    }
  }, [movements, searchTerm]);

  // Pagination côté client
  const paginatedMovements = useMemo(() => {
    const startIndex = page * pageSize;
    return filteredMovements.slice(startIndex, startIndex + pageSize);
  }, [filteredMovements, page, pageSize]);

  // Calcul des statistiques
  const stats = useMemo(() => {
    if (!movements) return { total: 0, entrees: 0, sorties: 0, ajustements: 0, transferts: 0, retours: 0, destructions: 0 };
    
    // Utiliser tous les mouvements filtrés pour les statistiques, pas seulement ceux d'aujourd'hui
    return {
      total: filteredMovements.length,
      entrees: filteredMovements.filter((m: any) => m.type_mouvement === 'entree').length,
      sorties: filteredMovements.filter((m: any) => m.type_mouvement === 'sortie').length,
      ajustements: filteredMovements.filter((m: any) => m.type_mouvement === 'ajustement').length,
      transferts: filteredMovements.filter((m: any) => m.type_mouvement === 'transfert').length,
      retours: filteredMovements.filter((m: any) => m.type_mouvement === 'retour').length,
      destructions: filteredMovements.filter((m: any) => m.type_mouvement === 'destruction').length
    };
  }, [filteredMovements]);

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
      reference_document: movement.reference_document || movement.id || ''
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
          <div className="text-center space-y-4">
            <div className="text-destructive">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">Erreur lors du chargement des mouvements</p>
              <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
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

              <ExportButton onExport={handleExport} />
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

      {/* Composant de détails avec animation */}
      <StockMovementDetails 
        movement={selectedMovement} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
      />

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
                value={editData.reference_document || selectedMovement?.reference_document || selectedMovement?.id || ''}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  reference_document: e.target.value
                }))}
                placeholder="Référence du mouvement..."
                className="font-mono text-sm"
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