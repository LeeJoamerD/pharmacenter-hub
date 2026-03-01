import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePersonnel } from './usePersonnel';
import { toast } from 'sonner';
import { generatePayrollAccountingEntries } from '@/services/PayrollAccountingService';

// --- JSONB Type definitions ---
export interface PrimeImposableItem {
  actif: boolean;
  montant: number;
  annees?: number; // for anciennete
  qte?: number; // for heures_sup
  description?: string; // for autres
}

export interface DetailPrimesImposables {
  anciennete: PrimeImposableItem;
  prime_nuit: PrimeImposableItem;
  prime_caisse: PrimeImposableItem;
  prime_logement: PrimeImposableItem;
  prime_expatriation: PrimeImposableItem;
  prime_risque: PrimeImposableItem;
  allocations_familiales: PrimeImposableItem;
  prime_diplome: PrimeImposableItem;
  heures_sup_10: PrimeImposableItem;
  heures_sup_25: PrimeImposableItem;
  heures_sup_50: PrimeImposableItem;
  heures_sup_100: PrimeImposableItem;
  autres: PrimeImposableItem;
}

export interface PrimeNonImposableItem {
  actif: boolean;
  montant: number;
  description?: string;
}

export interface DetailPrimesNonImposables {
  prime_transport: PrimeNonImposableItem;
  prime_ration: PrimeNonImposableItem;
  prime_salissure: PrimeNonImposableItem;
  autres: PrimeNonImposableItem;
}

export interface RetenueItem {
  actif: boolean;
  montant: number;
  description?: string;
}

export interface DetailRetenues {
  tol: RetenueItem;
  credit: RetenueItem;
  pharmacie: RetenueItem;
  autres: RetenueItem;
}

export const DEFAULT_PRIMES_IMPOSABLES: DetailPrimesImposables = {
  anciennete: { actif: false, annees: 0, montant: 0 },
  prime_nuit: { actif: false, montant: 0 },
  prime_caisse: { actif: false, montant: 0 },
  prime_logement: { actif: false, montant: 0 },
  prime_expatriation: { actif: false, montant: 0 },
  prime_risque: { actif: false, montant: 0 },
  allocations_familiales: { actif: false, montant: 0 },
  prime_diplome: { actif: false, montant: 0 },
  heures_sup_10: { actif: false, qte: 0, montant: 0 },
  heures_sup_25: { actif: false, qte: 0, montant: 0 },
  heures_sup_50: { actif: false, qte: 0, montant: 0 },
  heures_sup_100: { actif: false, qte: 0, montant: 0 },
  autres: { actif: false, montant: 0, description: '' },
};

export const DEFAULT_PRIMES_NON_IMPOSABLES: DetailPrimesNonImposables = {
  prime_transport: { actif: false, montant: 0 },
  prime_ration: { actif: false, montant: 0 },
  prime_salissure: { actif: false, montant: 0 },
  autres: { actif: false, montant: 0, description: '' },
};

export const DEFAULT_RETENUES: DetailRetenues = {
  tol: { actif: false, montant: 0 },
  credit: { actif: false, montant: 0 },
  pharmacie: { actif: false, montant: 0 },
  autres: { actif: false, montant: 0, description: '' },
};

export const PRIME_IMPOSABLE_LABELS: Record<keyof DetailPrimesImposables, string> = {
  anciennete: "Prime d'ancienneté",
  prime_nuit: 'Prime de Nuit',
  prime_caisse: 'Prime de Caisse',
  prime_logement: 'Prime de Logement',
  prime_expatriation: "Prime d'Expatriation",
  prime_risque: 'Prime de Risque',
  allocations_familiales: 'Allocations Familiales',
  prime_diplome: 'Prime de Diplôme',
  heures_sup_10: 'Heures Supp. 10%',
  heures_sup_25: 'Heures Supp. 25%',
  heures_sup_50: 'Heures Supp. 50%',
  heures_sup_100: 'Heures Supp. 100%',
  autres: 'Autres Primes',
};

