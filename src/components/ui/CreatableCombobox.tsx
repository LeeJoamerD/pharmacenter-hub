import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface CreatableComboboxOption {
  value: string;
  label: string;
}

interface CreatableComboboxProps {
  value?: string;
  options: CreatableComboboxOption[];
  onSelect: (option: CreatableComboboxOption) => void;
  onCreate?: (input: string) => Promise<CreatableComboboxOption>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  createLabel?: (input: string) => string;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
}

/**
 * Combobox shadcn avec recherche et création à la volée :
 * - tape une valeur existante => sélectionne
 * - tape une valeur inconnue  => option « + Ajouter "..." » qui appelle onCreate
 */
export const CreatableCombobox = ({
  value,
  options,
  onSelect,
  onCreate,
  placeholder = 'Sélectionner...',
  searchPlaceholder = 'Rechercher...',
  emptyText = 'Aucun résultat',
  createLabel = (v) => `+ Ajouter "${v}"`,
  disabled,
  className,
  loading,
}: CreatableComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const trimmed = search.trim();
  const exactMatch = options.some(
    (o) => o.label.toLowerCase() === trimmed.toLowerCase(),
  );
  const canCreate = Boolean(onCreate) && trimmed.length > 0 && !exactMatch;

  const handleCreate = async () => {
    if (!onCreate || !trimmed) return;
    try {
      setCreating(true);
      const created = await onCreate(trimmed);
      onSelect(created);
      setSearch('');
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected?.label || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {canCreate ? (
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={creating}
                      className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                    >
                      {creating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {createLabel(trimmed)}
                    </button>
                  ) : (
                    <span className="px-2 py-1.5 text-sm text-muted-foreground">
                      {emptyText}
                    </span>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        onSelect(option);
                        setSearch('');
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === option.value ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                  {canCreate && (
                    <CommandItem
                      value={`__create__${trimmed}`}
                      onSelect={handleCreate}
                      disabled={creating}
                      className="text-primary"
                    >
                      {creating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      {createLabel(trimmed)}
                    </CommandItem>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
