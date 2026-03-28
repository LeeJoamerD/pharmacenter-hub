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

  static async getSupplierPerformance(): Promise<SupplierPerformance[]> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) return [];

    try {
      // Fetch fournisseurs
      const { data: fournisseurs } = await supabase
        .from('fournisseurs')
        .select('id, nom')
        .eq('tenant_id', tenantId)
        .eq('statut', 'actif');

      if (!fournisseurs || fournisseurs.length === 0) return [];

      // Fetch evaluations
      const { data: evaluations } = await supabase
        .from('evaluations_fournisseurs')
        .select('fournisseur_id, note_globale, note_delai, note_qualite')
        .eq('tenant_id', tenantId);

      // Fetch commandes
      const { data: commandes } = await supabase
        .from('commandes_fournisseurs')
        .select('fournisseur_id, montant_ttc, date_commande, statut')
        .eq('tenant_id', tenantId);

      // Fetch receptions
      const { data: receptions } = await supabase
        .from('receptions_fournisseurs')
        .select('fournisseur_id, date_reception, commande_id, emballage_conforme, etiquetage_correct, temperature_respectee')
        .eq('tenant_id', tenantId);

      return fournisseurs.map(f => {
        const fEvals = evaluations?.filter(e => e.fournisseur_id === f.id) || [];
        const fCommandes = commandes?.filter(c => c.fournisseur_id === f.id) || [];
        const fReceptions = receptions?.filter(r => r.fournisseur_id === f.id) || [];

        const noteMoyenne = fEvals.length > 0
          ? fEvals.reduce((sum, e) => sum + (e.note_globale || 0), 0) / fEvals.length
          : 0;

        const montantTotal = fCommandes.reduce((sum, c) => sum + (c.montant_ttc || 0), 0);

        // Calculer délai moyen entre commande et réception
        let delaiMoyen = 0;
        const delais: number[] = [];
        fReceptions.forEach(r => {
          if (r.commande_id && r.date_reception) {
            const cmd = fCommandes.find(c => c.fournisseur_id === f.id);
            if (cmd?.date_commande) {
              const diff = Math.abs(new Date(r.date_reception).getTime() - new Date(cmd.date_commande).getTime());
              delais.push(Math.ceil(diff / (1000 * 60 * 60 * 24)));
            }
          }
        });
        delaiMoyen = delais.length > 0 ? Math.round(delais.reduce((a, b) => a + b, 0) / delais.length) : 0;

        // Taux de conformité basé sur les contrôles de réception
        const receptionsAvecControle = fReceptions.filter(r => r.emballage_conforme !== null);
        const conformes = receptionsAvecControle.filter(r => r.emballage_conforme && r.etiquetage_correct && r.temperature_respectee);
        const tauxConformite = receptionsAvecControle.length > 0
          ? Math.round((conformes.length / receptionsAvecControle.length) * 100)
          : 100;

        const derniereReception = fReceptions.length > 0
          ? fReceptions.sort((a, b) => new Date(b.date_reception || '').getTime() - new Date(a.date_reception || '').getTime())[0]
          : null;

        // Tendance basée sur les évaluations récentes vs anciennes
        let tendance: 'amelioration' | 'stable' | 'degradation' = 'stable';
        if (fEvals.length >= 2) {
          const sorted = [...fEvals].sort((a, b) => (b.note_globale || 0) - (a.note_globale || 0));
          const recentAvg = sorted.slice(0, Math.ceil(sorted.length / 2)).reduce((s, e) => s + (e.note_globale || 0), 0) / Math.ceil(sorted.length / 2);
          const oldAvg = sorted.slice(Math.ceil(sorted.length / 2)).reduce((s, e) => s + (e.note_globale || 0), 0) / (sorted.length - Math.ceil(sorted.length / 2));
          if (recentAvg > oldAvg + 0.3) tendance = 'amelioration';
          else if (recentAvg < oldAvg - 0.3) tendance = 'degradation';
        }

        let recommandation = 'Fournisseur standard';
        if (noteMoyenne >= 4) recommandation = 'Fournisseur préféré';
        else if (noteMoyenne >= 3) recommandation = 'Fournisseur fiable';
        else if (noteMoyenne > 0) recommandation = 'À surveiller';

        return {
          fournisseur_id: f.id,
          nom_fournisseur: f.nom,
          note_moyenne: Math.round(noteMoyenne * 10) / 10,
          delai_moyen_livraison: delaiMoyen,
          taux_conformite: tauxConformite,
          nombre_commandes: fCommandes.length,
          montant_total: montantTotal,
          derniere_livraison: derniereReception?.date_reception || '-',
          tendance_delais: tendance,
          recommandation
        };
      });
    } catch (error) {
      console.error('Erreur getSupplierPerformance:', error);
      return [];
    }
  }

  static async getDeliveryAnalytics(months: number = 6): Promise<DeliveryAnalytics[]> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) return [];

    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data: commandes } = await supabase
        .from('commandes_fournisseurs')
        .select('id, date_commande, statut, montant_ttc')
        .eq('tenant_id', tenantId)
        .gte('date_commande', startDate.toISOString().split('T')[0]);

      const { data: receptions } = await supabase
        .from('receptions_fournisseurs')
        .select('commande_id, date_reception')
        .eq('tenant_id', tenantId)
        .gte('date_reception', startDate.toISOString().split('T')[0]);

      const result: DeliveryAnalytics[] = [];
      const delaiPrevu = 7; // Délai cible standard

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const moisStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const moisDebut = new Date(date.getFullYear(), date.getMonth(), 1);
        const moisFin = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const commandesMois = commandes?.filter(c => {
          const d = new Date(c.date_commande || '');
          return d >= moisDebut && d <= moisFin;
        }) || [];

        const delais: number[] = [];
        let enRetard = 0;

        commandesMois.forEach(cmd => {
          const reception = receptions?.find(r => r.commande_id === cmd.id);
          if (reception?.date_reception && cmd.date_commande) {
            const diff = Math.ceil((new Date(reception.date_reception).getTime() - new Date(cmd.date_commande).getTime()) / (1000 * 60 * 60 * 24));
            delais.push(diff);
            if (diff > delaiPrevu) enRetard++;
          }
        });

        const delaiMoyen = delais.length > 0 ? Math.round(delais.reduce((a, b) => a + b, 0) / delais.length) : 0;
        const tauxRespect = commandesMois.length > 0 ? Math.round(((commandesMois.length - enRetard) / commandesMois.length) * 100) : 100;

        // Évolution par rapport au mois précédent
        const prevMonth = result.length > 0 ? result[result.length - 1] : null;
        const evolution = prevMonth && prevMonth.delai_moyen > 0
          ? Math.round(((delaiMoyen - prevMonth.delai_moyen) / prevMonth.delai_moyen) * 100)
          : 0;

        result.push({
          periode: moisStr,
          delai_moyen: delaiMoyen,
          delai_prevu: delaiPrevu,
          taux_respect_delais: tauxRespect,
          commandes_en_retard: enRetard,
          total_commandes: commandesMois.length,
          evolution
        });
      }

      return result;
    } catch (error) {
      console.error('Erreur getDeliveryAnalytics:', error);
      return [];
    }
  }

  static async getQualityMetrics(): Promise<QualityMetrics> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) return {
      taux_acceptation_global: 0,
      taux_refus_par_fournisseur: [],
      evolution_qualite: [],
      alertes_qualite: []
    };

    try {
      const { data: receptions } = await supabase
        .from('receptions_fournisseurs')
        .select('fournisseur_id, date_reception, emballage_conforme, etiquetage_correct, temperature_respectee, statut')
        .eq('tenant_id', tenantId);

      const { data: fournisseurs } = await supabase
        .from('fournisseurs')
        .select('id, nom')
        .eq('tenant_id', tenantId);

      if (!receptions || receptions.length === 0) {
        return {
          taux_acceptation_global: 100,
          taux_refus_par_fournisseur: [],
          evolution_qualite: [],
          alertes_qualite: []
        };
      }

      // Taux d'acceptation global
      const receptionsAvecControle = receptions.filter(r => r.emballage_conforme !== null);
      const conformes = receptionsAvecControle.filter(r => r.emballage_conforme && r.etiquetage_correct && r.temperature_respectee);
      const tauxAcceptation = receptionsAvecControle.length > 0
        ? Math.round((conformes.length / receptionsAvecControle.length) * 100)
        : 100;

      // Taux de refus par fournisseur
      const tauxRefus = (fournisseurs || []).map(f => {
        const fReceptions = receptionsAvecControle.filter(r => r.fournisseur_id === f.id);
        const fNonConformes = fReceptions.filter(r => !r.emballage_conforme || !r.etiquetage_correct || !r.temperature_respectee);
        const causes: string[] = [];
        fNonConformes.forEach(r => {
          if (!r.emballage_conforme) causes.push('Emballage non conforme');
          if (!r.etiquetage_correct) causes.push('Étiquetage incorrect');
          if (!r.temperature_respectee) causes.push('Température non respectée');
        });

        return {
          fournisseur_id: f.id,
          nom_fournisseur: f.nom,
          taux_refus: fReceptions.length > 0 ? Math.round((fNonConformes.length / fReceptions.length) * 100) : 0,
          principales_causes: [...new Set(causes)]
        };
      }).filter(f => f.taux_refus > 0);

      // Évolution qualité par mois (6 derniers mois)
      const evolutionQualite: Array<{ mois: string; taux_acceptation: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const moisDebut = new Date(d.getFullYear(), d.getMonth(), 1);
        const moisFin = new Date(d.getFullYear(), d.getMonth() + 1, 0);

        const recMois = receptionsAvecControle.filter(r => {
          const dr = new Date(r.date_reception || '');
          return dr >= moisDebut && dr <= moisFin;
        });
        const confMois = recMois.filter(r => r.emballage_conforme && r.etiquetage_correct && r.temperature_respectee);

        evolutionQualite.push({
          mois: d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }),
          taux_acceptation: recMois.length > 0 ? Math.round((confMois.length / recMois.length) * 100) : 100
        });
      }

      // Alertes qualité
      const alertes: QualityMetrics['alertes_qualite'] = [];
      tauxRefus.forEach(f => {
        if (f.taux_refus > 30) {
          alertes.push({
            type: 'qualite_critique',
            message: `${f.nom_fournisseur} : taux de refus de ${f.taux_refus}%`,
            severity: 'critique'
          });
        } else if (f.taux_refus > 15) {
          alertes.push({
            type: 'qualite_degradee',
            message: `${f.nom_fournisseur} : taux de refus de ${f.taux_refus}%`,
            severity: 'haute'
          });
        }
      });

      return {
        taux_acceptation_global: tauxAcceptation,
        taux_refus_par_fournisseur: tauxRefus,
        evolution_qualite: evolutionQualite,
        alertes_qualite: alertes
      };
    } catch (error) {
      console.error('Erreur getQualityMetrics:', error);
      return { taux_acceptation_global: 0, taux_refus_par_fournisseur: [], evolution_qualite: [], alertes_qualite: [] };
    }
  }

  static async getSupplyKPIs(): Promise<SupplyKPIs> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) return {
      cout_moyen_commande: 0, nombre_fournisseurs_actifs: 0, taux_disponibilite_stock: 0,
      rotation_stock_moyenne: 0, economies_realisees: 0,
      objectifs: { delai_livraison_cible: 7, taux_conformite_cible: 95, cout_cible: 0 },
      performance_vs_objectifs: { delais: 0, qualite: 0, cout: 0 }
    };

    try {
      // Commandes
      const { data: commandes } = await supabase
        .from('commandes_fournisseurs')
        .select('montant_ttc, fournisseur_id')
        .eq('tenant_id', tenantId);

      // Fournisseurs actifs
      const { data: fournisseurs } = await supabase
        .from('fournisseurs')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('statut', 'actif');

      // Stock
      const { data: produits } = await supabase
        .from('produits_with_stock')
        .select('stock_actuel, stock_critique')
        .eq('tenant_id', tenantId);

      const totalCommandes = commandes?.length || 0;
      const montantTotal = commandes?.reduce((sum, c) => sum + (c.montant_ttc || 0), 0) || 0;
      const coutMoyen = totalCommandes > 0 ? Math.round(montantTotal / totalCommandes) : 0;

      const totalProduits = produits?.length || 0;
      const produitsEnStock = produits?.filter(p => (p.stock_actuel || 0) > 0).length || 0;
      const tauxDispo = totalProduits > 0 ? Math.round((produitsEnStock / totalProduits) * 100) : 0;

      // Receptions pour délais
      const deliveryData = await this.getDeliveryAnalytics(3);
      const delaiMoyenGlobal = deliveryData.length > 0
        ? Math.round(deliveryData.reduce((s, d) => s + d.delai_moyen, 0) / deliveryData.length)
        : 0;

      const qualityData = await this.getQualityMetrics();
      const delaiCible = 7;
      const conformiteCible = 95;

      return {
        cout_moyen_commande: coutMoyen,
        nombre_fournisseurs_actifs: fournisseurs?.length || 0,
        taux_disponibilite_stock: tauxDispo,
        rotation_stock_moyenne: 0, // Calculé par RotationAnalysisService
        economies_realisees: 0,
        objectifs: {
          delai_livraison_cible: delaiCible,
          taux_conformite_cible: conformiteCible,
          cout_cible: coutMoyen > 0 ? Math.round(coutMoyen * 0.9) : 0
        },
        performance_vs_objectifs: {
          delais: delaiCible > 0 && delaiMoyenGlobal > 0 ? Math.round((delaiCible / delaiMoyenGlobal) * 100) : 100,
          qualite: Math.round((qualityData.taux_acceptation_global / conformiteCible) * 100),
          cout: 100
        }
      };
    } catch (error) {
      console.error('Erreur getSupplyKPIs:', error);
      return {
        cout_moyen_commande: 0, nombre_fournisseurs_actifs: 0, taux_disponibilite_stock: 0,
        rotation_stock_moyenne: 0, economies_realisees: 0,
        objectifs: { delai_livraison_cible: 7, taux_conformite_cible: 95, cout_cible: 0 },
        performance_vs_objectifs: { delais: 0, qualite: 0, cout: 0 }
      };
    }
  }
}
