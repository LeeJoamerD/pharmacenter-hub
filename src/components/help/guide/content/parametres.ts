import {
  Settings2, Building2, Users, Palette, ShieldCheck, Printer, DatabaseBackup,
  Plug, Briefcase, Wrench, Bell, Network, Cog,
} from 'lucide-react';
import type { GuideArticle, GuideModule } from '../types';

type ArticleInput = Partial<GuideArticle> & Pick<GuideArticle, 'id' | 'title' | 'objective' | 'intro'>;

const make = (a: ArticleInput): GuideArticle => ({
  location: 'Paramètres',
  audience: ['Administrateurs', 'Pharmacien Titulaire'],
  steps: [],
  callouts: [],
  bestPractices: [],
  faq: [],
  related: [],
  keywords: [],
  ...a,
});

// ============================================================
// A. GÉNÉRAL — GeneralSettings (6)
// ============================================================
const generalArticles: GuideArticle[] = [
  make({
    id: 'parametres-general-vue-ensemble',
    title: 'Vue d’ensemble — Paramètres généraux',
    objective: 'Comprendre les blocs de configuration générale de l’officine.',
    location: 'Paramètres → Général',
    intro: 'Les paramètres généraux regroupent l’identité, les coordonnées, les paramètres régionaux, fiscaux et l’identité visuelle.',
    steps: [
      { title: 'Ouvrir l’onglet Général', detail: 'Paramètres → Général.' },
      { title: 'Parcourir les blocs', detail: 'Identité, Coordonnées, Régional, Fiscal, Logo.' },
      { title: 'Enregistrer', detail: 'Cliquez sur Enregistrer pour appliquer.' },
    ],
    callouts: [{ type: 'info', text: 'Les paramètres sont isolés par tenant via parametres_systeme.' }],
    related: ['parametres-general-identite', 'parametres-general-regional'],
    keywords: ['général', 'configuration', 'pharmacie', 'identité'],
  }),
  make({
    id: 'parametres-general-identite',
    title: 'Identité de l’officine',
    objective: 'Renseigner correctement le nom, code, raison sociale, RCCM et NIU.',
    location: 'Paramètres → Général → Identité',
    intro: 'L’identité officielle est utilisée sur tous les documents légaux (factures, tickets, déclarations).',
    steps: [
      { title: 'Saisir le nom commercial', detail: 'Nom affiché dans l’interface et les documents.' },
      { title: 'Renseigner RCCM et NIU', detail: 'Identifiants légaux requis pour la facturation.' },
      { title: 'Enregistrer', detail: 'Confirmez la mise à jour.' },
    ],
    callouts: [{ type: 'warning', text: 'RCCM et NIU sont obligatoires pour la conformité fiscale (Congo).' }],
    bestPractices: ['Vérifier l’orthographe exacte de la raison sociale.'],
    related: ['parametres-general-coordonnees', 'parametres-impressions-factures'],
    keywords: ['identité', 'RCCM', 'NIU', 'raison sociale'],
  }),
  make({
    id: 'parametres-general-coordonnees',
    title: 'Coordonnées de l’officine',
    objective: 'Configurer adresse, téléphones et email visibles sur les documents.',
    location: 'Paramètres → Général → Coordonnées',
    intro: 'Les coordonnées apparaissent sur tickets, factures et notifications client.',
    steps: [
      { title: 'Saisir l’adresse complète', detail: 'Adresse, ville, quartier.' },
      { title: 'Ajouter les téléphones', detail: 'Numéro principal et numéro WhatsApp.' },
      { title: 'Renseigner l’email', detail: 'Email officiel de l’officine.' },
    ],
    related: ['parametres-general-identite', 'parametres-impressions-mentions'],
    keywords: ['adresse', 'téléphone', 'WhatsApp', 'email'],
  }),
  make({
    id: 'parametres-general-regional',
    title: 'Paramètres régionaux',
    objective: 'Définir devise, fuseau horaire, langue et formats date/heure.',
    location: 'Paramètres → Général → Régional',
    intro: 'PharmaSoft gère la multi-localité via parametres_systeme : devise, fuseau, langue et formats.',
    steps: [
      { title: 'Choisir la devise', detail: 'FCFA par défaut au Congo.' },
      { title: 'Sélectionner le fuseau', detail: 'Africa/Brazzaville.' },
      { title: 'Choisir la langue', detail: 'Français, Anglais, etc.' },
    ],
    callouts: [{ type: 'info', text: 'Multi-localité : les formats s’appliquent à toute l’interface et aux exports.' }],
    related: ['parametres-metiers-tva', 'parametres-impressions-factures'],
    keywords: ['devise', 'fuseau', 'langue', 'régional'],
  }),
  make({
    id: 'parametres-general-fiscal',
    title: 'Paramètres fiscaux',
    objective: 'Configurer TVA, centime additionnel et exercice fiscal.',
    location: 'Paramètres → Général → Fiscal',
    intro: 'Les paramètres fiscaux conditionnent le calcul automatique des taxes et la déclaration G n°10.',
    steps: [
      { title: 'Définir les taux TVA', detail: 'Taux normal (18%), taux réduit (5%).' },
      { title: 'Centime additionnel', detail: 'Pourcentage applicable selon réglementation locale.' },
      { title: 'Exercice fiscal', detail: 'Mois de début d’exercice.' },
    ],
    callouts: [{ type: 'warning', text: 'Toute modification impacte les calculs et déclarations futures.' }],
    related: ['parametres-metiers-tva', 'parametres-metiers-arrondi'],
    keywords: ['TVA', 'fiscal', 'centime', 'exercice'],
  }),
  make({
    id: 'parametres-general-logo',
    title: 'Logo et identité visuelle',
    objective: 'Téléverser le logo affiché sur l’interface et les documents.',
    location: 'Paramètres → Général → Logo',
    intro: 'Le logo est repris sur les tickets, factures et entêtes PDF.',
    steps: [
      { title: 'Téléverser le logo', detail: 'Format PNG/JPG, fond transparent recommandé.' },
      { title: 'Vérifier l’aperçu', detail: 'Aperçu sur ticket et facture.' },
    ],
    bestPractices: ['Utiliser une image haute résolution (≥ 300 dpi).'],
    related: ['parametres-impressions-tickets', 'parametres-impressions-factures'],
    keywords: ['logo', 'identité visuelle', 'image'],
  }),
];

