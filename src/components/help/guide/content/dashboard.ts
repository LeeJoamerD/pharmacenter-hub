import { LayoutDashboard, Gauge, Activity, Newspaper, Zap } from 'lucide-react';
import type { GuideArticle, GuideModule } from '../types';

type ArticleInput = Partial<GuideArticle> & Pick<GuideArticle, 'id' | 'title' | 'objective' | 'intro'>;

const make = (a: ArticleInput): GuideArticle => ({
  location: 'Accueil → Tableau de bord',
  audience: ['Pharmacien Titulaire', 'Administrateurs', 'Gestionnaires'],
  steps: [],
  callouts: [],
  bestPractices: [],
  faq: [],
  related: [],
  keywords: [],
  ...a,
});

// ── Section A : Pilotage et accès ────────────────────────────────────────────
const pilotageArticles: GuideArticle[] = [
  make({
    id: 'dashboard-vue-ensemble',
    title: "Vue d'ensemble du Tableau de bord",
    objective: "Comprendre l'organisation du Dashboard principal et la lecture des indicateurs.",
    intro: "Le Tableau de bord centralise en temps réel les KPI ventes et stock, les alertes critiques, les sessions de caisse actives, les crédits/promotions, les activités récentes et les actualités réglementaires VIDAL.",
    steps: [
      { title: 'Accédez au Dashboard', detail: 'Cliquez sur Accueil dans la barre latérale principale.' },
      { title: 'Parcourez les blocs', detail: 'KPI Ventes, KPI Stock, graphiques, alertes, sessions, crédits, activités, VIDAL puis Actions rapides.' },
      { title: "Utilisez les actions d'en-tête", detail: 'Bouton Actualiser pour rafraîchir, bouton Visibilité pour masquer/afficher les données sensibles.' },
    ],
    callouts: [
      { type: 'info', title: 'Permission requise', text: "L'affichage des données du Dashboard est conditionné par la permission dashboard.view." },
    ],
    bestPractices: [
      "Consulter le Dashboard en début de journée pour repérer ruptures et péremptions.",
      "Vérifier les sessions de caisse actives avant chaque clôture comptable.",
    ],
    faq: [
      { q: 'Les données sont-elles temps réel ?', a: 'Oui, elles sont rafraîchies à chaque ouverture et via le bouton Actualiser.' },
    ],
    related: ['dashboard-actualiser', 'dashboard-visibilite-permission', 'presentation-vue-ensemble'],
    keywords: ['tableau de bord', 'accueil', 'KPI', 'pilotage'],
  }),
  make({
    id: 'dashboard-actualiser',
    title: 'Actualiser les données du Dashboard',
    objective: "Recharger l'ensemble des indicateurs sans recharger la page.",
    intro: "Le bouton Actualiser de l'en-tête déclenche un rafraîchissement complet via useDashboardData (ventes, stock, alertes, sessions, crédits, activités).",
    steps: [
      { title: 'Cliquez sur Actualiser', detail: "Bouton situé en haut à droite du Dashboard." },
      { title: "Attendez l'indicateur de chargement", detail: "Une animation confirme le rafraîchissement (≈ 1 seconde)." },
      { title: 'Vérifiez les nouveaux chiffres', detail: 'Les KPI, graphiques et alertes reflètent les dernières opérations.' },
    ],
    callouts: [
      { type: 'tip', text: 'Actualisez après une vente importante ou une réception pour voir les chiffres consolidés.' },
    ],
    related: ['dashboard-vue-ensemble', 'dashboard-kpi-ventes'],
    keywords: ['actualiser', 'rafraîchir', 'temps réel'],
  }),
  make({
    id: 'dashboard-visibilite-permission',
    title: 'Visibilité du Dashboard et permission dashboard.view',
    objective: "Maîtriser le masquage/affichage des données sensibles et la permission requise.",
    intro: "L'accès aux chiffres du Dashboard est protégé par la permission dashboard.view. Le bouton Visibilité permet aux utilisateurs autorisés de masquer temporairement les indicateurs (présentation client, écran partagé).",
    steps: [
      { title: 'Vérifiez votre rôle', detail: 'Seuls les rôles disposant de dashboard.view voient les chiffres détaillés.' },
      { title: 'Basculez la visibilité', detail: "Cliquez sur l'icône œil dans l'en-tête pour masquer ou afficher les blocs." },
      { title: 'Réafficher à la demande', detail: "Cliquez à nouveau pour révéler les données." },
    ],
    callouts: [
      { type: 'warning', text: "Sans la permission dashboard.view, les blocs restent masqués même après bascule." },
      { type: 'info', text: "Cette permission est unifiée pour Accueil, Stock, Ventes, Comptabilité et Rapports." },
    ],
    bestPractices: [
      "Masquer les chiffres lors de démonstrations ou captures d'écran.",
      "Attribuer dashboard.view uniquement aux rôles décisionnels.",
    ],
    related: ['parametres-utilisateurs-permissions-detail', 'parametres-utilisateurs-roles'],
    keywords: ['permission', 'visibilité', 'dashboard.view', 'sécurité'],
  }),
];

