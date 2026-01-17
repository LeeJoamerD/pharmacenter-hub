
-- Insertion des comptes SYSCOHADA - Classe 1: Comptes de ressources durables
INSERT INTO public.comptes_globaux (plan_comptable_id, numero_compte, libelle_compte, classe, niveau, type_compte, is_active)
SELECT 
  (SELECT id FROM public.plans_comptables_globaux WHERE code = 'SYSCOHADA_REVISE' LIMIT 1),
  numero, libelle, classe, niveau, type_compte, true
FROM (VALUES
  ('10', 'Capital', 1, 1, 'Capital'),
  ('101', 'Capital social', 1, 2, 'Capital'),
  ('1011', 'Capital souscrit, non appelé', 1, 3, 'Capital'),
  ('1012', 'Capital souscrit, appelé, non versé', 1, 3, 'Capital'),
  ('1013', 'Capital souscrit, appelé, versé', 1, 3, 'Capital'),
  ('102', 'Capital par dotation', 1, 2, 'Capital'),
  ('103', 'Capital personnel', 1, 2, 'Capital'),
  ('104', 'Compte de l''exploitant', 1, 2, 'Capital'),
  ('105', 'Primes liées aux capitaux propres', 1, 2, 'Capital'),
  ('1051', 'Primes d''émission', 1, 3, 'Capital'),
  ('1052', 'Primes d''apport', 1, 3, 'Capital'),
  ('11', 'Réserves', 1, 1, 'Capital'),
  ('111', 'Réserve légale', 1, 2, 'Capital'),
  ('112', 'Réserves statutaires', 1, 2, 'Capital'),
  ('118', 'Autres réserves', 1, 2, 'Capital'),
  ('12', 'Report à nouveau', 1, 1, 'Capital'),
  ('121', 'Report à nouveau créditeur', 1, 2, 'Capital'),
  ('129', 'Report à nouveau débiteur', 1, 2, 'Capital'),
  ('13', 'Résultat net de l''exercice', 1, 1, 'Resultat'),
  ('131', 'Résultat net: Bénéfice', 1, 2, 'Resultat'),
  ('139', 'Résultat net: Perte', 1, 2, 'Resultat'),
  ('14', 'Subventions d''investissement', 1, 1, 'Capital'),
  ('141', 'Subventions d''équipement', 1, 2, 'Capital'),
  ('15', 'Provisions réglementées', 1, 1, 'Passif'),
  ('151', 'Amortissements dérogatoires', 1, 2, 'Passif'),
  ('16', 'Emprunts et dettes assimilées', 1, 1, 'Passif'),
  ('161', 'Emprunts obligataires', 1, 2, 'Passif'),
  ('162', 'Emprunts bancaires', 1, 2, 'Passif'),
  ('165', 'Dépôts et cautionnements reçus', 1, 2, 'Passif'),
  ('17', 'Dettes de crédit-bail', 1, 1, 'Passif'),
  ('172', 'Crédit-bail immobilier', 1, 2, 'Passif'),
  ('173', 'Crédit-bail mobilier', 1, 2, 'Passif'),
  ('18', 'Dettes liées à des participations', 1, 1, 'Passif'),
  ('181', 'Dettes participations groupe', 1, 2, 'Passif'),
  ('19', 'Provisions pour risques', 1, 1, 'Passif'),
  ('191', 'Provisions pour litiges', 1, 2, 'Passif'),
  ('195', 'Provisions pour impôts', 1, 2, 'Passif')
) AS t(numero, libelle, classe, niveau, type_compte)
ON CONFLICT (plan_comptable_id, numero_compte) DO UPDATE SET
  libelle_compte = EXCLUDED.libelle_compte,
  classe = EXCLUDED.classe,
  niveau = EXCLUDED.niveau,
  type_compte = EXCLUDED.type_compte;

-- Classe 2: Comptes d'actif immobilisé
INSERT INTO public.comptes_globaux (plan_comptable_id, numero_compte, libelle_compte, classe, niveau, type_compte, is_active)
SELECT 
  (SELECT id FROM public.plans_comptables_globaux WHERE code = 'SYSCOHADA_REVISE' LIMIT 1),
  numero, libelle, classe, niveau, type_compte, true
