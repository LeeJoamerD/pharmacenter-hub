import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface ExportPreferencesData {
  theme_id: string;
  font_size: number;
  language: string;
  layout_compact: boolean;
  animations_enabled: boolean;
  auto_save: boolean;
  display_quality: string;
  device_mode: string;
  high_contrast: boolean;
  keyboard_focus: boolean;
  screen_reader: boolean;
  reduced_motion: boolean;
  connection_timeout: number;
  auto_retry: boolean;
  offline_mode: boolean;
}

export interface ExportNotificationData {
  name: string;
  notification_type: string;
  enabled: boolean;
  sound: boolean;
  popup: boolean;
  email: boolean;
}

export interface FullCustomizationExportData {
  preferences: ExportPreferencesData | null;
  notifications: ExportNotificationData[];
  exportedAt: string;
  pharmacyName?: string;
}

// Export preferences to JSON
export const exportPreferencesToJSON = (data: FullCustomizationExportData): Blob => {
  const jsonContent = JSON.stringify(data, null, 2);
  return new Blob([jsonContent], { type: 'application/json' });
};

// Download helper
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export to Excel
export const exportCustomizationToExcel = (data: FullCustomizationExportData, filename: string = 'parametres-personnalisation') => {
  const workbook = XLSX.utils.book_new();
  
  // Preferences sheet
  if (data.preferences) {
    const prefsData = [
      ['Paramètre', 'Valeur'],
      ['Thème', data.preferences.theme_id],
      ['Taille de police', data.preferences.font_size],
      ['Langue', data.preferences.language],
      ['Mode compact', data.preferences.layout_compact ? 'Oui' : 'Non'],
      ['Animations', data.preferences.animations_enabled ? 'Oui' : 'Non'],
      ['Sauvegarde auto', data.preferences.auto_save ? 'Oui' : 'Non'],
      ['Qualité affichage', data.preferences.display_quality],
      ['Mode appareil', data.preferences.device_mode],
      ['Contraste élevé', data.preferences.high_contrast ? 'Oui' : 'Non'],
      ['Focus clavier', data.preferences.keyboard_focus ? 'Oui' : 'Non'],
      ['Lecteur d\'écran', data.preferences.screen_reader ? 'Oui' : 'Non'],
      ['Réduction mouvement', data.preferences.reduced_motion ? 'Oui' : 'Non'],
      ['Délai connexion (s)', data.preferences.connection_timeout],
      ['Retry automatique', data.preferences.auto_retry ? 'Oui' : 'Non'],
      ['Mode hors ligne', data.preferences.offline_mode ? 'Oui' : 'Non']
    ];
    
    const prefsSheet = XLSX.utils.aoa_to_sheet(prefsData);
    XLSX.utils.book_append_sheet(workbook, prefsSheet, 'Préférences');
  }
  
  // Notifications sheet
  if (data.notifications.length > 0) {
    const notifData = [
      ['Type', 'Nom', 'Activé', 'Son', 'Pop-up', 'Email'],
      ...data.notifications.map(n => [
        n.notification_type,
        n.name,
        n.enabled ? 'Oui' : 'Non',
        n.sound ? 'Oui' : 'Non',
        n.popup ? 'Oui' : 'Non',
        n.email ? 'Oui' : 'Non'
      ])
    ];
    
    const notifSheet = XLSX.utils.aoa_to_sheet(notifData);
    XLSX.utils.book_append_sheet(workbook, notifSheet, 'Notifications');
  }
  
  // Generate and download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export to PDF
export const exportCustomizationToPDF = (data: FullCustomizationExportData, filename: string = 'parametres-personnalisation') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text('Paramètres de Personnalisation', pageWidth / 2, 20, { align: 'center' });
  
  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Exporté le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, pageWidth / 2, 28, { align: 'center' });
  if (data.pharmacyName) {
    doc.text(data.pharmacyName, pageWidth / 2, 34, { align: 'center' });
  }
  
  let yPos = 45;
  
  // Preferences section
  if (data.preferences) {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Préférences Utilisateur', 14, yPos);
    yPos += 5;
    
    const prefsTableData = [
      ['Thème', data.preferences.theme_id],
      ['Taille de police', `${data.preferences.font_size}px`],
      ['Langue', data.preferences.language],
      ['Mode compact', data.preferences.layout_compact ? 'Oui' : 'Non'],
      ['Animations', data.preferences.animations_enabled ? 'Oui' : 'Non'],
      ['Qualité affichage', data.preferences.display_quality],
      ['Contraste élevé', data.preferences.high_contrast ? 'Oui' : 'Non'],
      ['Focus clavier', data.preferences.keyboard_focus ? 'Oui' : 'Non'],
      ['Lecteur d\'écran', data.preferences.screen_reader ? 'Oui' : 'Non'],
      ['Délai connexion', `${data.preferences.connection_timeout}s`],
      ['Mode hors ligne', data.preferences.offline_mode ? 'Oui' : 'Non']
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Paramètre', 'Valeur']],
      body: prefsTableData,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
      margin: { left: 14, right: 14 }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Notifications section
  if (data.notifications.length > 0) {
    doc.setFontSize(14);
    doc.text('Paramètres de Notifications', 14, yPos);
    yPos += 5;
    
    const notifTableData = data.notifications.map(n => [
      n.name,
      n.enabled ? '✓' : '✗',
      n.sound ? '✓' : '✗',
      n.popup ? '✓' : '✗',
      n.email ? '✓' : '✗'
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Type', 'Activé', 'Son', 'Pop-up', 'Email']],
      body: notifTableData,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
      margin: { left: 14, right: 14 }
    });
  }
  
  // Save
  doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Download JSON
export const downloadCustomizationJSON = (data: FullCustomizationExportData, filename: string = 'parametres-personnalisation') => {
  const blob = exportPreferencesToJSON(data);
  downloadBlob(blob, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.json`);
};

// Validate imported settings
export const validateImportedSettings = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Format de fichier invalide');
    return { valid: false, errors };
  }
  
  if (data.preferences) {
    if (typeof data.preferences.font_size !== 'undefined' && 
        (typeof data.preferences.font_size !== 'number' || data.preferences.font_size < 10 || data.preferences.font_size > 20)) {
      errors.push('Taille de police invalide (doit être entre 10 et 20)');
    }
    
    if (data.preferences.display_quality && 
        !['low', 'medium', 'high'].includes(data.preferences.display_quality)) {
      errors.push('Qualité d\'affichage invalide');
    }
    
    if (data.preferences.device_mode && 
        !['desktop', 'tablet', 'mobile'].includes(data.preferences.device_mode)) {
      errors.push('Mode appareil invalide');
    }
  }
  
  if (data.notifications && !Array.isArray(data.notifications)) {
    errors.push('Format des notifications invalide');
  }
  
  return { valid: errors.length === 0, errors };
};

// Parse imported settings file
export const parseImportedSettings = async (file: File): Promise<FullCustomizationExportData | null> => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    const validation = validateImportedSettings(data);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }
    
    return data as FullCustomizationExportData;
  } catch (error) {
    console.error('Error parsing import file:', error);
    return null;
  }
};
