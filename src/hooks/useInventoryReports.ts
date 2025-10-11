import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { usePersonnel } from '@/hooks/usePersonnel';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

export interface InventoryReport {
  id: string;
  tenant_id: string;
  session_id: string;
  type: string; // Changed from union type to string to match database
  nom: string; // Changed from 'titre' to 'nom' to match database schema
  contenu: any;
  fichier_url?: string;
  date_generation: string;
  genere_par_id?: string; // Changed from 'genere_par' to 'genere_par_id' to match database
  statut?: string;
  format?: string;
  taille_fichier?: number;
  session?: {
    id: string;
    nom: string;
    statut: string;
    date_debut: string;
    date_fin?: string;
  };
}

export interface ReportGenerationData {
  sessionId: string;
  type: string; // Changed from union type to string to match database
  nom?: string; // Changed from 'titre' to 'nom' to match database schema
  parametres?: any;
}

export const useInventoryReports = () => {
  const { tenantId } = useTenant();
  const { currentPersonnel } = usePersonnel();
  const [reports, setReports] = useState<InventoryReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [metrics, setMetrics] = useState({
    totalRapports: 0,
    rapportsRecents: 0,
    tailleTotal: 0,
    sessionsAnalysees: 0
  });

  // Récupérer les rapports depuis inventaire_rapports
  const fetchReports = useCallback(async () => {
    if (!tenantId) return [];
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('inventaire_rapports')
        .select(`
          *,
          session:inventaire_sessions(
            id,
            nom,
            statut,
            date_debut,
            date_fin
          )
        `)
        .eq('tenant_id', tenantId)
        .order('date_generation', { ascending: false });

      if (error) throw error;

      const transformedReports: InventoryReport[] = (data || []).map(report => ({
        id: report.id,
        tenant_id: report.tenant_id,
        session_id: report.session_id,
        type: report.type,
        nom: report.nom, // Changed from 'titre' to 'nom'
        contenu: report.contenu,
        fichier_url: report.fichier_url,
        date_generation: report.date_generation,
        genere_par_id: report.genere_par_id, // Changed from 'genere_par' to 'genere_par_id'
        statut: report.statut,
        format: report.format,
        taille_fichier: report.taille_fichier,
        session: report.session ? {
          id: report.session.id,
          nom: report.session.nom,
          statut: report.session.statut,
          date_debut: report.session.date_debut,
          date_fin: report.session.date_fin
        } : undefined
      }));

      // Calculer les métriques
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const rapportsRecents = transformedReports.filter(
        r => new Date(r.date_generation) >= oneWeekAgo
      ).length;

      const tailleTotal = transformedReports.reduce(
        (sum, r) => sum + (r.taille_fichier || 0), 0
      ) / (1024 * 1024); // Convertir en MB

      const sessionsUniques = new Set(transformedReports.map(r => r.session_id));

      setMetrics({
        totalRapports: transformedReports.length,
        rapportsRecents,
        tailleTotal: Math.round(tailleTotal * 100) / 100,
        sessionsAnalysees: sessionsUniques.size
      });

      setReports(transformedReports);
      return transformedReports;
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
      toast.error('Erreur lors du chargement des rapports');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  // Générer un nouveau rapport
  const generateReport = useCallback(async (reportData: ReportGenerationData) => {
    if (!tenantId || !currentPersonnel) {
      toast.error('Informations utilisateur manquantes');
      return null;
    }

    try {
      setIsGenerating(true);
      
      // Appeler la fonction RPC pour générer le rapport
      const { data: reportContent, error: rpcError } = await supabase.rpc('generate_inventaire_report', {
        p_session_id: reportData.sessionId,
        p_type: reportData.type,
        p_tenant_id: tenantId
      });

      if (rpcError) throw rpcError;

      // Sauvegarder le rapport généré
      const { data: savedReport, error: insertError } = await supabase
        .from('inventaire_rapports')
        .insert({
          tenant_id: tenantId,
          session_id: reportData.sessionId,
          type: reportData.type,
          nom: reportData.nom || `Rapport ${reportData.type} - ${new Date().toLocaleDateString()}`, // Changed from 'titre' to 'nom'
          contenu: reportContent,
          fichier_url: null, // Pour l'instant
          genere_par_id: currentPersonnel.id // Changed from string to personnel ID
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Rapport généré avec succès');
      
      // Recharger la liste des rapports
      await fetchReports();
      
      return savedReport;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      toast.error('Erreur lors de la génération du rapport');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [tenantId, currentPersonnel, fetchReports]);

  // Supprimer un rapport
  const deleteReport = useCallback(async (reportId: string) => {
    if (!tenantId) return false;

    try {
      const { error } = await supabase
        .from('inventaire_rapports')
        .delete()
        .eq('id', reportId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast.success('Rapport supprimé avec succès');
      
      // Mettre à jour la liste locale
      setReports(prev => prev.filter(report => report.id !== reportId));
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du rapport:', error);
      toast.error('Erreur lors de la suppression du rapport');
      return false;
    }
  }, [tenantId]);

  // Exporter un rapport en PDF
  const exportToPDF = useCallback(async (report: InventoryReport) => {
    try {
      // Import dynamique de jsPDF pour éviter les problèmes SSR
      const { default: jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      
      // En-tête du rapport
      doc.setFontSize(20);
      doc.text(report.nom, 20, 30); // Changed from 'titre' to 'nom'
      
      doc.setFontSize(12);
      doc.text(`Date de génération: ${new Date(report.date_generation).toLocaleDateString()}`, 20, 45);
      doc.text(`Généré par: ${report.genere_par_id || 'N/A'}`, 20, 55); // Changed from 'genere_par' to 'genere_par_id'
      doc.text(`Session: ${report.session?.nom || 'N/A'}`, 20, 65);
      
      // Contenu du rapport (simplifié pour l'instant)
      let yPosition = 85;
      doc.setFontSize(14);
      doc.text('Contenu du rapport:', 20, yPosition);
      
      yPosition += 15;
      doc.setFontSize(10);
      
      // Afficher le contenu JSON de manière lisible
      const contentText = JSON.stringify(report.contenu, null, 2);
      const lines = doc.splitTextToSize(contentText, 170);
      
      lines.forEach((line: string) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += 5;
      });
      
      // Télécharger le PDF
      doc.save(`${report.nom.replace(/[^a-z0-9]/gi, '_')}.pdf`); // Changed from 'titre' to 'nom'
      
      toast.success('Rapport exporté en PDF');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error('Erreur lors de l\'export PDF');
    }
  }, []);

  // Exporter un rapport en Excel
  const exportToExcel = useCallback(async (report: InventoryReport) => {
    try {
      // Import dynamique de xlsx pour éviter les problèmes SSR
      const XLSX = await import('xlsx');
      
      // Créer un nouveau workbook
      const wb = XLSX.utils.book_new();
      
      // Créer une feuille avec les métadonnées
      const metaData = [
        ['Titre', report.nom], // Changed from 'titre' to 'nom'
        ['Type', report.type],
        ['Date de génération', new Date(report.date_generation).toLocaleDateString()],
        ['Généré par', report.genere_par_id || 'N/A'], // Changed from 'genere_par' to 'genere_par_id'
        ['Session', report.session?.nom || 'N/A'],
        [''],
        ['Contenu du rapport:']
      ];
      
      // Ajouter le contenu du rapport
      if (report.contenu && typeof report.contenu === 'object') {
        Object.entries(report.contenu).forEach(([key, value]) => {
          metaData.push([key, JSON.stringify(value)]);
        });
      }
      
      const ws = XLSX.utils.aoa_to_sheet(metaData);
      XLSX.utils.book_append_sheet(wb, ws, 'Rapport');
      
      // Télécharger le fichier Excel
      XLSX.writeFile(wb, `${report.nom.replace(/[^a-z0-9]/gi, '_')}.xlsx`); // Changed from 'titre' to 'nom'
      
      toast.success('Rapport exporté en Excel');
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  }, []);

  // Charger les rapports au montage du composant
  useEffect(() => {
    if (tenantId) {
      fetchReports();
    }
  }, [tenantId, fetchReports]);

  return {
    reports,
    metrics,
    isLoading,
    isGenerating,
    fetchReports,
    generateReport,
    deleteReport,
    exportToPDF,
    exportToExcel
  };
};