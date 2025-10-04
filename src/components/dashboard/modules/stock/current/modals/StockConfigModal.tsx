import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StockConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockConfigModal({ open, onOpenChange }: StockConfigModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [config, setConfig] = useState({
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    autoAlerts: true,
    alertFrequency: "daily",
    notificationChannels: {
      email: true,
      dashboard: true,
      sms: false
    }
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: personnel } = await supabase
        .from("personnel")
        .select("tenant_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!personnel) throw new Error("Personnel non trouvé");

      const { error } = await supabase
        .from("alert_settings")
        .upsert({
          tenant_id: personnel.tenant_id,
          low_stock_threshold: config.lowStockThreshold,
          critical_stock_threshold: config.criticalStockThreshold,
          email_notifications: config.notificationChannels.email,
          dashboard_notifications: config.notificationChannels.dashboard,
          sms_notifications: config.notificationChannels.sms,
          alert_frequency: config.alertFrequency
        }, {
          onConflict: 'tenant_id'
        });

      if (error) throw error;

      toast({
        title: "Configuration enregistrée",
        description: "Les paramètres de stock faible ont été mis à jour avec succès"
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configuration du Stock Faible</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lowThreshold">Seuil de Stock Faible</Label>
              <Input
                id="lowThreshold"
                type="number"
                value={config.lowStockThreshold}
                onChange={(e) => setConfig({ ...config, lowStockThreshold: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="criticalThreshold">Seuil de Stock Critique</Label>
              <Input
                id="criticalThreshold"
                type="number"
                value={config.criticalStockThreshold}
                onChange={(e) => setConfig({ ...config, criticalStockThreshold: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Fréquence des Alertes</Label>
              <Select 
                value={config.alertFrequency} 
                onValueChange={(value) => setConfig({ ...config, alertFrequency: value })}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Temps réel</SelectItem>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoAlerts">Alertes Automatiques</Label>
              <Switch
                id="autoAlerts"
                checked={config.autoAlerts}
                onCheckedChange={(checked) => setConfig({ ...config, autoAlerts: checked })}
              />
            </div>

            <div className="space-y-3 border-t pt-4">
              <Label>Canaux de Notification</Label>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotif" className="font-normal">Email</Label>
                <Switch
                  id="emailNotif"
                  checked={config.notificationChannels.email}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    notificationChannels: { ...config.notificationChannels, email: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="dashboardNotif" className="font-normal">Tableau de bord</Label>
                <Switch
                  id="dashboardNotif"
                  checked={config.notificationChannels.dashboard}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    notificationChannels: { ...config.notificationChannels, dashboard: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="smsNotif" className="font-normal">SMS</Label>
                <Switch
                  id="smsNotif"
                  checked={config.notificationChannels.sms}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    notificationChannels: { ...config.notificationChannels, sms: checked }
                  })}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
