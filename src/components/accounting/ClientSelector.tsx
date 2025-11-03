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

interface ClientSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  value,
  onChange,
  className,
}) => {
  const [open, setOpen] = useState(false);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, nom_complet, telephone, email')
        .eq('statut', 'Actif')
        .order('nom_complet');
      
      if (error) throw error;
      return data;
    },
  });

  const selectedClient = clients.find(client => client.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedClient ? selectedClient.nom_complet : "Sélectionner un client..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un client..." />
          <CommandEmpty>Aucun client trouvé.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {isLoading ? (
              <CommandItem disabled>Chargement...</CommandItem>
            ) : (
              clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.nom_complet}
                  onSelect={() => {
                    onChange(client.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === client.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{client.nom_complet}</span>
                    {client.telephone && (
                      <span className="text-xs text-muted-foreground">
                        {client.telephone}
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
