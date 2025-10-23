-- Phase 1: Migration Base de Données Multi-Tenant

-- Étape 1.1: Modification Table Pharmacies (ajout nouveaux champs)
ALTER TABLE public.pharmacies 
ADD COLUMN quartier TEXT,
ADD COLUMN arrondissement TEXT,
ADD COLUMN pays TEXT DEFAULT 'Cameroun',
ADD COLUMN telephone_appel TEXT,
ADD COLUMN telephone_whatsapp TEXT,
ADD COLUMN departement TEXT,
ADD COLUMN logo TEXT,
ADD COLUMN photo_exterieur TEXT,
ADD COLUMN photo_interieur TEXT;

-- Étape 1.2: Création des enums pour la table personnel
CREATE TYPE public.situation_familiale_enum AS ENUM (
  'Célibataire',
  'Marié(e)',
  'Divorcé(e)',
  'Veuf/Veuve',
  'Concubinage'
);

CREATE TYPE public.statut_contractuel_enum AS ENUM (
  'CDI',
  'CDD',
  'Stage',
  'Freelance',
  'Consultant',
  'Temporaire'
);

-- Étape 1.2: Création Table Personnel/Users avec tenant_id obligatoire
CREATE TABLE public.personnel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Informations personnelles
  noms TEXT NOT NULL,
  prenoms TEXT NOT NULL,
  reference_agent TEXT UNIQUE NOT NULL,
  fonction TEXT,
  adresse TEXT,
  telephone_appel TEXT,
  telephone_whatsapp TEXT,
  email TEXT UNIQUE,
  limite_dette NUMERIC(15, 2) DEFAULT 0.00,
  niu_cni TEXT UNIQUE,
  profession TEXT,
  date_naissance DATE,
  date_recrutement DATE,
  photo_identite TEXT,
  
  -- Informations professionnelles
  salaire_base NUMERIC(15, 2),
  situation_familiale public.situation_familiale_enum,
  nombre_enfants INTEGER DEFAULT 0,
  numero_cnss TEXT,
  statut_contractuel public.statut_contractuel_enum,
  role TEXT NOT NULL DEFAULT 'Employé',
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contrainte d'unicité par tenant
  UNIQUE(tenant_id, reference_agent),
  UNIQUE(tenant_id, email),
  UNIQUE(tenant_id, niu_cni)
);

-- Étape 1.3: Migration Tables Existantes - Ajout tenant_id

-- Ajout tenant_id aux canaux réseau
ALTER TABLE public.network_channels 
ADD COLUMN tenant_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE;

-- Ajout tenant_id aux messages réseau  
ALTER TABLE public.network_messages 
ADD COLUMN tenant_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE;

-- Ajout tenant_id aux participants
ALTER TABLE public.channel_participants 
ADD COLUMN tenant_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE;

-- Ajout tenant_id à la présence pharmacie
ALTER TABLE public.pharmacy_presence 
ADD COLUMN tenant_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE;

-- Triggers pour les timestamps sur personnel
CREATE TRIGGER update_personnel_updated_at
  BEFORE UPDATE ON public.personnel
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour les performances
CREATE INDEX idx_personnel_tenant_id ON public.personnel(tenant_id);
CREATE INDEX idx_personnel_reference_agent ON public.personnel(reference_agent);
CREATE INDEX idx_personnel_email ON public.personnel(email);
CREATE INDEX idx_personnel_role ON public.personnel(role);

CREATE INDEX idx_network_channels_tenant_id ON public.network_channels(tenant_id);
CREATE INDEX idx_network_messages_tenant_id ON public.network_messages(tenant_id);
CREATE INDEX idx_channel_participants_tenant_id ON public.channel_participants(tenant_id);
CREATE INDEX idx_pharmacy_presence_tenant_id ON public.pharmacy_presence(tenant_id);

-- Mise à jour des données existantes (attribuer à la première pharmacie comme exemple)
DO $$
DECLARE
    first_pharmacy_id UUID;
BEGIN
    -- Récupérer l'ID de la première pharmacie
    SELECT id INTO first_pharmacy_id FROM public.pharmacies LIMIT 1;
    
    -- Mettre à jour les tables existantes si des données existent
    IF first_pharmacy_id IS NOT NULL THEN
        UPDATE public.network_channels SET tenant_id = first_pharmacy_id WHERE tenant_id IS NULL;
        UPDATE public.network_messages SET tenant_id = first_pharmacy_id WHERE tenant_id IS NULL;
        UPDATE public.channel_participants SET tenant_id = first_pharmacy_id WHERE tenant_id IS NULL;
        UPDATE public.pharmacy_presence SET tenant_id = first_pharmacy_id WHERE tenant_id IS NULL;
    END IF;
END $$;

-- Rendre tenant_id obligatoire après migration des données
ALTER TABLE public.network_channels ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.network_messages ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.channel_participants ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.pharmacy_presence ALTER COLUMN tenant_id SET NOT NULL;