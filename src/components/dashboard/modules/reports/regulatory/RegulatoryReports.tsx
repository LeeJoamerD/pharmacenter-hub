import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Download
} from 'lucide-react';
import { useRegulatoryReports } from '@/hooks/useRegulatoryReports';
import NarcoticsTab from './tabs/NarcoticsTab';
import TraceabilityTab from './tabs/TraceabilityTab';
import PharmacovigilanceTab from './tabs/PharmacovigilanceTab';
import MandatoryReportsTab from './tabs/MandatoryReportsTab';
import ComplianceTab from './tabs/ComplianceTab';
import { useTenant } from '@/contexts/TenantContext';

const RegulatoryReports = () => {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  
  const {
    // Données
    metricsData,
    narcoticsProducts,
    narcoticsMovements,
    traceability,
    pharmacovigilance,
    mandatoryReports,
    audits,
    complianceActions,
    // États
    isLoading,
    // Mutations
    addNarcoticMovement,
    addPharmacovigilance,
    updatePharmacovigilanceStatus,
    deletePharmacovigilance,
    addMandatoryReport,
    submitReport,
    deleteMandatoryReport,
    addComplianceAction
  } = useRegulatoryReports(period);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  // Métriques de conformité
  const complianceMetrics = [
    {
      title: 'Conformité Globale',
      value: metricsData?.conformityRate ? `${metricsData.conformityRate.toFixed(1)}%` : '—',
      change: metricsData?.conformityRate && metricsData.conformityRate >= 90 ? 'Excellent' : 'À améliorer',
      status: metricsData?.conformityRate && metricsData.conformityRate >= 90 ? 'excellent' : 
              metricsData?.conformityRate && metricsData.conformityRate >= 70 ? 'good' : 'warning',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Rapports Obligatoires',
      value: `${metricsData?.rapportsCompletes || 0}/${metricsData?.totalRapports || 0}`,
      change: metricsData?.rapportsCompletes === metricsData?.totalRapports ? 'Tous à jour' : 'En cours',
      status: metricsData?.rapportsCompletes === metricsData?.totalRapports ? 'excellent' : 'warning',
      icon: FileText,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Lots Tracés',
      value: traceability?.length?.toString() || '0',
      change: 'Traçabilité active',
      status: 'excellent',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Alertes Actives',
      value: metricsData?.alertesActives?.toString() || '0',
      change: metricsData?.alertesActives === 0 ? 'Aucune alerte' : 'À traiter',
      status: metricsData?.alertesActives === 0 ? 'excellent' : 'warning',
      icon: AlertTriangle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ];

  const handleExportCompliance = () => {
    // TODO: Implémenter l'export PDF
    console.log('Export conformité');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rapports Réglementaires</h2>
          <p className="text-muted-foreground">
            Conformité pharmaceutique et rapports obligatoires
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(v: 'week' | 'month' | 'quarter' | 'year') => setPeriod(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportCompliance}>
            <Download className="h-4 w-4 mr-2" />
            Exporter Conformité
          </Button>
        </div>
      </div>

      {/* Métriques de conformité */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {complianceMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : metric.value}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                  <span className="ml-2">{metric.change}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="narcotics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="narcotics">Stupéfiants</TabsTrigger>
          <TabsTrigger value="traceability">Traçabilité</TabsTrigger>
          <TabsTrigger value="pharmacovigilance">Pharmacovigilance</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
          <TabsTrigger value="compliance">Conformité</TabsTrigger>
        </TabsList>

        <TabsContent value="narcotics" className="space-y-6">
          <NarcoticsTab 
            products={narcoticsProducts}
            movements={narcoticsMovements}
            onAddMovement={addNarcoticMovement}
            isLoading={isLoading}
            tenantId={tenantId}
          />
        </TabsContent>

        <TabsContent value="traceability" className="space-y-6">
          <TraceabilityTab 
            lots={traceability}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="pharmacovigilance" className="space-y-6">
          <PharmacovigilanceTab 
            reports={pharmacovigilance}
            onAdd={addPharmacovigilance}
            onUpdateStatus={updatePharmacovigilanceStatus}
            onDelete={deletePharmacovigilance}
            isLoading={isLoading}
            tenantId={tenantId}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <MandatoryReportsTab 
            reports={mandatoryReports}
            onAdd={addMandatoryReport}
            onSubmit={submitReport}
            onDelete={deleteMandatoryReport}
            isLoading={isLoading}
            tenantId={tenantId}
          />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <ComplianceTab 
            audits={audits}
            actions={complianceActions}
            onAddAction={addComplianceAction}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RegulatoryReports;