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

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    setIsExporting(true);
    try {
      await exportAllAnalytics(dashboardData, format, dateFilter);
      toast.success(`Export ${format.toUpperCase()} réussi`, {
        description: 'Le fichier a été téléchargé avec succès'
      });
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast.error("Erreur lors de l'export", {
        description: "Une erreur est survenue lors de l'exportation des données."
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
              Export en cours...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Exporter Analytics
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('xlsx')}>
          Format Excel (XLSX)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          Format PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AnalyticsExportButton;
