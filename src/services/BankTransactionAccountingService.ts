/**
 * Service de génération des écritures comptables pour les transactions bancaires
 * Génère les écritures lors de la création de transaction ou au rapprochement
 */

import { supabase } from '@/integrations/supabase/client';

export interface BankTransactionEcritureData {
  transactionId: string;
  tenantId: string;
  compteBancaireId: string;
  montant: number;
  typeTransaction: 'credit' | 'debit';
  categorie?: string;
  libelle: string;
  dateTransaction: string;
  reference?: string;
}

interface EventTypeMapping {
  [key: string]: string;
}

// Mapping des catégories de transaction vers les event_types de accounting_default_accounts
const CATEGORY_EVENT_MAPPING: EventTypeMapping = {
  // Encaissements (crédit)
  'Règlement client': 'encaissement_client',
  'Vente': 'encaissement_client',
  'Remboursement': 'encaissement_client',
  'Encaissement': 'encaissement_client',
  'Intérêts': 'interets_crediteurs',
  'Remise chèques': 'remise_cheques',
  
  // Décaissements (débit)
  'Paiement fournisseur': 'decaissement_fournisseur',
  'Achat': 'decaissement_fournisseur',
  'Frais bancaires': 'frais_bancaires',
  'Commission': 'frais_bancaires',
  'Agios': 'interets_debiteurs',
  'Virement interne': 'virement_interne',
  'Transfert': 'virement_interne',
  
  // Par défaut selon le type
  'Autre crédit': 'autre_encaissement',
  'Autre débit': 'autre_decaissement',
};

/**
 * Détermine l'event_type à utiliser pour récupérer les comptes par défaut
 */
function determineEventType(categorie: string | undefined, typeTransaction: 'credit' | 'debit'): string {
  if (categorie && CATEGORY_EVENT_MAPPING[categorie]) {
    return CATEGORY_EVENT_MAPPING[categorie];
  }
  
  // Par défaut selon le type de transaction
  return typeTransaction === 'credit' ? 'autre_encaissement' : 'autre_decaissement';
}

/**
 * Vérifie si une transaction peut générer une écriture comptable
 * Retourne true si la transaction a les informations nécessaires
 */
export function canGenerateEntry(transaction: BankTransactionEcritureData): boolean {
  return !!(
    transaction.transactionId &&
    transaction.tenantId &&
    transaction.compteBancaireId &&
    transaction.montant &&
    transaction.montant !== 0 &&
    transaction.typeTransaction
  );
}

/**
 * Vérifie si une écriture existe déjà pour cette transaction
 */
export async function hasExistingEntry(transactionId: string, tenantId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('ecritures_comptables')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('reference_type', 'transaction_bancaire')
    .eq('reference_id', transactionId)
    .maybeSingle();
  
  if (error) {
    console.error('Erreur vérification écriture existante:', error);
    return false;
  }
  
  return !!data;
}

/**
 * Génère les écritures comptables pour une transaction bancaire
 * 
 * Schéma des écritures:
 * - Pour un CRÉDIT (entrée d'argent): Débit 521 (Banque), Crédit compte contrepartie
 * - Pour un DÉBIT (sortie d'argent): Débit compte contrepartie, Crédit 521 (Banque)
 */