// ============================================================
// B. UTILISATEURS ET RÔLES (8)
// ============================================================
const usersArticles: GuideArticle[] = [
  make({
    id: 'parametres-utilisateurs-vue-ensemble',
    title: 'Vue d’ensemble — Utilisateurs et permissions',
    objective: 'Comprendre la gestion des comptes et des rôles.',
    location: 'Paramètres → Utilisateurs',
    intro: 'L’écran Utilisateurs combine la liste des comptes et la gestion des rôles & permissions.',
    steps: [
      { title: 'Ouvrir Utilisateurs', detail: 'Paramètres → Utilisateurs.' },
      { title: 'Naviguer entre les onglets', detail: 'Utilisateurs, Rôles & Permissions, Sécurité.' },
    ],
    callouts: [{ type: 'info', text: 'Relation 1-à-1 stricte : un utilisateur appartient à une seule pharmacie.' }],
    related: ['parametres-utilisateurs-creer', 'parametres-utilisateurs-roles'],
    keywords: ['utilisateurs', 'permissions', 'rôles'],
  }),
  make({
    id: 'parametres-utilisateurs-liste',
    title: 'Liste des utilisateurs',
    objective: 'Consulter, filtrer et rechercher les comptes de l’officine.',
    location: 'Paramètres → Utilisateurs → Utilisateurs',
    intro: 'La liste affiche tous les comptes du tenant avec leur statut et leur rôle.',
    steps: [
      { title: 'Rechercher un utilisateur', detail: 'Par nom, email ou rôle.' },
      { title: 'Filtrer par statut', detail: 'Actif, désactivé, en attente.' },
    ],
    related: ['parametres-utilisateurs-creer', 'parametres-utilisateurs-modifier'],
    keywords: ['liste', 'utilisateurs', 'statut'],
  }),
  make({
    id: 'parametres-utilisateurs-creer',
    title: 'Créer un utilisateur',
    objective: 'Créer un compte avec rattachement personnel et rôle.',
    location: 'Paramètres → Utilisateurs → Nouveau',
    intro: 'La création passe par l’Edge Function create-user-with-personnel qui assure l’atomicité des comptes User/Personnel/Client.',
    steps: [
      { title: 'Cliquer sur Nouveau', detail: 'Bouton en haut de la liste.' },
      { title: 'Renseigner les informations', detail: 'Nom, email, rôle, rattachement personnel.' },
      { title: 'Définir un mot de passe', detail: 'Communiqué à l’utilisateur de manière sécurisée.' },
      { title: 'Valider la création', detail: 'L’Edge Function crée le compte de manière atomique.' },
    ],
    callouts: [{ type: 'warning', text: 'Création restreinte aux Admin/Pharmacien Titulaire dans le même tenant.' }],
    related: ['parametres-utilisateurs-roles', 'administration-personnel-roles'],
    keywords: ['création', 'utilisateur', 'edge function'],
  }),
  make({
    id: 'parametres-utilisateurs-modifier',
    title: 'Modifier un utilisateur',
    objective: 'Mettre à jour profil, rôle et rattachement.',
    location: 'Paramètres → Utilisateurs → Modifier',
    intro: 'L’édition permet d’ajuster le profil et de réaffecter un rôle.',
    steps: [
      { title: 'Ouvrir l’utilisateur', detail: 'Cliquer sur la ligne dans la liste.' },
      { title: 'Modifier les champs nécessaires', detail: 'Nom, rôle, rattachement.' },
      { title: 'Enregistrer', detail: 'Les changements s’appliquent immédiatement.' },
    ],
    callouts: [{ type: 'warning', text: 'L’email auth.users ne peut pas être modifié librement (restriction Supabase).' }],
    related: ['parametres-utilisateurs-creer', 'parametres-utilisateurs-roles'],
    keywords: ['modification', 'profil', 'rôle'],
  }),
  make({
    id: 'parametres-utilisateurs-desactiver',
    title: 'Désactiver / réactiver un compte',
    objective: 'Bloquer ou rétablir l’accès d’un utilisateur sortant.',
    location: 'Paramètres → Utilisateurs → Actions',
    intro: 'La désactivation préserve l’historique tout en bloquant l’accès.',
    steps: [
      { title: 'Sélectionner l’utilisateur', detail: 'Dans la liste.' },
      { title: 'Cliquer sur Désactiver', detail: 'Confirmer l’action.' },
      { title: 'Réactiver si besoin', detail: 'Action symétrique.' },
    ],
    bestPractices: ['Désactiver immédiatement les comptes sortants.'],
    related: ['parametres-utilisateurs-liste', 'parametres-securite-audit'],
    keywords: ['désactivation', 'compte', 'sortie'],
  }),
  make({
    id: 'parametres-utilisateurs-roles',
    title: 'Rôles et permissions',
    objective: 'Configurer les rôles et leurs permissions via RolePermissionManager.',
    location: 'Paramètres → Utilisateurs → Rôles & Permissions',
    intro: 'Les permissions sont attribuées par rôle, jamais par utilisateur individuel, pour préserver la traçabilité.',
    steps: [
      { title: 'Ouvrir Rôles & Permissions', detail: 'Onglet dédié.' },
      { title: 'Sélectionner un rôle', detail: 'Parmi les 13 rôles unifiés.' },
      { title: 'Cocher les permissions', detail: 'Par module/sous-module.' },
      { title: 'Enregistrer', detail: 'Les changements s’appliquent à tous les porteurs du rôle.' },
    ],
    callouts: [{ type: 'warning', text: 'Toute modification de permissions est tracée.' }],
    related: ['parametres-utilisateurs-permissions-detail', 'parametres-utilisateurs-hierarchie'],
    keywords: ['rôle', 'permission', 'RBAC'],
  }),
  make({
    id: 'parametres-utilisateurs-permissions-detail',
    title: 'Permissions granulaires par module',
    objective: 'Comprendre la granularité des permissions.',
    location: 'Paramètres → Utilisateurs → Rôles & Permissions',
    intro: 'Les permissions couvrent chaque module (Stock, Ventes, Comptabilité, Rapports, etc.) avec des actions précises (lecture, création, modification, suppression).',
    steps: [
      { title: 'Ouvrir un rôle', detail: 'Cliquer sur le rôle à éditer.' },
      { title: 'Parcourir les modules', detail: 'Liste exhaustive des modules.' },
      { title: 'Activer/désactiver les actions', detail: 'Par checkbox.' },
    ],
    related: ['parametres-utilisateurs-roles', 'parametres-securite-audit'],
    keywords: ['permission', 'granulaire', 'module'],
  }),
  make({
    id: 'parametres-utilisateurs-hierarchie',
    title: 'Hiérarchie des 13 rôles unifiés',
    objective: 'Connaître la hiérarchie standard des rôles.',
    location: 'Paramètres → Utilisateurs → Rôles & Permissions',
    intro: 'Le système utilise une liste unifiée de 13 rôles (Admin, Pharmacien Titulaire, Pharmacien Adjoint, Préparateur, Caissier, etc.).',
    steps: [
      { title: 'Consulter la liste', detail: 'Hiérarchie centralisée dans roles.ts.' },
      { title: 'Choisir le rôle adapté', detail: 'Selon principe du moindre privilège.' },
    ],
    callouts: [{ type: 'info', text: 'Seuls Admin et Pharmacien Titulaire peuvent créer des utilisateurs.' }],
    related: ['parametres-utilisateurs-roles', 'parametres-utilisateurs-creer'],
    keywords: ['hiérarchie', 'rôle', '13 rôles'],
  }),
];

