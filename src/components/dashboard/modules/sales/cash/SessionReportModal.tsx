import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FileText } from 'lucide-react';
import CashReport from './CashReport';
import useCashRegister from '@/hooks/useCashRegister';

interface SessionReportModalProps {
  sessionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SessionReportModal = ({ sessionId, open, onOpenChange }: SessionReportModalProps) => {
  const { getSessionReport } = useCashRegister();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionId && open) {
      setLoading(true);
      getSessionReport(sessionId)
        .then(data => setReport(data))
        .catch(err => console.error('Erreur chargement rapport:', err))
        .finally(() => setLoading(false));
    }
  }, [sessionId, open, getSessionReport]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rapport de Session de Caisse
          </DialogTitle>
          <DialogDescription>
            Détails complets de la session avec tous les mouvements
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : report ? (
            <CashReport sessionId={sessionId!} report={report} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Rapport non disponible</p>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionReportModal;
