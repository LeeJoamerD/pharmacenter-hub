import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { RefreshCw, FlaskConical, Dna, Layers, Network } from 'lucide-react';

interface VidalProduct {
  id: number;
  name: string;
  company: string | null;
  galenicalForm: string | null;
}

interface AtcClassification {
  id: number;
  code: string;
  label: string;
}

interface SectionState {
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

interface VidalSubstitutionsPanelProps {
  productId: number;
  productName: string;
}

const VidalSubstitutionsPanel: React.FC<VidalSubstitutionsPanelProps> = ({
  productId,
  productName,
}) => {
  const [genericProducts, setGenericProducts] = useState<VidalProduct[]>([]);
  const [biosimilarProducts, setBiosimilarProducts] = useState<VidalProduct[]>([]);
  const [vmpProducts, setVmpProducts] = useState<VidalProduct[]>([]);
  const [atcClassifications, setAtcClassifications] = useState<AtcClassification[]>([]);

  const [genericState, setGenericState] = useState<SectionState>({ loading: false, loaded: false, error: null });
  const [biosimilarState, setBiosimilarState] = useState<SectionState>({ loading: false, loaded: false, error: null });
  const [vmpState, setVmpState] = useState<SectionState>({ loading: false, loaded: false, error: null });
  const [atcState, setAtcState] = useState<SectionState>({ loading: false, loaded: false, error: null });

  const fetchSection = useCallback(async (
    action: string,
    setState: React.Dispatch<React.SetStateAction<SectionState>>,
    setData: (data: any) => void,
    dataKey: string,
  ) => {
    setState({ loading: true, loaded: false, error: null });
    try {
      const { data, error } = await supabase.functions.invoke('vidal-search', {
        body: { action, productId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.message || 'Erreur VIDAL');
      setData(data?.[dataKey] || []);
      setState({ loading: false, loaded: true, error: null });
    } catch (e: any) {
      setState({ loading: false, loaded: true, error: e.message });
    }
  }, [productId]);

  const handleAccordionChange = (value: string) => {
    if (value === 'generic' && !genericState.loaded && !genericState.loading) {
      fetchSection('get-generic-group', setGenericState, setGenericProducts, 'products');
    }
    if (value === 'biosimilar' && !biosimilarState.loaded && !biosimilarState.loading) {
      fetchSection('get-biosimilar-group', setBiosimilarState, setBiosimilarProducts, 'products');
    }
    if (value === 'vmp' && !vmpState.loaded && !vmpState.loading) {
      fetchSection('get-vmp-products', setVmpState, setVmpProducts, 'products');
    }
    if (value === 'atc' && !atcState.loaded && !atcState.loading) {
      fetchSection('get-product-atc', setAtcState, setAtcClassifications, 'classifications');
    }
  };

  const renderProductList = (products: VidalProduct[], state: SectionState) => {
    if (state.loading) return <div className="space-y-2 py-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
    if (state.error) return <p className="text-sm text-destructive py-2">{state.error}</p>;
    if (products.length === 0) return <p className="text-sm text-muted-foreground py-2">Aucun résultat trouvé</p>;
    return (
      <div className="space-y-1.5">
        {products.map((p) => (
          <div key={p.id} className="flex items-center justify-between p-2.5 border rounded-md text-sm">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{p.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {p.company && <span>{p.company}</span>}
                {p.company && p.galenicalForm && <span>•</span>}
                {p.galenicalForm && <span>{p.galenicalForm}</span>}
              </div>
            </div>
            {p.id === productId && <Badge variant="outline" className="ml-2 shrink-0">Actuel</Badge>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Accordion type="single" collapsible onValueChange={handleAccordionChange}>
      <AccordionItem value="generic">
        <AccordionTrigger className="text-sm py-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            <span>Groupe générique</span>
            {genericState.loaded && <Badge variant="secondary" className="ml-1 text-xs">{genericProducts.length}</Badge>}
            {genericState.loading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
        </AccordionTrigger>
        <AccordionContent>{renderProductList(genericProducts, genericState)}</AccordionContent>
      </AccordionItem>

      <AccordionItem value="biosimilar">
        <AccordionTrigger className="text-sm py-3">
          <div className="flex items-center gap-2">
            <Dna className="h-4 w-4 text-primary" />
            <span>Groupe biosimilaire</span>
            {biosimilarState.loaded && <Badge variant="secondary" className="ml-1 text-xs">{biosimilarProducts.length}</Badge>}
            {biosimilarState.loading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
        </AccordionTrigger>
        <AccordionContent>{renderProductList(biosimilarProducts, biosimilarState)}</AccordionContent>
      </AccordionItem>

      <AccordionItem value="vmp">
        <AccordionTrigger className="text-sm py-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span>Même substance active (VMP)</span>
            {vmpState.loaded && <Badge variant="secondary" className="ml-1 text-xs">{vmpProducts.length}</Badge>}
            {vmpState.loading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
        </AccordionTrigger>
        <AccordionContent>{renderProductList(vmpProducts, vmpState)}</AccordionContent>
      </AccordionItem>

      <AccordionItem value="atc">
        <AccordionTrigger className="text-sm py-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            <span>Classification ATC</span>
            {atcState.loaded && <Badge variant="secondary" className="ml-1 text-xs">{atcClassifications.length}</Badge>}
            {atcState.loading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          {atcState.loading && <div className="space-y-2 py-2"><Skeleton className="h-8 w-full" /></div>}
          {atcState.error && <p className="text-sm text-destructive py-2">{atcState.error}</p>}
          {atcState.loaded && !atcState.error && atcClassifications.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">Aucune classification ATC trouvée</p>
          )}
          {atcClassifications.length > 0 && (
            <div className="space-y-1.5">
              {atcClassifications.map((c) => (
                <div key={c.id} className="flex items-center gap-2 p-2.5 border rounded-md text-sm">
                  <Badge variant="outline" className="font-mono shrink-0">{c.code}</Badge>
                  <span className="truncate">{c.label}</span>
                </div>
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default VidalSubstitutionsPanel;
