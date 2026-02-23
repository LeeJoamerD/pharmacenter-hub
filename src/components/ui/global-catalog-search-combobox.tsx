import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedValue } from "@/hooks/use-debounce";

export interface GlobalCatalogProduct {
  id: string;
  code_cip: string;
  ancien_code_cip: string | null;
  libelle_produit: string;
  libelle_forme: string | null;
  libelle_famille: string | null;
  libelle_rayon: string | null;
  libelle_dci: string | null;
  libelle_classe_therapeutique: string | null;
  libelle_laboratoire: string | null;
  libelle_categorie_tarification: string | null;
  tva: boolean | null;
  prix_achat_reference: number | null;
  prix_vente_reference: number | null;
  prix_achat_reference_pnr: number | null;
  prix_vente_reference_pnr: number | null;
}

interface GlobalCatalogSearchComboboxProps {
  onSelect: (product: GlobalCatalogProduct) => void;
  disabled?: boolean;
  className?: string;
}

export function GlobalCatalogSearchCombobox({
  onSelect,
  disabled = false,
  className,
}: GlobalCatalogSearchComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [options, setOptions] = React.useState<GlobalCatalogProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState("");

  const debouncedSearch = useDebouncedValue(search, 400);

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from("catalogue_global_produits")
          .select("id, code_cip, ancien_code_cip, libelle_produit, libelle_forme, libelle_famille, libelle_rayon, libelle_dci, libelle_classe_therapeutique, libelle_laboratoire, libelle_categorie_tarification, tva, prix_achat_reference, prix_vente_reference, prix_achat_reference_pnr, prix_vente_reference_pnr")
          .order("libelle_produit")
          .limit(50);

        if (debouncedSearch.trim()) {
          const term = `%${debouncedSearch.trim()}%`;
          query = query.or(
            `libelle_produit.ilike.${term},code_cip.ilike.${term},ancien_code_cip.ilike.${term}`
          );
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!cancelled) {
          setOptions((data as GlobalCatalogProduct[]) || []);
        }
      } catch (err) {
        console.error("GlobalCatalogSearchCombobox fetch error:", err);
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchProducts();
    return () => { cancelled = true; };
  }, [debouncedSearch, open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selectedLabel && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selectedLabel || "Rechercher par nom ou code CIP..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher par nom ou code CIP..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Chargement...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>Aucun produit trouvé dans le catalogue global.</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.id}
                      onSelect={() => {
                        setSelectedLabel(
                          option.code_cip
                            ? `${option.libelle_produit} — ${option.code_cip}`
                            : option.libelle_produit
                        );
                        onSelect(option);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <span className="truncate">
                        <span className="font-medium">{option.libelle_produit}</span>
                        {option.code_cip && (
                          <span className="text-muted-foreground"> — {option.code_cip}</span>
                        )}
                        {option.ancien_code_cip && (
                          <span className="text-muted-foreground text-xs"> (anc. {option.ancien_code_cip})</span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