// ============================================================
// C. INTERFACE (4)
// ============================================================
const interfaceArticles: GuideArticle[] = [
  make({
    id: 'parametres-interface-vue-ensemble',
    title: 'Vue d’ensemble — Interface',
    objective: 'Personnaliser l’apparence et l’ergonomie de l’interface.',
    location: 'Paramètres → Interface',
    intro: 'L’interface se personnalise via thème, langue et densité d’affichage.',
    steps: [{ title: 'Ouvrir Interface', detail: 'Paramètres → Interface.' }],
    related: ['parametres-interface-theme', 'parametres-interface-langue'],
    keywords: ['interface', 'apparence', 'personnalisation'],
  }),
  make({
    id: 'parametres-interface-theme',
    title: 'Thème clair / sombre',
    objective: 'Basculer entre thème clair, sombre ou automatique.',
    location: 'Paramètres → Interface → Thème',
    intro: 'Le thème s’applique à toute l’interface et respecte les tokens sémantiques.',
    steps: [
      { title: 'Choisir un thème', detail: 'Clair, sombre, ou automatique (système).' },
      { title: 'Confirmer', detail: 'Application immédiate.' },
    ],
    related: ['parametres-interface-densite'],
    keywords: ['thème', 'clair', 'sombre', 'couleurs'],
  }),
  make({
    id: 'parametres-interface-langue',
    title: 'Langue de l’interface',
    objective: 'Changer la langue affichée via le hook useLanguage.',
    location: 'Paramètres → Interface → Langue',
    intro: 'La langue s’applique à tous les textes via useLanguage.',
    steps: [
      { title: 'Sélectionner la langue', detail: 'Français, Anglais, etc.' },
      { title: 'Recharger l’interface', detail: 'Application immédiate.' },
    ],
    related: ['parametres-general-regional'],
    keywords: ['langue', 'localisation', 'i18n'],
  }),
  make({
    id: 'parametres-interface-densite',
    title: 'Densité d’affichage et raccourcis',
    objective: 'Ajuster la densité visuelle et activer les raccourcis clavier.',
    location: 'Paramètres → Interface → Densité',
    intro: 'La densité compacte permet d’afficher plus d’informations à l’écran.',
    steps: [
      { title: 'Choisir la densité', detail: 'Confortable, compact.' },
      { title: 'Activer les raccourcis', detail: 'Toggle dédié.' },
    ],
    related: ['parametres-interface-theme'],
    keywords: ['densité', 'raccourci', 'ergonomie'],
  }),
];

// ============================================================
// D. SÉCURITÉ (8)
// ============================================================
const securityArticles: GuideArticle[] = [
  make({
    id: 'parametres-securite-vue-ensemble',
    title: 'Vue d’ensemble — Sécurité',
    objective: 'Comprendre les leviers de sécurité disponibles.',
    location: 'Paramètres → Sécurité',
    intro: 'La sécurité couvre politique d’accès, sessions, audit, incidents et surveillance.',
    steps: [{ title: 'Ouvrir Sécurité', detail: 'Paramètres → Sécurité.' }],
    callouts: [{ type: 'warning', text: 'Comptes partagés interdits — la traçabilité est obligatoire.' }],
    related: ['parametres-securite', 'parametres-securite-dashboard'],
    keywords: ['sécurité', 'vue ensemble'],
  }),
  make({
    id: 'parametres-securite',
    title: 'Sécurité et accès',
    objective: 'Configurer politique de mots de passe et règles d’accès.',
    location: 'Paramètres → Sécurité',
    intro: 'La sécurité repose sur des comptes individuels, rôles adaptés et contrôles réguliers.',
    steps: [
      { title: 'Définir la politique de mots de passe', detail: 'Longueur, complexité, expiration.' },
      { title: 'Activer la double authentification', detail: 'Si disponible.' },
      { title: 'Réviser les rôles', detail: 'Principe du moindre privilège.' },
    ],
    callouts: [{ type: 'warning', text: 'Un compte partagé empêche toute traçabilité fiable.' }],
    bestPractices: ['Désactiver rapidement les comptes sortants.', 'Auditer mensuellement les rôles.'],
    related: ['parametres-utilisateurs-roles', 'parametres-securite-audit'],
    keywords: ['sécurité', 'accès', 'mots de passe'],
  }),
  make({
    id: 'parametres-securite-dashboard',
    title: 'Tableau de bord Sécurité',
    objective: 'Suivre les KPI sécurité depuis le SecurityDashboard.',
    location: 'Paramètres → Utilisateurs → Sécurité',
    intro: 'Le dashboard affiche sessions actives, tentatives échouées et alertes en cours.',
    steps: [
      { title: 'Consulter les KPI', detail: 'Sessions, tentatives, incidents.' },
      { title: 'Investiguer une anomalie', detail: 'Cliquer sur l’indicateur concerné.' },
    ],
    related: ['parametres-securite-incidents', 'parametres-securite-surveillance'],
    keywords: ['dashboard', 'sécurité', 'KPI'],
  }),
  make({
    id: 'parametres-securite-incidents',
    title: 'Journal des incidents',
    objective: 'Consulter et qualifier les incidents de sécurité.',
    location: 'Paramètres → Utilisateurs → Incidents',
    intro: 'SecurityIncidents centralise les incidents détectés (intrusion, anomalie, violation).',
    steps: [
      { title: 'Consulter la liste', detail: 'Filtrer par sévérité, statut, date.' },
      { title: 'Qualifier un incident', detail: 'Statut : ouvert, en cours, résolu.' },
      { title: 'Documenter la résolution', detail: 'Notes et actions correctives.' },
    ],
    related: ['parametres-securite-surveillance', 'parametres-securite-audit'],
    keywords: ['incident', 'journal', 'sécurité'],
  }),
  make({
    id: 'parametres-securite-notifications',
    title: 'Notifications de sécurité',
    objective: 'Configurer les alertes de sécurité.',
    location: 'Paramètres → Utilisateurs → Notifications',
    intro: 'SecurityNotifications définit qui reçoit quelles alertes selon la sévérité.',
    steps: [
      { title: 'Choisir les destinataires', detail: 'Par rôle ou utilisateur.' },
      { title: 'Définir les canaux', detail: 'Email, push, in-app.' },
      { title: 'Régler les seuils', detail: 'Sévérité minimale.' },
    ],
    related: ['parametres-alertes-canaux', 'parametres-securite-incidents'],
    keywords: ['notification', 'sécurité', 'alerte'],
  }),
  make({
    id: 'parametres-securite-surveillance',
    title: 'Surveillance temps réel',
    objective: 'Activer le monitoring temps réel des activités sensibles.',
    location: 'Paramètres → Utilisateurs → Surveillance',
    intro: 'SecuritySurveillance suit les actions critiques (accès aux stupéfiants, suppression, modifications massives).',
    steps: [
      { title: 'Activer la surveillance', detail: 'Toggle dédié.' },
      { title: 'Choisir les événements suivis', detail: 'Liste configurable.' },
    ],
    callouts: [{ type: 'warning', text: 'Les actions sensibles déclenchent des alertes en temps réel.' }],
    related: ['parametres-securite-dashboard', 'parametres-securite-audit'],
    keywords: ['surveillance', 'monitoring', 'temps réel'],
  }),
  make({
    id: 'parametres-securite-sessions',
    title: 'Sessions actives',
    objective: 'Gérer les sessions en cours et le refresh proactif.',
    location: 'Paramètres → Sécurité → Sessions',
    intro: 'Le système rafraîchit proactivement la session pour éviter les erreurs 401.',
    steps: [
      { title: 'Consulter les sessions', detail: 'Liste des sessions actives par utilisateur.' },
      { title: 'Révoquer une session', detail: 'Force la déconnexion.' },
    ],
    callouts: [{ type: 'info', text: 'Le refresh proactif est géré par sessionRefresh.ts.' }],
    related: ['parametres-securite', 'parametres-securite-audit'],
    keywords: ['session', 'refresh', 'JWT'],
  }),
  make({
    id: 'parametres-securite-audit',
    title: 'Pistes d’audit',
    objective: 'Consulter les journaux d’audit et exports de conformité.',
    location: 'Paramètres → Sécurité → Audit',
    intro: 'L’audit trace toutes les actions sensibles avec horodatage, utilisateur, action et contexte.',
    steps: [
      { title: 'Filtrer la période', detail: 'Plage de dates.' },
      { title: 'Filtrer par utilisateur ou action', detail: 'Affinage.' },
      { title: 'Exporter le journal', detail: 'PDF ou CSV.' },
    ],
    bestPractices: ['Auditer mensuellement les actions sensibles.'],
    related: ['parametres-securite-incidents', 'parametres-securite-surveillance'],
    keywords: ['audit', 'journal', 'traçabilité'],
  }),
];

