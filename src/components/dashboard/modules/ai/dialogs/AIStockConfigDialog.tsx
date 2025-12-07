import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Settings, Bell, Zap, Shield, Save } from 'lucide-react';
import type { AIStockConfig } from '@/hooks/useAIStockManagement';

interface AIStockConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AIStockConfig | null;
  onSave: (updates: Partial<AIStockConfig>) => void;
}

const AIStockConfigDialog: React.FC<AIStockConfigDialogProps> = ({
  open,
  onOpenChange,
  config,
  onSave
}) => {
  const [formData, setFormData] = useState({
    auto_optimization_enabled: false,
    prediction_horizon_days: 30,
    confidence_threshold: 70,
    critical_alert_days: 7,
    reorder_lead_time_days: 5,
    safety_stock_multiplier: 1.5,
    promotion_expiry_threshold_days: 30,
    enable_fifo_alerts: true,
    enable_rotation_analysis: true,
    notification_settings: { email: false, push: true, sms: false }
  });

  useEffect(() => {
    if (config) {
      setFormData({
        auto_optimization_enabled: config.auto_optimization_enabled,
        prediction_horizon_days: config.prediction_horizon_days,
        confidence_threshold: config.confidence_threshold,
        critical_alert_days: config.critical_alert_days,
        reorder_lead_time_days: config.reorder_lead_time_days,
        safety_stock_multiplier: config.safety_stock_multiplier,
        promotion_expiry_threshold_days: config.promotion_expiry_threshold_days,
        enable_fifo_alerts: config.enable_fifo_alerts,
        enable_rotation_analysis: config.enable_rotation_analysis,
        notification_settings: config.notification_settings || { email: false, push: true, sms: false }
      });
    }
  }, [config]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configuration Stock IA
          </DialogTitle>
          <DialogDescription>
            Personnalisez les paramètres d'optimisation du stock
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Automation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Automatisation</h3>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div>
                <Label htmlFor="auto-opt">Optimisation automatique</Label>
                <p className="text-sm text-muted-foreground">
                  Exécuter l'analyse IA automatiquement chaque jour
                </p>
              </div>
              <Switch
                id="auto-opt"
                checked={formData.auto_optimization_enabled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, auto_optimization_enabled: checked }))
                }
              />
            </div>
          </div>

          <Separator />

          {/* Prediction settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Paramètres de Prédiction</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horizon">Horizon de prédiction (jours)</Label>
                <Input
                  id="horizon"
                  type="number"
                  min={7}
                  max={90}
                  value={formData.prediction_horizon_days}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, prediction_horizon_days: parseInt(e.target.value) || 30 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-time">Délai de réappro (jours)</Label>
                <Input
                  id="lead-time"
                  type="number"
                  min={1}
                  max={30}
                  value={formData.reorder_lead_time_days}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, reorder_lead_time_days: parseInt(e.target.value) || 5 }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Seuil de confiance minimum</Label>
                <span className="text-sm font-medium">{formData.confidence_threshold}%</span>
              </div>
              <Slider
                value={[formData.confidence_threshold]}
                onValueChange={([value]) => 
                  setFormData(prev => ({ ...prev, confidence_threshold: value }))
                }
                min={50}
                max={95}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Les prédictions en dessous de ce seuil seront marquées comme peu fiables
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="critical-days">Alerte critique (jours)</Label>
                <Input
                  id="critical-days"
                  type="number"
                  min={1}
                  max={14}
                  value={formData.critical_alert_days}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, critical_alert_days: parseInt(e.target.value) || 7 }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Jours avant rupture pour déclencher une alerte critique
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="safety-mult">Multiplicateur stock sécurité</Label>
                <Input
                  id="safety-mult"
                  type="number"
                  min={1}
                  max={3}
                  step={0.1}
                  value={formData.safety_stock_multiplier}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, safety_stock_multiplier: parseFloat(e.target.value) || 1.5 }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promo-days">Seuil promotion péremption (jours)</Label>
              <Input
                id="promo-days"
                type="number"
                min={7}
                max={90}
                value={formData.promotion_expiry_threshold_days}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, promotion_expiry_threshold_days: parseInt(e.target.value) || 30 }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Suggérer une promotion pour les produits expirant dans ce délai
              </p>
            </div>
          </div>

          <Separator />

          {/* Analysis options */}
          <div className="space-y-4">
            <h3 className="font-semibold">Options d'Analyse</h3>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div>
                <Label htmlFor="fifo-alerts">Alertes FIFO</Label>
                <p className="text-sm text-muted-foreground">
                  Détecter les violations du principe FIFO
                </p>
              </div>
              <Switch
                id="fifo-alerts"
                checked={formData.enable_fifo_alerts}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, enable_fifo_alerts: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div>
                <Label htmlFor="rotation-analysis">Analyse de rotation</Label>
                <p className="text-sm text-muted-foreground">
                  Analyser la vitesse de rotation des produits
                </p>
              </div>
              <Switch
                id="rotation-analysis"
                checked={formData.enable_rotation_analysis}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, enable_rotation_analysis: checked }))
                }
              />
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Notifications</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <Label htmlFor="notif-email">Email</Label>
                <Switch
                  id="notif-email"
                  checked={formData.notification_settings.email}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      notification_settings: { ...prev.notification_settings, email: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <Label htmlFor="notif-push">Push</Label>
                <Switch
                  id="notif-push"
                  checked={formData.notification_settings.push}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      notification_settings: { ...prev.notification_settings, push: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <Label htmlFor="notif-sms">SMS</Label>
                <Switch
                  id="notif-sms"
                  checked={formData.notification_settings.sms}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      notification_settings: { ...prev.notification_settings, sms: checked }
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIStockConfigDialog;
