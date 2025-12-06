import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, User, Calendar, Pill, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import type { NetworkPrescription } from '@/hooks/useNetworkBusinessIntegrations';

interface PrescriptionViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: NetworkPrescription | null;
}

interface PrescriptionLine {
  id: string;
  productName: string;
  quantity: number;
  dosage?: string;
  duration?: string;
  instructions?: string;
}

export function PrescriptionViewDialog({ open, onOpenChange, prescription }: PrescriptionViewDialogProps) {
  const [lines, setLines] = useState<PrescriptionLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && prescription) {
      loadPrescriptionLines();
    }
  }, [open, prescription]);

  const loadPrescriptionLines = async () => {
    if (!prescription) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('lignes_prescriptions')
        .select(`
          id,
          quantite_prescrite,
          posologie,
          duree_traitement,
          produit:produit_id(libelle_produit)
        `)
        .eq('prescription_id', prescription.id);

      if (error) throw error;

      setLines((data as any)?.map((l: any) => ({
        id: l.id,
        productName: l.produit?.libelle_produit || 'Médicament',
        quantity: l.quantite_prescrite || 1,
        dosage: l.posologie,
        duration: l.duree_traitement,
        instructions: ''
      })) || []);
    } catch (error) {
      console.error('Error loading prescription lines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!prescription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Détails de l'ordonnance
          </DialogTitle>
          <DialogDescription>
            Prescription médicale et médicaments prescrits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prescription Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Prescripteur</p>
                <p className="font-medium">{prescription.doctorName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="font-medium">{prescription.patientName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{format(new Date(prescription.date), 'dd/MM/yyyy', { locale: fr })}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                {prescription.status}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Prescription Lines */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Médicaments prescrits ({prescription.linesCount})
            </h4>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : lines.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucun médicament enregistré</p>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {lines.map(line => (
                    <div key={line.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-primary" />
                          <span className="font-medium">{line.productName}</span>
                        </div>
                        <Badge variant="outline">Qté: {line.quantity}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {line.dosage && (
                          <div>
                            <span className="text-muted-foreground">Posologie: </span>
                            <span>{line.dosage}</span>
                          </div>
                        )}
                        {line.duration && (
                          <div>
                            <span className="text-muted-foreground">Durée: </span>
                            <span>{line.duration}</span>
                          </div>
                        )}
                      </div>
                      
                      {line.instructions && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {line.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
