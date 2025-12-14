import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calculator, AlertTriangle } from 'lucide-react';
import { AllocationKey, AllocationLine, ChargeAllocation, CostCenter } from '@/hooks/useAnalyticalAccounting';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface CreateAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (allocation: Partial<ChargeAllocation>, lines: Partial<AllocationLine>[]) => Promise<void>;
  onCalculate: (params: { montantTotal: number; cleRepartitionId: string; dateRef: string }) => Promise<AllocationLine[]>;
  allocationKeys: AllocationKey[];
  costCenters: CostCenter[];
  isSaving: boolean;
}

const CreateAllocationDialog = ({
  open,
  onOpenChange,
  onSave,
  onCalculate,
  allocationKeys,
  costCenters,
  isSaving
}: CreateAllocationDialogProps) => {
  const { formatAmount, getInputStep, getCurrencySymbol } = useCurrencyFormatting();
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedLines, setCalculatedLines] = useState<AllocationLine[]>([]);
  const [form, setForm] = useState({
    libelle: '',
    type_charge: '' as ChargeAllocation['type_charge'],
    cle_repartition_id: '',
    montant_total: '',
    methode: 'automatique' as ChargeAllocation['methode'],
    notes: '',
  });

  useEffect(() => {
    if (!open) {
      setForm({
        libelle: '',
        type_charge: '' as ChargeAllocation['type_charge'],
        cle_repartition_id: '',
        montant_total: '',
        methode: 'automatique',
        notes: '',
      });
      setCalculatedLines([]);
    }
  }, [open]);

  const handleCalculate = async () => {
    if (!form.cle_repartition_id || !form.montant_total) return;
    
    setIsCalculating(true);
    try {
      const lines = await onCalculate({
        montantTotal: parseFloat(form.montant_total),
        cleRepartitionId: form.cle_repartition_id,
        dateRef: new Date().toISOString().split('T')[0],
      });
      setCalculatedLines(lines);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.type_charge || !form.montant_total || calculatedLines.length === 0) return;
    
    await onSave({
      libelle: form.libelle || `Répartition ${form.type_charge}`,
      type_charge: form.type_charge,
      cle_repartition_id: form.cle_repartition_id || undefined,
      montant_total: parseFloat(form.montant_total),
      methode: form.methode,
      notes: form.notes || undefined,
      date_repartition: new Date().toISOString().split('T')[0],
      statut: 'en_cours',
    }, calculatedLines);
    onOpenChange(false);
  };

  const chargeTypes = [
    { value: 'frais_admin', label: 'Frais Administratifs' },
    { value: 'services_generaux', label: 'Services Généraux' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'assurances', label: 'Assurances' },
    { value: 'informatique', label: 'Informatique' },
    { value: 'autres', label: 'Autres' },
  ];

  const getCenterName = (centreId: string) => {
    const center = costCenters.find(c => c.id === centreId);
    return center ? `${center.code} - ${center.nom}` : 'N/A';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle Répartition de Charges</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="libelle">Libellé</Label>
            <Input
              id="libelle"
              value={form.libelle}
              onChange={(e) => setForm({ ...form, libelle: e.target.value })}
              placeholder="Ex: Répartition frais administratifs Décembre"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Type de Charge *</Label>
              <Select value={form.type_charge} onValueChange={(v) => setForm({ ...form, type_charge: v as ChargeAllocation['type_charge'] })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {chargeTypes.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="montant">Montant Total ({getCurrencySymbol()}) *</Label>
              <Input
                id="montant"
                type="number"
                step={getInputStep()}
                value={form.montant_total}
                onChange={(e) => setForm({ ...form, montant_total: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cle">Clé de Répartition</Label>
            <Select value={form.cle_repartition_id} onValueChange={(v) => setForm({ ...form, cle_repartition_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une clé" />
              </SelectTrigger>
              <SelectContent>
                {allocationKeys.filter(k => k.est_active).map((k) => (
                  <SelectItem key={k.id} value={k.id}>{k.code} - {k.libelle}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleCalculate} 
            variant="outline"
            disabled={isCalculating || !form.cle_repartition_id || !form.montant_total}
          >
            {isCalculating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4 mr-2" />
            )}
            Calculer Répartition
          </Button>

          {calculatedLines.length > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Prévisualisation de la répartition</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Centre de Coûts</TableHead>
                    <TableHead className="text-right">Coefficient</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculatedLines.map((line, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{getCenterName(line.centre_cout_id)}</TableCell>
                      <TableCell className="text-right">{(line.coefficient * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{formatAmount(line.montant)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {calculatedLines.length === 0 && form.cle_repartition_id && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Cliquez sur "Calculer Répartition" pour voir la distribution des charges.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Remarques ou justifications..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving || !form.type_charge || !form.montant_total || calculatedLines.length === 0}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Créer la Répartition
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAllocationDialog;