FROM (VALUES
  ('20', 'Charges immobilisées', 2, 1, 'Actif'),
  ('201', 'Frais d''établissement', 2, 2, 'Actif'),
  ('21', 'Immobilisations incorporelles', 2, 1, 'Actif'),
  ('211', 'Frais de R&D', 2, 2, 'Actif'),
  ('212', 'Brevets et licences', 2, 2, 'Actif'),
  ('213', 'Logiciels', 2, 2, 'Actif'),
  ('215', 'Fonds commercial', 2, 2, 'Actif'),
  ('22', 'Terrains', 2, 1, 'Actif'),
  ('221', 'Terrains agricoles', 2, 2, 'Actif'),
  ('222', 'Terrains nus', 2, 2, 'Actif'),
  ('223', 'Terrains bâtis', 2, 2, 'Actif'),
  ('23', 'Bâtiments', 2, 1, 'Actif'),
  ('231', 'Bâtiments industriels', 2, 2, 'Actif'),
  ('233', 'Bâtiments commerciaux', 2, 2, 'Actif'),
  ('24', 'Matériel', 2, 1, 'Actif'),
  ('241', 'Matériel industriel', 2, 2, 'Actif'),
  ('244', 'Matériel de bureau', 2, 2, 'Actif'),
  ('245', 'Matériel de transport', 2, 2, 'Actif'),
  ('25', 'Avances sur immobilisations', 2, 1, 'Actif'),
  ('251', 'Avances immo incorporelles', 2, 2, 'Actif'),
  ('252', 'Avances immo corporelles', 2, 2, 'Actif'),
  ('26', 'Titres de participation', 2, 1, 'Actif'),
  ('261', 'Titres participation groupe', 2, 2, 'Actif'),
  ('262', 'Titres participation hors groupe', 2, 2, 'Actif'),
  ('27', 'Autres immo financières', 2, 1, 'Actif'),
  ('271', 'Prêts non commerciaux', 2, 2, 'Actif'),
  ('275', 'Dépôts et cautionnements', 2, 2, 'Actif'),
  ('28', 'Amortissements', 2, 1, 'Actif'),
  ('281', 'Amort. immo incorporelles', 2, 2, 'Actif'),
  ('283', 'Amort. bâtiments', 2, 2, 'Actif'),
  ('284', 'Amort. matériel', 2, 2, 'Actif'),
  ('29', 'Provisions pour dépréciation', 2, 1, 'Actif'),
  ('291', 'Prov. dépréc. immo incorp.', 2, 2, 'Actif')
) AS t(numero, libelle, classe, niveau, type_compte)
ON CONFLICT (plan_comptable_id, numero_compte) DO UPDATE SET
  libelle_compte = EXCLUDED.libelle_compte,
  classe = EXCLUDED.classe,
  niveau = EXCLUDED.niveau,
  type_compte = EXCLUDED.type_compte;

-- Classe 3: Comptes de stocks
INSERT INTO public.comptes_globaux (plan_comptable_id, numero_compte, libelle_compte, classe, niveau, type_compte, is_active)
SELECT 
  (SELECT id FROM public.plans_comptables_globaux WHERE code = 'SYSCOHADA_REVISE' LIMIT 1),
  numero, libelle, classe, niveau, type_compte, true
FROM (VALUES
  ('31', 'Marchandises', 3, 1, 'Actif'),
  ('311', 'Marchandises A', 3, 2, 'Actif'),
  ('32', 'Matières premières', 3, 1, 'Actif'),
  ('321', 'Matières premières', 3, 2, 'Actif'),
  ('33', 'Autres approvisionnements', 3, 1, 'Actif'),
  ('331', 'Matières consommables', 3, 2, 'Actif'),
  ('34', 'Produits en cours', 3, 1, 'Actif'),
  ('341', 'Produits en cours', 3, 2, 'Actif'),
  ('35', 'Services en cours', 3, 1, 'Actif'),
  ('351', 'Études en cours', 3, 2, 'Actif'),
  ('36', 'Produits finis', 3, 1, 'Actif'),
  ('361', 'Produits finis', 3, 2, 'Actif'),
  ('37', 'Produits intermédiaires', 3, 1, 'Actif'),
  ('371', 'Produits intermédiaires', 3, 2, 'Actif'),
  ('38', 'Stocks en cours de route', 3, 1, 'Actif'),
  ('381', 'Marchandises en route', 3, 2, 'Actif'),
  ('39', 'Dépréciations des stocks', 3, 1, 'Actif'),
  ('391', 'Dépréc. marchandises', 3, 2, 'Actif')
) AS t(numero, libelle, classe, niveau, type_compte)
ON CONFLICT (plan_comptable_id, numero_compte) DO UPDATE SET
  libelle_compte = EXCLUDED.libelle_compte,
  classe = EXCLUDED.classe,
  niveau = EXCLUDED.niveau,
  type_compte = EXCLUDED.type_compte;

