import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CreditAccount {
  id: string;
  nom_complet: string;
  telephone?: string;
  email?: string;
  type_client: string;
  limite_credit: number;
  credit_actuel: number;
  credit_disponible: number;
  statut: string;
  created_at: string;
  updated_at: string;
}

interface CreditStats {
  total_credits_outstanding: number;
  total_credit_limit: number;
  active_accounts: number;
  total_accounts: number;
  utilization_rate: number;
  total_overdue: number;
  available_credit: number;
}

interface CreditTransaction {
  id: string;
  type: 'purchase' | 'payment';
  date: string;
  client_name?: string;
  client_id?: string;
  amount: number;
  reference?: string;
  description: string;
}

interface PaymentSchedule {
  id: string;
  libelle: string;
  type_echeancier: string;
  montant_total: number;
  montant_paye: number;
  montant_restant: number;
  nombre_echeances: number;
  statut: string;
  date_emission: string;
  date_premiere_echeance: string;
  date_derniere_echeance?: string;
  periodicite?: string;
  client_id?: string;
  clients?: { nom_complet: string; telephone?: string };
  facture_id?: string;
  factures?: { numero: string };
}

interface UpcomingPayment {
  id: string;
  numero_echeance: number;
  date_echeance: string;
  montant_echeance: number;
  montant_restant: number;
  statut: string;
  echeancier_id: string;
  echeanciers_paiements?: {
    libelle: string;
    client_id?: string;
    clients?: { nom_complet: string; telephone?: string };
  };
}

interface Filters {
  search?: string;
  statut?: string;
  client_id?: string;
}

