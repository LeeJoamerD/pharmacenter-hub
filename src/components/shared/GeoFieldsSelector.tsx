import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { CreatableCombobox } from '@/components/ui/CreatableCombobox';
import {
  useGeoLocations,
  useCreateGeoLocation,
  findGeoLocationByName,
  GeoLocationType,
} from '@/hooks/useGeoLocations';

export interface GeoFieldsValue {
  pays: string;
  departement: string;
  arrondissement: string;
  quartier: string;
}

interface GeoFieldsSelectorProps {
  value: GeoFieldsValue;
  onChange: (value: GeoFieldsValue) => void;
  /** Affiche les labels (Pays, Département...) ou non */
  showLabels?: boolean;
  /** Layout en grille à 2 colonnes */
  twoColumns?: boolean;
}

/**
 * 4 listes hiérarchiques sélectionnables-avec-ajout :
 * Pays → Département → Arrondissement → Quartier
 *
 * Stocke des **noms** (texte) dans le formulaire parent (compatibilité table pharmacies).
 * Résout les ids correspondants en interne pour filtrer les enfants.
 */
export const GeoFieldsSelector = ({
  value,
  onChange,
  showLabels = true,
  twoColumns = true,
}: GeoFieldsSelectorProps) => {
  const [paysId, setPaysId] = useState<string | null>(null);
  const [departementId, setDepartementId] = useState<string | null>(null);
  const [arrondissementId, setArrondissementId] = useState<string | null>(null);

  const paysQuery = useGeoLocations('pays');
  const departementQuery = useGeoLocations('departement', paysId);
  const arrondissementQuery = useGeoLocations('arrondissement', departementId);
  const quartierQuery = useGeoLocations('quartier', arrondissementId);

  const createGeo = useCreateGeoLocation();

  // Résolution initiale des noms -> ids (au chargement / quand value externe change)
  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      if (value.pays) {
        const p = await findGeoLocationByName('pays', value.pays);
        if (cancelled) return;
        setPaysId(p?.id ?? null);
        if (p && value.departement) {
          const d = await findGeoLocationByName('departement', value.departement, p.id);
          if (cancelled) return;
          setDepartementId(d?.id ?? null);
          if (d && value.arrondissement) {
            const a = await findGeoLocationByName('arrondissement', value.arrondissement, d.id);
            if (cancelled) return;
            setArrondissementId(a?.id ?? null);
          }
        }
      }
    };
    resolve();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.pays, value.departement, value.arrondissement]);

  const toOptions = (list: { id: string; nom: string }[] = []) =>
    list.map((g) => ({ value: g.id, label: g.nom }));

  const handleSelectPays = (opt: { value: string; label: string }) => {
    setPaysId(opt.value);
    setDepartementId(null);
    setArrondissementId(null);
    onChange({ pays: opt.label, departement: '', arrondissement: '', quartier: '' });
  };
  const handleSelectDepartement = (opt: { value: string; label: string }) => {
    setDepartementId(opt.value);
    setArrondissementId(null);
    onChange({ ...value, departement: opt.label, arrondissement: '', quartier: '' });
  };
  const handleSelectArrondissement = (opt: { value: string; label: string }) => {
    setArrondissementId(opt.value);
    onChange({ ...value, arrondissement: opt.label, quartier: '' });
  };
  const handleSelectQuartier = (opt: { value: string; label: string }) => {
    onChange({ ...value, quartier: opt.label });
  };

  const createWith = (type: GeoLocationType, parent_id: string | null) => async (input: string) => {
    const created = await createGeo.mutateAsync({ type, nom: input, parent_id });
    return { value: created.id, label: created.nom };
  };

  const gridClass = twoColumns ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4';

  return (
    <div className={gridClass}>
      <div className="space-y-2">
        {showLabels && <Label htmlFor="pays">Pays *</Label>}
        <CreatableCombobox
          value={paysId ?? undefined}
          options={toOptions(paysQuery.data)}
          loading={paysQuery.isLoading}
          onSelect={handleSelectPays}
          onCreate={createWith('pays', null)}
          placeholder="Sélectionner un pays"
          searchPlaceholder="Rechercher ou saisir un pays..."
        />
      </div>

      <div className="space-y-2">
        {showLabels && <Label htmlFor="departement">Département</Label>}
        <CreatableCombobox
          value={departementId ?? undefined}
          options={toOptions(departementQuery.data)}
          loading={departementQuery.isLoading}
          onSelect={handleSelectDepartement}
          onCreate={paysId ? createWith('departement', paysId) : undefined}
          placeholder={paysId ? 'Sélectionner un département' : 'Choisir un pays d\'abord'}
          searchPlaceholder="Rechercher ou saisir un département..."
          disabled={!paysId}
        />
      </div>

      <div className="space-y-2">
        {showLabels && <Label htmlFor="arrondissement">Arrondissement</Label>}
        <CreatableCombobox
          value={arrondissementId ?? undefined}
          options={toOptions(arrondissementQuery.data)}
          loading={arrondissementQuery.isLoading}
          onSelect={handleSelectArrondissement}
          onCreate={departementId ? createWith('arrondissement', departementId) : undefined}
          placeholder={departementId ? 'Sélectionner un arrondissement' : 'Choisir un département d\'abord'}
          searchPlaceholder="Rechercher ou saisir un arrondissement..."
          disabled={!departementId}
        />
      </div>

      <div className="space-y-2">
        {showLabels && <Label htmlFor="quartier">Quartier</Label>}
        <CreatableCombobox
          value={
            quartierQuery.data?.find((q) => q.nom.toLowerCase() === (value.quartier || '').toLowerCase())?.id
          }
          options={toOptions(quartierQuery.data)}
          loading={quartierQuery.isLoading}
          onSelect={handleSelectQuartier}
          onCreate={arrondissementId ? createWith('quartier', arrondissementId) : undefined}
          placeholder={arrondissementId ? 'Sélectionner un quartier' : 'Choisir un arrondissement d\'abord'}
          searchPlaceholder="Rechercher ou saisir un quartier..."
          disabled={!arrondissementId}
        />
      </div>
    </div>
  );
};