-- Classe 4: Comptes de tiers
INSERT INTO public.comptes_globaux (plan_comptable_id, numero_compte, libelle_compte, classe, niveau, type_compte, is_active)
SELECT 
  (SELECT id FROM public.plans_comptables_globaux WHERE code = 'SYSCOHADA_REVISE' LIMIT 1),
  numero, libelle, classe, niveau, type_compte, true
FROM (VALUES
  ('40', 'Fournisseurs', 4, 1, 'Passif'),
  ('401', 'Fournisseurs', 4, 2, 'Passif'),
  ('408', 'Fournisseurs avances', 4, 2, 'Passif'),
  ('41', 'Clients', 4, 1, 'Actif'),
  ('411', 'Clients', 4, 2, 'Actif'),
  ('416', 'Clients douteux', 4, 2, 'Actif'),
  ('42', 'Personnel', 4, 1, 'Passif'),
  ('421', 'Personnel avances', 4, 2, 'Actif'),
  ('422', 'Personnel rémunérations dues', 4, 2, 'Passif'),
  ('43', 'Organismes sociaux', 4, 1, 'Passif'),
  ('431', 'Sécurité sociale', 4, 2, 'Passif'),
  ('44', 'État', 4, 1, 'Passif'),
  ('441', 'Impôts sur bénéfices', 4, 2, 'Passif'),
  ('443', 'TVA facturée', 4, 2, 'Passif'),
  ('445', 'TVA récupérable', 4, 2, 'Actif'),
  ('46', 'Associés et groupe', 4, 1, 'Actif'),
  ('461', 'Associés capital', 4, 2, 'Actif'),
  ('462', 'Comptes courants', 4, 2, 'Passif'),
  ('47', 'Débiteurs créditeurs divers', 4, 1, 'Actif'),
  ('471', 'Comptes d''attente', 4, 2, 'Actif'),
  ('476', 'Charges constatées d''avance', 4, 2, 'Actif'),
  ('477', 'Produits constatés d''avance', 4, 2, 'Passif'),
  ('49', 'Dépréciations tiers', 4, 1, 'Actif'),
  ('491', 'Dépréc. clients', 4, 2, 'Actif')
) AS t(numero, libelle, classe, niveau, type_compte)
ON CONFLICT (plan_comptable_id, numero_compte) DO UPDATE SET
  libelle_compte = EXCLUDED.libelle_compte,
  classe = EXCLUDED.classe,
  niveau = EXCLUDED.niveau,
  type_compte = EXCLUDED.type_compte;

-- Classe 5: Comptes de trésorerie
INSERT INTO public.comptes_globaux (plan_comptable_id, numero_compte, libelle_compte, classe, niveau, type_compte, is_active)
SELECT 
  (SELECT id FROM public.plans_comptables_globaux WHERE code = 'SYSCOHADA_REVISE' LIMIT 1),
  numero, libelle, classe, niveau, type_compte, true
