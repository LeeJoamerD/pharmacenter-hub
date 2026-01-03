-- =====================================================
-- CORRECTION DES VUES SECURITY DEFINER
-- Recréation des vues avec security_invoker = true
-- pour respecter les politiques RLS de l'utilisateur
-- =====================================================

-- 1. Vue produits_with_stock
DROP VIEW IF EXISTS public.v_produits_with_famille CASCADE;
DROP VIEW IF EXISTS public.produits_with_stock CASCADE;

CREATE VIEW public.produits_with_stock
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.tenant_id,
  p.libelle_produit,
  p.code_cip,
  p.famille_id,
  p.rayon_id,
  p.forme_id,
  p.laboratoires_id,
  p.dci_id,
  p.classe_therapeutique_id,
  p.categorie_tarification_id,
  p.prix_achat,
  p.prix_vente_ht,
  p.prix_vente_ttc,
  p.tva,
  p.taux_tva,
  p.centime_additionnel,
  p.taux_centime_additionnel,
  p.stock_limite,
  p.stock_faible,
  p.stock_critique,
  p.is_active,
  p.created_at,
  p.updated_at,
  p.id_produit_source,
  p.quantite_unites_details_source,
  p.niveau_detail,
  COALESCE(sum(l.quantite_restante), 0::bigint)::integer AS stock_actuel
FROM produits p
LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p.tenant_id AND l.quantite_restante > 0
GROUP BY p.id, p.tenant_id, p.libelle_produit, p.code_cip, p.famille_id, p.rayon_id, 
         p.forme_id, p.laboratoires_id, p.dci_id, p.classe_therapeutique_id, 
         p.categorie_tarification_id, p.prix_achat, p.prix_vente_ht, p.prix_vente_ttc, 
         p.tva, p.taux_tva, p.centime_additionnel, p.taux_centime_additionnel, 
         p.stock_limite, p.stock_faible, p.stock_critique, p.is_active, p.created_at, 
         p.updated_at, p.id_produit_source, p.quantite_unites_details_source, p.niveau_detail;

-- 2. Vue v_produits_with_famille
CREATE VIEW public.v_produits_with_famille
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.tenant_id,
  p.libelle_produit,
  p.code_cip,
  p.famille_id,
  p.rayon_id,
  p.forme_id,
  p.laboratoires_id,
  p.dci_id,
  p.classe_therapeutique_id,
  p.categorie_tarification_id,
  p.prix_achat,
  p.prix_vente_ht,
  p.prix_vente_ttc,
  p.tva,
  p.taux_tva,
  p.centime_additionnel,
  p.taux_centime_additionnel,
  p.stock_limite,
  p.stock_faible,
  p.stock_critique,
  p.is_active,
  p.created_at,
  p.updated_at,
  p.id_produit_source,
  p.quantite_unites_details_source,
  p.niveau_detail,
  p.stock_actuel,
  f.libelle_famille
FROM produits_with_stock p
LEFT JOIN famille_produit f ON f.id = p.famille_id;

-- 3. Vue v_comptes_avec_soldes
DROP VIEW IF EXISTS public.v_comptes_avec_soldes CASCADE;

CREATE VIEW public.v_comptes_avec_soldes
WITH (security_invoker = true)
AS
SELECT 
  pc.id,
  pc.tenant_id,
  pc.numero_compte AS code,
  pc.libelle_compte AS libelle,
  pc.type_compte AS type,
  pc.classe,
  pc.compte_parent_id AS parent_id,
  pc.niveau,
  pc.is_active AS actif,
  pc.analytique,
  pc.rapprochement,
  pc.description,
  pc.created_at,
  pc.updated_at,
  COALESCE(sum(b.solde_debit), 0::numeric) AS solde_debiteur,
  COALESCE(sum(b.solde_credit), 0::numeric) AS solde_crediteur
FROM plan_comptable pc
LEFT JOIN balances b ON b.compte_id = pc.id AND b.tenant_id = pc.tenant_id
GROUP BY pc.id, pc.tenant_id, pc.numero_compte, pc.libelle_compte, pc.type_compte, 
         pc.classe, pc.compte_parent_id, pc.niveau, pc.is_active, pc.analytique, 
         pc.rapprochement, pc.description, pc.created_at, pc.updated_at;

