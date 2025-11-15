import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReportData {
  session: any;
  summary: any;
  movements: any[];
  pharmacy: any;
  printSettings: any;
}

const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`;
};

export const printCashReport = (data: ReportData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = generateReportHTML(data);
  printWindow.document.write(html);
  printWindow.document.close();
  
  printWindow.onload = () => {
    printWindow.print();
  };
};

export const exportToPDF = (data: ReportData) => {
  const { session, summary, movements, pharmacy, printSettings } = data;
  
  const doc = new jsPDF({
    orientation: printSettings?.orientation || 'portrait',
    unit: 'mm',
    format: printSettings?.paperSize || 'A4'
  });

  const margin = printSettings?.margin || 10;
  let yPos = margin;

  // Header avec logo si disponible
  if (printSettings?.logoEnabled && pharmacy?.logo_url) {
    try {
      doc.addImage(pharmacy.logo_url, 'PNG', margin, yPos, 30, 30);
      yPos += 35;
    } catch (e) {
      console.warn('Logo non chargé');
    }
  }

  // Informations entreprise
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(pharmacy?.nom_pharmacie || 'Pharmacie', margin, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (pharmacy?.adresse) {
    doc.text(pharmacy.adresse, margin, yPos);
    yPos += 5;
  }
  if (pharmacy?.telephone_appel) {
    doc.text(`Tél: ${pharmacy.telephone_appel}`, margin, yPos);
    yPos += 5;
  }
  if (pharmacy?.email) {
    doc.text(`Email: ${pharmacy.email}`, margin, yPos);
    yPos += 10;
  }

  // Titre du rapport
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport de Session de Caisse', margin, yPos);
  yPos += 10;

  // Informations session
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Session #${session.numero_session}`, margin, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Agent: ${session.caissier?.prenoms || ''} ${session.caissier?.noms || ''}`, margin, yPos);
  yPos += 5;
  doc.text(`Période: ${format(new Date(session.date_ouverture), 'dd/MM/yyyy HH:mm', { locale: fr })}`, margin, yPos);
  yPos += 5;
  if (session.date_fermeture) {
    doc.text(`au ${format(new Date(session.date_fermeture), 'dd/MM/yyyy HH:mm', { locale: fr })}`, margin + 20, yPos);
    yPos += 5;
  }
  doc.text(`Statut: ${session.statut}`, margin, yPos);
  yPos += 10;

  // Résumé financier - Tableau
  const summaryData = [
    ['Montant d\'ouverture', formatCurrency(summary.openingAmount)],
    ['+ Ventes', formatCurrency(summary.totalSales)],
    ['+ Entrées', formatCurrency(summary.totalEntries)],
    ['- Sorties', formatCurrency(summary.totalExits)],
    ['- Dépenses', formatCurrency(summary.totalExpenses)]
  ];

  if (summary.totalRefunds > 0) {
    summaryData.push(['- Remboursements', formatCurrency(summary.totalRefunds)]);
  }

  if (summary.totalAdjustments !== 0) {
    summaryData.push([
      `${summary.totalAdjustments > 0 ? '+' : '-'} Ajustements`,
      formatCurrency(Math.abs(summary.totalAdjustments))
    ]);
  }

  summaryData.push(
    ['Solde théorique', formatCurrency(summary.theoreticalClosing)],
    ['Solde réel', formatCurrency(summary.actualClosing)],
    ['Écart', formatCurrency(summary.variance)]
  );

  autoTable(doc, {
    startY: yPos,
    head: [['Résumé Financier', 'Montant']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontSize: 11 },
    styles: { fontSize: 10 },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Mouvements - Tableau
  if (movements && movements.length > 0) {
    const movementsData = movements.map(m => [
      format(new Date(m.date_mouvement), 'dd/MM/yyyy HH:mm', { locale: fr }),
      m.type_mouvement,
      m.description || '-',
      formatCurrency(m.montant)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Type', 'Description', 'Montant']],
      body: movementsData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontSize: 10 },
      styles: { fontSize: 9 },
      margin: { left: margin, right: margin }
    });
  }

  // Footer
  if (printSettings?.footerEnabled) {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${i} sur ${pageCount} - ${printSettings?.footerText || ''}`,
        margin,
        doc.internal.pageSize.height - 10
      );
    }
  }

  // Sauvegarder
  doc.save(`Rapport-Session-${session.numero_session}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`);
};

