import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useDebounce } from '@/hooks/useDebounce';

interface UGReception {
  id: string;
  numero_reception: string | null;
  date_reception: string | null;
  notes: string | null;
  statut: string | null;
  created_at: string;
  fournisseur: { nom: string } | null;
  lignes_reception_fournisseur: Array<{
    id: string;
    quantite_recue: number;
    prix_achat_reel: number;
    prix_vente_ttc: number;
    numero_lot: string | null;
    date_expiration: string | null;
    produit: { libelle_produit: string; code_cip: string | null } | null;
  }>;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const FreeUnitsHistory: React.FC = () => {
  const { tenantId } = useTenant();
  const { formatAmount } = useCurrencyFormatting();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [data, setData] = useState<UGReception[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState<'date_reception' | 'numero_reception'>('date_reception');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      let query = (supabase
        .from('receptions_fournisseurs') as any)
        .select(`
          id, numero_reception, date_reception, notes, statut, created_at,
          fournisseur:fournisseurs(nom),
          lignes_reception_fournisseur(id, quantite_recue, prix_achat_reel, prix_vente_ttc, numero_lot, date_expiration,
            produit:produits(libelle_produit, code_cip)
          )
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .ilike('notes', '%UG%');

      if (debouncedSearch.trim()) {
        const term = `%${debouncedSearch.trim()}%`;
        query = query.or(`numero_reception.ilike.${term},notes.ilike.${term}`);
      }

      query = query.order(sortField, { ascending: sortDir === 'asc' });
      query = query.range(from, to);

      const { data: rows, count, error } = await query;
      if (error) throw error;

      setData((rows as unknown as UGReception[]) || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('FreeUnitsHistory fetch error:', err);
      setData([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, debouncedSearch, page, pageSize, sortField, sortDir]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Reset page on search change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const toggleSort = (field: 'date_reception' | 'numero_reception') => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(0);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />;
  };

  const extractSource = (notes: string | null) => {
    if (!notes) return '—';
    const match = notes.match(/Source:\s*([^—]+)/);
    return match ? match[1].trim() : 'UG';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des Unités Gratuites
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search & page size */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro ou notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(0); }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(s => (
                <SelectItem key={s} value={String(s)}>{s} / page</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Chargement...</span>
          </div>
        ) : data.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Aucun historique d'UG trouvé.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('date_reception')}>
                    Date <SortIcon field="date_reception" />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('numero_reception')}>
                    N° Réception <SortIcon field="numero_reception" />
                  </TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-center">Lignes</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map(row => (
                  <React.Fragment key={row.id}>
                    <TableRow className="cursor-pointer" onClick={() => setExpandedId(prev => prev === row.id ? null : row.id)}>
                      <TableCell>{row.date_reception ? new Date(row.date_reception).toLocaleDateString('fr-FR') : '—'}</TableCell>
                      <TableCell className="font-medium">{row.numero_reception || row.id.slice(-6)}</TableCell>
                      <TableCell>{row.fournisseur?.nom || '—'}</TableCell>
                      <TableCell><Badge variant="secondary">{extractSource(row.notes)}</Badge></TableCell>
                      <TableCell className="text-center">{row.lignes_reception_fournisseur?.length || 0}</TableCell>
                      <TableCell>
                        <Badge variant={row.statut === 'Validé' ? 'default' : 'outline'}>{row.statut || '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        {expandedId === row.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </TableCell>
                    </TableRow>
                    {expandedId === row.id && row.reception_lignes?.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <div className="bg-muted/30 p-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Produit</TableHead>
                                  <TableHead>Code CIP</TableHead>
                                  <TableHead>Qté</TableHead>
                                  <TableHead>N° Lot</TableHead>
                                  <TableHead>Expiration</TableHead>
                                  <TableHead className="text-right">Prix Achat</TableHead>
                                  <TableHead className="text-right">Prix TTC</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {row.reception_lignes.map(l => (
                                  <TableRow key={l.id}>
                                    <TableCell>{l.produit?.libelle_produit || '—'}</TableCell>
                                    <TableCell><Badge variant="outline">{l.produit?.code_cip || '—'}</Badge></TableCell>
                                    <TableCell>{l.quantite_recue}</TableCell>
                                    <TableCell>{l.numero_lot || '—'}</TableCell>
                                    <TableCell>{l.date_expiration ? new Date(l.date_expiration).toLocaleDateString('fr-FR') : '—'}</TableCell>
                                    <TableCell className="text-right">{formatAmount(l.prix_achat_reel)}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatAmount(l.prix_vente_ttc)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {totalCount} résultat{totalCount > 1 ? 's' : ''} — Page {page + 1} / {totalPages || 1}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  Précédent
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  Suivant
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FreeUnitsHistory;