// ============================================================
// E. IMPRESSIONS (5)
// ============================================================
const printArticles: GuideArticle[] = [
  make({
    id: 'parametres-impressions',
    title: 'Configuration unifiée des impressions',
    objective: 'Garantir des documents cohérents avec l’identité de l’officine.',
    location: 'Paramètres → Impressions',
    intro: 'La configuration unifiée harmonise tickets, factures et étiquettes.',
    steps: [
      { title: 'Ouvrir les paramètres d’impression', detail: 'Section dédiée.' },
      { title: 'Vérifier l’identité affichée', detail: 'Nom, coordonnées, mentions, formats.' },
      { title: 'Tester un document', detail: 'Imprimer un aperçu avant exploitation.' },
    ],
    callouts: [{ type: 'tip', text: 'Testez tickets et factures après toute modification de logo, devise ou mentions.' }],
    bestPractices: ['Conserver une présentation homogène.', 'Vérifier les étiquettes avant impression en masse.'],
    faq: [{ q: 'Les changements sont-ils immédiats ?', a: 'Oui pour les nouveaux documents générés après enregistrement.' }],
    related: ['parametres-impressions-tickets', 'parametres-impressions-factures', 'parametres-impressions-etiquettes'],
    keywords: ['impression', 'configuration', 'unifiée'],
  }),
  make({
    id: 'parametres-impressions-tickets',
    title: 'Tickets de caisse (POS)',
    objective: 'Configurer les tickets imprimés au point de vente.',
    location: 'Paramètres → Impressions → Tickets',
    intro: 'Les tickets POS suivent un format compact pour imprimante thermique.',
    steps: [
      { title: 'Définir l’entête', detail: 'Logo, nom, coordonnées.' },
      { title: 'Choisir les lignes affichées', detail: 'Détail produits, totaux, remises.' },
      { title: 'Définir le pied de page', detail: 'Mentions, remerciements.' },
    ],
    related: ['parametres-impressions-factures', 'parametres-impressions-mentions'],
    keywords: ['ticket', 'POS', 'thermique'],
  }),
  make({
    id: 'parametres-impressions-factures',
    title: 'Factures A4',
    objective: 'Configurer les factures PDF au format A4.',
    location: 'Paramètres → Impressions → Factures',
    intro: 'Les factures sont générées via jsPDF et jspdf-autotable au format A4.',
    steps: [
      { title: 'Définir l’entête', detail: 'Logo, identité, coordonnées.' },
      { title: 'Configurer les colonnes', detail: 'Désignation, quantité, PU, total.' },
      { title: 'Définir le pied de page', detail: 'Mentions légales, RCCM, NIU.' },
    ],
    callouts: [{ type: 'info', text: 'Génération native via jsPDF — pas de dépendance serveur.' }],
    related: ['parametres-impressions-tickets', 'parametres-general-fiscal'],
    keywords: ['facture', 'A4', 'jsPDF'],
  }),
  make({
    id: 'parametres-impressions-etiquettes',
    title: 'Étiquettes 38 × 21,2 mm',
    objective: 'Configurer les étiquettes produits au format standardisé.',
    location: 'Paramètres → Impressions → Étiquettes',
    intro: 'Le format standard est 38 × 21,2 mm — 5 par ligne, 13 lignes par page A4.',
    steps: [
      { title: 'Choisir les champs imprimés', detail: 'Code produit, libellé, prix, code-barres.' },
      { title: 'Tester l’impression', detail: 'Vérifier alignement avant production.' },
    ],
    callouts: [{ type: 'warning', text: 'Vérifier l’alignement papier avant impression en masse.' }],
    related: ['parametres-impressions-tickets', 'parametres-impressions'],
    keywords: ['étiquette', 'code-barres', '38mm'],
  }),
  make({
    id: 'parametres-impressions-mentions',
    title: 'Mentions légales et pied de page',
    objective: 'Personnaliser les mentions affichées en bas des documents.',
    location: 'Paramètres → Impressions → Mentions',
    intro: 'Les mentions couvrent informations légales, garanties et messages personnalisés.',
    steps: [
      { title: 'Saisir les mentions', detail: 'Texte libre.' },
      { title: 'Choisir les documents concernés', detail: 'Tickets, factures, étiquettes.' },
    ],
    related: ['parametres-impressions-factures', 'parametres-general-identite'],
    keywords: ['mention', 'légale', 'pied de page'],
  }),
];

