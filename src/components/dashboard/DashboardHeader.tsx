import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardHeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const DashboardHeader = ({ onRefresh, isRefreshing }: DashboardHeaderProps) => {
  const { currentTenant } = useTenant();
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <span>{currentTenant?.name || 'Pharmacie'}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(), "EEEE dd MMMM yyyy", { locale: fr })}
          </div>
        </div>
      </div>

      <Button
        onClick={onRefresh}
        disabled={isRefreshing}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        Actualiser
      </Button>
    </div>
  );
};