export async function generateBankTransactionEntry(data: BankTransactionEcritureData): Promise<boolean> {
  try {
    const {
      transactionId,
      tenantId,
      montant,
      typeTransaction,
      categorie,
      libelle,
      dateTransaction,
      reference
    } = data;

    // Vérifier si une écriture existe déjà
    const exists = await hasExistingEntry(transactionId, tenantId);
    if (exists) {
      console.log('⚠️ Écriture déjà générée pour cette transaction');
      return true;
    }

    // Déterminer l'event_type pour récupérer les comptes par défaut
    const eventType = determineEventType(categorie, typeTransaction);

    // Récupérer les comptes comptables par défaut
    const { data: defaultAccounts, error: accountsError } = await supabase
      .from('accounting_default_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('event_type', eventType)
      .eq('is_active', true)
      .maybeSingle();

    if (accountsError || !defaultAccounts) {
      console.log(`⚠️ Pas de configuration comptable pour ${eventType}, écritures non générées`);
      return false;
    }

    // Récupérer le journal bancaire
    const { data: journal, error: journalError } = await supabase
      .from('accounting_journals')
      .select('id, code')
      .eq('tenant_id', tenantId)
      .eq('code', defaultAccounts.journal_code)
      .eq('is_active', true)
      .maybeSingle();

    if (journalError || !journal) {
      console.log('⚠️ Journal comptable non trouvé');
      return false;
    }

    // Récupérer l'exercice comptable en cours (statut 'En cours' ou 'Ouvert')
    const { data: exercice, error: exerciceError } = await supabase
      .from('exercices_comptables')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('statut', ['En cours', 'Ouvert'])
      .maybeSingle();

    if (exerciceError || !exercice) {
      console.log('⚠️ Aucun exercice comptable en cours');
      return false;
    }

    // Générer le numéro de pièce
    const dateStr = new Date(dateTransaction).toISOString().slice(0, 10).replace(/-/g, '');
    const shortId = transactionId.slice(-4).toUpperCase();
    const prefixe = typeTransaction === 'credit' ? 'ENC' : 'DEC';
    const numeroPiece = `${prefixe}-${dateStr}-${shortId}`;

    // Créer l'écriture comptable principale
    // @ts-ignore - Ignorer les erreurs de typage Supabase
    const { data: ecriture, error: ecritureError } = await supabase
      .from('ecritures_comptables')
      .insert({
        tenant_id: tenantId,
        exercice_id: exercice.id,
        journal_id: journal.id,
        date_ecriture: dateTransaction,
        numero_piece: numeroPiece,
        libelle: libelle || `Transaction bancaire ${reference || ''}`.trim(),
        reference_type: 'transaction_bancaire',
        reference_id: transactionId,
        statut: 'brouillon',
        is_auto_generated: true
      })
      .select()
      .single();

    if (ecritureError || !ecriture) {
      console.error('❌ Erreur création écriture comptable:', ecritureError);
      return false;
    }

    // Récupérer les comptes comptables nécessaires
    const compteNumeros = [
      defaultAccounts.compte_debit_numero,
      defaultAccounts.compte_credit_numero
    ];

    const { data: comptes, error: comptesError } = await supabase
      .from('comptes_comptables')
      .select('id, numero_compte')
      .eq('tenant_id', tenantId)
      .in('numero_compte', compteNumeros);

    if (comptesError || !comptes || comptes.length < 2) {
      console.log('⚠️ Comptes comptables non trouvés');
      // Supprimer l'écriture créée car les lignes ne peuvent pas être ajoutées
      await supabase.from('ecritures_comptables').delete().eq('id', ecriture.id);
      return false;
    }

    // Créer un map numéro -> id
    const comptesMap: Record<string, string> = {};
    comptes.forEach(c => {
      comptesMap[c.numero_compte] = c.id;
    });

    const montantAbs = Math.abs(montant);
    const lignes: any[] = [];

    // Ligne débit
    const compteDebitId = comptesMap[defaultAccounts.compte_debit_numero];
    if (compteDebitId) {
      lignes.push({
        tenant_id: tenantId,
        ecriture_id: ecriture.id,
        compte_id: compteDebitId,
        libelle: libelle || `Transaction bancaire`,
        debit: montantAbs,
        credit: 0
      });
    }

    // Ligne crédit
    const compteCreditId = comptesMap[defaultAccounts.compte_credit_numero];
    if (compteCreditId) {
      lignes.push({
        tenant_id: tenantId,
        ecriture_id: ecriture.id,
        compte_id: compteCreditId,
        libelle: libelle || `Transaction bancaire`,
        debit: 0,
        credit: montantAbs
      });
    }

    // Insérer les lignes d'écriture
    if (lignes.length === 2) {
      // @ts-ignore - Ignorer les erreurs de typage Supabase
      const { error: lignesError } = await supabase
        .from('lignes_ecriture')
        .insert(lignes);

      if (lignesError) {
        console.error('❌ Erreur création lignes écriture:', lignesError);
        // Supprimer l'écriture créée
        await supabase.from('ecritures_comptables').delete().eq('id', ecriture.id);
        return false;
      }
    }

    console.log('✅ Écriture comptable générée pour transaction bancaire:', transactionId);
    return true;

  } catch (error) {
    console.error('❌ Erreur génération écriture bancaire:', error);
    return false;
  }
}

/**
 * Supprime l'écriture comptable liée à une transaction bancaire
 * Utilisé lors de la suppression d'une transaction
 */
export async function deleteTransactionEntry(transactionId: string, tenantId: string): Promise<boolean> {
  try {
    // Récupérer l'écriture
    const { data: ecriture, error: fetchError } = await supabase
      .from('ecritures_comptables')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('reference_type', 'transaction_bancaire')
      .eq('reference_id', transactionId)
      .maybeSingle();

    if (fetchError || !ecriture) {
      return true; // Pas d'écriture à supprimer
    }

    // Supprimer les lignes d'écriture
    await supabase
      .from('lignes_ecriture')
      .delete()
      .eq('ecriture_id', ecriture.id);

    // Supprimer l'écriture
    const { error: deleteError } = await supabase
      .from('ecritures_comptables')
      .delete()
      .eq('id', ecriture.id);

    if (deleteError) {
      console.error('❌ Erreur suppression écriture:', deleteError);
      return false;
    }

    console.log('✅ Écriture comptable supprimée');
    return true;

  } catch (error) {
    console.error('❌ Erreur suppression écriture bancaire:', error);
    return false;
  }
}

/**
 * Récupère l'ID de l'écriture comptable liée à une transaction
 */
export async function getTransactionEntryId(transactionId: string, tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('ecritures_comptables')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('reference_type', 'transaction_bancaire')
    .eq('reference_id', transactionId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.id;
}

/**
 * Liste les catégories disponibles pour les transactions bancaires
 */
export function getAvailableCategories(): { value: string; label: string; type: 'credit' | 'debit' }[] {
  return [
    // Encaissements
    { value: 'Règlement client', label: 'Règlement client', type: 'credit' },
    { value: 'Vente', label: 'Vente directe', type: 'credit' },
    { value: 'Encaissement', label: 'Autre encaissement', type: 'credit' },
    { value: 'Remise chèques', label: 'Remise de chèques', type: 'credit' },
    { value: 'Intérêts', label: 'Intérêts bancaires', type: 'credit' },
    
    // Décaissements
    { value: 'Paiement fournisseur', label: 'Paiement fournisseur', type: 'debit' },
    { value: 'Achat', label: 'Achat direct', type: 'debit' },
    { value: 'Frais bancaires', label: 'Frais bancaires', type: 'debit' },
    { value: 'Commission', label: 'Commission', type: 'debit' },
    { value: 'Agios', label: 'Agios / Intérêts débiteurs', type: 'debit' },
    { value: 'Virement interne', label: 'Virement interne', type: 'debit' },
    { value: 'Transfert', label: 'Transfert', type: 'debit' },
  ];
}

export const BankTransactionAccountingService = {
  generateBankTransactionEntry,
  deleteTransactionEntry,
  hasExistingEntry,
  canGenerateEntry,
  getTransactionEntryId,
  getAvailableCategories,
};

export default BankTransactionAccountingService;
