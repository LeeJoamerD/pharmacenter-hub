import React, { useState } from 'react';
import { Search, Pill, Download, AlertCircle, Loader2, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface VidalPackage {
  id: number;
  name: string;
  productId: number | null;
  cip13: string | null;
  cip7: string | null;
  cis: string | null;
  ucd: string | null;
  company: string | null;
  activeSubstances: string | null;
  galenicalForm: string | null;
  atcClass: string | null;
  publicPrice: number | null;
  refundRate: string | null;
  marketStatus: string | null;
  genericType: string | null;
  isNarcotic: boolean;
  isAssimilatedNarcotic: boolean;
  safetyAlert: boolean;
  isBiosimilar: boolean;
  isDoping: boolean;
  hasRestrictedPrescription: boolean;
  drugInSport: boolean;
  tfr: number | null;
  ucdPrice: number | null;
}

interface VidalVersionInfo {
  version: string | null;
  weeklyDate: string | null;
  dailyDate: string | null;
  lastVersion: string | null;
  hasUpdate: boolean;
  checkedAt: string;
}

interface Props {
  onSuccess?: () => void;
}

const GlobalCatalogVidalSearch: React.FC<Props> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'label' | 'cip'>('label');
  const [results, setResults] = useState<VidalPackage[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [existingCips, setExistingCips] = useState<Set<string>>(new Set());
  const [credentialsMissing, setCredentialsMissing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VidalVersionInfo | null>(null);
  const [checkingVersion, setCheckingVersion] = useState(false);

  const handleCheckVersion = async () => {
    setCheckingVersion(true);
    try {
      const { data, error } = await supabase.functions.invoke('vidal-search', {
        body: { action: 'check-version' },
      });

      if (error) throw error;

      if (data?.error === 'CREDENTIALS_MISSING') {
        setCredentialsMissing(true);
        return;
      }

      if (data?.error) throw new Error(data.message);

      setVersionInfo(data);

      if (data.hasUpdate) {
        toast.info(`Nouvelle version VIDAL disponible : ${data.version}`);
      } else {
        toast.success(`Base VIDAL à jour (${data.version || 'version inconnue'})`);
      }
    } catch (err: any) {
      console.error('Version check error:', err);
      toast.error('Erreur lors de la vérification de version VIDAL');
    } finally {
      setCheckingVersion(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setSearching(true);
    setCredentialsMissing(false);
    setHasSearched(true);
    setSelected(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('vidal-search', {
        body: { action: 'search', query: query.trim(), searchMode, pageSize: 50 },
      });

      if (error) throw error;

      if (data?.error === 'CREDENTIALS_MISSING') {
        setCredentialsMissing(true);
        setResults([]);
        return;
      }

      if (data?.error) {
        throw new Error(data.message || 'Erreur API VIDAL');
      }

      const packages: VidalPackage[] = data.packages || [];
      setResults(packages);
      setTotalResults(data.totalResults || 0);

      const cips = packages.map(p => p.cip13).filter(Boolean) as string[];
      if (cips.length > 0) {
        const { data: existing } = await supabase
          .from('catalogue_global_produits')
          .select('code_cip')
          .in('code_cip', cips);

        setExistingCips(new Set((existing || []).map(e => e.code_cip)));
      }
    } catch (err: any) {
      console.error('Search error:', err);
      toast.error('Erreur lors de la recherche VIDAL');
    } finally {
      setSearching(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map(r => r.id)));
    }
  };

  const handleImport = async () => {
    const toImport = results.filter(r => selected.has(r.id) && r.cip13);
    if (toImport.length === 0) {
      toast.error('Aucun produit sélectionné avec un code CIP valide');
      return;
    }

    setImporting(true);
    try {
      const products = toImport.map(p => ({
        code_cip: p.cip13!,
        ancien_code_cip: p.cip7 || null,
        libelle_produit: p.name,
        libelle_laboratoire: p.company || null,
        libelle_dci: p.activeSubstances || null,
        libelle_forme: p.galenicalForm || null,
        libelle_classe_therapeutique: p.atcClass || null,
        // Prix NON importés - gérés manuellement
        tva: false,
        vidal_product_id: p.productId || null,
        vidal_package_id: p.id,
        code_cis: p.cis || null,
        code_ucd: p.ucd || null,
        market_status: p.marketStatus || null,
        refund_rate: p.refundRate || null,
        generic_type: p.genericType || null,
        is_narcotic: p.isNarcotic || null,
        is_assimilated_narcotic: p.isAssimilatedNarcotic || null,
        safety_alert: p.safetyAlert || null,
        is_biosimilar: p.isBiosimilar || false,
        is_doping: p.isDoping || false,
        has_restricted_prescription: p.hasRestrictedPrescription || false,
        drug_in_sport: p.drugInSport || false,
        tfr: p.tfr || null,
        ucd_price: p.ucdPrice || null,
        vidal_updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('catalogue_global_produits')
        .upsert(products as any, { onConflict: 'code_cip' });

      if (error) throw error;

      toast.success(`${products.length} produit(s) importé(s) avec succès`);
      setSelected(new Set());

      const newCips = new Set(existingCips);
      products.forEach(p => newCips.add(p.code_cip));
      setExistingCips(newCips);

      onSuccess?.();
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error("Erreur lors de l'import des produits");
    } finally {
      setImporting(false);
    }
  };

  if (credentialsMissing) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">Credentials VIDAL non configurés</p>
              <p className="text-sm text-muted-foreground mt-1">
                Les paramètres de connexion à l'API VIDAL (App ID, App Key, URL) ne sont pas configurés.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-2"
                onClick={() => navigate('/platform-admin/configuration')}
              >
                <ExternalLink className="h-4 w-4" />
                Configurer dans Administration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Version check & Search bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Recherche dans la base VIDAL
            </CardTitle>
            <div className="flex items-center gap-2">
              {versionInfo && (
                <Badge variant="outline" className="text-xs gap-1">
                  VIDAL {versionInfo.version || '?'}
                  {versionInfo.hasUpdate && <span className="text-orange-500">• MAJ disponible</span>}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckVersion}
                disabled={checkingVersion}
                className="gap-2"
              >
                {checkingVersion ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Vérifier MAJ
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {versionInfo?.hasUpdate && (
            <Alert>
              <AlertDescription className="text-sm">
                Nouvelle version VIDAL <strong>{versionInfo.version}</strong> disponible
                (hebdomadaire: {versionInfo.weeklyDate || '—'}, quotidienne: {versionInfo.dailyDate || '—'}).
                Ancienne version: {versionInfo.lastVersion || 'aucune'}.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex gap-3">
            <Select value={searchMode} onValueChange={(v: 'label' | 'cip') => setSearchMode(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="label">Par libellé</SelectItem>
                <SelectItem value="cip">Par code CIP</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={searchMode === 'label' ? 'Nom du produit...' : 'Code CIP13...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching || !query.trim()} className="gap-2">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {totalResults > 0 ? `${totalResults} résultat(s)` : 'Aucun résultat'}
              </CardTitle>
              {selected.size > 0 && (
                <Button onClick={handleImport} disabled={importing} className="gap-2">
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Importer la sélection ({selected.size})
                </Button>
              )}
            </div>
          </CardHeader>
          {results.length > 0 && (
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selected.size === results.length && results.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>CIP13</TableHead>
                    <TableHead>Forme</TableHead>
                    <TableHead>Laboratoire</TableHead>
                    <TableHead>Prix (info)</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Indicateurs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((pkg) => {
                    const exists = pkg.cip13 ? existingCips.has(pkg.cip13) : false;
                    return (
                      <TableRow key={pkg.id}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(pkg.id)}
                            onCheckedChange={() => toggleSelect(pkg.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{pkg.name}</span>
                            {exists && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <CheckCircle2 className="h-3 w-3" />
                                Existant
                              </Badge>
                            )}
                          </div>
                          {pkg.activeSubstances && (
                            <p className="text-xs text-muted-foreground mt-0.5">{pkg.activeSubstances}</p>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{pkg.cip13 || '—'}</TableCell>
                        <TableCell className="text-sm">{pkg.galenicalForm || '—'}</TableCell>
                        <TableCell className="text-sm">{pkg.company || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {pkg.publicPrice != null ? `${pkg.publicPrice.toFixed(2)} €` : '—'}
                          {pkg.tfr != null && (
                            <span className="block text-xs">TFR: {pkg.tfr.toFixed(2)} €</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {pkg.marketStatus && (
                            <Badge variant={pkg.marketStatus === 'AVAILABLE' ? 'default' : 'outline'} className="text-xs">
                              {pkg.marketStatus}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {pkg.isNarcotic && <Badge variant="destructive" className="text-xs">Stupéfiant</Badge>}
                            {pkg.isAssimilatedNarcotic && <Badge variant="destructive" className="text-xs">Assimilé stup.</Badge>}
                            {pkg.isBiosimilar && <Badge className="text-xs bg-blue-500">Biosimilaire</Badge>}
                            {pkg.isDoping && <Badge variant="destructive" className="text-xs">Dopant</Badge>}
                            {pkg.hasRestrictedPrescription && <Badge className="text-xs bg-orange-500">Prescription restreinte</Badge>}
                            {pkg.genericType && <Badge variant="outline" className="text-xs">{pkg.genericType}</Badge>}
                            {pkg.refundRate && <Badge variant="secondary" className="text-xs">{pkg.refundRate}</Badge>}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default GlobalCatalogVidalSearch;
