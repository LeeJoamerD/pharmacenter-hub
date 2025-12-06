import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Phone, MessageSquare, Clock, Calendar, Loader2, Save } from 'lucide-react';
import type { ReminderSettings } from '@/hooks/useNetworkBusinessIntegrations';

interface ReminderSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ReminderSettings | null;
  onSave: (settings: Partial<ReminderSettings>) => void;
  isSaving?: boolean;
}

export function ReminderSettingsDialog({ open, onOpenChange, settings, onSave, isSaving }: ReminderSettingsDialogProps) {
  const [renewalEnabled, setRenewalEnabled] = useState(true);
  const [vaccinationEnabled, setVaccinationEnabled] = useState(true);
  const [controlEnabled, setControlEnabled] = useState(false);
  const [daysBeforeExpiry, setDaysBeforeExpiry] = useState(7);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [autoSend, setAutoSend] = useState(false);

  useEffect(() => {
    if (settings) {
      setRenewalEnabled(settings.renewal_reminders_enabled);
      setVaccinationEnabled(settings.vaccination_reminders_enabled);
      setControlEnabled(settings.control_reminders_enabled);
      setDaysBeforeExpiry(settings.days_before_expiry);
      setFrequency(settings.reminder_frequency as 'daily' | 'weekly' | 'monthly');
      setSmsEnabled(settings.sms_enabled);
      setEmailEnabled(settings.email_enabled);
      setWhatsappEnabled(settings.whatsapp_enabled);
      setAutoSend(settings.auto_send);
    }
  }, [settings, open]);

  const handleSave = () => {
    onSave({
      renewal_reminders_enabled: renewalEnabled,
      vaccination_reminders_enabled: vaccinationEnabled,
      control_reminders_enabled: controlEnabled,
      days_before_expiry: daysBeforeExpiry,
      reminder_frequency: frequency,
      sms_enabled: smsEnabled,
      email_enabled: emailEnabled,
      whatsapp_enabled: whatsappEnabled,
      auto_send: autoSend
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Configuration des Rappels
          </DialogTitle>
          <DialogDescription>
            Paramétrez les rappels automatiques pour les patients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reminder Types */}
          <div>
            <h4 className="font-medium mb-3">Types de rappels</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="renewal" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Rappels de renouvellement
                </Label>
                <Switch
                  id="renewal"
                  checked={renewalEnabled}
                  onCheckedChange={setRenewalEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="vaccination" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Rappels de vaccination
                </Label>
                <Switch
                  id="vaccination"
                  checked={vaccinationEnabled}
                  onCheckedChange={setVaccinationEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="control" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Rappels de contrôle
                </Label>
                <Switch
                  id="control"
                  checked={controlEnabled}
                  onCheckedChange={setControlEnabled}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Timing */}
          <div>
            <h4 className="font-medium mb-3">Paramètres de temps</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="days" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Délai avant expiration (jours)
                </Label>
                <Input
                  id="days"
                  type="number"
                  value={daysBeforeExpiry}
                  onChange={(e) => setDaysBeforeExpiry(parseInt(e.target.value) || 7)}
                  min={1}
                  max={90}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="frequency">Fréquence des rappels</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as 'daily' | 'weekly' | 'monthly')}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Channels */}
          <div>
            <h4 className="font-medium mb-3">Canaux d'envoi</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="sms" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  SMS
                </Label>
                <Switch
                  id="sms"
                  checked={smsEnabled}
                  onCheckedChange={setSmsEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Switch
                  id="email"
                  checked={emailEnabled}
                  onCheckedChange={setEmailEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsapp" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </Label>
                <Switch
                  id="whatsapp"
                  checked={whatsappEnabled}
                  onCheckedChange={setWhatsappEnabled}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Auto-send */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <Label htmlFor="autoSend" className="font-medium">Envoi automatique</Label>
              <p className="text-sm text-muted-foreground">
                Envoyer les rappels automatiquement selon la planification
              </p>
            </div>
            <Switch
              id="autoSend"
              checked={autoSend}
              onCheckedChange={setAutoSend}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
