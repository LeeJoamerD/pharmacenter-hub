import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Upload, List, Pill, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import GlobalCatalogImport from './GlobalCatalogImport';
import GlobalCatalogTable from './GlobalCatalogTable';
import GlobalCatalogVidalSearch from './GlobalCatalogVidalSearch';

interface DiffResult {
  changed: { id: string; nom: string; vidalProductId: number; oldStatus: string | null; newStatus: string | null }[];
  removed: { id: string; nom: string; vidalProductId: number; oldStatus: string | null }[];
  checkedCount: number;
  totalProducts: number;
}

const GlobalCatalogManager = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [refreshKey, setRefreshKey] = useState(0);
  const [vidalVersion, setVidalVersion] = useState<string | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);

  useEffect(() => {
    const fetchVidalVersion = async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'VIDAL_LAST_VERSION')
        .single();
      if (data?.setting_value) setVidalVersion(data.setting_value);
    };
    fetchVidalVersion();
  }, []);

  const handleImportSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('list');
  };

  const handleDiffCatalog = async () => {
    setDiffLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vidal-search', {
        body: { action: 'diff-catalog' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.message);
      setDiffResult(data);
      setDiffDialogOpen(true);
    } catch (e: any) {
      toast.error('Erreur lors de la vérification', { description: e.message });
    } finally {
      setDiffLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8" />
            Catalogue Global des Produits
          </h1>
          {vidalVersion && (
            <Badge variant="outline" className="text-xs">
              VIDAL {vidalVersion}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-muted-foreground">
            Gérez le catalogue complet des produits pharmaceutiques accessible par toutes les pharmacies
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDiffCatalog}
            disabled={diffLoading}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${diffLoading ? 'animate-spin' : ''}`} />
            {diffLoading ? 'Vérification...' : 'Vérifier les changements VIDAL'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Liste des produits
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            Importer depuis Excel
          </TabsTrigger>
          <TabsTrigger value="vidal" className="gap-2">
            <Pill className="h-4 w-4" />
            Recherche VIDAL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <GlobalCatalogTable key={refreshKey} />
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <GlobalCatalogImport onSuccess={handleImportSuccess} />
        </TabsContent>

        <TabsContent value="vidal" className="mt-6">
          <GlobalCatalogVidalSearch onSuccess={handleImportSuccess} />
        </TabsContent>
      </Tabs>

      {/* Diff dialog */}
      <Dialog open={diffDialogOpen} onOpenChange={setDiffDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Résultats de la vérification VIDAL</DialogTitle>
            <DialogDescription>
              {diffResult && `${diffResult.checkedCount} / ${diffResult.totalProducts} produits vérifiés`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1">
            {diffResult && (
              <div className="space-y-4 py-2">
                {diffResult.changed.length === 0 && diffResult.removed.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    ✅ Aucun changement détecté — le catalogue est à jour.
                  </p>
                ) : (
                  <>
                    {diffResult.changed.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          Statut modifié ({diffResult.changed.length})
                        </h4>
                        <div className="space-y-2">
                          {diffResult.changed.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border text-sm">
                              <span className="font-medium truncate flex-1">{p.nom}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="outline" className="text-xs">{p.oldStatus || '—'}</Badge>
                                <span className="text-muted-foreground">→</span>
                                <Badge variant="secondary" className="text-xs">{p.newStatus}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {diffResult.removed.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-destructive mb-2">
                          Produits retirés ({diffResult.removed.length})
                        </h4>
                        <div className="space-y-2">
                          {diffResult.removed.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border border-destructive/30 bg-destructive/5 text-sm">
                              <span className="font-medium truncate flex-1">{p.nom}</span>
                              <Badge variant="destructive" className="text-xs">Retiré</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GlobalCatalogManager;
