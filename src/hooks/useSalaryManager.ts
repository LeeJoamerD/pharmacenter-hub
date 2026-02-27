import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePersonnel } from './usePersonnel';
import { toast } from 'sonner';
import { generatePayrollAccountingEntries } from '@/services/PayrollAccountingService';

export interface BulletinPaie {
  id: string;
  tenant_id: string;
  personnel_id: string;
  periode_mois: number;
  periode_annee: number;
  salaire_base: number;
  primes: number;
  heures_sup: number;
  avances: number;
  retenues_cnss_employe: number;
  retenues_irpp: number;
  retenues_autres: number;
  cotisations_patronales_cnss: number;
  cotisations_patronales_autres: number;
  salaire_brut: number;
  salaire_net: number;
  net_a_payer: number;
  statut: 'Brouillon' | 'Validé' | 'Payé';
  date_paiement: string | null;
  mode_paiement: string | null;
  reference_paiement: string | null;
  notes: string | null;
  ecriture_id: string | null;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
  personnel?: {
    id: string;
    noms: string;
    prenoms: string;
    role: string;
    salaire_base: number | null;
    numero_cnss: string | null;
    situation_familiale: string | null;
    nombre_enfants: number | null;
    statut_contractuel: string | null;
  };
}

export interface ParametresPaie {
  id: string;
  tenant_id: string;
  taux_cnss_employe: number;
  taux_cnss_patronal: number;
  taux_irpp: number;
  smic: number;
  created_at: string;
  updated_at: string;
}

