import {
  Bot,
  LayoutDashboard,
  MessageSquare,
  Stethoscope,
  Lightbulb,
  TrendingUp,
  Smile,
  Eye,
  Pill,
  Calculator,
  BarChart3,
  GraduationCap,
  Workflow,
  Boxes,
  Plug,
  Settings2,
} from 'lucide-react';
import type { GuideArticle, GuideModule, GuideSection } from '../types';

const audAll = ['Administrateurs', 'Pharmaciens', 'Gestionnaires'];
const audAdmin = ['Administrateurs'];
const audPharma = ['Pharmaciens', 'Pharmaciens titulaires'];
const audCompta = ['Comptables', 'Pharmaciens titulaires', 'Administrateurs'];
const audGestion = ['Gestionnaires', 'Pharmaciens', 'Administrateurs'];

type ArticleInput = {
  id: string;
  title: string;
  objective: string;
  location: string;
  audience?: string[];
  intro: string;
  steps?: { title: string; detail?: string }[];
  callouts?: { type: 'tip' | 'warning' | 'info' | 'success'; title?: string; text: string }[];
  bestPractices?: string[];
  faq?: { q: string; a: string }[];
  related?: string[];
  keywords?: string[];
};

const make = (a: ArticleInput): GuideArticle => ({
  audience: a.audience ?? audAll,
  steps: a.steps ?? [],
  callouts: a.callouts ?? [],
  bestPractices: a.bestPractices ?? [],
  faq: a.faq ?? [],
  related: a.related ?? [],
  keywords: a.keywords ?? [],
  ...a,
});

// A. Pilotage IA
const pilotage: GuideArticle[] = [
  make({
    id: 'assistant-dashboard-vue-ensemble',
    title: 'Vue d’ensemble du tableau de bord IA',
    objective: 'Comprendre les KPI IA globaux et le statut des modules.',
    location: 'Assistant IA → Tableau de bord',
    intro: 'Le tableau de bord IA présente les indicateurs clés et l’état des 14 modules IA disponibles.',
    steps: [
      { title: 'Consulter les KPI', detail: 'Conversations, prédictions, anomalies, requêtes traitées.' },
      { title: 'Vérifier la visibilité', detail: 'Les widgets sont protégés par la permission dashboard.view.' },
    ],
    callouts: [{ type: 'info', text: 'Visibilité gérée par useDashboardVisibility.' }],
    related: ['assistant-chat-vue-ensemble', 'assistant-config-vue-ensemble'],
    keywords: ['IA', 'dashboard', 'KPI', 'modules'],
  }),
  make({
    id: 'assistant-dashboard-modules',
    title: 'Naviguer parmi les modules IA',
    objective: 'Accéder rapidement aux 14 sous-modules IA.',
    location: 'Assistant IA → Tableau de bord → Modules',
    intro: 'Les cartes de modules permettent d’ouvrir Chat, Diagnostic, Prévisions, Vision, etc.',
    steps: [{ title: 'Cliquer sur une carte', detail: 'Ouvre le sous-module correspondant.' }],
    related: ['assistant-dashboard-vue-ensemble'],
    keywords: ['modules', 'navigation', 'IA'],
  }),
  make({
    id: 'assistant-dashboard-activite',
    title: 'Activité récente IA',
    objective: 'Suivre les dernières inférences et interactions.',
    location: 'Assistant IA → Tableau de bord → Activité',
    intro: 'Affiche les dernières conversations, prédictions et anomalies détectées.',
    keywords: ['activité', 'historique', 'inférence'],
  }),
  make({
    id: 'assistant-dashboard-sante-ia',
    title: 'Santé des modèles IA',
    objective: 'Surveiller la disponibilité et la latence des modèles.',
    location: 'Assistant IA → Tableau de bord → Santé',
    intro: 'Suivi de la latence moyenne, taux d’erreur et quotas (429/402).',
    callouts: [{ type: 'warning', text: 'Erreur 429 = rate limit ; 402 = crédits Lovable AI à recharger.' }],
    keywords: ['santé', 'latence', 'quota'],
  }),
];