-- 4. Vue v_ecritures_avec_details
DROP VIEW IF EXISTS public.v_ecritures_avec_details CASCADE;

CREATE VIEW public.v_ecritures_avec_details
WITH (security_invoker = true)
AS
SELECT 
  e.id,
  e.tenant_id,
  e.numero_piece,
  e.date_ecriture,
  e.libelle,
  e.reference_type,
  e.reference_id,
  e.statut,
  e.montant_total,
  e.created_at,
  e.updated_at,
  j.code AS journal_code,
  j.name AS journal_name,
  j.type AS journal_type,
  (creator.prenoms || ' '::text) || creator.noms AS created_by,
  e.created_by_id,
  (validator.prenoms || ' '::text) || validator.noms AS validated_by,
  e.validated_by_id,
  e.validated_at,
  (locker.prenoms || ' '::text) || locker.noms AS locked_by,
  e.locked_by_id,
  e.locked_at,
  ex.libelle_exercice AS exercice_name,
  ex.date_debut AS exercice_debut,
  ex.date_fin AS exercice_fin,
  e.exercice_id,
  e.journal_id
FROM ecritures_comptables e
LEFT JOIN accounting_journals j ON e.journal_id = j.id
LEFT JOIN personnel creator ON e.created_by_id = creator.id
LEFT JOIN personnel validator ON e.validated_by_id = validator.id
LEFT JOIN personnel locker ON e.locked_by_id = locker.id
LEFT JOIN exercices_comptables ex ON e.exercice_id = ex.id;

-- 5. Vue v_factures_avec_details
DROP VIEW IF EXISTS public.v_factures_avec_details CASCADE;

CREATE VIEW public.v_factures_avec_details
WITH (security_invoker = true)
AS
SELECT 
  f.id,
  f.tenant_id,
  f.numero,
  f.type,
  f.client_id,
  f.fournisseur_id,
  f.vente_id,
  f.reception_id,
  f.date_emission,
  f.date_echeance,
  f.libelle,
  f.reference_externe,
  f.notes,
  f.montant_ht,
  f.montant_tva,
  f.montant_ttc,
  f.statut,
  f.statut_paiement,
  f.montant_paye,
  f.montant_restant,
  f.relances_effectuees,
  f.derniere_relance,
  f.pieces_jointes,
  f.created_by_id,
  f.created_at,
  f.updated_at,
  c.nom_complet AS client_nom,
  c.telephone AS client_telephone,
  c.email AS client_email,
  c.adresse AS client_adresse,
  fou.nom AS fournisseur_nom,
  fou.telephone_appel AS fournisseur_telephone,
  fou.email AS fournisseur_email,
  fou.adresse AS fournisseur_adresse,
  COALESCE(c.nom_complet, fou.nom) AS client_fournisseur,
  (p.prenoms || ' '::text) || p.noms AS created_by,
  (SELECT count(*) FROM lignes_facture WHERE lignes_facture.facture_id = f.id) AS nombre_lignes,
  CASE
    WHEN f.date_echeance < CURRENT_DATE AND f.statut_paiement <> 'payee'::text THEN CURRENT_DATE - f.date_echeance
    ELSE 0
  END AS jours_retard,
  CASE
    WHEN f.date_echeance >= CURRENT_DATE AND f.statut_paiement <> 'payee'::text THEN f.date_echeance - CURRENT_DATE
    ELSE 0
  END AS jours_avant_echeance
FROM factures f
LEFT JOIN clients c ON f.client_id = c.id
LEFT JOIN fournisseurs fou ON f.fournisseur_id = fou.id
LEFT JOIN personnel p ON f.created_by_id = p.id;

-- 6. Vue v_sessions_caisse_resumees
DROP VIEW IF EXISTS public.v_sessions_caisse_resumees CASCADE;

