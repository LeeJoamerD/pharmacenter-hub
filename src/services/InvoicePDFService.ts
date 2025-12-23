import { Invoice, InvoiceLine } from '@/hooks/useInvoiceManager';

interface ExportResult {
  url: string;
  filename: string;
}

interface RegionalInvoiceParams {
  symbole_devise?: string;
  libelle_tva?: string;
  libelle_centime_additionnel?: string;
  taux_centime_additionnel?: number;
  separateur_milliers?: string;
  separateur_decimal?: string;
  position_symbole_devise?: string;
  mentions_legales_facture?: string;
  conditions_paiement_defaut?: string;
  nom_societe?: string;
  adresse_societe?: string;
  registre_commerce?: string;
  numero_tva?: string;
  telephone_societe?: string;
  email_societe?: string;
}

// Extended Invoice interface for PDF generation
interface InvoiceWithCentime extends Invoice {
  montant_centime_additionnel?: number;
  taux_centime_additionnel?: number;
}

export class InvoicePDFService {
  static async generateInvoicePDF(
    invoice: Invoice, 
    lines: InvoiceLine[] = [], 
    regionalParams?: RegionalInvoiceParams | null
  ): Promise<ExportResult> {
    const html = this.generateInvoiceHTML(invoice, lines, regionalParams);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const filename = `facture-${invoice.numero}-${new Date().toISOString().split('T')[0]}.html`;
    
    return { url, filename };
  }

