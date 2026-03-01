import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';
import { useSalaryManager, PRIME_IMPOSABLE_LABELS, PRIME_NON_IMPOSABLE_LABELS } from '@/hooks/useSalaryManager';

const PayrollSettings = () => {
  const { parametres, loadingParametres, saveParametres } = useSalaryManager();
  const [form, setForm] = useState({
    taux_cnss_employe: 3.5,
    taux_cnss_patronal: 20.29,
    taux_irpp: 0,
    smic: 90000,
    taux_conge_paye: 8.33,
    tol_defaut: 0,
    primes_defaut: {} as Record<string, number>,
  });

  useEffect(() => {
    if (parametres) {
      setForm({
        taux_cnss_employe: parametres.taux_cnss_employe,
        taux_cnss_patronal: parametres.taux_cnss_patronal,
        taux_irpp: parametres.taux_irpp,
        smic: parametres.smic,
        taux_conge_paye: parametres.taux_conge_paye ?? 8.33,
        tol_defaut: parametres.tol_defaut ?? 0,
        primes_defaut: (parametres.primes_defaut as Record<string, number>) || {},
      });
    }
  }, [parametres]);

  const handleSave = () => saveParametres.mutate(form);

  const updatePrimeDefaut = (key: string, value: number) => {
    setForm(prev => ({
      ...prev,
      primes_defaut: { ...prev.primes_defaut, [key]: value },
    }));
  };

  if (loadingParametres) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* CNSS Card */}
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

      {/* IRPP & SMIG Card */}
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

      {/* Congés payés & TOL */}
      <Card>
        <CardHeader>
          <CardTitle>Congés payés & TOL</CardTitle>
          <CardDescription>Taux de provision congés payés et TOL par défaut</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Taux congés payés (%)</Label>
            <Input type="number" step="0.01" value={form.taux_conge_paye}
              onChange={e => setForm({ ...form, taux_conge_paye: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground mt-1">Taux légal : 8,33% (1/12)</p>
          </div>
          <div>
            <Label>TOL par défaut (FCFA)</Label>
            <Input type="number" value={form.tol_defaut}
              onChange={e => setForm({ ...form, tol_defaut: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground mt-1">Taxe sur l'Obligation Légale — montant par défaut</p>
          </div>
        </CardContent>
      </Card>

      {/* Primes imposables par défaut */}
      <Card>
        <CardHeader>
          <CardTitle>Primes imposables par défaut</CardTitle>
          <CardDescription>Montants utilisés lors de la génération des bulletins (si activées)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(PRIME_IMPOSABLE_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-3">
              <Label className="w-48 text-xs shrink-0">{label}</Label>
              <Input
                type="number"
                className="h-8 text-sm"
                value={form.primes_defaut[key] || 0}
                onChange={e => updatePrimeDefaut(key, Number(e.target.value))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Primes non imposables par défaut */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Primes non imposables par défaut</CardTitle>
          <CardDescription>Montants par défaut pour les primes exonérées</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(PRIME_NON_IMPOSABLE_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-3">
              <Label className="w-48 text-xs shrink-0">{label}</Label>
              <Input
                type="number"
                className="h-8 text-sm"
                value={form.primes_defaut[`ni_${key}`] || 0}
                onChange={e => updatePrimeDefaut(`ni_${key}`, Number(e.target.value))}
              />
            </div>
          ))}
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