export const useCreditManager = (filters: Filters = {}) => {
  const { tenantId, currentUser } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatPrice } = useCurrency();

  // Query 1: Liste des Comptes Crédit
  const { data: creditAccounts = [], isLoading: creditAccountsLoading } = useQuery({
    queryKey: ['creditAccounts', tenantId, filters],
    queryFn: async () => {
      if (!tenantId) return [];

      let query = supabase
        .from('clients')
        .select(`
          id,
          nom:raison_sociale,
          telephone,
          email,
          type_client,
          limite_credit,
          credit_actuel,
          statut,
          created_at,
          updated_at
        `)
        .eq('tenant_id', tenantId)
        .not('limite_credit', 'is', null);

      if (filters.statut) query = query.eq('statut', filters.statut);
      if (filters.search) {
        query = query.or(`raison_sociale.ilike.%${filters.search}%,telephone.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(account => ({
        ...account,
        credit_disponible: (account.limite_credit || 0) - (account.credit_actuel || 0)
      })) as CreditAccount[];
    },
    enabled: !!tenantId
  });

  // Query 2: Statistiques Crédit Globales
  const { data: creditStats } = useQuery<CreditStats>({
    queryKey: ['creditStats', tenantId],
    queryFn: async () => {
      if (!tenantId) {
        return {
          total_credits_outstanding: 0,
          total_credit_limit: 0,
          active_accounts: 0,
          total_accounts: 0,
          utilization_rate: 0,
          total_overdue: 0,
          available_credit: 0
        };
      }

      const { data: accounts } = await supabase
        .from('clients')
        .select('limite_credit, credit_actuel, statut')
        .eq('tenant_id', tenantId)
        .not('limite_credit', 'is', null);

      const total_limit = accounts?.reduce((sum, a) => sum + (a.limite_credit || 0), 0) || 0;
      const total_used = accounts?.reduce((sum, a) => sum + (a.credit_actuel || 0), 0) || 0;
      const active_count = accounts?.filter(a => a.statut === 'Actif').length || 0;
      const utilization_rate = total_limit > 0 ? (total_used / total_limit) * 100 : 0;

      const { data: overdue } = await supabase
        .from('lignes_echeancier')
        .select('montant_restant')
        .eq('tenant_id', tenantId)
        .eq('statut', 'en_retard');

      const total_overdue = overdue?.reduce((sum, l) => sum + l.montant_restant, 0) || 0;

      return {
        total_credits_outstanding: total_used,
        total_credit_limit: total_limit,
        active_accounts: active_count,
        total_accounts: accounts?.length || 0,
        utilization_rate,
        total_overdue,
        available_credit: total_limit - total_used
      };
    },
    enabled: !!tenantId
  });

  // Query 3: Transactions Crédit
  const { data: creditTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['creditTransactions', tenantId, filters],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data: sales } = await supabase
        .from('ventes')
        .select(`
          id,
          numero_vente,
          date_vente,
          montant_total_ttc,
          client_id,
          clients(nom_complet)
        `)
        .eq('tenant_id', tenantId)
        .eq('type_vente', 'Crédit')
        .order('date_vente', { ascending: false })
        .limit(100);

      const { data: payments } = await supabase
        .from('paiements_factures')
        .select(`
          id,
          date_paiement,
          montant,
          mode_paiement,
          reference_paiement,
          facture_id,
          factures(client_id, numero, clients(nom_complet))
        `)
        .eq('tenant_id', tenantId)
        .order('date_paiement', { ascending: false })
        .limit(100);

      const transactions: CreditTransaction[] = [
        ...(sales || []).map(s => ({
          id: s.id,
          type: 'purchase' as const,
          date: s.date_vente,
          client_name: s.clients?.nom_complet,
          client_id: s.client_id,
          amount: -s.montant_total_ttc,
          reference: s.numero_vente,
          description: `Achat - ${s.numero_vente}`
        })),
        ...(payments || []).map(p => ({
          id: p.id,
          type: 'payment' as const,
          date: p.date_paiement,
          client_name: p.factures?.clients?.nom_complet,
          client_id: p.factures?.client_id,
          amount: p.montant,
          reference: p.reference_paiement || '',
          description: `Paiement ${p.mode_paiement} - ${p.factures?.numero || ''}`
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return transactions;
    },
    enabled: !!tenantId
  });

  // Query 4: Échéanciers de Paiement
  const { data: paymentSchedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['paymentSchedules', tenantId, filters],
    queryFn: async () => {
      if (!tenantId) return [];

      let query = supabase
        .from('echeanciers_paiements')
        .select(`
          id,
          libelle,
          type_echeancier,
          montant_total,
          montant_paye,
          montant_restant,
          nombre_echeances,
          statut,
          date_emission,
          date_premiere_echeance,
          date_derniere_echeance,
          periodicite,
          client_id,
          clients(nom_complet, telephone),
          facture_id,
          factures(numero)
        `)
        .eq('tenant_id', tenantId)
        .eq('type_echeancier', 'client');

      if (filters.statut) query = query.eq('statut', filters.statut);
      if (filters.client_id) query = query.eq('client_id', filters.client_id);

      const { data, error } = await query.order('date_emission', { ascending: false });

      if (error) throw error;

      return data as PaymentSchedule[];
    },
    enabled: !!tenantId
  });

  // Query 5: Échéances à Venir
  const { data: upcomingPayments = [] } = useQuery({
    queryKey: ['upcomingPayments', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('lignes_echeancier')
        .select(`
          id,
          numero_echeance,
          date_echeance,
          montant_echeance,
          montant_restant,
          statut,
          echeancier_id,
          echeanciers_paiements(
            libelle,
            client_id,
            clients(nom_complet, telephone)
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('statut', 'en_attente')
        .gte('date_echeance', today)
        .lte('date_echeance', nextWeek)
        .order('date_echeance', { ascending: true });

      if (error) throw error;

      return data as UpcomingPayment[];
    },
    enabled: !!tenantId
  });

  // Query 6: Échéances en Retard
  const { data: overduePayments = [] } = useQuery({
    queryKey: ['overduePayments', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('lignes_echeancier')
        .select(`
          id,
          numero_echeance,
          date_echeance,
          montant_echeance,
          montant_restant,
          statut,
          echeancier_id,
          echeanciers_paiements(
            libelle,
            client_id,
            clients(nom_complet, telephone, email)
          )
        `)
        .eq('tenant_id', tenantId)
        .in('statut', ['en_attente', 'en_retard'])
        .lt('date_echeance', today)
        .order('date_echeance', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        await supabase
          .from('lignes_echeancier')
          .update({ statut: 'en_retard' })
          .in('id', data.map(d => d.id))
          .eq('statut', 'en_attente');
      }

      return data as UpcomingPayment[];
    },
    enabled: !!tenantId
  });

  // Mutation 1: Créer un Compte Crédit
  const createCreditAccount = useMutation({
    mutationFn: async (accountData: {
      client_id?: string;
      nom_complet: string;
      telephone?: string;
      email?: string;
      limite_credit: number;
      type_client?: string;
      notes?: string;
    }) => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      if (accountData.client_id) {
        const { data, error } = await supabase
          .from('clients')
        .update({
          limite_credit: accountData.limite_credit,
          credit_actuel: 0,
          statut: 'Actif'
        })
          .eq('id', accountData.client_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('clients')
        .insert({
          raison_sociale: accountData.nom_complet,
          telephone: accountData.telephone,
          email: accountData.email,
          limite_credit: accountData.limite_credit,
          credit_actuel: 0,
          type_client: accountData.type_client || 'particulier',
          statut: 'Actif',
          tenant_id: tenantId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['creditStats'] });
      toast({
        title: "Compte crédit créé",
        description: "Le compte crédit a été créé avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le compte crédit",
        variant: "destructive"
      });
    }
  });

  // Mutation 2: Enregistrer un Paiement
  const recordPayment = useMutation({
    mutationFn: async (paymentData: {
      client_id: string;
      facture_id?: string;
      montant: number;
      mode_paiement: string;
      reference_paiement?: string;
      notes?: string;
      echeancier_ligne_id?: string;
    }) => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      let paiement_id = null;
      if (paymentData.facture_id) {
        const { data: payment, error: paymentError } = await supabase
          .from('paiements_factures')
          .insert({
            facture_id: paymentData.facture_id,
            montant: paymentData.montant,
            mode_paiement: paymentData.mode_paiement,
            reference_paiement: paymentData.reference_paiement,
            date_paiement: new Date().toISOString(),
            notes: paymentData.notes,
            tenant_id: tenantId,
            created_by_id: currentUser?.id
          })
          .select()
          .single();

        if (paymentError) throw paymentError;
        paiement_id = payment.id;

        await supabase
          .from('factures')
          .update({
            montant_paye: supabase.sql`montant_paye + ${paymentData.montant}`,
            montant_restant: supabase.sql`montant_restant - ${paymentData.montant}`
          })
          .eq('id', paymentData.facture_id);
      }

      await supabase
        .from('clients')
        .update({
          credit_actuel: supabase.sql`GREATEST(0, credit_actuel - ${paymentData.montant})`
        })
        .eq('id', paymentData.client_id)
        .eq('tenant_id', tenantId);

      if (paymentData.echeancier_ligne_id && paiement_id) {
        await supabase
          .from('lignes_echeancier')
          .update({
            montant_paye: supabase.sql`montant_paye + ${paymentData.montant}`,
            montant_restant: supabase.sql`montant_restant - ${paymentData.montant}`,
            date_paiement: new Date().toISOString(),
            paiement_facture_id: paiement_id
          })
          .eq('id', paymentData.echeancier_ligne_id);
      }

      return { success: true, paiement_id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['creditStats'] });
      queryClient.invalidateQueries({ queryKey: ['paymentSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingPayments'] });
      queryClient.invalidateQueries({ queryKey: ['overduePayments'] });
      toast({
        title: "Paiement enregistré",
        description: "Le paiement a été enregistré avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer le paiement",
        variant: "destructive"
      });
    }
  });

  // Mutation 3: Enregistrer un Achat à Crédit
  const recordCreditPurchase = useMutation({
    mutationFn: async (purchaseData: {
      client_id: string;
      vente_id?: string;
      facture_id?: string;
      montant: number;
      description: string;
    }) => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      const { data: client } = await supabase
        .from('clients')
        .select('limite_credit, credit_actuel')
        .eq('id', purchaseData.client_id)
        .eq('tenant_id', tenantId)
        .single();

      if (!client) throw new Error('Client non trouvé');

      const new_credit = (client.credit_actuel || 0) + purchaseData.montant;
      if (new_credit > (client.limite_credit || 0)) {
        throw new Error(`Limite de crédit dépassée. Disponible: ${formatPrice((client.limite_credit || 0) - (client.credit_actuel || 0))}`);
      }

      const { error: creditError } = await supabase
        .from('clients')
        .update({
          credit_actuel: new_credit
        })
        .eq('id', purchaseData.client_id)
        .eq('tenant_id', tenantId);

      if (creditError) throw creditError;

      if (purchaseData.vente_id) {
        await supabase
          .from('ventes')
          .update({ type_vente: 'Crédit' })
          .eq('id', purchaseData.vente_id)
          .eq('tenant_id', tenantId);
      }

      return { success: true, nouveau_credit: new_credit };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['creditStats'] });
      toast({
        title: "Achat à crédit enregistré",
        description: "L'achat a été ajouté au compte crédit du client."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer l'achat à crédit",
        variant: "destructive"
      });
    }
  });

  // Mutation 4: Suspendre/Réactiver un Compte
  const suspendAccount = useMutation({
    mutationFn: async ({ client_id, action }: { client_id: string; action: 'suspend' | 'activate' }) => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      const { error } = await supabase
        .from('clients')
        .update({
          statut: action === 'suspend' ? 'Suspendu' : 'Actif'
        })
        .eq('id', client_id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['creditAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['creditStats'] });
      toast({
        title: variables.action === 'suspend' ? "Compte suspendu" : "Compte réactivé",
        description: `Le compte a été ${variables.action === 'suspend' ? 'suspendu' : 'réactivé'} avec succès.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le statut du compte",
        variant: "destructive"
      });
    }
  });

  // Mutation 5: Ajuster la Limite de Crédit
  const adjustCreditLimit = useMutation({
    mutationFn: async ({ client_id, nouvelle_limite, raison }: {
      client_id: string;
      nouvelle_limite: number;
      raison?: string;
    }) => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      const noteText = `\n[${new Date().toLocaleDateString('fr-FR')}] Limite ajustée à ${nouvelle_limite} FCFA. Raison: ${raison || 'Non spécifiée'}`;

      const { error } = await supabase
        .from('clients')
        .update({
          limite_credit: nouvelle_limite
        })
        .eq('id', client_id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['creditStats'] });
      toast({
        title: "Limite ajustée",
        description: "La limite de crédit a été modifiée avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajuster la limite de crédit",
        variant: "destructive"
      });
    }
  });

  // Mutation 6: Envoyer une Relance
  const sendReminder = useMutation({
    mutationFn: async (reminderData: {
      facture_id: string;
      type_relance: 'email' | 'sms' | 'telephone' | 'courrier';
      destinataire: string;
      message?: string;
    }) => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      const { data, error } = await supabase
        .from('relances_factures')
        .insert({
          facture_id: reminderData.facture_id,
          type_relance: reminderData.type_relance,
          date_relance: new Date().toISOString(),
          destinataire: reminderData.destinataire,
          message: reminderData.message,
          statut: 'envoyee',
          tenant_id: tenantId,
          created_by_id: currentUser?.id
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('factures')
        .update({
          relances_effectuees: supabase.sql`relances_effectuees + 1`,
          derniere_relance: new Date().toISOString()
        })
        .eq('id', reminderData.facture_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['overduePayments'] });
      toast({
        title: "Relance envoyée",
        description: "La relance a été envoyée avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer la relance",
        variant: "destructive"
      });
    }
  });

  // Mutation 7: Créer un Échéancier
  const createPaymentSchedule = useMutation({
    mutationFn: async (scheduleData: {
      client_id: string;
      facture_id?: string;
      libelle: string;
      montant_total: number;
      nombre_echeances: number;
      date_premiere_echeance: string;
      periodicite: 'hebdomadaire' | 'mensuelle' | 'trimestrielle';
      alerte_avant_echeance?: number;
      notes?: string;
    }) => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      const { data: schedule, error: scheduleError } = await supabase
        .from('echeanciers_paiements')
        .insert({
          type_echeancier: 'client',
          client_id: scheduleData.client_id,
          facture_id: scheduleData.facture_id,
          libelle: scheduleData.libelle,
          montant_total: scheduleData.montant_total,
          montant_paye: 0,
          montant_restant: scheduleData.montant_total,
          nombre_echeances: scheduleData.nombre_echeances,
          date_emission: new Date().toISOString(),
          date_premiere_echeance: scheduleData.date_premiere_echeance,
          periodicite: scheduleData.periodicite,
          alerte_avant_echeance: scheduleData.alerte_avant_echeance || 3,
          statut: 'actif',
          notes: scheduleData.notes,
          tenant_id: tenantId,
          created_by_id: currentUser?.id
        })
        .select()
        .single();

      if (scheduleError) throw scheduleError;

      const montant_par_echeance = scheduleData.montant_total / scheduleData.nombre_echeances;
      const lignes = [];

      let current_date = new Date(scheduleData.date_premiere_echeance);

      for (let i = 1; i <= scheduleData.nombre_echeances; i++) {
        const montant = i === scheduleData.nombre_echeances
          ? scheduleData.montant_total - (montant_par_echeance * (scheduleData.nombre_echeances - 1))
          : montant_par_echeance;

        lignes.push({
          echeancier_id: schedule.id,
          numero_echeance: i,
          date_echeance: current_date.toISOString().split('T')[0],
          montant_echeance: montant,
          montant_paye: 0,
          montant_restant: montant,
          statut: 'en_attente',
          tenant_id: tenantId
        });

        if (scheduleData.periodicite === 'hebdomadaire') {
          current_date.setDate(current_date.getDate() + 7);
        } else if (scheduleData.periodicite === 'mensuelle') {
          current_date.setMonth(current_date.getMonth() + 1);
        } else if (scheduleData.periodicite === 'trimestrielle') {
          current_date.setMonth(current_date.getMonth() + 3);
        }
      }

      const { error: lignesError } = await supabase
        .from('lignes_echeancier')
        .insert(lignes);

      if (lignesError) throw lignesError;

      await supabase
        .from('echeanciers_paiements')
        .update({
          date_derniere_echeance: lignes[lignes.length - 1].date_echeance
        })
        .eq('id', schedule.id)
        .eq('tenant_id', tenantId);

      return schedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingPayments'] });
      toast({
        title: "Échéancier créé",
        description: "L'échéancier de paiement a été créé avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'échéancier",
        variant: "destructive"
      });
    }
  });

  return {
    // États
    creditAccounts,
    creditAccountsLoading,
    creditStats,
    creditTransactions,
    transactionsLoading,
    paymentSchedules,
    schedulesLoading,
    upcomingPayments,
    overduePayments,

    // Actions
    createCreditAccount,
    recordPayment,
    recordCreditPurchase,
    suspendAccount,
    adjustCreditLimit,
    sendReminder,
    createPaymentSchedule
  };
};