export const PRIME_NON_IMPOSABLE_LABELS: Record<keyof DetailPrimesNonImposables, string> = {
  prime_transport: 'Prime de Transport',
  prime_ration: 'Prime de Ration',
  prime_salissure: 'Prime de Salissure',
  autres: 'Autres Primes non imposables',
};

export const RETENUE_LABELS: Record<keyof DetailRetenues, string> = {
  tol: 'TOL (Taxe Obligation Légale)',
  credit: 'Crédit',
  pharmacie: 'Pharmacie',
  autres: 'Autres Retenues',
};

// --- Main interfaces ---
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
  // New JSONB fields
  detail_primes_imposables: DetailPrimesImposables;
  detail_primes_non_imposables: DetailPrimesNonImposables;
  detail_retenues: DetailRetenues;
  conges_payes: number;
  qte_presences: number;
  acompte: number;
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
  primes_defaut: Record<string, any>;
  taux_conge_paye: number;
  tol_defaut: number;
  created_at: string;
  updated_at: string;
}

// Helper: sum active primes
export const sumActivePrimes = (detail: DetailPrimesImposables): number => {
  return Object.values(detail).reduce((sum, p) => sum + (p.actif ? (p.montant || 0) : 0), 0);
};

export const sumActivePrimesNonImposables = (detail: DetailPrimesNonImposables): number => {
  return Object.values(detail).reduce((sum, p) => sum + (p.actif ? (p.montant || 0) : 0), 0);
};

export const sumActiveRetenues = (detail: DetailRetenues): number => {
  return Object.values(detail).reduce((sum, p) => sum + (p.actif ? (p.montant || 0) : 0), 0);
};

// Merge defaults with potentially incomplete JSONB from DB
export const mergePrimesImposables = (data: any): DetailPrimesImposables => {
  const result = { ...DEFAULT_PRIMES_IMPOSABLES };
  if (data && typeof data === 'object') {
    for (const key of Object.keys(result) as Array<keyof DetailPrimesImposables>) {
      if (data[key]) {
        result[key] = { ...result[key], ...data[key] };
      }
    }
  }
  return result;
};

export const mergePrimesNonImposables = (data: any): DetailPrimesNonImposables => {
  const result = { ...DEFAULT_PRIMES_NON_IMPOSABLES };
  if (data && typeof data === 'object') {
    for (const key of Object.keys(result) as Array<keyof DetailPrimesNonImposables>) {
      if (data[key]) {
        result[key] = { ...result[key], ...data[key] };
      }
    }
  }
  return result;
};