// B. Chat conversationnel
const chat: GuideArticle[] = [
  make({
    id: 'assistant-chat-vue-ensemble',
    title: 'Vue d’ensemble du Chat IA',
    objective: 'Découvrir l’assistant conversationnel.',
    location: 'Assistant IA → Chat IA',
    intro: 'Le Chat IA répond aux questions métier via Lovable AI Gateway (Gemini par défaut).',
    callouts: [{ type: 'info', text: 'Edge Function network-ai-chat avec validation JWT et isolation tenant.' }],
    related: ['assistant-chat-conversation', 'assistant-chat-modeles'],
    keywords: ['chat', 'conversation', 'IA'],
  }),
  make({
    id: 'assistant-chat-conversation',
    title: 'Tenir une conversation',
    objective: 'Poser une question et exploiter l’historique.',
    location: 'Assistant IA → Chat IA → Chat',
    intro: 'Saisissez une question contextualisée et consultez les suggestions proposées.',
    steps: [
      { title: 'Formuler la question', detail: 'Préciser période, produit ou indicateur.' },
      { title: 'Lire la réponse', detail: 'Vérifier la confiance et les sources.' },
      { title: 'Affiner', detail: 'Relancer avec plus de contexte si besoin.' },
    ],
    callouts: [{ type: 'warning', text: 'Toujours relire les réponses dans leur contexte métier.' }],
    related: ['assistant-chat-modeles', 'assistant-config-system-prompts'],
    keywords: ['chat', 'question', 'historique'],
  }),
  make({
    id: 'assistant-chat-modeles',
    title: 'Choisir le modèle IA',
    objective: 'Sélectionner un modèle adapté à la tâche.',
    location: 'Assistant IA → Chat IA → Modèles',
    intro: 'Modèles disponibles via Lovable AI Gateway, par défaut google/gemini-2.5-flash.',
    related: ['assistant-config-modeles'],
    keywords: ['modèle', 'Gemini', 'gateway'],
  }),
  make({
    id: 'assistant-chat-insights',
    title: 'Insights du chat',
    objective: 'Capitaliser sur les conversations.',
    location: 'Assistant IA → Chat IA → Insights',
    intro: 'Synthèses thématiques des échanges récents.',
    keywords: ['insight', 'synthèse'],
  }),
  make({
    id: 'assistant-chat-parametres',
    title: 'Paramètres du Chat IA',
    objective: 'Régler température, max tokens et system prompt.',
    location: 'Assistant IA → Chat IA → Settings',
    intro: 'Paramétrage par utilisateur ou par modèle.',
    related: ['assistant-config-modeles', 'assistant-config-system-prompts'],
    keywords: ['paramètre', 'température', 'prompt'],
  }),
];

// C. Diagnostic
const diagnostic: GuideArticle[] = [
  make({
    id: 'assistant-diagnostic-vue-ensemble',
    title: 'Vue d’ensemble du diagnostic IA',
    objective: 'Évaluer la santé globale de la pharmacie.',
    location: 'Assistant IA → Diagnostic',
    intro: 'Score global, indicateurs ventes, stock, marges, clients.',
    keywords: ['diagnostic', 'score', 'santé'],
  }),
  make({
    id: 'assistant-diagnostic-performance',
    title: 'Performance opérationnelle',
    objective: 'Mesurer la performance des processus.',
    location: 'Assistant IA → Diagnostic → Performance',
    intro: 'Indicateurs comparatifs et tendances.',
    keywords: ['performance', 'KPI'],
  }),
  make({
    id: 'assistant-diagnostic-anomalies',
    title: 'Anomalies détectées',
    objective: 'Examiner les anomalies remontées par l’IA.',
    location: 'Assistant IA → Diagnostic → Anomalies',
    intro: 'Liste des anomalies avec confiance, impact et suggestions.',
    related: ['assistant-comptable-anomalies'],
    keywords: ['anomalie', 'alerte'],
  }),
  make({
    id: 'assistant-diagnostic-bottlenecks',
    title: 'Goulots d’étranglement',
    objective: 'Identifier les points de blocage.',
    location: 'Assistant IA → Diagnostic → Bottlenecks',
    intro: 'Analyse des zones critiques (caisse, stock, livraison).',
    keywords: ['goulot', 'blocage'],
  }),
  make({
    id: 'assistant-diagnostic-tendances',
    title: 'Tendances',
    objective: 'Suivre les tendances long terme.',
    location: 'Assistant IA → Diagnostic → Tendances',
    intro: 'Évolution des KPI sur plusieurs périodes.',
    keywords: ['tendance', 'évolution'],
  }),
];

