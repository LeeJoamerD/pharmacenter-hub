-- Correction de la vue v_rapport_session_complet qui retournait une ligne par vente
-- au lieu d'une ligne par session à cause de v.id dans le GROUP BY

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
  COALESCE(SUM(CASE WHEN mc.type_mouvement = 'Entrée' THEN mc.montant ELSE 0 END), 0) as total_entrees,
  COALESCE(SUM(CASE WHEN mc.type_mouvement = 'Sortie' THEN mc.montant ELSE 0 END), 0) as total_sorties,
  
  -- Nombre total d'articles vendus (corrigé avec sous-requête)
  COALESCE((
    SELECT SUM(lv.quantite) 
    FROM lignes_ventes lv
    INNER JOIN ventes v2 ON v2.id = lv.vente_id
    WHERE v2.session_caisse_id = s.id
      AND v2.statut = 'Validée'
  ), 0) as nombre_articles_vendus

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
  p.noms, p.prenoms;

COMMENT ON VIEW public.v_rapport_session_complet IS 
'Vue agrégée retournant une ligne par session avec statistiques complètes des ventes et mouvements';

-- Fonction pour mettre à jour montant_total_ventes lors de l'ajout/modification de ventes
CREATE OR REPLACE FUNCTION update_session_total_ventes()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer le total des ventes validées pour la session
  UPDATE sessions_caisse
  SET montant_total_ventes = COALESCE((
    SELECT SUM(montant_net)
    FROM ventes
    WHERE session_caisse_id = COALESCE(NEW.session_caisse_id, OLD.session_caisse_id)
      AND statut = 'Validée'
  ), 0),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.session_caisse_id, OLD.session_caisse_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Créer le trigger sur INSERT
DROP TRIGGER IF EXISTS trigger_update_session_ventes_insert ON ventes;
CREATE TRIGGER trigger_update_session_ventes_insert
  AFTER INSERT ON ventes
  FOR EACH ROW
  WHEN (NEW.statut = 'Validée' AND NEW.session_caisse_id IS NOT NULL)
  EXECUTE FUNCTION update_session_total_ventes();

-- Créer le trigger sur UPDATE
DROP TRIGGER IF EXISTS trigger_update_session_ventes_update ON ventes;
CREATE TRIGGER trigger_update_session_ventes_update
  AFTER UPDATE ON ventes
  FOR EACH ROW
  WHEN (
    (NEW.statut = 'Validée' OR OLD.statut = 'Validée')
    AND (NEW.session_caisse_id IS NOT NULL OR OLD.session_caisse_id IS NOT NULL)
  )
  EXECUTE FUNCTION update_session_total_ventes();

-- Créer le trigger sur DELETE
DROP TRIGGER IF EXISTS trigger_update_session_ventes_delete ON ventes;
CREATE TRIGGER trigger_update_session_ventes_delete
  AFTER DELETE ON ventes
  FOR EACH ROW
  WHEN (OLD.statut = 'Validée' AND OLD.session_caisse_id IS NOT NULL)
  EXECUTE FUNCTION update_session_total_ventes();

COMMENT ON FUNCTION update_session_total_ventes() IS 
'Trigger pour maintenir à jour le montant_total_ventes dans sessions_caisse';

-- Mettre à jour les montant_total_ventes pour toutes les sessions existantes
UPDATE sessions_caisse s
SET montant_total_ventes = COALESCE((
  SELECT SUM(v.montant_net)
  FROM ventes v
  WHERE v.session_caisse_id = s.id
    AND v.statut = 'Validée'
), 0),
updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM ventes v
  WHERE v.session_caisse_id = s.id
    AND v.statut = 'Validée'
);