import React from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calculator, Info } from 'lucide-react';
import { getAvailableCategories } from '@/services/BankTransactionAccountingService';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface TransactionCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { categorie: string; generateAccounting: boolean }) => void;
  transaction?: {
    id: string;
    libelle: string;
    montant: number;
    type_transaction: 'credit' | 'debit';
    categorie?: string;
  } | null;
}

const TransactionCategoryDialog: React.FC<TransactionCategoryDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  transaction,
}) => {
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      categorie: transaction?.categorie || '',
      generateAccounting: true,
    },
  });

  const { formatAmount } = useCurrencyFormatting();
  const selectedCategorie = watch('categorie');
  const generateAccounting = watch('generateAccounting');

  React.useEffect(() => {
    if (transaction) {
      reset({
        categorie: transaction.categorie || '',
        generateAccounting: true,
      });
    }
  }, [transaction, reset]);

  const categories = getAvailableCategories();
  const filteredCategories = transaction 
    ? categories.filter(c => c.type === transaction.type_transaction)
    : categories;

  const handleFormSubmit = (data: { categorie: string; generateAccounting: boolean }) => {
    onSubmit(data);
    onOpenChange(false);
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Catégoriser la Transaction
          </DialogTitle>
          <DialogDescription>
            Attribuez une catégorie comptable à cette transaction pour générer l'écriture correspondante.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Transaction Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Description</span>
              <span className="font-medium">{transaction.libelle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Montant</span>
              <span className={`font-bold ${
                transaction.type_transaction === 'credit' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type_transaction === 'credit' ? '+' : '-'}
                {formatAmount(Math.abs(transaction.montant))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Type</span>
              <Badge variant={transaction.type_transaction === 'credit' ? 'default' : 'secondary'}>
                {transaction.type_transaction === 'credit' ? 'Encaissement' : 'Décaissement'}
              </Badge>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="categorie">Catégorie comptable</Label>
            <Select
              value={selectedCategorie}
              onValueChange={(value) => setValue('categorie', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Accounting Switch */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="generateAccounting">Générer l'écriture comptable</Label>
              <p className="text-sm text-muted-foreground">
                Créer automatiquement l'écriture dans le journal bancaire
              </p>
            </div>
            <Switch
              id="generateAccounting"
              checked={generateAccounting}
              onCheckedChange={(checked) => setValue('generateAccounting', checked)}
            />
          </div>

          {/* Info Alert */}
          {generateAccounting && selectedCategorie && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Une écriture comptable sera générée dans le journal bancaire avec les comptes 
                configurés pour la catégorie "{selectedCategorie}".
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!selectedCategorie}>
              <Calculator className="h-4 w-4 mr-2" />
              Valider
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionCategoryDialog;