  private static generateInvoiceHTML(
    invoice: Invoice, 
    lines: InvoiceLine[], 
    regionalParams?: RegionalInvoiceParams | null
  ): string {
    const isClient = invoice.type === 'client';
    const clientName = isClient ? invoice.client_nom : invoice.fournisseur_nom;
    const clientPhone = isClient ? invoice.client_telephone : invoice.fournisseur_telephone;
    const clientEmail = isClient ? invoice.client_email : invoice.fournisseur_email;
    const clientAddress = isClient ? invoice.client_adresse : invoice.fournisseur_adresse;

    // Regional formatting
    const devise = regionalParams?.symbole_devise || 'FCFA';
    const tvaLabel = regionalParams?.libelle_tva || 'TVA';
    const companyInfo = {
      nom: regionalParams?.nom_societe || 'PharmaSoft',
      adresse: regionalParams?.adresse_societe || 'Système de Gestion Pharmaceutique',
      rc: regionalParams?.registre_commerce || '',
      tva: regionalParams?.numero_tva || '',
      tel: regionalParams?.telephone_societe || '',
      email: regionalParams?.email_societe || '',
    };

    const formatAmount = (amount: number): string => {
      if (!regionalParams) return `${amount.toFixed(2)} FCFA`;
      
      const formatted = amount.toFixed(2);
      const [integer, decimal] = formatted.split('.');
      const integerFormatted = integer.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        regionalParams.separateur_milliers || ' '
      );
      const numberFormatted = `${integerFormatted}${regionalParams.separateur_decimal || ','}${decimal}`;
      
      if (regionalParams.position_symbole_devise === 'before') {
        return `${devise} ${numberFormatted}`;
      }
      return `${numberFormatted} ${devise}`;
    };

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${invoice.numero}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      background: #f5f5f5;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 60px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
    }
    .company-info h1 {
      color: #2563eb;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h2 {
      font-size: 32px;
      color: #333;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-size: 18px;
      color: #666;
      margin-bottom: 5px;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      gap: 40px;
    }
    .party {
      flex: 1;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .party h3 {
      color: #2563eb;
      margin-bottom: 10px;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .party p {
      margin-bottom: 5px;
      color: #555;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    thead {
      background: #2563eb;
      color: white;
    }
    th {
      padding: 15px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
    th.text-right { text-align: right; }
    td {
      padding: 12px 15px;
      border-bottom: 1px solid #e0e0e0;
    }
    td.text-right { text-align: right; }
    tbody tr:hover {
      background: #f8f9fa;
    }
    .totals {
      margin-left: auto;
      width: 350px;
      margin-top: 30px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .total-row.subtotal {
      font-size: 16px;
    }
    .total-row.tax {
      font-size: 16px;
      color: #666;
    }
    .total-row.grand {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      border-top: 3px solid #2563eb;
      border-bottom: 3px double #2563eb;
      padding-top: 15px;
      margin-top: 10px;
    }
    .payment-info {
      margin-top: 40px;
      padding: 20px;
      background: #f8f9fa;
      border-left: 4px solid #2563eb;
      border-radius: 4px;
    }
    .payment-info h3 {
      color: #2563eb;
      margin-bottom: 15px;
      font-size: 16px;
    }
    .payment-status {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      margin-top: 10px;
    }
    .payment-status.paid {
      background: #d1fae5;
      color: #065f46;
    }
    .payment-status.partial {
      background: #fed7aa;
      color: #92400e;
    }
    .payment-status.unpaid {
      background: #fee2e2;
      color: #991b1b;
    }
    .notes {
      margin-top: 40px;
      padding: 20px;
      background: #fffbeb;
      border-radius: 8px;
      border: 1px solid #fbbf24;
    }
    .notes h3 {
      color: #92400e;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .notes p {
      color: #78350f;
      font-size: 14px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge.client {
      background: #dbeafe;
      color: #1e40af;
    }
    .badge.fournisseur {
      background: #fce7f3;
      color: #9f1239;
    }
    @media print {
      body { padding: 0; background: white; }
      .container { box-shadow: none; padding: 40px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-info">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
          <img src="/images/logo-pharmasoft.png" alt="PharmaSoft" style="height: 50px; width: 50px; object-fit: contain;" onerror="this.style.display='none'" />
          <h1 style="margin: 0;">${companyInfo.nom}</h1>
        </div>
        ${companyInfo.adresse ? `<p>${companyInfo.adresse}</p>` : ''}
        ${companyInfo.rc ? `<p>RC: ${companyInfo.rc}</p>` : ''}
        ${companyInfo.tva ? `<p>${tvaLabel}: ${companyInfo.tva}</p>` : ''}
        ${companyInfo.tel ? `<p>Tél: ${companyInfo.tel}</p>` : ''}
        ${companyInfo.email ? `<p>Email: ${companyInfo.email}</p>` : ''}
      </div>
      <div class="invoice-info">
        <h2>FACTURE</h2>
        <div class="invoice-number">N° ${invoice.numero}</div>
        <div class="badge ${invoice.type}">${isClient ? 'Client' : 'Fournisseur'}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>${isClient ? 'Facturé à' : 'De'}</h3>
        <p><strong>${clientName || 'N/A'}</strong></p>
        ${clientAddress ? `<p>${clientAddress}</p>` : ''}
        ${clientPhone ? `<p>Tél: ${clientPhone}</p>` : ''}
        ${clientEmail ? `<p>Email: ${clientEmail}</p>` : ''}
      </div>
      <div class="party">
        <h3>Informations</h3>
        <p><strong>Date d'émission:</strong> ${new Date(invoice.date_emission).toLocaleDateString('fr-FR')}</p>
        <p><strong>Date d'échéance:</strong> ${new Date(invoice.date_echeance).toLocaleDateString('fr-FR')}</p>
        <p><strong>Libellé:</strong> ${invoice.libelle}</p>
        ${invoice.reference_externe ? `<p><strong>Référence:</strong> ${invoice.reference_externe}</p>` : ''}
      </div>
    </div>

    ${lines.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th style="width: 50%;">Désignation</th>
          <th class="text-right" style="width: 10%;">Quantité</th>
          <th class="text-right" style="width: 15%;">Prix unitaire</th>
          <th class="text-right" style="width: 10%;">TVA</th>
          <th class="text-right" style="width: 15%;">Montant TTC</th>
        </tr>
      </thead>
      <tbody>
        ${lines.map(line => `
          <tr>
            <td>${line.designation}</td>
            <td class="text-right">${line.quantite}</td>
            <td class="text-right">${formatAmount(line.prix_unitaire)}</td>
            <td class="text-right">${line.taux_tva}%</td>
            <td class="text-right"><strong>${formatAmount(line.montant_ttc)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p style="text-align: center; color: #999; padding: 40px 0;">Aucune ligne de détail</p>'}

    <div class="totals">
      <div class="total-row subtotal">
        <span>Sous-total HT:</span>
        <span>${formatAmount(invoice.montant_ht)}</span>
      </div>
      <div class="total-row tax">
        <span>${tvaLabel}:</span>
        <span>${formatAmount(invoice.montant_tva)}</span>
      </div>
      ${((invoice as InvoiceWithCentime).montant_centime_additionnel && (invoice as InvoiceWithCentime).montant_centime_additionnel! > 0) ? `
      <div class="total-row tax" style="color: #d97706;">
        <span>${regionalParams?.libelle_centime_additionnel || 'Centime Additionnel'} (${(invoice as InvoiceWithCentime).taux_centime_additionnel || regionalParams?.taux_centime_additionnel || 5}%):</span>
        <span>${formatAmount((invoice as InvoiceWithCentime).montant_centime_additionnel || 0)}</span>
      </div>
      ` : ''}
      <div class="total-row grand">
        <span>TOTAL TTC:</span>
        <span>${formatAmount(invoice.montant_ttc)}</span>
      </div>
    </div>

    <div class="payment-info">
      <h3>Informations de Paiement</h3>
      <p><strong>Montant payé:</strong> ${formatAmount(invoice.montant_paye)}</p>
      <p><strong>Montant restant:</strong> ${formatAmount(invoice.montant_restant)}</p>
      <span class="payment-status ${invoice.statut_paiement === 'payee' ? 'paid' : invoice.statut_paiement === 'partielle' ? 'partial' : 'unpaid'}">
        ${invoice.statut_paiement === 'payee' ? 'PAYÉE' : invoice.statut_paiement === 'partielle' ? 'PARTIELLEMENT PAYÉE' : 'IMPAYÉE'}
      </span>
    </div>

    ${regionalParams?.conditions_paiement_defaut ? `
    <div class="payment-info">
      <h3>Conditions de paiement</h3>
      <p>${regionalParams.conditions_paiement_defaut}</p>
    </div>
    ` : ''}

    ${invoice.notes ? `
    <div class="notes">
      <h3>Notes</h3>
      <p>${invoice.notes}</p>
    </div>
    ` : ''}

    ${regionalParams?.mentions_legales_facture ? `
    <div class="notes">
      <h3>Mentions légales</h3>
      <p>${regionalParams.mentions_legales_facture.replace(/\n/g, '<br>')}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
      <p>${companyInfo.nom} - ${companyInfo.adresse || 'Système de Gestion Pharmaceutique'}</p>
    </div>
  </div>

  <script>
    // Auto-print on load (optional)
    // window.onload = () => window.print();
  </script>
</body>
</html>
    `;
  }
}