export const mergeRetenues = (data: any): DetailRetenues => {
  const result = { ...DEFAULT_RETENUES };
  if (data && typeof data === 'object') {
    for (const key of Object.keys(result) as Array<keyof DetailRetenues>) {
      if (data[key]) {
        result[key] = { ...result[key], ...data[key] };
      }
    }
  }
  return result;
};

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
        return ((data || []) as any[]).map(b => ({
          ...b,
          detail_primes_imposables: mergePrimesImposables(b.detail_primes_imposables),
          detail_primes_non_imposables: mergePrimesNonImposables(b.detail_primes_non_imposables),
          detail_retenues: mergeRetenues(b.detail_retenues),
          conges_payes: b.conges_payes || 0,
          qte_presences: b.qte_presences ?? 26,
          acompte: b.acompte || 0,
        })) as BulletinPaie[];
      },
      enabled: !!tenantId,
    });
  };

  // Calculate payroll amounts with detailed primes
  const calculatePayroll = (
    salaireBase: number,
    primesImposables: DetailPrimesImposables,
    primesNonImposables: DetailPrimesNonImposables,
    detailRetenues: DetailRetenues,
    heuresSup: number,
    avances: number,
    acompte: number,
    congesPayes: number,
    params: ParametresPaie | null
  ) => {
    const tauxCnssEmploye = params?.taux_cnss_employe ?? 3.5;
    const tauxCnssPatronal = params?.taux_cnss_patronal ?? 20.29;
    const tauxIrpp = params?.taux_irpp ?? 0;

    const totalPrimesImposables = sumActivePrimes(primesImposables);
    const totalPrimesNonImposables = sumActivePrimesNonImposables(primesNonImposables);
    const totalRetenuesAutres = sumActiveRetenues(detailRetenues);

    const salaireBrut = salaireBase + totalPrimesImposables + heuresSup;
    const retenueCnssEmploye = Math.round(salaireBrut * tauxCnssEmploye / 100);
    const retenueIrpp = Math.round(salaireBrut * tauxIrpp / 100);
    const cotisationsPatronalesCnss = Math.round(salaireBrut * tauxCnssPatronal / 100);
    const salaireNet = salaireBrut - retenueCnssEmploye - retenueIrpp;
    const netAPayer = salaireNet + totalPrimesNonImposables + congesPayes - totalRetenuesAutres - avances - acompte;

    return {
      primes: totalPrimesImposables,
      salaire_brut: salaireBrut,
      retenues_cnss_employe: retenueCnssEmploye,
      retenues_irpp: retenueIrpp,
      retenues_autres: totalRetenuesAutres,
      cotisations_patronales_cnss: cotisationsPatronalesCnss,
      salaire_net: salaireNet,
      net_a_payer: netAPayer,
    };
  };

  // Generate payroll for all active employees
  const generatePayroll = useMutation({
    mutationFn: async ({ mois, annee }: { mois: number; annee: number }) => {
      if (!tenantId || !currentPersonnel) throw new Error('Tenant non trouvé');

      const { data: employees, error: empError } = await supabase
        .from('personnel')
        .select('id, noms, prenoms, salaire_base, numero_cnss')
        .eq('tenant_id', tenantId)
        .not('salaire_base', 'is', null)
        .gt('salaire_base', 0);

      if (empError) throw empError;
      if (!employees || employees.length === 0) throw new Error('Aucun employé avec un salaire de base configuré');

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
        const calc = calculatePayroll(
          Number(emp.salaire_base) || 0,
          DEFAULT_PRIMES_IMPOSABLES,
          DEFAULT_PRIMES_NON_IMPOSABLES,
          DEFAULT_RETENUES,
          0, 0, 0, 0,
          parametres
        );
        return {
          tenant_id: tenantId,
          personnel_id: emp.id,
          periode_mois: mois,
          periode_annee: annee,
          salaire_base: Number(emp.salaire_base) || 0,
          primes: 0,
          heures_sup: 0,
          avances: 0,
          acompte: 0,
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
          detail_primes_imposables: DEFAULT_PRIMES_IMPOSABLES,
          detail_primes_non_imposables: DEFAULT_PRIMES_NON_IMPOSABLES,
          detail_retenues: DEFAULT_RETENUES,
          conges_payes: 0,
          qte_presences: 26,
        };
      });

      const { error } = await supabase.from('bulletins_paie').insert(bulletins as any);
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

      // Recalculate
      if (updates.salaire_base !== undefined || updates.detail_primes_imposables !== undefined) {
        const calc = calculatePayroll(
          updates.salaire_base ?? 0,
          updates.detail_primes_imposables ?? DEFAULT_PRIMES_IMPOSABLES,
          updates.detail_primes_non_imposables ?? DEFAULT_PRIMES_NON_IMPOSABLES,
          updates.detail_retenues ?? DEFAULT_RETENUES,
          updates.heures_sup ?? 0,
          updates.avances ?? 0,
          updates.acompte ?? 0,
          updates.conges_payes ?? 0,
          parametres
        );
        Object.assign(updates, calc);
      }

      const { error } = await supabase
        .from('bulletins_paie')
        .update(updates as any)
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
            toast.warning('Paiement enregistré mais les écritures comptables n\'ont pas pu être générées.');
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
        .upsert({ ...params, tenant_id: tenantId } as any, { onConflict: 'tenant_id' });
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
