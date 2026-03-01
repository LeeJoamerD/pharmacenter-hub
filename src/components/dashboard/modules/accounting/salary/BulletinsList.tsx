import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Check, CreditCard, Trash2, Edit, Loader2, FileText } from 'lucide-react';
import {
  useSalaryManager, BulletinPaie,
  DetailPrimesImposables, DetailPrimesNonImposables, DetailRetenues,
  PRIME_IMPOSABLE_LABELS, PRIME_NON_IMPOSABLE_LABELS, RETENUE_LABELS,
  DEFAULT_PRIMES_IMPOSABLES, DEFAULT_PRIMES_NON_IMPOSABLES, DEFAULT_RETENUES,
  sumActivePrimes, sumActivePrimesNonImposables, sumActiveRetenues,
} from '@/hooks/useSalaryManager';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrencyAmount } from '@/utils/currencyFormatter';

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const generateBulletinPDF = async (bulletin: BulletinPaie, tenantId: string) => {
  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('name, address, city, telephone_appel, email')
    .eq('id', tenantId)
    .single();

  const doc = new jsPDF();
  const fmt = (n: number) => formatCurrencyAmount(n, 'FCFA');
  const periodeLabel = `${MOIS[(bulletin.periode_mois || 1) - 1]} ${bulletin.periode_annee}`;
  const employeNom = bulletin.personnel ? `${bulletin.personnel.prenoms} ${bulletin.personnel.noms}` : 'Employé';

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(pharmacy?.name || 'Entreprise', 14, 20);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (pharmacy?.address) doc.text(pharmacy.address, 14, 26);
  if (pharmacy?.city) doc.text(pharmacy.city, 14, 31);
  if (pharmacy?.telephone_appel) doc.text(`Tel: ${pharmacy.telephone_appel}`, 14, 36);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BULLETIN DE PAIE', 105, 20, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`Période : ${periodeLabel}`, 196, 20, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const yStart = 45;
  doc.text(`Employé : ${employeNom}`, 14, yStart);
  doc.text(`Poste : ${bulletin.personnel?.role || '-'}`, 14, yStart + 5);
  doc.text(`N° CNSS : ${bulletin.personnel?.numero_cnss || '-'}`, 14, yStart + 10);
  doc.text(`Qté Présences : ${bulletin.qte_presences || 26} jours`, 14, yStart + 15);
  doc.text(`Statut : ${bulletin.personnel?.statut_contractuel || '-'}`, 120, yStart);
  doc.text(`Situation : ${bulletin.personnel?.situation_familiale || '-'}`, 120, yStart + 5);
  if (bulletin.personnel?.nombre_enfants != null) {
    doc.text(`Enfants : ${bulletin.personnel.nombre_enfants}`, 120, yStart + 10);
  }

  // Build table rows
  const tableData: string[][] = [];
  tableData.push(['Salaire de base', fmt(bulletin.salaire_base), '']);

  // Active primes imposables
  const pi = bulletin.detail_primes_imposables || DEFAULT_PRIMES_IMPOSABLES;
  for (const [key, label] of Object.entries(PRIME_IMPOSABLE_LABELS)) {
    const item = pi[key as keyof DetailPrimesImposables];
    if (item?.actif && item.montant > 0) {
      let lbl = label;
      if (key === 'anciennete' && item.annees) lbl += ` (${item.annees} ans)`;
      if (key.startsWith('heures_sup_') && item.qte) lbl += ` (${item.qte}h)`;
      if (key === 'autres' && item.description) lbl += ` - ${item.description}`;
      tableData.push([lbl, fmt(item.montant), '']);
    }
  }

  if (bulletin.heures_sup > 0) {
    tableData.push(['Heures supplémentaires (ancien)', fmt(bulletin.heures_sup), '']);
  }

  tableData.push(['SALAIRE BRUT', fmt(bulletin.salaire_brut), '']);

  // Congés payés
  if (bulletin.conges_payes > 0) {
    tableData.push(['Congés payés', fmt(bulletin.conges_payes), '']);
  }

  // Primes non imposables
  const pni = bulletin.detail_primes_non_imposables || DEFAULT_PRIMES_NON_IMPOSABLES;
  for (const [key, label] of Object.entries(PRIME_NON_IMPOSABLE_LABELS)) {
    const item = pni[key as keyof DetailPrimesNonImposables];
    if (item?.actif && item.montant > 0) {
      let lbl = label;
      if (key === 'autres' && item.description) lbl += ` - ${item.description}`;
      tableData.push([lbl, fmt(item.montant), '']);
    }
  }

  tableData.push(['', '', '']);
  tableData.push(['Retenue CNSS (part salariale)', '', fmt(bulletin.retenues_cnss_employe)]);
  tableData.push(['Retenue IRPP', '', fmt(bulletin.retenues_irpp)]);

  // Detailed retenues
  const dr = bulletin.detail_retenues || DEFAULT_RETENUES;
  for (const [key, label] of Object.entries(RETENUE_LABELS)) {
    const item = dr[key as keyof DetailRetenues];
    if (item?.actif && item.montant > 0) {
      let lbl = label;
      if (key === 'autres' && item.description) lbl += ` - ${item.description}`;
      tableData.push([lbl, '', fmt(item.montant)]);
    }
  }

  tableData.push(['', '', '']);
  tableData.push(['SALAIRE NET', fmt(bulletin.salaire_net), '']);
  if (bulletin.avances > 0) tableData.push(['Avances', '', fmt(bulletin.avances)]);
  if (bulletin.acompte > 0) tableData.push(['Acompte', '', fmt(bulletin.acompte)]);
  tableData.push(['', '', '']);
  tableData.push(['NET A PAYER', fmt(bulletin.net_a_payer), '']);

  autoTable(doc, {
    startY: yStart + 22,
    head: [['Libellé', 'Gains', 'Retenues']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 40, halign: 'right' },
      2: { cellWidth: 40, halign: 'right' },
    },
    didParseCell: (data: any) => {
      const text = data.cell.raw as string;
      if (text === 'SALAIRE BRUT' || text === 'SALAIRE NET' || text === 'NET A PAYER') {
        data.cell.styles.fontStyle = 'bold';
        if (text === 'NET A PAYER') {
          data.cell.styles.fillColor = [236, 240, 241];
        }
      }
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Charges patronales :', 14, finalY);
  doc.setFont('helvetica', 'normal');
  doc.text(`CNSS patronale : ${fmt(bulletin.cotisations_patronales_cnss)}`, 14, finalY + 5);
  doc.text(`Autres charges : ${fmt(bulletin.cotisations_patronales_autres)}`, 14, finalY + 10);
  doc.text(`Coût total employeur : ${fmt(bulletin.salaire_brut + bulletin.cotisations_patronales_cnss + bulletin.cotisations_patronales_autres)}`, 14, finalY + 15);

  if (bulletin.statut === 'Payé') {
    doc.text(`Mode de paiement : ${bulletin.mode_paiement || '-'}`, 120, finalY);
    doc.text(`Date de paiement : ${bulletin.date_paiement || '-'}`, 120, finalY + 5);
    if (bulletin.reference_paiement) doc.text(`Référence : ${bulletin.reference_paiement}`, 120, finalY + 10);
  }

  doc.setFontSize(8);
  doc.text('Document généré automatiquement - Confidentiel', 105, 285, { align: 'center' });
  doc.save(`Bulletin_${employeNom.replace(/\s+/g, '_')}_${periodeLabel.replace(/\s+/g, '_')}.pdf`);
};

// --- Prime toggle row component ---
const PrimeRow = ({ label, actif, montant, onToggle, onMontantChange, extraFields }: {
  label: string;
  actif: boolean;
  montant: number;
  onToggle: (v: boolean) => void;
  onMontantChange: (v: number) => void;
  extraFields?: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 py-1.5">
    <Switch checked={actif} onCheckedChange={onToggle} />
    <span className="text-sm w-44 shrink-0">{label}</span>
    <Input
      type="number"
      className="h-8 text-sm w-32"
      value={montant}
      onChange={e => onMontantChange(Number(e.target.value))}
      disabled={!actif}
    />
    {extraFields}
  </div>
);

const BulletinsList = () => {
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [editBulletin, setEditBulletin] = useState<BulletinPaie | null>(null);
  const [payDialog, setPayDialog] = useState<BulletinPaie | null>(null);
  const [payMode, setPayMode] = useState('Espèces');
  const [payRef, setPayRef] = useState('');

  const { fetchBulletins, generatePayroll, updateBulletin, validateBulletin, payBulletin, deleteBulletin, tenantId, parametres } = useSalaryManager();
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

  // --- Edit helpers ---
  const updateEditPI = (key: keyof DetailPrimesImposables, field: string, value: any) => {
    if (!editBulletin) return;
    const pi = { ...editBulletin.detail_primes_imposables };
    pi[key] = { ...pi[key], [field]: value };
    setEditBulletin({ ...editBulletin, detail_primes_imposables: pi });
  };

  const updateEditPNI = (key: keyof DetailPrimesNonImposables, field: string, value: any) => {
    if (!editBulletin) return;
    const pni = { ...editBulletin.detail_primes_non_imposables };
    pni[key] = { ...pni[key], [field]: value };
    setEditBulletin({ ...editBulletin, detail_primes_non_imposables: pni });
  };

  const updateEditRet = (key: keyof DetailRetenues, field: string, value: any) => {
    if (!editBulletin) return;
    const dr = { ...editBulletin.detail_retenues };
    dr[key] = { ...dr[key], [field]: value };
    setEditBulletin({ ...editBulletin, detail_retenues: dr });
  };

  const handleSaveEdit = () => {
    if (!editBulletin) return;
    updateBulletin.mutate({
      id: editBulletin.id,
      salaire_base: editBulletin.salaire_base,
      heures_sup: editBulletin.heures_sup,
      avances: editBulletin.avances,
      acompte: editBulletin.acompte,
      conges_payes: editBulletin.conges_payes,
      qte_presences: editBulletin.qte_presences,
      detail_primes_imposables: editBulletin.detail_primes_imposables,
      detail_primes_non_imposables: editBulletin.detail_primes_non_imposables,
      detail_retenues: editBulletin.detail_retenues,
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
                        {(b.statut === 'Validé' || b.statut === 'Payé') && tenantId && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Télécharger PDF"
                            onClick={() => generateBulletinPDF(b, tenantId)}
                          >
                            <FileText className="h-4 w-4" />
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

        {/* Edit Dialog — Enriched */}
        <Dialog open={!!editBulletin} onOpenChange={() => setEditBulletin(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] p-0">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle>Modifier le bulletin — {editBulletin?.personnel?.prenoms} {editBulletin?.personnel?.noms}</DialogTitle>
            </DialogHeader>
            {editBulletin && (
              <ScrollArea className="px-6 pb-2" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                <div className="space-y-6 py-2">
                  {/* Salaire de base & Présences */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Salaire de base</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Salaire de base</Label>
                        <Input type="number" value={editBulletin.salaire_base} onChange={e => setEditBulletin({ ...editBulletin, salaire_base: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label className="text-xs">Qté Présences (jours)</Label>
                        <Input type="number" value={editBulletin.qte_presences} onChange={e => setEditBulletin({ ...editBulletin, qte_presences: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label className="text-xs">Heures Supp. (ancien)</Label>
                        <Input type="number" value={editBulletin.heures_sup} onChange={e => setEditBulletin({ ...editBulletin, heures_sup: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>

                  {/* Primes Imposables */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Primes imposables</h4>
                    <div className="space-y-1 border rounded-lg p-3">
                      {(Object.entries(PRIME_IMPOSABLE_LABELS) as [keyof DetailPrimesImposables, string][]).map(([key, label]) => {
                        const item = editBulletin.detail_primes_imposables[key];
                        return (
                          <PrimeRow
                            key={key}
                            label={label}
                            actif={item.actif}
                            montant={item.montant}
                            onToggle={v => updateEditPI(key, 'actif', v)}
                            onMontantChange={v => updateEditPI(key, 'montant', v)}
                            extraFields={
                              <>
                                {key === 'anciennete' && item.actif && (
                                  <div className="flex items-center gap-1">
                                    <Label className="text-xs">Ans</Label>
                                    <Input type="number" className="h-8 w-16 text-sm" value={item.annees || 0}
                                      onChange={e => updateEditPI(key, 'annees', Number(e.target.value))} />
                                  </div>
                                )}
                                {key.startsWith('heures_sup_') && item.actif && (
                                  <div className="flex items-center gap-1">
                                    <Label className="text-xs">Qté</Label>
                                    <Input type="number" className="h-8 w-16 text-sm" value={item.qte || 0}
                                      onChange={e => updateEditPI(key, 'qte', Number(e.target.value))} />
                                  </div>
                                )}
                                {key === 'autres' && item.actif && (
                                  <Input placeholder="Description" className="h-8 text-sm flex-1" value={item.description || ''}
                                    onChange={e => updateEditPI(key, 'description', e.target.value)} />
                                )}
                              </>
                            }
                          />
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total primes imposables : {formatMontant(sumActivePrimes(editBulletin.detail_primes_imposables))}
                    </p>
                  </div>

                  {/* Primes Non Imposables */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Primes non imposables</h4>
                    <div className="space-y-1 border rounded-lg p-3">
                      {(Object.entries(PRIME_NON_IMPOSABLE_LABELS) as [keyof DetailPrimesNonImposables, string][]).map(([key, label]) => {
                        const item = editBulletin.detail_primes_non_imposables[key];
                        return (
                          <PrimeRow
                            key={key}
                            label={label}
                            actif={item.actif}
                            montant={item.montant}
                            onToggle={v => updateEditPNI(key, 'actif', v)}
                            onMontantChange={v => updateEditPNI(key, 'montant', v)}
                            extraFields={
                              key === 'autres' && item.actif ? (
                                <Input placeholder="Description" className="h-8 text-sm flex-1" value={item.description || ''}
                                  onChange={e => updateEditPNI(key, 'description', e.target.value)} />
                              ) : undefined
                            }
                          />
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total non imposables : {formatMontant(sumActivePrimesNonImposables(editBulletin.detail_primes_non_imposables))}
                    </p>
                  </div>

                  {/* Congés payés */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Congés payés</h4>
                    <div className="flex items-center gap-3 border rounded-lg p-3">
                      <Switch
                        checked={editBulletin.conges_payes > 0}
                        onCheckedChange={v => {
                          if (v) {
                            const taux = parametres?.taux_conge_paye ?? 8.33;
                            const brut = editBulletin.salaire_base + sumActivePrimes(editBulletin.detail_primes_imposables);
                            setEditBulletin({ ...editBulletin, conges_payes: Math.round(brut * taux / 100) });
                          } else {
                            setEditBulletin({ ...editBulletin, conges_payes: 0 });
                          }
                        }}
                      />
                      <span className="text-sm">Congés payés</span>
                      <Input
                        type="number"
                        className="h-8 text-sm w-32"
                        value={editBulletin.conges_payes}
                        onChange={e => setEditBulletin({ ...editBulletin, conges_payes: Number(e.target.value) })}
                        disabled={editBulletin.conges_payes === 0}
                      />
                    </div>
                  </div>

                  {/* Retenues */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Retenues additionnelles</h4>
                    <div className="space-y-1 border rounded-lg p-3">
                      {(Object.entries(RETENUE_LABELS) as [keyof DetailRetenues, string][]).map(([key, label]) => {
                        const item = editBulletin.detail_retenues[key];
                        return (
                          <PrimeRow
                            key={key}
                            label={label}
                            actif={item.actif}
                            montant={item.montant}
                            onToggle={v => updateEditRet(key, 'actif', v)}
                            onMontantChange={v => updateEditRet(key, 'montant', v)}
                            extraFields={
                              key === 'autres' && item.actif ? (
                                <Input placeholder="Description" className="h-8 text-sm flex-1" value={item.description || ''}
                                  onChange={e => updateEditRet(key, 'description', e.target.value)} />
                              ) : undefined
                            }
                          />
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total retenues : {formatMontant(sumActiveRetenues(editBulletin.detail_retenues))}
                    </p>
                  </div>

                  {/* Avances & Acompte */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Avances & Acompte</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Avances</Label>
                        <Input type="number" value={editBulletin.avances} onChange={e => setEditBulletin({ ...editBulletin, avances: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label className="text-xs">Acompte</Label>
                        <Input type="number" value={editBulletin.acompte} onChange={e => setEditBulletin({ ...editBulletin, acompte: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
            <DialogFooter className="px-6 py-4 border-t">
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
