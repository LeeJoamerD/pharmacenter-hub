import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Download, Loader2, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";

interface GlobalPlanInfo {
  plan_id: string;
  plan_code: string;
  plan_nom: string;
  plan_version: string;
  comptes_count: number;
  classes_count: number;
}

export function ImportGlobalAccountingPlanButton() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Récupérer le plan global correspondant à la config du tenant
  const { data: globalPlan, isLoading: isLoadingPlan } = useQuery({
    queryKey: ['matching-global-plan', tenantId],
    queryFn: async (): Promise<GlobalPlanInfo | null> => {
      if (!tenantId) return null;
      
      const { data, error } = await supabase
        .rpc('get_matching_global_plan', { p_tenant_id: tenantId });
      
      if (error) {
        console.error('Erreur récupération plan global:', error);
        return null;
      }
      
      if (!data || data.length === 0) return null;
      
      const plan = data[0];
      return {
        plan_id: plan.plan_id,
        plan_code: plan.plan_code,
        plan_nom: plan.plan_nom,
        plan_version: plan.plan_version,
        comptes_count: Number(plan.comptes_count),
        classes_count: Number(plan.classes_count)
      };
    },
    enabled: !!tenantId,
  });

  const handleImport = async () => {
    if (!tenantId || !globalPlan) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'importer le plan comptable',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsImporting(true);
      
      const { data, error } = await supabase
        .rpc('import_global_accounting_plan', {
          p_tenant_id: tenantId,
          p_plan_global_id: globalPlan.plan_id
        });
      
      if (error) throw error;
      
      const result = data as { 
        success: boolean; 
        error?: string; 
        plan_code?: string;
        plan_nom?: string;
        comptes_importes?: number;
        classes_count?: number;
      };
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'importation');
      }
      
      // Invalider les queries pour rafraîchir les données
      await queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['coa-regional-params'] });
      await queryClient.invalidateQueries({ queryKey: ['account-hierarchy'] });
      
      toast({
        title: 'Importation réussie',
        description: `${result.comptes_importes} comptes importés depuis le plan ${result.plan_nom}`,
      });
      
      setShowConfirmDialog(false);
    } catch (error: any) {
      console.error('Erreur importation plan comptable:', error);
      toast({
        title: 'Erreur d\'importation',
        description: error.message || 'Une erreur est survenue lors de l\'importation',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoadingPlan) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Chargement...
      </Button>
    );
  }

  if (!globalPlan) {
    return (
      <Button variant="outline" disabled title="Aucun plan comptable global disponible">
        <Download className="mr-2 h-4 w-4" />
        Plan non disponible
      </Button>
    );
  }

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setShowConfirmDialog(true)}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Importer Plan SYSCOHADA
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Importer le Plan Comptable
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Vous êtes sur le point d'importer le plan comptable global vers votre pharmacie.
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Plan :</span>
                    <Badge variant="secondary">{globalPlan.plan_nom}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Version :</span>
                    <span className="font-medium">{globalPlan.plan_version}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Comptes :</span>
                    <span className="font-medium">{globalPlan.comptes_count.toLocaleString()} comptes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Classes :</span>
                    <span className="font-medium">{globalPlan.classes_count} classes comptables</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong>Attention :</strong> Cette action remplacera tous vos comptes existants 
                    par le plan comptable standard. Cette opération est irréversible.
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isImporting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImport}
              disabled={isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importation...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Confirmer l'import
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}