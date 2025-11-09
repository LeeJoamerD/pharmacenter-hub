import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileBarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickInventoryDialog = ({ open, onOpenChange }: QuickInventoryDialogProps) => {
  const navigate = useNavigate();

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
            Lancer Inventaire
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle session d'inventaire rapidement
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleNavigate(); }} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Accédez à la page d'inventaires pour créer et gérer vos sessions d'inventaire avec tous les détails nécessaires.
          </p>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
            >
              Aller à la page Inventaires
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