CREATE VIEW public.v_sessions_caisse_resumees
WITH (security_invoker = true)
AS
SELECT 
  s.id,
  s.tenant_id,
  s.numero_session,
  COALESCE(s.caissier_id, s.agent_id) AS agent_id,
  s.date_ouverture,
  s.date_fermeture,
  s.fond_caisse_ouverture,
  s.montant_theorique_fermeture,
  COALESCE(s.montant_reel_fermeture, s.fond_caisse_fermeture) AS montant_reel_fermeture,
  s.ecart,
  s.statut,
  s.notes,
  count(DISTINCT m.id) AS nombre_mouvements,
  sum(CASE WHEN m.type_mouvement = 'Encaissement'::text THEN m.montant ELSE 0::numeric END) AS total_encaissements,
  sum(CASE WHEN m.type_mouvement = 'Decaissement'::text THEN m.montant ELSE 0::numeric END) AS total_decaissements,
  (p.prenoms || ' '::text) || p.noms AS agent_nom,
  c.nom_caisse AS caisse_nom,
  c.type_caisse
FROM sessions_caisse s
LEFT JOIN mouvements_caisse m ON m.session_caisse_id = s.id
LEFT JOIN personnel p ON p.id = COALESCE(s.caissier_id, s.agent_id)
LEFT JOIN caisses c ON c.id = s.caisse_id
GROUP BY s.id, s.tenant_id, s.numero_session, s.caissier_id, s.agent_id, 
         s.date_ouverture, s.date_fermeture, s.fond_caisse_ouverture, 
         s.montant_theorique_fermeture, s.montant_reel_fermeture, 
         s.fond_caisse_fermeture, s.ecart, s.statut, s.notes, 
         p.prenoms, p.noms, c.nom_caisse, c.type_caisse;

-- 7. Vue v_resume_journalier
DROP VIEW IF EXISTS public.v_resume_journalier CASCADE;

CREATE VIEW public.v_resume_journalier
WITH (security_invoker = true)
AS
SELECT 
  s.tenant_id,
  date(s.date_ouverture) AS date_journee,
  count(DISTINCT s.id) AS nombre_sessions,
  count(DISTINCT m.id) AS nombre_mouvements,
  sum(CASE WHEN m.type_mouvement = 'Encaissement'::text THEN m.montant ELSE 0::numeric END) AS total_encaissements,
  sum(CASE WHEN m.type_mouvement = 'Decaissement'::text THEN m.montant ELSE 0::numeric END) AS total_decaissements,
  sum(CASE WHEN m.type_mouvement = 'Encaissement'::text THEN m.montant ELSE 0::numeric END) - 
  sum(CASE WHEN m.type_mouvement = 'Decaissement'::text THEN m.montant ELSE 0::numeric END) AS solde_net,
  sum(COALESCE(s.ecart, 0::numeric)) AS ecart_total
FROM sessions_caisse s
LEFT JOIN mouvements_caisse m ON m.session_caisse_id = s.id
GROUP BY s.tenant_id, date(s.date_ouverture);

-- 8. Vue v_rapport_par_caisse_type
DROP VIEW IF EXISTS public.v_rapport_par_caisse_type CASCADE;

CREATE VIEW public.v_rapport_par_caisse_type
WITH (security_invoker = true)
AS
SELECT 
  s.tenant_id,
  c.type_caisse,
  c.nom_caisse AS caisse_nom,
  date(s.date_ouverture) AS date_journee,
  count(DISTINCT s.id) AS nombre_sessions,
  sum(CASE WHEN m.type_mouvement = 'Encaissement'::text THEN m.montant ELSE 0::numeric END) AS total_encaissements,
  sum(CASE WHEN m.type_mouvement = 'Decaissement'::text THEN m.montant ELSE 0::numeric END) AS total_decaissements
FROM sessions_caisse s
JOIN caisses c ON c.id = s.caisse_id
LEFT JOIN mouvements_caisse m ON m.session_caisse_id = s.id
GROUP BY s.tenant_id, c.type_caisse, c.nom_caisse, date(s.date_ouverture);

-- 9. Vue v_rapport_session_complet
DROP VIEW IF EXISTS public.v_rapport_session_complet CASCADE;

CREATE VIEW public.v_rapport_session_complet
WITH (security_invoker = true)
AS
SELECT 
  s.id,
  s.tenant_id,
  s.numero_session,
  s.date_ouverture,
  s.date_fermeture,
  s.fond_caisse_ouverture,
  COALESCE(s.montant_reel_fermeture, s.fond_caisse_fermeture) AS montant_reel_fermeture,
  s.montant_theorique_fermeture,
  s.ecart,
  s.statut,
  (p.prenoms || ' '::text) || p.noms AS agent_nom,
  c.nom_caisse AS caisse_nom,
  c.type_caisse,
  json_agg(
    json_build_object(
      'id', m.id,
      'type', m.type_mouvement,
      'montant', m.montant,
      'motif', m.motif,
      'created_at', m.created_at
    ) ORDER BY m.created_at
  ) FILTER (WHERE m.id IS NOT NULL) AS mouvements
