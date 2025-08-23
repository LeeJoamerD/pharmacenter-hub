import { useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useTenantQuery } from '@/hooks/useTenantQuery';

/**
 * Hook sécurisé pour AuthContext qui ne lance pas d'erreur
 * Retourne null si le contexte n'est pas disponible
 */
export const useSafeAuth = () => {
  try {
    return useAuth();
  } catch {
    return null;
  }
};

/**
 * Hook sécurisé pour TenantContext qui ne lance pas d'erreur
 * Retourne null si le contexte n'est pas disponible
 */
export const useSafeTenant = () => {
  try {
    return useTenant();
  } catch {
    return null;
  }
};

/**
 * Hook sécurisé pour useTenantQuery qui ne lance pas d'erreur
 * Retourne des valeurs par défaut si les contextes ne sont pas disponibles
 */
export const useSafeTenantQuery = () => {
  try {
    return useTenantQuery();
  } catch {
    return {
      tenantId: null,
      useTenantQueryWithCache: null,
      useTenantMutation: null,
      createTenantQuery: null,
    };
  }
};