// ── Section B : Indicateurs clés (KPI) ──────────────────────────────────────
const kpiArticles: GuideArticle[] = [
  make({
    id: 'dashboard-kpi-ventes',
    title: 'KPI Ventes du jour',
    objective: 'Lire les indicateurs commerciaux du jour : CA, tickets, panier moyen, marge.',
    intro: "La rangée SalesMetricsCards affiche les KPI ventes consolidés du jour : chiffre d'affaires, nombre de tickets, panier moyen et marge brute, formatés selon la devise du tenant.",
    steps: [
      { title: 'Repérez les 4 cartes', detail: 'CA, Tickets, Panier moyen, Marge.' },
      { title: 'Comparez à la veille', detail: "Les variations affichent l'évolution par rapport au jour précédent." },
      { title: 'Cliquez pour approfondir', detail: 'Naviguez vers Rapports → Ventes pour le détail.' },
    ],
    callouts: [
      { type: 'info', text: "Les montants utilisent la devise définie dans les Paramètres généraux (parametres_systeme)." },
    ],
    bestPractices: [
      "Consulter les KPI Ventes en fin de journée pour valider la performance.",
      "Comparer panier moyen et marge pour détecter d'éventuelles dérives de prix.",
    ],
    related: ['ventes-analytics-vue-ensemble', 'rapports-ventes-vue-ensemble', 'dashboard-tendance-ventes'],
    keywords: ['ventes', "chiffre d'affaires", 'ticket moyen', 'marge'],
  }),
  make({
    id: 'dashboard-kpi-stock',
    title: 'KPI Stock',
    objective: "Surveiller la santé du stock : valorisation, ruptures, alertes péremption.",
    intro: "La rangée StockMetricsCards expose les indicateurs stock : valorisation totale, nombre de produits en rupture, produits sous seuil et alertes péremption.",
    steps: [
      { title: 'Lisez la valorisation', detail: 'Valeur totale du stock au prix d achat.' },
      { title: 'Repérez les ruptures', detail: "Nombre de produits dont le stock est à zéro." },
      { title: 'Surveillez les seuils', detail: 'Produits sous le seuil minimum défini.' },
    ],
    callouts: [
      { type: 'warning', text: "Les ruptures bloquent la vente : déclencher un réapprovisionnement immédiat." },
    ],
    related: ['stock-alertes-rupture', 'rapports-stock-vue-ensemble', 'dashboard-alertes-peremption'],
    keywords: ['stock', 'rupture', 'valorisation', 'seuil'],
  }),
  make({
    id: 'dashboard-tendance-ventes',
    title: 'Graphique de tendance des ventes',
    objective: "Visualiser l'évolution du chiffre d'affaires sur les 30 derniers jours.",
    intro: "SalesTrendChart trace une courbe interactive du CA quotidien permettant d'identifier rapidement les pics, creux et tendances saisonnières.",
    steps: [
      { title: 'Survolez la courbe', detail: "Le tooltip affiche le CA exact pour chaque jour." },
      { title: 'Identifiez les tendances', detail: "Repérez croissance, stagnation ou baisse." },
      { title: 'Recoupez avec les promotions', detail: 'Vérifiez l impact des campagnes en cours.' },
    ],
    related: ['dashboard-kpi-ventes', 'rapports-ventes-vue-ensemble'],
    keywords: ['tendance', 'graphique', 'évolution', 'CA'],
  }),
  make({
    id: 'dashboard-modes-paiement',
    title: 'Répartition des modes de paiement',
    objective: 'Analyser la part de chaque mode de paiement dans les encaissements du jour.',
    intro: "PaymentMethodsChart présente un graphique en secteurs : espèces, mobile money, carte, crédit client, assurance.",
    steps: [
      { title: 'Lisez les pourcentages', detail: "Chaque secteur affiche sa part relative." },
      { title: 'Comparez les modes', detail: 'Identifiez le canal dominant (cash vs mobile money).' },
      { title: 'Ajustez la caisse', detail: "Prévoir le fond de caisse selon la part espèces." },
    ],
    related: ['ventes-caisse-cloture', 'comptabilite-tableau-bord'],
    keywords: ['paiement', 'espèces', 'mobile money', 'répartition'],
  }),
];

