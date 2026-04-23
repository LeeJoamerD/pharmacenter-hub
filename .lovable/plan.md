

## Plan d'implémentation — Articles manquants du module Paramètres

### Objectif

Compléter le **Guide Utilisateur PharmaSoft** pour que le module **Paramètres** couvre tous les sous-modules réellement exposés dans `ParametresModule.tsx` :

```text
Paramètres
├── Général (GeneralSettings)
├── Utilisateurs (UserSettingsWithTabs : Utilisateurs / Rôles & Permissions)
├── Interface (InterfaceSettings)
├── Sécurité (SecuritySettings + Dashboard / Incidents / Notifications / Surveillance)
├── Impressions (PrintSettings)
├── Sauvegarde (BackupSettings)
├── Intégrations (IntegrationsSettings)
├── Métiers (BusinessSettings)
├── Maintenance (MaintenanceSettings)
├── Alertes (AlertesSettings)
├── Multi-sites (MultiSitesSettings)
└── Avancé (AdvancedSettings)
```

Format identique aux modules précédents : structure stricte `GuideArticle` (`id, title, objective, location, audience, intro, steps, callouts, bestPractices, faq, related, keywords`).

Fichier à enrichir : `src/components/help/guide/content/parametres.ts`
Aucun changement UI : intégration auto via `registry.ts`.

---

## 1. État actuel

Le guide ne contient que **2 articles** : `parametres-impressions` et `parametres-securite`. Ils seront conservés, enrichis et replacés dans les sections cibles.

---

## 2. Organisation cible (12 sections)

```text
Paramètres
├── Général
├── Utilisateurs et rôles
├── Interface
├── Sécurité
├── Impressions
├── Sauvegarde et restauration
├── Intégrations
├── Paramètres métiers
├── Maintenance
├── Alertes
├── Multi-sites
└── Paramètres avancés
```

---

## 3. Convention des identifiants

Préfixe : `parametres-`

Exemples : `parametres-general-identite`, `parametres-utilisateurs-roles`, `parametres-securite-incidents`, `parametres-impressions-tickets`, `parametres-multi-sites-synchronisation`.

---

## 4. Articles à créer ou enrichir (~70 articles)

### A. Général — GeneralSettings (6 articles)

1. `parametres-general-vue-ensemble` — Présentation des paramètres généraux pharmacie.
2. `parametres-general-identite` — Identité (nom, code, raison sociale, RCCM, NIU).
3. `parametres-general-coordonnees` — Coordonnées (adresse, ville, téléphones appel/WhatsApp, email).
4. `parametres-general-regional` — Devise, fuseau, langue, format date/heure (multi-localité).
5. `parametres-general-fiscal` — TVA, centime additionnel, exercice fiscal.
6. `parametres-general-logo` — Logo et identité visuelle officine.

**Callouts :** Info — multi-localité isolée par tenant via `parametres_systeme`.

---

### B. Utilisateurs et rôles — UserSettingsWithTabs (8 articles)

7. `parametres-utilisateurs-vue-ensemble` — Vue d'ensemble Utilisateurs et Permissions.
8. `parametres-utilisateurs-liste` — Onglet **Utilisateurs** : liste, statut, recherche.
9. `parametres-utilisateurs-creer` — Créer un utilisateur (Edge Function `create-user-with-personnel`).
10. `parametres-utilisateurs-modifier` — Modifier profil, rattachement personnel/client.
11. `parametres-utilisateurs-desactiver` — Désactivation et réactivation.
12. `parametres-utilisateurs-roles` — Onglet **Rôles & Permissions** (RolePermissionManager).
13. `parametres-utilisateurs-permissions-detail` — Permissions granulaires par module.
14. `parametres-utilisateurs-hierarchie` — Hiérarchie des 13 rôles unifiés.

**Callouts :** Warning — création restreinte à Admin/Pharmacien Titulaire dans le même tenant. Info — relation 1-à-1 utilisateur/pharmacie.

---

### C. Interface — InterfaceSettings (4 articles)

15. `parametres-interface-vue-ensemble` — Personnaliser l'interface utilisateur.
16. `parametres-interface-theme` — Thème clair/sombre, couleurs.
17. `parametres-interface-langue` — Langue (via `useLanguage`).
18. `parametres-interface-densite` — Densité d'affichage et raccourcis.

---

