import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { 
  NetworkProduct, 
  NetworkOrder, 
  NetworkPatient, 
  NetworkStockAlert,
  NetworkPrescription
} from '@/hooks/useNetworkBusinessIntegrations';

// PDF Export for Products
export function exportProductsToPDF(products: NetworkProduct[], pharmacyName: string) {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Catalogue Produits', 14, 22);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [['Produit', 'Code', 'Type', 'Prix', 'Stock', 'Statut']],
    body: products.map(p => [
      p.name,
      p.code,
      p.type,
      `${p.price.toFixed(0)} FCFA`,
      p.stock.toString(),
      p.status === 'available' ? 'Disponible' : p.status === 'low_stock' ? 'Stock faible' : 'Rupture'
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`produits_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Excel Export for Products
export function exportProductsToExcel(products: NetworkProduct[], pharmacyName: string) {
  const data = products.map(p => ({
    'Produit': p.name,
    'Code CIP': p.code,
    'Type': p.type,
    'Prix (FCFA)': p.price,
    'Stock': p.stock,
    'Statut': p.status === 'available' ? 'Disponible' : p.status === 'low_stock' ? 'Stock faible' : 'Rupture',
    'Prescription requise': p.prescriptionRequired ? 'Oui' : 'Non',
    'Interactions': p.interactions.join(', ')
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Produits');
  XLSX.writeFile(wb, `produits_${pharmacyName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// PDF Export for Orders
export function exportOrdersToPDF(orders: NetworkOrder[], pharmacyName: string) {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Suivi des Commandes', 14, 22);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 30);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'processing': return 'En cours';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  autoTable(doc, {
    startY: 40,
    head: [['N° Commande', 'Client', 'Articles', 'Total', 'Statut', 'Date']],
    body: orders.map(o => [
      o.numero_vente,
      o.customer,
      o.items.toString(),
      `${o.total.toFixed(0)} FCFA`,
      getStatusLabel(o.status),
      format(new Date(o.date), 'dd/MM/yyyy HH:mm', { locale: fr })
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`commandes_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Excel Export for Orders
export function exportOrdersToExcel(orders: NetworkOrder[], pharmacyName: string) {
  const data = orders.map(o => ({
    'N° Commande': o.numero_vente,
    'Client': o.customer,
    'Articles': o.items,
    'Total (FCFA)': o.total,
    'Statut': o.status,
    'Date': format(new Date(o.date), 'dd/MM/yyyy HH:mm', { locale: fr }),
    'Pharmacie': o.pharmacy
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Commandes');
  XLSX.writeFile(wb, `commandes_${pharmacyName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// PDF Export for Patients
export function exportPatientsToPDF(patients: NetworkPatient[], pharmacyName: string) {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Dossiers Patients', 14, 22);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [['Patient', 'Âge', 'Prescriptions', 'Allergies', 'Conditions', 'Dernière visite']],
    body: patients.map(p => [
      p.name,
      p.age?.toString() || '-',
      p.prescriptions.toString(),
      p.allergies.join(', ') || '-',
      p.chronicConditions.join(', ') || '-',
      p.lastVisit ? format(new Date(p.lastVisit), 'dd/MM/yyyy', { locale: fr }) : '-'
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`patients_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Excel Export for Patients
export function exportPatientsToExcel(patients: NetworkPatient[], pharmacyName: string) {
  const data = patients.map(p => ({
    'Patient': p.name,
    'Âge': p.age || '',
    'Prescriptions': p.prescriptions,
    'Allergies': p.allergies.join(', '),
    'Conditions chroniques': p.chronicConditions.join(', '),
    'Téléphone': p.telephone || '',
    'Email': p.email || '',
    'Dernière visite': p.lastVisit ? format(new Date(p.lastVisit), 'dd/MM/yyyy', { locale: fr }) : '',
    'Pharmacie': p.pharmacy
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Patients');
  XLSX.writeFile(wb, `patients_${pharmacyName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// PDF Export for Stock Alerts
export function exportAlertsToPDF(alerts: NetworkStockAlert[], pharmacyName: string) {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Alertes Stock', 14, 22);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 30);

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return priority;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'low_stock': return 'Stock faible';
      case 'expiry': return 'Péremption';
      case 'rupture': return 'Rupture';
      default: return type;
    }
  };

  autoTable(doc, {
    startY: 40,
    head: [['Produit', 'Stock', 'Seuil', 'Type', 'Priorité', 'Date']],
    body: alerts.map(a => [
      a.product,
      a.currentStock.toString(),
      a.minThreshold.toString(),
      getTypeLabel(a.type),
      getPriorityLabel(a.priority),
      format(new Date(a.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [239, 68, 68] }
  });

  doc.save(`alertes_stock_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Excel Export for Stock Alerts
export function exportAlertsToExcel(alerts: NetworkStockAlert[], pharmacyName: string) {
  const data = alerts.map(a => ({
    'Produit': a.product,
    'Stock actuel': a.currentStock,
    'Seuil minimum': a.minThreshold,
    'Type': a.type,
    'Priorité': a.priority,
    'Jours restants': a.jours_restants || '',
    'Date création': format(new Date(a.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
    'Pharmacie': a.pharmacy
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Alertes');
  XLSX.writeFile(wb, `alertes_stock_${pharmacyName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// PDF Export for Prescriptions
export function exportPrescriptionsToPDF(prescriptions: NetworkPrescription[], pharmacyName: string) {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Ordonnances', 14, 22);
  doc.setFontSize(10);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [['Médecin', 'Patient', 'Lignes', 'Statut', 'Date']],
    body: prescriptions.map(p => [
      p.doctorName,
      p.patientName,
      p.linesCount.toString(),
      p.status,
      format(new Date(p.date), 'dd/MM/yyyy', { locale: fr })
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] }
  });

  doc.save(`ordonnances_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Excel Export for Prescriptions
export function exportPrescriptionsToExcel(prescriptions: NetworkPrescription[], pharmacyName: string) {
  const data = prescriptions.map(p => ({
    'Médecin': p.doctorName,
    'Patient': p.patientName,
    'Nombre de lignes': p.linesCount,
    'Statut': p.status,
    'Date': format(new Date(p.date), 'dd/MM/yyyy', { locale: fr }),
    'Pharmacie': p.pharmacy
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ordonnances');
  XLSX.writeFile(wb, `ordonnances_${pharmacyName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}