// D. Recommandations
const recommandations: GuideArticle[] = [
  make({
    id: 'assistant-recommandations-vue-ensemble',
    title: 'Recommandations stratégiques',
    objective: 'Recevoir des recommandations IA actionnables.',
    location: 'Assistant IA → Recommandations',
    intro: 'Liste priorisée d’actions à fort impact.',
    keywords: ['recommandation', 'stratégie'],
  }),
  make({
    id: 'assistant-recommandations-facteurs',
    title: 'Facteurs clés',
    objective: 'Comprendre les facteurs influents.',
    location: 'Assistant IA → Recommandations → Facteurs',
    intro: 'Décomposition des leviers décisionnels.',
    keywords: ['facteur', 'levier'],
  }),
  make({
    id: 'assistant-recommandations-actions',
    title: 'Plan d’action',
    objective: 'Suivre l’exécution des recommandations.',
    location: 'Assistant IA → Recommandations → Actions',
    intro: 'Tableau d’actions avec responsable et statut.',
    keywords: ['action', 'plan'],
  }),
];

// E. Prévisions
const previsions: GuideArticle[] = [
  make({
    id: 'assistant-previsions-vue-ensemble',
    title: 'Vue d’ensemble des prévisions',
    objective: 'Découvrir les prévisions multi-domaines.',
    location: 'Assistant IA → Prévisions',
    intro: 'Prévisions ventes, stock, trésorerie sur horizons configurables.',
    callouts: [{ type: 'info', text: 'Les prévisions complètent l’analyse humaine sans la remplacer.' }],
    keywords: ['prévision', 'forecast'],
  }),
  make({
    id: 'assistant-previsions-ventes',
    title: 'Prévisions de ventes',
    objective: 'Anticiper le chiffre d’affaires.',
    location: 'Assistant IA → Prévisions → Ventes',
    intro: 'Modèles temporels appliqués à l’historique des ventes.',
    related: ['ventes-analytics-vue-ensemble', 'rapports-bi-predictif'],
    keywords: ['prévision', 'ventes', 'CA'],
  }),
  make({
    id: 'assistant-previsions-stock',
    title: 'Prévisions de stock',
    objective: 'Anticiper les ruptures et les surstocks.',
    location: 'Assistant IA → Prévisions → Stock',
    intro: 'Prédictions par produit (libelle_produit) basées sur la rotation.',
    related: ['assistant-stocks-predictions', 'stock-alertes-rupture'],
    keywords: ['prévision', 'stock', 'rupture'],
  }),
  make({
    id: 'assistant-previsions-tresorerie',
    title: 'Prévisions de trésorerie',
    objective: 'Projeter la trésorerie à court terme.',
    location: 'Assistant IA → Prévisions → Trésorerie',
    intro: 'Modèles intégrant encaissements, décaissements et échéances.',
    keywords: ['trésorerie', 'cashflow'],
  }),
  make({
    id: 'assistant-previsions-facteurs',
    title: 'Facteurs d’influence',
    objective: 'Comprendre les variables qui pèsent sur les prévisions.',
    location: 'Assistant IA → Prévisions → Facteurs',
    intro: 'Saisonnalité, promotions, météo, événements.',
    keywords: ['facteur', 'saisonnalité'],
  }),
];

