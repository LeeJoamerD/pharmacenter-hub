import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ✅ Limite par défaut pour éviter la pagination Supabase à 1000 lignes
const DEFAULT_LIMIT = 5000;

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
        tenantScoped?: boolean;
        // Ajout: pagination avancée et comptage
        range?: { from: number; to: number };
        count?: 'exact' | 'planned' | 'estimated';
      }
    ) => {
      const shouldScopeTenant = options?.tenantScoped ?? true;
      
      if (shouldScopeTenant && !tenantId) {
        throw new Error('Tenant ID is required for tenant queries');
      }

      // Ajout: support du comptage dans select
      let query = (supabase as any)
        .from(tableName)
        .select(selectQuery, options?.count ? { count: options.count } : undefined as any);
        
      // Only add tenant filter if table is tenant-scoped
      if (shouldScopeTenant && tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

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
            } else if ('ilike' in value) {
              query = query.ilike(key, value.ilike);
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

      // Ajout: pagination serveur via range (supprime la limite par défaut de 1000)
      if (options?.range) {
        query = query.range(options.range.from, options.range.to);
      } else if (options?.limit) {
        // Fallback vers limit si range non fourni
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
      tenantScoped?: boolean;
      // Ajout: support de range et count côté cache
      range?: { from: number; to: number };
      count?: 'exact' | 'planned' | 'estimated';
    }
  ) => {
    const shouldScopeTenant = options?.tenantScoped ?? true;
    const effectiveQueryKey = shouldScopeTenant ? [tenantId, ...queryKey] : queryKey;
    
    // ✅ SPRINT 2: Appliquer limite par défaut si non spécifiée
    const hasExplicitLimit = options?.limit !== undefined || 
                             options?.range !== undefined || 
                             options?.single === true ||
                             options?.count !== undefined;
    
    const effectiveLimit = options?.limit ?? (hasExplicitLimit ? undefined : DEFAULT_LIMIT);
    
    // ✅ SPRINT 2: Warning en développement si pas de limite
    if (import.meta.env.DEV && !hasExplicitLimit) {
      console.warn(
        `⚠️ [useTenantQuery] Table "${tableName}" sans limite explicite. ` +
        `Limite par défaut appliquée: ${DEFAULT_LIMIT}. ` +
        `Pour optimiser, spécifiez options.limit, options.range, ou options.single.`
      );
    }
    
    return useQuery({
      queryKey: effectiveQueryKey,
      queryFn: async () => {
        const query = createTenantQuery(
          tableName,
          selectQuery,
          additionalFilters,
          {
            ...options,
            limit: effectiveLimit
          }
        );
        
        const { data, error } = await query;
        if (error) {
          throw error;
        }
        return data;
      },
      enabled: shouldScopeTenant ? (!!tenantId && (options?.enabled ?? true)) : (options?.enabled ?? true)
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
            // Si un ID est fourni, faire un update au lieu d'un upsert
            if (variables.id) {
              console.log('TenantMutation - Converting upsert with ID to update');
              const { id, ...updateData } = dataWithTenant;
              query = (supabase as any)
                .from(tableName)
                .update(updateData)
                .eq('id', id)
                .eq('tenant_id', tenantId);
            } else if (tableName === 'network_admin_settings') {
              // Pour network_admin_settings, utiliser la résolution de conflit appropriée
              if (!variables.setting_category || !variables.setting_key) {
                throw new Error('setting_category and setting_key are required for network_admin_settings upsert');
              }
              console.log('TenantMutation - Using onConflict for network_admin_settings');
              query = (supabase as any)
                .from(tableName)
                .upsert(dataWithTenant, { 
                  onConflict: 'tenant_id,setting_category,setting_key',
                  ignoreDuplicates: false 
                });
            } else if (tableName === 'workflow_settings') {
              // Pour workflow_settings, utiliser la résolution de conflit sur tenant_id,setting_key
              if (!variables.setting_key) {
                throw new Error('setting_key is required for workflow_settings upsert');
              }
              console.log('TenantMutation - Using onConflict for workflow_settings');
              query = (supabase as any)
                .from(tableName)
                .upsert(dataWithTenant, { 
                  onConflict: 'tenant_id,setting_key',
                  ignoreDuplicates: false 
                });
            } else {
              // Upsert générique pour les autres tables
              query = (supabase as any).from(tableName).upsert(dataWithTenant);
            }
            break;
          default:
            throw new Error(`Unsupported operation: ${operation}`);
        }

        const { data, error } = await query.select();
        if (error) {
          console.error('TenantMutation - Error:', error);
          throw error;
        }
        
        // Detect silent RLS failures - if no data returned, the operation was blocked
        if (operation === 'update' && (!data || data.length === 0)) {
          console.error('TenantMutation - Silent RLS failure: no rows updated');
          throw new Error('La modification a échoué. Vous n\'avez peut-être pas les permissions nécessaires pour effectuer cette action.');
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
    { 
      orderBy: { column: 'noms', ascending: true },
      limit: 1000 // ✅ Limite explicite pour personnel
    }
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
    { 
      orderBy: { column: 'name', ascending: true },
      limit: 100 // ✅ Limite explicite pour canaux réseau
    }
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

// Documents hooks
export const useDocumentsQuery = (filters?: Record<string, any>) => {
  const { useTenantQueryWithCache } = useTenantQuery();
  
  return useTenantQueryWithCache(
    ['documents', JSON.stringify(filters)],
    'documents',
    '*, author:personnel!author_id(id, noms, prenoms)',
    filters,
    { 
      orderBy: { column: 'created_at', ascending: false },
      limit: 1000 // ✅ Limite explicite pour documents
    }
  );
};

export const useDocumentCategoriesQuery = () => {
  const { useTenantQueryWithCache } = useTenantQuery();
  
  return useTenantQueryWithCache(
    ['document-categories'],
    'document_categories',
    '*',
    undefined,
    { 
      orderBy: { column: 'name', ascending: true },
      limit: 200 // ✅ Limite explicite pour catégories
    }
  );
};

export const useDocumentMutation = (operation: 'insert' | 'update' | 'delete') => {
  const { useTenantMutation } = useTenantQuery();
  
  return useTenantMutation('documents', operation, {
    invalidateQueries: ['documents', 'document-categories']
  });
};

export const useDocumentCategoryMutation = (operation: 'insert' | 'update' | 'delete') => {
  const { useTenantMutation } = useTenantQuery();
  
  return useTenantMutation('document_categories', operation, {
    invalidateQueries: ['document-categories']
  });
};

// Workflows hooks
export const useWorkflowsQuery = (filters?: Record<string, any>) => {
  const { useTenantQueryWithCache } = useTenantQuery();
  
  return useTenantQueryWithCache(
    ['workflows', JSON.stringify(filters)],
    'workflows',
    '*',
    filters,
    { 
      orderBy: { column: 'created_at', ascending: false },
      limit: 500 // ✅ Limite explicite pour workflows
    }
  );
};

export const useWorkflowTemplatesQuery = (filters?: Record<string, any>) => {
  const { useTenantQueryWithCache } = useTenantQuery();
  
  return useTenantQueryWithCache(
    ['workflow-templates', JSON.stringify(filters)],
    'workflow_templates',
    '*',
    filters,
    { 
      orderBy: { column: 'created_at', ascending: false },
      limit: 200 // ✅ Limite explicite pour templates
    }
  );
};

export const useWorkflowExecutionsQuery = (workflowId?: string) => {
  const { useTenantQueryWithCache } = useTenantQuery();
  
  return useTenantQueryWithCache(
    ['workflow-executions', workflowId || 'all'],
    'workflow_executions',
    '*',
    workflowId ? { workflow_id: workflowId } : undefined,
    { 
      orderBy: { column: 'started_at', ascending: false },
      limit: 1000 // ✅ Limite explicite pour exécutions
    }
  );
};

export const useWorkflowSettingsQuery = () => {
  const { useTenantQueryWithCache } = useTenantQuery();
  
  return useTenantQueryWithCache(
    ['workflow-settings'],
    'workflow_settings',
    '*',
    undefined,
    { 
      orderBy: { column: 'setting_type', ascending: true },
      limit: 100 // ✅ Limite explicite pour settings
    }
  );
};

export const useWorkflowTriggersQuery = (workflowId?: string) => {
  const { useTenantQueryWithCache } = useTenantQuery();
  
  return useTenantQueryWithCache(
    ['workflow-triggers', workflowId || 'all'],
    'workflow_triggers',
    '*, workflow:workflows!workflow_id(id, name)',
    workflowId ? { workflow_id: workflowId } : undefined,
    { 
      orderBy: { column: 'created_at', ascending: false },
      limit: 500 // ✅ Limite explicite pour triggers
    }
  );
};

export const useWorkflowActionsQuery = (workflowId?: string) => {
  const { useTenantQueryWithCache } = useTenantQuery();
  
  return useTenantQueryWithCache(
    ['workflow-actions', workflowId || 'all'],
    'workflow_actions',
    '*, workflow:workflows!workflow_id(id, name)',
    workflowId ? { workflow_id: workflowId } : undefined,
    { 
      orderBy: { column: 'execution_order', ascending: true },
      limit: 500 // ✅ Limite explicite pour actions
    }
  );
};

// Workflow mutations
export const useWorkflowMutation = (operation: 'insert' | 'update' | 'delete' | 'upsert') => {
  const { useTenantMutation } = useTenantQuery();
  
  return useTenantMutation('workflows', operation, {
    invalidateQueries: ['workflows', 'workflow-executions']
  });
};

export const useWorkflowTemplateMutation = (operation: 'insert' | 'update' | 'delete') => {
  const { useTenantMutation } = useTenantQuery();
  
  return useTenantMutation('workflow_templates', operation, {
    invalidateQueries: ['workflow-templates']
  });
};

export const useWorkflowExecutionMutation = (operation: 'insert' | 'update' | 'delete') => {
  const { useTenantMutation } = useTenantQuery();
  
  return useTenantMutation('workflow_executions', operation, {
    invalidateQueries: ['workflow-executions', 'workflows']
  });
};

export const useWorkflowSettingMutation = (operation: 'insert' | 'update' | 'delete' | 'upsert') => {
  const { useTenantMutation } = useTenantQuery();
  
  return useTenantMutation('workflow_settings', operation, {
    invalidateQueries: ['workflow-settings']
  });
};

export const useWorkflowTriggerMutation = (operation: 'insert' | 'update' | 'delete') => {
  const { useTenantMutation } = useTenantQuery();
  
  return useTenantMutation('workflow_triggers', operation, {
    invalidateQueries: ['workflow-triggers']
  });
};

export const useWorkflowActionMutation = (operation: 'insert' | 'update' | 'delete') => {
  const { useTenantMutation } = useTenantQuery();
  
  return useTenantMutation('workflow_actions', operation, {
    invalidateQueries: ['workflow-actions']
  });
};