/**
 * Service de génération automatique des écritures comptables
 * Génère les écritures lors des ventes et réceptions
 * 
 * SYSCOHADA compliant - Utilise accounting_default_accounts pour tous les comptes
 * Aucun numéro de compte hardcodé
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

interface SessionEcritureData {
  sessionId: string;
  numeroSession: string;
  tenantId: string;
  montantTotalHT: number;
  montantTotalTVA: number;
  montantTotalCentimeAdditionnel: number;
  montantTotalTTC: number;
  nombreVentes: number;
  modePaiementPrincipal: string;
}

interface SessionSalesTotals {
  totalHT: number;
  totalTVA: number;
  totalCentimeAdditionnel: number;
  totalTTC: number;
  nombreVentes: number;
  modePaiementPrincipal: string;
}

interface DefaultAccountConfig {
  compte_debit_numero: string;
  compte_credit_numero: string;
  journal_code: string;
}

/**
 * Récupère la configuration de comptes par défaut depuis accounting_default_accounts
 */
async function getDefaultAccountConfig(
  tenantId: string, 
  eventType: string
): Promise<DefaultAccountConfig | null> {
  const { data, error } = await supabase
    .from('accounting_default_accounts')
    .select('compte_debit_numero, compte_credit_numero, journal_code')
    .eq('tenant_id', tenantId)
    .eq('event_type', eventType)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    console.log(`⚠️ Pas de configuration comptable pour ${eventType}`);
    return null;
  }
  return data;
}

/**
 * Génère les écritures comptables pour une vente
 * 
 * Écritures standard (pilotées par accounting_default_accounts):
 * - Débit 411 (Client) ou 57 (Caisse) : montant TTC
 * - Crédit 701 (Ventes) : montant HT
 * - Crédit TVA collectée : montant TVA
 * - Crédit Centime Additionnel : montant centime
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
      montantTTC,
      modePaiement
    } = data;

    // Déterminer le bon event_type selon le mode de paiement
    const eventType = modePaiement === 'Espèces' || modePaiement === 'Carte Bancaire' || modePaiement === 'Mobile Money' || modePaiement === 'Carte'
      ? 'vente_comptant'
      : 'vente_client';

    // Récupérer les comptes comptables par défaut pour les ventes
    const defaultAccounts = await getDefaultAccountConfig(tenantId, eventType);
    if (!defaultAccounts) {
      console.log(`⚠️ Pas de configuration comptable par défaut pour ${eventType}, écritures non générées`);
      return false;
    }

    // Récupérer les configs fiscales depuis accounting_default_accounts
    const tvaConfig = await getDefaultAccountConfig(tenantId, 'tva_collectee');
    const centimeConfig = await getDefaultAccountConfig(tenantId, 'centime_additionnel');

    // Récupérer le journal des ventes depuis journaux_comptables
    const { data: journal, error: journalError } = await supabase
      .from('journaux_comptables')
      .select('id, code_journal')
      .eq('tenant_id', tenantId)
      .eq('code_journal', defaultAccounts.journal_code)
      .eq('is_active', true)
      .maybeSingle();

    if (journalError || !journal) {
      console.log(`⚠️ Journal comptable non trouvé pour code_journal='${defaultAccounts.journal_code}', écritures non générées`);
      return false;
    }

    // Récupérer l'exercice comptable en cours
    const { data: exercice, error: exerciceError } = await supabase
      .from('exercices_comptables')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('statut', ['En cours', 'Ouvert'])
      .maybeSingle();

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
        statut: 'Brouillon',
        is_auto_generated: true
      })
      .select()
      .single();

    if (ecritureError || !ecriture) {
      console.error('❌ Erreur création écriture comptable:', ecritureError);
      return false;
    }

    // Construire la liste des comptes à récupérer
    const compteNumeros = [
      defaultAccounts.compte_debit_numero,
      defaultAccounts.compte_credit_numero
    ];
    
    if (tvaConfig?.compte_credit_numero) {
      compteNumeros.push(tvaConfig.compte_credit_numero);
    }
    if (centimeConfig?.compte_credit_numero) {
      compteNumeros.push(centimeConfig.compte_credit_numero);
    }

    const { data: comptes, error: comptesError } = await supabase
      .from('plan_comptable')
      .select('id, numero_compte')
      .eq('tenant_id', tenantId)
      .in('numero_compte', compteNumeros.filter(Boolean));

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

    // Ligne 3: Crédit TVA Collectée (depuis config)
    if (montantTVA > 0 && tvaConfig?.compte_credit_numero) {
      const compteTvaId = comptesMap[tvaConfig.compte_credit_numero];
      if (compteTvaId) {
        lignes.push({
          tenant_id: tenantId,
          ecriture_id: ecriture.id,
          compte_id: compteTvaId,
          libelle: `Vente ${numeroVente} - TVA`,
          debit: 0,
          credit: montantTVA
        });
      }
    }

    // Ligne 4: Crédit Centime Additionnel (depuis config)
    if (montantCentimeAdditionnel > 0 && centimeConfig?.compte_credit_numero) {
      const compteCentimeId = comptesMap[centimeConfig.compte_credit_numero];
      if (compteCentimeId) {
        lignes.push({
          tenant_id: tenantId,
          ecriture_id: ecriture.id,
          compte_id: compteCentimeId,
          libelle: `Vente ${numeroVente} - Centime Add.`,
          debit: 0,
          credit: montantCentimeAdditionnel
        });
      }
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
 * Récupère les totaux des ventes d'une session de caisse
 */
