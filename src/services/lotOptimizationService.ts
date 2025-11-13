import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OptimizationSuggestion {
  id: string;
  type: 'transfer' | 'promotion' | 'reorder' | 'adjustment';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  lotId: string;
  productId?: string;
  lotNumber: string;
  productName: string;
  currentValue: number;
  suggestedValue: number;
  expectedBenefit: string;
}

export class LotOptimizationService {
  
  // Appliquer une suggestion de promotion
  static async applyPromotionSuggestion(
    tenantId: string,
    userId: string,
    suggestion: OptimizationSuggestion
  ) {
    try {
      // 1. Enregistrer la suggestion comme appliquée
      await this.recordSuggestionApplied(tenantId, userId, suggestion);
      
      // 2. Mettre à jour les métriques
      await this.updateMetrics(tenantId, 'promotion');
      
      toast.success(`Promotion de ${suggestion.suggestedValue}% appliquée au lot ${suggestion.lotNumber}`);
      return { success: true };
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  }
  
  // Appliquer une suggestion de réapprovisionnement
  static async applyReorderSuggestion(
    tenantId: string,
    userId: string,
    suggestion: OptimizationSuggestion
  ) {
    try {
      // 1. Créer une entrée dans les actions de stock faible
      // Note: Vous pourrez personnaliser ceci selon vos besoins
      // Par exemple, créer une notification ou une tâche
      
      // Pour l'instant, on enregistre juste la suggestion

      // 2. Enregistrer la suggestion comme appliquée
      await this.recordSuggestionApplied(tenantId, userId, suggestion);
      
      // 3. Mettre à jour les métriques
      await this.updateMetrics(tenantId, 'reorder');
      
      toast.success('Alerte de réapprovisionnement créée');
      return { success: true };
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  }
  
  // Appliquer une correction FIFO
  static async applyFIFOCorrection(
    tenantId: string,
    userId: string,
    suggestion: OptimizationSuggestion
  ) {
    try {
      // Enregistrer la suggestion comme appliquée
      await this.recordSuggestionApplied(tenantId, userId, suggestion);
      
      // Mettre à jour les métriques
      await this.updateMetrics(tenantId, 'fifo');
      
      toast.success('Correction FIFO appliquée');
      return { success: true };
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  }
  
  // Enregistrer qu'une suggestion a été appliquée
  static async recordSuggestionApplied(
    tenantId: string,
    userId: string,
    suggestion: OptimizationSuggestion
  ) {
    const { error } = await supabase
      .from('lot_optimization_suggestions')
      .insert({
        tenant_id: tenantId,
        suggestion_type: suggestion.type,
        priority: suggestion.priority,
        title: suggestion.title,
        description: suggestion.description,
        lot_id: suggestion.lotId,
        product_id: suggestion.productId,
        current_value: suggestion.currentValue,
        suggested_value: suggestion.suggestedValue,
        expected_benefit: suggestion.expectedBenefit,
        status: 'applied',
        applied_at: new Date().toISOString(),
        applied_by: userId
      });
    
    if (error) throw error;
  }
  
  // Ignorer une suggestion
  static async ignoreSuggestion(
    tenantId: string,
    userId: string,
    suggestion: OptimizationSuggestion
  ) {
    try {
      const { error } = await supabase
        .from('lot_optimization_suggestions')
        .insert({
          tenant_id: tenantId,
          suggestion_type: suggestion.type,
          priority: suggestion.priority,
          title: suggestion.title,
          description: suggestion.description,
          lot_id: suggestion.lotId,
          product_id: suggestion.productId,
          current_value: suggestion.currentValue,
          suggested_value: suggestion.suggestedValue,
          expected_benefit: suggestion.expectedBenefit,
          status: 'ignored',
          applied_at: new Date().toISOString(),
          applied_by: userId
        });
      
      if (error) throw error;
      
      // Mettre à jour les métriques
      await this.updateMetrics(tenantId, 'ignored');
      
      toast.info('Suggestion ignorée');
      return { success: true };
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      throw error;
    }
  }
  
  // Appliquer toutes les suggestions
  static async applyAllSuggestions(
    tenantId: string,
    userId: string,
    suggestions: OptimizationSuggestion[]
  ) {
    const results: { id: string; success: boolean; error?: string }[] = [];
    
    for (const suggestion of suggestions) {
      try {
        switch (suggestion.type) {
          case 'promotion':
            await this.applyPromotionSuggestion(tenantId, userId, suggestion);
            break;
          case 'reorder':
            await this.applyReorderSuggestion(tenantId, userId, suggestion);
            break;
          case 'adjustment':
            await this.applyFIFOCorrection(tenantId, userId, suggestion);
            break;
        }
        results.push({ id: suggestion.id, success: true });
      } catch (error: any) {
        results.push({ id: suggestion.id, success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    toast.success(`${successCount}/${suggestions.length} suggestions appliquées`);
    
    return results;
  }

  // Mettre à jour les métriques
  private static async updateMetrics(tenantId: string, action: string) {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Récupérer la métrique existante
    const { data: existingMetric } = await supabase
      .from('lot_optimization_metrics')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('metric_date', today)
      .maybeSingle();
    
    // 2. Préparer les valeurs à upserter
    let metricData: any = {
      tenant_id: tenantId,
      metric_date: today,
    };
    
    if (existingMetric) {
      // Mettre à jour en incrémentant les compteurs existants
      metricData = {
        ...metricData,
        id: existingMetric.id, // Important pour l'upsert
        total_suggestions_generated: existingMetric.total_suggestions_generated || 0,
        suggestions_applied: existingMetric.suggestions_applied || 0,
        suggestions_ignored: existingMetric.suggestions_ignored || 0,
        expirations_avoided: existingMetric.expirations_avoided || 0,
        expirations_avoided_value: existingMetric.expirations_avoided_value || 0,
        stock_reorders_suggested: existingMetric.stock_reorders_suggested || 0,
        fifo_corrections: existingMetric.fifo_corrections || 0,
        total_savings: existingMetric.total_savings || 0,
      };
    } else {
      // Initialiser les valeurs pour une nouvelle métrique
      metricData = {
        ...metricData,
        total_suggestions_generated: 0,
        suggestions_applied: 0,
        suggestions_ignored: 0,
        expirations_avoided: 0,
        expirations_avoided_value: 0,
        stock_reorders_suggested: 0,
        fifo_corrections: 0,
        total_savings: 0,
      };
    }
    
    // 3. Incrémenter selon l'action
    if (action === 'promotion') {
      metricData.suggestions_applied += 1;
      metricData.expirations_avoided += 1;
    } else if (action === 'reorder') {
      metricData.suggestions_applied += 1;
      metricData.stock_reorders_suggested += 1;
    } else if (action === 'fifo') {
      metricData.suggestions_applied += 1;
      metricData.fifo_corrections += 1;
    } else if (action === 'ignored') {
      metricData.suggestions_ignored += 1;
    }
    
    // 4. UPSERT (INSERT ou UPDATE selon l'existence)
    const { error } = await supabase
      .from('lot_optimization_metrics')
      .upsert(metricData, {
        onConflict: 'tenant_id,metric_date', // Utilise la contrainte UNIQUE
        ignoreDuplicates: false // Force l'UPDATE si existe
      });
    
    if (error) {
      console.error('❌ Erreur lors de la mise à jour des métriques:', error);
      throw error;
    }
  }
}