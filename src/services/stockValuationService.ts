import { supabase } from '@/integrations/supabase/client';
import { StockSettings } from '@/hooks/useStockSettings';

export interface ValuationResult {
  productId: string;
  averageCost: number;
  totalValue: number;
  totalQuantity: number;
  lots: Array<{
    id: string;
    quantity: number;
    unitCost: number;
    value: number;
    date: string;
  }>;
}

export class StockValuationService {
  /**
   * Calculate stock valuation based on configured method
   */
  static async calculateValuation(
    productId: string, 
    settings: StockSettings
  ): Promise<ValuationResult> {
    const lots = await this.getProductLots(productId);
    
    switch (settings.valuation_method) {
      case 'FIFO':
        return this.calculateFIFO(productId, lots, settings);
      case 'LIFO':
        return this.calculateLIFO(productId, lots, settings);
      case 'PMP':
      case 'CUMP':
        return this.calculateWeightedAverage(productId, lots, settings);
      default:
        return this.calculateFIFO(productId, lots, settings);
    }
  }

  /**
   * Get all lots for a product with available stock
   */
  private static async getProductLots(productId: string) {
    const { data: lots, error } = await supabase
      .from('lots')
      .select('*')
      .eq('produit_id', productId)
      .gt('quantite_restante', 0)
      .order('date_reception');

    if (error) throw error;
    return lots || [];
  }

  /**
   * FIFO (First In, First Out) valuation
   */
  private static calculateFIFO(
    productId: string, 
    lots: any[], 
    settings: StockSettings
  ): ValuationResult {
    const orderedLots = [...lots].sort((a, b) => 
      new Date(a.date_reception).getTime() - new Date(b.date_reception).getTime()
    );

    return this.calculateValuationFromLots(productId, orderedLots, settings);
  }

  /**
   * LIFO (Last In, First Out) valuation
   */
  private static calculateLIFO(
    productId: string, 
    lots: any[], 
    settings: StockSettings
  ): ValuationResult {
    const orderedLots = [...lots].sort((a, b) => 
      new Date(b.date_reception).getTime() - new Date(a.date_reception).getTime()
    );

    return this.calculateValuationFromLots(productId, orderedLots, settings);
  }

  /**
   * Weighted Average Cost valuation
   */
  private static calculateWeightedAverage(
    productId: string, 
    lots: any[], 
    settings: StockSettings
  ): ValuationResult {
    const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantite_restante, 0);
    const totalValue = lots.reduce((sum, lot) => 
      sum + (lot.quantite_restante * lot.prix_achat_unitaire), 0
    );
    
    const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
    const roundedCost = this.roundValue(averageCost, settings.rounding_precision);

    const valuedLots = lots.map(lot => ({
      id: lot.id,
      quantity: lot.quantite_restante,
      unitCost: roundedCost,
      value: this.roundValue(lot.quantite_restante * roundedCost, settings.rounding_precision),
      date: lot.date_reception
    }));

    return {
      productId,
      averageCost: roundedCost,
      totalValue: this.roundValue(totalValue, settings.rounding_precision),
      totalQuantity,
      lots: valuedLots
    };
  }

  /**
   * Calculate valuation from ordered lots
   */
  private static calculateValuationFromLots(
    productId: string, 
    lots: any[], 
    settings: StockSettings
  ): ValuationResult {
    const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantite_restante, 0);
    const totalValue = lots.reduce((sum, lot) => 
      sum + (lot.quantite_restante * lot.prix_achat_unitaire), 0
    );

    const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
    const roundedCost = this.roundValue(averageCost, settings.rounding_precision);

    const valuedLots = lots.map(lot => ({
      id: lot.id,
      quantity: lot.quantite_restante,
      unitCost: this.roundValue(lot.prix_achat_unitaire, settings.rounding_precision),
      value: this.roundValue(lot.quantite_restante * lot.prix_achat_unitaire, settings.rounding_precision),
      date: lot.date_reception
    }));

    return {
      productId,
      averageCost: roundedCost,
      totalValue: this.roundValue(totalValue, settings.rounding_precision),
      totalQuantity,
      lots: valuedLots
    };
  }

  /**
   * Round value based on precision setting
   */
  private static roundValue(value: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  /**
   * Calculate reorder point based on settings and historical data
   */
  static async calculateReorderPoint(
    productId: string, 
    settings: StockSettings
  ): Promise<number> {
    // Get average daily consumption over the last 90 days
    const { data: movements, error } = await supabase
      .from('stock_mouvements')
      .select('quantite, date_mouvement')
      .eq('produit_id', productId)
      .eq('type_mouvement', 'sortie')
      .gte('date_mouvement', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('date_mouvement', { ascending: false });

    if (error || !movements || movements.length === 0) {
      return settings.reorder_point_days; // Fallback to static setting
    }

    const totalConsumption = movements.reduce((sum, mov) => sum + Math.abs(mov.quantite), 0);
    const averageDailyConsumption = totalConsumption / 90;

    // Reorder point = (Average daily consumption × Lead time) + Safety stock
    const leadTimeDemand = averageDailyConsumption * settings.reorder_point_days;
    const safetyStock = leadTimeDemand * (settings.safety_stock_percentage / 100);

    return Math.ceil(leadTimeDemand + safetyStock);
  }

  /**
   * Calculate optimal order quantity based on settings
   */
  static async calculateOptimalOrderQuantity(
    productId: string, 
    settings: StockSettings
  ): Promise<number> {
    const reorderPoint = await this.calculateReorderPoint(productId, settings);
    const maxStockDays = settings.maximum_stock_days;
    const minStockDays = settings.minimum_stock_days;

    // Simple Economic Order Quantity approximation
    const optimalDays = Math.sqrt(maxStockDays * minStockDays);
    
    // Get average daily consumption
    const { data: movements } = await supabase
      .from('stock_mouvements')
      .select('quantite')
      .eq('produit_id', productId)
      .eq('type_mouvement', 'sortie')
      .gte('date_mouvement', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!movements || movements.length === 0) {
      return Math.ceil(reorderPoint * 2); // Fallback
    }

    const totalConsumption = movements.reduce((sum, mov) => sum + Math.abs(mov.quantite), 0);
    const averageDailyConsumption = totalConsumption / 30;

    return Math.ceil(averageDailyConsumption * optimalDays);
  }
}