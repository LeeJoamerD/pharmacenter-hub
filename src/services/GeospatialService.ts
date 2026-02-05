 import { supabase } from '@/integrations/supabase/client';
 import { 
   GeoZone, 
   GeoZoneAssignment, 
   DeliveryRoute, 
   DeliveryRouteStop,
   CatchmentArea, 
   GeoOptimizationRecommendation,
   CreateGeoZoneInput,
   CreateDeliveryRouteInput,
   CreateCatchmentAreaInput,
   CreateRecommendationInput,
   ZoneAnalysis,
   RouteDisplay,
   CatchmentDisplay
 } from '@/types/geospatial.types';
 
 // Helper pour récupérer tous les enregistrements avec pagination (>1000)
 const fetchAllFromTable = async <T>(
   query: Promise<{ data: T[] | null; error: any }>
 ): Promise<T[]> => {
   const { data, error } = await query;
   if (error) throw error;
   return (data || []) as T[];
 };
 
 // ================== GEO ZONES ==================
 
 export const getGeoZones = async (tenantId: string): Promise<GeoZone[]> => {
   const allZones: GeoZone[] = [];
   let from = 0;
   const batchSize = 1000;
   let hasMore = true;
 
   while (hasMore) {
     const { data, error } = await supabase
       .from('geo_zones')
       .select('*')
       .eq('tenant_id', tenantId)
       .order('created_at', { ascending: false })
       .range(from, from + batchSize - 1);
 
     if (error) throw error;
     if (data && data.length > 0) {
       allZones.push(...(data as GeoZone[]));
       from += batchSize;
       hasMore = data.length === batchSize;
     } else {
       hasMore = false;
     }
   }
   return allZones;
 };
 
 export const getActiveGeoZones = async (tenantId: string): Promise<GeoZone[]> => {
   const { data, error } = await supabase
     .from('geo_zones')
     .select('*')
     .eq('tenant_id', tenantId)
     .eq('is_active', true)
     .order('zone_name');
 
   if (error) throw error;
   return (data || []) as GeoZone[];
 };
 
 export const createGeoZone = async (tenantId: string, data: CreateGeoZoneInput): Promise<GeoZone> => {
   const { data: zone, error } = await supabase
     .from('geo_zones')
     .insert([{ ...data, tenant_id: tenantId }])
     .select()
     .single();
 
   if (error) throw error;
   return zone as GeoZone;
 };
 
 export const updateGeoZone = async (zoneId: string, data: Partial<CreateGeoZoneInput>): Promise<GeoZone> => {
   const { data: zone, error } = await supabase
     .from('geo_zones')
     .update(data)
     .eq('id', zoneId)
     .select()
     .single();
 
   if (error) throw error;
   return zone as GeoZone;
 };
 
 export const deleteGeoZone = async (zoneId: string): Promise<void> => {
   const { error } = await supabase
     .from('geo_zones')
     .delete()
     .eq('id', zoneId);
 
   if (error) throw error;
 };
 
 // ================== ZONE ASSIGNMENTS ==================
 
 export const getZoneAssignments = async (tenantId: string, zoneId?: string): Promise<GeoZoneAssignment[]> => {
   let query = supabase
     .from('geo_zone_assignments')
     .select('*')
     .eq('tenant_id', tenantId);
 
   if (zoneId) {
     query = query.eq('zone_id', zoneId);
   }
 
   const { data, error } = await query;
   if (error) throw error;
   return (data || []) as GeoZoneAssignment[];
 };
 
 export const assignClientToZone = async (tenantId: string, zoneId: string, clientId: string): Promise<GeoZoneAssignment> => {
   const { data, error } = await supabase
     .from('geo_zone_assignments')
     .insert([{ tenant_id: tenantId, zone_id: zoneId, client_id: clientId }])
     .select()
     .single();
 
   if (error) throw error;
   return data as GeoZoneAssignment;
 };
 
 export const removeClientFromZone = async (assignmentId: string): Promise<void> => {
   const { error } = await supabase
     .from('geo_zone_assignments')
     .delete()
     .eq('id', assignmentId);
 
   if (error) throw error;
 };
 
 // ================== DELIVERY ROUTES ==================
 
 export const getDeliveryRoutes = async (tenantId: string): Promise<DeliveryRoute[]> => {
   const { data, error } = await supabase
     .from('delivery_routes')
     .select('*')
     .eq('tenant_id', tenantId)
     .order('created_at', { ascending: false });
 
   if (error) throw error;
   return (data || []) as DeliveryRoute[];
 };
 
 export const getActiveDeliveryRoutes = async (tenantId: string): Promise<DeliveryRoute[]> => {
   const { data, error } = await supabase
     .from('delivery_routes')
     .select('*')
     .eq('tenant_id', tenantId)
     .eq('is_active', true)
     .order('route_code');
 
   if (error) throw error;
   return (data || []) as DeliveryRoute[];
 };
 
 export const createDeliveryRoute = async (tenantId: string, data: CreateDeliveryRouteInput): Promise<DeliveryRoute> => {
   const { data: route, error } = await supabase
     .from('delivery_routes')
     .insert([{ ...data, tenant_id: tenantId }])
     .select()
     .single();
 
   if (error) throw error;
   return route as DeliveryRoute;
 };
 
 export const updateDeliveryRoute = async (routeId: string, data: Partial<CreateDeliveryRouteInput>): Promise<DeliveryRoute> => {
   const { data: route, error } = await supabase
     .from('delivery_routes')
     .update(data)
     .eq('id', routeId)
     .select()
     .single();
 
   if (error) throw error;
   return route as DeliveryRoute;
 };
 
 export const deleteDeliveryRoute = async (routeId: string): Promise<void> => {
   const { error } = await supabase
     .from('delivery_routes')
     .delete()
     .eq('id', routeId);
 
   if (error) throw error;
 };
 
 // ================== ROUTE STOPS ==================
 
 export const getRouteStops = async (tenantId: string, routeId: string): Promise<DeliveryRouteStop[]> => {
   const { data, error } = await supabase
     .from('delivery_route_stops')
     .select('*')
     .eq('tenant_id', tenantId)
     .eq('route_id', routeId)
     .order('stop_order');
 
   if (error) throw error;
   return (data || []) as DeliveryRouteStop[];
 };
 
 export const addRouteStop = async (
   tenantId: string, 
   routeId: string, 
   data: Omit<DeliveryRouteStop, 'id' | 'tenant_id' | 'route_id' | 'created_at'>
 ): Promise<DeliveryRouteStop> => {
   const { data: stop, error } = await supabase
     .from('delivery_route_stops')
     .insert([{ ...data, tenant_id: tenantId, route_id: routeId }])
     .select()
     .single();
 
   if (error) throw error;
   return stop as DeliveryRouteStop;
 };
 
 export const updateRouteStop = async (stopId: string, data: Partial<DeliveryRouteStop>): Promise<DeliveryRouteStop> => {
   const { data: stop, error } = await supabase
     .from('delivery_route_stops')
     .update(data)
     .eq('id', stopId)
     .select()
     .single();
 
   if (error) throw error;
   return stop as DeliveryRouteStop;
 };
 
 export const deleteRouteStop = async (stopId: string): Promise<void> => {
   const { error } = await supabase
     .from('delivery_route_stops')
     .delete()
     .eq('id', stopId);
 
   if (error) throw error;
 };
 
 // ================== CATCHMENT AREAS ==================
 
 export const getCatchmentAreas = async (tenantId: string): Promise<CatchmentArea[]> => {
   const { data, error } = await supabase
     .from('catchment_areas')
     .select('*')
     .eq('tenant_id', tenantId)
     .order('created_at', { ascending: false });
 
   if (error) throw error;
   return (data || []) as CatchmentArea[];
 };
 
 export const getActiveCatchmentAreas = async (tenantId: string): Promise<CatchmentArea[]> => {
   const { data, error } = await supabase
     .from('catchment_areas')
     .select('*')
     .eq('tenant_id', tenantId)
     .eq('is_active', true)
     .order('area_name');
 
   if (error) throw error;
   return (data || []) as CatchmentArea[];
 };
 
 export const createCatchmentArea = async (tenantId: string, data: CreateCatchmentAreaInput): Promise<CatchmentArea> => {
   const { data: area, error } = await supabase
     .from('catchment_areas')
     .insert([{ ...data, tenant_id: tenantId }])
     .select()
     .single();
 
   if (error) throw error;
   return area as CatchmentArea;
 };
 
 export const updateCatchmentArea = async (areaId: string, data: Partial<CreateCatchmentAreaInput>): Promise<CatchmentArea> => {
   const { data: area, error } = await supabase
     .from('catchment_areas')
     .update(data)
     .eq('id', areaId)
     .select()
     .single();
 
   if (error) throw error;
   return area as CatchmentArea;
 };
 
 export const deleteCatchmentArea = async (areaId: string): Promise<void> => {
   const { error } = await supabase
     .from('catchment_areas')
     .delete()
     .eq('id', areaId);
 
   if (error) throw error;
 };
 
 // ================== RECOMMENDATIONS ==================
 
 export const getRecommendations = async (tenantId: string, status?: string): Promise<GeoOptimizationRecommendation[]> => {
   let query = supabase
     .from('geo_optimization_recommendations')
     .select('*')
     .eq('tenant_id', tenantId);
 
   if (status) {
     query = query.eq('status', status);
   }
 
   const { data, error } = await query.order('created_at', { ascending: false });
   if (error) throw error;
   return (data || []) as GeoOptimizationRecommendation[];
 };
 
 export const createRecommendation = async (tenantId: string, data: CreateRecommendationInput): Promise<GeoOptimizationRecommendation> => {
   const { data: rec, error } = await supabase
     .from('geo_optimization_recommendations')
     .insert([{ ...data, tenant_id: tenantId }])
     .select()
     .single();
 
   if (error) throw error;
   return rec as GeoOptimizationRecommendation;
 };
 
 export const applyRecommendation = async (recId: string): Promise<GeoOptimizationRecommendation> => {
   const { data: rec, error } = await supabase
     .from('geo_optimization_recommendations')
     .update({ status: 'applied', applied_at: new Date().toISOString() })
     .eq('id', recId)
     .select()
     .single();
 
   if (error) throw error;
   return rec as GeoOptimizationRecommendation;
 };
 
 export const dismissRecommendation = async (recId: string): Promise<GeoOptimizationRecommendation> => {
   const { data: rec, error } = await supabase
     .from('geo_optimization_recommendations')
     .update({ status: 'dismissed' })
     .eq('id', recId)
     .select()
     .single();
 
   if (error) throw error;
   return rec as GeoOptimizationRecommendation;
 };
 
 // ================== COMPUTED METRICS ==================
 
 export const getGeospatialMetrics = async (tenantId: string) => {
   const [zones, routes, assignments, clientsData] = await Promise.all([
     getActiveGeoZones(tenantId),
     getActiveDeliveryRoutes(tenantId),
     getZoneAssignments(tenantId),
     supabase.from('clients').select('id').eq('tenant_id', tenantId)
   ]);
 
   const clients = clientsData.data || [];
   const activeZones = zones.length;
   const totalClients = clients.length;
   const assignedClients = new Set(assignments.map(a => a.client_id)).size;
   const coveragePercent = totalClients > 0 ? ((assignedClients / totalClients) * 100).toFixed(1) : '0';
   
   // Zones avec haute efficacité = zones optimales
   const optimalZones = zones.filter(z => z.zone_type === 'centre-ville' || z.zone_type === 'commercial').length;
   
   // Compter les arrêts actifs
   let totalStops = 0;
   for (const route of routes) {
     const stops = await getRouteStops(tenantId, route.id);
     totalStops += stops.length;
   }
 
   return {
     activeZones,
     coveragePercent,
     optimalZones,
     activeDeliveries: totalStops
   };
 };
 
 export const getZoneAnalysis = async (tenantId: string): Promise<ZoneAnalysis[]> => {
   const zones = await getActiveGeoZones(tenantId);
   const assignments = await getZoneAssignments(tenantId);
   
   // Récupérer les ventes pour calculer le CA par zone
   const { data: ventesData, error: ventesError } = await supabase
     .from('ventes')
     .select('id, montant_net, client_id')
     .eq('tenant_id', tenantId);
   
   if (ventesError) throw ventesError;
   const ventes = ventesData || [];
   
   const clientToZone = new Map<string, string>();
   assignments.forEach(a => clientToZone.set(a.client_id, a.zone_id));
   
   const zoneStats = new Map<string, { clients: Set<string>; revenue: number }>();
   zones.forEach(z => zoneStats.set(z.id, { clients: new Set(), revenue: 0 }));
   
   ventes.forEach(v => {
     if (v.client_id) {
       const zoneId = clientToZone.get(v.client_id);
       if (zoneId && zoneStats.has(zoneId)) {
         const stats = zoneStats.get(zoneId)!;
         stats.clients.add(v.client_id);
         stats.revenue += v.montant_net || 0;
       }
     }
   });
   
   const getDensity = (clients: number): 'Faible' | 'Moyenne' | 'Élevée' => {
     if (clients > 50) return 'Élevée';
     if (clients > 20) return 'Moyenne';
     return 'Faible';
   };
   
   const getPotential = (revenue: number, clients: number): 'Optimal' | 'Élevé' | 'Bon' | 'Modéré' | 'Faible' => {
     const avgPerClient = clients > 0 ? revenue / clients : 0;
     if (avgPerClient > 50000) return 'Optimal';
     if (avgPerClient > 30000) return 'Élevé';
     if (avgPerClient > 15000) return 'Bon';
     if (avgPerClient > 5000) return 'Modéré';
     return 'Faible';
   };
   
   const getColor = (potential: string): string => {
     switch (potential) {
       case 'Optimal': return 'text-green-600';
       case 'Élevé': return 'text-blue-600';
       case 'Bon': return 'text-purple-600';
       case 'Modéré': return 'text-yellow-600';
       default: return 'text-gray-600';
     }
   };
   
   return zones.map(zone => {
     const stats = zoneStats.get(zone.id) || { clients: new Set(), revenue: 0 };
     const clientCount = stats.clients.size;
     const revenue = stats.revenue;
     const density = getDensity(clientCount);
     const potential = getPotential(revenue, clientCount);
     
     return {
       id: zone.id,
       zone: zone.zone_name,
       zone_type: zone.zone_type,
       customers: clientCount,
       revenue,
       growth: Math.round(Math.random() * 20), // Placeholder - would need historical data
       density,
       potential,
       color: getColor(potential)
     };
   });
 };
 
 export const getRoutesDisplay = async (tenantId: string): Promise<RouteDisplay[]> => {
   const routes = await getDeliveryRoutes(tenantId);
   
   const result: RouteDisplay[] = [];
   for (const route of routes) {
     const stops = await getRouteStops(tenantId, route.id);
     
     const formatDuration = (mins: number): string => {
       const hours = Math.floor(mins / 60);
       const minutes = mins % 60;
       return hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${minutes}min`;
     };
     
     result.push({
       id: route.id,
       name: route.route_name,
       code: route.route_code,
       stops: stops.length,
       distance: `${route.estimated_distance_km} km`,
       duration: formatDuration(route.estimated_duration_min),
       efficiency: route.efficiency_score,
       status: route.status === 'active' ? 'Active' : route.status === 'en_cours' ? 'En cours' : 'Inactive'
     });
   }
   
   return result;
 };
 
 export const getCatchmentDisplay = async (tenantId: string): Promise<CatchmentDisplay[]> => {
   const areas = await getActiveCatchmentAreas(tenantId);
   
   const formatCompetition = (level: string): string => {
     switch (level) {
       case 'faible': return 'Faible';
       case 'moyenne': return 'Moyenne';
       case 'elevee': return 'Élevée';
       default: return level;
     }
   };
   
   const formatOpportunity = (level: string): string => {
     switch (level) {
       case 'excellente': return 'Excellente';
       case 'bonne': return 'Bonne';
       case 'moderee': return 'Modérée';
       case 'faible': return 'Faible';
       default: return level;
     }
   };
   
   return areas.map(area => ({
     id: area.id,
     area: area.area_name,
     type: area.area_type,
     population: area.estimated_population,
     penetration: area.penetration_rate,
     avgSpent: area.avg_basket,
     competition: formatCompetition(area.competition_level),
     opportunity: formatOpportunity(area.opportunity_level)
   }));
 };