import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DrugInfo, DrugInteraction, ClinicalAlert, PharmacySpecialty } from '@/hooks/useNetworkPharmaTools';

// Export drugs to Excel
export const exportDrugsToExcel = (drugs: DrugInfo[], filename = 'base-medicaments'): void => {
  const data = drugs.map(drug => ({
    'Nom': drug.name,
    'DCI': drug.dci,
    'Classe thérapeutique': drug.therapeutic_class,
    'Forme': drug.form,
    'Dosage': drug.dosage,
    'Fabricant': drug.manufacturer,
    'Code ATC': drug.atc_code,
    'Code CIP': drug.cip_code,
    'Prix (FCFA)': drug.price,
    'Taux remboursement (%)': drug.reimbursement_rate,
    'Ordonnance requise': drug.prescription_required ? 'Oui' : 'Non',
    'Contre-indications': drug.contraindications?.join('; ') || '',
    'Conditions stockage': drug.storage_conditions,
    'Stock': drug.stock_quantity || 0
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Médicaments');
  XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export drugs to PDF
export const exportDrugsToPDF = (drugs: DrugInfo[], filename = 'base-medicaments'): void => {
  const doc = new jsPDF('landscape');
  
  doc.setFontSize(18);
  doc.text('Base de Données Médicaments', 14, 22);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, 14, 30);

  const tableData = drugs.map(drug => [
    drug.name,
    drug.dci,
    drug.therapeutic_class,
    drug.form,
    drug.cip_code,
    `${drug.price} FCFA`,
    drug.prescription_required ? 'Oui' : 'Non',
    drug.stock_quantity || 0
  ]);

  autoTable(doc, {
    head: [['Nom', 'DCI', 'Classe', 'Forme', 'CIP', 'Prix', 'Ordo.', 'Stock']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export interactions to Excel
export const exportInteractionsToExcel = (interactions: DrugInteraction[], filename = 'interactions'): void => {
  const data = interactions.map(interaction => ({
    'Médicament 1': interaction.drug1_name,
    'Médicament 2': interaction.drug2_name,
    'Sévérité': interaction.severity,
    'Mécanisme': interaction.mechanism,
    'Effet clinique': interaction.clinical_effect,
    'Conduite à tenir': interaction.management,
    'Références': interaction.source_references?.join('; ') || '',
    'Partagé réseau': interaction.is_network_shared ? 'Oui' : 'Non'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Interactions');
  XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export interactions to PDF
export const exportInteractionsToPDF = (interactions: DrugInteraction[], filename = 'interactions'): void => {
  const doc = new jsPDF('landscape');
  
  doc.setFontSize(18);
  doc.text('Interactions Médicamenteuses', 14, 22);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, 14, 30);

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'contraindicated': return 'Contre-indiqué';
      case 'major': return 'Majeure';
      case 'moderate': return 'Modérée';
      case 'minor': return 'Mineure';
      default: return severity;
    }
  };

  const tableData = interactions.map(interaction => [
    interaction.drug1_name,
    interaction.drug2_name,
    getSeverityLabel(interaction.severity),
    interaction.mechanism || '-',
    interaction.clinical_effect || '-',
    interaction.management || '-'
  ]);

  autoTable(doc, {
    head: [['Médicament 1', 'Médicament 2', 'Sévérité', 'Mécanisme', 'Effet clinique', 'Conduite à tenir']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [239, 68, 68] }
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export alerts to Excel
export const exportAlertsToExcel = (alerts: ClinicalAlert[], filename = 'alertes-cliniques'): void => {
  const data = alerts.map(alert => ({
    'Titre': alert.title,
    'Type': alert.alert_type,
    'Sévérité': alert.severity,
    'Description': alert.description,
    'Source': alert.source,
    'Médicaments concernés': alert.affected_drugs?.join('; ') || '',
    'Actions requises': alert.actions_required?.join('; ') || '',
    'Date émission': format(new Date(alert.date_issued), 'dd/MM/yyyy'),
    'Date expiration': alert.expiry_date ? format(new Date(alert.expiry_date), 'dd/MM/yyyy') : '-',
    'Acquittée': alert.is_acknowledged ? 'Oui' : 'Non',
    'Alerte réseau': alert.is_network_alert ? 'Oui' : 'Non'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Alertes');
  XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export alerts to PDF
export const exportAlertsToPDF = (alerts: ClinicalAlert[], filename = 'alertes-cliniques'): void => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Alertes Cliniques', 14, 22);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, 14, 30);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'drug_alert': return 'Alerte médicament';
      case 'interaction': return 'Interaction';
      case 'recall': return 'Rappel';
      case 'shortage': return 'Rupture';
      case 'regulatory': return 'Réglementaire';
      default: return type;
    }
  };

  const tableData = alerts.map(alert => [
    alert.title,
    getTypeLabel(alert.alert_type),
    alert.severity === 'critical' ? 'Critique' : alert.severity === 'warning' ? 'Attention' : 'Info',
    alert.source || '-',
    format(new Date(alert.date_issued), 'dd/MM/yyyy'),
    alert.is_acknowledged ? 'Oui' : 'Non'
  ]);

  autoTable(doc, {
    head: [['Titre', 'Type', 'Sévérité', 'Source', 'Date', 'Acquittée']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [249, 115, 22] }
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export specialties to Excel
export const exportSpecialtiesToExcel = (specialties: PharmacySpecialty[], filename = 'specialites'): void => {
  const data = specialties.map(specialty => ({
    'Nom': specialty.name,
    'Description': specialty.description,
    'Certifications': specialty.certifications?.join('; ') || '',
    'Protocoles': specialty.protocols?.join('; ') || '',
    'Équipement': specialty.equipment?.join('; ') || '',
    'Personnel requis': specialty.staff_requirements?.join('; ') || '',
    'Patients concernés': specialty.patient_demographics || '',
    'Active': specialty.is_active ? 'Oui' : 'Non',
    'Partagée réseau': specialty.is_network_shared ? 'Oui' : 'Non'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Spécialités');
  XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export specialties to PDF
export const exportSpecialtiesToPDF = (specialties: PharmacySpecialty[], filename = 'specialites'): void => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Spécialités Pharmaceutiques', 14, 22);
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, 14, 30);

  const tableData = specialties.map(specialty => [
    specialty.name,
    specialty.description || '-',
    specialty.certifications?.slice(0, 2).join(', ') || '-',
    specialty.protocols?.length || 0,
    specialty.is_active ? 'Oui' : 'Non'
  ]);

  autoTable(doc, {
    head: [['Nom', 'Description', 'Certifications', 'Protocoles', 'Active']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [139, 92, 246] }
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Full pharma report
export const exportFullPharmaReport = (
  drugs: DrugInfo[],
  interactions: DrugInteraction[],
  alerts: ClinicalAlert[],
  specialties: PharmacySpecialty[],
  filename = 'rapport-pharma-tools'
): void => {
  const wb = XLSX.utils.book_new();

  // Médicaments sheet
  const drugsData = drugs.map(drug => ({
    'Nom': drug.name,
    'DCI': drug.dci,
    'Classe': drug.therapeutic_class,
    'CIP': drug.cip_code,
    'Prix': drug.price,
    'Stock': drug.stock_quantity || 0
  }));
  const wsD = XLSX.utils.json_to_sheet(drugsData);
  XLSX.utils.book_append_sheet(wb, wsD, 'Médicaments');

  // Interactions sheet
  const interactionsData = interactions.map(i => ({
    'Médicament 1': i.drug1_name,
    'Médicament 2': i.drug2_name,
    'Sévérité': i.severity,
    'Conduite': i.management
  }));
  const wsI = XLSX.utils.json_to_sheet(interactionsData);
  XLSX.utils.book_append_sheet(wb, wsI, 'Interactions');

  // Alertes sheet
  const alertsData = alerts.map(a => ({
    'Titre': a.title,
    'Type': a.alert_type,
    'Sévérité': a.severity,
    'Date': format(new Date(a.date_issued), 'dd/MM/yyyy')
  }));
  const wsA = XLSX.utils.json_to_sheet(alertsData);
  XLSX.utils.book_append_sheet(wb, wsA, 'Alertes');

  // Spécialités sheet
  const specialtiesData = specialties.map(s => ({
    'Nom': s.name,
    'Description': s.description,
    'Active': s.is_active ? 'Oui' : 'Non'
  }));
  const wsS = XLSX.utils.json_to_sheet(specialtiesData);
  XLSX.utils.book_append_sheet(wb, wsS, 'Spécialités');

  XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};
