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
  Clock,
  AlertCircle,
  Shield
} from 'lucide-react';
import { Invoice, InvoiceLine } from '@/hooks/useInvoiceManager';
import { supabase } from '@/integrations/supabase/client';
import { InvoicePDFService } from '@/services/InvoicePDFService';
import { useToast } from '@/hooks/use-toast';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface BeneficiaireDetails {
  nom_beneficiaire?: string;
  matricule_beneficiaire?: string;
  numero_bon?: string;
  taux_couverture?: number;
}

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
  const { formatAmount, formatNumber } = useCurrencyFormatting();
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [loadingLines, setLoadingLines] = useState(false);
  const [beneficiaire, setBeneficiaire] = useState<BeneficiaireDetails | null>(null);

  useEffect(() => {
    if (invoice && open) {
      loadInvoiceLines();
      if (invoice.assureur_id && invoice.vente_id) {
        loadBeneficiaireDetails();
      } else {
        setBeneficiaire(null);
      }
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

  const loadBeneficiaireDetails = async () => {
    if (!invoice?.vente_id) return;
    try {
      const { data, error } = await supabase
        .from('details_vente_bon')
        .select('nom_beneficiaire, matricule_beneficiaire, numero_bon, taux_couverture')
        .eq('vente_id', invoice.vente_id)
        .maybeSingle();
      
      if (!error && data) {
        setBeneficiaire(data as BeneficiaireDetails);
      }
    } catch (error) {
      console.error('Error loading beneficiaire details:', error);
    }
  };

  const handleExportPDF = async () => {
    if (!invoice) return;

    try {
      const { url, filename } = await InvoicePDFService.generateInvoicePDF(invoice, lines, null, beneficiaire);
      
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
  const isAssureur = !!invoice.assureur_id;
  
  // Determine displayed contact info
  const contactName = isAssureur ? invoice.assureur_nom : (isClient ? invoice.client_nom : invoice.fournisseur_nom);
  const contactPhone = isAssureur ? invoice.assureur_telephone : (isClient ? invoice.client_telephone : invoice.fournisseur_telephone);
  const contactEmail = isAssureur ? invoice.assureur_email : (isClient ? invoice.client_email : invoice.fournisseur_email);
  const contactAddress = isAssureur ? invoice.assureur_adresse : (isClient ? invoice.client_adresse : invoice.fournisseur_adresse);
  const contactLabel = isAssureur ? 'Informations Assureur' : (isClient ? 'Informations Client' : 'Informations Fournisseur');
  const contactBadgeLabel = isAssureur ? 'Assureur' : (isClient ? 'Client' : 'Fournisseur');

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
                {contactBadgeLabel === 'Assureur' ? 'Facture assureur' : (isClient ? 'Facture client' : 'Facture fournisseur')} - {invoice.libelle}
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
                <Badge variant={isAssureur ? 'secondary' : (isClient ? 'default' : 'secondary')}>
                  {isAssureur && <Shield className="h-3 w-3 mr-1" />}
                  {contactBadgeLabel}
                </Badge>
                {getStatutBadge(invoice.statut)}
                {getPaymentBadge(invoice.statut_paiement)}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatAmount(invoice.montant_ttc)}</div>
                <div className="text-sm text-muted-foreground">Montant TTC</div>
              </div>
            </div>

            <Separator />

            {/* Informations générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    {contactLabel}
                  </h3>
                  {contactName && (
                    <div className="flex items-start gap-2">
                      {isAssureur ? <Shield className="h-4 w-4 text-muted-foreground mt-0.5" /> : <User className="h-4 w-4 text-muted-foreground mt-0.5" />}
                      <div>
                        <div className="font-medium">{contactName}</div>
                      </div>
                    </div>
                  )}
                  {contactEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{contactEmail}</span>
                    </div>
                  )}
                  {contactPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{contactPhone}</span>
                    </div>
                  )}
                  {contactAddress && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{contactAddress}</span>
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

            {/* Détails bénéficiaire pour factures assureur */}
            {isAssureur && beneficiaire && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Détails du Bénéficiaire</h3>
                  {beneficiaire.nom_beneficiaire && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span><strong>Nom:</strong> {beneficiaire.nom_beneficiaire}</span>
                    </div>
                  )}
                  {beneficiaire.matricule_beneficiaire && (
                    <div className="text-sm"><strong>Matricule:</strong> {beneficiaire.matricule_beneficiaire}</div>
                  )}
                  {beneficiaire.numero_bon && (
                    <div className="text-sm"><strong>N° Bon/Police:</strong> {beneficiaire.numero_bon}</div>
                  )}
                  {beneficiaire.taux_couverture != null && (
                    <div className="text-sm"><strong>Taux de couverture:</strong> {beneficiaire.taux_couverture}%</div>
                  )}
                </CardContent>
              </Card>
            )}

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
                        <div className="col-span-2 text-right">{formatNumber(line.prix_unitaire)}</div>
                        <div className="col-span-1 text-right">{line.taux_tva}%</div>
                        <div className="col-span-2 text-right font-semibold">{formatNumber(line.montant_ttc)}</div>
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
                    <span className="font-medium">{formatAmount(invoice.montant_ht)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TVA</span>
                    <span className="font-medium">{formatAmount(invoice.montant_tva)}</span>
                  </div>
                  {(invoice as any).montant_centime_additionnel && (invoice as any).montant_centime_additionnel > 0 && (
                    <div className="flex justify-between text-sm text-amber-600">
                      <span>Centime Additionnel ({(invoice as any).taux_centime_additionnel || 5}%)</span>
                      <span className="font-medium">{formatAmount((invoice as any).montant_centime_additionnel || 0)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total TTC</span>
                    <span>{formatAmount(invoice.montant_ttc)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Montant payé</span>
                    <span className="font-medium">{formatAmount(invoice.montant_paye)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Montant restant</span>
                    <span className="font-semibold">{formatAmount(invoice.montant_restant)}</span>
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