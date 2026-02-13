import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Upload, List, Pill } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import GlobalCatalogImport from './GlobalCatalogImport';
import GlobalCatalogTable from './GlobalCatalogTable';
import GlobalCatalogVidalSearch from './GlobalCatalogVidalSearch';

const GlobalCatalogManager = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [refreshKey, setRefreshKey] = useState(0);
  const [vidalVersion, setVidalVersion] = useState<string | null>(null);

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
        <p className="text-muted-foreground mt-1">
          Gérez le catalogue complet des produits pharmaceutiques accessible par toutes les pharmacies
        </p>
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
    </div>
  );
};

export default GlobalCatalogManager;
