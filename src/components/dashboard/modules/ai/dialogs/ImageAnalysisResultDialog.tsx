import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Package, Barcode, DollarSign, Calendar, Box } from 'lucide-react';

interface AnalysisResult {
  product_name: string | null;
  barcode: string | null;
  price: number | null;
  expiry_date: string | null;
  packaging_status: string;
  price_label_status: string;
  estimated_stock: number | null;
  confidence: number;
  additional_notes: string;
}

interface ImageAnalysisResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: AnalysisResult | null;
  imageUrl: string | null;
  processingTime: number | null;
  onSave: () => void;
}

export default function ImageAnalysisResultDialog({
  open,
  onOpenChange,
  result,
  imageUrl,
  processingTime,
  onSave
}: ImageAnalysisResultDialogProps) {
  if (!result) return null;

  const getPackagingBadge = (status: string) => {
    switch (status) {
      case 'intact':
        return <Badge className="bg-green-100 text-green-800">Intact</Badge>;
      case 'damaged':
        return <Badge className="bg-red-100 text-red-800">Endommagé</Badge>;
      case 'opened':
        return <Badge className="bg-orange-100 text-orange-800">Ouvert</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Inconnu</Badge>;
    }
  };

  const getPriceLabelBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Présent</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      case 'illegible':
        return <Badge className="bg-orange-100 text-orange-800">Illisible</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Inconnu</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Résultat de l'Analyse
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Image preview */}
          {imageUrl && (
            <div className="w-full h-32 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              <img 
                src={imageUrl} 
                alt="Analysé" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          {/* Confidence */}
          <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
            <span className="font-medium">Confiance de l'analyse</span>
            <div className="flex items-center gap-2">
              <div className={`text-xl font-bold ${result.confidence >= 80 ? 'text-green-600' : result.confidence >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
                {result.confidence}%
              </div>
              {result.confidence >= 80 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : result.confidence >= 50 ? (
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
          </div>

          {/* Product info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Produit détecté</div>
                <div className="font-medium">{result.product_name || 'Non identifié'}</div>
              </div>
            </div>

            {result.barcode && (
              <div className="flex items-center gap-3">
                <Barcode className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Code-barres</div>
                  <div className="font-mono">{result.barcode}</div>
                </div>
              </div>
            )}

            {result.price && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Prix détecté</div>
                  <div className="font-medium">{result.price} FCFA</div>
                </div>
              </div>
            )}

            {result.expiry_date && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Date d'expiration</div>
                  <div className="font-medium">{result.expiry_date}</div>
                </div>
              </div>
            )}

            {result.estimated_stock && (
              <div className="flex items-center gap-3">
                <Box className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Stock estimé</div>
                  <div className="font-medium">{result.estimated_stock} unités</div>
                </div>
              </div>
            )}
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-4 pt-2">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Emballage</div>
              {getPackagingBadge(result.packaging_status)}
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Étiquette prix</div>
              {getPriceLabelBadge(result.price_label_status)}
            </div>
          </div>

          {/* Notes */}
          {result.additional_notes && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="text-sm text-blue-800">{result.additional_notes}</div>
            </div>
          )}

          {/* Processing time */}
          {processingTime && (
            <div className="text-sm text-muted-foreground text-right">
              Temps de traitement: {processingTime}ms
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button onClick={onSave}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Sauvegarder la détection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
