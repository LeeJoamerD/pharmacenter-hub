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

interface ProductOption {
  id: string;
  libelle_produit: string;
  code_cip: string | null;
}

interface ProductSearchComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  tenantId: string | null;
  disabled?: boolean;
  className?: string;
}

export function ProductSearchCombobox({
  value,
  onValueChange,
  tenantId,
  disabled = false,
  className,
}: ProductSearchComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [options, setOptions] = React.useState<ProductOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState("");

  const debouncedSearch = useDebouncedValue(search, 400);

  // Fetch products server-side
  React.useEffect(() => {
    if (!tenantId || !open) return;

    let cancelled = false;
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from("produits_with_stock")
          .select("id, libelle_produit, code_cip")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .order("libelle_produit")
          .limit(50);

        if (debouncedSearch.trim()) {
          const term = `%${debouncedSearch.trim()}%`;
          query = query.or(`libelle_produit.ilike.${term},code_cip.ilike.${term}`);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!cancelled) {
          setOptions((data as ProductOption[]) || []);
        }
      } catch (err) {
        console.error("ProductSearchCombobox fetch error:", err);
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchProducts();
    return () => { cancelled = true; };
  }, [tenantId, debouncedSearch, open]);

  // Resolve label for the selected value
  React.useEffect(() => {
    if (!value || !tenantId) {
      setSelectedLabel("");
      return;
    }
    // Check if already in options
    const found = options.find((o) => o.id === value);
    if (found) {
      setSelectedLabel(
        found.code_cip
          ? `${found.libelle_produit} — ${found.code_cip}`
          : found.libelle_produit
      );
      return;
    }
    // Fetch the single product
    const fetchSelected = async () => {
      const { data } = await supabase
        .from("produits_with_stock")
        .select("id, libelle_produit, code_cip")
        .eq("id", value)
        .single();
      if (data) {
        setSelectedLabel(
          data.code_cip
            ? `${data.libelle_produit} — ${data.code_cip}`
            : data.libelle_produit
        );
      }
    };
    fetchSelected();
  }, [value, tenantId, options]);

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
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selectedLabel || "Sélectionner un produit"}
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
                <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.id}
                      onSelect={() => {
                        onValueChange(option.id === value ? "" : option.id);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">
                        {option.code_cip
                          ? `${option.libelle_produit} — ${option.code_cip}`
                          : option.libelle_produit}
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
