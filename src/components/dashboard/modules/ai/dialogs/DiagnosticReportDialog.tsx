import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Award,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DiagnosticSession, Anomaly, Bottleneck } from '@/hooks/useIntelligentDiagnostic';
import { exportDiagnosticToPDF, exportDiagnosticToExcel } from '@/utils/diagnosticExportUtils';

interface DiagnosticReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: DiagnosticSession | null;
  anomalies: Anomaly[];
  bottlenecks: Bottleneck[];
  pharmacyName: string;
}

const DiagnosticReportDialog: React.FC<DiagnosticReportDialogProps> = ({
  open,
  onOpenChange,
  session,
  anomalies,
  bottlenecks,
  pharmacyName
}) => {
  const [exporting, setExporting] = useState(false);

  if (!session) return null;

  const getStatusBadge = (statusLevel: string) => {
    switch (statusLevel) {
      case 'excellent': return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
      case 'bon': return <Badge className="bg-blue-100 text-blue-800">Bon niveau</Badge>;
      case 'attention': return <Badge className="bg-orange-100 text-orange-800">Attention requise</Badge>;
      case 'critique': return <Badge className="bg-red-100 text-red-800">Critique</Badge>;
      default: return <Badge variant="secondary">{statusLevel}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    if (trend.startsWith('+')) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend.startsWith('-')) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const handleExportPDF = () => {
    setExporting(true);
    setTimeout(() => {
      exportDiagnosticToPDF(session, anomalies, bottlenecks, pharmacyName);
      setExporting(false);
    }, 100);
  };

  const handleExportExcel = () => {
    setExporting(true);
    setTimeout(() => {
      exportDiagnosticToExcel(session, anomalies, bottlenecks, pharmacyName);
      setExporting(false);
    }, 100);
  };

  const sectors = [
    { name: 'Ventes', score: session.sales_score, trend: session.sales_trend, status: session.sales_status, details: session.sales_details },
    { name: 'Stock', score: session.stock_score, trend: session.stock_trend, status: session.stock_status, details: session.stock_details },
    { name: 'Marge', score: session.margin_score, trend: session.margin_trend, status: session.margin_status, details: session.margin_details },
    { name: 'Clients', score: session.customer_score, trend: session.customer_trend, status: session.customer_status, details: session.customer_details }
  ];

  const activeAnomalies = anomalies.filter(a => a.status !== 'resolved' && a.status !== 'dismissed');
  const activeBottlenecks = bottlenecks.filter(b => b.status !== 'resolved');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Rapport de Diagnostic Complet
          </DialogTitle>
          <DialogDescription>
            {pharmacyName} - {format(new Date(session.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="sectors">Secteurs</TabsTrigger>
              <TabsTrigger value="issues">Problèmes</TabsTrigger>
              <TabsTrigger value="trends">Tendances</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Score Global */}
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl">
                <div className="flex items-center gap-4">
                  <Award className="h-12 w-12 text-primary" />
                  <div>
                    <div className={`text-4xl font-bold ${getScoreColor(session.global_score)}`}>
                      {session.global_score}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Score de Performance Globale</p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(session.status_level)}
                  <p className="text-sm text-muted-foreground mt-2">
                    Potentiel d'amélioration: {session.improvement_potential} points
                  </p>
                </div>
              </div>

              <Progress value={session.global_score} className="h-3" />

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4">
                {sectors.map((sector, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(sector.score)}`}>
                      {sector.score}
                    </div>
                    <p className="text-sm font-medium">{sector.name}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {getTrendIcon(sector.trend)}
                      <span className="text-xs text-muted-foreground">{sector.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">Anomalies Actives</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{activeAnomalies.length}</div>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-800">Goulots Actifs</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{activeBottlenecks.length}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sectors" className="mt-6 space-y-4">
              {sectors.map((sector, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl font-bold ${getScoreColor(sector.score)}`}>
                        {sector.score}
                      </div>
                      <div>
                        <h4 className="font-semibold">{sector.name}</h4>
                        <p className="text-sm text-muted-foreground">{sector.details || 'Aucun détail disponible'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(sector.trend)}
                      <span className="font-medium">{sector.trend}</span>
                    </div>
                  </div>
                  <Progress value={sector.score} className="h-2" />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="issues" className="mt-6 space-y-6">
              {/* Anomalies */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Anomalies ({anomalies.length})
                </h4>
                <div className="space-y-2">
                  {anomalies.slice(0, 5).map((anomaly) => (
                    <div key={anomaly.id} className="p-3 bg-muted rounded-lg flex items-center justify-between">
                      <div>
                        <Badge variant="outline" className={`mr-2 ${
                          anomaly.type === 'critique' ? 'border-red-500' :
                          anomaly.type === 'warning' ? 'border-orange-500' : 'border-blue-500'
                        }`}>
                          {anomaly.type}
                        </Badge>
                        <span className="font-medium">{anomaly.title}</span>
                      </div>
                      <Badge variant="secondary">
                        {anomaly.status === 'detected' ? 'Détectée' : 
                         anomaly.status === 'investigating' ? 'Investigation' : 
                         anomaly.status === 'resolved' ? 'Résolue' : 'Ignorée'}
                      </Badge>
                    </div>
                  ))}
                  {anomalies.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">Aucune anomalie détectée</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Bottlenecks */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Goulots d'Étranglement ({bottlenecks.length})
                </h4>
                <div className="space-y-2">
                  {bottlenecks.slice(0, 5).map((bottleneck) => (
                    <div key={bottleneck.id} className="p-3 bg-muted rounded-lg flex items-center justify-between">
                      <div>
                        <Badge variant="outline" className={`mr-2 ${
                          bottleneck.severity === 'high' ? 'border-red-500' :
                          bottleneck.severity === 'medium' ? 'border-orange-500' : 'border-green-500'
                        }`}>
                          P{bottleneck.priority}
                        </Badge>
                        <span className="font-medium">{bottleneck.area}</span>
                      </div>
                      <Badge variant="secondary">
                        {bottleneck.status === 'identified' ? 'Identifié' :
                         bottleneck.status === 'analyzing' ? 'Analyse' :
                         bottleneck.status === 'action_planned' ? 'Planifié' : 'Résolu'}
                      </Badge>
                    </div>
                  ))}
                  {bottlenecks.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">Aucun goulot identifié</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Positive Trends */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Tendances Positives
                  </h4>
                  <ul className="space-y-2">
                    {session.positive_trends.map((trend, index) => (
                      <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {trend.text}
                      </li>
                    ))}
                    {session.positive_trends.length === 0 && (
                      <li className="text-sm text-green-600 italic">Aucune tendance positive détectée</li>
                    )}
                  </ul>
                </div>

                {/* Attention Points */}
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Points d'Attention
                  </h4>
                  <ul className="space-y-2">
                    {session.attention_points.map((point, index) => (
                      <li key={index} className="text-sm text-orange-700 flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        {point.text}
                      </li>
                    ))}
                    {session.attention_points.length === 0 && (
                      <li className="text-sm text-orange-600 italic">Aucun point d'attention</li>
                    )}
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button variant="secondary" onClick={handleExportExcel} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={handleExportPDF} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DiagnosticReportDialog;
