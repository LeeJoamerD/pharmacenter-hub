/**
 * Service de génération des écritures comptables pour la paie
 * Conforme au SYSCOHADA Révisé
 * 
 * Écritures générées lors du paiement d'un bulletin :
 * 1. Écriture de constatation (Journal OD) :
 *    - Débit 6611 = salaire_brut
 *    - Débit 6641 = cotisations_patronales_cnss
 *    - Crédit 422 = net_a_payer
 *    - Crédit 431 = retenues_cnss_employe + cotisations_patronales_cnss
 *    - Crédit 447 = retenues_irpp (si > 0)
 * 2. Écriture de règlement (Journal CAI/BQ1) :
 *    - Débit 422 = net_a_payer
 *    - Crédit 571/521/5721 = net_a_payer (selon mode paiement)
 */

import { supabase } from '@/integrations/supabase/client';

interface PayrollBulletin {
  id: string;
  tenant_id: string;
  personnel_id: string;
  periode_mois: number;
  periode_annee: number;
  salaire_brut: number;
  net_a_payer: number;
  retenues_cnss_employe: number;
  retenues_irpp: number;
  cotisations_patronales_cnss: number;
  mode_paiement: string | null;
  personnel?: {
    noms: string;
    prenoms: string;
  };
}

interface DefaultAccountConfig {
  compte_debit_numero: string;
  compte_credit_numero: string;
  journal_code: string;
}

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
 * Génère les écritures comptables SYSCOHADA pour un bulletin de paie payé
 */