// ============================================================
// F. SAUVEGARDE (4)
// ============================================================
const backupArticles: GuideArticle[] = [
  make({
    id: 'parametres-sauvegarde-vue-ensemble',
    title: 'Vue d’ensemble — Sauvegarde',
    objective: 'Comprendre la stratégie de sauvegarde et restauration.',
    location: 'Paramètres → Sauvegarde',
    intro: 'PharmaSoft propose des sauvegardes manuelles et planifiées avec restauration sélective.',
    steps: [{ title: 'Ouvrir Sauvegarde', detail: 'Paramètres → Sauvegarde.' }],
    callouts: [{ type: 'warning', text: 'Tester régulièrement la restauration des sauvegardes.' }],
    related: ['parametres-sauvegarde-planification', 'parametres-sauvegarde-restauration'],
    keywords: ['sauvegarde', 'stratégie'],
  }),
  make({
    id: 'parametres-sauvegarde-planification',
    title: 'Planification automatique',
    objective: 'Programmer des sauvegardes récurrentes.',
    location: 'Paramètres → Sauvegarde → Planification',
    intro: 'La planification garantit des sauvegardes régulières sans intervention.',
    steps: [
      { title: 'Choisir la fréquence', detail: 'Quotidienne, hebdomadaire.' },
      { title: 'Définir l’heure', detail: 'Hors heures d’exploitation.' },
      { title: 'Confirmer', detail: 'Activation immédiate.' },
    ],
    related: ['parametres-sauvegarde-manuelle', 'parametres-sauvegarde-restauration'],
    keywords: ['planification', 'automatique', 'sauvegarde'],
  }),
  make({
    id: 'parametres-sauvegarde-manuelle',
    title: 'Sauvegarde manuelle',
    objective: 'Lancer une sauvegarde à la demande.',
    location: 'Paramètres → Sauvegarde → Manuel',
    intro: 'Utile avant une opération sensible (purge, clone, migration).',
    steps: [
      { title: 'Cliquer sur Sauvegarder maintenant', detail: 'Bouton dédié.' },
      { title: 'Attendre la confirmation', detail: 'Durée variable selon volume.' },
    ],
    related: ['parametres-sauvegarde-planification', 'parametres-maintenance-purge'],
    keywords: ['manuel', 'sauvegarde', 'à la demande'],
  }),
  make({
    id: 'parametres-sauvegarde-restauration',
    title: 'Restauration depuis sauvegarde',
    objective: 'Restaurer les données depuis une sauvegarde existante.',
    location: 'Paramètres → Sauvegarde → Restauration',
    intro: 'La restauration permet de revenir à un état antérieur en cas d’incident.',
    steps: [
      { title: 'Choisir la sauvegarde', detail: 'Sélectionner par date.' },
      { title: 'Confirmer la restauration', detail: 'Action irréversible.' },
    ],
    callouts: [{ type: 'warning', text: 'La restauration écrase les données actuelles — sauvegarder avant.' }],
    related: ['parametres-maintenance-purge', 'parametres-avance-base-donnees'],
    keywords: ['restauration', 'sauvegarde', 'récupération'],
  }),
];

// ============================================================
// G. INTÉGRATIONS (5)
// ============================================================
const integrationArticles: GuideArticle[] = [
  make({
    id: 'parametres-integrations-vue-ensemble',
    title: 'Vue d’ensemble — Intégrations',
    objective: 'Comprendre les intégrations disponibles.',
    location: 'Paramètres → Intégrations',
    intro: 'PharmaSoft s’intègre à Supabase, APIs tierces, stockage cloud et webhooks.',
    steps: [{ title: 'Ouvrir Intégrations', detail: 'Paramètres → Intégrations.' }],
    related: ['parametres-integrations-supabase', 'parametres-integrations-webhooks'],
    keywords: ['intégration', 'connecteur'],
  }),
  make({
    id: 'parametres-integrations-supabase',
    title: 'Connexion Supabase',
    objective: 'Vérifier la configuration de la base et de l’authentification Supabase.',
    location: 'Paramètres → Intégrations → Supabase',
    intro: 'Supabase fournit la base de données PostgreSQL et l’authentification.',
    steps: [
      { title: 'Vérifier l’URL du projet', detail: 'Configuration injectée à la build.' },
      { title: 'Vérifier le statut', detail: 'Connecté / déconnecté.' },
    ],
    callouts: [{ type: 'info', text: 'La clé anonyme est publique et sécurisée par RLS.' }],
    related: ['parametres-avance-base-donnees'],
    keywords: ['Supabase', 'base', 'auth'],
  }),
  make({
    id: 'parametres-integrations-api-externe',
    title: 'APIs externes',
    objective: 'Configurer les connecteurs APIs tierces (VIDAL, PharmaML, etc.).',
    location: 'Paramètres → Intégrations → APIs externes',
    intro: 'Les intégrations externes enrichissent le catalogue et les fonctionnalités.',
    steps: [
      { title: 'Choisir l’intégration', detail: 'VIDAL, PharmaML, etc.' },
      { title: 'Saisir les identifiants', detail: 'Clé API, login.' },
      { title: 'Tester la connexion', detail: 'Bouton Tester.' },
    ],
    related: ['parametres-integrations-webhooks'],
    keywords: ['API', 'externe', 'VIDAL'],
  }),
  make({
    id: 'parametres-integrations-cloud-storage',
    title: 'Stockage cloud',
    objective: 'Configurer le stockage des documents (factures, sauvegardes).',
    location: 'Paramètres → Intégrations → Stockage',
    intro: 'Le stockage cloud héberge les documents générés et les sauvegardes.',
    steps: [
      { title: 'Choisir le fournisseur', detail: 'Supabase Storage, S3, etc.' },
      { title: 'Tester l’upload', detail: 'Vérification.' },
    ],
    related: ['parametres-sauvegarde-vue-ensemble'],
    keywords: ['cloud', 'stockage', 'documents'],
  }),
  make({
    id: 'parametres-integrations-webhooks',
    title: 'Webhooks événements',
    objective: 'Configurer des webhooks pour propager les événements à des systèmes externes.',
    location: 'Paramètres → Intégrations → Webhooks',
    intro: 'Les webhooks notifient des systèmes tiers lors d’événements (vente, facture, alerte).',
    steps: [
      { title: 'Ajouter un webhook', detail: 'URL cible, événements écoutés.' },
      { title: 'Sécuriser', detail: 'Token secret partagé.' },
      { title: 'Tester', detail: 'Bouton Envoyer un test.' },
    ],
    related: ['parametres-integrations-api-externe'],
    keywords: ['webhook', 'événement', 'notification'],
  }),
];

