-- Ajouter la colonne voie_administration à la table formes_galeniques
ALTER TABLE public.formes_galeniques 
ADD COLUMN voie_administration TEXT;

-- Ajouter une contrainte CHECK pour les valeurs autorisées
ALTER TABLE public.formes_galeniques 
ADD CONSTRAINT check_voie_administration 
CHECK (voie_administration IS NULL OR voie_administration IN (
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
));