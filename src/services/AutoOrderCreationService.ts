import { supabase } from '@/integrations/supabase/client';
import type { ExcelReceptionLine, AutoOrderCreationResult } from '@/types/excelImport';

export class AutoOrderCreationService {
  /**
   * Crée automatiquement une commande à partir des données Excel
   */
  static async createOrderFromExcelData(
    supplierId: string,
    lines: ExcelReceptionLine[],
    productMatches: Map<string, string>
  ): Promise<AutoOrderCreationResult> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error('Utilisateur non authentifié');

      const personnelQuery = (supabase as any)
        .from('personnel')
        .select('tenant_id, id')
        .eq('auth_user_id', user.user.id)
        .single();
      
      const { data: personnel } = await personnelQuery;

      if (!personnel) throw new Error('Personnel non trouvé');

      // Calculer les montants totaux depuis les lignes
      let montantHT = 0;
      lines.filter(line => line.produitId).forEach(line => {
        const prixUnitaire = line.prixAchatReel || 0;
        const quantite = line.quantiteCommandee || line.quantiteRecue;
        montantHT += prixUnitaire * quantite;
      });

      // Calculs comme dans OrderForm.tsx
      // TVA par défaut à 18% (taux standard)
      const montantTVA = montantHT * 0.18;
      // Centime additionnel : TVA × 1%
      const montantCAdd = montantTVA * 0.01;
      // ASDI : ((HT + TVA) × 0.42) / 100
      const montantASDI = ((montantHT + montantTVA) * 0.42) / 100;
      // TTC = HT + TVA + CAdd + ASDI
      const montantTTC = montantHT + montantTVA + montantCAdd + montantASDI;

      // Créer la commande avec les montants
      const { data: commande, error: commandeError } = await supabase
        .from('commandes_fournisseurs')
        .insert({
          tenant_id: personnel.tenant_id,
          fournisseur_id: supplierId,
          date_commande: new Date().toISOString(),
          statut: 'Livré',
          agent_id: personnel.id,
          valide_par_id: personnel.id,
          montant_ht: Math.round(montantHT),
          montant_tva: Math.round(montantTVA),
          montant_centime_additionnel: Math.round(montantCAdd),
          montant_asdi: Math.round(montantASDI),
          montant_ttc: Math.round(montantTTC),
        })
        .select()
        .single();

      if (commandeError) throw commandeError;
      if (!commande) throw new Error('Erreur lors de la création de la commande');

      // Créer les lignes de commande
      const lignesCommande = lines
        .filter(line => line.produitId)
        .map(line => {
          const prixUnitaire = line.prixAchatReel || 0;
          const quantite = line.quantiteCommandee || line.quantiteRecue;

          return {
            tenant_id: personnel.tenant_id,
            commande_id: commande.id,
            produit_id: line.produitId!,
            quantite_commandee: quantite,
            prix_achat_unitaire_attendu: prixUnitaire
          };
        });

      if (lignesCommande.length > 0) {
        const { error: lignesError } = await (supabase
          .from('lignes_commande_fournisseur')
          .insert(lignesCommande) as any);

        if (lignesError) throw lignesError;
      }


      return {
        orderId: commande.id,
        orderNumber: commande.id.substring(0, 8).toUpperCase(),
        linesCreated: lignesCommande.length
      };
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      throw new Error(
        `Erreur lors de la création automatique de la commande: ${
          error instanceof Error ? error.message : 'Erreur inconnue'
        }`
      );
    }
  }

  /**
   * Met à jour le statut d'une commande existante
   */
  static async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('commandes_fournisseurs')
        .update({ statut: status })
        .eq('id', orderId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw new Error(
        `Erreur lors de la mise à jour du statut: ${
          error instanceof Error ? error.message : 'Erreur inconnue'
        }`
      );
    }
  }
}
