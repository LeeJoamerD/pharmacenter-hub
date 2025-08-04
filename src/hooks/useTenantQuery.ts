import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Hook pour les requêtes automatiquement filtrées par tenant
export const useTenantQuery = () => {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  // Query builder avec filtrage automatique par tenant
  const createTenantQuery = useCallback(
    (
      tableName: string,
      selectQuery: string = '*',
      additionalFilters?: Record<string, any>,
      options?: {
        orderBy?: { column: string; ascending?: boolean };
        limit?: number;
        single?: boolean;
      }
    ) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required for tenant queries');
      }

      let query = (supabase as any)
        .from(tableName)
        .select(selectQuery)
        .eq('tenant_id', tenantId);

      // Ajouter des filtres supplémentaires
      if (additionalFilters) {
        Object.entries(additionalFilters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value !== null) {
            // Gestion des filtres spéciaux comme { is: null }
            if ('is' in value && value.is === null) {
              query = query.is(key, null);
            } else if ('eq' in value) {
              query = query.eq(key, value.eq);
            } else if ('neq' in value) {
              query = query.neq(key, value.neq);
            }
          } else if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Ajouter l'ordre
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }

      // Ajouter la limite
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      // Retourner un seul élément
      if (options?.single) {
        return query.single();
      }

      return query;
    },
    [tenantId]
  );

  // Hook pour query avec cache React Query
  const useTenantQueryWithCache = (
    queryKey: string[],
    tableName: string,
    selectQuery: string = '*',
    additionalFilters?: Record<string, any>,
    options?: {
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      single?: boolean;
      enabled?: boolean;
    }
  ) => {
    return useQuery({
      queryKey: [tenantId, ...queryKey],
      queryFn: async () => {
        const query = createTenantQuery(
          tableName,
          selectQuery,
          additionalFilters,
          options
        );
        
        const { data, error } = await query;
        if (error) {
          throw error;
        }
        return data;
      },
      enabled: !!tenantId && (options?.enabled ?? true)
    });
  };

  // Hook pour mutation avec invalidation cache
  const useTenantMutation = (
    tableName: string,
    operation: 'insert' | 'update' | 'delete' | 'upsert',
    options?: {
      invalidateQueries?: string[];
      onSuccess?: (data: any) => void;
      onError?: (error: Error) => void;
    }
  ) => {
    return useMutation({
      mutationFn: async (variables: any) => {
        console.log('TenantMutation - tenantId:', tenantId);
        console.log('TenantMutation - operation:', operation);
        console.log('TenantMutation - tableName:', tableName);
        console.log('TenantMutation - variables:', variables);
        
        if (!tenantId) {
          throw new Error('Tenant ID is required for tenant mutations');
        }

        let query;
        const dataWithTenant = { ...variables, tenant_id: tenantId };

        switch (operation) {
          case 'insert':
            query = (supabase as any).from(tableName).insert(dataWithTenant);
            break;
          case 'update':
            if (!variables.id) {
              throw new Error('ID is required for update operations');
            }
            const { id, ...updateData } = dataWithTenant;
            query = (supabase as any)
              .from(tableName)
              .update(updateData)
              .eq('id', id)
              .eq('tenant_id', tenantId);
            break;
          case 'delete':
            if (!variables.id) {
              throw new Error('ID is required for delete operations');
            }
            query = (supabase as any)
              .from(tableName)
              .delete()
              .eq('id', variables.id)
              .eq('tenant_id', tenantId);
            break;
          case 'upsert':
            query = (supabase as any).from(tableName).upsert(dataWithTenant);
            break;
          default:
            throw new Error(`Unsupported operation: ${operation}`);
        }

        const { data, error } = await query.select();
        if (error) {
          console.error('TenantMutation - Error:', error);
          throw error;
        }
        console.log('TenantMutation - Success:', data);
        return data;
      },
      onSuccess: (data) => {
        // Invalider les caches liés
        if (options?.invalidateQueries) {
          options.invalidateQueries.forEach(queryKey => {
            queryClient.invalidateQueries({ queryKey: [tenantId, queryKey] });
          });
        }
        
        // Callback personnalisé
        if (options?.onSuccess) {
          options.onSuccess(data);
        }
      },
      onError: options?.onError
    });
  };

  return {
    createTenantQuery,
    useTenantQueryWithCache,
    useTenantMutation,
    tenantId
  };
};

// Hooks spécialisés pour tables courantes
export const usePersonnelQuery = (filters?: Record<string, any>) => {
  const { useTenantQueryWithCache } = useTenantQuery();
  
  return useTenantQueryWithCache(
    ['personnel', JSON.stringify(filters)],
    'personnel',
    '*',
    filters,
    { orderBy: { column: 'noms', ascending: true } }
  );
};

export const usePharmaciesQuery = () => {
  const { useTenantQueryWithCache } = useTenantQuery();
  
  return useTenantQueryWithCache(
    ['pharmacy'],
    'pharmacies',
    '*',
    undefined,
    { single: true }
  );
};

export const useNetworkChannelsQuery = () => {
  const { useTenantQueryWithCache } = useTenantQuery();
  
  return useTenantQueryWithCache(
    ['network-channels'],
    'network_channels',
    '*',
    undefined,
    { orderBy: { column: 'name', ascending: true } }
  );
};

export const useNetworkMessagesQuery = (channelId?: string) => {
  const { useTenantQueryWithCache } = useTenantQuery();
  
  return useTenantQueryWithCache(
    ['network-messages', channelId || 'all'],
    'network_messages',
    `*, pharmacy:pharmacies!sender_pharmacy_id(id, name, code, type, city, region, status)`,
    channelId ? { channel_id: channelId } : undefined,
    { 
      orderBy: { column: 'created_at', ascending: true },
      limit: 50,
      enabled: !!channelId
    }
  );
};