FROM (VALUES
  ('50', 'Titres de placement', 5, 1, 'Actif'),
  ('501', 'Titres du trésor', 5, 2, 'Actif'),
  ('51', 'Valeurs à encaisser', 5, 1, 'Actif'),
  ('511', 'Effets à encaisser', 5, 2, 'Actif'),
  ('52', 'Banques', 5, 1, 'Actif'),
  ('521', 'Banques locales', 5, 2, 'Actif'),
  ('53', 'Établissements financiers', 5, 1, 'Actif'),
  ('531', 'Chèques postaux', 5, 2, 'Actif'),
  ('56', 'Crédits de trésorerie', 5, 1, 'Passif'),
  ('561', 'Crédits de trésorerie', 5, 2, 'Passif'),
  ('57', 'Caisse', 5, 1, 'Actif'),
  ('571', 'Caisse principale', 5, 2, 'Actif'),
  ('58', 'Virements internes', 5, 1, 'Actif'),
  ('581', 'Virements de fonds', 5, 2, 'Actif'),
  ('59', 'Dépréciations titres', 5, 1, 'Actif'),
  ('591', 'Dépréc. titres trésor', 5, 2, 'Actif')
) AS t(numero, libelle, classe, niveau, type_compte)
ON CONFLICT (plan_comptable_id, numero_compte) DO UPDATE SET
  libelle_compte = EXCLUDED.libelle_compte,
  classe = EXCLUDED.classe,
  niveau = EXCLUDED.niveau,
  type_compte = EXCLUDED.type_compte;

-- Classe 6: Comptes de charges
INSERT INTO public.comptes_globaux (plan_comptable_id, numero_compte, libelle_compte, classe, niveau, type_compte, is_active)
SELECT 
  (SELECT id FROM public.plans_comptables_globaux WHERE code = 'SYSCOHADA_REVISE' LIMIT 1),
  numero, libelle, classe, niveau, type_compte, true
FROM (VALUES
  ('60', 'Achats', 6, 1, 'Charge'),
  ('601', 'Achats de marchandises', 6, 2, 'Charge'),
  ('602', 'Achats matières premières', 6, 2, 'Charge'),
  ('603', 'Variations de stocks', 6, 2, 'Charge'),
  ('604', 'Achats stockés', 6, 2, 'Charge'),
  ('61', 'Transports', 6, 1, 'Charge'),
  ('611', 'Transports sur achats', 6, 2, 'Charge'),
  ('612', 'Transports sur ventes', 6, 2, 'Charge'),
  ('62', 'Services extérieurs A', 6, 1, 'Charge'),
  ('621', 'Sous-traitance', 6, 2, 'Charge'),
  ('622', 'Locations', 6, 2, 'Charge'),
  ('624', 'Entretien', 6, 2, 'Charge'),
  ('625', 'Assurances', 6, 2, 'Charge'),
  ('627', 'Publicité', 6, 2, 'Charge'),
  ('63', 'Services extérieurs B', 6, 1, 'Charge'),
  ('631', 'Frais bancaires', 6, 2, 'Charge'),
  ('632', 'Honoraires', 6, 2, 'Charge'),
  ('64', 'Impôts et taxes', 6, 1, 'Charge'),
  ('641', 'Impôts directs', 6, 2, 'Charge'),
  ('65', 'Autres charges', 6, 1, 'Charge'),
  ('651', 'Pertes sur créances', 6, 2, 'Charge'),
  ('66', 'Charges de personnel', 6, 1, 'Charge'),
  ('661', 'Rémunérations personnel', 6, 2, 'Charge'),
  ('664', 'Charges sociales', 6, 2, 'Charge'),
  ('67', 'Frais financiers', 6, 1, 'Charge'),
  ('671', 'Intérêts emprunts', 6, 2, 'Charge'),
  ('675', 'Pertes de change', 6, 2, 'Charge'),
  ('68', 'Dotations amortissements', 6, 1, 'Charge'),
  ('681', 'Dotations amort. exploitation', 6, 2, 'Charge'),
  ('69', 'Dotations provisions', 6, 1, 'Charge'),
  ('691', 'Dotations prov. exploitation', 6, 2, 'Charge')
) AS t(numero, libelle, classe, niveau, type_compte)
ON CONFLICT (plan_comptable_id, numero_compte) DO UPDATE SET
  libelle_compte = EXCLUDED.libelle_compte,
  classe = EXCLUDED.classe,
  niveau = EXCLUDED.niveau,
  type_compte = EXCLUDED.type_compte;

-- Classe 7: Comptes de produits
INSERT INTO public.comptes_globaux (plan_comptable_id, numero_compte, libelle_compte, classe, niveau, type_compte, is_active)
SELECT 
  (SELECT id FROM public.plans_comptables_globaux WHERE code = 'SYSCOHADA_REVISE' LIMIT 1),
  numero, libelle, classe, niveau, type_compte, true
