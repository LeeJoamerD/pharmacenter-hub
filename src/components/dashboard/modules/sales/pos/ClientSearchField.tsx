/**
 * Composant de recherche client avec pagination optimisée
 * Limite 1000 résultats côté Supabase, affichage paginé par 50
 * @version 1.0.0 - Nouveau composant pour recherche client POS
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, Phone, Building2, User, ChevronDown, ChevronUp, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { CustomerType } from '@/types/pos';

interface ClientData {
  id: string;
  nom_complet: string;
  telephone: string | null;
  email: string | null;
  type_client: CustomerType;
  assureur_id: string | null;
  assureur_libelle?: string | null;
  taux_remise_automatique: number | null;
  taux_agent: number | null;
  taux_ayant_droit: number | null;
  limite_credit: number | null;
  peut_prendre_bon: boolean | null;
  taux_ticket_moderateur: number | null;
  caution: number | null;
  societe_id: string | null;
  personnel_id: string | null;
}

interface ClientSearchFieldProps {
  clientType: CustomerType;
  onClientSelect: (client: ClientData) => void;
  selectedClientId?: string;
}

const PAGE_SIZE = 50;
const MAX_RESULTS = 1000;

const ClientSearchField: React.FC<ClientSearchFieldProps> = ({
  clientType,
  onClientSelect,
  selectedClientId
}) => {
  const { tenantId } = useTenant();
  const { formatAmount } = useCurrencyFormatting();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer les résultats quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche avec debounce
  const searchClients = useCallback(async (term: string, page: number = 0, append: boolean = false) => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Build query
      let query = supabase
        .from('clients')
        .select(`
          id,
          nom_complet,
          telephone,
          email,
          type_client,
          assureur_id,
          taux_remise_automatique,
          taux_agent,
          taux_ayant_droit,
          limite_credit,
          peut_prendre_bon,
          taux_ticket_moderateur,
          caution,
          societe_id,
          personnel_id,
          assureurs:assureur_id(libelle_assureur)
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('statut', 'Actif')
        .eq('type_client', clientType)
        .order('nom_complet')
        .range(from, Math.min(to, MAX_RESULTS - 1));

      // Add search filter if term provided
      if (term.trim()) {
        query = query.or(`nom_complet.ilike.%${term}%,telephone.ilike.%${term}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const formattedData: ClientData[] = (data || []).map((client: any) => ({
        ...client,
        assureur_libelle: client.assureurs?.libelle_assureur || null
      }));

      if (append) {
        setClients(prev => [...prev, ...formattedData]);
      } else {
        setClients(formattedData);
      }

      const total = Math.min(count || 0, MAX_RESULTS);
      setTotalCount(total);
      setHasMore((page + 1) * PAGE_SIZE < total);
      setCurrentPage(page);
      setShowResults(true);
    } catch (error) {
      console.error('Erreur recherche clients:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, clientType]);

  // Debounced search on term change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchClients(searchTerm, 0, false);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, searchClients]);

  // Initial load when type changes
  useEffect(() => {
    setSearchTerm('');
    setClients([]);
    setCurrentPage(0);
    searchClients('', 0, false);
  }, [clientType]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      searchClients(searchTerm, currentPage + 1, true);
    }
  };

  const handleSelectClient = (client: ClientData) => {
    onClientSelect(client);
    setShowResults(false);
    setSearchTerm(client.nom_complet);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un client (nom ou téléphone)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowResults(true)}
          className="pl-10 pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Résultats de recherche */}
      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-hidden">
          <ScrollArea className="h-full max-h-[260px]">
            {clients.length === 0 && !loading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Aucun client trouvé
              </div>
            ) : (
              <div className="divide-y">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className={`w-full p-3 text-left hover:bg-accent transition-colors ${
                      selectedClientId === client.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{client.nom_complet}</span>
                          {(client.taux_remise_automatique ?? 0) > 0 && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              -{client.taux_remise_automatique}%
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {client.telephone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {client.telephone}
                            </span>
                          )}
                          {client.assureur_libelle && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {client.assureur_libelle}
                            </span>
                          )}
                        </div>

                        {/* Afficher caution si > 0 */}
                        {(client.caution ?? 0) > 0 && (
                          <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                            <Wallet className="h-3 w-3" />
                            Caution: {formatAmount(client.caution ?? 0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer avec pagination */}
          {clients.length > 0 && (
            <div className="border-t p-2 bg-muted/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{clients.length} / {totalCount} clients</span>
                {hasMore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="h-6 text-xs"
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <ChevronDown className="h-3 w-3 mr-1" />
                    )}
                    Charger plus
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientSearchField;