// ============================================================
// H. MÉTIERS (6)
// ============================================================
const businessArticles: GuideArticle[] = [
  make({
    id: 'parametres-metiers-vue-ensemble',
    title: 'Vue d’ensemble — Paramètres métiers',
    objective: 'Configurer les règles métier spécifiques à la pharmacie.',
    location: 'Paramètres → Métiers',
    intro: 'Les paramètres métiers couvrent TVA, arrondis, numérotation, stock et vente.',
    steps: [{ title: 'Ouvrir Métiers', detail: 'Paramètres → Métiers.' }],
    related: ['parametres-metiers-tva', 'parametres-metiers-stock'],
    keywords: ['métier', 'pharmacie', 'règles'],
  }),
  make({
    id: 'parametres-metiers-tva',
    title: 'Taux de TVA et exonérations',
    objective: 'Configurer les taux TVA applicables aux produits.',
    location: 'Paramètres → Métiers → TVA',
    intro: 'Les taux TVA déterminent le calcul automatique des taxes (18%, 5%, exonéré).',
    steps: [
      { title: 'Définir le taux normal', detail: 'Par défaut 18%.' },
      { title: 'Définir le taux réduit', detail: 'Par défaut 5%.' },
      { title: 'Lister les exonérations', detail: 'Catégories de produits exonérées.' },
    ],
    related: ['parametres-general-fiscal', 'parametres-metiers-arrondi'],
    keywords: ['TVA', 'taux', 'exonération'],
  }),
  make({
    id: 'parametres-metiers-arrondi',
    title: 'Règles d’arrondi FCFA',
    objective: 'Définir la règle d’arrondi appliquée aux montants en FCFA.',
    location: 'Paramètres → Métiers → Arrondi',
    intro: 'L’arrondi utilise Math.round pour FCFA, conformément au standard interne.',
    steps: [
      { title: 'Choisir la règle', detail: 'Arrondi mathématique (Math.round).' },
      { title: 'Vérifier sur un exemple', detail: 'Aperçu calcul.' },
    ],
    callouts: [{ type: 'info', text: 'L’arrondi s’applique à toutes les chaînes de calcul (Ventes, Achats, Réceptions).' }],
    related: ['parametres-metiers-tva'],
    keywords: ['arrondi', 'FCFA', 'Math.round'],
  }),
  make({
    id: 'parametres-metiers-numerotation',
    title: 'Numérotation des documents',
    objective: 'Configurer le format des numéros de factures, tickets et lots.',
    location: 'Paramètres → Métiers → Numérotation',
    intro: 'La numérotation est isolée par tenant pour éviter les conflits.',
    steps: [
      { title: 'Définir le préfixe', detail: 'Ex : FAC, TIC, LOT.' },
      { title: 'Choisir le format', detail: 'Année, mois, séquence.' },
      { title: 'Réinitialiser si besoin', detail: 'Ex : début d’exercice.' },
    ],
    callouts: [{ type: 'info', text: 'Les séquences sont strictement isolées par tenant.' }],
    related: ['parametres-impressions-factures'],
    keywords: ['numérotation', 'séquence', 'préfixe'],
  }),
  make({
    id: 'parametres-metiers-stock',
    title: 'Seuils Min/Max et péremptions',
    objective: 'Définir les seuils de stock et règles de péremption.',
    location: 'Paramètres → Métiers → Stock',
    intro: 'Les seuils par défaut s’appliquent aux nouveaux produits sans configuration spécifique.',
    steps: [
      { title: 'Saisir les seuils', detail: 'Stock min, stock max.' },
      { title: 'Définir l’alerte péremption', detail: 'Nombre de jours avant alerte.' },
    ],
    related: ['parametres-alertes-stock', 'stock-alertes-rupture'],
    keywords: ['stock', 'seuil', 'péremption'],
  }),
  make({
    id: 'parametres-metiers-vente',
    title: 'Modes de paiement, assurance, fidélité',
    objective: 'Configurer les modes de paiement et programmes commerciaux.',
    location: 'Paramètres → Métiers → Vente',
    intro: 'Les modes de paiement et règles de fidélité s’appliquent au POS et à la facturation.',
    steps: [
      { title: 'Activer les modes de paiement', detail: 'Espèces, mobile money, carte, assurance.' },
      { title: 'Configurer les taux d’assurance', detail: 'Agent, ayant droit.' },
      { title: 'Paramétrer la fidélité', detail: 'Points par franc, paliers.' },
    ],
    related: ['parametres-metiers-numerotation'],
    keywords: ['paiement', 'assurance', 'fidélité'],
  }),
];

// ============================================================
// I. MAINTENANCE (5)
// ============================================================
const maintenanceArticles: GuideArticle[] = [
  make({
    id: 'parametres-maintenance-vue-ensemble',
    title: 'Vue d’ensemble — Maintenance',
    objective: 'Connaître les outils de maintenance disponibles.',
    location: 'Paramètres → Maintenance',
    intro: 'La maintenance regroupe cache, déduplication, clone tenant et purge.',
    steps: [{ title: 'Ouvrir Maintenance', detail: 'Paramètres → Maintenance.' }],
    callouts: [{ type: 'warning', text: 'Opérations sensibles — sauvegarder avant toute action destructive.' }],
    related: ['parametres-maintenance-cache', 'parametres-maintenance-purge'],
    keywords: ['maintenance', 'outils'],
  }),
  make({
    id: 'parametres-maintenance-cache',
    title: 'Vider le cache et recharger la PWA',
    objective: 'Forcer la mise à jour de l’application en vidant le cache.',
    location: 'Paramètres → Maintenance → Cache',
    intro: 'La PWA met à jour immédiatement (skipWaiting + clientsClaim) ; vider le cache force le rechargement.',
    steps: [
      { title: 'Cliquer sur Vider le cache', detail: 'Bouton dédié.' },
      { title: 'Recharger l’application', detail: 'L’interface se rafraîchit.' },
    ],
    related: ['parametres-avance-pwa'],
    keywords: ['cache', 'PWA', 'rechargement'],
  }),
  make({
    id: 'parametres-maintenance-deduplication',
    title: 'Déduplication des référentiels',
    objective: 'Identifier et fusionner les doublons dans les référentiels.',
    location: 'Paramètres → Maintenance → Déduplication',
    intro: 'Le protocole identifie les doublons, fusionne les références et supprime les enregistrements obsolètes.',
    steps: [
      { title: 'Lancer l’analyse', detail: 'Identification automatique.' },
      { title: 'Valider les fusions', detail: 'Revue manuelle.' },
      { title: 'Confirmer', detail: 'Application définitive.' },
    ],
    callouts: [{ type: 'warning', text: 'Sauvegarder avant toute déduplication.' }],
    related: ['parametres-sauvegarde-manuelle', 'parametres-maintenance-purge'],
    keywords: ['déduplication', 'doublon', 'fusion'],
  }),
  make({
    id: 'parametres-maintenance-clone-tenant',
    title: 'Clonage du référentiel tenant',
    objective: 'Initialiser un nouveau tenant à partir d’un modèle existant.',
    location: 'Paramètres → Maintenance → Clone tenant',
    intro: 'Les RPC clone_tenant_referential et clone_tenant_lots dupliquent les données de référence d’un tenant source.',
    steps: [
      { title: 'Choisir le tenant source', detail: 'Modèle d’autorité.' },
      { title: 'Lancer le clonage', detail: 'RPC clone_tenant_referential.' },
      { title: 'Vérifier les données', detail: 'Catalogue, lots, etc.' },
    ],
    callouts: [{ type: 'warning', text: 'Opération réservée aux administrateurs.' }],
    related: ['parametres-maintenance-deduplication', 'parametres-multi-sites-ajouter'],
    keywords: ['clone', 'tenant', 'RPC'],
  }),
  make({
    id: 'parametres-maintenance-purge',
    title: 'Purge des données anciennes',
    objective: 'Supprimer les données obsolètes pour libérer de l’espace.',
    location: 'Paramètres → Maintenance → Purge',
    intro: 'La purge supprime les données antérieures à une date selon les règles de conservation.',
    steps: [
      { title: 'Choisir la période', detail: 'Date limite.' },
      { title: 'Choisir les entités', detail: 'Logs, sessions, brouillons.' },
      { title: 'Confirmer la purge', detail: 'Action irréversible.' },
    ],
    callouts: [{ type: 'warning', text: 'Sauvegarder impérativement avant la purge.' }],
    related: ['parametres-sauvegarde-manuelle', 'parametres-avance-base-donnees'],
    keywords: ['purge', 'suppression', 'rétention'],
  }),
];

