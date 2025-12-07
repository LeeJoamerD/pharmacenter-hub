import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SentimentAnalysis, SentimentKeyword, SentimentMetrics } from '@/hooks/useSentimentAnalysis';

const sentimentLabels: Record<string, string> = {
  'very_positive': 'Très Positif',
  'positive': 'Positif',
  'neutral': 'Neutre',
  'negative': 'Négatif',
  'very_negative': 'Très Négatif'
};

const sourceLabels: Record<string, string> = {
  'google_reviews': 'Google Reviews',
  'facebook': 'Facebook',
  'email': 'Email',
  'enquete': 'Enquête',
  'manual': 'Manuel'
};

export const exportAnalysesToExcel = (
  analyses: SentimentAnalysis[],
  pharmacyName: string
): void => {
  const data = analyses.map(a => ({
    'Date': format(new Date(a.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
    'Texte': a.text.substring(0, 200) + (a.text.length > 200 ? '...' : ''),
    'Sentiment': sentimentLabels[a.sentiment] || a.sentiment,
    'Score': `${Math.round(a.score * 100)}%`,
    'Émotions': a.emotions?.join(', ') || '',
    'Catégorie': a.category || '',
    'Source': sourceLabels[a.source] || a.source,
    'Mots-clés': a.keywords?.join(', ') || ''
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 18 }, // Date
    { wch: 60 }, // Texte
    { wch: 15 }, // Sentiment
    { wch: 10 }, // Score
    { wch: 30 }, // Émotions
    { wch: 15 }, // Catégorie
    { wch: 15 }, // Source
    { wch: 30 }  // Mots-clés
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Analyses Sentiment');
  XLSX.writeFile(wb, `analyses_sentiment_${pharmacyName}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

export const exportAnalysesToPDF = (
  analyses: SentimentAnalysis[],
  pharmacyName: string
): void => {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  // Header
  doc.setFontSize(18);
  doc.text('Rapport d\'Analyse de Sentiment', 14, 20);
  doc.setFontSize(12);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 14, 28);

  // Table data
  const tableData = analyses.map(a => [
    format(new Date(a.created_at), 'dd/MM/yyyy', { locale: fr }),
    a.text.substring(0, 50) + (a.text.length > 50 ? '...' : ''),
    sentimentLabels[a.sentiment] || a.sentiment,
    `${Math.round(a.score * 100)}%`,
    a.category || '-',
    sourceLabels[a.source] || a.source
  ]);

  autoTable(doc, {
    head: [['Date', 'Texte', 'Sentiment', 'Score', 'Catégorie', 'Source']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`analyses_sentiment_${pharmacyName}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportKeywordsToExcel = (
  keywords: SentimentKeyword[],
  pharmacyName: string
): void => {
  const data = keywords.map(k => ({
    'Mot-clé': k.word,
    'Sentiment': k.sentiment === 'positive' ? 'Positif' : 'Négatif',
    'Fréquence': k.frequency,
    'Impact': k.impact === 'high' ? 'Élevé' : k.impact === 'medium' ? 'Moyen' : 'Faible',
    'Dernière détection': format(new Date(k.last_detected_at), 'dd/MM/yyyy', { locale: fr })
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  ws['!cols'] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Mots-clés');
  XLSX.writeFile(wb, `mots_cles_sentiment_${pharmacyName}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

export const exportSentimentReportPDF = (
  metrics: SentimentMetrics,
  analyses: SentimentAnalysis[],
  keywords: SentimentKeyword[],
  pharmacyName: string
): void => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.text('Rapport Complet - Analyse de Sentiment', 14, yPos);
  yPos += 10;
  
  doc.setFontSize(12);
  doc.text(`${pharmacyName} - ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, 14, yPos);
  yPos += 15;

  // KPIs Section
  doc.setFontSize(14);
  doc.text('Indicateurs Clés', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.text(`• Score Global: ${metrics.globalScore?.toFixed(1) || 0}/5`, 20, yPos);
  yPos += 6;
  doc.text(`• Total Analyses: ${metrics.totalAnalyses || 0}`, 20, yPos);
  yPos += 6;
  doc.text(`• Taux Positif: ${metrics.positiveRate || 0}%`, 20, yPos);
  yPos += 6;
  doc.text(`• Taux Neutre: ${metrics.neutralRate || 0}%`, 20, yPos);
  yPos += 6;
  doc.text(`• Taux Négatif: ${metrics.negativeRate || 0}%`, 20, yPos);
  yPos += 15;

  // Categories Section
  if (metrics.categoryBreakdown?.length) {
    doc.setFontSize(14);
    doc.text('Analyse par Catégorie', 14, yPos);
    yPos += 5;

    const categoryData = metrics.categoryBreakdown.map(c => [
      c.category,
      `${c.score}/5`,
      c.volume.toString(),
      c.trend
    ]);

    autoTable(doc, {
      head: [['Catégorie', 'Score', 'Volume', 'Tendance']],
      body: categoryData,
      startY: yPos,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Top Keywords Section
  if (keywords.length > 0) {
    doc.setFontSize(14);
    doc.text('Mots-clés Principaux', 14, yPos);
    yPos += 5;

    const keywordData = keywords.slice(0, 10).map(k => [
      k.word,
      k.sentiment === 'positive' ? 'Positif' : 'Négatif',
      k.frequency.toString(),
      k.impact === 'high' ? 'Élevé' : k.impact === 'medium' ? 'Moyen' : 'Faible'
    ]);

    autoTable(doc, {
      head: [['Mot-clé', 'Sentiment', 'Fréquence', 'Impact']],
      body: keywordData,
      startY: yPos,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] }
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Recent Analyses Section
  if (analyses.length > 0 && yPos < 240) {
    doc.setFontSize(14);
    doc.text('Analyses Récentes', 14, yPos);
    yPos += 5;

    const recentData = analyses.slice(0, 5).map(a => [
      format(new Date(a.created_at), 'dd/MM', { locale: fr }),
      a.text.substring(0, 40) + '...',
      sentimentLabels[a.sentiment] || a.sentiment,
      `${Math.round(a.score * 100)}%`
    ]);

    autoTable(doc, {
      head: [['Date', 'Texte', 'Sentiment', 'Score']],
      body: recentData,
      startY: yPos,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [245, 158, 11] }
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })} - PharmaSoft IA`, 14, 285);

  doc.save(`rapport_sentiment_${pharmacyName}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};
