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
import { Search, ChevronLeft, ChevronRight, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import GlobalProductEditDialog from './GlobalProductEditDialog';

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

  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalCount);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Produits du Catalogue Global</span>
            <Badge variant="secondary">{totalCount.toLocaleString()} produits</Badge>
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
                      <TableRow key={product.id}>
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
    </>
  );
};

export default GlobalCatalogTable;
