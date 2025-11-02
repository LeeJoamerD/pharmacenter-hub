-- Correction des warnings de sécurité pour la table caisses et les vues

-- 1. Corriger les policies de la table caisses pour ne permettre que les utilisateurs authentifiés
DROP POLICY IF EXISTS "Users can view caisses from their tenant" ON public.caisses;
CREATE POLICY "Users can view caisses from their tenant"
  ON public.caisses FOR SELECT
  TO authenticated
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can manage caisses in their tenant" ON public.caisses;
CREATE POLICY "Users can manage caisses in their tenant"
  ON public.caisses FOR ALL
  TO authenticated
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- 2. Recréer les vues sans SECURITY DEFINER
-- Vue 1 : Rapport complet par session (sans SECURITY DEFINER)
CREATE OR REPLACE VIEW public.v_rapport_session_complet AS
SELECT 
  s.id as session_id,
  s.tenant_id,
  s.numero_session,
  s.type_session,
  s.date_session,
  s.statut,
  c.nom_caisse,
  c.code_caisse,
  c.emplacement as caisse_emplacement,
  
  -- Agent/Caissier
  p.noms || ' ' || p.prenoms as caissier_nom,
  
  -- Fond de caisse
  s.fond_caisse_ouverture,
  s.fond_caisse_fermeture,
  s.montant_theorique_fermeture,
  s.ecart,
  
  -- Horaires
  s.date_ouverture,
  s.date_fermeture,
  
  -- Statistiques des ventes
  COUNT(DISTINCT v.id) as nombre_ventes,
  COALESCE(SUM(v.montant_net), 0) as total_ventes,
  COALESCE(AVG(v.montant_net), 0) as montant_moyen_vente,
  
  -- Répartition par mode de paiement
  COALESCE(SUM(CASE WHEN v.mode_paiement = 'Espèces' THEN v.montant_net ELSE 0 END), 0) as total_especes,
  COALESCE(SUM(CASE WHEN v.mode_paiement = 'Carte Bancaire' THEN v.montant_net ELSE 0 END), 0) as total_carte,
  COALESCE(SUM(CASE WHEN v.mode_paiement = 'Mobile Money' THEN v.montant_net ELSE 0 END), 0) as total_mobile,
  COALESCE(SUM(CASE WHEN v.mode_paiement = 'Chèque' THEN v.montant_net ELSE 0 END), 0) as total_cheque,
  COALESCE(SUM(CASE WHEN v.mode_paiement = 'Virement' THEN v.montant_net ELSE 0 END), 0) as total_virement,
  
  -- Mouvements de caisse
  COALESCE(SUM(CASE WHEN mc.type_mouvement = 'entree' THEN mc.montant ELSE 0 END), 0) as total_entrees,
  COALESCE(SUM(CASE WHEN mc.type_mouvement = 'sortie' THEN mc.montant ELSE 0 END), 0) as total_sorties,
  
  -- Nombre d'articles vendus
  COALESCE((SELECT SUM(quantite) FROM lignes_ventes WHERE vente_id = v.id), 0) as nombre_articles_vendus

FROM sessions_caisse s
LEFT JOIN caisses c ON c.id = s.caisse_id
LEFT JOIN personnel p ON p.id = s.caissier_id
LEFT JOIN ventes v ON v.session_caisse_id = s.id AND v.statut = 'Validée'
LEFT JOIN mouvements_caisse mc ON mc.session_caisse_id = s.id

GROUP BY 
  s.id, s.tenant_id, s.numero_session, s.type_session, s.date_session,
  s.statut, s.fond_caisse_ouverture, s.fond_caisse_fermeture,
  s.montant_theorique_fermeture, s.ecart, s.date_ouverture, s.date_fermeture,
  c.nom_caisse, c.code_caisse, c.emplacement,
  p.noms, p.prenoms, v.id;

-- Vue 2 : Rapport par caisse et type de session (sans SECURITY DEFINER)
CREATE OR REPLACE VIEW public.v_rapport_par_caisse_type AS
SELECT 
  c.id as caisse_id,
  c.tenant_id,
  c.nom_caisse,
  c.code_caisse,
  s.type_session,
  s.date_session,
  
  COUNT(DISTINCT s.id) as nombre_sessions,
  COALESCE(SUM(v.montant_net), 0) as total_ventes,
  COUNT(DISTINCT v.id) as nombre_ventes,
  COALESCE(AVG(v.montant_net), 0) as montant_moyen_vente

FROM caisses c
LEFT JOIN sessions_caisse s ON s.caisse_id = c.id
LEFT JOIN ventes v ON v.session_caisse_id = s.id AND v.statut = 'Validée'

GROUP BY 
  c.id, c.tenant_id, c.nom_caisse, c.code_caisse,
  s.type_session, s.date_session;

-- Vue 3 : Résumé journalier (sans SECURITY DEFINER)
CREATE OR REPLACE VIEW public.v_resume_journalier AS
SELECT 
  s.tenant_id,
  s.date_session,
  
  COUNT(DISTINCT s.id) as nombre_sessions_ouvertes,
  COUNT(DISTINCT c.id) as nombre_caisses_actives,
  
  COALESCE(SUM(v.montant_net), 0) as total_ventes_journee,
  COUNT(DISTINCT v.id) as nombre_ventes_journee,
  
  COALESCE(SUM(CASE WHEN s.type_session = 'Matin' THEN v.montant_net ELSE 0 END), 0) as total_matin,
  COALESCE(SUM(CASE WHEN s.type_session = 'Midi' THEN v.montant_net ELSE 0 END), 0) as total_midi,
  COALESCE(SUM(CASE WHEN s.type_session = 'Soir' THEN v.montant_net ELSE 0 END), 0) as total_soir

FROM sessions_caisse s
LEFT JOIN caisses c ON c.id = s.caisse_id
LEFT JOIN ventes v ON v.session_caisse_id = s.id AND v.statut = 'Validée'

GROUP BY 
  s.tenant_id, s.date_session;