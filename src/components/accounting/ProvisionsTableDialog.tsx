import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Printer } from 'lucide-react';
import { ProvisionItem } from '@/hooks/useFinancialReports';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface ProvisionsTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ProvisionItem[];
  totalDebut: number;
  totalDotations: number;
  totalReprises: number;
  totalFin: number;
}

const ProvisionsTableDialog = ({
  open,
  onOpenChange,
  items,
  totalDebut,
  totalDotations,
  totalReprises,
  totalFin,
}: ProvisionsTableDialogProps) => {
  const { formatAmount } = useCurrencyFormatting();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tableau des Provisions</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Libellé</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Montant Début</TableHead>
                <TableHead className="text-right">Dotations</TableHead>
                <TableHead className="text-right">Reprises</TableHead>
                <TableHead className="text-right">Montant Fin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucune provision enregistrée
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.libelle}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell className="text-right">{formatAmount(item.montantDebut)}</TableCell>
                      <TableCell className="text-right text-green-600">+{formatAmount(item.dotation)}</TableCell>
                      <TableCell className="text-right text-red-600">-{formatAmount(item.reprise)}</TableCell>
                      <TableCell className="text-right font-medium">{formatAmount(item.montantFin)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-bold border-t-2">
                    <TableCell colSpan={2}>TOTAUX</TableCell>
                    <TableCell className="text-right">{formatAmount(totalDebut)}</TableCell>
                    <TableCell className="text-right text-green-600">+{formatAmount(totalDotations)}</TableCell>
                    <TableCell className="text-right text-red-600">-{formatAmount(totalReprises)}</TableCell>
                    <TableCell className="text-right">{formatAmount(totalFin)}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProvisionsTableDialog;
