import React, { useState } from 'react';
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
import { useMovementsPaginated } from '@/hooks/useMovementsPaginated';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

const StockMovementJournal = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('tous');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const { tenantId } = useTenant();

  const { 
    updateLotMovement, 
    deleteLotMovement,
    isUpdating,
    isDeleting,
    getMovementTypeLabel,
  } = useLotMovements();

  // Server-side paginated query
  const {
    movements,
    stats,
    count,
    totalPages,
    isLoading,
    isFetching,
    error,
    refetch,
    page,
    setPage,
    pageSize,
  } = useMovementsPaginated({
    search: searchTerm,
    type_mouvement: selectedType !== 'tous' ? selectedType : null,
    date_debut: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : null,
    date_fin: dateTo ? format(dateTo, "yyyy-MM-dd'T'23:59:59") : null,
  });

  // Export all data (separate unlimited query)
  const handleExport = async (fmt: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const { data: result, error: exportError } = await supabase.rpc('search_movements_paginated', {
        p_tenant_id: tenantId!,
        p_search: searchTerm || '',
        p_type_mouvement: selectedType !== 'tous' ? selectedType : null,
        p_date_debut: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : null,
        p_date_fin: dateTo ? format(dateTo, "yyyy-MM-dd'T'23:59:59") : null,
        p_sort_by: 'date_mouvement',
        p_sort_order: 'desc',
        p_page_size: 100000,
        p_page: 1,
      });

      if (exportError) throw exportError;
      const allMovements = (result as any)?.movements || [];

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `journal-mouvements-${timestamp}`;

      switch (fmt) {
        case 'csv':
          exportToCSV(allMovements, filename);
          break;
        case 'xlsx':
          exportToExcel(allMovements, filename);
          break;
        case 'pdf':
          exportToPDF(allMovements, filename);
          break;
      }
      toast(`Export ${fmt.toUpperCase()} généré avec succès.`);
    } catch (err) {
      console.error("Erreur lors de l'export:", err);
      toast.error("Erreur lors de l'exportation des données.");
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    const headers = ['Date/Heure', 'Type', 'Produit', 'Lot', 'Qté Avant', 'Mouvement', 'Qté Après', 'Motif', 'Référence'];
    const csvContent = [
      headers.join(','),
      ...data.map((m: any) => [
        format(new Date(m.date_mouvement), 'dd/MM/yyyy HH:mm'),
        getMovementTypeLabel(m.type_mouvement),
        `"${m.produit?.libelle_produit || ''}"`,
        m.lot?.numero_lot || '',
        m.quantite_avant || 0,
        m.quantite_mouvement || 0,
        m.quantite_apres || 0,
        `"${m.motif || ''}"`,
        m.reference_document || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportToExcel = (data: any[], filename: string) => {
    const worksheetData = data.map((m: any) => ({
      'Date': format(new Date(m.date_mouvement), 'dd/MM/yyyy HH:mm'),
      'Type': getMovementTypeLabel(m.type_mouvement),
      'Produit': m.produit?.libelle_produit || '',
      'Lot': m.lot?.numero_lot || '',
      'Qté Avant': m.quantite_avant || 0,
      'Mouvement': m.quantite_mouvement || 0,
      'Qté Après': m.quantite_apres || 0,
      'Motif': m.motif || '',
      'Référence': m.reference_document || ''
    }));
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mouvements');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const exportToPDF = (data: any[], filename: string) => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('Journal des Mouvements de Stock', 14, 15);
    doc.setFontSize(10);
    doc.text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['Date', 'Type', 'Produit', 'Lot', 'Qté Avant', 'Mvt', 'Qté Après', 'Motif']],
      body: data.map((m: any) => [
        format(new Date(m.date_mouvement), 'dd/MM/yyyy HH:mm'),
        getMovementTypeLabel(m.type_mouvement),
        m.produit?.libelle_produit || '',
        m.lot?.numero_lot || '',
        m.quantite_avant || 0,
        m.quantite_mouvement || 0,
        m.quantite_apres || 0,
        m.motif || ''
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    doc.save(`${filename}.pdf`);
  };

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
      refetch();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleDelete = async (movementId: string) => {
    try {
      await deleteLotMovement(movementId);
      refetch();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'entree': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'sortie': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'transfert': return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      case 'ajustement': return <ArrowUpDown className="h-4 w-4 text-orange-600" />;
      case 'retour': return <RotateCcw className="h-4 w-4 text-purple-600" />;
      case 'destruction': return <FileX className="h-4 w-4 text-gray-600" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      entree: 'bg-green-100 text-green-800 border-green-200',
      sortie: 'bg-red-100 text-red-800 border-red-200',
      transfert: 'bg-blue-100 text-blue-800 border-blue-200',
      ajustement: 'bg-orange-100 text-orange-800 border-orange-200',
      retour: 'bg-purple-100 text-purple-800 border-purple-200',
      destruction: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
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
              <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
            </div>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
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
      {/* Stats cards */}
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

      {/* Filters */}
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
                    {dateFrom ? format(dateFrom, 'dd/MM/yy') : 'Du'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'dd/MM/yy') : 'Au'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>
              <ExportButton onExport={handleExport} />
            </div>
          </div>

          {/* Table */}
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
                    {movements.map((movement) => (
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
                            movement.type_mouvement === 'sortie' || movement.type_mouvement === 'destruction' 
                              ? 'text-red-600' : 'text-green-600'
                          }>
                            {movement.type_mouvement === 'sortie' || movement.type_mouvement === 'destruction' ? '-' : '+'}
                            {Math.abs(movement.quantite_mouvement || 0)}
                          </span>
                        </TableCell>
                        <TableCell>{movement.quantite_apres || 0}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{movement.motif || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(movement)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(movement)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer le mouvement</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action va supprimer le mouvement et restaurer l'état antérieur du stock.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(movement.id)} disabled={isDeleting}>
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

              {/* Server-side pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {count > 0 ? (
                    <>Affichage de {(page - 1) * pageSize + 1} à {Math.min(page * pageSize, count)} sur {count} mouvements</>
                  ) : (
                    'Aucun mouvement'
                  )}
                  {isFetching && !isLoading && <span className="ml-2 text-primary">(mise à jour...)</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {!isLoading && movements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun mouvement trouvé pour les critères sélectionnés
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details */}
      <StockMovementDetails movement={selectedMovement} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />

      {/* Edit modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Mouvement</DialogTitle>
            <DialogDescription>Modifiez les détails de ce mouvement de stock</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantite">Quantité mouvement</Label>
              <Input id="quantite" type="number" value={editData.quantite_mouvement || ''} onChange={(e) => setEditData((prev: any) => ({ ...prev, quantite_mouvement: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label htmlFor="motif">Motif</Label>
              <Textarea id="motif" value={editData.motif || ''} onChange={(e) => setEditData((prev: any) => ({ ...prev, motif: e.target.value }))} placeholder="Motif du mouvement..." />
            </div>
            <div>
              <Label htmlFor="reference">Référence</Label>
              <Input id="reference" value={editData.reference_document || ''} onChange={(e) => setEditData((prev: any) => ({ ...prev, reference_document: e.target.value }))} placeholder="Référence..." className="font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating}>{isUpdating ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockMovementJournal;
