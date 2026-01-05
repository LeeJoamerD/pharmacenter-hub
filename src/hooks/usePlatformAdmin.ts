import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformAdmin {
  id: string;
  email: string;
  nom: string;
  prenoms: string | null;
  is_active: boolean;
}

export const usePlatformAdmin = () => {
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [platformAdmin, setPlatformAdmin] = useState<PlatformAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPlatformAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsPlatformAdmin(false);
          setPlatformAdmin(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('platform_admins')
          .select('id, email, nom, prenoms, is_active')
          .eq('auth_user_id', user.id)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          setIsPlatformAdmin(false);
          setPlatformAdmin(null);
        } else {
          setIsPlatformAdmin(true);
          setPlatformAdmin(data);
        }
      } catch (error) {
        console.error('Error checking platform admin:', error);
        setIsPlatformAdmin(false);
        setPlatformAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    checkPlatformAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkPlatformAdmin();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isPlatformAdmin, platformAdmin, loading };
};
