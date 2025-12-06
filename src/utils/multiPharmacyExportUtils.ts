import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface PharmacyExportData {
  name: string;
  code: string;
  city: string;
  region: string;
  type: string;
  status: string;
  phone: string;
  email: string;
  messages_sent: number;
  active_channels: number;
}

interface AnalyticsExportData {
  topPharmacies: { name: string; messages: number; channels: number }[];
  typeDistribution: { type: string; count: number; percentage: number }[];
  monthlyActivity: { month: string; messages: number; collaborations: number }[];
}

interface CollaborationExportData {
  name: string;
  description: string;
  participants_count: number;
  status: string;
  created_at: string;
}

// Export pharmacies to Excel
export const exportPharmaciesExcel = (
  pharmacies: PharmacyExportData[],
  filename: string = 'annuaire-officines'
) => {
  const worksheet = XLSX.utils.json_to_sheet(
    pharmacies.map(p => ({
      'Nom': p.name,
      'Code': p.code,
      'Ville': p.city,
      'Région': p.region,
      'Type': p.type,
      'Statut': p.status,
      'Téléphone': p.phone,
      'Email': p.email,
      'Messages envoyés': p.messages_sent,
      'Canaux actifs': p.active_channels
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Officines');

  // Ajuster la largeur des colonnes
  const colWidths = [
    { wch: 30 }, // Nom
    { wch: 15 }, // Code
    { wch: 20 }, // Ville
    { wch: 20 }, // Région
    { wch: 15 }, // Type
    { wch: 10 }, // Statut
    { wch: 15 }, // Téléphone
    { wch: 30 }, // Email
    { wch: 15 }, // Messages
    { wch: 12 }  // Canaux
  ];
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Export pharmacies to PDF
export const exportPharmaciesPDF = (
  pharmacies: PharmacyExportData[],
  filename: string = 'annuaire-officines'
) => {
  const doc = new jsPDF('landscape');

  // Titre
  doc.setFontSize(18);
  doc.text('Annuaire des Officines', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
  doc.text(`Total: ${pharmacies.length} officines`, 14, 36);

  // Tableau
  (doc as any).autoTable({
    startY: 45,
    head: [['Nom', 'Code', 'Ville', 'Région', 'Type', 'Statut', 'Messages', 'Canaux']],
    body: pharmacies.map(p => [
      p.name,
      p.code,
      p.city,
      p.region,
      p.type,
      p.status,
      p.messages_sent,
      p.active_channels
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`${filename}.pdf`);
};

// Export analytics to Excel
export const exportAnalyticsExcel = (
  data: AnalyticsExportData,
  period: string = 'all',
  filename: string = 'analytics-reseau'
) => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Top Pharmacies
  const topPharmaciesSheet = XLSX.utils.json_to_sheet(
    data.topPharmacies.map((p, i) => ({
      'Rang': i + 1,
      'Officine': p.name,
      'Messages': p.messages,
      'Canaux': p.channels
    }))
  );
  XLSX.utils.book_append_sheet(workbook, topPharmaciesSheet, 'Top Officines');

  // Sheet 2: Distribution par type
  const typeSheet = XLSX.utils.json_to_sheet(
    data.typeDistribution.map(t => ({
      'Type': t.type,
      'Nombre': t.count,
      'Pourcentage': `${t.percentage}%`
    }))
  );
  XLSX.utils.book_append_sheet(workbook, typeSheet, 'Distribution Types');

  // Sheet 3: Activité mensuelle
  const activitySheet = XLSX.utils.json_to_sheet(
    data.monthlyActivity.map(m => ({
      'Mois': m.month,
      'Messages': m.messages,
      'Collaborations': m.collaborations
    }))
  );
  XLSX.utils.book_append_sheet(workbook, activitySheet, 'Activité Mensuelle');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Export analytics to PDF
export const exportAnalyticsPDF = (
  data: AnalyticsExportData,
  period: string = 'all',
  filename: string = 'analytics-reseau'
) => {
  const doc = new jsPDF();

  // Titre
  doc.setFontSize(18);
  doc.text('Rapport Analytics Réseau', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Période: ${period === 'all' ? 'Toutes périodes' : period}`, 14, 30);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 36);

  // Top Pharmacies
  doc.setFontSize(12);
  doc.text('Top 10 Officines par Activité', 14, 50);
  
  (doc as any).autoTable({
    startY: 55,
    head: [['Rang', 'Officine', 'Messages', 'Canaux']],
    body: data.topPharmacies.slice(0, 10).map((p, i) => [
      i + 1,
      p.name,
      p.messages,
      p.channels
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  const firstTableEnd = (doc as any).lastAutoTable.finalY || 100;

  // Distribution par type
  doc.text('Répartition par Type', 14, firstTableEnd + 15);
  
  (doc as any).autoTable({
    startY: firstTableEnd + 20,
    head: [['Type', 'Nombre', 'Pourcentage']],
    body: data.typeDistribution.map(t => [
      t.type,
      t.count,
      `${t.percentage}%`
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129] }
  });

  doc.save(`${filename}.pdf`);
};

// Export collaborations to Excel
export const exportCollaborationsExcel = (
  collaborations: CollaborationExportData[],
  filename: string = 'collaborations'
) => {
  const worksheet = XLSX.utils.json_to_sheet(
    collaborations.map(c => ({
      'Nom': c.name,
      'Description': c.description,
      'Participants': c.participants_count,
      'Statut': c.status,
      'Date création': new Date(c.created_at).toLocaleDateString('fr-FR')
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Collaborations');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Export collaborations to PDF
export const exportCollaborationsPDF = (
  collaborations: CollaborationExportData[],
  filename: string = 'collaborations'
) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Rapport des Collaborations', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Total: ${collaborations.length} collaborations`, 14, 30);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 36);

  (doc as any).autoTable({
    startY: 45,
    head: [['Nom', 'Description', 'Participants', 'Statut', 'Date']],
    body: collaborations.map(c => [
      c.name,
      c.description?.substring(0, 50) + (c.description?.length > 50 ? '...' : '') || '-',
      c.participants_count,
      c.status,
      new Date(c.created_at).toLocaleDateString('fr-FR')
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [139, 92, 246] }
  });

  doc.save(`${filename}.pdf`);
};

// Export complet multi-format
export const exportMultiPharmacyReport = (
  pharmacies: PharmacyExportData[],
  analytics: AnalyticsExportData,
  collaborations: CollaborationExportData[],
  format: 'excel' | 'pdf' = 'excel'
) => {
  const date = new Date().toISOString().split('T')[0];
  
  if (format === 'excel') {
    const workbook = XLSX.utils.book_new();

    // Pharmacies
    const pharmaciesSheet = XLSX.utils.json_to_sheet(
      pharmacies.map(p => ({
        'Nom': p.name,
        'Code': p.code,
        'Ville': p.city,
        'Région': p.region,
        'Type': p.type,
        'Statut': p.status,
        'Messages': p.messages_sent,
        'Canaux': p.active_channels
      }))
    );
    XLSX.utils.book_append_sheet(workbook, pharmaciesSheet, 'Officines');

    // Analytics
    const analyticsSheet = XLSX.utils.json_to_sheet(
      analytics.topPharmacies.map((p, i) => ({
        'Rang': i + 1,
        'Officine': p.name,
        'Messages': p.messages,
        'Canaux': p.channels
      }))
    );
    XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Top Officines');

    // Collaborations
    const collabSheet = XLSX.utils.json_to_sheet(
      collaborations.map(c => ({
        'Nom': c.name,
        'Description': c.description,
        'Participants': c.participants_count,
        'Statut': c.status
      }))
    );
    XLSX.utils.book_append_sheet(workbook, collabSheet, 'Collaborations');

    XLSX.writeFile(workbook, `rapport-multi-officines-${date}.xlsx`);
  } else {
    // Pour le PDF, on exporte séparément
    exportPharmaciesPDF(pharmacies, `officines-${date}`);
  }
};
