import { supabase } from '@/integrations/supabase/client';

export interface SupplierStats {
  totalCommandes: number;
  montantTotal: number;
  delaiMoyenLivraison: number;
  tauxLivraisonATemps: number;
  noteEvaluation: number;
  nombreEvaluations: number;
  derniereLivraison?: string;
  premiereCommande?: string;
  activeCommandes: number;
  commandesLivrees: number;
}

export interface SupplierLocation {
  adresse?: string;
  ville?: string;
  pays?: string;
  telephone?: string;
  email?: string;
}

export class SupplierStatsService {
  
  static async getSupplierStats(supplierId: string): Promise<SupplierStats> {
    try {
      // 1. Statistiques des commandes
      const { data: commandes, error: commandesError } = await supabase
        .from('commandes_fournisseurs')
        .select(`
          id, 
          statut, 
          date_commande, 
          created_at,
          lignes_commande_fournisseur(
            quantite_commandee,
            prix_achat_unitaire_attendu
          )
        `)
        .eq('fournisseur_id', supplierId);

      if (commandesError) throw commandesError;

      // 2. Statistiques des réceptions/livraisons
      const { data: receptions, error: receptionsError } = await supabase
        .from('receptions_fournisseurs')
        .select('date_reception, created_at, statut')
        .eq('fournisseur_id', supplierId)
        .eq('statut', 'Validé');

      if (receptionsError) throw receptionsError;

      // 3. Évaluations avec champs corrects
      const { data: evaluations, error: evaluationsError } = await supabase
        .from('evaluations_fournisseurs')
        .select('note_globale')
        .eq('fournisseur_id', supplierId);

      if (evaluationsError) throw evaluationsError;

      // Calculs des statistiques
      const totalCommandes = commandes?.length || 0;
      const activeCommandes = commandes?.filter(c => ['En cours', 'Confirmé', 'Expédié'].includes(c.statut || '')).length || 0;
      const commandesLivrees = commandes?.filter(c => c.statut === 'Livré').length || 0;

      // Calcul du montant total
      const montantTotal = commandes?.reduce((total, commande) => {
        const lignesTotal = commande.lignes_commande_fournisseur?.reduce((sum, ligne) => {
          return sum + (ligne.quantite_commandee * (ligne.prix_achat_unitaire_attendu || 0));
        }, 0) || 0;
        return total + lignesTotal;
      }, 0) || 0;

      // Calcul des délais de livraison
      let delaiMoyenLivraison = 7; // Valeur par défaut
      if (commandes && commandes.length > 0 && receptions && receptions.length > 0) {
        const delais = commandes
          .filter(c => c.statut === 'Livré')
          .map(commande => {
            const reception = receptions.find(r => 
              Math.abs(new Date(r.date_reception || r.created_at).getTime() - 
                      new Date(commande.date_commande || commande.created_at).getTime()) < 30 * 24 * 60 * 60 * 1000
            );
            if (reception) {
              const dateCommande = new Date(commande.date_commande || commande.created_at);
              const dateReception = new Date(reception.date_reception || reception.created_at);
              return Math.ceil((dateReception.getTime() - dateCommande.getTime()) / (24 * 60 * 60 * 1000));
            }
            return null;
          })
          .filter(delai => delai !== null) as number[];

        if (delais.length > 0) {
          delaiMoyenLivraison = Math.round(delais.reduce((sum, delai) => sum + delai, 0) / delais.length);
        }
      }

      // Calcul du taux de livraison à temps (délai respecté)
      const tauxLivraisonATemps = commandesLivrees > 0 ? 
        Math.round((commandesLivrees / totalCommandes) * 100) : 0;

      // Calcul de la note moyenne
      let noteEvaluation = 0;
      let nombreEvaluations = 0;
      if (evaluations && evaluations.length > 0) {
        nombreEvaluations = evaluations.length;
        const totalNotes = evaluations.reduce((sum, evaluation) => sum + (evaluation.note_globale || 0), 0);
        noteEvaluation = Math.round((totalNotes / nombreEvaluations) * 10) / 10;
      }

      // Dates importantes
      const dates = commandes?.map(c => new Date(c.date_commande || c.created_at).getTime()) || [];
      const premiereCommande = dates.length > 0 ? 
        new Date(Math.min(...dates)).toISOString().split('T')[0] : undefined;
      const derniereLivraison = receptions && receptions.length > 0 ?
        new Date(Math.max(...receptions.map(r => new Date(r.date_reception || r.created_at).getTime()))).toISOString().split('T')[0] : undefined;

      return {
        totalCommandes,
        montantTotal,
        delaiMoyenLivraison,
        tauxLivraisonATemps,
        noteEvaluation,
        nombreEvaluations,
        derniereLivraison,
        premiereCommande,
        activeCommandes,
        commandesLivrees
      };

    } catch (error) {
      console.error('Erreur lors du calcul des statistiques fournisseur:', error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        totalCommandes: 0,
        montantTotal: 0,
        delaiMoyenLivraison: 7,
        tauxLivraisonATemps: 0,
        noteEvaluation: 0,
        nombreEvaluations: 0,
        activeCommandes: 0,
        commandesLivrees: 0
      };
    }
  }

  static async getSupplierLocation(supplierId: string): Promise<SupplierLocation> {
    try {
      const { data: supplier, error } = await supabase
        .from('fournisseurs')
        .select('adresse, telephone_appel, telephone_whatsapp, email, niu')
        .eq('id', supplierId)
        .single();

      if (error) throw error;

      return {
        adresse: supplier?.adresse || 'Non renseigné',
        ville: 'Non renseigné', // Peut être extrait de l'adresse si structuré
        pays: 'Cameroun', // Valeur par défaut
        telephone: supplier?.telephone_appel || supplier?.telephone_whatsapp || 'Non renseigné',
        email: supplier?.email || 'Non renseigné'
      };

    } catch (error) {
      console.error('Erreur lors de la récupération de la localisation:', error);
      return {
        adresse: 'Non renseigné',
        ville: 'Non renseigné',
        pays: 'Cameroun',
        telephone: 'Non renseigné',
        email: 'Non renseigné'
      };
    }
  }

  static async getAllSuppliersWithStats(): Promise<Array<{
    id: string;
    nom: string;
    location: SupplierLocation;
    stats: SupplierStats;
    statut: 'actif' | 'inactif';
  }>> {
    try {
      // Récupérer tous les fournisseurs
      const { data: suppliers, error } = await supabase
        .from('fournisseurs')
        .select('id, nom, adresse, telephone_appel, email')
        .order('nom');

      if (error) throw error;

      // Pour chaque fournisseur, récupérer ses stats
      const suppliersWithStats = await Promise.all(
        (suppliers || []).map(async (supplier) => {
          const [stats, location] = await Promise.all([
            this.getSupplierStats(supplier.id),
            this.getSupplierLocation(supplier.id)
          ]);

          return {
            id: supplier.id,
            nom: supplier.nom,
            location,
            stats,
            statut: 'actif' as const // Pour l'instant tous actifs
          };
        })
      );

      return suppliersWithStats;

    } catch (error) {
      console.error('Erreur lors de la récupération des fournisseurs avec stats:', error);
      return [];
    }
  }
}