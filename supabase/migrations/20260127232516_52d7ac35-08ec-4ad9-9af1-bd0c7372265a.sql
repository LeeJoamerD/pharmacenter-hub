-- Phase 2a: Dissocier les références FK uniquement

-- Dissocier les sessions de caisse
UPDATE public.sessions_caisse 
SET agent_id = NULL
WHERE agent_id IN (
  '7a3dcaaa-1f81-4b46-86c5-12715ee00e7f',
  '8aee9f32-e9a0-44a5-b2fe-093447bbb2f2',
  '4080b193-fcc8-4b05-841d-6245aeb54bcd',
  '0044355e-c511-4cb3-827b-8843e577a869',
  'ec20fca7-88d7-4a25-aded-c90e08cf6fb6'
);

-- Dissocier les mouvements de lots
UPDATE public.mouvements_lots 
SET agent_id = NULL
WHERE agent_id IN (
  '7a3dcaaa-1f81-4b46-86c5-12715ee00e7f',
  '8aee9f32-e9a0-44a5-b2fe-093447bbb2f2',
  '4080b193-fcc8-4b05-841d-6245aeb54bcd',
  '0044355e-c511-4cb3-827b-8843e577a869',
  'ec20fca7-88d7-4a25-aded-c90e08cf6fb6'
);