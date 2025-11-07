import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type PeriodType = '7d' | '30d' | '90d' | '6m' | '1y' | 'custom';

interface AnalyticsDateFilterProps {
  value: PeriodType;
  onChange: (period: PeriodType, customRange?: { start: Date; end: Date }) => void;
}

const AnalyticsDateFilter: React.FC<AnalyticsDateFilterProps> = ({ value, onChange }) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState<Date>();
  const [customEnd, setCustomEnd] = useState<Date>();

  const periods = [
    { value: '7d' as const, label: '7 jours' },
    { value: '30d' as const, label: '30 jours' },
    { value: '90d' as const, label: '90 jours' },
    { value: '6m' as const, label: '6 mois' },
    { value: '1y' as const, label: '1 an' },
    { value: 'custom' as const, label: 'Personnalisé' }
  ];

  const handlePeriodSelect = (period: PeriodType) => {
    if (period === 'custom') {
      setShowCustomPicker(true);
    } else {
      onChange(period);
      setShowCustomPicker(false);
    }
  };

  const handleCustomDateApply = () => {
    if (customStart && customEnd) {
      onChange('custom', { start: customStart, end: customEnd });
      setShowCustomPicker(false);
    }
  };

  const getDaysCount = () => {
    if (value === 'custom' && customStart && customEnd) {
      const diff = Math.ceil((customEnd.getTime() - customStart.getTime()) / (1000 * 60 * 60 * 24));
      return `${diff} jours`;
    }
    const periodObj = periods.find(p => p.value === value);
    return periodObj?.label || '';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 flex-wrap">
        {periods.map((period) => (
          <Button
            key={period.value}
            variant={value === period.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodSelect(period.value)}
            className="text-xs"
          >
            {period.label}
          </Button>
        ))}
      </div>

      <Badge variant="secondary" className="ml-2">
        {getDaysCount()}
      </Badge>

      {showCustomPicker && (
        <Popover open={showCustomPicker} onOpenChange={setShowCustomPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal',
                !customStart && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customStart && customEnd ? (
                <>
                  {format(customStart, 'P', { locale: fr })} - {format(customEnd, 'P', { locale: fr })}
                </>
              ) : (
                <span>Sélectionner une période</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Date de début</label>
                <Calendar
                  mode="single"
                  selected={customStart}
                  onSelect={setCustomStart}
                  locale={fr}
                  disabled={(date) => date > new Date()}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date de fin</label>
                <Calendar
                  mode="single"
                  selected={customEnd}
                  onSelect={setCustomEnd}
                  locale={fr}
                  disabled={(date) => date > new Date() || (customStart ? date < customStart : false)}
                />
              </div>
              <Button
                onClick={handleCustomDateApply}
                disabled={!customStart || !customEnd}
                className="w-full"
              >
                Appliquer
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default AnalyticsDateFilter;
