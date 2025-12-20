import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

// Utiliser journaux_comptables comme source unique de vérité
type JournalRow = Database['public']['Tables']['journaux_comptables']['Row'];

// Interface mappée pour compatibilité avec le reste du code
export interface Journal {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  type: string;
  description?: string | null;
  prefixe?: string | null;
  sequence_courante?: number | null;
  auto_generation: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type EcritureInsert = Database['public']['Tables']['ecritures_comptables']['Insert'];
type EcritureUpdate = Database['public']['Tables']['ecritures_comptables']['Update'];
type LigneInsert = Database['public']['Tables']['lignes_ecriture']['Insert'];
type LigneUpdate = Database['public']['Tables']['lignes_ecriture']['Update'];

export interface EntryLine {
  id: string;
  tenant_id: string;
  ecriture_id: string;
  compte_id: string;
  compte_code?: string;
  compte_libelle?: string;
  libelle: string;
  debit: number;
  credit: number;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  tenant_id: string;
  exercice_id: string;
  journal_id: string;
  numero_piece: string;
  date_ecriture: string;
  libelle: string;
  reference_type?: string | null;
  reference_id?: string | null;
  statut: string | null;
  montant_total: number;
  created_by_id?: string;
  created_by?: string;
  validated_by_id?: string | null;
  validated_by?: string | null;
  validated_at?: string | null;
  locked_by_id?: string | null;
  locked_by?: string | null;
  locked_at?: string | null;
  lines: EntryLine[];
  created_at: string;
  updated_at: string;
  journal_code?: string;
  journal_name?: string;
  journal_type?: string;
  exercice_name?: string;
}

interface UseJournalManagerReturn {
  journals: Journal[];
  entries: JournalEntry[];
  currentEntry: JournalEntry | null;
  isLoadingJournals: boolean;
  isLoadingEntries: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  createEntry: (entry: Partial<JournalEntry>) => Promise<JournalEntry>;
  updateEntry: (id: string, entry: Partial<JournalEntry>) => Promise<JournalEntry>;
  deleteEntry: (id: string) => Promise<void>;
  validateEntry: (id: string) => Promise<void>;
  lockEntry: (id: string) => Promise<void>;
  searchEntries: (term: string, journalId?: string) => JournalEntry[];
  getEntriesByJournal: (journalId: string) => JournalEntry[];
  getEntriesByStatus: (status: string) => JournalEntry[];
  getJournalStats: (journalId: string) => {
    entriesCount: number;
    totalAmount: number;
    brouillonCount: number;
    valideCount: number;
    verrouilleCount: number;
  };
  calculateBalance: (lines: EntryLine[]) => {
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
  };
  generatePieceNumber: (journalId: string) => Promise<string>;
  refreshEntries: () => Promise<void>;
  refreshJournals: () => Promise<void>;
}

export const useJournalManager = (): UseJournalManagerReturn => {
  const { toast } = useToast();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [isLoadingJournals, setIsLoadingJournals] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Charger les journaux depuis journaux_comptables
  const loadJournals = async () => {
    try {
      setIsLoadingJournals(true);
      setError(null);
      
      const { data, error: err } = await supabase
        .from('journaux_comptables')
        .select('*')
        .eq('is_active', true)
        .order('code_journal');
      
      if (err) throw err;
      
      // Mapper vers l'interface Journal
      const mappedJournals: Journal[] = (data || []).map((j: JournalRow) => ({
        id: j.id,
        tenant_id: j.tenant_id,
        code: j.code_journal,
        name: j.libelle_journal,
        type: j.type_journal,
        description: j.description,
        prefixe: j.prefixe,
        sequence_courante: j.sequence_courante,
        auto_generation: j.auto_generation || false,
        is_active: j.is_active !== false,
        created_at: j.created_at,
        updated_at: j.updated_at
      }));
      
      setJournals(mappedJournals);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les journaux",
        variant: "destructive"
      });
    } finally {
      setIsLoadingJournals(false);
    }
  };

  // Charger les écritures avec détails
  const loadEntries = async () => {
    try {
      setIsLoadingEntries(true);
      setError(null);
      
      const { data, error: err } = await supabase
        .from('v_ecritures_avec_details')
        .select('*')
        .order('date_ecriture', { ascending: false });
      
      if (err) throw err;
      
      // Charger les lignes pour chaque écriture
      const entriesWithLines = await Promise.all(
        (data || []).map(async (entry) => {
          const { data: lines } = await supabase
            .from('lignes_ecriture')
            .select(`
              *,
              compte:plan_comptable!lignes_ecriture_compte_id_fkey(
                numero_compte,
                libelle_compte
              )
            `)
            .eq('ecriture_id', entry.id);
          
          return {
            ...entry,
            lines: (lines || []).map(line => ({
              ...line,
              compte_code: line.compte?.numero_compte,
              compte_libelle: line.compte?.libelle_compte
            }))
          } as JournalEntry;
        })
      );
      
      setEntries(entriesWithLines);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les écritures",
        variant: "destructive"
      });
    } finally {
      setIsLoadingEntries(false);
    }
  };

  useEffect(() => {
    loadJournals();
    loadEntries();
  }, []);

  // Générer un numéro de pièce
  const generatePieceNumber = async (journalId: string): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_piece_number', {
      p_journal_id: journalId
    });
    
    if (error) throw error;
    return data;
  };

  // Calculer l'équilibre
  const calculateBalance = (lines: EntryLine[]) => {
    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    return {
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
    };
  };

  // Créer une écriture
  const createEntry = async (entryData: Partial<JournalEntry>): Promise<JournalEntry> => {
    try {
      setIsSaving(true);
      
      // Obtenir l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');
      
      // Obtenir le personnel_id
      const { data: personnel } = await supabase
        .from('personnel')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (!personnel) throw new Error('Personnel non trouvé');
      
      // Obtenir l'exercice actif
      const { data: exercice } = await supabase
        .from('exercices_comptables')
        .select('id')
        .eq('statut', 'Ouvert')
        .single();
      
      if (!exercice) throw new Error('Aucun exercice comptable ouvert');
      
      // Générer le numéro de pièce
      const numeroPiece = await generatePieceNumber(entryData.journal_id!);
      
      // Vérifier l'équilibre
      const balance = calculateBalance(entryData.lines || []);
      if (!balance.isBalanced) {
        throw new Error('L\'écriture n\'est pas équilibrée');
      }
      
      // Créer l'écriture
      const insertData: EcritureInsert = {
        tenant_id: personnel.id, // Will be set by RLS
        exercice_id: exercice.id,
        journal_id: entryData.journal_id!,
        numero_piece: numeroPiece,
        date_ecriture: entryData.date_ecriture!,
        libelle: entryData.libelle!,
        reference_type: entryData.reference_type || null,
        reference_id: entryData.reference_id || null,
        statut: 'Brouillon',
        created_by_id: personnel.id,
        montant_total: balance.totalDebit
      };
      
      const { data: newEntry, error: entryError } = await supabase
        .from('ecritures_comptables')
        .insert(insertData)
        .select()
        .single();
      
      if (entryError) throw entryError;
      
      // Créer les lignes
      const linesInsert: LigneInsert[] = (entryData.lines || []).map(line => ({
        tenant_id: personnel.id,
        ecriture_id: newEntry.id,
        compte_id: line.compte_id,
        libelle: line.libelle,
        debit: line.debit || 0,
        credit: line.credit || 0
      }));
      
      const { error: linesError } = await supabase
        .from('lignes_ecriture')
        .insert(linesInsert);
      
      if (linesError) throw linesError;
      
      toast({
        title: "Succès",
        description: "Écriture créée avec succès"
      });
      
      await loadEntries();
      return newEntry as any;
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'écriture",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Mettre à jour une écriture
  const updateEntry = async (id: string, entryData: Partial<JournalEntry>): Promise<JournalEntry> => {
    try {
      setIsSaving(true);
      
      // Vérifier que l'écriture est en brouillon
      const entry = entries.find(e => e.id === id);
      if (!entry || entry.statut !== 'Brouillon') {
        throw new Error('Seules les écritures en brouillon peuvent être modifiées');
      }
      
      const updateData: EcritureUpdate = {
        libelle: entryData.libelle,
        date_ecriture: entryData.date_ecriture,
        reference_type: entryData.reference_type,
        reference_id: entryData.reference_id
      };
      
      const { data, error: updateError } = await supabase
        .from('ecritures_comptables')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // Mettre à jour les lignes si nécessaire
      if (entryData.lines) {
        // Supprimer les anciennes lignes
        await supabase.from('lignes_ecriture').delete().eq('ecriture_id', id);
        
        // Créer les nouvelles lignes
        const { data: { user } } = await supabase.auth.getUser();
        const { data: personnel } = await supabase
          .from('personnel')
          .select('id')
          .eq('auth_user_id', user?.id)
          .single();
        
        const linesInsert: LigneInsert[] = entryData.lines.map(line => ({
          tenant_id: personnel?.id!,
          ecriture_id: id,
          compte_id: line.compte_id,
          libelle: line.libelle,
          debit: line.debit || 0,
          credit: line.credit || 0
        }));
        
        await supabase.from('lignes_ecriture').insert(linesInsert);
      }
      
      toast({
        title: "Succès",
        description: "Écriture modifiée avec succès"
      });
      
      await loadEntries();
      return data as any;
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer une écriture
  const deleteEntry = async (id: string): Promise<void> => {
    try {
      setIsSaving(true);
      
      const entry = entries.find(e => e.id === id);
      if (!entry || entry.statut !== 'Brouillon') {
        throw new Error('Seules les écritures en brouillon peuvent être supprimées');
      }
      
      const { error } = await supabase
        .from('ecritures_comptables')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Écriture supprimée avec succès"
      });
      
      await loadEntries();
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Valider une écriture
  const validateEntry = async (id: string): Promise<void> => {
    try {
      setIsSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      const { data: personnel } = await supabase
        .from('personnel')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();
      
      const { error } = await supabase
        .from('ecritures_comptables')
        .update({
          statut: 'Validé',
          validated_by_id: personnel?.id,
          validated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Écriture validée avec succès"
      });
      
      await loadEntries();
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Verrouiller une écriture
  const lockEntry = async (id: string): Promise<void> => {
    try {
      setIsSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      const { data: personnel } = await supabase
        .from('personnel')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();
      
      const { error } = await supabase
        .from('ecritures_comptables')
        .update({
          statut: 'Verrouillé',
          locked_by_id: personnel?.id,
          locked_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Écriture verrouillée avec succès"
      });
      
      await loadEntries();
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Recherche et filtres
  const searchEntries = (term: string, journalId?: string) => {
    return entries.filter(entry => {
      const matchesSearch = entry.libelle.toLowerCase().includes(term.toLowerCase()) ||
                           entry.numero_piece.toLowerCase().includes(term.toLowerCase());
      const matchesJournal = !journalId || entry.journal_id === journalId;
      return matchesSearch && matchesJournal;
    });
  };

  const getEntriesByJournal = (journalId: string) => {
    return entries.filter(entry => entry.journal_id === journalId);
  };

  const getEntriesByStatus = (status: string) => {
    return entries.filter(entry => entry.statut === status);
  };

  // Statistiques par journal
  const getJournalStats = (journalId: string) => {
    const journalEntries = getEntriesByJournal(journalId);
    return {
      entriesCount: journalEntries.length,
      totalAmount: journalEntries.reduce((sum, e) => sum + e.montant_total, 0),
      brouillonCount: journalEntries.filter(e => e.statut === 'Brouillon').length,
      valideCount: journalEntries.filter(e => e.statut === 'Validé').length,
      verrouilleCount: journalEntries.filter(e => e.statut === 'Verrouillé').length
    };
  };

  return {
    journals,
    entries,
    currentEntry,
    isLoadingJournals,
    isLoadingEntries,
    isLoading: isLoadingJournals || isLoadingEntries,
    isSaving,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    validateEntry,
    lockEntry,
    searchEntries,
    getEntriesByJournal,
    getEntriesByStatus,
    getJournalStats,
    calculateBalance,
    generatePieceNumber,
    refreshEntries: loadEntries,
    refreshJournals: loadJournals
  };
};