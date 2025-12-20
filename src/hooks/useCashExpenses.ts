import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CashExpense {
  id: string;
  session_id: string;
  type_mouvement: string;
  montant: number;
  description: string | null;
  reference: string | null;
  categorie: string | null;
  agent_id: string | null;
  date_mouvement: string;
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
  category?: string;
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
      const sessionIds = [...new Set((data || []).map(d => d.session_id).filter(Boolean))];
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
        session: sessions?.find(s => s.id === expense.session_id),
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
        mappedData = mappedData.filter(exp => exp.date_mouvement >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        mappedData = mappedData.filter(exp => exp.date_mouvement <= filters.dateTo! + 'T23:59:59');
      }
      if (filters.category) {
        mappedData = mappedData.filter(exp => exp.categorie === filters.category);
      }
      if (filters.agentId) {
        mappedData = mappedData.filter(exp => exp.agent_id === filters.agentId);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        mappedData = mappedData.filter(exp => 
          exp.description?.toLowerCase().includes(search) ||
          exp.reference?.toLowerCase().includes(search)
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

  // Mettre à jour une dépense
  const updateExpense = async (id: string, data: { montant?: number; description?: string; categorie?: string }) => {
    try {
      const { error } = await supabase
        .from('mouvements_caisse')
        .update(data)
        .eq('id', id)
        .eq('tenant_id', currentTenant?.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "La dépense a été modifiée avec succès"
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

  // Annuler une dépense (soft delete)
  const cancelExpense = async (id: string, motif: string) => {
    try {
      const { error } = await supabase
        .from('mouvements_caisse')
        .update({
          est_annule: true,
          annule_par: currentPersonnelId,
          date_annulation: new Date().toISOString(),
          motif_annulation: motif
        })
        .eq('id', id)
        .eq('tenant_id', currentTenant?.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "La dépense a été annulée avec succès"
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
    
    const byCategory: Record<string, number> = {};
    activeExpenses.forEach(e => {
      const cat = e.categorie || 'Non catégorisé';
      byCategory[cat] = (byCategory[cat] || 0) + e.montant;
    });

    return {
      totalCount: activeExpenses.length,
      cancelledCount: cancelledExpenses.length,
      totalAmount,
      cancelledAmount,
      byCategory
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
