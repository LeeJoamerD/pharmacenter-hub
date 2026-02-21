import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AssureurSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  tenantId?: string;
}

export const AssureurSelector: React.FC<AssureurSelectorProps> = ({
  value,
  onChange,
  className,
  tenantId,
}) => {
  const [open, setOpen] = useState(false);

  const { data: assureurs = [], isLoading } = useQuery({
    queryKey: ['assureurs-selector', tenantId],
    queryFn: async () => {
      let query = supabase
        .from('assureurs')
        .select('id, libelle_assureur, telephone_appel, email')
        .eq('is_active', true)
        .order('libelle_assureur');

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const selectedAssureur = assureurs.find(a => a.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedAssureur ? selectedAssureur.libelle_assureur : "Sélectionner un assureur..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un assureur..." />
          <CommandEmpty>Aucun assureur trouvé.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {isLoading ? (
              <CommandItem disabled>Chargement...</CommandItem>
            ) : (
              assureurs.map((assureur) => (
                <CommandItem
                  key={assureur.id}
                  value={assureur.libelle_assureur}
                  onSelect={() => {
                    onChange(assureur.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === assureur.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{assureur.libelle_assureur}</span>
                    {assureur.telephone_appel && (
                      <span className="text-xs text-muted-foreground">
                        {assureur.telephone_appel}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