const generateReportHTML = (data: ReportData): string => {
  const { session, summary, movements, pharmacy } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Rapport Session ${session.numero_session}</title>
      <style>
        @media print {
          body { margin: 0; padding: 20mm; }
          .no-print { display: none; }
          @page { margin: 0; }
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 12pt;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .company-name {
          font-size: 24pt;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .report-title {
          font-size: 18pt;
          font-weight: bold;
          margin: 20px 0;
        }
        .info-section {
          margin: 20px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #3b82f6;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .amount {
          text-align: right;
          font-weight: bold;
        }
        .variance {
          color: ${summary.variance >= 0 ? '#16a34a' : '#dc2626'};
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${pharmacy?.nom_pharmacie || 'Pharmacie'}</div>
        <div>${pharmacy?.adresse || ''}</div>
        <div>Tél: ${pharmacy?.telephone_appel || ''} | Email: ${pharmacy?.email || ''}</div>
      </div>
      
      <div class="report-title">Rapport de Session de Caisse</div>
      
      <div class="info-section">
        <strong>Session:</strong> #${session.numero_session}<br>
        <strong>Agent:</strong> ${session.caissier?.prenoms || ''} ${session.caissier?.noms || ''}<br>
        <strong>Période:</strong> ${format(new Date(session.date_ouverture), 'dd/MM/yyyy HH:mm', { locale: fr })}
        ${session.date_fermeture ? ` au ${format(new Date(session.date_fermeture), 'dd/MM/yyyy HH:mm', { locale: fr })}` : ''}<br>
        <strong>Statut:</strong> ${session.statut}
      </div>

      <h3>Résumé Financier</h3>
      <table>
        <tr>
          <th>Libellé</th>
          <th class="amount">Montant</th>
        </tr>
        <tr>
          <td>Montant d'ouverture</td>
          <td class="amount">${formatCurrency(summary.openingAmount)}</td>
        </tr>
        <tr>
          <td>+ Ventes</td>
          <td class="amount">${formatCurrency(summary.totalSales)}</td>
        </tr>
        <tr>
          <td>+ Entrées</td>
          <td class="amount">${formatCurrency(summary.totalEntries)}</td>
        </tr>
        <tr>
          <td>- Sorties</td>
          <td class="amount">${formatCurrency(summary.totalExits)}</td>
        </tr>
        <tr>
          <td>- Dépenses</td>
          <td class="amount">${formatCurrency(summary.totalExpenses)}</td>
        </tr>
        ${summary.totalRefunds > 0 ? `
          <tr>
            <td>- Remboursements</td>
            <td class="amount">${formatCurrency(summary.totalRefunds)}</td>
          </tr>
        ` : ''}
        ${summary.totalAdjustments !== 0 ? `
          <tr>
            <td>${summary.totalAdjustments > 0 ? '+' : '-'} Ajustements</td>
            <td class="amount">${formatCurrency(Math.abs(summary.totalAdjustments))}</td>
          </tr>
        ` : ''}
        <tr style="background-color: #e5e7eb;">
          <td><strong>Solde théorique</strong></td>
          <td class="amount"><strong>${formatCurrency(summary.theoreticalClosing)}</strong></td>
        </tr>
        <tr>
          <td>Solde réel</td>
          <td class="amount">${formatCurrency(summary.actualClosing)}</td>
        </tr>
        <tr>
          <td><strong>Écart</strong></td>
          <td class="amount variance">${formatCurrency(summary.variance)}</td>
        </tr>
      </table>

      ${movements && movements.length > 0 ? `
        <h3>Détails des Mouvements</h3>
        <table>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Description</th>
            <th class="amount">Montant</th>
          </tr>
          ${movements.map(m => `
            <tr>
              <td>${format(new Date(m.date_mouvement), 'dd/MM/yyyy HH:mm', { locale: fr })}</td>
              <td>${m.type_mouvement}</td>
              <td>${m.description || '-'}</td>
              <td class="amount">${formatCurrency(m.montant)}</td>
            </tr>
          `).join('')}
        </table>
      ` : ''}
      
      <div style="margin-top: 40px; text-align: center; color: #666; font-size: 10pt;">
        Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}
      </div>
    </body>
    </html>
  `;
};
