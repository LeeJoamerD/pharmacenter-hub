-- Add unique constraint on (tenant_id, config_key) for network_chat_config upsert
ALTER TABLE public.network_chat_config
ADD CONSTRAINT unique_tenant_config_key 
UNIQUE (tenant_id, config_key);