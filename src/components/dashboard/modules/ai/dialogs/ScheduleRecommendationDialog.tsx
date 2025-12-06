import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ScheduleRecommendationDialogProps {
  recommendationId: string | null;
  recommendationTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (id: string, date: Date) => void;
}

const ScheduleRecommendationDialog: React.FC<ScheduleRecommendationDialogProps> = ({
  recommendationId,
  recommendationTitle,
  open,
  onOpenChange,
  onSchedule
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!recommendationId || !selectedDate) return;
    
    setIsSubmitting(true);
    try {
      await onSchedule(recommendationId, selectedDate);
      setSelectedDate(undefined);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedDate(undefined);
    onOpenChange(false);
  };

  // Disable past dates
  const disabledDays = { before: new Date() };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Programmer la recommandation
          </DialogTitle>
          <DialogDescription>
            {recommendationTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>
              Date de mise en œuvre prévue <span className="text-red-500">*</span>
            </Label>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={disabledDays}
                locale={fr}
                className="rounded-md border"
              />
            </div>
            {selectedDate && (
              <p className="text-sm text-center text-muted-foreground">
                Programmée pour le: <span className="font-medium text-foreground">
                  {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr })}
                </span>
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedDate || isSubmitting}
          >
            {isSubmitting ? 'Programmation...' : 'Confirmer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleRecommendationDialog;
