import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import VidalSubstitutionsPanel from './VidalSubstitutionsPanel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  ShieldAlert,
  Pill,
  FileText,
  Thermometer,
  ExternalLink,
  Ban,
  Activity,
  ClipboardList,
  Info,
  RefreshCw,
} from 'lucide-react';

interface VidalProductInfo {
  productId: number;
  name: string;
  company: string;
  activeSubstances: string;
  galenicalForm: string;
  indications: string[];
  contraindications: string[];
  sideEffects: string[];
  prescriptionConditions: string[];
  monographyUrl: string | null;
  storageCondition: string | null;
  indicators: {
    isNarcotic: boolean;
    isAssimilatedNarcotic: boolean;
    isCrushable: boolean;
    isScorable: boolean;
    isPhotosensitive: boolean;
    isDoping: boolean;
    isBiosimilar: boolean;
    hasRestrictedPrescription: boolean;
    safetyAlert: boolean;
  };
}

interface VidalProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  productName: string;
}

const VidalProductSheet: React.FC<VidalProductSheetProps> = ({
  open,
  onOpenChange,
  productId,
  productName,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VidalProductInfo | null>(null);

  useEffect(() => {
    if (!open || !productId) return;
    setLoading(true);
    setError(null);
    setData(null);

    supabase.functions
      .invoke('vidal-search', {
        body: { action: 'get-product-info', productId },
      })
      .then(({ data: result, error: err }) => {
        if (err) {
          setError(err.message);
        } else if (result?.error) {
          setError(result.message || 'Erreur VIDAL');
        } else {
          setData(result);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, productId]);

  const indicators = data?.indicators;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Fiche VIDAL — {productName}
          </DialogTitle>
          <DialogDescription>
            Données réglementaires et cliniques en temps réel
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {loading && (
            <div className="space-y-4 py-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg my-4">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {data && (
            <div className="space-y-6 py-4">
              {/* General info */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" /> Informations générales
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nom :</span>{' '}
                    <span className="font-medium">{data.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Laboratoire :</span>{' '}
                    <span className="font-medium">{data.company || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">DCI :</span>{' '}
                    <span className="font-medium">{data.activeSubstances || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Forme :</span>{' '}
                    <span className="font-medium">{data.galenicalForm || '—'}</span>
                  </div>
                </div>
              </section>

              {/* Indicators */}
              {indicators && (
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" /> Indicateurs réglementaires
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {indicators.isNarcotic && <Badge variant="destructive">Stupéfiant</Badge>}
                    {indicators.isAssimilatedNarcotic && <Badge variant="destructive">Assimilé stupéfiant</Badge>}
                    {indicators.hasRestrictedPrescription && <Badge variant="destructive">Prescription restreinte</Badge>}
                    {indicators.safetyAlert && <Badge variant="destructive">Alerte sécurité</Badge>}
                    {indicators.isPhotosensitive && <Badge className="bg-amber-500 text-white border-amber-500">Photosensible</Badge>}
                    {indicators.isDoping && <Badge className="bg-amber-500 text-white border-amber-500">Dopant</Badge>}
                    {indicators.isBiosimilar && <Badge variant="secondary">Biosimilaire</Badge>}
                    {indicators.isCrushable && <Badge variant="secondary">Écrasable</Badge>}
                    {indicators.isScorable && <Badge variant="secondary">Sécable</Badge>}
                    {!Object.values(indicators).some(Boolean) && (
                      <span className="text-sm text-muted-foreground">Aucun indicateur particulier</span>
                    )}
                  </div>
                </section>
              )}

              {/* Indications */}
              {data.indications.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" /> Indications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.indications.map((ind, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {ind}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {/* Contraindications */}
              {data.contraindications.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-destructive uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Ban className="h-4 w-4" /> Contre-indications
                  </h3>
                  <ul className="space-y-1">
                    {data.contraindications.map((ci, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Ban className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                        {ci}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Side effects */}
              {data.sideEffects.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Effets indésirables
                  </h3>
                  <ul className="space-y-1">
                    {data.sideEffects.map((se, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                        {se}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Prescription conditions */}
              {data.prescriptionConditions.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Conditions de prescription
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.prescriptionConditions.map((pc, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {pc}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {/* Storage */}
              {data.storageCondition && (
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Thermometer className="h-4 w-4" /> Conservation
                  </h3>
                  <p className="text-sm">{data.storageCondition}</p>
                </section>
              )}

              {/* Monography */}
              {data.monographyUrl && (
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Monographie VIDAL
                  </h3>
                  <a
                    href={data.monographyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Consulter la monographie
                  </a>
                </section>
              )}

              {/* Substitutions */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" /> Substitutions et équivalences
                </h3>
                <VidalSubstitutionsPanel productId={productId} productName={productName} />
              </section>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default VidalProductSheet;
