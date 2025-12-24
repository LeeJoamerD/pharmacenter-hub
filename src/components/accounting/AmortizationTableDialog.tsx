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
import { AmortissementItem } from '@/hooks/useFinancialReports';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface AmortizationTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: AmortissementItem[];
  totalValeurBrute: number;
  totalAmortissements: number;
  totalValeurNette: number;
  totalDotation: number;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

const AmortizationTableDialog = ({
  open,
  onOpenChange,
  items,
  totalValeurBrute,
  totalAmortissements,
  totalValeurNette,
  totalDotation,
  onExportPDF,
  onExportExcel,
}: AmortizationTableDialogProps) => {
  const { formatAmount } = useCurrencyFormatting();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Tableau des Amortissements</span>
            <div className="flex gap-2">
              {onExportExcel && (
                <Button variant="outline" size="sm" onClick={onExportExcel}>
                  <Download className="mr-2 h-4 w-4" />
                  Excel
                </Button>
              )}
              {onExportPDF && (
                <Button variant="outline" size="sm" onClick={onExportPDF}>
                  <Printer className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Immobilisation</TableHead>
                <TableHead className="text-right">Valeur Brute</TableHead>
                <TableHead className="text-right">Taux (%)</TableHead>
                <TableHead className="text-right">Amort. Cumulés</TableHead>
                <TableHead className="text-right">Dotation Exercice</TableHead>
                <TableHead className="text-right">Valeur Nette</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucune immobilisation enregistrée
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.immobilisation}</TableCell>
                      <TableCell className="text-right">{formatAmount(item.valeurBrute)}</TableCell>
                      <TableCell className="text-right">{item.tauxAmortissement}%</TableCell>
                      <TableCell className="text-right">{formatAmount(item.amortissementsCumules)}</TableCell>
                      <TableCell className="text-right">{formatAmount(item.dotationExercice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatAmount(item.valeurNette)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-bold border-t-2">
                    <TableCell>TOTAUX</TableCell>
                    <TableCell className="text-right">{formatAmount(totalValeurBrute)}</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right">{formatAmount(totalAmortissements)}</TableCell>
                    <TableCell className="text-right">{formatAmount(totalDotation)}</TableCell>
                    <TableCell className="text-right">{formatAmount(totalValeurNette)}</TableCell>
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

export default AmortizationTableDialog;
