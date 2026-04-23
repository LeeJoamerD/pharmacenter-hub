

## Plan d'implémentation — Articles manquants du module Chat-PharmaSoft

### Objectif

Compléter le **Guide Utilisateur PharmaSoft** pour que le module **Chat-PharmaSoft** couvre tous les sous-modules réellement exposés dans `ChatNetworkModule.tsx` :

```text
Chat-PharmaSoft
├── Tableau de bord Chat (NetworkChatDashboard)
├── Messagerie réseau (NetworkMessaging)
├── Multi-officines (MultiPharmacyManagement)
├── Canaux réseau (NetworkChannelManagement)
├── Administration centrale (CentralAdministration)
├── Assistant IA réseau (NetworkConversationalAI)
├── Intégrations réseau (NetworkBusinessIntegrations)
├── Sécurité réseau (NetworkSecurityManager)
├── Productivité collaborative (CollaborativeProductivityTools)
├── Analytics réseau (NetworkAdvancedAnalytics)
├── Pharma Tools réseau (NetworkPharmaTools)
├── Multi-canaux réseau (NetworkMultichannelHub)
├── Personnalisation réseau (NetworkChatCustomization)
└── Administration réseau (NetworkAdvancedAdministration)
```

Format identique aux modules précédents : structure stricte `GuideArticle` (`id, title, objective, location, audience, intro, steps, callouts, bestPractices, faq, related, keywords`).

Fichier à enrichir : `src/components/help/guide/content/chat.ts`

Aucun changement UI : intégration automatique via `registry.ts`.

---

## 1. État actuel

Le guide ne contient que **1 article** : `chat-alertes-reseau`. Il sera conservé, enrichi et replacé.

---

## 2. Organisation cible (14 sections)

```text
Chat-PharmaSoft
├── Pilotage et accueil Chat
├── Messagerie réseau
├── Multi-officines
├── Canaux réseau
├── Administration centrale
├── Assistant IA réseau
├── Intégrations métier
├── Sécurité réseau
├── Productivité collaborative
├── Analytics réseau
├── Pharma Tools réseau
├── Multi-canaux (omnicanal)
├── Personnalisation
└── Administration avancée
```

---

## 3. Convention des identifiants

Préfixe : `chat-`

Exemples : `chat-dashboard-vue-ensemble`, `chat-messagerie-conversation`, `chat-canaux-creer`, `chat-securite-chiffrement`, `chat-personnalisation-themes`.

---

## 4. Articles à créer ou enrichir (~70 articles)

### A. Pilotage et accueil Chat (5 articles)

