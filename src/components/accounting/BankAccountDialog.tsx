import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { BankAccount } from '@/hooks/usePaymentManager';

interface BankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<BankAccount>) => void;
  account?: BankAccount | null;
}

const BankAccountDialog: React.FC<BankAccountDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  account,
}) => {
  const { register, handleSubmit, watch, setValue } = useForm<Partial<BankAccount>>({
    defaultValues: account || {
      type_compte: 'courant',
      devise: 'FCFA',
      est_actif: true,
      autoriser_decouvert: false,
      solde_initial: 0,
      limite_decouvert: 0,
    },
  });

  const typeCompte = watch('type_compte');
  const estActif = watch('est_actif');
  const autoriserDecouvert = watch('autoriser_decouvert');

  const handleFormSubmit = (data: Partial<BankAccount>) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{account ? 'Modifier le compte' : 'Nouveau compte bancaire'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom_compte">Nom du compte *</Label>
              <Input id="nom_compte" {...register('nom_compte', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_compte">Numéro de compte *</Label>
              <Input id="numero_compte" {...register('numero_compte', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banque">Banque *</Label>
              <Input id="banque" {...register('banque', { required: true })} placeholder="Ex: BNI, Coris Bank..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type_compte">Type de compte *</Label>
              <Select value={typeCompte} onValueChange={(value) => setValue('type_compte', value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="courant">Compte courant</SelectItem>
                  <SelectItem value="epargne">Compte d'épargne</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="caisse">Caisse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="devise">Devise</Label>
              <Input id="devise" {...register('devise')} defaultValue="FCFA" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solde_initial">Solde initial</Label>
              <Input 
                id="solde_initial" 
                type="number" 
                step="0.01"
                {...register('solde_initial', { valueAsNumber: true })} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input id="iban" {...register('iban')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="swift_bic">SWIFT/BIC</Label>
              <Input id="swift_bic" {...register('swift_bic')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_banque">Contact banque</Label>
              <Input id="contact_banque" {...register('contact_banque')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone_banque">Téléphone banque</Label>
              <Input id="telephone_banque" {...register('telephone_banque')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_banque">Email banque</Label>
              <Input id="email_banque" type="email" {...register('email_banque')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limite_decouvert">Limite découvert</Label>
              <Input 
                id="limite_decouvert" 
                type="number" 
                step="0.01"
                {...register('limite_decouvert', { valueAsNumber: true })} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} rows={3} />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="est_actif" 
                checked={estActif}
                onCheckedChange={(checked) => setValue('est_actif', checked)}
              />
              <Label htmlFor="est_actif">Compte actif</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="autoriser_decouvert" 
                checked={autoriserDecouvert}
                onCheckedChange={(checked) => setValue('autoriser_decouvert', checked)}
              />
              <Label htmlFor="autoriser_decouvert">Autoriser découvert</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {account ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BankAccountDialog;
