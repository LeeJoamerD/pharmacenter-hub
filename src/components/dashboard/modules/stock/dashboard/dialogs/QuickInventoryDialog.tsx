import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileBarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickInventoryDialog = ({ open, onOpenChange }: QuickInventoryDialogProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleNavigate = () => {
    onOpenChange(false);
    navigate('/stock/inventaires');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            {t('stockInventory')}
          </DialogTitle>
          <DialogDescription>
            {t('createInventorySession')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleNavigate(); }} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('accessInventoryPage')}
          </p>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
            >
              {t('goToInventoryPage')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('stockCancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
