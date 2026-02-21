
DROP VIEW IF EXISTS v_factures_avec_details;

CREATE VIEW v_factures_avec_details AS
SELECT f.id,
    f.tenant_id,
    f.numero,
    f.type,
    f.client_id,
    f.fournisseur_id,
    f.assureur_id,
    f.vente_id,
    f.reception_id,
    f.date_emission,
    f.date_echeance,
    f.libelle,
    f.reference_externe,
    f.notes,
    f.montant_ht,
    f.montant_tva,
    f.montant_ttc,
    f.statut,
    f.statut_paiement,
    f.montant_paye,
    f.montant_restant,
    f.relances_effectuees,
    f.derniere_relance,
    f.pieces_jointes,
    f.created_by_id,
    f.created_at,
    f.updated_at,
    c.nom_complet AS client_nom,
    c.telephone AS client_telephone,
    c.email AS client_email,
    c.adresse AS client_adresse,
    fou.nom AS fournisseur_nom,
    fou.telephone_appel AS fournisseur_telephone,
    fou.email AS fournisseur_email,
    fou.adresse AS fournisseur_adresse,
    a.libelle_assureur AS assureur_nom,
    a.adresse AS assureur_adresse,
    a.telephone_appel AS assureur_telephone,
    a.email AS assureur_email,
    COALESCE(c.nom_complet, a.libelle_assureur, fou.nom) AS client_fournisseur,
    (p.prenoms || ' '::text) || p.noms AS created_by,
    ( SELECT count(*) AS count
           FROM lignes_facture
          WHERE lignes_facture.facture_id = f.id) AS nombre_lignes,
    CASE
        WHEN f.date_echeance < CURRENT_DATE AND f.statut_paiement <> 'payee'::text THEN CURRENT_DATE - f.date_echeance
        ELSE 0
    END AS jours_retard,
    CASE
        WHEN f.date_echeance >= CURRENT_DATE AND f.statut_paiement <> 'payee'::text THEN f.date_echeance - CURRENT_DATE
        ELSE 0
    END AS jours_avant_echeance
   FROM factures f
     LEFT JOIN clients c ON f.client_id = c.id
     LEFT JOIN fournisseurs fou ON f.fournisseur_id = fou.id
     LEFT JOIN assureurs a ON f.assureur_id = a.id
     LEFT JOIN personnel p ON f.created_by_id = p.id;
