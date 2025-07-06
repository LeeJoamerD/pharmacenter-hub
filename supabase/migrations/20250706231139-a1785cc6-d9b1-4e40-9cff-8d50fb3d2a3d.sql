-- Création des tables pour la messagerie réseau PharmaSoft

-- Table des pharmacies du réseau
CREATE TABLE public.pharmacies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  region TEXT,
  type TEXT DEFAULT 'standard',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des canaux de communication
CREATE TABLE public.network_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'public',
  is_system BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.pharmacies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des messages
CREATE TABLE public.network_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.network_channels(id) ON DELETE CASCADE,
  sender_pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id),
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  priority TEXT DEFAULT 'normal',
  read_by JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des participants aux canaux
CREATE TABLE public.channel_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.network_channels(id) ON DELETE CASCADE,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(channel_id, pharmacy_id)
);

-- Table pour le statut de présence
CREATE TABLE public.pharmacy_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  current_users INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pharmacy_id)
);

-- Fonction pour mettre à jour les timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour les timestamps
CREATE TRIGGER update_pharmacies_updated_at
  BEFORE UPDATE ON public.pharmacies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_channels_updated_at
  BEFORE UPDATE ON public.network_channels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_messages_updated_at
  BEFORE UPDATE ON public.network_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pharmacy_presence_updated_at
  BEFORE UPDATE ON public.pharmacy_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour les performances
CREATE INDEX idx_network_messages_channel_created ON public.network_messages(channel_id, created_at DESC);
CREATE INDEX idx_network_messages_sender ON public.network_messages(sender_pharmacy_id);
CREATE INDEX idx_channel_participants_pharmacy ON public.channel_participants(pharmacy_id);
CREATE INDEX idx_pharmacy_presence_status ON public.pharmacy_presence(status, last_seen);

-- Données initiales - Canaux système
INSERT INTO public.network_channels (name, description, type, is_system) VALUES
  ('Général', 'Canal général pour toutes les officines du réseau', 'public', true),
  ('Fournisseurs Communs', 'Discussions sur les fournisseurs partagés', 'public', true),
  ('Urgences Sanitaires', 'Canal pour les alertes sanitaires urgentes', 'broadcast', true),
  ('Formation Continue', 'Partage de formations et ressources pédagogiques', 'public', true),
  ('Support Technique', 'Assistance technique PharmaSoft', 'public', true);

-- Données d''exemple - Pharmacies
INSERT INTO public.pharmacies (name, code, address, city, postal_code, phone, email, region, type) VALUES
  ('Pharmacie du Centre', 'PH001', '15 Place de la République', 'Paris', '75001', '01.42.33.44.55', 'contact@pharmacie-centre.fr', 'Île-de-France', 'centre-ville'),
  ('Pharmacie de la Gare', 'PH002', '8 Avenue de la Gare', 'Lyon', '69002', '04.72.56.78.90', 'info@pharmacie-gare.fr', 'Auvergne-Rhône-Alpes', 'grande-surface'),
  ('Pharmacie Rurale', 'PH003', '22 Route Nationale', 'Provence', '13600', '04.90.12.34.56', 'contact@pharmacie-rurale.fr', 'Provence-Alpes-Cote-Azur', 'rurale'),
  ('Pharmacie Hospitalière', 'PH004', 'CHU Marseille', 'Marseille', '13005', '04.91.38.60.00', 'pharma@chu-marseille.fr', 'Provence-Alpes-Cote-Azur', 'hospitalière');

-- Activation de la réplication temps réel
ALTER TABLE public.network_messages REPLICA IDENTITY FULL;
ALTER TABLE public.pharmacy_presence REPLICA IDENTITY FULL;
ALTER TABLE public.channel_participants REPLICA IDENTITY FULL;

-- Publication pour le temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE public.network_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pharmacy_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_participants;