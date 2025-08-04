-- Create the AFTER trigger for personnel creation
CREATE TRIGGER trigger_create_client_for_personnel
  AFTER INSERT ON public.employes_rh
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_for_personnel();