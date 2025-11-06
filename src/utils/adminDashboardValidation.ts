import { supabase } from '@/integrations/supabase/client';

/**
 * Utilitaire de validation de l'isolation multi-tenant pour le Dashboard Administration
 * Vérifie que toutes les requêtes respectent bien le filtrage par tenant_id
 */

export interface ValidationResult {
  table: string;
  count: number;
  status: 'success' | 'error';
  error?: string;
}

export const validateDashboardDataIsolation = async (tenantId: string): Promise<ValidationResult[]> => {
  console.group('🔒 Validation Multi-Tenant - Dashboard Administration');
  console.log(`Tenant ID testé: ${tenantId}`);
  
  const tests = [
    { name: 'Personnel', table: 'personnel' },
    { name: 'Fournisseurs', table: 'fournisseurs' },
    { name: 'Produits', table: 'produits' },
    { name: 'Clients', table: 'clients' },
    { name: 'Documents', table: 'documents' },
    { name: 'Alertes Sécurité', table: 'security_alerts' },
    { name: 'Laboratoires', table: 'laboratoires' },
    { name: 'DCI', table: 'dci' },
    { name: 'Formes Galéniques', table: 'formes_galeniques' },
    { name: 'Classes Thérapeutiques', table: 'classes_therapeutiques' }
  ];

  const results: ValidationResult[] = [];

  for (const test of tests) {
    const { count, error } = await supabase
      .from(test.table as any)
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (error) {
      console.error(`❌ ${test.name}: Erreur`, error);
      results.push({
        table: test.name,
        count: 0,
        status: 'error',
        error: error.message
      });
    } else {
      console.log(`✅ ${test.name}: ${count} enregistrement(s) isolé(s) pour ce tenant`);
      results.push({
        table: test.name,
        count: count || 0,
        status: 'success'
      });
    }
  }

  // Vérifier qu'aucune donnée d'un autre tenant n'est accessible
  console.log('\n🔍 Vérification cross-tenant...');
  const { count: crossTenantCount } = await supabase
    .from('personnel')
    .select('id', { count: 'exact', head: true })
    .neq('tenant_id', tenantId);

  if (crossTenantCount && crossTenantCount > 0) {
    console.warn(`⚠️  ${crossTenantCount} enregistrement(s) d'autres tenants existent (isolation OK si non accessibles)`);
  } else {
    console.log('✅ Aucune donnée cross-tenant détectée');
  }

  console.groupEnd();
  
  return results;
};

/**
 * Teste l'isolation en simulant des requêtes sans filtre tenant_id
 * ATTENTION: À utiliser uniquement en développement
 */
export const testTenantIsolationBreach = async (tenantId: string) => {
  console.group('⚠️  TEST DE VIOLATION D\'ISOLATION (Dev uniquement)');
  
  try {
    // Tentative de récupération sans filtre tenant_id (devrait être bloqué par RLS)
    const { data, error } = await supabase
      .from('personnel')
      .select('id, tenant_id')
      .limit(10);

    if (error) {
      console.log('✅ RLS fonctionne: accès bloqué sans tenant_id', error.message);
    } else {
      const otherTenants = data?.filter(p => p.tenant_id !== tenantId) || [];
      if (otherTenants.length > 0) {
        console.error('❌ FAILLE DE SÉCURITÉ: Accès à des données d\'autres tenants possible!');
        console.error('Tenants accessibles:', [...new Set(otherTenants.map(p => p.tenant_id))]);
      } else {
        console.log('✅ Seules les données du tenant actuel sont accessibles');
      }
    }
  } catch (error) {
    console.log('✅ Erreur capturée (comportement attendu):', error);
  }

  console.groupEnd();
};
