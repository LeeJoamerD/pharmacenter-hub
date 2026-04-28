import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Upload, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import GlobalCatalogImport from './GlobalCatalogImport';
import GlobalCatalogTable from './GlobalCatalogTable';

const RDC_TABLE = 'catalogue_global_produits_rdc' as const;

const GlobalCatalogRDCManager = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleImportSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setActiveTab('list');
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Catalogue Global des Produits — RDC
          </h1>
          <Badge variant="outline" className="text-xs">
            République Démocratique du Congo
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Catalogue produit dédié aux pharmacies de la République Démocratique du Congo, isolé du catalogue Congo Brazzaville.
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
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <GlobalCatalogTable key={refreshKey} tableName={RDC_TABLE} />
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <GlobalCatalogImport onSuccess={handleImportSuccess} tableName={RDC_TABLE} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GlobalCatalogRDCManager;
