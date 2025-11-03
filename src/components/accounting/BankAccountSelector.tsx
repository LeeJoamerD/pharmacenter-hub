import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BankAccount } from '@/hooks/usePaymentManager';
import { Badge } from '@/components/ui/badge';

interface BankAccountSelectorProps {
  accounts: BankAccount[];
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  showBalance?: boolean;
}

const BankAccountSelector: React.FC<BankAccountSelectorProps> = ({
  accounts,
  value,
  onChange,
  label = 'Compte bancaire',
  showBalance = true,
}) => {
  const selectedAccount = accounts.find(a => a.id === value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Sélectionner un compte" />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex items-center justify-between w-full">
                <span>{account.nom_compte} - {account.numero_compte}</span>
                {!account.est_actif && (
                  <Badge variant="secondary" className="ml-2">Inactif</Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showBalance && selectedAccount && (
        <p className="text-sm text-muted-foreground">
          Solde actuel: <span className="font-medium">{selectedAccount.solde_actuel.toLocaleString()} {selectedAccount.devise}</span>
        </p>
      )}
    </div>
  );
};

export default BankAccountSelector;
