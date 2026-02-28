/**
 * Recherche de produits dans le catalogue (table produits) pour les proformas
 * Pas de vérification de stock - recherche serveur-side avec debounce
 */
import React, { useState, useCallback } from 'react';
import { Check, ChevronsUpDown, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

export interface ProformaProduct {
  id: string;
  libelle_produit: string;
  code_cip: string | null;
  ancien_code_cip: string | null;
  prix_vente_ht: number;
  prix_vente_ttc: number;
  taux_tva: number;
}

interface ProformaProductSearchProps {
  onProductSelect: (product: ProformaProduct) => void;
}

const ProformaProductSearch: React.FC<ProformaProductSearchProps> = ({ onProductSelect }) => {
  const { tenantId } = useTenant();
  const { formatAmount } = useCurrencyFormatting();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['proforma-products-search', tenantId, debouncedSearch],
    queryFn: async () => {
      if (!tenantId || debouncedSearch.length < 2) return [];

      const { data, error } = await supabase
        .from('produits')
        .select('id, libelle_produit, code_cip, ancien_code_cip, prix_vente_ht, prix_vente_ttc, taux_tva')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .or(
          `libelle_produit.ilike.%${debouncedSearch}%,code_cip.ilike.%${debouncedSearch}%,ancien_code_cip.ilike.%${debouncedSearch}%`
        )
        .order('libelle_produit', { ascending: true })
        .limit(50);

      if (error) throw error;
      return (data || []).map(p => ({
        ...p,
        prix_vente_ht: Number(p.prix_vente_ht) || 0,
        prix_vente_ttc: Number(p.prix_vente_ttc) || 0,
        taux_tva: Number(p.taux_tva) || 0,
      })) as ProformaProduct[];
    },
    enabled: !!tenantId && debouncedSearch.length >= 2,
    staleTime: 30000,
  });

  const handleSelect = useCallback((product: ProformaProduct) => {
    onProductSelect(product);
    setOpen(false);
    setSearchTerm('');
  }, [onProductSelect]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Rechercher un produit...</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Nom, code CIP..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading && debouncedSearch.length >= 2 && products.length === 0 && (
              <CommandEmpty>Aucun produit trouvé</CommandEmpty>
            )}
            {!isLoading && debouncedSearch.length < 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Tapez au moins 2 caractères...
              </div>
            )}
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={() => handleSelect(product)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-sm">{product.libelle_produit}</span>
                    <span className="text-xs text-muted-foreground">
                      {product.code_cip && `CIP: ${product.code_cip}`}
                      {product.ancien_code_cip && ` | Anc: ${product.ancien_code_cip}`}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {formatAmount(product.prix_vente_ttc)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProformaProductSearch;