### D. Sécurité — SecuritySettings + Dashboard/Incidents/Notifications/Surveillance (8 articles)

19. `parametres-securite-vue-ensemble` — Vue d'ensemble sécurité.
20. `parametres-securite` — **Enrichir l'existant** : politique d'accès, mots de passe.
21. `parametres-securite-dashboard` — SecurityDashboard : KPI sécurité.
22. `parametres-securite-incidents` — SecurityIncidents : journal des incidents.
23. `parametres-securite-notifications` — SecurityNotifications : alertes sécurité.
24. `parametres-securite-surveillance` — SecuritySurveillance : monitoring temps réel.
25. `parametres-securite-sessions` — Sessions actives, refresh proactif.
26. `parametres-securite-audit` — Pistes d'audit et journaux.

**Callouts :** Warning — comptes partagés interdits, traçabilité obligatoire.

---

### E. Impressions — PrintSettings (5 articles)

27. `parametres-impressions` — **Enrichir l'existant** : configuration unifiée.
28. `parametres-impressions-tickets` — Tickets de caisse (POS).
29. `parametres-impressions-factures` — Factures A4 (jsPDF/jspdf-autotable).
30. `parametres-impressions-etiquettes` — Étiquettes 38×21.2mm.
31. `parametres-impressions-mentions` — Mentions légales et pied de page.

---

### F. Sauvegarde et restauration — BackupSettings (4 articles)

32. `parametres-sauvegarde-vue-ensemble` — Stratégie de sauvegarde.
33. `parametres-sauvegarde-planification` — Planification automatique.
34. `parametres-sauvegarde-manuelle` — Sauvegarde manuelle à la demande.
35. `parametres-sauvegarde-restauration` — Restauration depuis sauvegarde.

**Callouts :** Warning — tester régulièrement les restaurations.

---

### G. Intégrations — IntegrationsSettings (5 articles)

36. `parametres-integrations-vue-ensemble` — Présentation des intégrations.
37. `parametres-integrations-supabase` — Connexion Supabase (base + auth).
38. `parametres-integrations-api-externe` — APIs tierces.
39. `parametres-integrations-cloud-storage` — Stockage cloud documents.
40. `parametres-integrations-webhooks` — Webhooks événements.

---

### H. Paramètres métiers — BusinessSettings (6 articles)

41. `parametres-metiers-vue-ensemble` — Paramètres spécifiques pharmacie.
42. `parametres-metiers-tva` — Taux TVA et exonérations.
43. `parametres-metiers-arrondi` — Règles d'arrondi FCFA (`Math.round`).
44. `parametres-metiers-numerotation` — Format numérotation factures/tickets/lots.
45. `parametres-metiers-stock` — Seuils Min/Max par défaut, péremptions.
46. `parametres-metiers-vente` — Modes de paiement, assurance, fidélité.

---

### I. Maintenance — MaintenanceSettings (5 articles)

47. `parametres-maintenance-vue-ensemble` — Outils de maintenance.
48. `parametres-maintenance-cache` — Vider le cache, recharger PWA.
49. `parametres-maintenance-deduplication` — Déduplication des référentiels.
50. `parametres-maintenance-clone-tenant` — RPC `clone_tenant_referential` / `clone_tenant_lots`.
51. `parametres-maintenance-purge` — Purge des données anciennes.

**Callouts :** Warning — opérations destructives, sauvegarder avant.

---

### J. Alertes — AlertesSettings (5 articles)

52. `parametres-alertes-vue-ensemble` — Configuration globale des alertes.
53. `parametres-alertes-stock` — Alertes stock (rupture, péremption).
54. `parametres-alertes-ventes` — Alertes ventes (objectifs, anomalies).
55. `parametres-alertes-securite` — Alertes sécurité.
56. `parametres-alertes-canaux` — Canaux de notification (email, push, in-app).

---

### K. Multi-sites — MultiSitesSettings (5 articles)

57. `parametres-multi-sites-vue-ensemble` — Gestion multi-officines.
58. `parametres-multi-sites-ajouter` — Ajouter un site.
59. `parametres-multi-sites-synchronisation` — Synchronisation des données réseau.
60. `parametres-multi-sites-roles` — Rôles inter-sites.
61. `parametres-multi-sites-rapports` — Rapports consolidés multi-sites.

**Callouts :** Info — isolation tenant stricte respectée.

---

### L. Paramètres avancés — AdvancedSettings (5 articles)

