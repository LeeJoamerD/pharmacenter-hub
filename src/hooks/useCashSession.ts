/**
 * Hook pour gérer les sessions de caisse
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { CashSession } from '@/types/pos';

export const useCashSession = () => {
  const { tenantId, currentUser } = useTenant();

  const { data: activeSession, isLoading, error, refetch } = useQuery({
    queryKey: ['active-cash-session', tenantId, currentUser?.id, currentUser?.role],
    queryFn: async () => {
      if (!currentUser?.id) {
        console.log('❌ useCashSession: currentUser.id manquant');
        return null;
      }

      const isAdminOrManager = ['Admin', 'Pharmacien Titulaire', 'Pharmacien Adjoint'].includes(currentUser.role || '');

      console.log('🔍 Recherche session caisse:', {
        tenantId,
        currentUserId: currentUser.id,
        role: currentUser.role,
        isAdminOrManager
      });

      let query = supabase
        .from('sessions_caisse')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('statut', 'Ouverte')
        .order('date_ouverture', { ascending: false })
        .limit(1);

      // Admins/Managers peuvent utiliser n'importe quelle session ouverte
      // Les autres rôles ne voient que leurs propres sessions
      if (!isAdminOrManager) {
        query = query.or(`agent_id.eq.${currentUser.id},caissier_id.eq.${currentUser.id}`);
      }

      const { data, error } = await query.maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erreur récupération session caisse:', error);
        throw error;
      }

      console.log('✅ Session trouvée:', data ? 'OUI' : 'NON', data);
      return data as CashSession | null;
    },
    enabled: !!tenantId && !!currentUser?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000 // Rafraîchir toutes les minutes
  });

  const openSession = async (fondCaisseOuverture: number, caisseId: string) => {
    if (!currentUser?.id) throw new Error('Utilisateur non connecté');

    const { data, error } = await supabase
      .from('sessions_caisse')
      .insert({
        tenant_id: tenantId,
        caisse_id: caisseId,
        agent_id: currentUser.id,
        date_ouverture: new Date().toISOString(),
        fond_caisse_ouverture: fondCaisseOuverture,
        statut: 'Ouverte',
        montant_total_ventes: 0
      })
      .select()
      .single();

    if (error) throw error;

    await refetch();
    return data;
  };

  // Vérifier s'il y a des transactions en attente avant clôture
  const checkPendingTransactions = async (sessionId: string): Promise<{
    hasPending: boolean;
    count: number;
    total: number;
    transactions: Array<{ id: string; numero_vente: string; montant_net: number }>;
  }> => {
    const { data, error } = await supabase
      .from('ventes')
      .select('id, numero_vente, montant_net')
      .eq('tenant_id', tenantId)
      .eq('session_caisse_id', sessionId)
      .eq('statut', 'En cours');

    if (error) {
      console.error('Erreur vérification transactions en attente:', error);
      return { hasPending: false, count: 0, total: 0, transactions: [] };
    }

    const transactions = data || [];
    const total = transactions.reduce((sum, v) => sum + (v.montant_net || 0), 0);

    return {
      hasPending: transactions.length > 0,
      count: transactions.length,
      total,
      transactions
    };
  };

  const closeSession = async (fondCaisseFermeture: number, forceClose: boolean = false) => {
    if (!activeSession) throw new Error('Aucune session active');

    // Vérifier les transactions en attente sauf si forceClose
    if (!forceClose) {
      const pendingCheck = await checkPendingTransactions(activeSession.id);
      if (pendingCheck.hasPending) {
        return {
          success: false,
          pendingTransactions: pendingCheck,
          message: `${pendingCheck.count} transaction(s) en attente d'encaissement pour un total de ${pendingCheck.total} FCFA`
        };
      }
    }

    const { data, error } = await supabase
      .from('sessions_caisse')
      .update({
        date_fermeture: new Date().toISOString(),
        fond_caisse_fermeture: fondCaisseFermeture,
        statut: 'Fermée'
      })
      .eq('id', activeSession.id)
      .select()
      .single();

    if (error) throw error;

    await refetch();
    return { success: true, data };
  };

  return {
    activeSession,
    isLoading,
    error,
    hasActiveSession: !!activeSession,
    openSession,
    closeSession,
    checkPendingTransactions,
    refetch
  };
};
