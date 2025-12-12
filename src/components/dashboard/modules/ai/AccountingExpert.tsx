import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calculator,
  FileText,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Settings,
  Download,
  Search,
  Bot,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAccountingExpert } from '@/hooks/useAccountingExpert';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useTenant } from '@/contexts/TenantContext';
import AccountingExpertConfigDialog from './dialogs/AccountingExpertConfigDialog';
import AccountEntryDetailDialog from './dialogs/AccountEntryDetailDialog';
import AccountingAnomalyDetailDialog from './dialogs/AccountingAnomalyDetailDialog';
import TaxOptimizationDialog from './dialogs/TaxOptimizationDialog';
import FiscalObligationDialog from './dialogs/FiscalObligationDialog';
import AIAccountingConsultationDialog from './dialogs/AIAccountingConsultationDialog';
import {
  exportChartOfAccountsPDF,
  exportChartOfAccountsExcel,
  exportAnomaliesPDF,
  exportOptimizationsPDF,
  exportFiscalCalendarPDF,
  exportEntriesPDF,
} from '@/utils/accountingExpertExportUtils';

const AccountingExpert: React.FC = () => {
  const { currentTenant } = useTenant();
  const { formatAmount } = useCurrencyFormatting();
  const {
    isLoading,
    metrics,
    anomalies,
    optimizations,
    obligations,
    entries,
    consultations,
    config,
    chartOfAccounts,
    loadMetrics,
    detectAnomalies,
    resolveAnomaly,
    dismissAnomaly,
    implementOptimization,
    rejectOptimization,
    askAI,
    rateConsultation,
    saveConfig,
    markObligationPaid,
  } = useAccountingExpert();

  const [activeTab, setActiveTab] = useState('plan');
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  
  // Dialogs
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [entryDetailDialogOpen, setEntryDetailDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [anomalyDetailDialogOpen, setAnomalyDetailDialogOpen] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
  const [optimizationDialogOpen, setOptimizationDialogOpen] = useState(false);
  const [selectedOptimization, setSelectedOptimization] = useState<any>(null);
  const [obligationDialogOpen, setObligationDialogOpen] = useState(false);
  const [selectedObligation, setSelectedObligation] = useState<any>(null);
  const [aiConsultationDialogOpen, setAiConsultationDialogOpen] = useState(false);

  const pharmacyName = currentTenant?.name || 'PharmaSoft';

  // Filtered chart of accounts
  const filteredAccounts = chartOfAccounts.filter((account) => {
    const matchesSearch =
      account.numero_compte?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.libelle_compte?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !classFilter || String(account.classe) === classFilter;
    return matchesSearch && matchesClass;
  });

  // Get unique classes
  const accountClasses = [...new Set(chartOfAccounts.map((a) => a.classe).filter(Boolean))].sort();

  // Severity badge
  const getSeverityBadge = (severity: string) => {
    const config: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return config[severity] || 'bg-gray-100';
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
      investigating: { color: 'bg-blue-100 text-blue-800', label: 'En cours' },
      resolved: { color: 'bg-green-100 text-green-800', label: 'Résolu' },
      dismissed: { color: 'bg-gray-100 text-gray-800', label: 'Ignoré' },
      suggested: { color: 'bg-blue-100 text-blue-800', label: 'Suggéré' },
      implemented: { color: 'bg-green-100 text-green-800', label: 'Implémenté' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejeté' },
    };
    return config[status] || { color: 'bg-gray-100', label: status };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Expert Comptable IA
          </h2>
          <p className="text-muted-foreground">
            Assistant comptable et fiscal intelligent - {config?.accounting_system || 'SYSCOHADA'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAiConsultationDialogOpen(true)}>
            <Bot className="h-4 w-4 mr-2" />
            Consulter l'IA
          </Button>
          <Button variant="outline" onClick={() => setConfigDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Écritures</p>
                <p className="text-2xl font-bold">{metrics?.entries.total || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics?.entries.balance_rate || 0}% équilibrées
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conformité fiscale</p>
                <p className="text-2xl font-bold">{metrics?.fiscal.compliance_rate || 0}%</p>
                <p className="text-xs text-muted-foreground">
                  {metrics?.fiscal.upcoming || 0} à venir
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Anomalies</p>
                <p className="text-2xl font-bold text-orange-600">{metrics?.anomalies.pending || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics?.anomalies.resolved || 0} résolues
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Économies fiscales</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatAmount(metrics?.optimizations.realized_savings || 0)}
                </p>
                <p className="text-xs text-muted-foreground">réalisées</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plan">Plan Comptable</TabsTrigger>
          <TabsTrigger value="ecritures">Écritures</TabsTrigger>
          <TabsTrigger value="anomalies">
            Anomalies
            {(metrics?.anomalies.pending || 0) > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {metrics?.anomalies.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
          <TabsTrigger value="optimisation">Optimisation</TabsTrigger>
        </TabsList>

        {/* Plan Comptable Tab */}
        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Plan Comptable {config?.accounting_system || 'SYSCOHADA'}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportChartOfAccountsPDF(chartOfAccounts, { pharmacyName })}
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportChartOfAccountsExcel(chartOfAccounts, { pharmacyName })}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un compte..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="">Toutes les classes</option>
                  {accountClasses.map((c) => (
                    <option key={c} value={c}>
                      Classe {c}
                    </option>
                  ))}
                </select>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-1">
                  {filteredAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{account.numero_compte}</Badge>
                        <span>{account.libelle_compte}</span>
                      </div>
                      <Badge variant="secondary">Classe {account.classe}</Badge>
                    </div>
                  ))}
                  {filteredAccounts.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun compte trouvé
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Écritures Tab */}
        <TabsContent value="ecritures" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Écritures Comptables</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportEntriesPDF(entries, { pharmacyName })}
              >
                <Download className="h-4 w-4 mr-1" />
                Exporter
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedEntry(entry);
                        setEntryDetailDialogOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{entry.numero_piece}</Badge>
                        <div>
                          <p className="font-medium">{entry.libelle}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.date_ecriture && format(new Date(entry.date_ecriture), 'dd/MM/yyyy', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusBadge(entry.statut).color}>
                          {getStatusBadge(entry.statut).label}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  {entries.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune écriture trouvée
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Anomalies Comptables</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={detectAnomalies} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Détecter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportAnomaliesPDF(anomalies, { pharmacyName })}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {anomalies.map((anomaly) => (
                    <div
                      key={anomaly.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedAnomaly(anomaly);
                        setAnomalyDetailDialogOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <AlertTriangle className={`h-5 w-5 ${anomaly.severity === 'critical' || anomaly.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                        <div>
                          <p className="font-medium">{anomaly.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {anomaly.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityBadge(anomaly.severity)}>
                          {anomaly.severity}
                        </Badge>
                        <Badge className={getStatusBadge(anomaly.status).color}>
                          {getStatusBadge(anomaly.status).label}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {anomalies.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune anomalie détectée
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fiscal Tab */}
        <TabsContent value="fiscal" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Calendrier Fiscal</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportFiscalCalendarPDF(obligations, { pharmacyName })}
              >
                <Download className="h-4 w-4 mr-1" />
                Exporter
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {obligations.map((obligation) => {
                    const dueDate = new Date(obligation.prochaine_echeance);
                    const isOverdue = dueDate < new Date() && obligation.statut === 'en_attente';
                    return (
                      <div
                        key={obligation.id}
                        className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}
                        onClick={() => {
                          setSelectedObligation(obligation);
                          setObligationDialogOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          {isOverdue ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : obligation.statut === 'payee' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-medium">{obligation.type_obligation}</p>
                            <p className="text-sm text-muted-foreground">
                              {obligation.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium text-sm">
                              {obligation.frequence || 'Non définie'}
                            </p>
                            <p className={`text-sm ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                              {format(dueDate, 'dd/MM/yyyy', { locale: fr })}
                            </p>
                          </div>
                          <Badge className={obligation.statut === 'payee' ? 'bg-green-100 text-green-800' : isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                            {obligation.statut === 'payee' ? 'Payée' : isOverdue ? 'En retard' : 'En attente'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  {obligations.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune obligation fiscale trouvée
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimisation Tab */}
        <TabsContent value="optimisation" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Optimisations Fiscales</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportOptimizationsPDF(optimizations, { pharmacyName })}
              >
                <Download className="h-4 w-4 mr-1" />
                Exporter
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {optimizations.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedOptimization(opt);
                        setOptimizationDialogOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{opt.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {opt.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-green-600">
                            +{(opt.estimated_savings || 0).toLocaleString('fr-FR')} FCFA
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Confiance: {((opt.confidence || 0) * 100).toFixed(0)}%
                          </p>
                        </div>
                        <Badge className={getStatusBadge(opt.status).color}>
                          {getStatusBadge(opt.status).label}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {optimizations.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune optimisation suggérée
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AccountingExpertConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        config={config}
        onSave={saveConfig}
      />

      <AccountEntryDetailDialog
        open={entryDetailDialogOpen}
        onOpenChange={setEntryDetailDialogOpen}
        entry={selectedEntry}
      />

      <AccountingAnomalyDetailDialog
        open={anomalyDetailDialogOpen}
        onOpenChange={setAnomalyDetailDialogOpen}
        anomaly={selectedAnomaly}
        onResolve={resolveAnomaly}
        onDismiss={dismissAnomaly}
      />

      <TaxOptimizationDialog
        open={optimizationDialogOpen}
        onOpenChange={setOptimizationDialogOpen}
        optimization={selectedOptimization}
        onImplement={implementOptimization}
        onReject={rejectOptimization}
      />

      <FiscalObligationDialog
        open={obligationDialogOpen}
        onOpenChange={setObligationDialogOpen}
        obligation={selectedObligation}
        onMarkPaid={markObligationPaid}
      />

      <AIAccountingConsultationDialog
        open={aiConsultationDialogOpen}
        onOpenChange={setAiConsultationDialogOpen}
        onAsk={askAI}
        onRate={rateConsultation}
        consultations={consultations}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AccountingExpert;