export const useSalaryManager = () => {
  const { currentPersonnel } = usePersonnel();
  const queryClient = useQueryClient();
  const tenantId = currentPersonnel?.tenant_id;

  // Fetch parametres_paie
  const { data: parametres, isLoading: loadingParametres } = useQuery({
    queryKey: ['parametres-paie', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase
        .from('parametres_paie')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data as ParametresPaie | null;
    },
    enabled: !!tenantId,
  });

  // Fetch bulletins with personnel info
  const fetchBulletins = (mois: number, annee: number) => {
    return useQuery({
      queryKey: ['bulletins-paie', tenantId, mois, annee],
      queryFn: async () => {
        if (!tenantId) return [];
        const { data, error } = await supabase
          .from('bulletins_paie')
          .select('*, personnel!bulletins_paie_personnel_id_fkey(id, noms, prenoms, role, salaire_base, numero_cnss, situation_familiale, nombre_enfants, statut_contractuel)')
          .eq('tenant_id', tenantId)
          .eq('periode_mois', mois)
          .eq('periode_annee', annee)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []) as unknown as BulletinPaie[];
      },
      enabled: !!tenantId,
    });
  };

  // Calculate payroll amounts
  const calculatePayroll = (salaireBase: number, primes: number, heuresSup: number, avances: number, params: ParametresPaie | null) => {
    const tauxCnssEmploye = params?.taux_cnss_employe ?? 3.5;
    const tauxCnssPatronal = params?.taux_cnss_patronal ?? 20.29;
    const tauxIrpp = params?.taux_irpp ?? 0;

    const salaireBrut = salaireBase + primes + heuresSup;
    const retenueCnssEmploye = Math.round(salaireBrut * tauxCnssEmploye / 100);
    const retenueIrpp = Math.round(salaireBrut * tauxIrpp / 100);
    const cotisationsPatronalesCnss = Math.round(salaireBrut * tauxCnssPatronal / 100);
    const salaireNet = salaireBrut - retenueCnssEmploye - retenueIrpp;
    const netAPayer = salaireNet - avances;

    return {
      salaire_brut: salaireBrut,
      retenues_cnss_employe: retenueCnssEmploye,
      retenues_irpp: retenueIrpp,
      cotisations_patronales_cnss: cotisationsPatronalesCnss,
      salaire_net: salaireNet,
      net_a_payer: netAPayer,
    };
  };

  // Generate payroll for all active employees
  const generatePayroll = useMutation({
    mutationFn: async ({ mois, annee }: { mois: number; annee: number }) => {
      if (!tenantId || !currentPersonnel) throw new Error('Tenant non trouvé');

      // Fetch active personnel with salaire_base
      const { data: employees, error: empError } = await supabase
        .from('personnel')
        .select('id, noms, prenoms, salaire_base, numero_cnss')
        .eq('tenant_id', tenantId)
        .not('salaire_base', 'is', null)
        .gt('salaire_base', 0);

      if (empError) throw empError;
      if (!employees || employees.length === 0) throw new Error('Aucun employé avec un salaire de base configuré');

      // Check existing bulletins
      const { data: existing } = await supabase
        .from('bulletins_paie')
        .select('personnel_id')
        .eq('tenant_id', tenantId)
        .eq('periode_mois', mois)
        .eq('periode_annee', annee);

      const existingIds = new Set((existing || []).map(e => e.personnel_id));
      const newEmployees = employees.filter(e => !existingIds.has(e.id));

      if (newEmployees.length === 0) throw new Error('Tous les bulletins existent déjà pour cette période');

      const bulletins = newEmployees.map(emp => {
        const calc = calculatePayroll(Number(emp.salaire_base) || 0, 0, 0, 0, parametres);
        return {
          tenant_id: tenantId,
          personnel_id: emp.id,
          periode_mois: mois,
          periode_annee: annee,
          salaire_base: Number(emp.salaire_base) || 0,
          primes: 0,
          heures_sup: 0,
          avances: 0,
          retenues_cnss_employe: calc.retenues_cnss_employe,
          retenues_irpp: calc.retenues_irpp,
          retenues_autres: 0,
          cotisations_patronales_cnss: calc.cotisations_patronales_cnss,
          cotisations_patronales_autres: 0,
          salaire_brut: calc.salaire_brut,
          salaire_net: calc.salaire_net,
          net_a_payer: calc.net_a_payer,
          statut: 'Brouillon' as const,
          created_by_id: currentPersonnel.id,
        };
      });

      const { error } = await supabase.from('bulletins_paie').insert(bulletins);
      if (error) throw error;
      return newEmployees.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} bulletin(s) de paie généré(s)`);
      queryClient.invalidateQueries({ queryKey: ['bulletins-paie'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Update bulletin
  const updateBulletin = useMutation({
    mutationFn: async (bulletin: Partial<BulletinPaie> & { id: string }) => {
      const { id, personnel, ...updates } = bulletin;

      // Recalculate if amounts changed
      if (updates.salaire_base !== undefined || updates.primes !== undefined || updates.heures_sup !== undefined || updates.avances !== undefined) {
        const calc = calculatePayroll(
          updates.salaire_base ?? 0,
          updates.primes ?? 0,
          updates.heures_sup ?? 0,
          updates.avances ?? 0,
          parametres
        );
        Object.assign(updates, calc);
      }

      const { error } = await supabase
        .from('bulletins_paie')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Bulletin mis à jour');
      queryClient.invalidateQueries({ queryKey: ['bulletins-paie'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Validate bulletin
  const validateBulletin = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bulletins_paie')
        .update({ statut: 'Validé' })
        .eq('id', id)
        .eq('statut', 'Brouillon');
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Bulletin validé');
      queryClient.invalidateQueries({ queryKey: ['bulletins-paie'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Pay bulletin
  const payBulletin = useMutation({
    mutationFn: async ({ id, mode_paiement, reference_paiement, date_paiement }: {
      id: string; mode_paiement: string; reference_paiement?: string; date_paiement: string;
    }) => {
      const { error } = await supabase
        .from('bulletins_paie')
        .update({ statut: 'Payé', mode_paiement, reference_paiement, date_paiement })
        .eq('id', id)
        .eq('statut', 'Validé');
      if (error) throw error;

      // Generate SYSCOHADA accounting entries
      try {
        const { data: bulletinData } = await supabase
          .from('bulletins_paie')
          .select('*, personnel!bulletins_paie_personnel_id_fkey(noms, prenoms)')
          .eq('id', id)
          .single();

        if (bulletinData) {
          const ecritureId = await generatePayrollAccountingEntries({
            ...bulletinData,
            mode_paiement,
            personnel: bulletinData.personnel as any,
          });
          if (ecritureId) {
            console.log('✅ Écritures comptables paie générées:', ecritureId);
          } else {
            toast.warning('Paiement enregistré mais les écritures comptables n\'ont pas pu être générées. Vérifiez la configuration comptable.');
          }
        }
      } catch (accountingError) {
        console.error('Erreur écritures comptables paie:', accountingError);
        toast.warning('Paiement enregistré mais erreur lors de la génération des écritures comptables.');
      }
    },
    onSuccess: () => {
      toast.success('Paiement enregistré');
      queryClient.invalidateQueries({ queryKey: ['bulletins-paie'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Delete bulletin (brouillon only)
  const deleteBulletin = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bulletins_paie')
        .delete()
        .eq('id', id)
        .eq('statut', 'Brouillon');
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Bulletin supprimé');
      queryClient.invalidateQueries({ queryKey: ['bulletins-paie'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Save parametres
  const saveParametres = useMutation({
    mutationFn: async (params: Partial<ParametresPaie>) => {
      if (!tenantId) throw new Error('Tenant non trouvé');
      const { error } = await supabase
        .from('parametres_paie')
        .upsert({ ...params, tenant_id: tenantId }, { onConflict: 'tenant_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Paramètres de paie sauvegardés');
      queryClient.invalidateQueries({ queryKey: ['parametres-paie'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    parametres,
    loadingParametres,
    fetchBulletins,
    calculatePayroll,
    generatePayroll,
    updateBulletin,
    validateBulletin,
    payBulletin,
    deleteBulletin,
    saveParametres,
    tenantId,
    currentPersonnel,
  };
};
