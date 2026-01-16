import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, ChevronLeft, ChevronRight, Loader2, Pencil, Trash2, Download, RefreshCw } from 'lucide-react';
import { exportCatalogueGlobalListes } from '@/utils/catalogueGlobalExportUtils';
import { toast } from 'sonner';
import GlobalProductEditDialog from './GlobalProductEditDialog';
import GlobalCatalogCategoryUpdate from './GlobalCatalogCategoryUpdate';

export interface GlobalProduct {
  id: string;
  code_cip: string;
  libelle_produit: string;
  ancien_code_cip: string | null;
  prix_achat_reference: number | null;
  prix_vente_reference: number | null;
  prix_achat_reference_pnr: number | null;
  prix_vente_reference_pnr: number | null;
  tva: boolean;
  libelle_classe_therapeutique: string | null;
  libelle_famille: string | null;
  libelle_forme: string | null;
  libelle_laboratoire: string | null;
  libelle_rayon: string | null;
  libelle_dci: string | null;
  libelle_categorie_tarification: string | null;
  libelle_statut: string | null;
}

const GlobalCatalogTable = () => {
  const [products, setProducts] = useState<GlobalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [editingProduct, setEditingProduct] = useState<GlobalProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<GlobalProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showCategoryUpdate, setShowCategoryUpdate] = useState(false);

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteMode, setBulkDeleteMode] = useState<'selected' | 'all' | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Reset selection on page/search change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, pageSize, debouncedSearch]);

  const isAllSelected = products.length > 0 && products.every(p => selectedIds.has(p.id));
  const isSomeSelected = products.some(p => selectedIds.has(p.id));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      if (bulkDeleteMode === 'all') {
        // Delete ALL products in batches of 1000
        let deleted = 0;
        while (true) {
          const { data, error } = await supabase
            .from('catalogue_global_produits')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .order('id')
            .select('id')
            .limit(1000);
          
          if (error) throw error;
          if (!data || data.length === 0) break;
          deleted += data.length;
        }
        toast.success(`${deleted.toLocaleString()} produits supprimés du catalogue`);
      } else {
        // Delete selected products in batches of 100
        const ids = Array.from(selectedIds);
        const batchSize = 100;
        let deleted = 0;
        
        for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i, i + batchSize);
          const { error } = await supabase
            .from('catalogue_global_produits')
            .delete()
            .in('id', batch);
          
          if (error) throw error;
          deleted += batch.length;
        }
        toast.success(`${deleted} produit(s) supprimé(s)`);
      }
      
      setSelectedIds(new Set());
      fetchProducts();
    } catch (error) {
      console.error('Erreur suppression en masse:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteMode(null);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('catalogue_global_produits')
        .select(
          'id, code_cip, libelle_produit, ancien_code_cip, prix_achat_reference, prix_vente_reference, prix_achat_reference_pnr, prix_vente_reference_pnr, tva, libelle_classe_therapeutique, libelle_famille, libelle_forme, libelle_laboratoire, libelle_rayon, libelle_dci, libelle_categorie_tarification, libelle_statut',
          { count: 'exact' }
        )
        .order('libelle_produit', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (debouncedSearch) {
        query = query.or(`libelle_produit.ilike.%${debouncedSearch}%,code_cip.ilike.%${debouncedSearch}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      setProducts((data as GlobalProduct[]) || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleEditSuccess = () => {
    fetchProducts();
    setEditingProduct(null);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('catalogue_global_produits')
        .delete()
        .eq('id', deletingProduct.id);

      if (error) throw error;

      toast.success(`Produit "${deletingProduct.libelle_produit}" supprimé`);
      fetchProducts();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
      setDeletingProduct(null);
    }
  };

  const handleExportListes = async () => {
    setIsExporting(true);
    try {
      toast.info("Génération du fichier Excel...");
      await exportCatalogueGlobalListes();
      toast.success("Fichier téléchargé avec succès !");
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalCount);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Produits du Catalogue Global</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCategoryUpdate(true)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Màj Catégories
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportListes}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Exporter les listes
              </Button>
              <Badge variant="secondary">{totalCount.toLocaleString()} produits</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou CIP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Afficher</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk actions bar */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size > 0 
                    ? `${selectedIds.size} produit(s) sélectionné(s)`
                    : 'Cochez pour sélectionner'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDeleteMode('selected')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer la sélection ({selectedIds.size})
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:border-destructive"
                  onClick={() => setBulkDeleteMode('all')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Tout supprimer ({totalCount.toLocaleString()})
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {debouncedSearch ? 'Aucun produit trouvé pour cette recherche' : 'Aucun produit dans le catalogue'}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Sélectionner tout"
                          className={isSomeSelected && !isAllSelected ? 'opacity-50' : ''}
                        />
                      </TableHead>
                      <TableHead>Code CIP</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Forme</TableHead>
                      <TableHead>Famille</TableHead>
                      <TableHead>Laboratoire</TableHead>
                      <TableHead>TVA</TableHead>
                      <TableHead className="text-right">Prix Réf.</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className={selectedIds.has(product.id) ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(product.id)}
                            onCheckedChange={() => toggleSelect(product.id)}
                            aria-label={`Sélectionner ${product.libelle_produit}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.code_cip}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {product.libelle_produit}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.libelle_forme || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.libelle_famille || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.libelle_laboratoire || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.tva ? 'default' : 'secondary'}>
                            {product.tva ? 'Oui' : 'Non'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {product.prix_vente_reference?.toLocaleString() || 0} FCFA
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingProduct(product)}
                              title="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingProduct(product)}
                              title="Supprimer"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {startItem} - {endItem} sur {totalCount.toLocaleString()} produits
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} sur {totalPages}
                  </span>
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
                    disabled={page >= totalPages - 1}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {editingProduct && (
        <GlobalProductEditDialog
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Single product delete dialog */}
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le produit{' '}
              <strong>"{deletingProduct?.libelle_produit}"</strong>{' '}
              (CIP: {deletingProduct?.code_cip}) ?
              <br /><br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={!!bulkDeleteMode} onOpenChange={(open) => !open && setBulkDeleteMode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              ⚠️ Suppression en masse
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {bulkDeleteMode === 'all' ? (
                  <>
                    <p>Vous êtes sur le point de supprimer <strong className="text-foreground">TOUS les {totalCount.toLocaleString()} produits</strong> du catalogue global.</p>
                    <p className="text-destructive font-semibold">⚠️ Cette action est IRRÉVERSIBLE !</p>
                  </>
                ) : (
                  <>
                    <p>Vous êtes sur le point de supprimer <strong className="text-foreground">{selectedIds.size} produit(s)</strong> sélectionné(s).</p>
                    <p className="text-destructive">Cette action est irréversible.</p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {bulkDeleteMode === 'all' 
                ? `Supprimer tout (${totalCount.toLocaleString()})`
                : `Supprimer (${selectedIds.size})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category update dialog */}
      <GlobalCatalogCategoryUpdate
        open={showCategoryUpdate}
        onOpenChange={setShowCategoryUpdate}
        onSuccess={fetchProducts}
      />
    </>
  );
};

export default GlobalCatalogTable;
