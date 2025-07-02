import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Building2, UserCheck, Truck, FlaskConical } from 'lucide-react';
import InsuranceManager from './partners/InsuranceManager';
import CompanyManager from './partners/CompanyManager';
import ConventionedManager from './partners/ConventionedManager';
import SupplierManager from './partners/SupplierManager';
import LaboratoryManager from './partners/LaboratoryManager';

const PartnerModule = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data pour les métriques
  const partnerMetrics = {
    assureurs: 12,
    societes: 45,
    conventionnes: 28,
    fournisseurs: 67,
    laboratoires: 34
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assureurs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerMetrics.assureurs}</div>
            <p className="text-xs text-muted-foreground">Compagnies d'assurance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sociétés</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerMetrics.societes}</div>
            <p className="text-xs text-muted-foreground">Entreprises partenaires</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conventionnés</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerMetrics.conventionnes}</div>
            <p className="text-xs text-muted-foreground">Établissements conventionnés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fournisseurs</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerMetrics.fournisseurs}</div>
            <p className="text-xs text-muted-foreground">Fournisseurs actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laboratoires</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerMetrics.laboratoires}</div>
            <p className="text-xs text-muted-foreground">Laboratoires pharmaceutiques</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Partenaires Récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Assureur NSIA</p>
                  <p className="text-xs text-muted-foreground">Ajouté il y a 2 jours</p>
                </div>
                <Badge variant="default">Assureur</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Laboratoire Roche</p>
                  <p className="text-xs text-muted-foreground">Ajouté il y a 1 semaine</p>
                </div>
                <Badge variant="secondary">Laboratoire</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Fournisseur COPHAL</p>
                  <p className="text-xs text-muted-foreground">Ajouté il y a 2 semaines</p>
                </div>
                <Badge variant="outline">Fournisseur</Badge>
              </div>
            </div>
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
                onClick={() => setActiveTab('assureurs')}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">Gérer les Assureurs</span>
                </div>
              </button>
              <button 
                className="w-full text-left p-2 rounded hover:bg-muted"
                onClick={() => setActiveTab('fournisseurs')}
              >
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  <span className="text-sm">Gérer les Fournisseurs</span>
                </div>
              </button>
              <button 
                className="w-full text-left p-2 rounded hover:bg-muted"
                onClick={() => setActiveTab('laboratoires')}
              >
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4" />
                  <span className="text-sm">Gérer les Laboratoires</span>
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="assureurs">Assureurs</TabsTrigger>
          <TabsTrigger value="societes">Sociétés</TabsTrigger>
          <TabsTrigger value="conventionnes">Conventionnés</TabsTrigger>
          <TabsTrigger value="fournisseurs">Fournisseurs</TabsTrigger>
          <TabsTrigger value="laboratoires">Laboratoires</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="assureurs">
          <InsuranceManager />
        </TabsContent>

        <TabsContent value="societes">
          <CompanyManager />
        </TabsContent>

        <TabsContent value="conventionnes">
          <ConventionedManager />
        </TabsContent>

        <TabsContent value="fournisseurs">
          <SupplierManager />
        </TabsContent>

        <TabsContent value="laboratoires">
          <LaboratoryManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PartnerModule;