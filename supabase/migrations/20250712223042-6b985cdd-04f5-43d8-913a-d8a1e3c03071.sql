-- Créer le type ENUM pour les types de clients
CREATE TYPE public.type_client_enum AS ENUM (
    'Ordinaire', 
    'Conventionné', 
    'Personnel', 
    'Assuré'
);