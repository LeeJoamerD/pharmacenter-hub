import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportAllAnalytics } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface AnalyticsExportButtonProps {
  dashboardData: {
    metrics: any;
    statusDistribution: any;
    valorisationByFamily: any[];
    movementsEvolution: any[];
    rotationByFamily?: any[];
  };
  dateFilter: { period: string; start: Date; end: Date };
  disabled?: boolean;
}

const AnalyticsExportButton: React.FC<AnalyticsExportButtonProps> = ({
  dashboardData,
  dateFilter,
  disabled = false
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { t } = useLanguage();

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    setIsExporting(true);
    try {
      await exportAllAnalytics(dashboardData, format, dateFilter);
      toast.success(`${t('export')} ${format.toUpperCase()} ${t('success').toLowerCase()}`, {
        description: t('fileDownloadedSuccess')
      });
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast.error(t('exportError'), {
        description: t('exportErrorDescription')
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('exportInProgress')}
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              {t('exportAnalytics')}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('xlsx')}>
          {t('formatExcel')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          {t('formatPdf')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AnalyticsExportButton;
