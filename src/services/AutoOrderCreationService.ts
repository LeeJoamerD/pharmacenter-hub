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

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id, id')
        .eq('user_id', user.user.id)
        .single();

      if (!personnel) throw new Error('Personnel non trouvé');

      // Créer la commande
      const { data: commande, error: commandeError } = await supabase
        .from('commandes_fournisseurs')
        .insert({
          tenant_id: personnel.tenant_id,
          fournisseur_id: supplierId,
          date_commande: new Date().toISOString(),
          statut: 'Livré',
          agent_id: personnel.id,
          valide_par_id: personnel.id
        })
        .select()
        .single();

      if (commandeError) throw commandeError;
      if (!commande) throw new Error('Erreur lors de la création de la commande');

      // Calculer le montant total de la commande
      let montantTotal = 0;

      // Créer les lignes de commande
      const lignesCommande = lines
        .filter(line => line.produitId)
        .map(line => {
          const prixUnitaire = line.prixAchatReel || 0;
          const quantite = line.quantiteCommandee || line.quantiteRecue;
          const sousTotal = prixUnitaire * quantite;
          montantTotal += sousTotal;

          return {
            tenant_id: personnel.tenant_id,
            commande_id: commande.id,
            produit_id: line.produitId!,
            quantite: quantite,
            prix_unitaire: prixUnitaire,
            sous_total: sousTotal,
            statut: 'Validé'
          };
        });

      if (lignesCommande.length > 0) {
        const { error: lignesError } = await supabase
          .from('commandes_lignes')
          .insert(lignesCommande);

        if (lignesError) throw lignesError;
      }

      // Mettre à jour le montant total de la commande si nécessaire
      // (selon votre schéma de base de données)
      // await supabase
      //   .from('commandes_fournisseurs')
      //   .update({ montant_total: montantTotal })
      //   .eq('id', commande.id);

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