export async function generatePayrollAccountingEntries(bulletin: PayrollBulletin): Promise<string | null> {
  try {
    const tenantId = bulletin.tenant_id;
    const employeNom = bulletin.personnel
      ? `${bulletin.personnel.prenoms} ${bulletin.personnel.noms}`
      : 'Employé';

    const periodeLabel = `${String(bulletin.periode_mois).padStart(2, '0')}/${bulletin.periode_annee}`;

    // 1. Get accounting configs
    const chargeConfig = await getDefaultAccountConfig(tenantId, 'charge_salaires');
    const cnssPatronaleConfig = await getDefaultAccountConfig(tenantId, 'charge_cnss_patronale');

    if (!chargeConfig) {
      console.log('⚠️ Configuration charge_salaires manquante');
      return null;
    }

    // Determine payment event type
    const modePaiement = bulletin.mode_paiement || 'Espèces';
    let paymentEventType = 'paiement_salaire_especes';
    if (modePaiement === 'Virement') paymentEventType = 'paiement_salaire_banque';
    else if (modePaiement === 'Mobile Money') paymentEventType = 'paiement_salaire_mobile';
    else if (modePaiement === 'Chèque') paymentEventType = 'paiement_salaire_banque';

    const paymentConfig = await getDefaultAccountConfig(tenantId, paymentEventType);

    // 2. Get OD journal
    const { data: journalOD } = await supabase
      .from('journaux_comptables')
      .select('id, code_journal')
      .eq('tenant_id', tenantId)
      .eq('code_journal', chargeConfig.journal_code)
      .eq('is_active', true)
      .maybeSingle();

    if (!journalOD) {
      console.log(`⚠️ Journal ${chargeConfig.journal_code} non trouvé`);
      return null;
    }

    // 3. Get current exercice
    const { data: exercice } = await supabase
      .from('exercices_comptables')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('statut', ['En cours', 'Ouvert'])
      .maybeSingle();

    if (!exercice) {
      console.log('⚠️ Aucun exercice comptable en cours');
      return null;
    }

    // 4. Collect all account numbers needed
    const compteNumeros = new Set<string>();
    compteNumeros.add(chargeConfig.compte_debit_numero); // 6611
    compteNumeros.add(chargeConfig.compte_credit_numero); // 422
    if (cnssPatronaleConfig) {
      compteNumeros.add(cnssPatronaleConfig.compte_debit_numero); // 6641
      compteNumeros.add(cnssPatronaleConfig.compte_credit_numero); // 431
    }
    // 447 for IRPP
    if (bulletin.retenues_irpp > 0) {
      const irppConfig = await getDefaultAccountConfig(tenantId, 'retenue_irpp');
      if (irppConfig) compteNumeros.add(irppConfig.compte_credit_numero); // 447
    }
    if (paymentConfig) {
      compteNumeros.add(paymentConfig.compte_debit_numero); // 422
      compteNumeros.add(paymentConfig.compte_credit_numero); // 571/521/5721
    }

    const { data: comptes } = await supabase
      .from('plan_comptable')
      .select('id, numero_compte')
      .eq('tenant_id', tenantId)
      .in('numero_compte', Array.from(compteNumeros));

    if (!comptes || comptes.length === 0) {
      console.log('⚠️ Comptes comptables non trouvés dans le plan comptable');
      return null;
    }

    const comptesMap: Record<string, string> = {};
    comptes.forEach(c => { comptesMap[c.numero_compte] = c.id; });

    // 5. Create constatation entry (Journal OD)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const numeroPiece = `PAI-${dateStr}-${periodeLabel.replace('/', '')}`;

    // @ts-ignore
    const { data: ecriture, error: ecritureError } = await supabase
      .from('ecritures_comptables')
      .insert({
        tenant_id: tenantId,
        exercice_id: exercice.id,
        journal_id: journalOD.id,
        date_ecriture: new Date().toISOString().split('T')[0],
        numero_piece: numeroPiece,
        libelle: `Salaire ${periodeLabel} - ${employeNom}`,
        reference_type: 'bulletin_paie',
        reference_id: bulletin.id,
        statut: 'Brouillon',
        is_auto_generated: true,
      })
      .select()
      .single();

    if (ecritureError || !ecriture) {
      console.error('❌ Erreur création écriture paie:', ecritureError);
      return null;
    }

    const lignes: any[] = [];

    // Débit 6611 = salaire_brut
    if (comptesMap[chargeConfig.compte_debit_numero]) {
      lignes.push({
        tenant_id: tenantId,
        ecriture_id: ecriture.id,
        compte_id: comptesMap[chargeConfig.compte_debit_numero],
        libelle: `Salaire brut ${periodeLabel} - ${employeNom}`,
        debit: bulletin.salaire_brut,
        credit: 0,
      });
    }

    // Débit 6641 = cotisations patronales
    if (cnssPatronaleConfig && bulletin.cotisations_patronales_cnss > 0 && comptesMap[cnssPatronaleConfig.compte_debit_numero]) {
      lignes.push({
        tenant_id: tenantId,
        ecriture_id: ecriture.id,
        compte_id: comptesMap[cnssPatronaleConfig.compte_debit_numero],
        libelle: `Charges patronales CNSS ${periodeLabel} - ${employeNom}`,
        debit: bulletin.cotisations_patronales_cnss,
        credit: 0,
      });
    }

    // Crédit 422 = net_a_payer
    if (comptesMap[chargeConfig.compte_credit_numero]) {
      lignes.push({
        tenant_id: tenantId,
        ecriture_id: ecriture.id,
        compte_id: comptesMap[chargeConfig.compte_credit_numero],
        libelle: `Rémunération due ${periodeLabel} - ${employeNom}`,
        debit: 0,
        credit: bulletin.net_a_payer,
      });
    }

    // Crédit 431 = retenues CNSS employé + cotisations patronales
    const totalCnss = bulletin.retenues_cnss_employe + bulletin.cotisations_patronales_cnss;
    if (cnssPatronaleConfig && totalCnss > 0 && comptesMap[cnssPatronaleConfig.compte_credit_numero]) {
      lignes.push({
        tenant_id: tenantId,
        ecriture_id: ecriture.id,
        compte_id: comptesMap[cnssPatronaleConfig.compte_credit_numero],
        libelle: `CNSS à payer ${periodeLabel} - ${employeNom}`,
        debit: 0,
        credit: totalCnss,
      });
    }

    // Crédit 447 = IRPP
    if (bulletin.retenues_irpp > 0) {
      const irppConfig = await getDefaultAccountConfig(tenantId, 'retenue_irpp');
      if (irppConfig && comptesMap[irppConfig.compte_credit_numero]) {
        lignes.push({
          tenant_id: tenantId,
          ecriture_id: ecriture.id,
          compte_id: comptesMap[irppConfig.compte_credit_numero],
          libelle: `IRPP à payer ${periodeLabel} - ${employeNom}`,
          debit: 0,
          credit: bulletin.retenues_irpp,
        });
      }
    }

    if (lignes.length > 0) {
      // @ts-ignore
      const { error: lignesError } = await supabase.from('lignes_ecriture').insert(lignes);
      if (lignesError) {
        console.error('❌ Erreur lignes écriture paie:', lignesError);
        return null;
      }
    }

    // 6. Create payment entry (Journal CAI/BQ1)
    if (paymentConfig) {
      const { data: journalPay } = await supabase
        .from('journaux_comptables')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('code_journal', paymentConfig.journal_code)
        .eq('is_active', true)
        .maybeSingle();

      if (journalPay) {
        const numeroPiecePay = `RPM-${dateStr}-${periodeLabel.replace('/', '')}`;

        // @ts-ignore
        const { data: ecriturePay, error: errPay } = await supabase
          .from('ecritures_comptables')
          .insert({
            tenant_id: tenantId,
            exercice_id: exercice.id,
            journal_id: journalPay.id,
            date_ecriture: new Date().toISOString().split('T')[0],
            numero_piece: numeroPiecePay,
            libelle: `Règlement salaire ${periodeLabel} - ${employeNom}`,
            reference_type: 'bulletin_paie',
            reference_id: bulletin.id,
            statut: 'Brouillon',
            is_auto_generated: true,
          })
          .select()
          .single();

        if (!errPay && ecriturePay) {
          const lignesPay: any[] = [];

          // Débit 422
          if (comptesMap[paymentConfig.compte_debit_numero]) {
            lignesPay.push({
              tenant_id: tenantId,
              ecriture_id: ecriturePay.id,
              compte_id: comptesMap[paymentConfig.compte_debit_numero],
              libelle: `Règlement salaire ${periodeLabel} - ${employeNom}`,
              debit: bulletin.net_a_payer,
              credit: 0,
            });
          }

          // Crédit trésorerie
          if (comptesMap[paymentConfig.compte_credit_numero]) {
            lignesPay.push({
              tenant_id: tenantId,
              ecriture_id: ecriturePay.id,
              compte_id: comptesMap[paymentConfig.compte_credit_numero],
              libelle: `Règlement salaire ${periodeLabel} - ${employeNom}`,
              debit: 0,
              credit: bulletin.net_a_payer,
            });
          }

          if (lignesPay.length > 0) {
            // @ts-ignore
            await supabase.from('lignes_ecriture').insert(lignesPay);
          }
        }
      }
    }

    // 7. Update bulletin with ecriture_id
    await supabase
      .from('bulletins_paie')
      .update({ ecriture_id: ecriture.id })
      .eq('id', bulletin.id);

    console.log(`✅ Écritures comptables paie générées pour ${employeNom} - ${periodeLabel}`);
    return ecriture.id;
  } catch (error) {
    console.error('❌ Erreur génération écritures paie:', error);
    return null;
  }
}