62. `parametres-avance-vue-ensemble` — Paramètres techniques avancés.
63. `parametres-avance-base-donnees` — Base de données et performances.
64. `parametres-avance-pwa` — Configuration PWA (cache 30MB, offline POS).
65. `parametres-avance-developer` — Mode développeur, logs.
66. `parametres-avance-experimental` — Fonctionnalités expérimentales.

**Callouts :** Warning — modifications réservées aux administrateurs avertis.

---

## 5. Règles métier intégrées

- **Multi-tenant/RLS** : tous les paramètres isolés par `tenant_id`.
- **Multi-localité** : `parametres_systeme` (devise, langue, format).
- **Création utilisateur** : Edge Function `create-user-with-personnel`, restriction Admin/Pharmacien Titulaire.
- **Hiérarchie rôles** : 13 rôles unifiés centralisés dans `roles.ts`.
- **Sécurité** : aucune escalade via client-side, validation serveur obligatoire.
- **Impression** : standards jsPDF, étiquettes 38×21.2mm, configuration unifiée.
- **Arrondis** : `Math.round` pour FCFA.
- **PWA** : cache 30MB, priorité POS offline.
- **Maintenance** : RPCs `clone_tenant_referential`, `clone_tenant_lots`.
- **Audit** : actions sensibles tracées.
- **Localisation** : textes via `useLanguage`.

---

## 6. Maillage des articles liés

```text
parametres-general-regional
→ parametres-metiers-tva
→ parametres-impressions-factures

parametres-utilisateurs-creer
→ parametres-utilisateurs-roles
→ administration-personnel-roles

parametres-securite-incidents
→ parametres-securite-surveillance
→ parametres-securite-audit

parametres-impressions-tickets
→ parametres-impressions-factures
→ parametres-impressions-etiquettes

parametres-sauvegarde-restauration
→ parametres-maintenance-purge
→ parametres-avance-base-donnees

parametres-multi-sites-synchronisation
→ chat-multi-officines-synchronisation
→ parametres-multi-sites-rapports

parametres-alertes-stock
→ stock-alertes-rupture
→ parametres-alertes-canaux

parametres-avance-pwa
→ parametres-maintenance-cache
→ parametres-integrations-cloud-storage
```

---

## 7. Étapes d'implémentation

### Étape 1 — Restructuration
Modifier `src/components/help/guide/content/parametres.ts` : créer les 12 sections cibles, replacer et enrichir `parametres-impressions` et `parametres-securite`.

### Étape 2 — Articles cœur
Général, Utilisateurs/Rôles, Interface, Sécurité (26 articles).

### Étape 3 — Articles opérationnels
Impressions, Sauvegarde, Intégrations, Métiers (20 articles).

### Étape 4 — Articles avancés
Maintenance, Alertes, Multi-sites, Avancé (20 articles).

### Étape 5 — Mots-clés (3 à 5 par article)
```text
général, identité, RCCM, devise, fiscal
utilisateur, rôle, permission, hiérarchie
interface, thème, langue, densité
sécurité, incident, surveillance, audit
impression, ticket, facture, étiquette
sauvegarde, restauration, planification
intégration, API, webhook, cloud
métiers, TVA, arrondi, numérotation
maintenance, cache, dédoublonnage, purge
alerte, notification, canal
multi-sites, synchronisation, consolidation
avancé, PWA, base, développeur
```

### Étape 6 — Vérifications
1. Build TypeScript/Vite.
2. Conformité stricte au type `GuideArticle`.
3. 12 sections affichées dans la sidebar.
4. Recherche full-text fonctionnelle.
5. Liens `related[]` opérationnels (cross-module : Administration, Stock, Chat).
6. Cohérence des `location` avec onglets réels (`ParametresModule.tsx` switch).
7. Pas de doublons d'identifiants.
8. Articles `parametres-impressions` et `parametres-securite` enrichis (pas perdus).

---

## Résultat attendu

Le module **Paramètres** passera de **2 à environ 66 articles structurés**, couvrant l'intégralité des 12 sous-modules exposés : général, utilisateurs/rôles, interface, sécurité, impressions, sauvegarde, intégrations, métiers, maintenance, alertes, multi-sites et avancé.

Le guide deviendra une documentation complète pour administrateurs, pharmaciens titulaires, responsables sécurité et techniciens PharmaSoft.

