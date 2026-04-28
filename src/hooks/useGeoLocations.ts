import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type GeoLocationType = 'pays' | 'departement' | 'arrondissement' | 'quartier';

export interface GeoLocation {
  id: string;
  type: GeoLocationType;
  nom: string;
  parent_id: string | null;
}

const fetchGeoLocations = async (
  type: GeoLocationType,
  parentId: string | null | undefined,
): Promise<GeoLocation[]> => {
  let query = supabase
    .from('geo_locations')
    .select('id, type, nom, parent_id')
    .eq('type', type)
    .order('nom', { ascending: true });

  if (type === 'pays') {
    query = query.is('parent_id', null);
  } else if (parentId) {
    query = query.eq('parent_id', parentId);
  } else {
    // Pas de parent fourni pour un type qui en exige un => liste vide
    return [];
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as GeoLocation[];
};

export const useGeoLocations = (
  type: GeoLocationType,
  parentId?: string | null,
) => {
  const enabled = type === 'pays' ? true : Boolean(parentId);
  return useQuery({
    queryKey: ['geo-locations', type, parentId ?? null],
    queryFn: () => fetchGeoLocations(type, parentId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateGeoLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { type: GeoLocationType; nom: string; parent_id?: string | null }) => {
      const nom = input.nom.trim();
      if (!nom) throw new Error('Nom requis');

      const { data: userData } = await supabase.auth.getUser();
      const created_by = userData?.user?.id ?? null;

      const { data, error } = await supabase
        .from('geo_locations')
        .insert({
          type: input.type,
          nom,
          parent_id: input.parent_id ?? null,
          created_by,
        })
        .select('id, type, nom, parent_id')
        .single();

      if (error) throw error;
      return data as GeoLocation;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: ['geo-locations', created.type, created.parent_id ?? null],
      });
    },
  });
};

/**
 * Recherche un GeoLocation par nom (insensible à la casse) puis renvoie l'id.
 * Utilisé quand on stocke des noms (texte) dans pharmacies et qu'on a besoin
 * de retrouver l'id correspondant pour filtrer les enfants.
 */
export const findGeoLocationByName = async (
  type: GeoLocationType,
  nom: string,
  parentId?: string | null,
): Promise<GeoLocation | null> => {
  if (!nom) return null;
  let query = supabase
    .from('geo_locations')
    .select('id, type, nom, parent_id')
    .eq('type', type)
    .ilike('nom', nom)
    .limit(1);

  if (type === 'pays') {
    query = query.is('parent_id', null);
  } else if (parentId) {
    query = query.eq('parent_id', parentId);
  }

  const { data } = await query;
  return ((data && data[0]) as GeoLocation) || null;
};
