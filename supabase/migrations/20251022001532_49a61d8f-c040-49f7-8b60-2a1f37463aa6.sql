-- =====================================================
-- COMPLETION 1: TRIGGERS UPDATED_AT (28 TRIGGERS)
-- =====================================================

-- Pharmacies
CREATE TRIGGER trigger_update_pharmacies_timestamp
  BEFORE UPDATE ON public.pharmacies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Personnel
CREATE TRIGGER trigger_update_personnel_timestamp
  BEFORE UPDATE ON public.personnel
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Clients
CREATE TRIGGER trigger_update_clients_timestamp
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Produits
CREATE TRIGGER trigger_update_produits_timestamp
  BEFORE UPDATE ON public.produits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lots produit
CREATE TRIGGER trigger_update_lots_produit_timestamp
  BEFORE UPDATE ON public.lots_produit
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Familles produits
CREATE TRIGGER trigger_update_familles_produits_timestamp
  BEFORE UPDATE ON public.familles_produits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Laboratoires
CREATE TRIGGER trigger_update_laboratoires_timestamp
  BEFORE UPDATE ON public.laboratoires
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fournisseurs
CREATE TRIGGER trigger_update_fournisseurs_timestamp
  BEFORE UPDATE ON public.fournisseurs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ventes
CREATE TRIGGER trigger_update_ventes_timestamp
  BEFORE UPDATE ON public.ventes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lignes vente
CREATE TRIGGER trigger_update_lignes_vente_timestamp
  BEFORE UPDATE ON public.lignes_vente
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Paiements vente
CREATE TRIGGER trigger_update_paiements_vente_timestamp
  BEFORE UPDATE ON public.paiements_vente
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sessions caisse
CREATE TRIGGER trigger_update_sessions_caisse_timestamp
  BEFORE UPDATE ON public.sessions_caisse
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mouvements caisse
CREATE TRIGGER trigger_update_mouvements_caisse_timestamp
  BEFORE UPDATE ON public.mouvements_caisse
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Stock actuel
CREATE TRIGGER trigger_update_stock_actuel_timestamp
  BEFORE UPDATE ON public.stock_actuel
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mouvements stock
CREATE TRIGGER trigger_update_mouvements_stock_timestamp
  BEFORE UPDATE ON public.mouvements_stock
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inventaires
CREATE TRIGGER trigger_update_inventaires_timestamp
  BEFORE UPDATE ON public.inventaires
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lignes inventaire
CREATE TRIGGER trigger_update_lignes_inventaire_timestamp
  BEFORE UPDATE ON public.lignes_inventaire
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Commandes
CREATE TRIGGER trigger_update_commandes_timestamp
  BEFORE UPDATE ON public.commandes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lignes commande
CREATE TRIGGER trigger_update_lignes_commande_timestamp
  BEFORE UPDATE ON public.lignes_commande
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Receptions
CREATE TRIGGER trigger_update_receptions_timestamp
  BEFORE UPDATE ON public.receptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lignes reception
CREATE TRIGGER trigger_update_lignes_reception_timestamp
  BEFORE UPDATE ON public.lignes_reception
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Alertes
CREATE TRIGGER trigger_update_alertes_timestamp
  BEFORE UPDATE ON public.alertes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Parametres systeme
CREATE TRIGGER trigger_update_parametres_systeme_timestamp
  BEFORE UPDATE ON public.parametres_systeme
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();