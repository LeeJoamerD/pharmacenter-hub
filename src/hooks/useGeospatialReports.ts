 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { useTenant } from '@/contexts/TenantContext';
 import * as GeospatialService from '@/services/GeospatialService';
 import { 
   CreateGeoZoneInput, 
   CreateDeliveryRouteInput, 
   CreateCatchmentAreaInput,
   CreateRecommendationInput 
 } from '@/types/geospatial.types';
 import { toast } from 'sonner';
 
 const STALE_TIME = 5 * 60 * 1000; // 5 minutes
 
 // ================== QUERIES ==================
 
 export const useGeospatialMetrics = () => {
   const { tenantId } = useTenant();
   
   return useQuery({
     queryKey: ['geospatial-metrics', tenantId],
     queryFn: () => GeospatialService.getGeospatialMetrics(tenantId!),
     enabled: !!tenantId,
     staleTime: STALE_TIME,
   });
 };
 
 export const useGeoZones = () => {
   const { tenantId } = useTenant();
   
   return useQuery({
     queryKey: ['geo-zones', tenantId],
     queryFn: () => GeospatialService.getGeoZones(tenantId!),
     enabled: !!tenantId,
     staleTime: STALE_TIME,
   });
 };
 
 export const useActiveGeoZones = () => {
   const { tenantId } = useTenant();
   
   return useQuery({
     queryKey: ['geo-zones-active', tenantId],
     queryFn: () => GeospatialService.getActiveGeoZones(tenantId!),
     enabled: !!tenantId,
     staleTime: STALE_TIME,
   });
 };
 
 export const useZoneAnalysis = () => {
   const { tenantId } = useTenant();
   
   return useQuery({
     queryKey: ['zone-analysis', tenantId],
     queryFn: () => GeospatialService.getZoneAnalysis(tenantId!),
     enabled: !!tenantId,
     staleTime: STALE_TIME,
   });
 };
 
 export const useDeliveryRoutes = () => {
   const { tenantId } = useTenant();
   
   return useQuery({
     queryKey: ['delivery-routes', tenantId],
     queryFn: () => GeospatialService.getDeliveryRoutes(tenantId!),
     enabled: !!tenantId,
     staleTime: STALE_TIME,
   });
 };
 
 export const useRoutesDisplay = () => {
   const { tenantId } = useTenant();
   
   return useQuery({
     queryKey: ['routes-display', tenantId],
     queryFn: () => GeospatialService.getRoutesDisplay(tenantId!),
     enabled: !!tenantId,
     staleTime: STALE_TIME,
   });
 };
 
 export const useRouteStops = (routeId: string) => {
   const { tenantId } = useTenant();
   
   return useQuery({
     queryKey: ['route-stops', tenantId, routeId],
     queryFn: () => GeospatialService.getRouteStops(tenantId!, routeId),
     enabled: !!tenantId && !!routeId,
     staleTime: STALE_TIME,
   });
 };
 
 export const useCatchmentAreas = () => {
   const { tenantId } = useTenant();
   
   return useQuery({
     queryKey: ['catchment-areas', tenantId],
     queryFn: () => GeospatialService.getCatchmentAreas(tenantId!),
     enabled: !!tenantId,
     staleTime: STALE_TIME,
   });
 };
 
 export const useCatchmentDisplay = () => {
   const { tenantId } = useTenant();
   
   return useQuery({
     queryKey: ['catchment-display', tenantId],
     queryFn: () => GeospatialService.getCatchmentDisplay(tenantId!),
     enabled: !!tenantId,
     staleTime: STALE_TIME,
   });
 };
 
 export const useRecommendations = (status?: string) => {
   const { tenantId } = useTenant();
   
   return useQuery({
     queryKey: ['geo-recommendations', tenantId, status],
     queryFn: () => GeospatialService.getRecommendations(tenantId!, status),
     enabled: !!tenantId,
     staleTime: STALE_TIME,
   });
 };
 
 export const useZoneAssignments = (zoneId?: string) => {
   const { tenantId } = useTenant();
   
   return useQuery({
     queryKey: ['zone-assignments', tenantId, zoneId],
     queryFn: () => GeospatialService.getZoneAssignments(tenantId!, zoneId),
     enabled: !!tenantId,
     staleTime: STALE_TIME,
   });
 };
 
 // ================== MUTATIONS - GEO ZONES ==================
 
 export const useCreateZoneMutation = () => {
   const { tenantId } = useTenant();
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: (data: CreateGeoZoneInput) => 
       GeospatialService.createGeoZone(tenantId!, data),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['geo-zones'] });
       queryClient.invalidateQueries({ queryKey: ['zone-analysis'] });
       queryClient.invalidateQueries({ queryKey: ['geospatial-metrics'] });
       toast.success('Zone créée avec succès');
     },
     onError: () => {
       toast.error('Erreur lors de la création de la zone');
     },
   });
 };
 
 export const useUpdateZoneMutation = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: ({ id, data }: { id: string; data: Partial<CreateGeoZoneInput> }) => 
       GeospatialService.updateGeoZone(id, data),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['geo-zones'] });
       queryClient.invalidateQueries({ queryKey: ['zone-analysis'] });
       toast.success('Zone mise à jour avec succès');
     },
     onError: () => {
       toast.error('Erreur lors de la mise à jour de la zone');
     },
   });
 };
 
 export const useDeleteZoneMutation = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: (id: string) => GeospatialService.deleteGeoZone(id),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['geo-zones'] });
       queryClient.invalidateQueries({ queryKey: ['zone-analysis'] });
       queryClient.invalidateQueries({ queryKey: ['geospatial-metrics'] });
       toast.success('Zone supprimée avec succès');
     },
     onError: () => {
       toast.error('Erreur lors de la suppression de la zone');
     },
   });
 };
 
 // ================== MUTATIONS - DELIVERY ROUTES ==================
 
 export const useCreateRouteMutation = () => {
   const { tenantId } = useTenant();
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: (data: CreateDeliveryRouteInput) => 
       GeospatialService.createDeliveryRoute(tenantId!, data),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['delivery-routes'] });
       queryClient.invalidateQueries({ queryKey: ['routes-display'] });
       queryClient.invalidateQueries({ queryKey: ['geospatial-metrics'] });
       toast.success('Route créée avec succès');
     },
     onError: () => {
       toast.error('Erreur lors de la création de la route');
     },
   });
 };
 
 export const useUpdateRouteMutation = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: ({ id, data }: { id: string; data: Partial<CreateDeliveryRouteInput> }) => 
       GeospatialService.updateDeliveryRoute(id, data),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['delivery-routes'] });
       queryClient.invalidateQueries({ queryKey: ['routes-display'] });
       toast.success('Route mise à jour avec succès');
     },
     onError: () => {
       toast.error('Erreur lors de la mise à jour de la route');
     },
   });
 };
 
 export const useDeleteRouteMutation = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: (id: string) => GeospatialService.deleteDeliveryRoute(id),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['delivery-routes'] });
       queryClient.invalidateQueries({ queryKey: ['routes-display'] });
       queryClient.invalidateQueries({ queryKey: ['geospatial-metrics'] });
       toast.success('Route supprimée avec succès');
     },
     onError: () => {
       toast.error('Erreur lors de la suppression de la route');
     },
   });
 };
 
 // ================== MUTATIONS - CATCHMENT AREAS ==================
 
 export const useCreateCatchmentAreaMutation = () => {
   const { tenantId } = useTenant();
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: (data: CreateCatchmentAreaInput) => 
       GeospatialService.createCatchmentArea(tenantId!, data),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['catchment-areas'] });
       queryClient.invalidateQueries({ queryKey: ['catchment-display'] });
       toast.success('Zone de chalandise créée avec succès');
     },
     onError: () => {
       toast.error('Erreur lors de la création de la zone de chalandise');
     },
   });
 };
 
 export const useUpdateCatchmentAreaMutation = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: ({ id, data }: { id: string; data: Partial<CreateCatchmentAreaInput> }) => 
       GeospatialService.updateCatchmentArea(id, data),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['catchment-areas'] });
       queryClient.invalidateQueries({ queryKey: ['catchment-display'] });
       toast.success('Zone de chalandise mise à jour avec succès');
     },
     onError: () => {
       toast.error('Erreur lors de la mise à jour de la zone de chalandise');
     },
   });
 };
 
 export const useDeleteCatchmentAreaMutation = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: (id: string) => GeospatialService.deleteCatchmentArea(id),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['catchment-areas'] });
       queryClient.invalidateQueries({ queryKey: ['catchment-display'] });
       toast.success('Zone de chalandise supprimée avec succès');
     },
     onError: () => {
       toast.error('Erreur lors de la suppression de la zone de chalandise');
     },
   });
 };
 
 // ================== MUTATIONS - RECOMMENDATIONS ==================
 
 export const useCreateRecommendationMutation = () => {
   const { tenantId } = useTenant();
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: (data: CreateRecommendationInput) => 
       GeospatialService.createRecommendation(tenantId!, data),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['geo-recommendations'] });
       toast.success('Recommandation créée avec succès');
     },
     onError: () => {
       toast.error('Erreur lors de la création de la recommandation');
     },
   });
 };
 
 export const useApplyRecommendationMutation = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: (id: string) => GeospatialService.applyRecommendation(id),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['geo-recommendations'] });
       toast.success('Recommandation appliquée avec succès');
     },
     onError: () => {
       toast.error('Erreur lors de l\'application de la recommandation');
     },
   });
 };
 
 export const useDismissRecommendationMutation = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: (id: string) => GeospatialService.dismissRecommendation(id),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['geo-recommendations'] });
       toast.success('Recommandation rejetée');
     },
     onError: () => {
       toast.error('Erreur lors du rejet de la recommandation');
     },
   });
 };
 
 // ================== MUTATIONS - ZONE ASSIGNMENTS ==================
 
 export const useAssignClientToZoneMutation = () => {
   const { tenantId } = useTenant();
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: ({ zoneId, clientId }: { zoneId: string; clientId: string }) => 
       GeospatialService.assignClientToZone(tenantId!, zoneId, clientId),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['zone-assignments'] });
       queryClient.invalidateQueries({ queryKey: ['zone-analysis'] });
       queryClient.invalidateQueries({ queryKey: ['geospatial-metrics'] });
       toast.success('Client assigné à la zone avec succès');
     },
     onError: () => {
       toast.error('Erreur lors de l\'assignation du client');
     },
   });
 };
 
 export const useRemoveClientFromZoneMutation = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: (assignmentId: string) => GeospatialService.removeClientFromZone(assignmentId),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['zone-assignments'] });
       queryClient.invalidateQueries({ queryKey: ['zone-analysis'] });
       queryClient.invalidateQueries({ queryKey: ['geospatial-metrics'] });
       toast.success('Client retiré de la zone avec succès');
     },
     onError: () => {
       toast.error('Erreur lors du retrait du client');
     },
   });
 };
 
 // ================== MUTATIONS - ROUTE STOPS ==================
 
 export const useAddRouteStopMutation = () => {
   const { tenantId } = useTenant();
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: ({ routeId, data }: { routeId: string; data: any }) => 
       GeospatialService.addRouteStop(tenantId!, routeId, data),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['route-stops'] });
       queryClient.invalidateQueries({ queryKey: ['routes-display'] });
       queryClient.invalidateQueries({ queryKey: ['geospatial-metrics'] });
       toast.success('Arrêt ajouté avec succès');
     },
     onError: () => {
       toast.error('Erreur lors de l\'ajout de l\'arrêt');
     },
   });
 };
 
 export const useDeleteRouteStopMutation = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: (stopId: string) => GeospatialService.deleteRouteStop(stopId),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['route-stops'] });
       queryClient.invalidateQueries({ queryKey: ['routes-display'] });
       queryClient.invalidateQueries({ queryKey: ['geospatial-metrics'] });
       toast.success('Arrêt supprimé avec succès');
     },
     onError: () => {
       toast.error('Erreur lors de la suppression de l\'arrêt');
     },
   });
 };