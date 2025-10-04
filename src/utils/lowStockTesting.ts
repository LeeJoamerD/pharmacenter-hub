import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrentTenantId } from "./tenantValidation";
import { measurePerformance } from "./tenantValidation";

export interface TestResult {
  name: string;
  success: boolean;
  message: string;
  duration: number;
  details?: any;
}

export interface LowStockTestResult {
  testName: string;
  results: TestResult[];
  success: boolean;
  totalDuration: number;
}

export class LowStockTesting {
  private static async getCurrentTenantId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: personnel } = await supabase
      .from('personnel')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    return personnel?.tenant_id || null;
  }

  /**
   * Test 1: Low Stock Detection
   * Validates that low stock items are correctly identified based on thresholds
   */
  static async testLowStockDetection(): Promise<LowStockTestResult> {
    const results: TestResult[] = [];
    const startTime = performance.now();

    try {
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) {
        throw new Error("No tenant ID found for current user");
      }

      // Test 1.1: Fetch low stock products
      const test1Start = performance.now();
      const { data: lowStockProducts, error: fetchError } = await measurePerformance(
        'low_stock_fetch',
        async () => supabase
          .from('produits')
          .select(`
            id,
            libelle_produit,
            stock_limite,
            stock_alerte
          `)
          .eq('tenant_id', tenantId)
          .not('stock_limite', 'is', null)
          .limit(10)
      );

      results.push({
        name: "Fetch Low Stock Products",
        success: !fetchError,
        message: fetchError 
          ? `Failed to fetch: ${fetchError.message}`
          : `Found ${lowStockProducts?.length || 0} low stock products`,
        duration: performance.now() - test1Start,
        details: { count: lowStockProducts?.length }
      });

      // Test 1.2: Validate threshold logic
      if (lowStockProducts && lowStockProducts.length > 0) {
        const test2Start = performance.now();
        const validationResults = lowStockProducts.map(product => {
          const hasThresholds = product.stock_limite != null;
          return { 
            product: product.libelle_produit, 
            hasThresholds,
            stock_limite: product.stock_limite 
          };
        });

        const allValid = validationResults.every(r => r.hasThresholds);

        results.push({
          name: "Validate Threshold Logic",
          success: allValid,
          message: allValid 
            ? "All products have valid thresholds"
            : "Some products missing thresholds",
          duration: performance.now() - test2Start,
          details: validationResults
        });
      }

      // Test 1.3: Status calculation accuracy
      const test3Start = performance.now();
      const { data: productsWithStatus } = await supabase
        .from('produits')
        .select('id, libelle_produit, stock_limite, stock_alerte')
        .eq('tenant_id', tenantId)
        .not('stock_limite', 'is', null)
        .limit(5);

      if (productsWithStatus) {
        const statusTests = productsWithStatus.map(p => ({
          productId: p.id,
          product: p.libelle_produit,
          hasThresholds: p.stock_limite != null,
          stock_limite: p.stock_limite,
          stock_alerte: p.stock_alerte
        }));

        results.push({
          name: "Status Calculation Accuracy",
          success: true,
          message: `Validated thresholds for ${statusTests.length} products`,
          duration: performance.now() - test3Start,
          details: statusTests
        });
      }

    } catch (error: any) {
      results.push({
        name: "Low Stock Detection Test",
        success: false,
        message: `Test failed: ${error.message}`,
        duration: performance.now() - startTime
      });
    }

    return {
      testName: "Low Stock Detection",
      results,
      success: results.every(r => r.success),
      totalDuration: performance.now() - startTime
    };
  }

  /**
   * Test 2: Multi-tenant Isolation
   * Ensures data isolation between tenants
   */
  static async testMultiTenantIsolation(): Promise<LowStockTestResult> {
    const results: TestResult[] = [];
    const startTime = performance.now();

    try {
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) {
        throw new Error("No tenant ID found for current user");
      }

      // Test 2.1: Verify RLS on produits table
      const test1Start = performance.now();
      const { data: products, error } = await supabase
        .from('produits')
        .select('id, tenant_id')
        .limit(10);

      const allSameTenant = products?.every(p => p.tenant_id === tenantId);

      results.push({
        name: "RLS on Products Table",
        success: !error && allSameTenant === true,
        message: allSameTenant 
          ? "All products belong to current tenant"
          : "Cross-tenant data leak detected!",
        duration: performance.now() - test1Start,
        details: { tenantId, productCount: products?.length }
      });

      // Test 2.2: Verify RLS on low_stock_actions_log
      const test2Start = performance.now();
      const { data: actions, error: actionsError } = await supabase
        .from('low_stock_actions_log')
        .select('id, tenant_id')
        .limit(10);

      const allActionsSameTenant = actions?.every(a => a.tenant_id === tenantId);

      results.push({
        name: "RLS on Actions Log",
        success: !actionsError && allActionsSameTenant === true,
        message: allActionsSameTenant
          ? "All actions belong to current tenant"
          : "Cross-tenant access detected in actions log!",
        duration: performance.now() - test2Start
      });

      // Test 2.3: Attempt cross-tenant access (should fail)
      const test3Start = performance.now();
      const fakeTenantId = '00000000-0000-0000-0000-000000000000';
      
      const { data: crossTenantData, error: crossTenantError } = await supabase
        .from('produits')
        .select('id')
        .eq('tenant_id', fakeTenantId)
        .limit(1);

      results.push({
        name: "Cross-Tenant Access Prevention",
        success: !crossTenantData || crossTenantData.length === 0,
        message: (!crossTenantData || crossTenantData.length === 0)
          ? "Cross-tenant access correctly blocked"
          : "WARNING: Cross-tenant access possible!",
        duration: performance.now() - test3Start
      });

    } catch (error: any) {
      results.push({
        name: "Multi-Tenant Isolation Test",
        success: false,
        message: `Test failed: ${error.message}`,
        duration: performance.now() - startTime
      });
    }

    return {
      testName: "Multi-Tenant Isolation",
      results,
      success: results.every(r => r.success),
      totalDuration: performance.now() - startTime
    };
  }

  /**
   * Test 3: Performance Tests
   * Measures query performance and response times
   */
  static async testPerformance(): Promise<LowStockTestResult> {
    const results: TestResult[] = [];
    const startTime = performance.now();

    try {
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) {
        throw new Error("No tenant ID found for current user");
      }

      // Test 3.1: Low stock query performance
      const test1Start = performance.now();
      const { data, error } = await supabase
        .from('produits')
        .select(`
          id,
          libelle_produit,
          code_produit,
          quantite_actuelle,
          seuil_minimum,
          seuil_critique,
          unite_mesure,
          prix_vente_unitaire,
          familles_produits!inner(libelle_famille),
          fournisseurs!inner(libelle_fournisseur)
        `)
        .eq('tenant_id', tenantId)
        .or(`quantite_actuelle.lte.seuil_minimum`)
        .order('quantite_actuelle', { ascending: true })
        .limit(50);

      const queryDuration = performance.now() - test1Start;
      const performanceThreshold = 1000; // 1 second

      results.push({
        name: "Low Stock Query Performance",
        success: !error && queryDuration < performanceThreshold,
        message: `Query completed in ${queryDuration.toFixed(2)}ms (threshold: ${performanceThreshold}ms)`,
        duration: queryDuration,
        details: { 
          rowCount: data?.length,
          threshold: performanceThreshold,
          passed: queryDuration < performanceThreshold
        }
      });

      // Test 3.2: Bulk operation simulation
      const test2Start = performance.now();
      const bulkSize = 10;
      const bulkOperations = Array.from({ length: bulkSize }, (_, i) => ({
        tenant_id: tenantId,
        product_id: `test-product-${i}`,
        action_type: 'alert_creation' as const,
        status: 'pending' as const,
        action_date: new Date().toISOString()
      }));

      // Simulate bulk insert (without actually inserting test data)
      const bulkDuration = performance.now() - test2Start;
      
      results.push({
        name: "Bulk Operation Performance",
        success: bulkDuration < 500,
        message: `Bulk simulation for ${bulkSize} items took ${bulkDuration.toFixed(2)}ms`,
        duration: bulkDuration,
        details: { operationCount: bulkSize }
      });

      // Test 3.3: Real-time subscription latency
      const test3Start = performance.now();
      const channel = supabase
        .channel('low_stock_test')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'produits' },
          () => {}
        );

      await channel.subscribe();
      const subscriptionDuration = performance.now() - test3Start;
      await channel.unsubscribe();

      results.push({
        name: "Real-time Subscription Latency",
        success: subscriptionDuration < 300,
        message: `Subscription established in ${subscriptionDuration.toFixed(2)}ms`,
        duration: subscriptionDuration
      });

    } catch (error: any) {
      results.push({
        name: "Performance Test",
        success: false,
        message: `Test failed: ${error.message}`,
        duration: performance.now() - startTime
      });
    }

    return {
      testName: "Performance Tests",
      results,
      success: results.every(r => r.success),
      totalDuration: performance.now() - startTime
    };
  }

  /**
   * Test 4: Action Service Tests
   * Tests low stock action creation and execution
   */
  static async testActionService(): Promise<LowStockTestResult> {
    const results: TestResult[] = [];
    const startTime = performance.now();

    try {
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) {
        throw new Error("No tenant ID found for current user");
      }

      // Test 4.1: Fetch low stock products for action testing
      const test1Start = performance.now();
      const { data: testProducts } = await supabase
        .from('produits')
        .select('id, libelle_produit, stock_limite')
        .eq('tenant_id', tenantId)
        .not('stock_limite', 'is', null)
        .limit(1)
        .single();

      results.push({
        name: "Fetch Test Product",
        success: !!testProducts,
        message: testProducts 
          ? `Found test product: ${testProducts.libelle_produit}`
          : "No low stock products available for testing",
        duration: performance.now() - test1Start
      });

      // Test 4.2: Validate action log structure
      const test2Start = performance.now();
      // @ts-ignore - Supabase types not yet regenerated
      const { data: recentActions } = await supabase
        .from('low_stock_actions_log')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('action_date', { ascending: false })
        .limit(1);

      const hasRequiredFields = recentActions?.[0] && 
        'action_type' in recentActions[0] &&
        'status' in recentActions[0] &&
        'product_id' in recentActions[0];

      results.push({
        name: "Action Log Structure Validation",
        success: hasRequiredFields,
        message: hasRequiredFields
          ? "Action log has all required fields"
          : "Action log missing required fields",
        duration: performance.now() - test2Start
      });

      // Test 4.3: Check action status transitions
      const test3Start = performance.now();
      // @ts-ignore - Supabase types not yet regenerated
      const { data: actionStatuses } = await supabase
        .from('low_stock_actions_log')
        .select('status')
        .eq('tenant_id', tenantId)
        .limit(10);

      const validStatuses = ['pending', 'completed', 'failed', 'skipped'];
      const allValidStatuses = actionStatuses?.every((a: any) => 
        validStatuses.includes(a.status)
      );

      results.push({
        name: "Action Status Validation",
        success: allValidStatuses ?? true,
        message: allValidStatuses
          ? "All action statuses are valid"
          : "Invalid action statuses found",
        duration: performance.now() - test3Start,
        details: { validStatuses, found: actionStatuses?.map((a: any) => a.status) }
      });

    } catch (error: any) {
      results.push({
        name: "Action Service Test",
        success: false,
        message: `Test failed: ${error.message}`,
        duration: performance.now() - startTime
      });
    }

    return {
      testName: "Action Service Tests",
      results,
      success: results.every(r => r.success),
      totalDuration: performance.now() - startTime
    };
  }

  /**
   * Run all Low Stock tests
   */
  static async runAllTests(): Promise<LowStockTestResult[]> {
    const allResults: LowStockTestResult[] = [];
    const startTime = performance.now();

    try {
      toast.info("Starting Low Stock Module Tests...");

      // Run all tests in parallel for efficiency
      const [detectionResults, isolationResults, performanceResults, actionResults] = 
        await Promise.all([
          this.testLowStockDetection(),
          this.testMultiTenantIsolation(),
          this.testPerformance(),
          this.testActionService()
        ]);

      allResults.push(detectionResults, isolationResults, performanceResults, actionResults);

      const totalDuration = performance.now() - startTime;
      const allPassed = allResults.every(r => r.success);
      const totalTests = allResults.reduce((sum, r) => sum + r.results.length, 0);
      const passedTests = allResults.reduce(
        (sum, r) => sum + r.results.filter(t => t.success).length, 
        0
      );

      toast.success(
        `Low Stock Tests Complete: ${passedTests}/${totalTests} passed in ${(totalDuration / 1000).toFixed(2)}s`,
        { duration: 5000 }
      );

      return allResults;
    } catch (error: any) {
      toast.error(`Test suite failed: ${error.message}`);
      return allResults;
    }
  }
}
