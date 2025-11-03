import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  numero_compte: string;
  libelle_compte: string;
  type_compte: string;
  niveau: number;
}

interface AccountSelectorProps {
  value: string;
  onChange: (accountId: string, accountData: Account) => void;
  filterDetailOnly?: boolean;
  filterByClass?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({
  value,
  onChange,
  filterDetailOnly = true,
  filterByClass,
  placeholder = "Sélectionner un compte",
  disabled = false,
  error
}) => {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAccounts();
  }, [filterByClass]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('plan_comptable')
        .select('id, numero_compte, libelle_compte, type_compte, niveau')
        .eq('is_active', true)
        .order('numero_compte');
      
      if (filterDetailOnly) {
        query = query.eq('type_compte', 'Détail');
      }
      
      if (filterByClass) {
        query = query.ilike('numero_compte', `${filterByClass}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.error('Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.numero_compte.toLowerCase().includes(search.toLowerCase()) ||
    account.libelle_compte.toLowerCase().includes(search.toLowerCase())
  );

  const selectedAccount = accounts.find(a => a.id === value);

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              error && "border-destructive"
            )}
          >
            {selectedAccount ? (
              <span className="flex items-center gap-2">
                <span className="font-mono">{selectedAccount.numero_compte}</span>
                <span className="text-muted-foreground">-</span>
                <span>{selectedAccount.libelle_compte}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0">
          <Command>
            <CommandInput
              placeholder="Rechercher un compte..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandEmpty>
              {loading ? "Chargement..." : "Aucun compte trouvé"}
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {filteredAccounts.map((account) => (
                <CommandItem
                  key={account.id}
                  value={account.id}
                  onSelect={() => {
                    onChange(account.id, account);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === account.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex items-center gap-2 flex-1">
                    <span className="font-mono text-sm">{account.numero_compte}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-sm">{account.libelle_compte}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};

export default AccountSelector;