export async function getSessionSalesTotals(sessionId: string, tenantId: string): Promise<SessionSalesTotals> {
  try {
    // Récupérer les ventes validées de la session
    const { data: ventes, error } = await supabase
      .from('ventes')
      .select('montant_total_ht, montant_tva, montant_centime_additionnel, montant_total_ttc, mode_paiement')
      .eq('tenant_id', tenantId)
      .eq('session_caisse_id', sessionId)
      .eq('statut', 'Validée');

    if (error || !ventes) {
      console.error('❌ Erreur récupération ventes session:', error);
      return {
        totalHT: 0,
        totalTVA: 0,
        totalCentimeAdditionnel: 0,
        totalTTC: 0,
        nombreVentes: 0,
        modePaiementPrincipal: 'Espèces'
      };
    }

    // Calculer les totaux
    const totalHT = ventes.reduce((sum, v) => sum + (Number(v.montant_total_ht) || 0), 0);
    const totalTVA = ventes.reduce((sum, v) => sum + (Number(v.montant_tva) || 0), 0);
    const totalCentimeAdditionnel = ventes.reduce((sum, v) => sum + (Number(v.montant_centime_additionnel) || 0), 0);
    const totalTTC = ventes.reduce((sum, v) => sum + (Number(v.montant_total_ttc) || 0), 0);

    // Trouver le mode de paiement principal (le plus fréquent)
    const modePaiementCount: Record<string, number> = {};
    ventes.forEach(v => {
      const mode = v.mode_paiement || 'Espèces';
      modePaiementCount[mode] = (modePaiementCount[mode] || 0) + 1;
    });
    
    const modePaiementPrincipal = Object.entries(modePaiementCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Espèces';

    return {
      totalHT,
      totalTVA,
      totalCentimeAdditionnel,
      totalTTC,
      nombreVentes: ventes.length,
      modePaiementPrincipal
    };
  } catch (error) {
    console.error('❌ Erreur calcul totaux session:', error);
    return {
      totalHT: 0,
      totalTVA: 0,
      totalCentimeAdditionnel: 0,
      totalTTC: 0,
      nombreVentes: 0,
      modePaiementPrincipal: 'Espèces'
    };
  }
}

/**
 * Génère les écritures comptables consolidées pour une session de caisse
 * Une seule écriture avec toutes les ventes agrégées
 */
export async function generateSessionAccountingEntries(data: SessionEcritureData): Promise<boolean> {
  try {
    const {
      sessionId,
      numeroSession,
      tenantId,
      montantTotalHT,
      montantTotalTVA,
      montantTotalCentimeAdditionnel,
      montantTotalTTC,
      nombreVentes,
      modePaiementPrincipal
    } = data;

    // Déterminer le bon event_type selon le mode de paiement principal
    const eventType = modePaiementPrincipal === 'Espèces' || modePaiementPrincipal === 'Carte Bancaire' || modePaiementPrincipal === 'Mobile Money' || modePaiementPrincipal === 'Carte'
      ? 'vente_comptant'
      : 'vente_client';

    // Récupérer les comptes comptables par défaut pour les ventes
    const defaultAccounts = await getDefaultAccountConfig(tenantId, eventType);
    if (!defaultAccounts) {
      console.log(`⚠️ Pas de configuration comptable par défaut pour ${eventType}, écritures non générées`);
      return false;
    }

    // Récupérer les configs fiscales depuis accounting_default_accounts
    const tvaConfig = await getDefaultAccountConfig(tenantId, 'tva_collectee');
    const centimeConfig = await getDefaultAccountConfig(tenantId, 'centime_additionnel');

    // Récupérer le journal des ventes
    const { data: journal, error: journalError } = await supabase
      .from('journaux_comptables')
      .select('id, code_journal')
      .eq('tenant_id', tenantId)
      .eq('code_journal', defaultAccounts.journal_code)
      .eq('is_active', true)
      .maybeSingle();

    if (journalError || !journal) {
      console.log(`⚠️ Journal comptable non trouvé pour code_journal='${defaultAccounts.journal_code}', écritures non générées`);
      return false;
    }

    // Récupérer l'exercice comptable en cours
    const { data: exercice, error: exerciceError } = await supabase
      .from('exercices_comptables')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('statut', ['En cours', 'Ouvert'])
      .maybeSingle();

    if (exerciceError || !exercice) {
      console.log('⚠️ Aucun exercice comptable en cours, écritures non générées');
      return false;
    }

    // Générer le numéro de pièce
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const numeroPiece = `SESS-${dateStr}-${numeroSession.slice(-4)}`;

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
        libelle: `Ventes Session #${numeroSession} (${nombreVentes} ventes)`,
        reference_type: 'session_caisse',
        reference_id: sessionId,
        statut: 'Brouillon',
        is_auto_generated: true
      })
      .select()
      .single();

    if (ecritureError || !ecriture) {
      console.error('❌ Erreur création écriture comptable session:', ecritureError);
      return false;
    }

    // Construire la liste des comptes à récupérer
    const compteNumeros = [
      defaultAccounts.compte_debit_numero,
      defaultAccounts.compte_credit_numero
    ];
    
    if (tvaConfig?.compte_credit_numero) {
      compteNumeros.push(tvaConfig.compte_credit_numero);
    }
    if (centimeConfig?.compte_credit_numero) {
      compteNumeros.push(centimeConfig.compte_credit_numero);
    }

    const { data: comptes, error: comptesError } = await supabase
      .from('plan_comptable')
      .select('id, numero_compte')
      .eq('tenant_id', tenantId)
      .in('numero_compte', compteNumeros.filter(Boolean));

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
        libelle: `Ventes Session #${numeroSession} (${nombreVentes} ventes)`,
        debit: montantTotalTTC,
        credit: 0
      });
    }

    // Ligne 2: Crédit Ventes (HT)
    const compteCreditId = comptesMap[defaultAccounts.compte_credit_numero];
    if (montantTotalHT > 0 && compteCreditId) {
      lignes.push({
        tenant_id: tenantId,
        ecriture_id: ecriture.id,
        compte_id: compteCreditId,
        libelle: `Ventes Session #${numeroSession} - HT`,
        debit: 0,
        credit: montantTotalHT
      });
    }

    // Ligne 3: Crédit TVA Collectée (depuis config)
    if (montantTotalTVA > 0 && tvaConfig?.compte_credit_numero) {
      const compteTvaId = comptesMap[tvaConfig.compte_credit_numero];
      if (compteTvaId) {
        lignes.push({
          tenant_id: tenantId,
          ecriture_id: ecriture.id,
          compte_id: compteTvaId,
          libelle: `Ventes Session #${numeroSession} - TVA`,
          debit: 0,
          credit: montantTotalTVA
        });
      }
    }

    // Ligne 4: Crédit Centime Additionnel (depuis config)
    if (montantTotalCentimeAdditionnel > 0 && centimeConfig?.compte_credit_numero) {
      const compteCentimeId = comptesMap[centimeConfig.compte_credit_numero];
      if (compteCentimeId) {
        lignes.push({
          tenant_id: tenantId,
          ecriture_id: ecriture.id,
          compte_id: compteCentimeId,
          libelle: `Ventes Session #${numeroSession} - Centime Add.`,
          debit: 0,
          credit: montantTotalCentimeAdditionnel
        });
      }
    }

    // Insérer les lignes d'écriture
    if (lignes.length > 0) {
      // @ts-ignore - Ignorer les erreurs de typage Supabase
      const { error: lignesError } = await supabase
        .from('lignes_ecriture')
        .insert(lignes);

      if (lignesError) {
        console.error('❌ Erreur création lignes écriture session:', lignesError);
        return false;
      }
    }

    console.log(`✅ Écritures comptables générées pour session ${numeroSession} (${nombreVentes} ventes)`);
    return true;

  } catch (error) {
    console.error('❌ Erreur génération écritures comptables session:', error);
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
      .maybeSingle();

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
  generateSessionAccountingEntries,
  getSessionSalesTotals,
  isAutoAccountingEnabled
};

export default AccountingEntriesService;
