-- Vérifier si les tables societes et conventionnes existent
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('societes', 'conventionnes');

-- Vérifier les triggers existants
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
AND event_object_table IN ('societes', 'conventionnes');