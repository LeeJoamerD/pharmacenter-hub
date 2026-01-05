import React, { useState, useEffect } from 'react';
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
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface GlobalProduct {
  id: string;
  code_cip: string;
  libelle_produit: string;
  libelle_forme: string | null;
  libelle_famille: string | null;
  libelle_laboratoire: string | null;
  prix_vente_reference: number;
  is_active: boolean;
}

const GlobalCatalogTable = () => {
  const [products, setProducts] = useState<GlobalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('catalogue_global_produits')
        .select('id, code_cip, libelle_produit, libelle_forme, libelle_famille, libelle_laboratoire, prix_vente_reference, is_active', { count: 'exact' })
        .order('libelle_produit', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (search) {
        query = query.or(`libelle_produit.ilike.%${search}%,code_cip.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      setProducts(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Produits du Catalogue Global</span>
          <Badge variant="secondary">{totalCount} produits</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou CIP..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search ? 'Aucun produit trouvé pour cette recherche' : 'Aucun produit dans le catalogue'}
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
                    <TableHead className="text-right">Prix Réf.</TableHead>
                    <TableHead>Statut</TableHead>
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
                      <TableCell className="text-right">
                        {product.prix_vente_reference?.toLocaleString()} FCFA
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} sur {totalPages}
              </p>
              <div className="flex gap-2">
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
  );
};

export default GlobalCatalogTable;