// F. Sentiment
const sentiment: GuideArticle[] = [
  make({
    id: 'assistant-sentiment-vue-ensemble',
    title: 'Analyse de sentiment',
    objective: 'Mesurer la satisfaction client globale.',
    location: 'Assistant IA → Sentiment',
    intro: 'Score global et répartition positif / neutre / négatif.',
    keywords: ['sentiment', 'satisfaction'],
  }),
  make({
    id: 'assistant-sentiment-feedback',
    title: 'Retours clients',
    objective: 'Consulter les retours collectés.',
    location: 'Assistant IA → Sentiment → Feedback',
    intro: 'Liste des retours avec score et catégorie.',
    keywords: ['feedback', 'retour'],
  }),
  make({
    id: 'assistant-sentiment-categories',
    title: 'Catégories de sentiments',
    objective: 'Analyser les thèmes récurrents.',
    location: 'Assistant IA → Sentiment → Catégories',
    intro: 'Regroupement automatique des retours par thématique.',
    keywords: ['catégorie', 'thème'],
  }),
  make({
    id: 'assistant-sentiment-mots-cles',
    title: 'Mots-clés identifiés',
    objective: 'Visualiser les termes les plus fréquents.',
    location: 'Assistant IA → Sentiment → Mots-clés',
    intro: 'Nuage et tableau des mots-clés saillants.',
    keywords: ['mot-clé', 'tag'],
  }),
  make({
    id: 'assistant-sentiment-analyseur',
    title: 'Analyseur de texte',
    objective: 'Tester un texte libre.',
    location: 'Assistant IA → Sentiment → Analyseur',
    intro: 'Saisir un texte pour obtenir score et catégorisation immédiats.',
    keywords: ['analyseur', 'texte'],
  }),
];

// G. Vision
const vision: GuideArticle[] = [
  make({
    id: 'assistant-vision-reconnaissance',
    title: 'Reconnaissance produits',
    objective: 'Identifier un produit par image.',
    location: 'Assistant IA → Vision → Reconnaissance',
    intro: 'Détection visuelle reliée au catalogue (libelle_produit).',
    callouts: [{ type: 'warning', text: 'Vérification pharmacien obligatoire avant action stock.' }],
    related: ['assistant-vision-controle-qualite', 'stock-inventaire-mobile'],
    keywords: ['vision', 'reconnaissance', 'image'],
  }),
  make({
    id: 'assistant-vision-etageres',
    title: 'Analyse d’étagères',
    objective: 'Évaluer le linéaire et les ruptures visibles.',
    location: 'Assistant IA → Vision → Étagères',
    intro: 'Analyse de photos de rayonnages.',
    keywords: ['étagère', 'linéaire'],
  }),
  make({
    id: 'assistant-vision-controle-qualite',
    title: 'Contrôle qualité visuel',
    objective: 'Détecter défauts et conformité visuelle.',
    location: 'Assistant IA → Vision → Contrôle Qualité',
    intro: 'Analyse d’images pour conformité packaging.',
    keywords: ['qualité', 'contrôle'],
  }),
  make({
    id: 'assistant-vision-traitement-lot',
    title: 'Traitement par lot',
    objective: 'Analyser plusieurs images en une fois.',
    location: 'Assistant IA → Vision → Traitement Lot',
    intro: 'Pipeline batch avec rapport consolidé.',
    keywords: ['lot', 'batch'],
  }),
];

// H. Pharma
const pharma: GuideArticle[] = [
  make({
    id: 'assistant-pharma-base-medicaments',
    title: 'Base médicaments',
    objective: 'Consulter la base pharmaceutique enrichie.',
    location: 'Assistant IA → Expert Pharma → Base Médicaments',
    audience: audPharma,
    intro: 'Recherche par DCI, classe ATC, indication.',
    keywords: ['pharma', 'médicament', 'DCI'],
  }),
  make({
    id: 'assistant-pharma-interactions',
    title: 'Interactions médicamenteuses',
    objective: 'Détecter les interactions à risque.',
    location: 'Assistant IA → Expert Pharma → Interactions',
    audience: audPharma,
    intro: 'Vérification croisée entre molécules.',
    callouts: [{ type: 'warning', text: 'Validation pharmacien obligatoire.' }],
    related: ['assistant-pharma-pharmacovigilance', 'rapports-reglementaires-pharmacovigilance'],
    keywords: ['interaction', 'risque'],
  }),
  make({
    id: 'assistant-pharma-recommandations',
    title: 'Recommandations thérapeutiques',
    objective: 'Obtenir des suggestions thérapeutiques.',
    location: 'Assistant IA → Expert Pharma → Recommandations',
    audience: audPharma,
    intro: 'Suggestions basées sur indications et contre-indications.',
    keywords: ['recommandation', 'thérapeutique'],
  }),
  make({
    id: 'assistant-pharma-pharmacovigilance',
    title: 'Pharmacovigilance',
    objective: 'Suivre les signaux de pharmacovigilance.',
    location: 'Assistant IA → Expert Pharma → Pharmacovigilance',
    audience: audPharma,
    intro: 'Tableau des signaux et déclarations.',
    related: ['rapports-reglementaires-pharmacovigilance'],
    keywords: ['pharmacovigilance', 'signal'],
  }),
  make({
    id: 'assistant-pharma-conformite',
    title: 'Conformité réglementaire pharma',
    objective: 'Vérifier la conformité globale.',
    location: 'Assistant IA → Expert Pharma → Conformité',
    audience: audPharma,
    intro: 'Indicateurs de conformité et alertes.',
    keywords: ['conformité', 'réglementaire'],
  }),
];

