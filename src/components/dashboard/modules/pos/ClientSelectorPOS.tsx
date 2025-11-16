import React, { useState } from 'react';
import { Check, ChevronsUpDown, User } from 'lucide-react';
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
import { useTenant } from '@/contexts/TenantContext';

interface ClientSelectorPOSProps {
  value: string | null;
  onChange: (clientId: string, clientData: any) => void;
  className?: string;
}

export const ClientSelectorPOS: React.FC<ClientSelectorPOSProps> = ({
  value,
  onChange,
  className,
}) => {
  const { tenantId } = useTenant();
  const [open, setOpen] = useState(false);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients-pos', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, nom_complet, telephone, email, statut')
        .eq('tenant_id', tenantId)
        .eq('statut', 'Actif')
        .order('nom_complet');
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
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
          {selectedClient ? (
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {selectedClient.nom_complet}
            </span>
          ) : (
            <span className="text-muted-foreground">
              Sélectionner un client...
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un client par nom ou téléphone..." />
          <CommandEmpty>Aucun client trouvé.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {isLoading ? (
              <CommandItem disabled>Chargement...</CommandItem>
            ) : (
              clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`${client.nom_complet} ${client.telephone || ''}`}
                  onSelect={() => {
                    onChange(client.id, client);
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
                    <span className="font-medium">{client.nom_complet}</span>
                    {client.telephone && (
                      <span className="text-xs text-muted-foreground">
                        📞 {client.telephone}
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
