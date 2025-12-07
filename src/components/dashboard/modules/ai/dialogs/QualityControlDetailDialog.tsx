import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { QualityControl } from '@/hooks/useComputerVision';

interface QualityControlDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  control: QualityControl | null;
  onRunCheck: (type: QualityControl['control_type']) => Promise<void>;
}

export default function QualityControlDetailDialog({
  open,
  onOpenChange,
  control,
  onRunCheck
}: QualityControlDetailDialogProps) {
  if (!control) return null;

  const typeLabels: Record<string, string> = {
    expiry_date: "Date d'expiration",
    packaging: "Intégrité emballage",
    barcode: "Code-barres lisible",
    price_label: "Étiquetage prix"
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-orange-100 text-orange-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Actif',
      warning: 'Attention',
      error: 'Erreur'
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Détail Contrôle Qualité
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              {typeLabels[control.control_type] || control.control_type}
            </h3>
            <Badge className={getStatusColor(control.status)}>
              {getStatusLabel(control.status)}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-2xl font-bold">{control.checked_items}</div>
              <div className="text-sm text-muted-foreground">Éléments vérifiés</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className={`text-2xl font-bold ${control.alerts_generated > 5 ? 'text-red-600' : 'text-green-600'}`}>
                {control.alerts_generated}
              </div>
              <div className="text-sm text-muted-foreground">Alertes générées</div>
            </div>
          </div>

          {/* Accuracy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Précision</span>
              <span className="font-medium">{control.accuracy}%</span>
            </div>
            <Progress value={control.accuracy} className="h-2" />
          </div>

          {/* Alert status */}
          {control.alerts_generated > 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">{control.alerts_generated} alerte(s) nécessitent attention</span>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Aucune alerte</span>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Dernier contrôle: {format(new Date(control.checked_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button onClick={() => {
            onRunCheck(control.control_type);
            onOpenChange(false);
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Relancer le contrôle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
