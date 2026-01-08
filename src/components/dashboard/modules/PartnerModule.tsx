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
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { useLanguage } from '@/contexts/LanguageContext';

const PartnerModule = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { t } = useLanguage();

  // Récupérer les métriques réelles
  const { useTenantQueryWithCache } = useTenantQuery();
  
  const { data: assureurs = [] } = useTenantQueryWithCache(
    ['assureurs-count-v2'],
    'assureurs',
    'id'
  );

  const { data: societes = [] } = useTenantQueryWithCache(
    ['societes-count-v2'],
    'societes',
    'id'
  );

  const { data: conventionnes = [] } = useTenantQueryWithCache(
    ['conventionnes-count-v2'],
    'conventionnes',
    'id'
  );

  const { data: fournisseurs = [] } = useTenantQueryWithCache(
    ['fournisseurs-count-v2'],
    'fournisseurs',
    'id'
  );

  const { data: laboratoires = [] } = useTenantQueryWithCache(
    ['laboratoires-count-v2'],
    'laboratoires',
    'id'
  );

  const partnerMetrics = {
    assureurs: assureurs.length,
    societes: societes.length,
    conventionnes: conventionnes.length,
    fournisseurs: fournisseurs.length,
    laboratoires: laboratoires.length
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('insurers')}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerMetrics.assureurs}</div>
            <p className="text-xs text-muted-foreground">{t('insuranceCompanies')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('companies')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerMetrics.societes}</div>
            <p className="text-xs text-muted-foreground">{t('partnerCompanies')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('conventioned')}</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerMetrics.conventionnes}</div>
            <p className="text-xs text-muted-foreground">{t('conventionedEstablishments')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('suppliers')}</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerMetrics.fournisseurs}</div>
            <p className="text-xs text-muted-foreground">{t('activeSuppliers')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('laboratories')}</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerMetrics.laboratoires}</div>
            <p className="text-xs text-muted-foreground">{t('pharmaLabs')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('recentPartners')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Assureur NSIA</p>
                  <p className="text-xs text-muted-foreground">{t('addedAgo')} 2 {t('days')}</p>
                </div>
                <Badge variant="default">{t('insurers')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Laboratoire Roche</p>
                  <p className="text-xs text-muted-foreground">{t('addedAgo')} 1 {t('week')}</p>
                </div>
                <Badge variant="secondary">{t('laboratories')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Fournisseur COPHAL</p>
                  <p className="text-xs text-muted-foreground">{t('addedAgo')} 2 {t('weeks')}</p>
                </div>
                <Badge variant="outline">{t('suppliers')}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('quickActions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button 
                className="w-full text-left p-2 rounded hover:bg-muted"
                onClick={() => setActiveTab('assureurs')}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">{t('manageInsurers')}</span>
                </div>
              </button>
              <button 
                className="w-full text-left p-2 rounded hover:bg-muted"
                onClick={() => setActiveTab('fournisseurs')}
              >
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  <span className="text-sm">{t('manageSuppliers')}</span>
                </div>
              </button>
              <button 
                className="w-full text-left p-2 rounded hover:bg-muted"
                onClick={() => setActiveTab('laboratoires')}
              >
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4" />
                  <span className="text-sm">{t('manageLabs')}</span>
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
          <TabsTrigger value="overview">{t('partnersOverview')}</TabsTrigger>
          <TabsTrigger value="assureurs">{t('insurers')}</TabsTrigger>
          <TabsTrigger value="societes">{t('companies')}</TabsTrigger>
          <TabsTrigger value="conventionnes">{t('conventioned')}</TabsTrigger>
          <TabsTrigger value="fournisseurs">{t('suppliers')}</TabsTrigger>
          <TabsTrigger value="laboratoires">{t('laboratories')}</TabsTrigger>
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