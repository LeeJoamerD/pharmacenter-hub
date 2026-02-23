DROP FUNCTION IF EXISTS search_lots_paginated(uuid, text, text, text, text, integer, integer);
NOTIFY pgrst, 'reload schema';