import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

export async function exportCatalogueGlobalListes(): Promise<void> {
  // Récupérer les données uniques depuis catalogue_global_produits
  const [famillesRes, formesRes, labosRes, dciRes] = await Promise.all([
    supabase.from('catalogue_global_produits')
      .select('libelle_famille').not('libelle_famille', 'is', null),
    supabase.from('catalogue_global_produits')
      .select('libelle_forme').not('libelle_forme', 'is', null),
    supabase.from('catalogue_global_produits')
      .select('libelle_laboratoire').not('libelle_laboratoire', 'is', null),
    supabase.from('catalogue_global_produits')
      .select('libelle_dci').not('libelle_dci', 'is', null),
  ]);

  // Extraire les valeurs uniques et trier
  const familles = [...new Set(famillesRes.data?.map(r => r.libelle_famille) || [])]
    .filter(Boolean)
    .sort((a, b) => a!.localeCompare(b!)) as string[];
  
  const formes = [...new Set(formesRes.data?.map(r => r.libelle_forme) || [])]
    .filter(Boolean)
    .sort((a, b) => a!.localeCompare(b!)) as string[];
  
  const laboratoires = [...new Set(labosRes.data?.map(r => r.libelle_laboratoire) || [])]
    .filter(Boolean)
    .sort((a, b) => a!.localeCompare(b!)) as string[];
  
  const dcis = [...new Set(dciRes.data?.map(r => r.libelle_dci) || [])]
    .filter(Boolean)
    .sort((a, b) => a!.localeCompare(b!)) as string[];

  // Créer le workbook avec 4 onglets
  const workbook = XLSX.utils.book_new();
  
  // Onglet Familles
  const famillesSheet = XLSX.utils.json_to_sheet(
    familles.map((f, i) => ({ '#': i + 1, 'Famille': f }))
  );
  XLSX.utils.book_append_sheet(workbook, famillesSheet, 'Familles');

  // Onglet Formes
  const formesSheet = XLSX.utils.json_to_sheet(
    formes.map((f, i) => ({ '#': i + 1, 'Forme': f }))
  );
  XLSX.utils.book_append_sheet(workbook, formesSheet, 'Formes');

  // Onglet Laboratoires
  const labosSheet = XLSX.utils.json_to_sheet(
    laboratoires.map((l, i) => ({ '#': i + 1, 'Laboratoire': l }))
  );
  XLSX.utils.book_append_sheet(workbook, labosSheet, 'Laboratoires');

  // Onglet DCI
  const dciSheet = XLSX.utils.json_to_sheet(
    dcis.map((d, i) => ({ '#': i + 1, 'DCI': d }))
  );
  XLSX.utils.book_append_sheet(workbook, dciSheet, 'DCI');

  // Télécharger le fichier
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Listes_Catalogue_Global_${date}.xlsx`);
}
