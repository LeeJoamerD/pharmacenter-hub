import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ExportButton from '@/components/ui/export-button';
import { AlertTriangle, CheckCircle, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Inconsistency {
  lot_id: string;
  numero_lot: string;
  produit_libelle: string;
  type: 'gap' | 'final_mismatch';
  movement_a_id?: string;
  movement_b_id?: string;
  date_a?: string;
  date_b?: string;
  quantite_apres_a?: number;
  quantite_avant_b?: number;
  gap_size: number;
  current_quantity?: number;
  last_quantite_apres?: number;
}

const StockConsistencyChecker = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Inconsistency[] | null>(null);
  const { toast } = useToast();

  const runCheck = async () => {
    setIsRunning(true);
    try {
      const { getCurrentTenantId } = await import('@/utils/tenantValidation');
      const tenantId = await getCurrentTenantId();
      if (!tenantId) throw new Error('Non authentifié');

      // Get all lots with their movements ordered chronologically
      const { data: lots, error: lotsError } = await supabase
        .from('lots')
        .select('id, numero_lot, quantite_restante, produit:produits(libelle_produit)')
        .eq('tenant_id', tenantId);

      if (lotsError) throw lotsError;
      if (!lots || lots.length === 0) {
        setResults([]);
        return;
      }

      const inconsistencies: Inconsistency[] = [];

      // Process in batches to avoid too many requests
      for (const lot of lots) {
        const { data: movements } = await supabase
          .from('mouvements_lots')
          .select('id, quantite_avant, quantite_apres, created_at')
          .eq('lot_id', lot.id)
          .order('created_at', { ascending: true });

        if (!movements || movements.length === 0) continue;

        const produitLibelle = (lot.produit as any)?.libelle_produit || 'Inconnu';

        // Check consecutive movements for gaps
        for (let i = 0; i < movements.length - 1; i++) {
          const current = movements[i];
          const next = movements[i + 1];

          if (current.quantite_apres !== next.quantite_avant) {
            inconsistencies.push({
              lot_id: lot.id,
              numero_lot: lot.numero_lot,
              produit_libelle: produitLibelle,
              type: 'gap',
              movement_a_id: current.id,
              movement_b_id: next.id,
              date_a: current.created_at,
              date_b: next.created_at,
              quantite_apres_a: current.quantite_apres,
              quantite_avant_b: next.quantite_avant,
              gap_size: (next.quantite_avant ?? 0) - (current.quantite_apres ?? 0),
            });
          }
        }

        // Check last movement vs current lot quantity
        const lastMovement = movements[movements.length - 1];
        if (lastMovement.quantite_apres !== lot.quantite_restante) {
          inconsistencies.push({
            lot_id: lot.id,
            numero_lot: lot.numero_lot,
            produit_libelle: produitLibelle,
            type: 'final_mismatch',
            date_a: lastMovement.created_at,
            last_quantite_apres: lastMovement.quantite_apres,
            current_quantity: lot.quantite_restante,
            gap_size: (lot.quantite_restante ?? 0) - (lastMovement.quantite_apres ?? 0),
          });
        }
      }

      setResults(inconsistencies);
      toast({
        title: 'Analyse terminée',
        description: `${inconsistencies.length} incohérence(s) détectée(s) sur ${lots.length} lots analysés.`,
      });
    } catch (error: any) {
      console.error('Consistency check error:', error);
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleExport = (fmt: 'csv' | 'xlsx' | 'pdf') => {
    if (!results || results.length === 0) return;
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `coherence-stock-${timestamp}`;

    const rows = results.map(r => ({
      Produit: r.produit_libelle,
      Lot: r.numero_lot,
      Type: r.type === 'gap' ? 'Gap entre mouvements' : 'Écart stock actuel',
      'Qté après (mvt A)': r.type === 'gap' ? r.quantite_apres_a : r.last_quantite_apres,
      'Qté avant (mvt B)': r.type === 'gap' ? r.quantite_avant_b : r.current_quantity,
      Écart: r.gap_size,
      'Date A': r.date_a ? format(new Date(r.date_a), 'dd/MM/yyyy HH:mm') : '',
      'Date B': r.date_b ? format(new Date(r.date_b), 'dd/MM/yyyy HH:mm') : 'Stock actuel',
    }));

    try {
      if (fmt === 'csv') {
        const headers = Object.keys(rows[0]).join(',');
        const csv = [headers, ...rows.map(r => Object.values(r).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
      } else if (fmt === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cohérence');
        XLSX.writeFile(wb, `${filename}.xlsx`);
      } else {
        const doc = new jsPDF('landscape');
        doc.setFontSize(16);
        doc.text('Rapport de cohérence du stock', 14, 15);
        autoTable(doc, {
          startY: 22,
          head: [Object.keys(rows[0])],
          body: rows.map(r => Object.values(r)),
          styles: { fontSize: 8 },
        });
        doc.save(`${filename}.pdf`);
      }
      toast({ title: 'Export réussi', description: `Rapport exporté en ${fmt.toUpperCase()}` });
    } catch {
      toast({ title: 'Erreur', description: "Erreur lors de l'export", variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Vérificateur de cohérence du stock
            </CardTitle>
            <CardDescription>
              Détecte les incohérences entre mouvements consécutifs et le stock actuel des lots
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {results && results.length > 0 && <ExportButton onExport={handleExport} />}
            <Button onClick={runCheck} disabled={isRunning}>
              {isRunning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyse en cours...</> : 'Lancer l\'analyse'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {results === null && !isRunning && (
          <div className="text-center py-12 text-muted-foreground">
            Cliquez sur "Lancer l'analyse" pour vérifier la cohérence des mouvements de stock
          </div>
        )}

        {results && results.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center gap-2">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">Aucune incohérence détectée</p>
            <p className="text-muted-foreground">Tous les mouvements de lots sont cohérents</p>
          </div>
        )}

        {results && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="font-medium">{results.length} incohérence(s) détectée(s)</span>
            </div>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Valeur A</TableHead>
                    <TableHead>Valeur B</TableHead>
                    <TableHead>Écart</TableHead>
                    <TableHead>Période</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-[200px] truncate" title={r.produit_libelle}>
                        {r.produit_libelle}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{r.numero_lot}</TableCell>
                      <TableCell>
                        <Badge variant={r.type === 'gap' ? 'destructive' : 'secondary'}>
                          {r.type === 'gap' ? 'Gap' : 'Écart final'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.type === 'gap' ? `Après: ${r.quantite_apres_a}` : `Dernier mvt: ${r.last_quantite_apres}`}
                      </TableCell>
                      <TableCell>
                        {r.type === 'gap' ? `Avant: ${r.quantite_avant_b}` : `Stock actuel: ${r.current_quantity}`}
                      </TableCell>
                      <TableCell>
                        <span className={r.gap_size !== 0 ? 'text-destructive font-bold' : ''}>
                          {r.gap_size > 0 ? `+${r.gap_size}` : r.gap_size}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.date_a && format(new Date(r.date_a), 'dd/MM/yy HH:mm', { locale: fr })}
                        {r.date_b && ` → ${format(new Date(r.date_b), 'dd/MM/yy HH:mm', { locale: fr })}`}
                        {!r.date_b && r.type === 'final_mismatch' && ' → Actuel'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockConsistencyChecker;
