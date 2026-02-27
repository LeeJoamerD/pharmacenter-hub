import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';
import { useSalaryManager } from '@/hooks/useSalaryManager';

const PayrollSettings = () => {
  const { parametres, loadingParametres, saveParametres } = useSalaryManager();
  const [form, setForm] = useState({
    taux_cnss_employe: 3.5,
    taux_cnss_patronal: 20.29,
    taux_irpp: 0,
    smic: 90000,
  });

  useEffect(() => {
    if (parametres) {
      setForm({
        taux_cnss_employe: parametres.taux_cnss_employe,
        taux_cnss_patronal: parametres.taux_cnss_patronal,
        taux_irpp: parametres.taux_irpp,
        smic: parametres.smic,
      });
    }
  }, [parametres]);

  const handleSave = () => saveParametres.mutate(form);

  if (loadingParametres) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Cotisations CNSS</CardTitle>
          <CardDescription>Taux de la Caisse Nationale de Sécurité Sociale (Congo)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Taux part salariale (%)</Label>
            <Input type="number" step="0.01" value={form.taux_cnss_employe}
              onChange={e => setForm({ ...form, taux_cnss_employe: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground mt-1">Taux légal Congo : 3,5%</p>
          </div>
          <div>
            <Label>Taux part patronale (%)</Label>
            <Input type="number" step="0.01" value={form.taux_cnss_patronal}
              onChange={e => setForm({ ...form, taux_cnss_patronal: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground mt-1">Taux légal Congo : 20,29%</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Impôt sur le revenu (IRPP)</CardTitle>
          <CardDescription>Barème simplifié de retenue à la source</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Taux IRPP simplifié (%)</Label>
            <Input type="number" step="0.01" value={form.taux_irpp}
              onChange={e => setForm({ ...form, taux_irpp: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground mt-1">0% si exonéré. Sinon, appliquer le barème progressif.</p>
          </div>
          <div>
            <Label>SMIG (FCFA)</Label>
            <Input type="number" value={form.smic}
              onChange={e => setForm({ ...form, smic: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground mt-1">Salaire Minimum Interprofessionnel Garanti</p>
          </div>
        </CardContent>
      </Card>

      <div className="md:col-span-2 flex justify-end">
        <Button onClick={handleSave} disabled={saveParametres.isPending}>
          {saveParametres.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Enregistrer les paramètres
        </Button>
      </div>
    </div>
  );
};

export default PayrollSettings;
