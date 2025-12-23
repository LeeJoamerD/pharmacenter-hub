import { supabase } from "@/integrations/supabase/client";

/**
 * Service pour générer les références automatiques des transactions bancaires
 * Format: TRX-{YYYY}{MM}-{SEQ:5} → TRX-202412-00001
 */

interface NumberingRule {
  id: string;
  format_pattern: string;
  current_number: number;
  reset_frequency: string;
  last_reset_date: string | null;
}

/**
 * Génère une nouvelle référence pour une transaction bancaire
 */
export async function generateTransactionReference(tenantId: string): Promise<string> {
  // Récupérer la règle de numérotation
  const { data: rule, error: ruleError } = await supabase
    .from('accounting_numbering_rules')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('rule_type', 'transaction_bancaire')
    .single();

  if (ruleError || !rule) {
    // Fallback si pas de règle configurée
    console.warn('Aucune règle de numérotation trouvée, utilisation du fallback');
    return generateFallbackReference();
  }

  // Vérifier si on doit réinitialiser le compteur
  const shouldReset = checkShouldReset(rule as NumberingRule);
  
  let newNumber = shouldReset ? 1 : (rule.current_number || 0) + 1;

  // Générer la référence selon le format
  const reference = formatReference(rule.format_pattern, newNumber);

  // Mettre à jour le compteur
  const updateData: any = { 
    current_number: newNumber,
    updated_at: new Date().toISOString()
  };

  if (shouldReset) {
    updateData.last_reset_date = new Date().toISOString();
  }

  await supabase
    .from('accounting_numbering_rules')
    .update(updateData)
    .eq('id', rule.id)
    .eq('tenant_id', tenantId);

  return reference;
}

/**
 * Vérifie si le compteur doit être réinitialisé selon la fréquence
 */
function checkShouldReset(rule: NumberingRule): boolean {
  if (!rule.last_reset_date) return false;

  const lastReset = new Date(rule.last_reset_date);
  const now = new Date();

  switch (rule.reset_frequency) {
    case 'daily':
      return lastReset.toDateString() !== now.toDateString();
    
    case 'monthly':
      return lastReset.getMonth() !== now.getMonth() || 
             lastReset.getFullYear() !== now.getFullYear();
    
    case 'yearly':
      return lastReset.getFullYear() !== now.getFullYear();
    
    case 'never':
    default:
      return false;
  }
}

/**
 * Formate la référence selon le pattern configuré
 * Patterns supportés:
 * - {YYYY} : Année sur 4 chiffres
 * - {YY} : Année sur 2 chiffres
 * - {MM} : Mois sur 2 chiffres
 * - {DD} : Jour sur 2 chiffres
 * - {SEQ:N} : Numéro séquentiel sur N chiffres
 */
function formatReference(pattern: string, sequenceNumber: number): string {
  const now = new Date();
  
  let result = pattern
    .replace('{YYYY}', now.getFullYear().toString())
    .replace('{YY}', now.getFullYear().toString().slice(-2))
    .replace('{MM}', (now.getMonth() + 1).toString().padStart(2, '0'))
    .replace('{DD}', now.getDate().toString().padStart(2, '0'));

  // Remplacer {SEQ:N} par le numéro paddé
  const seqMatch = result.match(/\{SEQ:(\d+)\}/);
  if (seqMatch) {
    const padding = parseInt(seqMatch[1], 10);
    const paddedSeq = sequenceNumber.toString().padStart(padding, '0');
    result = result.replace(seqMatch[0], paddedSeq);
  }

  return result;
}

/**
 * Génère une référence de fallback basée sur le timestamp
 */
function generateFallbackReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-5);
  
  return `TRX-${year}${month}-${timestamp}`;
}

/**
 * Prévisualise la prochaine référence sans l'incrémenter
 */
export async function previewNextReference(tenantId: string): Promise<string> {
  const { data: rule } = await supabase
    .from('accounting_numbering_rules')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('rule_type', 'transaction_bancaire')
    .single();

  if (!rule) {
    return generateFallbackReference();
  }

  const shouldReset = checkShouldReset(rule as NumberingRule);
  const nextNumber = shouldReset ? 1 : (rule.current_number || 0) + 1;
  
  return formatReference(rule.format_pattern, nextNumber);
}
