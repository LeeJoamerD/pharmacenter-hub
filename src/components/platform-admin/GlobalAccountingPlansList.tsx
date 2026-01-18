import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Globe, Calendar, Building, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GlobalAccountingPlansListProps {
  onSelectPlan: (planId: string) => void;
}

interface PlanComptableGlobal {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  version: string | null;
  zone_geographique: string | null;
  organisme_normalisation: string | null;
  reference_reglementaire: string | null;
  devise_principale: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const GlobalAccountingPlansList: React.FC<GlobalAccountingPlansListProps> = ({ onSelectPlan }) => {
  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['plans-comptables-globaux'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans_comptables_globaux')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PlanComptableGlobal[];
    },
  });

  const { data: accountsCounts } = useQuery({
    queryKey: ['comptes-globaux-counts', plans?.map(p => p.id)],
    queryFn: async () => {
      if (!plans || plans.length === 0) return {};
      
      // Utiliser count: 'exact' pour chaque plan (pas de limite de 1000)
      const countPromises = plans.map(async (plan) => {
        const { count, error } = await supabase
          .from('comptes_globaux')
          .select('*', { count: 'exact', head: true })
          .eq('plan_comptable_id', plan.id);
        
        if (error) throw error;
        return { planId: plan.id, count: count || 0 };
      });
      
      const results = await Promise.all(countPromises);
      
      const counts: Record<string, number> = {};
      results.forEach(({ planId, count }) => {
        counts[planId] = count;
      });
      return counts;
    },
    enabled: !!plans && plans.length > 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Chargement des plans comptables...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-6">
          <p className="text-destructive">Erreur lors du chargement des plans comptables</p>
        </CardContent>
      </Card>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun plan comptable</h3>
          <p className="text-muted-foreground mb-4">
            Importez votre premier plan comptable depuis un fichier Excel
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <Card 
          key={plan.id} 
          className="hover:border-primary/50 transition-colors cursor-pointer group"
          onClick={() => onSelectPlan(plan.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{plan.nom}</CardTitle>
                  <Badge variant="outline" className="mt-1">{plan.code}</Badge>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.description && (
              <CardDescription className="line-clamp-2">
                {plan.description}
              </CardDescription>
            )}

            <div className="space-y-2 text-sm">
              {plan.zone_geographique && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>{plan.zone_geographique}</span>
                </div>
              )}
              {plan.organisme_normalisation && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span className="truncate">{plan.organisme_normalisation}</span>
                </div>
              )}
              {plan.version && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Version {plan.version}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                  {plan.is_active ? 'Actif' : 'Inactif'}
                </Badge>
                {plan.devise_principale && (
                  <Badge variant="outline">{plan.devise_principale}</Badge>
                )}
              </div>
              <span className="text-sm font-medium text-primary">
                {accountsCounts?.[plan.id] || 0} comptes
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Mis à jour le {plan.updated_at && !isNaN(new Date(plan.updated_at).getTime())
                ? format(new Date(plan.updated_at), 'dd MMM yyyy', { locale: fr })
                : 'Date inconnue'}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GlobalAccountingPlansList;
