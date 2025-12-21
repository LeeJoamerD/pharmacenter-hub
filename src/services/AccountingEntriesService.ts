/**
 * Service de génération automatique des écritures comptables
 * Génère les écritures lors des ventes et réceptions
 */

import { supabase } from '@/integrations/supabase/client';

interface VenteEcritureData {
  venteId: string;
  numeroVente: string;
  tenantId: string;
  montantHT: number;
  montantTVA: number;
  montantCentimeAdditionnel: number;
  montantTTC: number;
  modePaiement: string;
}

interface CompteComptable {
  id: string;
  numero_compte: string;
  libelle: string;
}

/**
 * Génère les écritures comptables pour une vente
 * 
 * Écritures standard:
 * - Débit 411 (Client) ou 57 (Caisse) : montant TTC
 * - Crédit 701 (Ventes) : montant HT
 * - Crédit 4457 (TVA Collectée) : montant TVA
 * - Crédit 4458 (Centime Additionnel) : montant centime
 */
export async function generateSaleAccountingEntries(data: VenteEcritureData): Promise<boolean> {
  try {
    const {
      venteId,
      numeroVente,
      tenantId,
      montantHT,
      montantTVA,
      montantCentimeAdditionnel,
      montantTTC
    } = data;

    // Récupérer les comptes comptables par défaut pour les ventes
    const { data: defaultAccounts, error: accountsError } = await supabase
      .from('accounting_default_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('event_type', 'vente')
      .eq('is_active', true)
      .single();

    if (accountsError || !defaultAccounts) {
      console.log('⚠️ Pas de configuration comptable par défaut pour les ventes, écritures non générées');
      return false;
    }

    // Récupérer le journal des ventes
    const { data: journal, error: journalError } = await supabase
      .from('accounting_journals')
      .select('id, code')
      .eq('tenant_id', tenantId)
      .eq('code', defaultAccounts.journal_code)
      .eq('is_active', true)
      .single();

    if (journalError || !journal) {
      console.log('⚠️ Journal comptable non trouvé, écritures non générées');
      return false;
    }

    // Récupérer l'exercice comptable en cours
    const { data: exercice, error: exerciceError } = await supabase
      .from('exercices_comptables')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('statut', 'En cours')
      .single();

    if (exerciceError || !exercice) {
      console.log('⚠️ Aucun exercice comptable en cours, écritures non générées');
      return false;
    }

    // Générer le numéro de pièce
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const numeroPiece = `VTE-${dateStr}-${numeroVente.slice(-4)}`;

    // Créer l'écriture comptable principale
    // @ts-ignore - Ignorer les erreurs de typage Supabase
    const { data: ecriture, error: ecritureError } = await supabase
      .from('ecritures_comptables')
      .insert({
        tenant_id: tenantId,
        exercice_id: exercice.id,
        journal_id: journal.id,
        date_ecriture: new Date().toISOString().split('T')[0],
        numero_piece: numeroPiece,
        libelle: `Vente ${numeroVente}`,
        reference_type: 'vente',
        reference_id: venteId,
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
      defaultAccounts.compte_credit_numero,
      '4457', // TVA collectée
      '4458'  // Centime additionnel
    ];

    const { data: comptes, error: comptesError } = await supabase
      .from('comptes_comptables')
      .select('id, numero_compte')
      .eq('tenant_id', tenantId)
      .in('numero_compte', compteNumeros);

    if (comptesError || !comptes || comptes.length === 0) {
      console.log('⚠️ Comptes comptables non trouvés, écritures non générées');
      return false;
    }

    // Créer un map numéro -> id
    const comptesMap: Record<string, string> = {};
    comptes.forEach(c => {
      comptesMap[c.numero_compte] = c.id;
    });

    // Préparer les lignes d'écriture
    const lignes: any[] = [];

    // Ligne 1: Débit Caisse/Client (TTC)
    const compteDebitId = comptesMap[defaultAccounts.compte_debit_numero];
    if (compteDebitId) {
      lignes.push({
        tenant_id: tenantId,
        ecriture_id: ecriture.id,
        compte_id: compteDebitId,
        libelle: `Vente ${numeroVente}`,
        debit: montantTTC,
        credit: 0
      });
    }

    // Ligne 2: Crédit Ventes (HT)
    const compteCreditId = comptesMap[defaultAccounts.compte_credit_numero];
    if (montantHT > 0 && compteCreditId) {
      lignes.push({
        tenant_id: tenantId,
        ecriture_id: ecriture.id,
        compte_id: compteCreditId,
        libelle: `Vente ${numeroVente} - HT`,
        debit: 0,
        credit: montantHT
      });
    }

    // Ligne 3: Crédit TVA Collectée
    const compteTvaId = comptesMap['4457'];
    if (montantTVA > 0 && compteTvaId) {
      lignes.push({
        tenant_id: tenantId,
        ecriture_id: ecriture.id,
        compte_id: compteTvaId,
        libelle: `Vente ${numeroVente} - TVA`,
        debit: 0,
        credit: montantTVA
      });
    }

    // Ligne 4: Crédit Centime Additionnel
    const compteCentimeId = comptesMap['4458'];
    if (montantCentimeAdditionnel > 0 && compteCentimeId) {
      lignes.push({
        tenant_id: tenantId,
        ecriture_id: ecriture.id,
        compte_id: compteCentimeId,
        libelle: `Vente ${numeroVente} - Centime Add.`,
        debit: 0,
        credit: montantCentimeAdditionnel
      });
    }

    // Insérer les lignes d'écriture
    if (lignes.length > 0) {
      // @ts-ignore - Ignorer les erreurs de typage Supabase
      const { error: lignesError } = await supabase
        .from('lignes_ecriture')
        .insert(lignes);

      if (lignesError) {
        console.error('❌ Erreur création lignes écriture:', lignesError);
        return false;
      }
    }

    console.log('✅ Écritures comptables générées pour vente:', numeroVente);
    return true;

  } catch (error) {
    console.error('❌ Erreur génération écritures comptables:', error);
    return false;
  }
}

/**
 * Vérifie si la génération automatique des écritures est activée pour un tenant
 */
export async function isAutoAccountingEnabled(tenantId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('accounting_general_config')
      .select('auto_calcul_tva')
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      return false;
    }

    // Utiliser auto_calcul_tva comme indicateur de génération automatique
    return data.auto_calcul_tva === true;
  } catch {
    return false;
  }
}

export const AccountingEntriesService = {
  generateSaleAccountingEntries,
  isAutoAccountingEnabled
};

export default AccountingEntriesService;
