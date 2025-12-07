import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Package, Barcode, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { VisionDetection } from '@/hooks/useComputerVision';

interface DetectionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detection: VisionDetection | null;
  onVerify: (id: string, status: 'verified' | 'rejected') => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function DetectionDetailDialog({
  open,
  onOpenChange,
  detection,
  onVerify,
  onDelete
}: DetectionDetailDialogProps) {
  if (!detection) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      verified: 'Vérifié',
      pending: 'En attente',
      failed: 'Échec',
      rejected: 'Rejeté'
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Détails de la Détection
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Image preview */}
          {detection.image_url && (
            <div className="w-full h-48 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              <img 
                src={detection.image_url} 
                alt="Produit" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          {/* Status and confidence */}
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(detection.status)}>
              {getStatusLabel(detection.status)}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Confiance:</span>
              <Progress value={detection.confidence} className="w-20 h-2" />
              <span className="text-sm font-medium">{detection.confidence}%</span>
            </div>
          </div>

          {/* Product info */}
          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{detection.detected_name}</span>
            </div>

            {detection.detected_barcode && (
              <div className="flex items-center gap-2">
                <Barcode className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{detection.detected_barcode}</span>
              </div>
            )}

            {detection.detected_price && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{detection.detected_price} FCFA</span>
              </div>
            )}

            {detection.detected_expiry_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Expire le: {detection.detected_expiry_date}</span>
              </div>
            )}

            {detection.packaging_status && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span>Emballage: {detection.packaging_status}</span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Détecté le: {format(new Date(detection.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
            </div>
            {detection.processing_time_ms && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Temps de traitement: {detection.processing_time_ms}ms</span>
              </div>
            )}
            {detection.product && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Produit correspondant: {detection.product.libelle_produit}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {detection.status === 'pending' && (
            <>
              <Button 
                variant="outline" 
                className="text-red-600"
                onClick={() => onVerify(detection.id, 'rejected')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => onVerify(detection.id, 'verified')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Vérifier
              </Button>
            </>
          )}
          <Button 
            variant="destructive" 
            onClick={() => {
              onDelete(detection.id);
              onOpenChange(false);
            }}
          >
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
