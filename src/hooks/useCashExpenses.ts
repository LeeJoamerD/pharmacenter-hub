import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CashExpense {
  id: string;
  session_caisse_id: string;
  type_mouvement: string;
  montant: number;
  motif: string;
  description: string | null;
  reference: string | null;
  notes: string | null;
  agent_id: string | null;
  date_mouvement: string | null;
  tenant_id: string;
  est_annule: boolean | null;
  annule_par: string | null;
  date_annulation: string | null;
  motif_annulation: string | null;
  session?: {
    id: string;
    caisse_id: string;
    agent_id: string;
    statut: string;
    date_ouverture: string;
    date_fermeture: string | null;
  };
  agent?: {
    id: string;
    noms: string;
    prenoms: string;
  };
  cancelled_by?: {
    id: string;
    noms: string;
    prenoms: string;
  };
}

export interface CashExpenseFilters {
  dateFrom?: string;
  dateTo?: string;
  motif?: string;
  agentId?: string;
  sessionStatus?: 'open' | 'closed' | 'all';
  includesCancelled?: boolean;
  search?: string;
}

export interface CashExpensePermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const MANAGER_ROLES = ['Admin', 'Pharmacien Titulaire', 'Secrétaire'];

export const useCashExpenses = () => {
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [expenses, setExpenses] = useState<CashExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<CashExpenseFilters>({
    sessionStatus: 'all',
    includesCancelled: false
  });
  const [sortField, setSortField] = useState<string>('date_mouvement');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentPersonnelId, setCurrentPersonnelId] = useState<string | null>(null);

  // Récupérer le rôle et l'ID de l'utilisateur courant
  useEffect(() => {
    const fetchCurrentUserInfo = async () => {
      if (!user || !currentTenant) return;
      
      const { data: personnelData } = await supabase
        .from('personnel')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .eq('tenant_id', currentTenant.id)
        .maybeSingle();
      
      if (personnelData) {
        setCurrentUserRole(personnelData.role);
        setCurrentPersonnelId(personnelData.id);
      }
    };

    fetchCurrentUserInfo();
  }, [user, currentTenant]);

  // Fonction pour récupérer toutes les dépenses (gestion pagination > 1000)
  const fetchAllExpenses = useCallback(async () => {
    if (!currentTenant || !currentPersonnelId || !currentUserRole) return;

    setLoading(true);
    try {
      // Requête simple pour récupérer les dépenses
      const { data, error } = await supabase
        .from('mouvements_caisse')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('type_mouvement', 'Dépense')
        .order('date_mouvement', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Récupérer les sessions pour enrichir les données
      const sessionIds = [...new Set((data || []).map(d => d.session_caisse_id).filter(Boolean))];
      const { data: sessions } = await supabase
        .from('sessions_caisse')
        .select('id, caisse_id, agent_id, statut, date_ouverture, date_fermeture')
        .in('id', sessionIds);

      // Récupérer les agents
      const agentIds = [...new Set((data || []).map(d => d.agent_id).filter(Boolean))];
      const { data: agents } = await supabase
        .from('personnel')
        .select('id, noms, prenoms')
        .in('id', agentIds);

      // Mapper les données
      let mappedData: CashExpense[] = (data || []).map(expense => ({
        ...expense,
        session: sessions?.find(s => s.id === expense.session_caisse_id),
        agent: agents?.find(a => a.id === expense.agent_id)
      }));

      // Filtrage côté client selon le rôle
      if (currentUserRole === 'Caissier') {
        mappedData = mappedData.filter(exp => 
          exp.session?.agent_id === currentPersonnelId && 
          exp.session?.statut === 'Ouverte'
        );
      }

      // Filtre par statut de session
      if (filters.sessionStatus === 'open') {
        mappedData = mappedData.filter(exp => exp.session?.statut === 'Ouverte');
      } else if (filters.sessionStatus === 'closed') {
        mappedData = mappedData.filter(exp => exp.session?.statut === 'Fermée');
      }

      // Filtre des annulées
      if (!filters.includesCancelled) {
        mappedData = mappedData.filter(exp => !exp.est_annule);
      }

      // Filtres additionnels
      if (filters.dateFrom) {
        mappedData = mappedData.filter(exp => exp.date_mouvement && exp.date_mouvement >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        mappedData = mappedData.filter(exp => exp.date_mouvement && exp.date_mouvement <= filters.dateTo! + 'T23:59:59');
      }
      if (filters.motif) {
        mappedData = mappedData.filter(exp => exp.motif === filters.motif);
      }
      if (filters.agentId) {
        mappedData = mappedData.filter(exp => exp.agent_id === filters.agentId);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        mappedData = mappedData.filter(exp => 
          exp.description?.toLowerCase().includes(search) ||
          exp.reference?.toLowerCase().includes(search) ||
          exp.motif?.toLowerCase().includes(search)
        );
      }

      setExpenses(mappedData);
    } catch (error) {
      console.error('Erreur lors de la récupération des dépenses:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les dépenses de caisse",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentTenant, currentPersonnelId, currentUserRole, filters, toast]);

  useEffect(() => {
    if (currentPersonnelId && currentUserRole) {
      fetchAllExpenses();
    }
  }, [fetchAllExpenses, currentPersonnelId, currentUserRole]);

  // Calcul des permissions pour une dépense
  const getPermissions = useCallback((expense: CashExpense): CashExpensePermissions => {
    if (!currentUserRole || !currentPersonnelId) {
      return { canView: false, canEdit: false, canDelete: false };
    }

    const isOpenSession = expense.session?.statut === 'Ouverte';
    const isOwnSession = expense.session?.agent_id === currentPersonnelId;
    const isAdminOrManager = MANAGER_ROLES.includes(currentUserRole);
    const isCancelled = expense.est_annule === true;

    // Dépense déjà annulée: pas d'actions possibles
    if (isCancelled) {
      return { canView: true, canEdit: false, canDelete: false };
    }

    // Caissier: ses propres sessions ouvertes uniquement
    if (currentUserRole === 'Caissier') {
      return {
        canView: isOwnSession && isOpenSession,
        canEdit: isOwnSession && isOpenSession,
        canDelete: isOwnSession && isOpenSession
      };
    }

    // Admin/Pharmacien Titulaire/Secrétaire: voit tout, modifie/supprime si session ouverte
    if (isAdminOrManager) {
      return {
        canView: true,
        canEdit: isOpenSession,
        canDelete: isOpenSession
      };
    }

    return { canView: false, canEdit: false, canDelete: false };
  }, [currentUserRole, currentPersonnelId]);

  // Mettre à jour une dépense avec synchronisation comptable
  const updateExpense = async (id: string, data: { montant?: number; description?: string; motif?: string }) => {
    try {
      // 1. Mettre à jour le mouvement de caisse
      const { error } = await supabase
        .from('mouvements_caisse')
        .update(data)
        .eq('id', id)
        .eq('tenant_id', currentTenant?.id);

      if (error) throw error;

      // 2. Synchroniser l'écriture comptable associée
      const { data: ecriture } = await supabase
        .from('ecritures_comptables')
        .select('id, statut')
        .eq('reference_type', 'mouvement_caisse')
        .eq('reference_id', id)
        .eq('tenant_id', currentTenant?.id)
        .maybeSingle();

      if (ecriture) {
        // Seules les écritures en Brouillon peuvent être modifiées
        if (ecriture.statut === 'Brouillon') {
          const updateData: Record<string, unknown> = {};
          
          // Mettre à jour le montant total si changé
          if (data.montant !== undefined) {
            updateData.montant_total = data.montant;
          }
          
          // Mettre à jour le libellé si description changée
          if (data.description !== undefined) {
            updateData.libelle = `Dépense caisse: ${data.description}`;
          }

          if (Object.keys(updateData).length > 0) {
            await supabase
              .from('ecritures_comptables')
              .update(updateData)
              .eq('id', ecriture.id);
          }

          // Mettre à jour les lignes d'écriture si le montant a changé
          if (data.montant !== undefined) {
            const { data: lignes } = await supabase
              .from('lignes_ecriture')
              .select('id, debit, credit')
              .eq('ecriture_id', ecriture.id);

            if (lignes) {
              for (const ligne of lignes) {
                if (ligne.debit > 0) {
                  await supabase.from('lignes_ecriture')
                    .update({ debit: data.montant })
                    .eq('id', ligne.id);
                }
                if (ligne.credit > 0) {
                  await supabase.from('lignes_ecriture')
                    .update({ credit: data.montant })
                    .eq('id', ligne.id);
                }
              }
            }
          }
        }
      }

      toast({
        title: "Succès",
        description: "La dépense et son écriture comptable ont été modifiées"
      });

      await fetchAllExpenses();
      return true;
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la dépense",
        variant: "destructive"
      });
      return false;
    }
  };

  // Annuler une dépense avec contre-passation comptable
  const cancelExpense = async (id: string, motifAnnulation: string) => {
    try {
      // 1. Marquer le mouvement comme annulé
      const { error } = await supabase
        .from('mouvements_caisse')
        .update({
          est_annule: true,
          annule_par: currentPersonnelId,
          date_annulation: new Date().toISOString(),
          motif_annulation: motifAnnulation
        })
        .eq('id', id)
        .eq('tenant_id', currentTenant?.id);

      if (error) throw error;

      // 2. Trouver l'écriture comptable associée
      const { data: ecriture } = await supabase
        .from('ecritures_comptables')
        .select('id, journal_id, exercice_id, montant_total, libelle, numero_piece')
        .eq('reference_type', 'mouvement_caisse')
        .eq('reference_id', id)
        .eq('tenant_id', currentTenant?.id)
        .maybeSingle();

      let numeroPieceContrePassation: string | null = null;

      if (ecriture) {
        // 3. Récupérer les lignes originales
        const { data: lignesOriginales } = await supabase
          .from('lignes_ecriture')
          .select('compte_id, libelle, debit, credit')
          .eq('ecriture_id', ecriture.id);

        // 4. Générer un nouveau numéro de pièce pour la contre-passation
        const dateNow = new Date();
        const yearMonth = `${dateNow.getFullYear()}${String(dateNow.getMonth() + 1).padStart(2, '0')}`;
        
        // Récupérer le dernier numéro pour ce journal
        const { data: lastEntry } = await supabase
          .from('ecritures_comptables')
          .select('numero_piece')
          .eq('journal_id', ecriture.journal_id)
          .eq('tenant_id', currentTenant?.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let nextNumber = 1;
        if (lastEntry?.numero_piece) {
          const match = lastEntry.numero_piece.match(/-(\d+)$/);
          if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
          }
        }
        numeroPieceContrePassation = `CA-${yearMonth}-${String(nextNumber).padStart(5, '0')}`;

        // 5. Créer l'écriture de contre-passation
        const { data: contrePassation, error: insertError } = await supabase
          .from('ecritures_comptables')
          .insert({
            tenant_id: currentTenant?.id,
            exercice_id: ecriture.exercice_id,
            journal_id: ecriture.journal_id,
            numero_piece: numeroPieceContrePassation,
            date_ecriture: new Date().toISOString().split('T')[0],
            libelle: `ANNULATION: ${ecriture.libelle} - ${motifAnnulation}`,
            reference_type: 'annulation_mouvement_caisse',
            reference_id: id,
            statut: 'Brouillon',
            created_by_id: currentPersonnelId,
            montant_total: ecriture.montant_total
          })
          .select('id')
          .single();

        if (!insertError && contrePassation && lignesOriginales) {
          // 6. Créer les lignes inversées (débit ↔ crédit)
          const lignesContrePassation = lignesOriginales.map(ligne => ({
            tenant_id: currentTenant?.id,
            ecriture_id: contrePassation.id,
            compte_id: ligne.compte_id,
            libelle: `Annulation: ${ligne.libelle}`,
            debit: ligne.credit,  // Inverser
            credit: ligne.debit   // Inverser
          }));

          await supabase.from('lignes_ecriture').insert(lignesContrePassation);
        }
      }

      toast({
        title: "Succès",
        description: numeroPieceContrePassation 
          ? `Dépense annulée. Écriture de contre-passation créée: ${numeroPieceContrePassation}`
          : "La dépense a été annulée avec succès"
      });

      await fetchAllExpenses();
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la dépense",
        variant: "destructive"
      });
      return false;
    }
  };

  // Statistiques
  const getStatistics = useCallback(() => {
    const activeExpenses = expenses.filter(e => !e.est_annule);
    const cancelledExpenses = expenses.filter(e => e.est_annule);
    
    const totalAmount = activeExpenses.reduce((sum, e) => sum + e.montant, 0);
    const cancelledAmount = cancelledExpenses.reduce((sum, e) => sum + e.montant, 0);
    
    const byMotif: Record<string, number> = {};
    activeExpenses.forEach(e => {
      const cat = e.motif || 'Non catégorisé';
      byMotif[cat] = (byMotif[cat] || 0) + e.montant;
    });

    return {
      totalCount: activeExpenses.length,
      cancelledCount: cancelledExpenses.length,
      totalAmount,
      cancelledAmount,
      byMotif
    };
  }, [expenses]);

  return {
    expenses,
    loading,
    filters,
    setFilters,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    currentUserRole,
    getPermissions,
    updateExpense,
    cancelExpense,
    getStatistics,
    refreshExpenses: fetchAllExpenses
  };
};
