-- Triggers pour la table employes_rh
CREATE TRIGGER trigger_create_client_for_personnel
  AFTER INSERT ON public.employes_rh
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_for_personnel();

CREATE TRIGGER trigger_update_client_for_personnel
  AFTER UPDATE ON public.employes_rh
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_for_personnel();

CREATE TRIGGER trigger_delete_client_for_personnel
  AFTER DELETE ON public.employes_rh
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_client_for_personnel();