// I. Comptable
const comptable: GuideArticle[] = [
  make({
    id: 'assistant-comptable-plan-comptable',
    title: 'Assistance plan comptable',
    objective: 'Aider à classer et créer les comptes SYSCOHADA.',
    location: 'Assistant IA → Expert Comptable → Plan Comptable',
    audience: audCompta,
    intro: 'Suggestions alignées sur SYSCOHADA 2025 Congo.',
    callouts: [{ type: 'info', text: 'Conformité SYSCOHADA 2025 Congo.' }],
    keywords: ['comptable', 'plan', 'SYSCOHADA'],
  }),
  make({
    id: 'assistant-comptable-ecritures',
    title: 'Suggestion d’écritures',
    objective: 'Proposer des écritures automatiques.',
    location: 'Assistant IA → Expert Comptable → Écritures',
    audience: audCompta,
    intro: 'Brouillons d’écritures à valider par le comptable.',
    keywords: ['écriture', 'journal'],
  }),
  make({
    id: 'assistant-comptable-anomalies',
    title: 'Anomalies comptables',
    objective: 'Identifier les écritures suspectes.',
    location: 'Assistant IA → Expert Comptable → Anomalies',
    audience: audCompta,
    intro: 'Détection automatique avec niveaux de sévérité.',
    related: ['assistant-diagnostic-anomalies'],
    keywords: ['anomalie', 'audit'],
  }),
  make({
    id: 'assistant-comptable-fiscal',
    title: 'Assistance fiscale (G10 Congo)',
    objective: 'Préparer la déclaration G10.',
    location: 'Assistant IA → Expert Comptable → Fiscal',
    audience: audCompta,
    intro: 'Aide à la préparation de la déclaration mensuelle G n°10.',
    related: ['comptabilite-fiscal-declaration-g10'],
    keywords: ['fiscal', 'G10', 'TVA'],
  }),
  make({
    id: 'assistant-comptable-optimisation',
    title: 'Optimisation comptable',
    objective: 'Identifier les optimisations possibles.',
    location: 'Assistant IA → Expert Comptable → Optimisation',
    audience: audCompta,
    intro: 'Suggestions pour améliorer marges, rotation, trésorerie.',
    keywords: ['optimisation', 'marge'],
  }),
];