1. `chat-dashboard-vue-ensemble` — Hub central, KPI réseau, navigation entre sous-modules.
2. `chat-dashboard-overview-reseau` — Composant **NetworkOverview** (vue d'ensemble multi-officines).
3. `chat-dashboard-annuaire` — Composant **PharmacyDirectory** (répertoire officines).
4. `chat-dashboard-activite-globale` — Composant **GlobalActivity** (flux temps réel).
5. `chat-dashboard-metriques-actions` — **NetworkMetrics** + **QuickNetworkActions**.

**Callouts :** Info — visibilité contrôlée par `useDashboardVisibility`.

---

### B. Messagerie réseau (6 articles)

6. `chat-messagerie-vue-ensemble` — Présentation de la messagerie inter-officines.
7. `chat-messagerie-conversation` — Démarrer/poursuivre une conversation directe.
8. `chat-messagerie-groupes` — Créer et animer des conversations de groupe.
9. `chat-messagerie-pieces-jointes` — Partager fichiers, images, documents.
10. `chat-messagerie-recherche` — Recherche dans l'historique des messages.
11. `chat-alertes-reseau` — **Enrichir l'article existant** : alertes réseau prioritaires.

**Callouts :** Info — alignement multi-tenant, isolation par `tenant_id`.

---

### C. Multi-officines (5 articles)

12. `chat-multi-officines-vue-ensemble` — Gestion centralisée multi-pharmacies.
13. `chat-multi-officines-ajouter` — Inviter / rattacher une officine au réseau.
14. `chat-multi-officines-roles` — Rôles et hiérarchie au sein du réseau.
15. `chat-multi-officines-statuts` — Statuts (active, suspendue, en attente).
16. `chat-multi-officines-synchronisation` — Synchronisation des données réseau.

---

### D. Canaux réseau (5 articles)

17. `chat-canaux-vue-ensemble` — Comprendre les canaux thématiques.
18. `chat-canaux-creer` — Créer un canal (public, privé, système).
19. `chat-canaux-membres` — Gérer les membres et permissions.
20. `chat-canaux-moderation` — Modération et règles d'usage.
21. `chat-canaux-archivage` — Archiver / supprimer un canal.

---

### E. Administration centrale (5 articles)

22. `chat-administration-centrale-vue-ensemble` — Vue admin centralisée du réseau.
23. `chat-administration-centrale-utilisateurs` — Gestion utilisateurs cross-officines.
24. `chat-administration-centrale-permissions` — Permissions globales réseau.
25. `chat-administration-centrale-audit` — Journaux d'audit centralisés.
26. `chat-administration-centrale-parametres` — Paramètres globaux du réseau.

---

### F. Assistant IA réseau (5 articles)

27. `chat-ia-vue-ensemble` — Assistant IA conversationnel intégré au chat.
28. `chat-ia-conversation` — Lancer une conversation IA (Edge Function `network-ai-chat`).
29. `chat-ia-modeles` — Choisir le modèle (Gemini, etc.) via `ai_models`.
30. `chat-ia-contexte-pharma` — Contexte pharmacie / réseau injecté.
31. `chat-ia-historique` — Historique des conversations IA.

**Callouts :** Info — JWT obligatoire et isolation tenant stricte. Warning — réponses à valider pour les sujets cliniques.

---

### G. Intégrations métier (5 articles)

32. `chat-integrations-vue-ensemble` — Intégrations Business (CRM, ERP, comptabilité).
33. `chat-integrations-connecteurs` — Configurer un connecteur métier.
34. `chat-integrations-notifications` — Notifications push depuis modules métiers.
35. `chat-integrations-webhooks` — Webhooks entrants/sortants.
36. `chat-integrations-monitoring` — Statuts et logs des intégrations.

---

### H. Sécurité réseau (5 articles)

37. `chat-securite-vue-ensemble` — Sécurité globale du chat réseau.
38. `chat-securite-chiffrement` — Chiffrement des conversations.
39. `chat-securite-alertes` — Alertes de sécurité (intrusion, anomalie).
40. `chat-securite-permissions` — Contrôle d'accès aux conversations.
41. `chat-securite-audit` — Pistes d'audit messagerie.

**Callouts :** Warning — actions sensibles enregistrées dans la piste d'audit.

---

### I. Productivité collaborative (5 articles)

42. `chat-productivite-vue-ensemble` — Outils collaboratifs intégrés.
43. `chat-productivite-taches` — Tâches partagées dans une conversation.
44. `chat-productivite-notes` — Notes collaboratives.
45. `chat-productivite-fichiers` — Espace de fichiers partagés.
46. `chat-productivite-calendrier` — Calendrier réseau partagé.

---

### J. Analytics réseau (5 articles)

47. `chat-analytics-vue-ensemble` — KPI de communication réseau.
48. `chat-analytics-engagement` — Engagement par officine et utilisateur.
49. `chat-analytics-canaux` — Performance par canal.
50. `chat-analytics-alertes` — Statistiques sur les alertes envoyées.
51. `chat-analytics-export` — Exports analytiques (PDF/Excel).

---

### K. Pharma Tools réseau (6 articles)

52. `chat-pharma-tools-vue-ensemble` — Outils pharma spécialisés intégrés au chat.
53. `chat-pharma-tools-base-medicaments` — Base médicaments via RPC `get_drug_database`.
54. `chat-pharma-tools-dci` — Recherche DCI partagée.
55. `chat-pharma-tools-interactions` — Vérification interactions inter-officines.
56. `chat-pharma-tools-reglementations` — Veille réglementaire partagée.
57. `chat-pharma-tools-partage-cas` — Partage de cas cliniques anonymisés.

**Callouts :** Warning — anonymiser les données patients avant partage.

---

### L. Multi-canaux / Hub omnicanal (4 articles)

58. `chat-multicanaux-vue-ensemble` — Hub omnicanal (WhatsApp, SMS, Email).
59. `chat-multicanaux-connecter` — Connecter un canal externe.
60. `chat-multicanaux-routage` — Règles de routage des messages entrants.
61. `chat-multicanaux-templates` — Modèles de réponse multi-canaux.

---

### M. Personnalisation (4 articles)

62. `chat-personnalisation-vue-ensemble` — Personnaliser l'expérience chat réseau.
63. `chat-personnalisation-themes` — Thèmes et couleurs.
64. `chat-personnalisation-notifications` — Préférences de notifications.
65. `chat-personnalisation-raccourcis` — Raccourcis et automatismes.

---

### N. Administration avancée (5 articles)

66. `chat-administration-avancee-vue-ensemble` — Administration avancée du réseau chat.
67. `chat-administration-avancee-politiques` — Politiques de rétention et conformité.
68. `chat-administration-avancee-sauvegardes` — Sauvegardes et restauration.
69. `chat-administration-avancee-quotas` — Quotas et limites d'usage.
70. `chat-administration-avancee-maintenance` — Maintenance, purge, migration.

---

## 5. Règles métier intégrées

- **Architecture multi-tenant** : isolation stricte par `tenant_id` (mémoire `network-management-architecture`).
- **Edge Functions IA** : validation JWT + isolation tenant (`network-ai-chat`).
- **Pharma Tools** : RPC `get_drug_database` pour base médicaments partagée.
- **Visibilité dashboard** : `useDashboardVisibility` (permission `dashboard.view`).
- **Audit** : actions sensibles tracées (création canal, suppression, partage clinique).
- **Confidentialité** : anonymisation obligatoire pour partage de cas patients.
- **Localisation** : textes via `useLanguage`.
- **Notifications** : alignement avec politique de résilience réseau (polling 5min, retry).

---

## 6. Maillage des articles liés

```text
chat-dashboard-vue-ensemble
→ chat-messagerie-vue-ensemble
→ chat-multi-officines-vue-ensemble

chat-messagerie-conversation
→ chat-messagerie-groupes
→ chat-securite-chiffrement

chat-canaux-creer
→ chat-canaux-membres
→ chat-canaux-moderation

chat-ia-conversation
→ assistant-chat-vue-ensemble
→ chat-ia-modeles

chat-pharma-tools-base-medicaments
→ assistant-pharma-base-medicaments
→ chat-pharma-tools-interactions

chat-securite-audit
→ chat-administration-centrale-audit
→ chat-administration-avancee-politiques

chat-multicanaux-connecter
→ chat-integrations-connecteurs
→ chat-multicanaux-routage

chat-alertes-reseau
→ chat-canaux-creer
→ chat-multi-officines-vue-ensemble
```

---

## 7. Étapes d'implémentation

### Étape 1 — Restructuration
Modifier `src/components/help/guide/content/chat.ts` : créer les 14 sections cibles, replacer et enrichir `chat-alertes-reseau`.

### Étape 2 — Articles cœur
Pilotage, Messagerie, Multi-officines, Canaux, Administration centrale (26 articles).

### Étape 3 — Articles spécialisés
IA, Intégrations, Sécurité, Productivité, Analytics (25 articles).

### Étape 4 — Articles avancés
Pharma Tools, Multi-canaux, Personnalisation, Administration avancée (19 articles).

### Étape 5 — Mots-clés (3 à 5 par article)
```text
dashboard, KPI, réseau, hub
messagerie, conversation, groupe, fichier
multi-officines, pharmacie, rôle, statut
canal, public, privé, modération
administration, utilisateur, permission, audit
IA, chat, modèle, contexte
intégration, connecteur, webhook
sécurité, chiffrement, audit, accès
productivité, tâche, note, calendrier
analytics, engagement, export
pharma, médicament, DCI, interaction
omnicanal, WhatsApp, SMS, routage
personnalisation, thème, notification
politique, rétention, sauvegarde, quota
```

### Étape 6 — Vérifications
1. Build TypeScript/Vite.
2. Conformité stricte au type `GuideArticle`.
3. 14 sections affichées dans la sidebar.
4. Recherche full-text fonctionnelle.
5. Liens `related[]` opérationnels (cross-module : Assistant IA, Administration).
6. Cohérence des `location` avec onglets réels (`ChatNetworkModule.tsx` switch).
7. Pas de doublons d'identifiants.
8. Article `chat-alertes-reseau` enrichi (pas perdu).

---

## Résultat attendu

Le module **Chat-PharmaSoft** passera de **1 à environ 70 articles structurés**, couvrant l'intégralité des 14 sous-modules exposés : pilotage, messagerie, multi-officines, canaux, administration centrale, IA, intégrations, sécurité, productivité, analytics, pharma tools, omnicanal, personnalisation et administration avancée.

Le guide deviendra une documentation complète pour pharmaciens, administrateurs réseau, responsables qualité et utilisateurs collaboratifs PharmaSoft.

