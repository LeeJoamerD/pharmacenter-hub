import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

type Personnel = Tables<'personnel'>;
type Pharmacy = Tables<'pharmacies'>;

interface TenantContextType {
  currentTenant: Pharmacy | null;
  currentUser: Personnel | null;
  tenantId: string | null;
  isLoading: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenantData: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, personnel, pharmacy, connectedPharmacy } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<Pharmacy | null>(null);
  const [currentUser, setCurrentUser] = useState<Personnel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Synchroniser avec le contexte Auth, utiliser connectedPharmacy en fallback
  useEffect(() => {
    const tenant = pharmacy || connectedPharmacy;
    setCurrentTenant(tenant);
    setCurrentUser(personnel);
    setIsLoading(false);
  }, [pharmacy, personnel, connectedPharmacy]);

  const switchTenant = async (tenantId: string) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    setIsLoading(true);
    try {
      // Vérifier que l'utilisateur a accès à ce tenant
      const { data: personnelData, error: personnelError } = await supabase
        .from('personnel')
        .select('*')
        .eq('auth_user_id', user.id)
        .eq('tenant_id', tenantId)
        .single();

      if (personnelError || !personnelData) {
        throw new Error('Accès non autorisé à ce tenant');
      }

      // Charger les données du tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (tenantError || !tenantData) {
        throw new Error('Tenant non trouvé');
      }

      setCurrentTenant(tenantData);
      setCurrentUser(personnelData);
    } catch (error) {
      console.error('Error switching tenant:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTenantData = async () => {
    if (!user || !currentTenant) return;

    setIsLoading(true);
    try {
      // Recharger les données utilisateur
      const { data: personnelData } = await supabase
        .from('personnel')
        .select('*')
        .eq('auth_user_id', user.id)
        .eq('tenant_id', currentTenant.id)
        .single();

      // Recharger les données tenant
      const { data: tenantData } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', currentTenant.id)
        .single();

      if (personnelData) setCurrentUser(personnelData);
      if (tenantData) setCurrentTenant(tenantData);
    } catch (error) {
      console.error('Error refreshing tenant data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentTenant,
    currentUser,
    tenantId: currentTenant?.id || null,
    isLoading,
    switchTenant,
    refreshTenantData
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};