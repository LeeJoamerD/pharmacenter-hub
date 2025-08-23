-- Ajouter une contrainte unique sur tenant_id pour la table password_policies
-- Cela permettra l'upsert correct dans SecurityDashboard
ALTER TABLE public.password_policies 
ADD CONSTRAINT password_policies_tenant_unique 
UNIQUE (tenant_id);