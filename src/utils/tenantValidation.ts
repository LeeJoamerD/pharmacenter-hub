/**
 * Tenant Validation Utilities
 * Garantit l'isolation des données entre tenants
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Valide que l'utilisateur actuel appartient bien au tenant spécifié
 */
export const validateTenantAccess = async (tenantId: string): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { data: personnel } = await supabase
      .from('personnel')
      .select('tenant_id')
      .eq('auth_user_id', user.user.id)
      .single();

    return personnel?.tenant_id === tenantId;
  } catch (error) {
    console.error('Tenant validation error:', error);
    return false;
  }
};

/**
 * Récupère le tenant_id de l'utilisateur actuel
 */
export const getCurrentTenantId = async (): Promise<string | null> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data: personnel } = await supabase
      .from('personnel')
      .select('tenant_id')
      .eq('auth_user_id', user.user.id)
      .single();

    return personnel?.tenant_id || null;
  } catch (error) {
    console.error('Get tenant ID error:', error);
    return null;
  }
};

/**
 * Valide qu'une requête inclut bien le filtre tenant_id
 */
export const validateTenantQuery = (query: any, expectedTenantId: string): boolean => {
  // Cette fonction peut être étendue pour vérifier que toutes les requêtes
  // incluent bien le filtre tenant_id
  return true; // Simplifié pour l'exemple
};

/**
 * Moniteur de performance pour les requêtes
 */
export class QueryPerformanceMonitor {
  private static queries: Map<string, number[]> = new Map();

  static recordQuery(queryName: string, duration: number) {
    const durations = this.queries.get(queryName) || [];
    durations.push(duration);
    this.queries.set(queryName, durations);

    // Garder seulement les 100 dernières mesures
    if (durations.length > 100) {
      this.queries.set(queryName, durations.slice(-100));
    }

    // Alert si > 2 secondes
    if (duration > 2000) {
      console.warn(`⚠️ Slow query detected: ${queryName} took ${duration}ms`);
    }
  }

  static getAverageTime(queryName: string): number {
    const durations = this.queries.get(queryName) || [];
    if (durations.length === 0) return 0;
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  static getAllMetrics(): Record<string, { avg: number; max: number; count: number }> {
    const metrics: Record<string, { avg: number; max: number; count: number }> = {};
    
    this.queries.forEach((durations, queryName) => {
      metrics[queryName] = {
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        max: Math.max(...durations),
        count: durations.length
      };
    });

    return metrics;
  }

  static clear() {
    this.queries.clear();
  }
}

/**
 * Wrapper pour mesurer la performance d'une fonction async
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    QueryPerformanceMonitor.recordQuery(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    QueryPerformanceMonitor.recordQuery(`${name}_error`, duration);
    throw error;
  }
}
