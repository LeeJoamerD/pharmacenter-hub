 // Types for Geospatial Module
 
 export interface GeoZone {
   id: string;
   tenant_id: string;
   zone_name: string;
   zone_type: 'centre-ville' | 'residentiel' | 'industriel' | 'peripherie' | 'commercial' | 'other';
   description?: string;
   color: string;
   is_active: boolean;
   metadata?: Record<string, unknown>;
   created_at: string;
   updated_at: string;
 }
 
 export interface GeoZoneAssignment {
   id: string;
   tenant_id: string;
   zone_id: string;
   client_id: string;
   assigned_at: string;
 }
 
 export interface DeliveryRoute {
   id: string;
   tenant_id: string;
   route_name: string;
   route_code: string;
   description?: string;
   estimated_distance_km: number;
   estimated_duration_min: number;
   status: 'active' | 'inactive' | 'en_cours';
   efficiency_score: number;
   is_active: boolean;
   metadata?: Record<string, unknown>;
   created_at: string;
   updated_at: string;
 }
 
 export interface DeliveryRouteStop {
   id: string;
   tenant_id: string;
   route_id: string;
   stop_order: number;
   client_id?: string;
   fournisseur_id?: string;
   address?: string;
   stop_type: 'pickup' | 'delivery' | 'both';
   estimated_time_min: number;
   notes?: string;
   created_at: string;
 }
 
 export interface CatchmentArea {
   id: string;
   tenant_id: string;
   area_name: string;
   area_type: 'premium' | 'familiale' | 'etudiante' | 'commerciale' | 'other';
   estimated_population: number;
   penetration_rate: number;
   avg_basket: number;
   competition_level: 'faible' | 'moyenne' | 'elevee';
   opportunity_level: 'excellente' | 'bonne' | 'moderee' | 'faible';
   is_active: boolean;
   metadata?: Record<string, unknown>;
   created_at: string;
   updated_at: string;
 }
 
 export interface GeoOptimizationRecommendation {
   id: string;
   tenant_id: string;
   recommendation_type: 'expansion' | 'route' | 'marketing' | 'partnership';
   title: string;
   description?: string;
   impact_metric?: string;
   impact_value: number;
   status: 'pending' | 'applied' | 'dismissed';
   applied_at?: string;
   created_at: string;
 }
 
 export interface GeoMetric {
   title: string;
   value: string;
   change: string;
   icon: string;
   color: string;
   bgColor: string;
 }
 
 export interface ZoneAnalysis {
   id: string;
   zone: string;
   zone_type: string;
   customers: number;
   revenue: number;
   growth: number;
   density: 'Faible' | 'Moyenne' | 'Élevée';
   potential: 'Optimal' | 'Élevé' | 'Bon' | 'Modéré' | 'Faible';
   color: string;
 }
 
 export interface RouteDisplay {
   id: string;
   name: string;
   code: string;
   stops: number;
   distance: string;
   duration: string;
   efficiency: number;
   status: string;
 }
 
 export interface CatchmentDisplay {
   id: string;
   area: string;
   type: string;
   population: number;
   penetration: number;
   avgSpent: number;
   competition: string;
   opportunity: string;
 }
 
 export interface CreateGeoZoneInput {
   zone_name: string;
   zone_type: GeoZone['zone_type'];
   description?: string;
   color?: string;
   is_active?: boolean;
 }
 
 export interface CreateDeliveryRouteInput {
   route_name: string;
   route_code: string;
   description?: string;
   estimated_distance_km?: number;
   estimated_duration_min?: number;
   status?: DeliveryRoute['status'];
   efficiency_score?: number;
 }
 
 export interface CreateCatchmentAreaInput {
   area_name: string;
   area_type: CatchmentArea['area_type'];
   estimated_population?: number;
   penetration_rate?: number;
   avg_basket?: number;
   competition_level?: CatchmentArea['competition_level'];
   opportunity_level?: CatchmentArea['opportunity_level'];
 }
 
 export interface CreateRecommendationInput {
   recommendation_type: GeoOptimizationRecommendation['recommendation_type'];
   title: string;
   description?: string;
   impact_metric?: string;
   impact_value?: number;
 }