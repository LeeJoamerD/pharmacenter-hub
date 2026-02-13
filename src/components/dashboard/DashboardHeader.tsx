import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar, Eye, EyeOff } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDateLocale } from '@/hooks/useDateLocale';

interface DashboardHeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
  isDashboardVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const DashboardHeader = ({ onRefresh, isRefreshing, isDashboardVisible, onToggleVisibility }: DashboardHeaderProps) => {
  const { currentTenant } = useTenant();
  const { t } = useLanguage();
  const { dateLocale } = useDateLocale();
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboardTitle')}</h1>
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <span>{currentTenant?.name || t('pharmacy')}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(), "EEEE dd MMMM yyyy", { locale: dateLocale })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onToggleVisibility && (
          <Button
            onClick={onToggleVisibility}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            {isDashboardVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isDashboardVisible ? 'Masquer' : 'Afficher'}
          </Button>
        )}
        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </div>
    </div>
  );
};
