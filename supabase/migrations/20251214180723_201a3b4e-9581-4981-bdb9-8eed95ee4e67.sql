-- Insérer des clés de répartition par défaut pour tous les tenants qui n'en ont pas encore
INSERT INTO cles_repartition (tenant_id, code, libelle, type_cle, est_active, description)
SELECT 
  p.id,
  key_data.code,
  key_data.libelle,
  key_data.type_cle::text,
  true,
  key_data.description
FROM pharmacies p
CROSS JOIN (
  VALUES 
    ('CA', 'Chiffre d''Affaires', 'chiffre_affaires', 'Répartition basée sur le chiffre d''affaires de chaque centre'),
    ('EFF', 'Nombre d''Employés', 'nombre_employes', 'Répartition basée sur l''effectif de chaque centre'),
    ('M2', 'Surface Occupée', 'surface_occupee', 'Répartition basée sur la surface en m² de chaque centre'),
    ('CD', 'Coûts Directs', 'couts_directs', 'Répartition basée sur les coûts directs de chaque centre')
) AS key_data(code, libelle, type_cle, description)
WHERE NOT EXISTS (
  SELECT 1 FROM cles_repartition cr 
  WHERE cr.tenant_id = p.id AND cr.code = key_data.code
);