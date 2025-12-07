import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Settings, Save } from 'lucide-react';
import type { VisionConfig } from '@/hooks/useComputerVision';

interface VisionConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: VisionConfig | null;
  onSave: (settings: Partial<VisionConfig>) => Promise<void>;
}

export default function VisionConfigDialog({ 
  open, 
  onOpenChange, 
  config, 
  onSave 
}: VisionConfigDialogProps) {
  const [autoDetection, setAutoDetection] = useState(true);
  const [minConfidence, setMinConfidence] = useState(80);
  const [saveImages, setSaveImages] = useState(false);
  const [shelfMonitoring, setShelfMonitoring] = useState(true);
  const [scanInterval, setScanInterval] = useState(6);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setAutoDetection(config.auto_detection_enabled);
      setMinConfidence(config.min_confidence_threshold);
      setSaveImages(config.save_processed_images);
      setShelfMonitoring(config.enable_shelf_monitoring);
      setScanInterval(config.shelf_scan_interval_hours);
      setAlertsEnabled(config.notification_settings?.alerts_enabled ?? true);
      setEmailNotifs(config.notification_settings?.email ?? false);
      setPushNotifs(config.notification_settings?.push ?? true);
    }
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        auto_detection_enabled: autoDetection,
        min_confidence_threshold: minConfidence,
        save_processed_images: saveImages,
        enable_shelf_monitoring: shelfMonitoring,
        shelf_scan_interval_hours: scanInterval,
        notification_settings: {
          alerts_enabled: alertsEnabled,
          email: emailNotifs,
          push: pushNotifs
        }
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres Vision par Ordinateur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Reconnaissance</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-detection">Détection automatique</Label>
              <Switch
                id="auto-detection"
                checked={autoDetection}
                onCheckedChange={setAutoDetection}
              />
            </div>

            <div className="space-y-2">
              <Label>Seuil de confiance minimum: {minConfidence}%</Label>
              <Slider
                value={[minConfidence]}
                onValueChange={([v]) => setMinConfidence(v)}
                min={50}
                max={99}
                step={1}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="save-images">Sauvegarder les images traitées</Label>
              <Switch
                id="save-images"
                checked={saveImages}
                onCheckedChange={setSaveImages}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm">Surveillance Étagères</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="shelf-monitoring">Surveillance activée</Label>
              <Switch
                id="shelf-monitoring"
                checked={shelfMonitoring}
                onCheckedChange={setShelfMonitoring}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scan-interval">Intervalle de scan (heures)</Label>
              <Input
                id="scan-interval"
                type="number"
                min={1}
                max={24}
                value={scanInterval}
                onChange={(e) => setScanInterval(parseInt(e.target.value) || 6)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm">Notifications</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="alerts-enabled">Alertes activées</Label>
              <Switch
                id="alerts-enabled"
                checked={alertsEnabled}
                onCheckedChange={setAlertsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifs">Notifications email</Label>
              <Switch
                id="email-notifs"
                checked={emailNotifs}
                onCheckedChange={setEmailNotifs}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifs">Notifications push</Label>
              <Switch
                id="push-notifs"
                checked={pushNotifs}
                onCheckedChange={setPushNotifs}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