// J. BI IA
const bi: GuideArticle[] = [
  make({
    id: 'assistant-bi-pharma',
    title: 'Assistant BI et Pharma',
    objective: 'Interroger les données et obtenir des pistes d’analyse actionnables.',
    location: 'Assistant IA → BI / Pharma',
    audience: audAll,
    intro: 'Combine BI et expertise pharma pour répondre à des questions métier.',
    steps: [
      { title: 'Choisir le type de consultation', detail: 'BI, stock, ventes, comptabilité ou pharma.' },
      { title: 'Formuler une question précise', detail: 'Inclure période, produit, client ou indicateur.' },
      { title: 'Valider les recommandations', detail: 'Comparer la réponse aux données sources.' },
    ],
    callouts: [{ type: 'info', text: 'L’IA complète l’analyse humaine sans la remplacer.' }],
    bestPractices: ['Questions courtes et contextualisées.', 'Vérifier les données sources avant décision.'],
    faq: [{ q: 'Puis-je demander une analyse de rupture ?', a: 'Oui, indiquez produit, période ou famille.' }],
    keywords: ['assistant', 'IA', 'BI', 'pharma'],
  }),
  make({
    id: 'assistant-bi-predictif',
    title: 'BI Prédictif',
    objective: 'Exploiter les modèles prédictifs métier.',
    location: 'Assistant IA → BI → Prédictif',
    intro: 'Prévisions consolidées multi-domaines.',
    related: ['rapports-bi-predictif'],
    keywords: ['BI', 'prédictif'],
  }),
  make({
    id: 'assistant-bi-patterns',
    title: 'Patterns de comportement',
    objective: 'Détecter les schémas récurrents.',
    location: 'Assistant IA → BI → Patterns',
    intro: 'Analyse non supervisée des comportements clients et ventes.',
    keywords: ['pattern', 'comportement'],
  }),
  make({
    id: 'assistant-bi-segmentation',
    title: 'Segmentation clientèle',
    objective: 'Segmenter automatiquement les clients.',
    location: 'Assistant IA → BI → Segmentation',
    intro: 'Création de segments dynamiques.',
    keywords: ['segmentation', 'client'],
  }),
  make({
    id: 'assistant-bi-optimisation',
    title: 'Optimisation business',
    objective: 'Identifier les leviers d’optimisation.',
    location: 'Assistant IA → BI → Optimisation',
    intro: 'Recommandations chiffrées par axe.',
    keywords: ['optimisation', 'business'],
  }),
];

// K. Apprentissage
const apprentissage: GuideArticle[] = [
  make({
    id: 'assistant-apprentissage-modeles',
    title: 'Modèles entraînés',
    objective: 'Suivre les modèles d’apprentissage continu.',
    location: 'Assistant IA → Apprentissage → Modèles',
    audience: audAdmin,
    intro: 'Versionnage et statut des modèles (ai_learning_models).',
    keywords: ['apprentissage', 'modèle'],
  }),
  make({
    id: 'assistant-apprentissage-feedback',
    title: 'Feedback utilisateur',
    objective: 'Capitaliser sur le feedback utilisateur.',
    location: 'Assistant IA → Apprentissage → Feedback',
    intro: 'Boucle de réentraînement basée sur les retours.',
    keywords: ['feedback', 'apprentissage'],
  }),
  make({
    id: 'assistant-apprentissage-donnees',
    title: 'Données d’entraînement',
    objective: 'Gérer les jeux de données.',
    location: 'Assistant IA → Apprentissage → Données',
    audience: audAdmin,
    intro: 'Sources et qualité des données utilisées.',
    keywords: ['donnée', 'dataset'],
  }),
  make({
    id: 'assistant-apprentissage-performance',
    title: 'Performance des modèles',
    objective: 'Mesurer précision et dérive.',
    location: 'Assistant IA → Apprentissage → Performance',
    intro: 'Indicateurs d’accuracy et historique.',
    keywords: ['performance', 'accuracy'],
  }),
];

// L. Automatisation
const automatisation: GuideArticle[] = [
  make({
    id: 'assistant-automatisation-workflows',
    title: 'Workflows IA',
    objective: 'Construire des workflows automatisés.',
    location: 'Assistant IA → Automatisation → Workflows',
    audience: audGestion,
    intro: 'Triggers, conditions et actions configurables.',
    keywords: ['workflow', 'automatisation'],
  }),
  make({
    id: 'assistant-automatisation-executions',
    title: 'Historique d’exécutions',
    objective: 'Auditer les exécutions automatisées.',
    location: 'Assistant IA → Automatisation → Exécutions',
    intro: 'Statut, durée et logs des exécutions.',
    keywords: ['exécution', 'log'],
  }),
  make({
    id: 'assistant-automatisation-templates',
    title: 'Templates de workflows',
    objective: 'Démarrer à partir de modèles.',
    location: 'Assistant IA → Automatisation → Templates',
    intro: 'Bibliothèque de templates prêts à l’emploi.',
    keywords: ['template', 'modèle'],
  }),
  make({
    id: 'assistant-automatisation-config',
    title: 'Configuration des automatisations',
    objective: 'Régler limites et notifications.',
    location: 'Assistant IA → Automatisation → Configuration',
    audience: audAdmin,
    intro: 'Quotas, alertes et permissions.',
    keywords: ['configuration', 'automatisation'],
  }),
];

