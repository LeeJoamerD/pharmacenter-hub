-- Create patient_reminders table for automated patient reminders
CREATE TABLE IF NOT EXISTS public.patient_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('renewal', 'vaccination', 'control', 'appointment', 'medication')),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  channel TEXT NOT NULL DEFAULT 'sms' CHECK (channel IN ('sms', 'email', 'push', 'whatsapp')),
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.personnel(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reminder_settings table for tenant reminder configuration
CREATE TABLE IF NOT EXISTS public.reminder_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE UNIQUE,
  renewal_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  vaccination_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  control_reminders_enabled BOOLEAN NOT NULL DEFAULT false,
  days_before_expiry INTEGER NOT NULL DEFAULT 7,
  reminder_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (reminder_frequency IN ('daily', 'weekly', 'monthly')),
  sms_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_send BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add columns to clients table for patient dossier
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS allergies JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS chronic_conditions JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_reminders_tenant_id ON public.patient_reminders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patient_reminders_client_id ON public.patient_reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_patient_reminders_status ON public.patient_reminders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_patient_reminders_scheduled ON public.patient_reminders(tenant_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reminder_settings_tenant ON public.reminder_settings(tenant_id);

-- Enable RLS
ALTER TABLE public.patient_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for patient_reminders
CREATE POLICY "Users can view reminders from their tenant" 
ON public.patient_reminders 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert reminders in their tenant" 
ON public.patient_reminders 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update reminders from their tenant" 
ON public.patient_reminders 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete reminders from their tenant" 
ON public.patient_reminders 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- RLS policies for reminder_settings
CREATE POLICY "Users can view reminder settings from their tenant" 
ON public.reminder_settings 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert reminder settings in their tenant" 
ON public.reminder_settings 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update reminder settings from their tenant" 
ON public.reminder_settings 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

-- Triggers for updated_at
CREATE TRIGGER update_patient_reminders_updated_at
BEFORE UPDATE ON public.patient_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reminder_settings_updated_at
BEFORE UPDATE ON public.reminder_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();