

# Fix: clone_tenant_referential — colonne laboratoires incorrecte

## Problème
La fonction référence `nom_laboratoire, pays, contact_info` dans la table `laboratoires`, mais les vraies colonnes sont : `libelle, pays_siege, email_siege, email_delegation_local, telephone_appel_delegation_local, telephone_whatsapp_delegation_local`.

## Correction

Modifier l'INSERT des laboratoires dans `clone_tenant_referential` :

```sql
INSERT INTO laboratoires (tenant_id, libelle, pays_siege, email_siege, email_delegation_local, telephone_appel_delegation_local, telephone_whatsapp_delegation_local)
SELECT p_target_tenant, libelle, pays_siege, email_siege, email_delegation_local, telephone_appel_delegation_local, telephone_whatsapp_delegation_local
FROM laboratoires WHERE tenant_id = p_source_tenant
```

## Fichier modifié
- Nouvelle migration SQL (CREATE OR REPLACE FUNCTION clone_tenant_referential)