// M. Stocks IA
const stocks: GuideArticle[] = [
  make({
    id: 'assistant-stocks-vue-ensemble',
    title: 'Vue d’ensemble Stocks IA',
    objective: 'Présentation du moteur IA stock.',
    location: 'Assistant IA → Stocks IA',
    intro: 'Indicateurs et recommandations stock pilotés par IA.',
    callouts: [{ type: 'info', text: 'Convention libelle_produit respectée, données filtrées par tenant.' }],
    keywords: ['stock', 'IA'],
  }),
  make({
    id: 'assistant-stocks-predictions',
    title: 'Prédictions de rupture',
    objective: 'Anticiper les ruptures par produit.',
    location: 'Assistant IA → Stocks IA → Prédictions',
    intro: 'Probabilité de rupture et délai estimé.',
    related: ['assistant-previsions-stock', 'stock-alertes-rupture'],
    keywords: ['rupture', 'prédiction'],
  }),
  make({
    id: 'assistant-stocks-optimisation',
    title: 'Optimisation des niveaux',
    objective: 'Recommander Min/Max optimaux.',
    location: 'Assistant IA → Stocks IA → Optimisation',
    intro: 'Suggestions basées sur rotation et saisonnalité.',
    keywords: ['optimisation', 'min', 'max'],
  }),
  make({
    id: 'assistant-stocks-alertes',
    title: 'Alertes IA stock',
    objective: 'Recevoir les alertes intelligentes.',
    location: 'Assistant IA → Stocks IA → Alertes',
    intro: 'Alertes priorisées avec score de criticité.',
    keywords: ['alerte', 'stock'],
  }),
  make({
    id: 'assistant-stocks-config',
    title: 'Configuration moteur IA stock',
    objective: 'Régler horizons et seuils.',
    location: 'Assistant IA → Stocks IA → Configuration',
    audience: audAdmin,
    intro: 'Horizons de prédiction et tolérance d’alerte.',
    keywords: ['configuration', 'stock IA'],
  }),
];

// N. Intégrations
const integrations: GuideArticle[] = [
  make({
    id: 'assistant-integrations-connecteurs',
    title: 'Connecteurs IA',
    objective: 'Gérer les providers IA connectés.',
    location: 'Assistant IA → Intégrations → Connecteurs',
    audience: audAdmin,
    intro: 'Lovable AI Gateway et providers complémentaires.',
    keywords: ['connecteur', 'provider'],
  }),
  make({
    id: 'assistant-integrations-sources',
    title: 'Sources de données',
    objective: 'Configurer les sources alimentant l’IA.',
    location: 'Assistant IA → Intégrations → Sources',
    audience: audAdmin,
    intro: 'Tables, vues et flux externes.',
    keywords: ['source', 'donnée'],
  }),
  make({
    id: 'assistant-integrations-webhooks',
    title: 'Webhooks',
    objective: 'Émettre et recevoir des événements IA.',
    location: 'Assistant IA → Intégrations → Webhooks',
    audience: audAdmin,
    intro: 'Webhooks signés et limités par tenant.',
    keywords: ['webhook', 'événement'],
  }),
  make({
    id: 'assistant-integrations-logs',
    title: 'Logs & monitoring',
    objective: 'Surveiller les intégrations.',
    location: 'Assistant IA → Intégrations → Logs',
    audience: audAdmin,
    intro: 'Logs des appels et erreurs.',
    keywords: ['log', 'monitoring'],
  }),
];

