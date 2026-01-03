/**
 * Hook pour calculer la dette totale d'un client
 * Utilisé pour valider les limites de crédit avant une vente
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

interface ClientDebtResult {
  totalDette: number;
  nombreTransactions: number;
  limiteCredit: number;
  limiteDepassee: boolean;
  margeRestante: number;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Calcule la dette totale d'un client
 * @param clientId - ID du client
 * @param limiteCredit - Limite de crédit du client (0 = illimitée)
 * @returns Informations sur la dette du client
 */
export const useClientDebt = (
  clientId: string | undefined,
  limiteCredit: number = 0
): ClientDebtResult => {
  const { tenantId } = useTenant();

  const { data, isLoading, error } = useQuery({
    queryKey: ['client-debt', clientId, tenantId],
    queryFn: async () => {
      if (!clientId || !tenantId) {
        return { totalDette: 0, nombreTransactions: 0 };
      }

      // Récupérer les ventes non entièrement payées du client
      const { data: ventes, error } = await supabase
        .from('ventes')
        .select('montant_net, montant_paye')
        .eq('tenant_id', tenantId)
        .eq('client_id', clientId)
        .in('statut', ['Validée', 'En cours']);

      if (error) {
        console.error('Erreur récupération dette client:', error);
        // Fallback: requête simplifiée
        const { data: ventesSimple, error: errorSimple } = await supabase
          .from('ventes')
          .select('montant_net, montant_paye')
          .eq('tenant_id', tenantId)
          .eq('client_id', clientId)
          .in('statut', ['Validée', 'En cours']);

        if (errorSimple) {
          throw errorSimple;
        }

        // Filtrer côté client les ventes avec reste à payer
        const ventesNonPayees = (ventesSimple || []).filter(
          v => (v.montant_net || 0) > (v.montant_paye || 0)
        );

        const totalDette = ventesNonPayees.reduce(
          (sum, v) => sum + ((v.montant_net || 0) - (v.montant_paye || 0)),
          0
        );

        return {
          totalDette,
          nombreTransactions: ventesNonPayees.length
        };
      }

      // Calculer la dette totale
      const ventesNonPayees = (ventes || []).filter(
        v => (v.montant_net || 0) > (v.montant_paye || 0)
      );

      const totalDette = ventesNonPayees.reduce(
        (sum, v) => sum + ((v.montant_net || 0) - (v.montant_paye || 0)),
        0
      );

      return {
        totalDette,
        nombreTransactions: ventesNonPayees.length
      };
    },
    enabled: !!clientId && !!tenantId,
    staleTime: 30000, // 30 secondes
    refetchOnWindowFocus: true,
  });

  const totalDette = data?.totalDette || 0;
  const nombreTransactions = data?.nombreTransactions || 0;

  // Si limite = 0, pas de limite
  const margeRestante = limiteCredit > 0 ? limiteCredit - totalDette : Infinity;
  const limiteDepassee = limiteCredit > 0 && totalDette >= limiteCredit;

  return {
    totalDette,
    nombreTransactions,
    limiteCredit,
    limiteDepassee,
    margeRestante,
    isLoading,
    error: error as Error | null,
  };
};

/**
 * Vérifie si un nouveau montant peut être ajouté à la dette du client
 * @param clientId - ID du client
 * @param limiteCredit - Limite de crédit du client
 * @param nouveauMontant - Montant de la nouvelle dette à ajouter
 * @returns boolean indiquant si le crédit peut être accordé
 */
export const useCanAddDebt = (
  clientId: string | undefined,
  limiteCredit: number,
  nouveauMontant: number
): { canAddDebt: boolean; isLoading: boolean; remainingCredit: number } => {
  const { totalDette, isLoading, margeRestante } = useClientDebt(clientId, limiteCredit);

  // Si pas de limite (limite = 0), toujours autorisé
  if (limiteCredit === 0) {
    return { canAddDebt: true, isLoading, remainingCredit: Infinity };
  }

  const nouvelleDetteTotal = totalDette + nouveauMontant;
  const canAddDebt = nouvelleDetteTotal <= limiteCredit;
  const remainingCredit = Math.max(0, limiteCredit - totalDette);

  return { canAddDebt, isLoading, remainingCredit };
};

export default useClientDebt;