FROM sessions_caisse s
LEFT JOIN personnel p ON p.id = COALESCE(s.caissier_id, s.agent_id)
LEFT JOIN caisses c ON c.id = s.caisse_id
LEFT JOIN mouvements_caisse m ON m.session_caisse_id = s.id
GROUP BY s.id, s.tenant_id, s.numero_session, s.date_ouverture, s.date_fermeture,
         s.fond_caisse_ouverture, s.montant_reel_fermeture, s.fond_caisse_fermeture,
         s.montant_theorique_fermeture, s.ecart, s.statut,
         p.prenoms, p.noms, c.nom_caisse, c.type_caisse;

-- 10. Vue v_rentabilite_produits (définition originale préservée)
DROP VIEW IF EXISTS public.v_rentabilite_produits CASCADE;

CREATE VIEW public.v_rentabilite_produits
WITH (security_invoker = true)
AS
SELECT 
  p.id AS produit_id,
  p.tenant_id,
  p.libelle_produit AS produit_nom,
  p.code_cip AS code_produit,
  fp.libelle_famille AS famille,
  0 AS chiffre_affaires,
  0 AS quantite_vendue,
  0 AS cout_achat,
  0 AS marge_brute,
  0 AS taux_marge,
  NULL::date AS derniere_vente
FROM produits p
LEFT JOIN famille_produit fp ON p.famille_id = fp.id;

-- 11. Vue v_performance_centres_couts (définition originale préservée)
DROP VIEW IF EXISTS public.v_performance_centres_couts CASCADE;

CREATE VIEW public.v_performance_centres_couts
WITH (security_invoker = true)
AS
SELECT 
  cc.id,
  cc.tenant_id,
  cc.code,
  cc.nom,
  cc.type_centre,
  cc.responsable_id,
  (p.noms || ' '::text) || p.prenoms AS responsable_nom,
  COALESCE(sum(b.montant_prevu), 0::numeric) AS budget_total,
  COALESCE(sum(b.montant_realise), 0::numeric) AS realise_total,
  COALESCE(sum(b.montant_prevu) - sum(b.montant_realise), 0::numeric) AS ecart_montant,
  CASE
    WHEN sum(b.montant_prevu) > 0::numeric THEN ((sum(b.montant_realise) - sum(b.montant_prevu)) / sum(b.montant_prevu)) * 100::numeric
    ELSE 0::numeric
  END AS ecart_pourcentage,
  count(DISTINCT b.id) AS nombre_budgets,
  0 AS budgets_depassement,
  cc.est_actif,
  cc.created_at
FROM centres_couts cc
LEFT JOIN personnel p ON cc.responsable_id = p.id
LEFT JOIN budgets b ON cc.id = b.centre_cout_id AND b.statut = ANY(ARRAY['valide'::text, 'en_cours'::text])
GROUP BY cc.id, cc.code, cc.nom, cc.type_centre, cc.responsable_id, p.noms, p.prenoms, cc.est_actif, cc.created_at;

-- Accorder les permissions sur les vues
GRANT SELECT ON public.produits_with_stock TO authenticated;
GRANT SELECT ON public.v_produits_with_famille TO authenticated;
GRANT SELECT ON public.v_comptes_avec_soldes TO authenticated;
GRANT SELECT ON public.v_ecritures_avec_details TO authenticated;
GRANT SELECT ON public.v_factures_avec_details TO authenticated;
GRANT SELECT ON public.v_sessions_caisse_resumees TO authenticated;
GRANT SELECT ON public.v_resume_journalier TO authenticated;
GRANT SELECT ON public.v_rapport_par_caisse_type TO authenticated;
GRANT SELECT ON public.v_rapport_session_complet TO authenticated;
GRANT SELECT ON public.v_rentabilite_produits TO authenticated;
GRANT SELECT ON public.v_performance_centres_couts TO authenticated;