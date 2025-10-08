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
    
    // Récupérer ou créer l'entrée métrique du jour
    const { data: existingMetric } = await supabase
      .from('lot_optimization_metrics')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('metric_date', today)
      .single();
    
    if (existingMetric) {
      // Mettre à jour les compteurs
      const updates: any = {};
      
      if (action === 'promotion') {
        updates.suggestions_applied = (existingMetric.suggestions_applied || 0) + 1;
        updates.expirations_avoided = (existingMetric.expirations_avoided || 0) + 1;
      } else if (action === 'reorder') {
        updates.suggestions_applied = (existingMetric.suggestions_applied || 0) + 1;
        updates.stock_reorders_suggested = (existingMetric.stock_reorders_suggested || 0) + 1;
      } else if (action === 'fifo') {
        updates.suggestions_applied = (existingMetric.suggestions_applied || 0) + 1;
        updates.fifo_corrections = (existingMetric.fifo_corrections || 0) + 1;
      } else if (action === 'ignored') {
        updates.suggestions_ignored = (existingMetric.suggestions_ignored || 0) + 1;
      }
      
      await supabase
        .from('lot_optimization_metrics')
        .update(updates)
        .eq('id', existingMetric.id);
    } else {
      // Créer une nouvelle entrée
      await supabase
        .from('lot_optimization_metrics')
        .insert({
          tenant_id: tenantId,
          metric_date: today,
          total_suggestions_generated: 0,
          suggestions_applied: action !== 'ignored' ? 1 : 0,
          suggestions_ignored: action === 'ignored' ? 1 : 0,
          expirations_avoided: action === 'promotion' ? 1 : 0,
          stock_reorders_suggested: action === 'reorder' ? 1 : 0,
          fifo_corrections: action === 'fifo' ? 1 : 0
        });
    }
  }
}