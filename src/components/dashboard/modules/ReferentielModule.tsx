import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Grid3X3, Tags, Pill, FileText, ShieldCheck } from 'lucide-react';

import FamilyManager from './referentiel/FamilyManager';
import FormesManager from './referentiel/FormesManager';
import RayonManager from './referentiel/RayonManager';
import PricingCategories from './referentiel/PricingCategories';
import DCIManager from './referentiel/DCIManager';
import ProductCatalog from './referentiel/ProductCatalog';
import RegulationTracker from './referentiel/RegulationTracker';
import { TherapeuticClassManager } from './referentiel/TherapeuticClassManager';
import { useReferentielMetrics, useRecentProducts } from '@/hooks/useReferentielMetrics';

const ReferentielModule = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch real-time metrics
  const referentielMetrics = useReferentielMetrics();
  const { products: recentProducts, isLoading: loadingRecentProducts } = useRecentProducts(3);


  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referentielMetrics.produits}</div>
            <p className="text-xs text-muted-foreground">Produits référencés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Familles</CardTitle>
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referentielMetrics.familles}</div>
            <p className="text-xs text-muted-foreground">Familles de produits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formes</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referentielMetrics.formes}</div>
            <p className="text-xs text-muted-foreground">Formes galéniques</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rayons</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referentielMetrics.rayons}</div>
            <p className="text-xs text-muted-foreground">Rayons organisationnels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catégories</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referentielMetrics.categories}</div>
            <p className="text-xs text-muted-foreground">Catégories tarifaires</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DCI</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referentielMetrics.dci}</div>
            <p className="text-xs text-muted-foreground">Principes actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réglementations</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referentielMetrics.reglementations}</div>
            <p className="text-xs text-muted-foreground">Statuts réglementaires</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Produits Récents</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRecentProducts ? (
              <div className="text-center py-4">Chargement...</div>
            ) : (
              <div className="space-y-4">
                {recentProducts.length > 0 ? (
                  recentProducts.map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{product.libelle_produit}</p>
                        <p className="text-xs text-muted-foreground">
                          Ajouté {new Date(product.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Badge variant="default">Produit</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun produit récent</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button 
                className="w-full text-left p-2 rounded hover:bg-muted"
                onClick={() => setActiveTab('catalog')}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="text-sm">Gérer le Catalogue</span>
                </div>
              </button>
              <button 
                className="w-full text-left p-2 rounded hover:bg-muted"
                onClick={() => setActiveTab('familles')}
              >
                <div className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  <span className="text-sm">Gérer les Familles</span>
                </div>
              </button>
              <button 
                className="w-full text-left p-2 rounded hover:bg-muted"
                onClick={() => setActiveTab('categories')}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Gérer les Catégories</span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="catalog">Catalogue</TabsTrigger>
          <TabsTrigger value="formes">Formes</TabsTrigger>
          <TabsTrigger value="familles">Familles</TabsTrigger>
          <TabsTrigger value="rayons">Rayons</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="dci">DCI</TabsTrigger>
          <TabsTrigger value="classes">Classes thérapeutiques</TabsTrigger>
          <TabsTrigger value="reglementations">Réglementations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="catalog">
          <ProductCatalog />
        </TabsContent>

        <TabsContent value="formes">
          <FormesManager />
        </TabsContent>

        <TabsContent value="familles">
          <FamilyManager />
        </TabsContent>

        <TabsContent value="rayons">
          <RayonManager />
        </TabsContent>

        <TabsContent value="categories">
          <PricingCategories />
        </TabsContent>

        <TabsContent value="dci">
          <DCIManager />
        </TabsContent>

        <TabsContent value="classes">
          <TherapeuticClassManager />
        </TabsContent>

        <TabsContent value="reglementations">
          <RegulationTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReferentielModule;