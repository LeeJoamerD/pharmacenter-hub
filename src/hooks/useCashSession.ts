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
    queryKey: ['active-cash-session', tenantId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) {
        console.log('❌ useCashSession: currentUser.id manquant');
        return null;
      }

      console.log('🔍 Recherche session caisse:', {
        tenantId,
        currentUserId: currentUser.id,
        query: `agent_id.eq.${currentUser.id},caissier_id.eq.${currentUser.id}`
      });

      const { data, error } = await supabase
        .from('sessions_caisse')
        .select('*')
        .eq('tenant_id', tenantId)
        .or(`agent_id.eq.${currentUser.id},caissier_id.eq.${currentUser.id}`)
        .eq('statut', 'Ouverte')
        .order('date_ouverture', { ascending: false })
        .limit(1)
        .maybeSingle();

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

  const closeSession = async (fondCaisseFermeture: number) => {
    if (!activeSession) throw new Error('Aucune session active');

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
    return data;
  };

  return {
    activeSession,
    isLoading,
    error,
    hasActiveSession: !!activeSession,
    openSession,
    closeSession,
    refetch
  };
};
