import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportButtonProps {
  onExport: (format: 'csv' | 'xlsx' | 'pdf') => void;
  className?: string;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  className = '',
  disabled = false,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-1 ${className}`}
          disabled={disabled}
        >
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('csv')}>
          Format CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('xlsx')}>
          Format Excel (XLSX)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('pdf')}>
          Format PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;