// ── Section C : Suivi opérationnel ───────────────────────────────────────────
const operationnelArticles: GuideArticle[] = [
  make({
    id: 'dashboard-alertes-peremption',
    title: 'Alertes critiques de péremption',
    objective: 'Identifier les lots arrivant à péremption pour agir avant perte sèche.',
    intro: "CriticalAlertsList affiche les lots dont la date de péremption approche, triés par criticité, avec libelle_produit, lot et quantité concernée.",
    steps: [
      { title: 'Consultez la liste', detail: "Les lots les plus urgents apparaissent en tête." },
      { title: "Identifiez les actions", detail: 'Promotion, retour fournisseur ou destruction.' },
      { title: 'Mettez à jour le stock', detail: 'Tracez chaque sortie dans le module Stock.' },
    ],
    callouts: [
      { type: 'warning', text: "Les alertes complètent mais ne remplacent pas le contrôle physique périodique des lots." },
    ],
    bestPractices: [
      'Traiter les alertes hebdomadairement.',
      "Privilégier la rotation FEFO (First Expired, First Out) en officine.",
    ],
    related: ['stock-alertes-peremption', 'stock-lots-vue-ensemble'],
    keywords: ['alerte', 'lot', 'expiration', 'péremption'],
  }),
  make({
    id: 'dashboard-top-produits',
    title: 'Top produits du jour',
    objective: "Identifier les produits les plus vendus pour piloter l'assortiment.",
    intro: "TopProductsList classe les meilleures ventes du jour avec libelle_produit, quantité vendue et CA généré.",
    steps: [
      { title: 'Lisez le classement', detail: 'Les best-sellers apparaissent en premier.' },
      { title: 'Vérifiez le stock', detail: 'Anticipez la rupture sur les produits stars.' },
      { title: 'Préparez la commande', detail: 'Intégrez ces produits dans le prochain ordre.' },
    ],
    related: ['stock-alertes-rupture', 'ventes-analytics-vue-ensemble'],
    keywords: ['top produits', 'best-sellers', 'classement'],
  }),
  make({
    id: 'dashboard-sessions-actives',
    title: 'Sessions de caisse actives',
    objective: 'Surveiller les sessions de caisse ouvertes en temps réel.',
    intro: "ActiveSessionsCards liste chaque session de caisse en cours : caissier, heure d'ouverture, encaissements provisoires, mode.",
    steps: [
      { title: 'Identifiez les sessions', detail: 'Une carte par caisse ouverte.' },
      { title: 'Suivez les encaissements', detail: 'Montants provisoires affichés en temps réel.' },
      { title: 'Anticipez la clôture', detail: 'Préparez la clôture pour chaque caisse en fin de service.' },
    ],
    callouts: [
      { type: 'info', text: 'Les sessions actives sont alignées avec le cycle de clôture comptable journalier.' },
    ],
    related: ['ventes-caisse-cloture', 'comptabilite-tableau-bord'],
    keywords: ['session', 'caisse', 'ouverture', 'clôture'],
  }),
  make({
    id: 'dashboard-credits-promotions',
    title: 'Synthèse Crédits clients et Promotions',
    objective: "Visualiser l'encours crédits et les promotions actives.",
    intro: "CreditPromotionsSummary regroupe deux blocs : encours crédits clients (montant total, clients concernés) et promotions actives (nombre, période).",
    steps: [
      { title: 'Consultez les crédits', detail: "Montant global dû par les clients." },
      { title: "Vérifiez les relances", detail: 'Identifiez les retards de paiement.' },
      { title: 'Suivez les promotions', detail: "Promotions en cours et leur date de fin." },
    ],
    related: ['ventes-credits-clients', 'ventes-promotions'],
    keywords: ['crédit', 'promotion', 'encours', 'relance'],
  }),
  make({
    id: 'dashboard-activites-recentes',
    title: 'Timeline des activités récentes',
    objective: "Suivre en temps réel les dernières opérations effectuées dans l'officine.",
    intro: "RecentActivitiesTimeline affiche un fil chronologique des derniers événements : ventes, réceptions, ajustements de stock, créations utilisateur.",
    steps: [
      { title: 'Parcourez la timeline', detail: 'Les événements les plus récents apparaissent en haut.' },
      { title: "Identifiez l'auteur", detail: "Chaque entrée mentionne l'utilisateur responsable." },
      { title: 'Cliquez pour le détail', detail: "Accédez à la transaction ou au document concerné." },
    ],
    related: ['rapports-ventes-vue-ensemble', 'parametres-securite-audit'],
    keywords: ['activité', 'journal', 'temps réel', 'timeline'],
  }),
];

