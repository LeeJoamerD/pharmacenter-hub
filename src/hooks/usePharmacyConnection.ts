import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Hook de debugging pour suivre l'état de connexion pharmacie
export const usePharmacyConnection = () => {
  const { user, connectedPharmacy, pharmacy } = useAuth();

  useEffect(() => {
    console.log('=== ÉTAT CONNEXION PHARMACIE ===');
    console.log('User authentifié:', !!user, user?.email);
    console.log('Pharmacie via tenant:', !!pharmacy, pharmacy?.name);
    console.log('Pharmacie session:', !!connectedPharmacy, connectedPharmacy?.name);
    console.log('Session token:', connectedPharmacy?.sessionToken ? 'Présent' : 'Absent');
    console.log('================================');
  }, [user, pharmacy, connectedPharmacy]);

  return {
    isUserAuthenticated: !!user,
    hasPharmacyTenant: !!pharmacy,
    hasPharmacySession: !!connectedPharmacy,
    activePharmacy: pharmacy || connectedPharmacy,
    isPharmacyConnected: !!(pharmacy || connectedPharmacy)
  };
};