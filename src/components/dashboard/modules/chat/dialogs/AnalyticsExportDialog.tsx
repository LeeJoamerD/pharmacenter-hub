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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, FileText, Download, BarChart, Users, Map, Zap, Activity } from 'lucide-react';
import type { 
  AnalyticsMetric, 
  NetworkInsight, 
  HeatmapData, 
  TimeSeriesData,
  CollaborationStats 
} from '@/hooks/useNetworkAdvancedAnalytics';

interface AnalyticsExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: AnalyticsMetric[];
  insights: NetworkInsight[];
  heatmapData: HeatmapData[];
  timeSeriesData: TimeSeriesData[];
  collaborationStats?: CollaborationStats | null;
  timeframe?: string;
  onExport?: (format: 'excel' | 'pdf', options: ExportOptions) => Promise<void>;
}

export interface ExportOptions {
  includeMetrics: boolean;
  includeInsights: boolean;
  includeHeatmap: boolean;
  includeTimeSeries: boolean;
  includeCollaboration: boolean;
  timeframe: string;
}

const AnalyticsExportDialog = ({
  open,
  onOpenChange,
  metrics,
  insights,
  heatmapData,
  timeSeriesData,
  collaborationStats = null,
  timeframe = '7d',
  onExport,
}: AnalyticsExportDialogProps) => {
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [options, setOptions] = useState<ExportOptions>({
    includeMetrics: true,
    includeInsights: true,
    includeHeatmap: true,
    includeTimeSeries: true,
    includeCollaboration: true,
    timeframe: '7d'
  });
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      if (onExport) {
        await onExport(format, { ...options, timeframe });
      } else {
        // Default export using utility
        const utils = await import('@/utils/networkAnalyticsExportUtils');
        const data = { metrics, insights, heatmapData, timeSeriesData, collaborationStats };
        if (format === 'excel') {
          utils.exportNetworkAnalyticsToExcel(data, options, 'analytics-reseau');
        } else {
          utils.exportNetworkAnalyticsToPDF(data, options, 'analytics-reseau');
        }
      }
      onOpenChange(false);
    } finally {
      setExporting(false);
    }
  };

  const toggleOption = (key: keyof ExportOptions) => {
    if (typeof options[key] === 'boolean') {
      setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const dataStats = {
    metrics: metrics.length,
    insights: insights.length,
    pharmacies: heatmapData.length,
    days: timeSeriesData.length,
    projects: collaborationStats?.activeProjects?.length || 0
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exporter les Analytics
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les données à exporter et le format souhaité.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format selection */}
          <div className="space-y-2">
            <Label>Format d'export</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={format === 'excel' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => setFormat('excel')}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel (.xlsx)
              </Button>
              <Button
                variant={format === 'pdf' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => setFormat('pdf')}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {/* Period selection */}
          <div className="space-y-2">
            <Label>Période des données</Label>
            <Select value={options.timeframe} onValueChange={(v) => setOptions(prev => ({ ...prev, timeframe: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Dernières 24 heures</SelectItem>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">90 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data selection */}
          <div className="space-y-3">
            <Label>Données à inclure</Label>
            
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="metrics" 
                    checked={options.includeMetrics}
                    onCheckedChange={() => toggleOption('includeMetrics')}
                  />
                  <label htmlFor="metrics" className="flex items-center gap-2 cursor-pointer">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Métriques KPI</span>
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">{dataStats.metrics} métriques</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="insights" 
                    checked={options.includeInsights}
                    onCheckedChange={() => toggleOption('includeInsights')}
                  />
                  <label htmlFor="insights" className="flex items-center gap-2 cursor-pointer">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Insights</span>
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">{dataStats.insights} insights</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="heatmap" 
                    checked={options.includeHeatmap}
                    onCheckedChange={() => toggleOption('includeHeatmap')}
                  />
                  <label htmlFor="heatmap" className="flex items-center gap-2 cursor-pointer">
                    <Map className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Carte de chaleur</span>
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">{dataStats.pharmacies} pharmacies</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="timeseries" 
                    checked={options.includeTimeSeries}
                    onCheckedChange={() => toggleOption('includeTimeSeries')}
                  />
                  <label htmlFor="timeseries" className="flex items-center gap-2 cursor-pointer">
                    <BarChart className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Données temporelles</span>
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">{dataStats.days} jours</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="collaboration" 
                    checked={options.includeCollaboration}
                    onCheckedChange={() => toggleOption('includeCollaboration')}
                  />
                  <label htmlFor="collaboration" className="flex items-center gap-2 cursor-pointer">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Collaboration</span>
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">{dataStats.projects} projets</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>Exportation...</>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnalyticsExportDialog;
