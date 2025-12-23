import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Download, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  DollarSign,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Invoice, InvoiceLine } from '@/hooks/useInvoiceManager';
import { supabase } from '@/integrations/supabase/client';
import { InvoicePDFService } from '@/services/InvoicePDFService';
import { useToast } from '@/hooks/use-toast';

interface InvoiceDetailDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InvoiceDetailDialog: React.FC<InvoiceDetailDialogProps> = ({
  invoice,
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [loadingLines, setLoadingLines] = useState(false);

  useEffect(() => {
    if (invoice && open) {
      loadInvoiceLines();
    }
  }, [invoice, open]);

  const loadInvoiceLines = async () => {
    if (!invoice) return;
    
    setLoadingLines(true);
    try {
      const { data, error } = await supabase
        .from('lignes_facture')
        .select('*')
        .eq('facture_id', invoice.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setLines(data as InvoiceLine[]);
    } catch (error: any) {
      console.error('Error loading invoice lines:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les lignes de facture',
        variant: 'destructive'
      });
    } finally {
      setLoadingLines(false);
    }
  };

  const handleExportPDF = async () => {
    if (!invoice) return;

    try {
      const { url, filename } = await InvoicePDFService.generateInvoicePDF(invoice, lines);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Succès',
        description: 'Facture exportée avec succès'
      });
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter la facture',
        variant: 'destructive'
      });
    }
  };

  if (!invoice) return null;

  const isClient = invoice.type === 'client';
  const clientName = isClient ? invoice.client_nom : invoice.fournisseur_nom;
  const clientPhone = isClient ? invoice.client_telephone : invoice.fournisseur_telephone;
  const clientEmail = isClient ? invoice.client_email : invoice.fournisseur_email;
  const clientAddress = isClient ? invoice.client_adresse : invoice.fournisseur_adresse;

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      brouillon: { variant: 'outline', label: 'Brouillon' },
      emise: { variant: 'default', label: 'Émise' },
      partiellement_payee: { variant: 'secondary', label: 'Part. payée' },
      payee: { variant: 'default', label: 'Payée' },
      en_retard: { variant: 'destructive', label: 'En retard' },
      annulee: { variant: 'destructive', label: 'Annulée' },
    };
    const config = variants[statut] || { variant: 'outline', label: statut };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentBadge = (statut: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      impayee: { variant: 'destructive', label: 'Impayée' },
      partielle: { variant: 'secondary', label: 'Partielle' },
      payee: { variant: 'default', label: 'Payée' },
    };
    const config = variants[statut] || { variant: 'outline', label: statut };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Facture {invoice.numero}
              </DialogTitle>
              <DialogDescription>
                {isClient ? 'Facture client' : 'Facture fournisseur'} - {invoice.libelle}
              </DialogDescription>
            </div>
            <Button onClick={handleExportPDF} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-6 p-1">
            {/* En-tête avec statuts */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant={isClient ? 'default' : 'secondary'}>
                  {isClient ? 'Client' : 'Fournisseur'}
                </Badge>
                {getStatutBadge(invoice.statut)}
                {getPaymentBadge(invoice.statut_paiement)}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{invoice.montant_ttc.toFixed(2)} FCFA</div>
                <div className="text-sm text-muted-foreground">Montant TTC</div>
              </div>
            </div>

            <Separator />

            {/* Informations générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    {isClient ? 'Informations Client' : 'Informations Fournisseur'}
                  </h3>
                  {clientName && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">{clientName}</div>
                      </div>
                    </div>
                  )}
                  {clientEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{clientEmail}</span>
                    </div>
                  )}
                  {clientPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{clientPhone}</span>
                    </div>
                  )}
                  {clientAddress && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{clientAddress}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Dates</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Date d'émission</div>
                      <div>{new Date(invoice.date_emission).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Date d'échéance</div>
                      <div>{new Date(invoice.date_echeance).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                  {invoice.jours_retard && invoice.jours_retard > 0 && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>En retard de {invoice.jours_retard} jour(s)</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Lignes de facture */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm text-muted-foreground mb-4">Détails des lignes</h3>
                {loadingLines ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </div>
                ) : lines.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune ligne de détail
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground pb-2 border-b">
                      <div className="col-span-5">Désignation</div>
                      <div className="col-span-2 text-right">Quantité</div>
                      <div className="col-span-2 text-right">Prix unit.</div>
                      <div className="col-span-1 text-right">TVA</div>
                      <div className="col-span-2 text-right">Total TTC</div>
                    </div>
                    {lines.map((line) => (
                      <div key={line.id} className="grid grid-cols-12 gap-2 text-sm py-2 border-b last:border-0">
                        <div className="col-span-5 font-medium">{line.designation}</div>
                        <div className="col-span-2 text-right">{line.quantite}</div>
                        <div className="col-span-2 text-right">{line.prix_unitaire.toFixed(2)}</div>
                        <div className="col-span-1 text-right">{line.taux_tva}%</div>
                        <div className="col-span-2 text-right font-semibold">{line.montant_ttc.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Totaux */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total HT</span>
                    <span className="font-medium">{invoice.montant_ht.toFixed(2)} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TVA</span>
                    <span className="font-medium">{invoice.montant_tva.toFixed(2)} FCFA</span>
                  </div>
                  {/* Centime Additionnel - affiché si présent */}
                  {(invoice as any).montant_centime_additionnel && (invoice as any).montant_centime_additionnel > 0 && (
                    <div className="flex justify-between text-sm text-amber-600">
                      <span>Centime Additionnel ({(invoice as any).taux_centime_additionnel || 5}%)</span>
                      <span className="font-medium">{((invoice as any).montant_centime_additionnel || 0).toFixed(2)} FCFA</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total TTC</span>
                    <span>{invoice.montant_ttc.toFixed(2)} FCFA</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Montant payé</span>
                    <span className="font-medium">{invoice.montant_paye.toFixed(2)} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Montant restant</span>
                    <span className="font-semibold">{invoice.montant_restant.toFixed(2)} FCFA</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations complémentaires */}
            {(invoice.reference_externe || invoice.notes || invoice.created_by) && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Informations complémentaires</h3>
                  {invoice.reference_externe && (
                    <div className="text-sm">
                      <span className="font-medium">Référence externe: </span>
                      {invoice.reference_externe}
                    </div>
                  )}
                  {invoice.notes && (
                    <div className="text-sm">
                      <span className="font-medium">Notes: </span>
                      <p className="mt-1 text-muted-foreground">{invoice.notes}</p>
                    </div>
                  )}
                  {invoice.created_by && (
                    <div className="text-sm text-muted-foreground">
                      Créée par {invoice.created_by} le {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
