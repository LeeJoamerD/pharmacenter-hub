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

interface FournisseurSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const FournisseurSelector: React.FC<FournisseurSelectorProps> = ({
  value,
  onChange,
  className,
}) => {
  const [open, setOpen] = useState(false);

  const { data: fournisseurs = [], isLoading } = useQuery({
    queryKey: ['fournisseurs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fournisseurs')
        .select('id, nom, telephone_appel, email')
        .eq('statut', 'actif')
        .order('nom');
      
      if (error) throw error;
      return data as Array<{id: string; nom: string; telephone_appel: string | null; email: string | null}>;
    },
  });

  const selectedFournisseur = fournisseurs.find(f => f.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedFournisseur ? selectedFournisseur.nom : "Sélectionner un fournisseur..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un fournisseur..." />
          <CommandEmpty>Aucun fournisseur trouvé.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {isLoading ? (
              <CommandItem disabled>Chargement...</CommandItem>
            ) : (
              fournisseurs.map((fournisseur) => (
                <CommandItem
                  key={fournisseur.id}
                  value={fournisseur.nom}
                  onSelect={() => {
                    onChange(fournisseur.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === fournisseur.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{fournisseur.nom}</span>
                    {fournisseur.telephone_appel && (
                      <span className="text-xs text-muted-foreground">
                        {fournisseur.telephone_appel}
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
