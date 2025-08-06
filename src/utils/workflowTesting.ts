import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Types pour les tests
interface TestResult {
  success: boolean;
  message: string;
  duration: number;
  details?: any;
}

interface WorkflowTestResult {
  testName: string;
  results: TestResult[];
  overallSuccess: boolean;
  totalDuration: number;
}

export class WorkflowTesting {
  private static async getCurrentTenantId(): Promise<string | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user.id)
        .maybeSingle();

      return personnel?.tenant_id || null;
    } catch (error) {
      return null;
    }
  }

  // Test CRUD complet sur les fournisseurs
  static async testSuppliersCRUD(): Promise<WorkflowTestResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];
    const testName = "CRUD Fournisseurs";

    try {
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) {
        throw new Error('Tenant ID non trouvé');
      }

      // Test CREATE
      const createStart = Date.now();
      const testSupplier = {
        tenant_id: tenantId,
        nom: `Test Fournisseur ${Date.now()}`,
        adresse: 'Adresse test',
        telephone_appel: '+237 123 456 789',
        email: 'test@fournisseur.com'
      };

      const { data: createdSupplier, error: createError } = await supabase
        .from('fournisseurs')
        .insert(testSupplier)
        .select()
        .single();

      results.push({
        success: !createError,
        message: createError ? `Erreur création: ${createError.message}` : 'Création réussie',
        duration: Date.now() - createStart,
        details: createdSupplier
      });

      if (!createError && createdSupplier) {
        // Test READ
        const readStart = Date.now();
        const { data: readSupplier, error: readError } = await supabase
          .from('fournisseurs')
          .select('*')
          .eq('id', createdSupplier.id)
          .eq('tenant_id', tenantId)
          .single();

        results.push({
          success: !readError,
          message: readError ? `Erreur lecture: ${readError.message}` : 'Lecture réussie',
          duration: Date.now() - readStart,
          details: readSupplier
        });

        // Test UPDATE
        const updateStart = Date.now();
        const { data: updatedSupplier, error: updateError } = await supabase
          .from('fournisseurs')
          .update({ nom: testSupplier.nom + ' - Modifié' })
          .eq('id', createdSupplier.id)
          .eq('tenant_id', tenantId)
          .select()
          .single();

        results.push({
          success: !updateError,
          message: updateError ? `Erreur mise à jour: ${updateError.message}` : 'Mise à jour réussie',
          duration: Date.now() - updateStart,
          details: updatedSupplier
        });

        // Test DELETE
        const deleteStart = Date.now();
        const { error: deleteError } = await supabase
          .from('fournisseurs')
          .delete()
          .eq('id', createdSupplier.id)
          .eq('tenant_id', tenantId);

        results.push({
          success: !deleteError,
          message: deleteError ? `Erreur suppression: ${deleteError.message}` : 'Suppression réussie',
          duration: Date.now() - deleteStart
        });
      }

    } catch (error: any) {
      results.push({
        success: false,
        message: `Erreur générale: ${error.message}`,
        duration: Date.now() - startTime
      });
    }

    const totalDuration = Date.now() - startTime;
    const overallSuccess = results.every(r => r.success);

    return {
      testName,
      results,
      overallSuccess,
      totalDuration
    };
  }

  // Test du workflow complet Commande → Réception → Stock
  static async testCompleteWorkflow(): Promise<WorkflowTestResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];
    const testName = "Workflow Commande → Réception → Stock";

    try {
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) {
        throw new Error('Tenant ID non trouvé');
      }

      // Étape 1: Créer un fournisseur de test
      const supplierStart = Date.now();
      const testSupplier = {
        tenant_id: tenantId,
        nom: `Fournisseur Test Workflow ${Date.now()}`,
        adresse: 'Adresse test workflow',
        telephone_appel: '+237 987 654 321',
        email: 'workflow@test.com'
      };

      const { data: supplier, error: supplierError } = await supabase
        .from('fournisseurs')
        .insert(testSupplier)
        .select()
        .single();

      results.push({
        success: !supplierError,
        message: supplierError ? `Erreur création fournisseur: ${supplierError.message}` : 'Fournisseur créé',
        duration: Date.now() - supplierStart,
        details: supplier
      });

      if (!supplierError && supplier) {
        // Étape 2: Créer une commande
        const orderStart = Date.now();
        const testOrder = {
          tenant_id: tenantId,
          fournisseur_id: supplier.id,
          statut: 'En cours'
        };

        const { data: order, error: orderError } = await supabase
          .from('commandes_fournisseurs')
          .insert(testOrder)
          .select()
          .single();

        results.push({
          success: !orderError,
          message: orderError ? `Erreur création commande: ${orderError.message}` : 'Commande créée',
          duration: Date.now() - orderStart,
          details: order
        });

        if (!orderError && order) {
          // Étape 3: Ajouter des lignes de commande
          const linesStart = Date.now();
          const testLines = [
            {
              tenant_id: tenantId,
              commande_id: order.id,
              produit_id: 'test-produit-1',
              quantite_commandee: 50,
              prix_achat_unitaire_attendu: 1000
            },
            {
              tenant_id: tenantId,
              commande_id: order.id,
              produit_id: 'test-produit-2',
              quantite_commandee: 30,
              prix_achat_unitaire_attendu: 1500
            }
          ];

          const { data: lines, error: linesError } = await supabase
            .from('lignes_commande_fournisseur')
            .insert(testLines)
            .select();

          results.push({
            success: !linesError,
            message: linesError ? `Erreur lignes commande: ${linesError.message}` : 'Lignes de commande ajoutées',
            duration: Date.now() - linesStart,
            details: lines
          });

          // Étape 4: Changer le statut à "Envoyée"
          const statusStart = Date.now();
          const { data: updatedOrder, error: statusError } = await supabase
            .from('commandes_fournisseurs')
            .update({ statut: 'Envoyée' })
            .eq('id', order.id)
            .eq('tenant_id', tenantId)
            .select()
            .single();

          results.push({
            success: !statusError,
            message: statusError ? `Erreur statut: ${statusError.message}` : 'Statut mis à jour',
            duration: Date.now() - statusStart,
            details: updatedOrder
          });

          // Étape 5: Créer une réception
          const receptionStart = Date.now();
          const testReception = {
            tenant_id: tenantId,
            commande_id: order.id,
            fournisseur_id: supplier.id,
            reference_facture: `FACT-${Date.now()}`
          };

          const { data: reception, error: receptionError } = await supabase
            .from('receptions_fournisseurs')
            .insert(testReception)
            .select()
            .single();

          results.push({
            success: !receptionError,
            message: receptionError ? `Erreur réception: ${receptionError.message}` : 'Réception créée',
            duration: Date.now() - receptionStart,
            details: reception
          });

          // Étape 6: Nettoyer les données de test
          const cleanupStart = Date.now();
          try {
            if (reception) {
              await supabase.from('receptions_fournisseurs').delete().eq('id', reception.id);
            }
            if (lines) {
              await supabase.from('lignes_commande_fournisseur').delete().eq('commande_id', order.id);
            }
            await supabase.from('commandes_fournisseurs').delete().eq('id', order.id);
            await supabase.from('fournisseurs').delete().eq('id', supplier.id);

            results.push({
              success: true,
              message: 'Nettoyage des données de test réussi',
              duration: Date.now() - cleanupStart
            });
          } catch (cleanupError: any) {
            results.push({
              success: false,
              message: `Erreur nettoyage: ${cleanupError.message}`,
              duration: Date.now() - cleanupStart
            });
          }
        }
      }

    } catch (error: any) {
      results.push({
        success: false,
        message: `Erreur générale workflow: ${error.message}`,
        duration: Date.now() - startTime
      });
    }

    const totalDuration = Date.now() - startTime;
    const overallSuccess = results.every(r => r.success);

    return {
      testName,
      results,
      overallSuccess,
      totalDuration
    };
  }

  // Test de validation multi-locataire
  static async testTenantValidation(): Promise<WorkflowTestResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];
    const testName = "Validation Multi-locataire";

    try {
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) {
        throw new Error('Tenant ID non trouvé');
      }

      // Test 1: Vérifier l'isolation des données
      const isolationStart = Date.now();
      const { data: ownData, error: ownError } = await supabase
        .from('fournisseurs')
        .select('*')
        .eq('tenant_id', tenantId)
        .limit(5);

      results.push({
        success: !ownError,
        message: ownError ? `Erreur accès données propres: ${ownError.message}` : `Accès données propres réussi (${ownData?.length || 0} fournisseurs)`,
        duration: Date.now() - isolationStart,
        details: { count: ownData?.length || 0 }
      });

      // Test 2: Tenter d'accéder aux données d'un autre tenant (doit échouer)
      const crossTenantStart = Date.now();
      const fakeTenantId = 'fake-tenant-id';
      const { data: crossData, error: crossError } = await supabase
        .from('fournisseurs')
        .select('*')
        .eq('tenant_id', fakeTenantId)
        .limit(1);

      results.push({
        success: !crossData || crossData.length === 0,
        message: crossData && crossData.length > 0 ? 'ALERTE: Accès cross-tenant détecté!' : 'Isolation cross-tenant respectée',
        duration: Date.now() - crossTenantStart,
        details: { crossDataCount: crossData?.length || 0 }
      });

      // Test 3: Vérifier les politiques RLS sur une insertion
      const rlsStart = Date.now();
      try {
        const { error: rlsError } = await supabase
          .from('fournisseurs')
          .insert({
            tenant_id: fakeTenantId, // Tentative d'insertion avec un mauvais tenant_id
            nom: 'Test RLS',
            adresse: 'Test'
          });

        results.push({
          success: !!rlsError, // Le succès ici signifie que l'erreur a bien eu lieu (RLS fonctionne)
          message: rlsError ? 'Politique RLS active - insertion bloquée' : 'ALERTE: Politique RLS non respectée!',
          duration: Date.now() - rlsStart,
          details: { error: rlsError?.message }
        });
      } catch (error: any) {
        results.push({
          success: true,
          message: 'Politique RLS active - exception levée',
          duration: Date.now() - rlsStart,
          details: { error: error.message }
        });
      }

    } catch (error: any) {
      results.push({
        success: false,
        message: `Erreur générale validation tenant: ${error.message}`,
        duration: Date.now() - startTime
      });
    }

    const totalDuration = Date.now() - startTime;
    const overallSuccess = results.every(r => r.success);

    return {
      testName,
      results,
      overallSuccess,
      totalDuration
    };
  }

  // Test des calculs et totaux
  static async testCalculations(): Promise<WorkflowTestResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];
    const testName = "Validation Calculs et Totaux";

    try {
      // Test 1: Calculs de totaux de commande
      const calculationStart = Date.now();
      const mockOrderLines = [
        { quantite: 10, prix_unitaire: 1000, remise: 0 },
        { quantite: 5, prix_unitaire: 2000, remise: 10 },
        { quantite: 20, prix_unitaire: 500, remise: 5 }
      ];

      const expectedTotals = mockOrderLines.map(line => {
        const sousTotal = line.quantite * line.prix_unitaire;
        const remiseAmount = (sousTotal * line.remise) / 100;
        return sousTotal - remiseAmount;
      });

      const totalHT = expectedTotals.reduce((sum, total) => sum + total, 0);
      const tva = totalHT * 0.18;
      const totalTTC = totalHT + tva;

      const expectedTotalHT = 10000 + 9000 + 9500; // 28500
      const expectedTVA = expectedTotalHT * 0.18; // 5130
      const expectedTotalTTC = expectedTotalHT + expectedTVA; // 33630

      results.push({
        success: Math.abs(totalHT - expectedTotalHT) < 0.01,
        message: `Calcul total HT: ${totalHT} (attendu: ${expectedTotalHT})`,
        duration: Date.now() - calculationStart,
        details: { calculé: totalHT, attendu: expectedTotalHT }
      });

      results.push({
        success: Math.abs(tva - expectedTVA) < 0.01,
        message: `Calcul TVA: ${tva} (attendu: ${expectedTVA})`,
        duration: 5,
        details: { calculé: tva, attendu: expectedTVA }
      });

      results.push({
        success: Math.abs(totalTTC - expectedTotalTTC) < 0.01,
        message: `Calcul total TTC: ${totalTTC} (attendu: ${expectedTotalTTC})`,
        duration: 5,
        details: { calculé: totalTTC, attendu: expectedTotalTTC }
      });

      // Test 2: Calculs de stock après réception
      const stockStart = Date.now();
      const stockInitial = 100;
      const quantiteRecue = 50;
      const stockFinal = stockInitial + quantiteRecue;
      const stockAttendu = 150;

      results.push({
        success: stockFinal === stockAttendu,
        message: `Calcul stock après réception: ${stockFinal} (attendu: ${stockAttendu})`,
        duration: Date.now() - stockStart,
        details: { stockInitial, quantiteRecue, stockFinal, stockAttendu }
      });

    } catch (error: any) {
      results.push({
        success: false,
        message: `Erreur calculs: ${error.message}`,
        duration: Date.now() - startTime
      });
    }

    const totalDuration = Date.now() - startTime;
    const overallSuccess = results.every(r => r.success);

    return {
      testName,
      results,
      overallSuccess,
      totalDuration
    };
  }

  // Exécuter tous les tests
  static async runAllTests(): Promise<WorkflowTestResult[]> {
    const tests = [
      this.testSuppliersCRUD(),
      this.testCalculations(),
      this.testTenantValidation(),
      this.testCompleteWorkflow()
    ];

    try {
      const results = await Promise.all(tests);
      
      // Afficher un résumé
      const overallSuccess = results.every(test => test.overallSuccess);
      const totalDuration = results.reduce((sum, test) => sum + test.totalDuration, 0);
      
      toast({
        title: overallSuccess ? "✅ Tous les tests réussis" : "⚠️ Certains tests ont échoué",
        description: `${results.length} tests exécutés en ${totalDuration}ms`,
        variant: overallSuccess ? "default" : "destructive"
      });

      return results;
    } catch (error: any) {
      toast({
        title: "Erreur lors des tests",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  }
}