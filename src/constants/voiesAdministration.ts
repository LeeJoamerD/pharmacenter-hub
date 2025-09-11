export const VOIES_ADMINISTRATION = [
  'Orale',
  'Sublinguale', 
  'Intraveineuse',
  'Intramusculaire',
  'Sous-cutanée',
  'Topique',
  'Ophtalmique',
  'Auriculaire',
  'Nasale',
  'Rectale',
  'Vaginale',
  'Inhalation',
  'Transdermique'
] as const;

export type VoieAdministration = typeof VOIES_ADMINISTRATION[number];