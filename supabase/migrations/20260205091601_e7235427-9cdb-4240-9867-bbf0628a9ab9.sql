-- =====================================================
-- Tables Géospatiales pour le Module Rapports
-- =====================================================

-- 1) Table geo_zones : Zones géographiques configurées par tenant
CREATE TABLE IF NOT EXISTS public.geo_zones (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    zone_name TEXT NOT NULL,
    zone_type TEXT NOT NULL DEFAULT 'other' CHECK (zone_type IN ('centre-ville', 'residentiel', 'industriel', 'peripherie', 'commercial', 'other')),
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2) Table geo_zone_assignments : Association clients/zones
CREATE TABLE IF NOT EXISTS public.geo_zone_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES public.geo_zones(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, zone_id, client_id)
);

-- 3) Table delivery_routes : Routes de livraison
CREATE TABLE IF NOT EXISTS public.delivery_routes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    route_name TEXT NOT NULL,
    route_code TEXT NOT NULL,
    description TEXT,
    estimated_distance_km NUMERIC DEFAULT 0,
    estimated_duration_min INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'en_cours')),
    efficiency_score NUMERIC DEFAULT 0 CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, route_code)
);

-- 4) Table delivery_route_stops : Arrêts sur les routes
CREATE TABLE IF NOT EXISTS public.delivery_route_stops (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES public.delivery_routes(id) ON DELETE CASCADE,
    stop_order INTEGER NOT NULL DEFAULT 1,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    fournisseur_id UUID REFERENCES public.fournisseurs(id) ON DELETE SET NULL,
    address TEXT,
    stop_type TEXT NOT NULL DEFAULT 'delivery' CHECK (stop_type IN ('pickup', 'delivery', 'both')),
    estimated_time_min INTEGER DEFAULT 10,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5) Table catchment_areas : Zones de chalandise
CREATE TABLE IF NOT EXISTS public.catchment_areas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    area_name TEXT NOT NULL,
    area_type TEXT NOT NULL DEFAULT 'other' CHECK (area_type IN ('premium', 'familiale', 'etudiante', 'commerciale', 'other')),
    estimated_population INTEGER DEFAULT 0,
    penetration_rate NUMERIC DEFAULT 0 CHECK (penetration_rate >= 0 AND penetration_rate <= 100),
    avg_basket NUMERIC DEFAULT 0,
    competition_level TEXT NOT NULL DEFAULT 'moyenne' CHECK (competition_level IN ('faible', 'moyenne', 'elevee')),
    opportunity_level TEXT NOT NULL DEFAULT 'bonne' CHECK (opportunity_level IN ('excellente', 'bonne', 'moderee', 'faible')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6) Table geo_optimization_recommendations : Recommandations d'optimisation
CREATE TABLE IF NOT EXISTS public.geo_optimization_recommendations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    recommendation_type TEXT NOT NULL DEFAULT 'expansion' CHECK (recommendation_type IN ('expansion', 'route', 'marketing', 'partnership')),
    title TEXT NOT NULL,
    description TEXT,
    impact_metric TEXT,
    impact_value NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- Activer RLS sur toutes les tables
-- =====================================================
ALTER TABLE public.geo_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_zone_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catchment_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_optimization_recommendations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Politiques RLS pour geo_zones
-- =====================================================
CREATE POLICY "Users can view geo_zones from their tenant"
ON public.geo_zones FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage geo_zones in their tenant"
ON public.geo_zones FOR ALL
USING (
    tenant_id = get_current_user_tenant_id() AND 
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien')
    )
);

-- =====================================================
-- Politiques RLS pour geo_zone_assignments
-- =====================================================
CREATE POLICY "Users can view geo_zone_assignments from their tenant"
ON public.geo_zone_assignments FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage geo_zone_assignments in their tenant"
ON public.geo_zone_assignments FOR ALL
USING (
    tenant_id = get_current_user_tenant_id() AND 
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien')
    )
);

-- =====================================================
-- Politiques RLS pour delivery_routes
-- =====================================================
CREATE POLICY "Users can view delivery_routes from their tenant"
ON public.delivery_routes FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage delivery_routes in their tenant"
ON public.delivery_routes FOR ALL
USING (
    tenant_id = get_current_user_tenant_id() AND 
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien')
    )
);

-- =====================================================
-- Politiques RLS pour delivery_route_stops
-- =====================================================
CREATE POLICY "Users can view delivery_route_stops from their tenant"
ON public.delivery_route_stops FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage delivery_route_stops in their tenant"
ON public.delivery_route_stops FOR ALL
USING (
    tenant_id = get_current_user_tenant_id() AND 
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien')
    )
);

-- =====================================================
-- Politiques RLS pour catchment_areas
-- =====================================================
CREATE POLICY "Users can view catchment_areas from their tenant"
ON public.catchment_areas FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage catchment_areas in their tenant"
ON public.catchment_areas FOR ALL
USING (
    tenant_id = get_current_user_tenant_id() AND 
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien')
    )
);

-- =====================================================
-- Politiques RLS pour geo_optimization_recommendations
-- =====================================================
CREATE POLICY "Users can view geo_optimization_recommendations from their tenant"
ON public.geo_optimization_recommendations FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage geo_optimization_recommendations in their tenant"
ON public.geo_optimization_recommendations FOR ALL
USING (
    tenant_id = get_current_user_tenant_id() AND 
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien')
    )
);

-- =====================================================
-- Triggers updated_at
-- =====================================================
CREATE TRIGGER update_geo_zones_updated_at
    BEFORE UPDATE ON public.geo_zones
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_routes_updated_at
    BEFORE UPDATE ON public.delivery_routes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_catchment_areas_updated_at
    BEFORE UPDATE ON public.catchment_areas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Index pour optimiser les performances
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_geo_zones_tenant_id ON public.geo_zones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_geo_zones_active ON public.geo_zones(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_geo_zone_assignments_tenant_id ON public.geo_zone_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_geo_zone_assignments_zone_id ON public.geo_zone_assignments(zone_id);
CREATE INDEX IF NOT EXISTS idx_geo_zone_assignments_client_id ON public.geo_zone_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_tenant_id ON public.delivery_routes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_active ON public.delivery_routes(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_route_stops_route_id ON public.delivery_route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_catchment_areas_tenant_id ON public.catchment_areas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_geo_optimization_recommendations_tenant_id ON public.geo_optimization_recommendations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_geo_optimization_recommendations_status ON public.geo_optimization_recommendations(tenant_id, status);