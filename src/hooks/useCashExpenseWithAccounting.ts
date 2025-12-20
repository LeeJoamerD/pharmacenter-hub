/**
 * Hook pour enregistrer une dépense de caisse avec génération automatique d'écriture comptable
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

export interface ExpenseCategory {
  id: string;
  label: string;
  accountNumber: string;
  accountLabel: string;
}

// Catégories de dépenses prédéfinies avec correspondance comptable (comptes existants dans le plan comptable)
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'fournitures', label: 'Fournitures de bureau', accountNumber: '605', accountLabel: 'Autres achats' },
  { id: 'transport', label: 'Frais de transport', accountNumber: '611', accountLabel: 'Transports sur achats' },
  { id: 'entretien', label: 'Petit matériel / Entretien', accountNumber: '624', accountLabel: 'Entretien, réparations et maintenance' },
  { id: 'telecom', label: 'Téléphone / Internet', accountNumber: '626', accountLabel: 'Frais postaux et de télécommunications' },
  { id: 'poste', label: 'Frais postaux', accountNumber: '626', accountLabel: 'Frais postaux et de télécommunications' },
  { id: 'energie', label: 'Eau / Électricité', accountNumber: '605', accountLabel: 'Autres achats' },
  { id: 'maintenance', label: 'Maintenance / Réparations', accountNumber: '624', accountLabel: 'Entretien, réparations et maintenance' },
  { id: 'divers', label: 'Autres charges', accountNumber: '65', accountLabel: 'Autres charges' },
];

export interface CashExpenseData {
  categoryId: string;
  amount: number;
  description: string;
  reference?: string;
  sessionId: string;
}

export interface ExpenseResult {
  success: boolean;
  mouvementId?: string;
  ecritureId?: string;
  error?: string;
}

export const useCashExpenseWithAccounting = () => {
  const { tenantId, currentUser } = useTenant();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitExpense = async (data: CashExpenseData): Promise<ExpenseResult> => {
    if (!tenantId || !currentUser?.id) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    setIsSubmitting(true);
    
    try {
      // Trouver la catégorie
      const category = EXPENSE_CATEGORIES.find(c => c.id === data.categoryId);
      if (!category) {
        throw new Error('Catégorie de dépense invalide');
      }

      // Enregistrer le mouvement de caisse (type Dépense)
      const { data: mouvement, error: mouvementError } = await supabase
        .from('mouvements_caisse')
        .insert({
          tenant_id: tenantId,
          session_caisse_id: data.sessionId,
          type_mouvement: 'Dépense',
          motif: category.label,
          montant: data.amount,
          description: data.description,
          reference: data.reference || null,
          agent_id: currentUser.id,
          date_mouvement: new Date().toISOString()
        })
        .select('id')
        .single();

      if (mouvementError) {
        console.error('Erreur mouvement caisse:', mouvementError);
        throw new Error('Erreur lors de l\'enregistrement du mouvement de caisse');
      }

      // 3. Créer l'écriture comptable
      // Trouver le journal de caisse (CAI)
      const { data: journal, error: journalError } = await supabase
        .from('accounting_journals')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('code', 'CAI')
        .eq('is_active', true)
        .single();

      if (journalError || !journal) {
        console.warn('Journal de caisse non trouvé, écriture comptable non créée');
        return { 
          success: true, 
          mouvementId: mouvement.id,
          error: 'Mouvement enregistré, mais journal comptable CAI non trouvé'
        };
      }

      // Trouver l'exercice comptable actif
      const { data: exercice, error: exerciceError } = await supabase
        .from('exercices_comptables')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('statut', 'Ouvert')
        .single();

      if (exerciceError || !exercice) {
        console.warn('Exercice comptable non trouvé');
        return { 
          success: true, 
          mouvementId: mouvement.id,
          error: 'Mouvement enregistré, mais pas d\'exercice comptable ouvert'
        };
      }

      // Trouver les comptes comptables
      // Compte de charge (classe 6)
      const { data: compteCharge, error: chargeError } = await supabase
        .from('plan_comptable')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('numero_compte', category.accountNumber)
        .single();

      // Compte caisse (571 ou 5311)
      const { data: compteCaisse, error: caisseError } = await supabase
        .from('plan_comptable')
        .select('id')
        .eq('tenant_id', tenantId)
        .or('numero_compte.eq.571,numero_compte.eq.5311')
        .limit(1)
        .single();

      if (!compteCharge || !compteCaisse) {
        console.warn('Comptes comptables non trouvés');
        return { 
          success: true, 
          mouvementId: mouvement.id,
          error: 'Mouvement enregistré, mais comptes comptables non configurés'
        };
      }

      // Générer le numéro de pièce
      const { data: numeroPiece, error: pieceError } = await supabase.rpc('generate_piece_number', {
        p_journal_id: journal.id
      });

      if (pieceError) {
        console.warn('Erreur génération numéro pièce:', pieceError);
      }

      // Créer l'écriture comptable
      const { data: ecriture, error: ecritureError } = await supabase
        .from('ecritures_comptables')
        .insert({
          tenant_id: tenantId,
          exercice_id: exercice.id,
          journal_id: journal.id,
          numero_piece: numeroPiece || `DEP-${Date.now()}`,
          date_ecriture: new Date().toISOString().split('T')[0],
          libelle: `Dépense caisse: ${data.description}`,
          reference_type: 'mouvement_caisse',
          reference_id: mouvement.id,
          statut: 'Brouillon',
          created_by_id: currentUser.id,
          montant_total: data.amount
        })
        .select('id')
        .single();

      if (ecritureError) {
        console.error('Erreur écriture comptable:', ecritureError);
        return { 
          success: true, 
          mouvementId: mouvement.id,
          error: 'Mouvement enregistré, erreur lors de la création de l\'écriture comptable'
        };
      }

      // Créer les lignes d'écriture
      const lignesInsert = [
        {
          tenant_id: tenantId,
          ecriture_id: ecriture.id,
          compte_id: compteCharge.id,
          libelle: `${category.label}: ${data.description}`,
          debit: data.amount,
          credit: 0
        },
        {
          tenant_id: tenantId,
          ecriture_id: ecriture.id,
          compte_id: compteCaisse.id,
          libelle: 'Sortie de caisse',
          debit: 0,
          credit: data.amount
        }
      ];

      const { error: lignesError } = await supabase
        .from('lignes_ecriture')
        .insert(lignesInsert);

      if (lignesError) {
        console.error('Erreur lignes écriture:', lignesError);
      }

      return {
        success: true,
        mouvementId: mouvement.id,
        ecritureId: ecriture.id
      };

    } catch (error: any) {
      console.error('Erreur dépense caisse:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'enregistrement de la dépense'
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitExpense,
    isSubmitting,
    expenseCategories: EXPENSE_CATEGORIES
  };
};