// ── Section D : Veille et actions ────────────────────────────────────────────
const veilleArticles: GuideArticle[] = [
  make({
    id: 'dashboard-actualites-vidal',
    title: 'Actualités VIDAL et alertes réglementaires',
    objective: 'Rester informé des alertes ANSM, HAS et EMA directement depuis le Dashboard.',
    intro: "VidalNewsWidget agrège les actualités pharmaceutiques officielles (rappels de lots, alertes pharmacovigilance, recommandations HAS) via l'Edge Function vidal-news.",
    steps: [
      { title: 'Consultez les titres', detail: 'Les actualités les plus récentes apparaissent en premier.' },
      { title: "Cliquez pour lire", detail: "Le widget ouvre l'article complet ou la source officielle." },
      { title: 'Croisez avec votre stock', detail: 'Vérifiez si un produit concerné est en stock.' },
    ],
    callouts: [
      { type: 'info', text: "Les actualités sont fournies à titre informatif. Toujours vérifier la source officielle (ANSM, HAS, EMA) avant action." },
    ],
    bestPractices: [
      'Consulter VIDAL chaque matin.',
      'Documenter toute action (retrait, isolement) consécutive à une alerte.',
    ],
    related: ['assistant-pharma-pharmacovigilance', 'stock-lots-vue-ensemble'],
    keywords: ['VIDAL', 'ANSM', 'alerte réglementaire', 'pharmacovigilance'],
  }),
  make({
    id: 'dashboard-actions-rapides',
    title: 'Panneau Actions rapides',
    objective: 'Accéder en un clic aux opérations les plus fréquentes depuis le Dashboard.',
    intro: "QuickActionsPanel propose des raccourcis vers les fonctions clés : nouvelle vente, réception, ajustement stock, création client, ouverture de caisse.",
    steps: [
      { title: 'Identifiez le raccourci', detail: 'Chaque bouton porte une icône explicite.' },
      { title: 'Cliquez pour naviguer', detail: "L'action ouvre directement le module concerné via navigateToModule." },
      { title: 'Personnalisez via les rôles', detail: "Les actions visibles dépendent des permissions de l'utilisateur." },
    ],
    callouts: [
      { type: 'tip', text: 'Utilisez les actions rapides pour réduire le nombre de clics quotidiens.' },
    ],
    related: ['presentation-navigation-modules', 'ventes-caisse-cloture'],
    keywords: ['actions rapides', 'raccourci', 'navigation'],
  }),
];

export const dashboardModule: GuideModule = {
  id: 'dashboard',
  title: 'Tableau de bord',
  tagline: "Pilotage temps réel de l'officine",
  description: 'KPI ventes/stock, alertes péremption, sessions de caisse, crédits/promotions, activités récentes, actualités VIDAL et actions rapides.',
  icon: LayoutDashboard,
  accent: 'primary',
  sections: [
    {
      id: 'dashboard-pilotage',
      title: 'Pilotage et accès',
      description: "Accès, actualisation et visibilité du Dashboard.",
      icon: LayoutDashboard,
      articles: pilotageArticles,
    },
    {
      id: 'dashboard-kpi',
      title: 'Indicateurs clés (KPI)',
      description: 'Ventes, stock, tendances et modes de paiement.',
      icon: Gauge,
      articles: kpiArticles,
    },
    {
      id: 'dashboard-operationnel',
      title: 'Suivi opérationnel',
      description: 'Alertes, top produits, sessions, crédits et activités.',
      icon: Activity,
      articles: operationnelArticles,
    },
    {
      id: 'dashboard-veille',
      title: 'Veille et actions',
      description: 'Actualités VIDAL et actions rapides.',
      icon: Newspaper,
      articles: veilleArticles,
    },
  ],
};
