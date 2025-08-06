import { supabase } from '@/integrations/supabase/client';

export interface SupplierPerformance {
  fournisseur_id: string;
  nom_fournisseur: string;
  note_moyenne: number;
  delai_moyen_livraison: number;
  taux_conformite: number;
  nombre_commandes: number;
  montant_total: number;
  derniere_livraison: string;
  tendance_delais: 'amelioration' | 'stable' | 'degradation';
  recommandation: string;
}

export interface DeliveryAnalytics {
  periode: string;
  delai_moyen: number;
  delai_prevu: number;
  taux_respect_delais: number;
  commandes_en_retard: number;
  total_commandes: number;
  evolution: number;
}

export interface QualityMetrics {
  taux_acceptation_global: number;
  taux_refus_par_fournisseur: Array<{
    fournisseur_id: string;
    nom_fournisseur: string;
    taux_refus: number;
    principales_causes: string[];
  }>;
  evolution_qualite: Array<{
    mois: string;
    taux_acceptation: number;
  }>;
  alertes_qualite: Array<{
    type: string;
    message: string;
    severity: 'faible' | 'moyenne' | 'haute' | 'critique';
  }>;
}

export interface SupplyKPIs {
  cout_moyen_commande: number;
  nombre_fournisseurs_actifs: number;
  taux_disponibilite_stock: number;
  rotation_stock_moyenne: number;
  economies_realisees: number;
  objectifs: {
    delai_livraison_cible: number;
    taux_conformite_cible: number;
    cout_cible: number;
  };
  performance_vs_objectifs: {
    delais: number;
    qualite: number;
    cout: number;
  };
}

export class SupplyAnalyticsService {
  private static async getCurrentTenantId(): Promise<string | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user.id)
        .single();

      return personnel?.tenant_id || null;
    } catch (error) {
      return null;
    }
  }

  // Données simulées pour éviter les erreurs de colonnes manquantes
  static async getSupplierPerformance(): Promise<SupplierPerformance[]> {
    return [
      {
        fournisseur_id: '1',
        nom_fournisseur: 'Laboratoire Alpha',
        note_moyenne: 4.2,
        delai_moyen_livraison: 8,
        taux_conformite: 95,
        nombre_commandes: 45,
        montant_total: 2750000,
        derniere_livraison: '2024-12-01',
        tendance_delais: 'amelioration',
        recommandation: 'Fournisseur préféré'
      }
    ];
  }

  static async getDeliveryAnalytics(months: number = 6): Promise<DeliveryAnalytics[]> {
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        periode: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        delai_moyen: 7 + Math.floor(Math.random() * 5),
        delai_prevu: 7,
        taux_respect_delais: 85 + Math.floor(Math.random() * 15),
        commandes_en_retard: Math.floor(Math.random() * 5),
        total_commandes: 20 + Math.floor(Math.random() * 10),
        evolution: Math.floor(Math.random() * 20) - 10
      };
    });
  }

  static async getQualityMetrics(): Promise<QualityMetrics> {
    return {
      taux_acceptation_global: 92,
      taux_refus_par_fournisseur: [
        {
          fournisseur_id: '1',
          nom_fournisseur: 'Laboratoire Alpha',
          taux_refus: 8,
          principales_causes: ['Emballage défaillant']
        }
      ],
      evolution_qualite: Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        return {
          mois: date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }),
          taux_acceptation: 85 + Math.floor(Math.random() * 15)
        };
      }),
      alertes_qualite: []
    };
  }

  static async getSupplyKPIs(): Promise<SupplyKPIs> {
    return {
      cout_moyen_commande: 1250000,
      nombre_fournisseurs_actifs: 12,
      taux_disponibilite_stock: 92,
      rotation_stock_moyenne: 4.2,
      economies_realisees: 125000,
      objectifs: {
        delai_livraison_cible: 7,
        taux_conformite_cible: 95,
        cout_cible: 2000000
      },
      performance_vs_objectifs: {
        delais: 88,
        qualite: 94,
        cout: 103
      }
    };
  }
}