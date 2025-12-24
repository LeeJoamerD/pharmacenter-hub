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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, AlertTriangle } from 'lucide-react';
import { CreanceClientItem } from '@/hooks/useFinancialReports';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CreancesTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CreanceClientItem[];
  totalCreances: number;
  totalEchu: number;
  totalNonEchu: number;
  tauxRecouvrement: number;
  parTranche: {
    non_echu: number;
    '0_30': number;
    '30_60': number;
    '60_90': number;
    plus_90: number;
  };
}

const CreancesTableDialog = ({
  open,
  onOpenChange,
  items,
  totalCreances,
  totalEchu,
  totalNonEchu,
  tauxRecouvrement,
  parTranche,
}: CreancesTableDialogProps) => {
  const { formatAmount } = useCurrencyFormatting();

  const getTrancheLabel = (tranche: string) => {
    switch (tranche) {
      case 'non_echu': return 'Non échu';
      case '0_30': return '0-30 jours';
      case '30_60': return '30-60 jours';
      case '60_90': return '60-90 jours';
      case 'plus_90': return '> 90 jours';
      default: return tranche;
    }
  };

  const getTrancheVariant = (tranche: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (tranche) {
      case 'non_echu': return 'secondary';
      case '0_30': return 'outline';
      case '30_60': return 'default';
      case '60_90': return 'destructive';
      case 'plus_90': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>État des Créances Clients</span>
            {totalEchu > 0 && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {formatAmount(totalEchu)} en retard
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Résumé par tranche */}
        <div className="grid grid-cols-5 gap-2 mt-4">
          <Card className="bg-secondary/20">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs">Non échu</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <div className="text-sm font-bold">{formatAmount(parTranche.non_echu)}</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 dark:bg-yellow-900/20">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs">0-30 jours</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <div className="text-sm font-bold text-yellow-600">{formatAmount(parTranche['0_30'])}</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 dark:bg-orange-900/20">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs">30-60 jours</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <div className="text-sm font-bold text-orange-600">{formatAmount(parTranche['30_60'])}</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-900/20">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs">60-90 jours</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <div className="text-sm font-bold text-red-600">{formatAmount(parTranche['60_90'])}</div>
            </CardContent>
          </Card>
          <Card className="bg-red-100 dark:bg-red-900/40">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs">&gt; 90 jours</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <div className="text-sm font-bold text-red-700">{formatAmount(parTranche.plus_90)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Client</TableHead>
                <TableHead>N° Facture</TableHead>
                <TableHead>Date Émission</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead className="text-right">Montant Total</TableHead>
                <TableHead className="text-right">Échu</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucune créance client en cours
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.client}</TableCell>
                      <TableCell>{item.numeroFacture}</TableCell>
                      <TableCell>
                        {item.dateEmission ? format(new Date(item.dateEmission), 'dd/MM/yyyy', { locale: fr }) : '-'}
                      </TableCell>
                      <TableCell>
                        {item.dateEcheance ? format(new Date(item.dateEcheance), 'dd/MM/yyyy', { locale: fr }) : '-'}
                      </TableCell>
                      <TableCell className="text-right">{formatAmount(item.montantTotal)}</TableCell>
                      <TableCell className={`text-right ${item.montantEchu > 0 ? 'text-red-600 font-medium' : ''}`}>
                        {formatAmount(item.montantEchu)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTrancheVariant(item.tranche)}>
                          {getTrancheLabel(item.tranche)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-bold border-t-2">
                    <TableCell colSpan={4}>TOTAUX</TableCell>
                    <TableCell className="text-right">{formatAmount(totalCreances)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatAmount(totalEchu)}</TableCell>
                    <TableCell>
                      <Badge variant={tauxRecouvrement >= 80 ? 'default' : 'destructive'}>
                        {tauxRecouvrement.toFixed(1)}% recouvré
                      </Badge>
                    </TableCell>
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

export default CreancesTableDialog;
