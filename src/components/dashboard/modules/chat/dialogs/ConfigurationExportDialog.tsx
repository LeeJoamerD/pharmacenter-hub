import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  FileText,
  Loader2,
  Settings,
  FileText as FileLog,
  Building,
  MessageSquare
} from 'lucide-react';
import {
  exportPharmaciesToExcel,
  exportPharmaciesToPDF,
  exportAuditLogsToExcel,
  exportAuditLogsToPDF,
  exportChannelsToExcel,
  exportConfigurationToJSON,
  exportNetworkReportToPDF,
  PharmacyExportData,
  AuditLogExportData,
  ChannelExportData,
  ConfigExportData
} from '@/utils/centralAdministrationExportUtils';

interface ConfigurationExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pharmacies: PharmacyExportData[];
  auditLogs: AuditLogExportData[];
  channels: ChannelExportData[];
  config: ConfigExportData[];
  stats: { total_pharmacies: number; active_pharmacies: number; total_channels: number; total_messages: number };
}

type ExportType = 'pharmacies' | 'logs' | 'channels' | 'config' | 'report';
type ExportFormat = 'excel' | 'pdf' | 'json';

const ConfigurationExportDialog = ({
  open,
  onOpenChange,
  pharmacies,
  auditLogs,
  channels,
  config,
  stats
}: ConfigurationExportDialogProps) => {
  const { toast } = useToast();
  const [selectedTypes, setSelectedTypes] = useState<ExportType[]>(['report']);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [exporting, setExporting] = useState(false);

  const exportOptions = [
    { id: 'report', label: 'Rapport complet', icon: FileText, description: 'Rapport synthétique du réseau' },
    { id: 'pharmacies', label: 'Liste des pharmacies', icon: Building, description: `${pharmacies.length} pharmacies` },
    { id: 'channels', label: 'Canaux de communication', icon: MessageSquare, description: `${channels.length} canaux` },
    { id: 'logs', label: 'Logs d\'audit', icon: FileLog, description: `${auditLogs.length} entrées` },
    { id: 'config', label: 'Configuration système', icon: Settings, description: 'Paramètres JSON' }
  ];

  const formatOptions = [
    { id: 'pdf', label: 'PDF', icon: FileText },
    { id: 'excel', label: 'Excel', icon: FileSpreadsheet },
    { id: 'json', label: 'JSON', icon: FileJson }
  ];

  const toggleType = (type: ExportType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleExport = async () => {
    if (selectedTypes.length === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins un type de données à exporter.",
        variant: "destructive"
      });
      return;
    }

    setExporting(true);
    try {
      for (const type of selectedTypes) {
        switch (type) {
          case 'report':
            if (format === 'pdf') {
              exportNetworkReportToPDF(pharmacies, channels, stats);
            } else {
              // For report, always export as PDF or fallback to pharmacies + channels
              exportNetworkReportToPDF(pharmacies, channels, stats);
            }
            break;
          case 'pharmacies':
            if (format === 'excel') {
              exportPharmaciesToExcel(pharmacies);
            } else {
              exportPharmaciesToPDF(pharmacies);
            }
            break;
          case 'channels':
            if (format === 'excel') {
              exportChannelsToExcel(channels);
            }
            break;
          case 'logs':
            if (format === 'excel') {
              exportAuditLogsToExcel(auditLogs);
            } else if (format === 'pdf') {
              exportAuditLogsToPDF(auditLogs);
            }
            break;
          case 'config':
            exportConfigurationToJSON(config);
            break;
        }
      }

      toast({
        title: "Export réussi",
        description: `${selectedTypes.length} fichier(s) exporté(s) avec succès.`
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export de Données
          </DialogTitle>
          <DialogDescription>
            Exportez les données du réseau dans différents formats.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Données à exporter</Label>
            <div className="space-y-2">
              {exportOptions.map(option => (
                <div 
                  key={option.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTypes.includes(option.id as ExportType)
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleType(option.id as ExportType)}
                >
                  <Checkbox 
                    checked={selectedTypes.includes(option.id as ExportType)}
                    onCheckedChange={() => toggleType(option.id as ExportType)}
                  />
                  <option.icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Format d'export</Label>
            <div className="grid grid-cols-3 gap-2">
              {formatOptions.map(option => (
                <div
                  key={option.id}
                  className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    format === option.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setFormat(option.id as ExportFormat)}
                >
                  <option.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Note: La configuration système s'exporte uniquement en JSON.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={exporting || selectedTypes.length === 0}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exporter ({selectedTypes.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigurationExportDialog;
