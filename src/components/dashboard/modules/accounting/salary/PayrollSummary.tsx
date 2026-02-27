import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, FileSpreadsheet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePersonnel } from '@/hooks/usePersonnel';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const PayrollSummary = () => {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const { currentPersonnel } = usePersonnel();
  const tenantId = currentPersonnel?.tenant_id;

  const { data: bulletins = [], isLoading } = useQuery({
    queryKey: ['bulletins-paie-annuel', tenantId, annee],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('bulletins_paie')
        .select('periode_mois, salaire_brut, salaire_net, net_a_payer, retenues_cnss_employe, cotisations_patronales_cnss, retenues_irpp, statut')
        .eq('tenant_id', tenantId)
        .eq('periode_annee', annee);
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  const monthlySummary = MOIS.map((nom, i) => {
    const moisBulletins = bulletins.filter(b => b.periode_mois === i + 1);
    return {
      mois: nom,
      count: moisBulletins.length,
      brut: moisBulletins.reduce((s, b) => s + Number(b.salaire_brut), 0),
      net: moisBulletins.reduce((s, b) => s + Number(b.net_a_payer), 0),
      cnss: moisBulletins.reduce((s, b) => s + Number(b.retenues_cnss_employe) + Number(b.cotisations_patronales_cnss), 0),
      irpp: moisBulletins.reduce((s, b) => s + Number(b.retenues_irpp), 0),
      payes: moisBulletins.filter(b => b.statut === 'Payé').length,
    };
  });

  const annualTotal = monthlySummary.reduce((acc, m) => ({
    brut: acc.brut + m.brut, net: acc.net + m.net, cnss: acc.cnss + m.cnss, irpp: acc.irpp + m.irpp,
  }), { brut: 0, net: 0, cnss: 0, irpp: 0 });

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

  const handleExportPDF = async () => {
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('name, address, city')
      .eq('id', tenantId)
      .single();

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(pharmacy?.name || 'Entreprise', 14, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (pharmacy?.address) doc.text(pharmacy.address, 14, 24);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Historique annuel de la paie - ${annee}`, 105, 38, { align: 'center' });

    const tableData = monthlySummary.map(m => [
      m.mois,
      m.count || '-',
      m.count ? fmt(m.brut) : '-',
      m.count ? fmt(m.net) : '-',
      m.count ? fmt(m.cnss) : '-',
      m.count ? fmt(m.irpp) : '-',
      m.count ? `${m.payes}/${m.count}` : '-',
    ]);

    tableData.push([
      'TOTAL ANNUEL', '',
      fmt(annualTotal.brut), fmt(annualTotal.net),
      fmt(annualTotal.cnss), fmt(annualTotal.irpp), '',
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Mois', 'Bulletins', 'Masse brute', 'Net versé', 'CNSS total', 'IRPP', 'Payés']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'center' },
      },
      didParseCell: (data: any) => {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [236, 240, 241];
        }
      },
    });

    doc.setFontSize(8);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 285);
    doc.save(`Historique_Paie_${annee}.pdf`);
  };

  const handleExportExcel = () => {
    const wsData = [
      ['Mois', 'Bulletins', 'Masse brute', 'Net versé', 'CNSS total', 'IRPP', 'Payés'],
      ...monthlySummary.map(m => [
        m.mois, m.count, m.brut, m.net, m.cnss, m.irpp, m.count ? `${m.payes}/${m.count}` : '-',
      ]),
      ['TOTAL ANNUEL', '', annualTotal.brut, annualTotal.net, annualTotal.cnss, annualTotal.irpp, ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Set column widths
    ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Paie ${annee}`);
    XLSX.writeFile(wb, `Historique_Paie_${annee}.xlsx`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Historique annuel — {annee}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={bulletins.length === 0}>
              <FileText className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={bulletins.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
            </Button>
            <Select value={String(annee)} onValueChange={v => setAnnee(Number(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[annee - 2, annee - 1, annee, annee + 1].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mois</TableHead>
                <TableHead className="text-center">Bulletins</TableHead>
                <TableHead className="text-right">Masse brute</TableHead>
                <TableHead className="text-right">Net versé</TableHead>
                <TableHead className="text-right">CNSS total</TableHead>
                <TableHead className="text-right">IRPP</TableHead>
                <TableHead className="text-center">Payés</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlySummary.map((m, i) => (
                <TableRow key={i} className={m.count === 0 ? 'opacity-40' : ''}>
                  <TableCell className="font-medium">{m.mois}</TableCell>
                  <TableCell className="text-center">{m.count || '—'}</TableCell>
                  <TableCell className="text-right">{m.count ? fmt(m.brut) : '—'}</TableCell>
                  <TableCell className="text-right">{m.count ? fmt(m.net) : '—'}</TableCell>
                  <TableCell className="text-right">{m.count ? fmt(m.cnss) : '—'}</TableCell>
                  <TableCell className="text-right">{m.count ? fmt(m.irpp) : '—'}</TableCell>
                  <TableCell className="text-center">
                    {m.count > 0 && (
                      <Badge variant={m.payes === m.count ? 'default' : 'secondary'}>
                        {m.payes}/{m.count}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold border-t-2">
                <TableCell>TOTAL ANNUEL</TableCell>
                <TableCell />
                <TableCell className="text-right">{fmt(annualTotal.brut)}</TableCell>
                <TableCell className="text-right">{fmt(annualTotal.net)}</TableCell>
                <TableCell className="text-right">{fmt(annualTotal.cnss)}</TableCell>
                <TableCell className="text-right">{fmt(annualTotal.irpp)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default PayrollSummary;
