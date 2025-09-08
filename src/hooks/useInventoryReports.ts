import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InventoryReport {
  id: string;
  nom: string;
  type: 'session' | 'ecarts' | 'valorisation' | 'synthese';
  session: string;
  dateGeneration: Date;
  generePar: string;
  statut: 'genere' | 'envoye' | 'archive';
  tailleFichier: string;
  format: 'PDF' | 'Excel' | 'CSV';
  description: string;
}

export interface ReportMetrics {
  totalRapports: number;
  rapportsRecents: number;
  tailleTotal: string;
  sessionsAnalysees: number;
}

export const useInventoryReports = () => {
  const [reports, setReports] = useState<InventoryReport[]>([]);
  const [metrics, setMetrics] = useState<ReportMetrics>({
    totalRapports: 0,
    rapportsRecents: 0,
    tailleTotal: '0 MB',
    sessionsAnalysees: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Pour l'instant, on utilise des données mockées car la table n'existe pas encore
      const mockReports: InventoryReport[] = [
        {
          id: '1',
          nom: 'Rapport Inventaire Q1 2024',
          type: 'session',
          session: 'Inventaire Général Q1 2024',
          dateGeneration: new Date('2024-01-20'),
          generePar: 'Marie Dubois',
          statut: 'genere',
          tailleFichier: '2.5 MB',
          format: 'PDF',
          description: 'Rapport complet de la session d\'inventaire Q1'
        },
        {
          id: '2',
          nom: 'Analyse des Écarts - Antibiotiques',
          type: 'ecarts',
          session: 'Inventaire Cyclique Antibiotiques',
          dateGeneration: new Date('2024-01-25'),
          generePar: 'Jean Martin',
          statut: 'envoye',
          tailleFichier: '1.2 MB',
          format: 'Excel',
          description: 'Détail des écarts constatés sur les antibiotiques'
        }
      ];

      setReports(mockReports);
      
      setMetrics({
        totalRapports: mockReports.length,
        rapportsRecents: mockReports.filter(r => 
          new Date(r.dateGeneration).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        ).length,
        tailleTotal: '3.7 MB',
        sessionsAnalysees: 2
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
      toast.error('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type: string, sessionId?: string) => {
    try {
      // Temporairement simuler la génération de rapport
      toast.success(`Rapport ${type} généré avec succès`);
      await fetchReports();
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      toast.error('Erreur lors de la génération du rapport');
      throw error;
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    metrics,
    loading,
    generateReport,
    refetch: fetchReports
  };
};