import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, XCircle, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ComplianceCheck } from '@/hooks/usePharmaceuticalExpert';
import { exportCompliancePDF, exportComplianceExcel } from '@/utils/pharmaExpertExportUtils';

interface ComplianceReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  check: ComplianceCheck | null;
  allChecks: ComplianceCheck[];
  pharmacyName: string;
}

const ComplianceReportDialog: React.FC<ComplianceReportDialogProps> = ({
  open,
  onOpenChange,
  check,
  allChecks,
  pharmacyName
}) => {
  if (!check) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-50 text-green-700 border-green-200';
      case 'warning': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'critical': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'compliant': return 'Conforme';
      case 'warning': return 'Attention';
      case 'critical': return 'Non Conforme';
      default: return 'En attente';
    }
  };

  const complianceRate = check.items_count > 0 
    ? Math.round(((check.items_count - check.issues_count) / check.items_count) * 100)
    : 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(check.status)}
            Rapport de Conformité - {check.category}
          </DialogTitle>
          <DialogDescription>
            Dernier contrôle: {check.last_check_at 
              ? format(new Date(check.last_check_at), 'dd MMMM yyyy à HH:mm', { locale: fr })
              : 'Jamais effectué'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Summary */}
          <div className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}>
            <div className="flex items-center justify-between">
              <div>
                <Badge className={getStatusColor(check.status)}>
                  {getStatusLabel(check.status)}
                </Badge>
                <p className="mt-2 text-2xl font-bold">{complianceRate}%</p>
                <p className="text-sm opacity-75">Taux de conformité</p>
              </div>
              {getStatusIcon(check.status)}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">{check.items_count}</p>
              <p className="text-sm text-muted-foreground">Produits contrôlés</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{check.items_count - check.issues_count}</p>
              <p className="text-sm text-muted-foreground">Conformes</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">{check.issues_count}</p>
              <p className="text-sm text-muted-foreground">Problèmes</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression vers la conformité totale</span>
              <span>{complianceRate}%</span>
            </div>
            <Progress value={complianceRate} className="h-3" />
          </div>

          {/* Issues Details */}
          {check.issues_details.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Problèmes Détectés ({check.issues_details.length})
              </h4>
              <div className="space-y-2">
                {check.issues_details.map((issue, index) => (
                  <div 
                    key={index} 
                    className="p-3 border rounded-lg bg-orange-50 border-orange-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{issue.product}</span>
                      <Badge variant="outline" className="border-orange-300">
                        {issue.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-orange-700 mt-1">{issue.issue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Audit */}
          {check.next_audit_date && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Prochain audit prévu:</strong>{' '}
                {format(new Date(check.next_audit_date), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportCompliancePDF(allChecks, pharmacyName)}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportComplianceExcel(allChecks, pharmacyName)}
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComplianceReportDialog;