// O. Configuration IA
const configuration: GuideArticle[] = [
  make({
    id: 'assistant-config-vue-ensemble',
    title: 'Vue d’ensemble configuration IA',
    objective: 'Centraliser les réglages IA.',
    location: 'Assistant IA → Configuration',
    audience: audAdmin,
    intro: 'Modèles, prompts, permissions et clés API.',
    keywords: ['configuration', 'IA'],
  }),
  make({
    id: 'assistant-config-modeles',
    title: 'Gestion des modèles',
    objective: 'Configurer la table ai_models.',
    location: 'Assistant IA → Configuration → Modèles',
    audience: audAdmin,
    intro: 'Identifier, max_tokens, temperature, statut.',
    keywords: ['modèle', 'ai_models'],
  }),
  make({
    id: 'assistant-config-system-prompts',
    title: 'System prompts',
    objective: 'Définir les prompts par modèle.',
    location: 'Assistant IA → Configuration → Prompts',
    audience: audAdmin,
    intro: 'Prompts contextualisés par usage.',
    related: ['assistant-chat-parametres'],
    keywords: ['prompt', 'système'],
  }),
  make({
    id: 'assistant-config-permissions',
    title: 'Permissions IA',
    objective: 'Contrôler l’accès aux modules IA.',
    location: 'Assistant IA → Configuration → Permissions',
    audience: audAdmin,
    intro: 'Liaison avec le RBAC PharmaSoft.',
    keywords: ['permission', 'RBAC'],
  }),
  make({
    id: 'assistant-config-cles-api',
    title: 'Clés API et secrets',
    objective: 'Gérer LOVABLE_API_KEY et autres secrets.',
    location: 'Assistant IA → Configuration → Clés API',
    audience: audAdmin,
    intro: 'Les clés restent côté serveur (Edge Functions).',
    callouts: [
      { type: 'warning', text: 'Ne jamais exposer les clés côté client.' },
      { type: 'info', text: 'JWT obligatoire et isolation tenant stricte.' },
    ],
    related: ['assistant-integrations-connecteurs'],
    keywords: ['clé', 'API', 'secret'],
  }),
];

const sections: GuideSection[] = [
  { id: 'assistant-pilotage', title: 'Pilotage IA', icon: LayoutDashboard, articles: pilotage },
  { id: 'assistant-chat', title: 'Chat conversationnel', icon: MessageSquare, articles: chat },
  { id: 'assistant-diagnostic', title: 'Diagnostic intelligent', icon: Stethoscope, articles: diagnostic },
  { id: 'assistant-recommandations', title: 'Recommandations stratégiques', icon: Lightbulb, articles: recommandations },
  { id: 'assistant-previsions', title: 'Prévisions avancées', icon: TrendingUp, articles: previsions },
  { id: 'assistant-sentiment', title: 'Analyse de sentiment', icon: Smile, articles: sentiment },
  { id: 'assistant-vision', title: 'Vision par ordinateur', icon: Eye, articles: vision },
  { id: 'assistant-pharma', title: 'Expert Pharmaceutique', icon: Pill, articles: pharma },
  { id: 'assistant-comptable', title: 'Expert Comptable', icon: Calculator, articles: comptable },
  { id: 'assistant-bi', title: 'Business Intelligence IA', icon: BarChart3, articles: bi },
  { id: 'assistant-apprentissage', title: 'Apprentissage continu', icon: GraduationCap, articles: apprentissage },
  { id: 'assistant-automatisation', title: 'Automatisation IA', icon: Workflow, articles: automatisation },
  { id: 'assistant-stocks', title: 'Stocks IA', icon: Boxes, articles: stocks },
  { id: 'assistant-integrations', title: 'Intégrations IA', icon: Plug, articles: integrations },
  { id: 'assistant-configuration', title: 'Configuration IA', icon: Settings2, articles: configuration },
];

export const assistantModule: GuideModule = {
  id: 'assistant',
  title: 'Assistant IA',
  tagline: 'Exploiter l’IA pour l’aide décisionnelle, les anomalies et l’analyse métier.',
  description:
    'Le module Assistant IA couvre 15 sous-modules : pilotage, chat, diagnostic, recommandations, prévisions, sentiment, vision, expertises pharma et comptable, BI, apprentissage, automatisation, stocks IA, intégrations et configuration.',
  icon: Bot,
  accent: 'secondary',
  sections,
};