FROM (VALUES
  ('70', 'Ventes', 7, 1, 'Produit'),
  ('701', 'Ventes de marchandises', 7, 2, 'Produit'),
  ('702', 'Ventes produits finis', 7, 2, 'Produit'),
  ('706', 'Services vendus', 7, 2, 'Produit'),
  ('707', 'Produits accessoires', 7, 2, 'Produit'),
  ('71', 'Subventions exploitation', 7, 1, 'Produit'),
  ('711', 'Subventions reçues', 7, 2, 'Produit'),
  ('72', 'Production immobilisée', 7, 1, 'Produit'),
  ('721', 'Immo incorporelles', 7, 2, 'Produit'),
  ('722', 'Immo corporelles', 7, 2, 'Produit'),
  ('73', 'Variations stocks produits', 7, 1, 'Produit'),
  ('734', 'Var. stocks en cours', 7, 2, 'Produit'),
  ('736', 'Var. stocks produits finis', 7, 2, 'Produit'),
  ('75', 'Autres produits', 7, 1, 'Produit'),
  ('758', 'Produits divers', 7, 2, 'Produit'),
  ('77', 'Revenus financiers', 7, 1, 'Produit'),
  ('771', 'Intérêts de prêts', 7, 2, 'Produit'),
  ('775', 'Gains de change', 7, 2, 'Produit'),
  ('78', 'Transferts de charges', 7, 1, 'Produit'),
  ('781', 'Transferts charges expl.', 7, 2, 'Produit'),
  ('79', 'Reprises provisions', 7, 1, 'Produit'),
  ('791', 'Reprises prov. exploitation', 7, 2, 'Produit')
) AS t(numero, libelle, classe, niveau, type_compte)
ON CONFLICT (plan_comptable_id, numero_compte) DO UPDATE SET
  libelle_compte = EXCLUDED.libelle_compte,
  classe = EXCLUDED.classe,
  niveau = EXCLUDED.niveau,
  type_compte = EXCLUDED.type_compte;

-- Classe 8: Comptes H.A.O. et résultat
INSERT INTO public.comptes_globaux (plan_comptable_id, numero_compte, libelle_compte, classe, niveau, type_compte, is_active)
SELECT 
  (SELECT id FROM public.plans_comptables_globaux WHERE code = 'SYSCOHADA_REVISE' LIMIT 1),
  numero, libelle, classe, niveau, type_compte, true
FROM (VALUES
  ('81', 'VNC des cessions', 8, 1, 'Charge'),
  ('811', 'VNC immo incorporelles', 8, 2, 'Charge'),
  ('812', 'VNC immo corporelles', 8, 2, 'Charge'),
  ('82', 'Produits des cessions', 8, 1, 'Produit'),
  ('821', 'PC immo incorporelles', 8, 2, 'Produit'),
  ('822', 'PC immo corporelles', 8, 2, 'Produit'),
  ('83', 'Charges HAO', 8, 1, 'Charge'),
  ('831', 'Charges HAO constatées', 8, 2, 'Charge'),
  ('84', 'Produits HAO', 8, 1, 'Produit'),
  ('841', 'Produits HAO constatés', 8, 2, 'Produit'),
  ('85', 'Dotations HAO', 8, 1, 'Charge'),
  ('851', 'Dot. amort. HAO', 8, 2, 'Charge'),
  ('86', 'Reprises HAO', 8, 1, 'Produit'),
  ('861', 'Reprises amort. HAO', 8, 2, 'Produit'),
  ('87', 'Participation travailleurs', 8, 1, 'Charge'),
  ('871', 'Participation légale', 8, 2, 'Charge'),
  ('88', 'Subventions équilibre', 8, 1, 'Produit'),
  ('881', 'Subventions équilibre', 8, 2, 'Produit'),
  ('89', 'Impôts sur résultat', 8, 1, 'Charge'),
  ('891', 'IS exercice', 8, 2, 'Charge')
) AS t(numero, libelle, classe, niveau, type_compte)
ON CONFLICT (plan_comptable_id, numero_compte) DO UPDATE SET
  libelle_compte = EXCLUDED.libelle_compte,
  classe = EXCLUDED.classe,
  niveau = EXCLUDED.niveau,
  type_compte = EXCLUDED.type_compte;
