import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Settings, Bell, Calendar, Calculator } from 'lucide-react';

interface AccountingExpertConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: any;
  onSave: (config: any) => Promise<boolean>;
}

const AccountingExpertConfigDialog: React.FC<AccountingExpertConfigDialogProps> = ({
  open,
  onOpenChange,
  config,
  onSave,
}) => {
  const [formData, setFormData] = React.useState({
    enable_auto_anomaly_detection: true,
    anomaly_detection_frequency: 'daily',
    enable_tax_optimization_suggestions: true,
    optimization_check_frequency: 'weekly',
    enable_fiscal_reminders: true,
    reminder_days_before: 7,
    accounting_system: 'SYSCOHADA',
    fiscal_year_start_month: 1,
    auto_reconciliation: false,
    min_anomaly_severity: 'medium',
  });
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (config) {
      setFormData({
        enable_auto_anomaly_detection: config.enable_auto_anomaly_detection ?? true,
        anomaly_detection_frequency: config.anomaly_detection_frequency || 'daily',
        enable_tax_optimization_suggestions: config.enable_tax_optimization_suggestions ?? true,
        optimization_check_frequency: config.optimization_check_frequency || 'weekly',
        enable_fiscal_reminders: config.enable_fiscal_reminders ?? true,
        reminder_days_before: config.reminder_days_before || 7,
        accounting_system: config.accounting_system || 'SYSCOHADA',
        fiscal_year_start_month: config.fiscal_year_start_month || 1,
        auto_reconciliation: config.auto_reconciliation ?? false,
        min_anomaly_severity: config.min_anomaly_severity || 'medium',
      });
    }
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSave(formData);
    setIsSaving(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Expert Comptable IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Système comptable */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Système Comptable
            </Label>
            <Select
              value={formData.accounting_system}
              onValueChange={(value) => setFormData({ ...formData, accounting_system: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SYSCOHADA">SYSCOHADA (OHADA)</SelectItem>
                <SelectItem value="PCG">PCG (Plan Comptable Général)</SelectItem>
                <SelectItem value="IFRS">IFRS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Début exercice fiscal */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Mois de début de l'exercice fiscal
            </Label>
            <Select
              value={formData.fiscal_year_start_month.toString()}
              onValueChange={(value) => setFormData({ ...formData, fiscal_year_start_month: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Janvier</SelectItem>
                <SelectItem value="4">Avril</SelectItem>
                <SelectItem value="7">Juillet</SelectItem>
                <SelectItem value="10">Octobre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Détection automatique d'anomalies */}
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Détection automatique d'anomalies</Label>
                <p className="text-sm text-muted-foreground">
                  L'IA détecte automatiquement les anomalies comptables
                </p>
              </div>
              <Switch
                checked={formData.enable_auto_anomaly_detection}
                onCheckedChange={(checked) => setFormData({ ...formData, enable_auto_anomaly_detection: checked })}
              />
            </div>

            {formData.enable_auto_anomaly_detection && (
              <>
                <div className="space-y-2">
                  <Label>Fréquence de détection</Label>
                  <Select
                    value={formData.anomaly_detection_frequency}
                    onValueChange={(value) => setFormData({ ...formData, anomaly_detection_frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Temps réel</SelectItem>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sévérité minimum des anomalies</Label>
                  <Select
                    value={formData.min_anomaly_severity}
                    onValueChange={(value) => setFormData({ ...formData, min_anomaly_severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible et plus</SelectItem>
                      <SelectItem value="medium">Moyenne et plus</SelectItem>
                      <SelectItem value="high">Élevée et plus</SelectItem>
                      <SelectItem value="critical">Critique uniquement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {/* Suggestions d'optimisation fiscale */}
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Suggestions d'optimisation fiscale</Label>
                <p className="text-sm text-muted-foreground">
                  L'IA propose des optimisations fiscales légales
                </p>
              </div>
              <Switch
                checked={formData.enable_tax_optimization_suggestions}
                onCheckedChange={(checked) => setFormData({ ...formData, enable_tax_optimization_suggestions: checked })}
              />
            </div>

            {formData.enable_tax_optimization_suggestions && (
              <div className="space-y-2">
                <Label>Fréquence de vérification</Label>
                <Select
                  value={formData.optimization_check_frequency}
                  onValueChange={(value) => setFormData({ ...formData, optimization_check_frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Rappels fiscaux */}
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Rappels d'échéances fiscales
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recevez des rappels avant les échéances fiscales
                </p>
              </div>
              <Switch
                checked={formData.enable_fiscal_reminders}
                onCheckedChange={(checked) => setFormData({ ...formData, enable_fiscal_reminders: checked })}
              />
            </div>

            {formData.enable_fiscal_reminders && (
              <div className="space-y-2">
                <Label>Jours avant l'échéance</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.reminder_days_before}
                  onChange={(e) => setFormData({ ...formData, reminder_days_before: parseInt(e.target.value) || 7 })}
                />
              </div>
            )}
          </div>

          {/* Rapprochement automatique */}
          <div className="flex items-center justify-between border rounded-lg p-4">
            <div>
              <Label>Rapprochement bancaire automatique</Label>
              <p className="text-sm text-muted-foreground">
                L'IA tente de rapprocher automatiquement les écritures bancaires
              </p>
            </div>
            <Switch
              checked={formData.auto_reconciliation}
              onCheckedChange={(checked) => setFormData({ ...formData, auto_reconciliation: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountingExpertConfigDialog;
