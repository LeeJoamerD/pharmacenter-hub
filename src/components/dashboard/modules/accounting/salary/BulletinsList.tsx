import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Check, CreditCard, Trash2, Edit, Loader2 } from 'lucide-react';
import { useSalaryManager, BulletinPaie } from '@/hooks/useSalaryManager';

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const BulletinsList = () => {
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [editBulletin, setEditBulletin] = useState<BulletinPaie | null>(null);
  const [payDialog, setPayDialog] = useState<BulletinPaie | null>(null);
  const [payMode, setPayMode] = useState('Espèces');
  const [payRef, setPayRef] = useState('');

  const { fetchBulletins, generatePayroll, updateBulletin, validateBulletin, payBulletin, deleteBulletin } = useSalaryManager();
  const { data: bulletins = [], isLoading } = fetchBulletins(mois, annee);

  const formatMontant = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

  const statusBadge = (statut: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Brouillon': 'secondary',
      'Validé': 'default',
      'Payé': 'outline',
    };
    return <Badge variant={variants[statut] || 'secondary'}>{statut}</Badge>;
  };

  const handleGenerate = () => generatePayroll.mutate({ mois, annee });

  const handleSaveEdit = () => {
    if (!editBulletin) return;
    updateBulletin.mutate({
      id: editBulletin.id,
      salaire_base: editBulletin.salaire_base,
      primes: editBulletin.primes,
      heures_sup: editBulletin.heures_sup,
      avances: editBulletin.avances,
      retenues_autres: editBulletin.retenues_autres,
    });
    setEditBulletin(null);
  };

  const handlePay = () => {
    if (!payDialog) return;
    payBulletin.mutate({
      id: payDialog.id,
      mode_paiement: payMode,
      reference_paiement: payRef || undefined,
      date_paiement: new Date().toISOString().split('T')[0],
    });
    setPayDialog(null);
    setPayRef('');
  };

  const totals = bulletins.reduce((acc, b) => ({
    brut: acc.brut + b.salaire_brut,
    net: acc.net + b.net_a_payer,
    cnss: acc.cnss + b.retenues_cnss_employe + b.cotisations_patronales_cnss,
  }), { brut: 0, net: 0, cnss: 0 });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Bulletins de paie — {MOIS[mois - 1]} {annee}</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={String(mois)} onValueChange={v => setMois(Number(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MOIS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(annee)} onValueChange={v => setAnnee(Number(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[annee - 1, annee, annee + 1].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleGenerate} disabled={generatePayroll.isPending}>
              {generatePayroll.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Générer la paie
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : bulletins.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun bulletin pour cette période. Cliquez sur "Générer la paie" pour créer les bulletins.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-sm text-muted-foreground">Masse salariale brute</div>
                <div className="text-lg font-bold">{formatMontant(totals.brut)}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-sm text-muted-foreground">Net à payer total</div>
                <div className="text-lg font-bold">{formatMontant(totals.net)}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-sm text-muted-foreground">Charges sociales totales</div>
                <div className="text-lg font-bold">{formatMontant(totals.cnss)}</div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead className="text-right">Salaire base</TableHead>
                  <TableHead className="text-right">Primes</TableHead>
                  <TableHead className="text-right">Brut</TableHead>
                  <TableHead className="text-right">Net à payer</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulletins.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      {b.personnel?.prenoms} {b.personnel?.noms}
                    </TableCell>
                    <TableCell>{b.personnel?.role}</TableCell>
                    <TableCell className="text-right">{formatMontant(b.salaire_base)}</TableCell>
                    <TableCell className="text-right">{formatMontant(b.primes)}</TableCell>
                    <TableCell className="text-right">{formatMontant(b.salaire_brut)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatMontant(b.net_a_payer)}</TableCell>
                    <TableCell>{statusBadge(b.statut)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {b.statut === 'Brouillon' && (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => setEditBulletin({ ...b })}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => validateBulletin.mutate(b.id)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteBulletin.mutate(b.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {b.statut === 'Validé' && (
                          <Button size="sm" variant="outline" onClick={() => setPayDialog(b)}>
                            <CreditCard className="h-4 w-4 mr-1" /> Payer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editBulletin} onOpenChange={() => setEditBulletin(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le bulletin — {editBulletin?.personnel?.prenoms} {editBulletin?.personnel?.noms}</DialogTitle>
            </DialogHeader>
            {editBulletin && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Salaire de base</Label>
                    <Input type="number" value={editBulletin.salaire_base} onChange={e => setEditBulletin({ ...editBulletin, salaire_base: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Primes</Label>
                    <Input type="number" value={editBulletin.primes} onChange={e => setEditBulletin({ ...editBulletin, primes: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Heures supplémentaires</Label>
                    <Input type="number" value={editBulletin.heures_sup} onChange={e => setEditBulletin({ ...editBulletin, heures_sup: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Avances</Label>
                    <Input type="number" value={editBulletin.avances} onChange={e => setEditBulletin({ ...editBulletin, avances: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Retenues autres</Label>
                    <Input type="number" value={editBulletin.retenues_autres} onChange={e => setEditBulletin({ ...editBulletin, retenues_autres: Number(e.target.value) })} />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditBulletin(null)}>Annuler</Button>
              <Button onClick={handleSaveEdit}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pay Dialog */}
        <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enregistrer le paiement — {payDialog?.personnel?.prenoms} {payDialog?.personnel?.noms}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-lg font-semibold text-center">
                Net à payer : {payDialog && formatMontant(payDialog.net_a_payer)}
              </div>
              <div>
                <Label>Mode de paiement</Label>
                <Select value={payMode} onValueChange={setPayMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Espèces">Espèces</SelectItem>
                    <SelectItem value="Virement">Virement bancaire</SelectItem>
                    <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                    <SelectItem value="Chèque">Chèque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Référence (optionnel)</Label>
                <Input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="N° virement, référence..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayDialog(null)}>Annuler</Button>
              <Button onClick={handlePay}>Confirmer le paiement</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BulletinsList;
