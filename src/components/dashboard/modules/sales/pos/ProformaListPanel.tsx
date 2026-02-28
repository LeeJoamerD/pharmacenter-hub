/**
 * Panel liste des proformas avec actions (convertir, réimprimer, annuler)
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileText, Download, ArrowRightLeft, XCircle, Loader2, Clock } from 'lucide-react';
import { useProformaManager, ProformaRecord } from '@/hooks/useProformaManager';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { generateProformaPDF, ProformaPDFData } from '@/utils/proformaInvoicePDF';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { differenceInDays } from 'date-fns';

const ProformaListPanel: React.FC = () => {
  const { tenantId } = useTenant();
  const { proformas, isLoading, isConverting, convertToSale, cancelProforma } = useProformaManager();
  const { formatAmount } = useCurrencyFormatting();
  const { getPharmacyInfo } = useGlobalSystemSettings();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [convertDialog, setConvertDialog] = useState<ProformaRecord | null>(null);
  const [cancelDialog, setCancelDialog] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState('');

  const filtered = statusFilter === 'all' 
    ? proformas 
    : proformas.filter(p => p.statut === statusFilter);

  const getStatusBadge = (statut: string) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      'En attente': { variant: 'default', label: 'En attente' },
      'Convertie': { variant: 'secondary', label: 'Convertie' },
      'Annulée': { variant: 'destructive', label: 'Annulée' },
      'Expirée': { variant: 'outline', label: 'Expirée' },
    };
    const config = map[statut] || { variant: 'outline' as const, label: statut };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getValidityBadge = (dateExpiration: string | null) => {
    if (!dateExpiration) return null;
    const days = differenceInDays(new Date(dateExpiration), new Date());
    if (days < 0) return <Badge variant="destructive" className="text-xs">Expirée</Badge>;
    if (days <= 7) return <Badge variant="destructive" className="text-xs"><Clock className="h-3 w-3 mr-1" />{days}j</Badge>;
    if (days <= 15) return <Badge variant="outline" className="text-xs text-orange-600"><Clock className="h-3 w-3 mr-1" />{days}j</Badge>;
    return <Badge variant="outline" className="text-xs text-green-600"><Clock className="h-3 w-3 mr-1" />{days}j</Badge>;
  };

  const handleReprint = async (proforma: ProformaRecord) => {
    const pharmacyInfo = getPharmacyInfo();
    const lignes = proforma.lignes_proforma || [];
    
    const pdfData: ProformaPDFData = {
      numero_proforma: proforma.numero_proforma,
      date_proforma: proforma.date_proforma,
      date_expiration: proforma.date_expiration,
      validite_jours: proforma.validite_jours,
      client_nom: proforma.client_nom,
      montant_total_ht: Number(proforma.montant_total_ht),
      montant_tva: Number(proforma.montant_tva),
      montant_total_ttc: Number(proforma.montant_total_ttc),
      remise_globale: Number(proforma.remise_globale),
      montant_net: Number(proforma.montant_net),
      notes: proforma.notes,
      lignes: lignes.map((l: any) => ({
        libelle_produit: l.libelle_produit,
        code_cip: l.code_cip,
        quantite: Number(l.quantite),
        prix_unitaire_ttc: Number(l.prix_unitaire_ttc),
        remise_ligne: Number(l.remise_ligne),
        montant_ligne_ttc: Number(l.montant_ligne_ttc),
      })),
      pharmacyInfo: {
        name: pharmacyInfo.name,
        address: pharmacyInfo.address,
        telephone: pharmacyInfo.telephone_appel || pharmacyInfo.telephone_whatsapp,
      },
    };

    const pdfUrl = generateProformaPDF(pdfData);
    window.open(pdfUrl, '_blank');
  };

  const openConvertDialog = async (proforma: ProformaRecord) => {
    // Charger les sessions ouvertes
    const { data } = await supabase
      .from('sessions_caisse')
      .select('id, numero_session, caisse_id, caisse:caisses(nom_caisse)')
      .eq('tenant_id', tenantId)
      .eq('statut', 'Ouverte')
      .order('date_ouverture', { ascending: false });

    setSessions(data || []);
    if (data && data.length > 0) setSelectedSession(data[0].id);
    setConvertDialog(proforma);
  };

  const handleConvert = async () => {
    if (!convertDialog || !selectedSession) return;
    const session = sessions.find((s: any) => s.id === selectedSession);
    if (!session) return;
    
    const success = await convertToSale(convertDialog.id, selectedSession, session.caisse_id);
    if (success) setConvertDialog(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Factures Proforma ({filtered.length})
        </h3>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="En attente">En attente</SelectItem>
            <SelectItem value="Convertie">Converties</SelectItem>
            <SelectItem value="Annulée">Annulées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune proforma trouvée
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((proforma) => (
            <Card key={proforma.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{proforma.numero_proforma}</span>
                      {getStatusBadge(proforma.statut)}
                      {proforma.statut === 'En attente' && getValidityBadge(proforma.date_expiration)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(proforma.date_proforma).toLocaleDateString('fr-FR')}
                      {proforma.client_nom && ` • ${proforma.client_nom}`}
                    </p>
                    <p className="text-sm font-medium">{formatAmount(Number(proforma.montant_net))}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleReprint(proforma)}>
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    {proforma.statut === 'En attente' && (
                      <>
                        <Button variant="default" size="sm" onClick={() => openConvertDialog(proforma)}>
                          <ArrowRightLeft className="h-4 w-4 mr-1" />
                          Convertir
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setCancelDialog(proforma.id)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Annuler
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de conversion */}
      <AlertDialog open={!!convertDialog} onOpenChange={() => setConvertDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en vente</AlertDialogTitle>
            <AlertDialogDescription>
              Convertir la proforma {convertDialog?.numero_proforma} en vente réelle.
              Le stock sera déduit selon la méthode FIFO.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Session de caisse</label>
            {sessions.length === 0 ? (
              <p className="text-sm text-destructive">Aucune session de caisse ouverte. Ouvrez une session d'abord.</p>
            ) : (
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.numero_session} - {s.caisse?.nom_caisse || 'Caisse'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert} disabled={isConverting || !selectedSession || sessions.length === 0}>
              {isConverting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirmer la conversion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog d'annulation */}
      <AlertDialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la proforma</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La proforma sera marquée comme annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, garder</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (cancelDialog) { cancelProforma(cancelDialog); setCancelDialog(null); } }}>
              Oui, annuler
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProformaListPanel;