// ============================================================
// J. ALERTES (5)
// ============================================================
const alertArticles: GuideArticle[] = [
  make({
    id: 'parametres-alertes-vue-ensemble',
    title: 'Vue d’ensemble — Alertes',
    objective: 'Comprendre la configuration globale des alertes.',
    location: 'Paramètres → Alertes',
    intro: 'Les alertes couvrent stock, ventes, sécurité et sont diffusées via plusieurs canaux.',
    steps: [{ title: 'Ouvrir Alertes', detail: 'Paramètres → Alertes.' }],
    related: ['parametres-alertes-stock', 'parametres-alertes-canaux'],
    keywords: ['alerte', 'notification'],
  }),
  make({
    id: 'parametres-alertes-stock',
    title: 'Alertes stock',
    objective: 'Configurer les alertes de rupture et péremption.',
    location: 'Paramètres → Alertes → Stock',
    intro: 'Les alertes stock préviennent ruptures et péremptions imminentes.',
    steps: [
      { title: 'Définir le seuil de rupture', detail: 'Stock minimum.' },
      { title: 'Définir le délai péremption', detail: 'Nombre de jours.' },
      { title: 'Choisir les destinataires', detail: 'Rôles ou utilisateurs.' },
    ],
    related: ['stock-alertes-rupture', 'parametres-metiers-stock'],
    keywords: ['stock', 'rupture', 'péremption'],
  }),
  make({
    id: 'parametres-alertes-ventes',
    title: 'Alertes ventes',
    objective: 'Configurer les alertes liées aux ventes (objectifs, anomalies).',
    location: 'Paramètres → Alertes → Ventes',
    intro: 'Les alertes ventes signalent des écarts d’objectifs ou des anomalies (annulations, remises excessives).',
    steps: [
      { title: 'Définir les seuils', detail: 'Objectifs journaliers, écarts max.' },
      { title: 'Choisir les destinataires', detail: 'Rôles concernés.' },
    ],
    related: ['parametres-alertes-canaux'],
    keywords: ['ventes', 'objectif', 'anomalie'],
  }),
  make({
    id: 'parametres-alertes-securite',
    title: 'Alertes sécurité',
    objective: 'Configurer les alertes de sécurité (intrusion, incident).',
    location: 'Paramètres → Alertes → Sécurité',
    intro: 'Les alertes sécurité notifient les administrateurs des incidents critiques.',
    steps: [
      { title: 'Choisir le niveau de sévérité', detail: 'Critique, élevé, moyen.' },
      { title: 'Définir les destinataires', detail: 'Administrateurs.' },
    ],
    related: ['parametres-securite-notifications', 'parametres-securite-incidents'],
    keywords: ['sécurité', 'alerte', 'incident'],
  }),
  make({
    id: 'parametres-alertes-canaux',
    title: 'Canaux de notification',
    objective: 'Choisir les canaux de diffusion des alertes.',
    location: 'Paramètres → Alertes → Canaux',
    intro: 'Les canaux disponibles : email, push, in-app.',
    steps: [
      { title: 'Activer les canaux', detail: 'Email, push, in-app.' },
      { title: 'Configurer email', detail: 'Adresse expéditeur.' },
    ],
    related: ['parametres-alertes-vue-ensemble'],
    keywords: ['canal', 'email', 'push'],
  }),
];

// ============================================================
// K. MULTI-SITES (5)
// ============================================================
const multiSiteArticles: GuideArticle[] = [
  make({
    id: 'parametres-multi-sites-vue-ensemble',
    title: 'Vue d’ensemble — Multi-sites',
    objective: 'Comprendre la gestion multi-officines au sein d’un réseau.',
    location: 'Paramètres → Multi-sites',
    intro: 'Le multi-sites permet la gestion centralisée de plusieurs officines avec isolation tenant stricte.',
    steps: [{ title: 'Ouvrir Multi-sites', detail: 'Paramètres → Multi-sites.' }],
    callouts: [{ type: 'info', text: 'Isolation tenant stricte respectée — chaque site reste autonome.' }],
    related: ['parametres-multi-sites-ajouter', 'parametres-multi-sites-synchronisation'],
    keywords: ['multi-sites', 'réseau'],
  }),
  make({
    id: 'parametres-multi-sites-ajouter',
    title: 'Ajouter un site',
    objective: 'Rattacher une nouvelle officine au réseau.',
    location: 'Paramètres → Multi-sites → Ajouter',
    intro: 'L’ajout suit un protocole strict (création tenant + clone du référentiel).',
    steps: [
      { title: 'Saisir les informations du site', detail: 'Nom, adresse, contact.' },
      { title: 'Cloner le référentiel', detail: 'Depuis un site modèle.' },
      { title: 'Activer le site', detail: 'Statut Actif.' },
    ],
    related: ['parametres-maintenance-clone-tenant', 'chat-multi-officines-ajouter'],
    keywords: ['ajout', 'site', 'officine'],
  }),
  make({
    id: 'parametres-multi-sites-synchronisation',
    title: 'Synchronisation des données réseau',
    objective: 'Configurer la synchronisation des données entre sites.',
    location: 'Paramètres → Multi-sites → Synchronisation',
    intro: 'La synchronisation propage les données partagées (catalogue global, alertes).',
    steps: [
      { title: 'Choisir les entités synchronisées', detail: 'Catalogue, alertes, etc.' },
      { title: 'Définir la fréquence', detail: 'Temps réel ou planifiée.' },
    ],
    related: ['chat-multi-officines-synchronisation', 'parametres-multi-sites-rapports'],
    keywords: ['synchronisation', 'réseau'],
  }),
  make({
    id: 'parametres-multi-sites-roles',
    title: 'Rôles inter-sites',
    objective: 'Gérer les rôles transverses au réseau.',
    location: 'Paramètres → Multi-sites → Rôles',
    intro: 'Certains rôles (administrateur réseau) ont une visibilité multi-sites.',
    steps: [
      { title: 'Définir les rôles transverses', detail: 'Périmètre réseau.' },
      { title: 'Affecter les utilisateurs', detail: 'Compte unique par site mais visibilité étendue.' },
    ],
    callouts: [{ type: 'warning', text: 'L’isolation tenant reste prioritaire — les rôles inter-sites sont une exception encadrée.' }],
    related: ['parametres-utilisateurs-roles'],
    keywords: ['rôle', 'inter-sites', 'réseau'],
  }),
  make({
    id: 'parametres-multi-sites-rapports',
    title: 'Rapports consolidés multi-sites',
    objective: 'Générer des rapports agrégés sur tout le réseau.',
    location: 'Paramètres → Multi-sites → Rapports',
    intro: 'Les rapports consolidés agrègent les indicateurs clés de tous les sites.',
    steps: [
      { title: 'Choisir les sites inclus', detail: 'Sélection multi.' },
      { title: 'Choisir la période', detail: 'Plage de dates.' },
      { title: 'Exporter', detail: 'PDF ou Excel.' },
    ],
    related: ['parametres-multi-sites-synchronisation'],
    keywords: ['rapport', 'consolidé', 'réseau'],
  }),
];

