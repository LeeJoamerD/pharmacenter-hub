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
    queryKey: ['comptes-globaux-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comptes_globaux')
        .select('plan_comptable_id');

      if (error) throw error;
      
      // Count accounts per plan
      const counts: Record<string, number> = {};
      data?.forEach(item => {
        counts[item.plan_comptable_id] = (counts[item.plan_comptable_id] || 0) + 1;
      });
      return counts;
    },
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
              Mis à jour le {format(new Date(plan.updated_at), 'dd MMM yyyy', { locale: fr })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GlobalAccountingPlansList;
