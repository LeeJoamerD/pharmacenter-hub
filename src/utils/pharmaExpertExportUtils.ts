import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { 
  DrugInfo, 
  DrugInteraction, 
  TherapeuticRecommendation, 
  PharmacovigilanceAlert,
  ComplianceCheck 
} from '@/hooks/usePharmaceuticalExpert';

const formatDate = (date: string) => {
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return date;
  }
};

// Export Drug Database
export const exportDrugDatabasePDF = (drugs: DrugInfo[], pharmacyName: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Base de Données Médicaments', 14, 20);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28);
  
  const tableData = drugs.map(drug => [
    drug.name,
    drug.genericName,
    drug.therapeuticClass,
    `${drug.price.toFixed(2)} €`,
    drug.prescriptionRequired ? 'Oui' : 'Non'
  ]);
  
  autoTable(doc, {
    head: [['Nom', 'DCI', 'Classe', 'Prix', 'Ordonnance']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  doc.save(`base-medicaments-${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportDrugDatabaseExcel = (drugs: DrugInfo[], pharmacyName: string) => {
  const data = drugs.map(drug => ({
    'Nom': drug.name,
    'DCI': drug.genericName,
    'Classe Thérapeutique': drug.therapeuticClass,
    'Prix': drug.price,
    'Ordonnance Requise': drug.prescriptionRequired ? 'Oui' : 'Non',
    'Remboursement': `${drug.reimbursement}%`
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Médicaments');
  XLSX.writeFile(wb, `base-medicaments-${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

// Export Interactions
export const exportInteractionsPDF = (interactions: DrugInteraction[], pharmacyName: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Rapport des Interactions Médicamenteuses', 14, 20);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28);
  
  const severityLabels: Record<string, string> = {
    'minor': 'Mineure',
    'moderate': 'Modérée',
    'major': 'Majeure',
    'contraindicated': 'Contre-indiquée'
  };
  
  const tableData = interactions.map(i => [
    `${i.drug1_name} + ${i.drug2_name}`,
    severityLabels[i.severity] || i.severity,
    i.clinical_effect || '',
    i.management || ''
  ]);
  
  autoTable(doc, {
    head: [['Médicaments', 'Sévérité', 'Effet Clinique', 'Conduite à tenir']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [239, 68, 68] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 25 },
      2: { cellWidth: 55 },
      3: { cellWidth: 55 }
    }
  });
  
  doc.save(`interactions-${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportInteractionsExcel = (interactions: DrugInteraction[], pharmacyName: string) => {
  const severityLabels: Record<string, string> = {
    'minor': 'Mineure',
    'moderate': 'Modérée',
    'major': 'Majeure',
    'contraindicated': 'Contre-indiquée'
  };
  
  const data = interactions.map(i => ({
    'Médicament 1': i.drug1_name,
    'Médicament 2': i.drug2_name,
    'Sévérité': severityLabels[i.severity] || i.severity,
    'Mécanisme': i.mechanism || '',
    'Effet Clinique': i.clinical_effect || '',
    'Conduite à tenir': i.management || '',
    'Partagée Réseau': i.is_network_shared ? 'Oui' : 'Non'
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Interactions');
  XLSX.writeFile(wb, `interactions-${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

// Export Therapeutic Recommendations
export const exportRecommendationsPDF = (recommendations: TherapeuticRecommendation[], pharmacyName: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Guide Thérapeutique', 14, 20);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28);
  
  let yPos = 40;
  
  recommendations.forEach((rec, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${rec.condition_name}`, 14, yPos);
    yPos += 8;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // First line treatments
    const firstLine = rec.first_line_treatments.map(t => t.name).join(', ');
    doc.text(`1ère intention: ${firstLine}`, 18, yPos);
    yPos += 6;
    
    // Alternatives
    const alternatives = rec.alternative_treatments.map(t => t.name).join(', ');
    doc.text(`Alternatives: ${alternatives}`, 18, yPos);
    yPos += 6;
    
    // Contraindications
    if (rec.contraindications) {
      doc.text(`Contre-indications: ${rec.contraindications}`, 18, yPos);
      yPos += 6;
    }
    
    // Duration
    if (rec.duration) {
      doc.text(`Durée: ${rec.duration}`, 18, yPos);
      yPos += 6;
    }
    
    yPos += 8;
  });
  
  doc.save(`guide-therapeutique-${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportRecommendationsExcel = (recommendations: TherapeuticRecommendation[], pharmacyName: string) => {
  const data = recommendations.map(rec => ({
    'Condition': rec.condition_name,
    'Catégorie': rec.condition_category || '',
    '1ère Intention': rec.first_line_treatments.map(t => t.name).join(', '),
    'Alternatives': rec.alternative_treatments.map(t => t.name).join(', '),
    'Contre-indications': rec.contraindications || '',
    'Durée': rec.duration || '',
    'Surveillance': rec.monitoring || '',
    'Niveau de Preuve': rec.evidence_level || ''
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Recommandations');
  XLSX.writeFile(wb, `guide-therapeutique-${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

// Export Pharmacovigilance Alerts
export const exportPharmacovigilancePDF = (alerts: PharmacovigilanceAlert[], pharmacyName: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Alertes Pharmacovigilance', 14, 20);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28);
  
  const severityLabels: Record<string, string> = {
    'info': 'Information',
    'warning': 'Attention',
    'critical': 'Critique'
  };
  
  const tableData = alerts.map(a => [
    a.title,
    severityLabels[a.severity],
    a.source,
    formatDate(a.date_issued),
    a.is_acknowledged ? 'Oui' : 'Non'
  ]);
  
  autoTable(doc, {
    head: [['Titre', 'Sévérité', 'Source', 'Date', 'Acquitté']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [245, 158, 11] }
  });
  
  doc.save(`pharmacovigilance-${format(new Date(), 'yyyyMMdd')}.pdf`);
};

// Export Compliance Report
export const exportCompliancePDF = (checks: ComplianceCheck[], pharmacyName: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Rapport de Conformité Réglementaire', 14, 20);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28);
  
  const statusLabels: Record<string, string> = {
    'compliant': 'Conforme',
    'warning': 'Attention',
    'critical': 'Non Conforme',
    'pending': 'En attente'
  };
  
  const tableData = checks.map(c => [
    c.category,
    statusLabels[c.status],
    c.items_count.toString(),
    c.issues_count.toString(),
    c.last_check_at ? formatDate(c.last_check_at) : 'Jamais',
    c.next_audit_date ? formatDate(c.next_audit_date) : '-'
  ]);
  
  autoTable(doc, {
    head: [['Catégorie', 'Statut', 'Produits', 'Problèmes', 'Dernier Contrôle', 'Prochain Audit']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [34, 197, 94] }
  });
  
  // Add issues details if any
  let yPos = (doc as any).lastAutoTable.finalY + 15;
  
  checks.forEach(check => {
    if (check.issues_details.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Problèmes - ${check.category}:`, 14, yPos);
      yPos += 6;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      check.issues_details.forEach(issue => {
        doc.text(`• ${issue.product}: ${issue.issue}`, 18, yPos);
        yPos += 5;
      });
      yPos += 8;
    }
  });
  
  doc.save(`conformite-${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportComplianceExcel = (checks: ComplianceCheck[], pharmacyName: string) => {
  const statusLabels: Record<string, string> = {
    'compliant': 'Conforme',
    'warning': 'Attention',
    'critical': 'Non Conforme',
    'pending': 'En attente'
  };
  
  const data = checks.map(c => ({
    'Catégorie': c.category,
    'Statut': statusLabels[c.status],
    'Nombre de Produits': c.items_count,
    'Nombre de Problèmes': c.issues_count,
    'Dernier Contrôle': c.last_check_at ? formatDate(c.last_check_at) : 'Jamais',
    'Prochain Audit': c.next_audit_date ? formatDate(c.next_audit_date) : '-'
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Conformité');
  
  // Add issues sheet
  const issuesData: any[] = [];
  checks.forEach(check => {
    check.issues_details.forEach(issue => {
      issuesData.push({
        'Catégorie': check.category,
        'Produit': issue.product,
        'Problème': issue.issue,
        'Sévérité': issue.severity
      });
    });
  });
  
  if (issuesData.length > 0) {
    const wsIssues = XLSX.utils.json_to_sheet(issuesData);
    XLSX.utils.book_append_sheet(wb, wsIssues, 'Problèmes');
  }
  
  XLSX.writeFile(wb, `conformite-${format(new Date(), 'yyyyMMdd')}.xlsx`);
};