// ============================================================
// L. AVANCÉ (5)
// ============================================================
const advancedArticles: GuideArticle[] = [
  make({
    id: 'parametres-avance-vue-ensemble',
    title: 'Vue d’ensemble — Paramètres avancés',
    objective: 'Connaître les paramètres techniques avancés.',
    location: 'Paramètres → Avancé',
    intro: 'Les paramètres avancés couvrent base de données, PWA, mode développeur et fonctionnalités expérimentales.',
    steps: [{ title: 'Ouvrir Avancé', detail: 'Paramètres → Avancé.' }],
    callouts: [{ type: 'warning', text: 'Modifications réservées aux administrateurs avertis.' }],
    related: ['parametres-avance-base-donnees', 'parametres-avance-pwa'],
    keywords: ['avancé', 'technique'],
  }),
  make({
    id: 'parametres-avance-base-donnees',
    title: 'Base de données et performances',
    objective: 'Surveiller et optimiser les performances de la base.',
    location: 'Paramètres → Avancé → Base de données',
    intro: 'Affiche le statut de la base, les indicateurs de performance et les conseils d’optimisation.',
    steps: [
      { title: 'Consulter le statut', detail: 'Connexions, latence.' },
      { title: 'Analyser les requêtes lentes', detail: 'Si disponible.' },
    ],
    related: ['parametres-integrations-supabase', 'parametres-maintenance-purge'],
    keywords: ['base', 'performance', 'PostgreSQL'],
  }),
  make({
    id: 'parametres-avance-pwa',
    title: 'Configuration PWA',
    objective: 'Configurer le comportement PWA (cache, offline POS).',
    location: 'Paramètres → Avancé → PWA',
    intro: 'La PWA utilise un cache de 30MB avec priorité absolue au POS offline.',
    steps: [
      { title: 'Vérifier la taille du cache', detail: 'Limite à 30MB.' },
      { title: 'Activer le mode offline POS', detail: 'Priorité POS.' },
    ],
    callouts: [{ type: 'info', text: 'Stratégie PWA : skipWaiting + clientsClaim pour mise à jour immédiate.' }],
    related: ['parametres-maintenance-cache', 'parametres-integrations-cloud-storage'],
    keywords: ['PWA', 'cache', 'offline'],
  }),
  make({
    id: 'parametres-avance-developer',
    title: 'Mode développeur',
    objective: 'Activer les outils développeur et logs détaillés.',
    location: 'Paramètres → Avancé → Développeur',
    intro: 'Le mode développeur expose des logs détaillés et des outils de diagnostic.',
    steps: [
      { title: 'Activer le mode', detail: 'Toggle dédié.' },
      { title: 'Consulter les logs', detail: 'Console enrichie.' },
    ],
    callouts: [{ type: 'warning', text: 'À désactiver en production hors investigation.' }],
    related: ['parametres-avance-experimental'],
    keywords: ['développeur', 'logs', 'debug'],
  }),
  make({
    id: 'parametres-avance-experimental',
    title: 'Fonctionnalités expérimentales',
    objective: 'Activer les fonctionnalités en bêta.',
    location: 'Paramètres → Avancé → Expérimental',
    intro: 'Les fonctionnalités expérimentales sont en cours de stabilisation.',
    steps: [
      { title: 'Lister les fonctionnalités', detail: 'Description et statut.' },
      { title: 'Activer/désactiver', detail: 'Toggle individuel.' },
    ],
    callouts: [{ type: 'warning', text: 'Réservé aux environnements de test — risque d’instabilité.' }],
    related: ['parametres-avance-developer'],
    keywords: ['expérimental', 'bêta'],
  }),
];

// ============================================================
// MODULE
// ============================================================
export const parametresModule: GuideModule = {
  id: 'parametres',
  title: 'Paramètres',
  tagline: 'Configurer système, utilisateurs, sécurité, impressions, intégrations et règles métier.',
  description: 'Les paramètres centralisent les choix qui influencent le comportement de l’application et les documents générés.',
  icon: Settings2,
  accent: 'secondary',
  sections: [
    { id: 'parametres-general', title: 'Général', icon: Building2, articles: generalArticles },
    { id: 'parametres-utilisateurs', title: 'Utilisateurs et rôles', icon: Users, articles: usersArticles },
    { id: 'parametres-interface', title: 'Interface', icon: Palette, articles: interfaceArticles },
    { id: 'parametres-securite', title: 'Sécurité', icon: ShieldCheck, articles: securityArticles },
    { id: 'parametres-impressions', title: 'Impressions', icon: Printer, articles: printArticles },
    { id: 'parametres-sauvegarde', title: 'Sauvegarde et restauration', icon: DatabaseBackup, articles: backupArticles },
    { id: 'parametres-integrations', title: 'Intégrations', icon: Plug, articles: integrationArticles },
    { id: 'parametres-metiers', title: 'Paramètres métiers', icon: Briefcase, articles: businessArticles },
    { id: 'parametres-maintenance', title: 'Maintenance', icon: Wrench, articles: maintenanceArticles },
    { id: 'parametres-alertes', title: 'Alertes', icon: Bell, articles: alertArticles },
    { id: 'parametres-multi-sites', title: 'Multi-sites', icon: Network, articles: multiSiteArticles },
    { id: 'parametres-avance', title: 'Paramètres avancés', icon: Cog, articles: advancedArticles },
  ],
};
