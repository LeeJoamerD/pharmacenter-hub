import {
  BarChart3,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Landmark,
  Users,
  Brain,
  ShieldCheck,
  MapPin,
  Smartphone,
  Sparkles,
  Wrench,
  GitCompare,
  Settings2,
} from 'lucide-react';
import type { GuideModule, GuideArticle, GuideCallout } from '../types';

// ---------------------------------------------------------------------------
// Audiences réutilisables
// ---------------------------------------------------------------------------
const audPilotage = ['Administrateurs', 'Pharmacien Titulaire', 'Gestionnaires'];
const audOps = ['Pharmacien Titulaire', 'Gestionnaires', 'Comptables'];
const audReg = ['Pharmacien Titulaire', 'Administrateurs'];
const audBI = ['Administrateurs', 'Pharmacien Titulaire', 'Analystes BI'];
const audAdmin = ['Administrateurs'];

// ---------------------------------------------------------------------------
// Helper: makeArticle — applique des valeurs par défaut sûres
// ---------------------------------------------------------------------------
type ArticleInput = Partial<GuideArticle> &
  Pick<GuideArticle, 'id' | 'title' | 'objective' | 'intro'>;

const makeArticle = (a: ArticleInput): GuideArticle => ({
  location: a.location,
  audience: a.audience ?? audPilotage,
  steps: a.steps ?? [],
  callouts: a.callouts ?? [],
  bestPractices: a.bestPractices ?? [],
  faq: a.faq ?? [],
  related: a.related ?? [],
  keywords: a.keywords ?? [],
  ...a,
});

// ---------------------------------------------------------------------------
// A. Pilotage et accueil Rapports
// ---------------------------------------------------------------------------
const pilotage: GuideArticle[] = [
  makeArticle({
    id: 'rapports-dashboard-vue-ensemble',
    title: "Comprendre l'accueil du module Rapports",
    objective: 'Identifier les KPI globaux et la structure du centre de reporting.',
    location: 'Rapports → Tableau de bord',
    audience: audPilotage,
    intro:
      "L'accueil Rapports synthétise l'activité de la pharmacie sous forme d'indicateurs clés et de raccourcis vers les 12 modules de reporting.",
    steps: [
      { title: 'Choisir la période', detail: 'Jour, semaine, mois, trimestre ou année.' },
      { title: 'Lire les KPI globaux', detail: 'Ventes, marges, stock critique, alertes.' },
      { title: 'Ouvrir un module', detail: 'Cliquez sur la carte du module ciblé.' },
    ],
    callouts: [
      { type: 'info', text: "La visibilité du dashboard est contrôlée par useDashboardVisibility (permission dashboard.view)." },
      { type: 'warning', text: "Si la permission Dashboard est désactivée, l'accueil Rapports est masqué par défaut." },
    ],
    bestPractices: [
      'Vérifier la cohérence entre KPI globaux et rapports détaillés.',
      'Limiter la période pour accélérer le chargement initial.',
    ],
    related: ['rapports-dashboard-modules', 'rapports-configuration-permissions'],
    keywords: ['dashboard', 'rapports', 'KPI', 'période', 'indicateur'],
  }),
  makeArticle({
    id: 'rapports-dashboard-modules',
    title: 'Naviguer parmi les modules de rapports',
    objective: 'Atteindre rapidement le module de reporting recherché.',
    location: 'Rapports → Tableau de bord → Modules',
    intro: 'Les 12 modules de rapports sont accessibles depuis l’accueil avec un compteur dynamique.',
    steps: [
      { title: 'Repérer les compteurs', detail: 'Chaque carte affiche le nombre de rapports disponibles.' },
      { title: 'Filtrer visuellement', detail: 'Identifiez les modules opérationnels et spécialisés.' },
      { title: 'Ouvrir le module', detail: 'Un clic redirige vers la sous-section correspondante.' },
    ],
    related: ['rapports-dashboard-vue-ensemble'],
    keywords: ['modules', 'navigation', 'rapports'],
  }),
  makeArticle({
    id: 'rapports-dashboard-recents',
    title: 'Consulter les rapports récents',
    objective: 'Retrouver rapidement les derniers rapports générés.',
    location: 'Rapports → Tableau de bord → Récents',
    intro: 'La liste des rapports récents affiche statut, date, format et auteur.',
    steps: [
      { title: 'Ouvrir la liste', detail: 'Section « Rapports récents ».' },
      { title: 'Filtrer par format', detail: 'PDF, Excel, image.' },
      { title: 'Rouvrir un rapport', detail: 'Cliquez sur l’entrée pour le télécharger à nouveau.' },
    ],
    related: ['rapports-dashboard-favoris'],
    keywords: ['récents', 'historique', 'rapports'],
  }),
  makeArticle({
    id: 'rapports-dashboard-favoris',
    title: 'Gérer les rapports favoris',
    objective: 'Marquer les rapports utilisés régulièrement pour y accéder en un clic.',
    location: 'Rapports → Tableau de bord → Favoris',
    intro: 'Les favoris permettent de capitaliser sur les rapports les plus consultés.',
    steps: [
      { title: 'Ajouter aux favoris', detail: 'Cliquez sur l’étoile depuis n’importe quel rapport.' },
      { title: 'Réorganiser', detail: 'Glissez-déposez l’ordre d’affichage.' },
      { title: 'Retirer un favori', detail: 'Désélectionnez l’étoile.' },
    ],
    related: ['rapports-dashboard-recents'],
    keywords: ['favoris', 'raccourcis', 'rapports'],
  }),
  makeArticle({
    id: 'rapports-dashboard-actualisation',
    title: 'Actualiser les données et changer la période',
    objective: 'Maintenir des indicateurs à jour selon la fenêtre temporelle choisie.',
    location: 'Rapports → Tableau de bord',
    intro: 'Le sélecteur de période recalcule les KPI à la volée.',
    steps: [
      { title: 'Choisir la période', detail: 'Jour, semaine, mois, trimestre, année.' },
      { title: 'Forcer l’actualisation', detail: 'Bouton « Actualiser ».' },
      { title: 'Comparer dans le temps', detail: 'Utilisez les rapports comparatifs si nécessaire.' },
    ],
    related: ['rapports-comparatifs-temporel'],
    keywords: ['période', 'actualisation', 'KPI'],
  }),
];

// ---------------------------------------------------------------------------
// B. Rapports Ventes
// ---------------------------------------------------------------------------
const ventes: GuideArticle[] = [
  makeArticle({
    id: 'rapports-ventes-vue-ensemble',
    title: "Vue d'ensemble des rapports Ventes",
    objective: 'Lire les KPI commerciaux principaux et appliquer des filtres.',
    location: 'Rapports → Ventes',
    audience: audOps,
    intro: 'Les KPI ventes couvrent CA, transactions, panier moyen et clients uniques.',
    steps: [
      { title: 'Choisir la période', detail: 'Jour à année.' },
      { title: 'Filtrer par catégorie', detail: 'Médicaments, parapharmacie, médical.' },
      { title: 'Lire les variations', detail: 'Comparez les évolutions affichées par KPI.' },
    ],
    related: ['rapports-ventes-evolution', 'rapports-ventes-produits'],
    keywords: ['ventes', 'CA', 'panier moyen', 'KPI'],
  }),
  makeArticle({
    id: 'rapports-ventes-evolution',
    title: 'Analyser l’évolution des ventes',
    objective: 'Comparer ventes réalisées et objectifs sur la période.',
    location: 'Rapports → Ventes → Évolution',
    audience: audOps,
    intro: 'Le graphique Évolution superpose ventes et objectifs avec le nombre de transactions.',
    steps: [
      { title: 'Ouvrir l’onglet Évolution', detail: '' },
      { title: 'Survoler la courbe', detail: 'Détails par jour ou par mois.' },
      { title: 'Identifier les écarts', detail: 'Repérez les jours sous l’objectif.' },
    ],
    related: ['rapports-ventes-vue-ensemble', 'rapports-comparatifs-temporel'],
    keywords: ['évolution', 'objectifs', 'ventes'],
  }),
  makeArticle({
    id: 'rapports-ventes-produits',
    title: 'Top produits et marges',
    objective: 'Identifier les meilleurs produits en CA, quantité et marge.',
    location: 'Rapports → Ventes → Produits',
    audience: audOps,
    intro: 'L’onglet Produits classe les ventes par libelle_produit avec marge associée.',
    steps: [
      { title: 'Trier par CA, quantité ou marge', detail: '' },
      { title: 'Exporter le top', detail: 'PDF ou Excel.' },
    ],
    callouts: [{ type: 'info', text: "Les libellés respectent la convention 'libelle_produit'." }],
    related: ['rapports-ventes-categories'],
    keywords: ['produits', 'top', 'marge', 'ventes'],
  }),
  makeArticle({
    id: 'rapports-ventes-equipe',
    title: 'Performance de l’équipe',
    objective: 'Comparer la performance commerciale du personnel.',
    location: 'Rapports → Ventes → Équipe',
    audience: audOps,
    intro: 'L’onglet Équipe affiche ventes, transactions, ticket moyen et indice de performance par membre.',
    steps: [
      { title: 'Sélectionner la période', detail: '' },
      { title: 'Comparer les vendeurs', detail: 'Identifiez forces et axes d’amélioration.' },
    ],
    related: ['rapports-comparatifs-agents'],
    keywords: ['équipe', 'staff', 'performance', 'ventes'],
  }),
  makeArticle({
    id: 'rapports-ventes-categories',
    title: 'Répartition par catégories',
    objective: 'Visualiser la répartition du CA entre familles de produits.',
    location: 'Rapports → Ventes → Catégories',
    audience: audOps,
    intro: 'Le graphique en parts montre la contribution de chaque famille au CA total.',
    steps: [{ title: 'Lire les pourcentages', detail: 'Survol pour afficher la valeur exacte.' }],
    related: ['rapports-ventes-produits'],
    keywords: ['catégories', 'familles', 'ventes'],
  }),
  makeArticle({
    id: 'rapports-ventes-export',
    title: 'Exporter les rapports Ventes',
    objective: 'Produire un export PDF ou Excel des rapports ventes.',
    location: 'Rapports → Ventes',
    audience: audOps,
    intro: 'L’export utilise les standards jsPDF / Excel du projet et respecte la devise du tenant.',
    steps: [
      { title: 'Choisir le format', detail: 'PDF ou Excel.' },
      { title: 'Lancer l’export', detail: 'Le fichier est téléchargé directement.' },
    ],
    callouts: [{ type: 'info', text: "Les montants en FCFA suivent l'arrondi standard via Math.round." }],
    related: ['rapports-generateur-export'],
    keywords: ['export', 'PDF', 'Excel', 'ventes'],
  }),
];

// ---------------------------------------------------------------------------
// C. Rapports Stock
// ---------------------------------------------------------------------------
const stock: GuideArticle[] = [
  makeArticle({
    id: 'rapports-stock-vue-ensemble',
    title: "Vue d'ensemble des rapports Stock",
    objective: 'Lire les KPI de pilotage du stock.',
    location: 'Rapports → Stock',
    audience: audOps,
    intro: 'Les KPI stock présentent valorisation, ruptures, péremptions et taux de rotation.',
    steps: [
      { title: 'Choisir la période', detail: 'Semaine, mois, trimestre.' },
      { title: 'Filtrer par catégorie', detail: 'Médicaments, parapharmacie, médical.' },
    ],
    related: ['rapports-stock-niveaux', 'rapports-stock-alertes'],
    keywords: ['stock', 'KPI', 'valorisation', 'rotation'],
  }),
  makeArticle({
    id: 'rapports-stock-niveaux',
    title: 'Niveaux de stock par catégorie',
    objective: 'Évaluer la santé du stock par famille.',
    location: 'Rapports → Stock → Niveaux Stock',
    audience: audOps,
    intro: 'Le tableau affiche stock actuel, seuils critiques, faibles, normaux et surstock.',
    steps: [{ title: 'Trier par valorisation ou statut', detail: '' }],
    related: ['rapports-stock-alertes'],
    keywords: ['niveaux', 'stock', 'catégories'],
  }),
  makeArticle({
    id: 'rapports-stock-alertes',
    title: 'Alertes critiques et attention',
    objective: 'Identifier les produits à réapprovisionner en priorité.',
    location: 'Rapports → Stock → Alertes',
    audience: audOps,
    intro: 'Les alertes regroupent les produits en statut critique ou attention.',
    steps: [
      { title: 'Filtrer par urgence', detail: 'Critique d’abord.' },
      { title: 'Lancer une commande', detail: 'Depuis le module Approvisionnement.' },
    ],
    related: ['rapports-stock-peremptions'],
    keywords: ['alertes', 'rupture', 'critique'],
  }),
  makeArticle({
    id: 'rapports-stock-peremptions',
    title: 'Surveiller les péremptions',
    objective: 'Anticiper les pertes liées à la date d’expiration.',
    location: 'Rapports → Stock → Péremptions',
    audience: audOps,
    intro: 'L’onglet liste les lots avec jours restants et niveau d’urgence.',
    steps: [
      { title: 'Filtrer par urgence', detail: 'Urgent / attention / normal.' },
      { title: 'Planifier les actions', detail: 'Promotions, retours fournisseurs ou destruction.' },
    ],
    callouts: [{ type: 'warning', text: 'Les lots expirés doivent être retirés du stock vendable.' }],
    related: ['rapports-stock-mouvements'],
    keywords: ['péremption', 'lots', 'expiration'],
  }),
  makeArticle({
    id: 'rapports-stock-mouvements',
    title: 'Historique des mouvements de stock',
    objective: 'Analyser entrées, sorties, solde et valorisation.',
    location: 'Rapports → Stock → Mouvements',
    audience: audOps,
    intro: 'Le tableau retrace les flux de stock dans le temps avec valorisation cumulée.',
    steps: [{ title: 'Choisir la période', detail: '' }],
    related: ['rapports-stock-vue-ensemble'],
    keywords: ['mouvements', 'entrées', 'sorties', 'stock'],
  }),
  makeArticle({
    id: 'rapports-stock-export',
    title: 'Exporter et imprimer les rapports Stock',
    objective: 'Générer un export PDF ou Excel des indicateurs de stock.',
    location: 'Rapports → Stock',
    audience: audOps,
    intro: 'Les exports respectent le format régional et la devise du tenant.',
    steps: [{ title: 'Choisir le format', detail: 'PDF ou Excel.' }],
    related: ['rapports-generateur-export'],
    keywords: ['export', 'stock', 'PDF', 'Excel'],
  }),
];

// ---------------------------------------------------------------------------
// D. Rapports Financiers
// ---------------------------------------------------------------------------
const financierCallout: GuideCallout = {
  type: 'info',
  text: 'Les données sont alignées sur le module Comptabilité SYSCOHADA 2025 Congo.',
};

const financier: GuideArticle[] = [
  makeArticle({
    id: 'rapports-financier-vue-ensemble',
    title: 'Vue financière OHADA',
    objective: 'Comprendre les indicateurs financiers globaux.',
    location: 'Rapports → Financiers',
    audience: audOps,
    intro: 'Le tableau financier consolide bilan, résultat, flux de trésorerie et ratios.',
    callouts: [financierCallout],
    related: ['rapports-financier-bilan', 'rapports-financier-resultat'],
    keywords: ['financier', 'OHADA', 'KPI'],
  }),
  makeArticle({
    id: 'rapports-financier-bilan',
    title: 'Lire le bilan',
    objective: 'Analyser actif et passif sur l’exercice.',
    location: 'Rapports → Financiers → Bilan',
    audience: audOps,
    intro: 'Le bilan synthétise la situation patrimoniale.',
    callouts: [financierCallout],
    related: ['comptabilite-rapports-bilan'],
    keywords: ['bilan', 'actif', 'passif', 'OHADA'],
  }),
  makeArticle({
    id: 'rapports-financier-resultat',
    title: 'Compte de résultat',
    objective: 'Mesurer la performance économique.',
    location: 'Rapports → Financiers → Compte de Résultat',
    audience: audOps,
    intro: 'Produits et charges aboutissent au résultat net.',
    related: ['rapports-financier-flux'],
    keywords: ['résultat', 'produits', 'charges'],
  }),
  makeArticle({
    id: 'rapports-financier-flux',
    title: 'Flux de trésorerie',
    objective: 'Comprendre la variation de trésorerie.',
    location: 'Rapports → Financiers → Flux de Trésorerie',
    audience: audOps,
    intro: 'Activité, investissement et financement composent la variation.',
    related: ['rapports-financier-resultat'],
    keywords: ['flux', 'trésorerie', 'cash-flow'],
  }),
  makeArticle({
    id: 'rapports-financier-ratios',
    title: 'Ratios financiers',
    objective: 'Évaluer rentabilité, liquidité et solvabilité.',
    location: 'Rapports → Financiers → Ratios',
    audience: audOps,
    intro: 'Les ratios facilitent la lecture comparative.',
    related: ['rapports-financier-bilan'],
    keywords: ['ratios', 'liquidité', 'solvabilité'],
  }),
  makeArticle({
    id: 'rapports-financier-annexes',
    title: 'États annexes',
    objective: 'Compléter les états financiers principaux.',
    location: 'Rapports → Financiers → États Annexes',
    audience: audOps,
    intro: 'Annexes sur amortissements, provisions, créances et dettes.',
    related: ['comptabilite-rapports-annexes'],
    keywords: ['annexes', 'amortissement', 'provisions'],
  }),
  makeArticle({
    id: 'rapports-financier-graphiques',
    title: 'Graphiques financiers',
    objective: 'Visualiser graphiquement les principales tendances.',
    location: 'Rapports → Financiers → Graphiques',
    audience: audOps,
    intro: 'Les graphiques résument l’évolution des grandeurs financières.',
    keywords: ['graphique', 'financier', 'visualisation'],
  }),
];

// ---------------------------------------------------------------------------
// E. Rapports Clients
// ---------------------------------------------------------------------------
const clients: GuideArticle[] = [
  makeArticle({
    id: 'rapports-clients-vue-ensemble',
    title: "Vue d'ensemble Clients",
    objective: 'Suivre la base clients et son évolution.',
    location: 'Rapports → Clients',
    audience: audOps,
    intro: 'Indicateurs globaux : actifs, nouveaux, inactifs, panier moyen.',
    related: ['rapports-clients-segmentation'],
    keywords: ['clients', 'KPI'],
  }),
  makeArticle({
    id: 'rapports-clients-segmentation',
    title: 'Segmentation clients',
    objective: 'Découper la clientèle en segments exploitables.',
    location: 'Rapports → Clients → Segmentation',
    audience: audOps,
    intro: 'La segmentation s’appuie sur le comportement d’achat.',
    related: ['rapports-clients-fidelisation'],
    keywords: ['segmentation', 'clients'],
  }),
  makeArticle({
    id: 'rapports-clients-comportement',
    title: 'Comportement d’achat',
    objective: 'Analyser fréquence, panier et préférences.',
    location: 'Rapports → Clients → Comportement',
    audience: audOps,
    intro: 'Les indicateurs comportementaux orientent les actions marketing.',
    keywords: ['comportement', 'achats', 'clients'],
  }),
  makeArticle({
    id: 'rapports-clients-fidelisation',
    title: 'Programme de fidélisation',
    objective: 'Suivre les paliers Bronze, Silver, Gold, Platinum.',
    location: 'Rapports → Clients → Fidélisation',
    audience: audOps,
    intro: 'L’onglet présente la répartition par palier et les conversions.',
    related: ['rapports-clients-segmentation'],
    keywords: ['fidélité', 'paliers', 'clients'],
  }),
  makeArticle({
    id: 'rapports-clients-assurances',
    title: 'Suivi des assurances clients',
    objective: 'Piloter conventions et couvertures.',
    location: 'Rapports → Clients → Assurances',
    audience: audOps,
    intro: 'L’onglet Assurances suit les couvertures actives, en attente et expirées.',
    callouts: [{ type: 'info', text: 'Le système gère les taux Agent et Ayant Droit pour la couverture assurance.' }],
    related: ['comptabilite-factures-assureurs'],
    keywords: ['assurance', 'convention', 'clients'],
  }),
];

// ---------------------------------------------------------------------------
// F. Business Intelligence
// ---------------------------------------------------------------------------
const bi: GuideArticle[] = [
  makeArticle({
    id: 'rapports-bi-vue-ensemble',
    title: 'Vue d’ensemble Business Intelligence',
    objective: 'Comprendre la consolidation des données pour le BI.',
    location: 'Rapports → BI',
    audience: audBI,
    intro: 'Le BI agrège ventes, stock, clients et finances pour une lecture stratégique.',
    related: ['rapports-bi-dashboard'],
    keywords: ['BI', 'décisionnel'],
  }),
  makeArticle({
    id: 'rapports-bi-dashboard',
    title: 'Dashboard BI',
    objective: 'Lire les KPI consolidés multi-modules.',
    location: 'Rapports → BI → Dashboard',
    audience: audBI,
    intro: 'Le dashboard BI consolide les indicateurs clés.',
    keywords: ['BI', 'dashboard', 'KPI'],
  }),
  makeArticle({
    id: 'rapports-bi-predictif',
    title: 'Analyses prédictives',
    objective: 'Anticiper les tendances futures.',
    location: 'Rapports → BI → Prédictif',
    audience: audBI,
    intro: 'Les analyses prédictives s’appuient sur l’historique consolidé.',
    related: ['rapports-ia-predictions'],
    keywords: ['prédictif', 'BI', 'tendance'],
  }),
  makeArticle({
    id: 'rapports-bi-benchmarks',
    title: 'Benchmarks comparatifs',
    objective: 'Comparer la performance à des références sectorielles.',
    location: 'Rapports → BI → Benchmarks',
    audience: audBI,
    intro: 'Les benchmarks situent l’officine dans son écosystème.',
    keywords: ['benchmark', 'comparaison', 'BI'],
  }),
  makeArticle({
    id: 'rapports-bi-alertes',
    title: 'Alertes BI',
    objective: 'Réagir aux signaux faibles détectés par le BI.',
    location: 'Rapports → BI → Alertes',
    audience: audBI,
    intro: 'Les alertes BI mettent en avant les écarts significatifs.',
    keywords: ['BI', 'alerte', 'signal'],
  }),
];

// ---------------------------------------------------------------------------
// G. Rapports Réglementaires
// ---------------------------------------------------------------------------
const reglementaires: GuideArticle[] = [
  makeArticle({
    id: 'rapports-reglementaires-vue-ensemble',
    title: 'Pilotage réglementaire',
    objective: 'Centraliser les obligations réglementaires.',
    location: 'Rapports → Réglementaire',
    audience: audReg,
    intro: 'Le module regroupe stupéfiants, traçabilité, pharmacovigilance, conformité.',
    related: ['rapports-reglementaires-stupefiants'],
    keywords: ['réglementaire', 'conformité'],
  }),
  makeArticle({
    id: 'rapports-reglementaires-stupefiants',
    title: 'Registre des stupéfiants',
    objective: 'Suivre les mouvements réglementés avec une traçabilité stricte.',
    location: 'Rapports → Réglementaire → Stupéfiants',
    audience: audReg,
    intro:
      "Le registre des stupéfiants centralise entrées, sorties et soldes avec calcul avant/après et piste d'audit immuable.",
    steps: [
      { title: 'Sélectionner la période', detail: 'Filtrez par date et produit.' },
      { title: 'Contrôler les mouvements', detail: 'Origine, destination, quantité, soldes avant/après.' },
      { title: 'Exporter', detail: 'Générez l’état réglementaire pour contrôle.' },
    ],
    callouts: [
      { type: 'warning', text: "Le registre est immuable : aucun mouvement passé ne peut être modifié, seule une correction tracée est possible." },
      { type: 'info', text: 'Chaque écriture conserve les soldes calculés avant et après le mouvement.' },
    ],
    bestPractices: [
      'Contrôler les soldes après chaque mouvement sensible.',
      'Limiter les droits d’accès à ce rapport.',
    ],
    faq: [
      { q: 'Peut-on modifier l’historique ?', a: 'Non, la piste d’audit est immuable.' },
    ],
    related: ['rapports-reglementaires-tracabilite', 'rapports-reglementaires-conformite'],
    keywords: ['stupéfiants', 'registre', 'audit', 'réglementaire'],
  }),
  makeArticle({
    id: 'rapports-reglementaires-tracabilite',
    title: 'Traçabilité des lots',
    objective: 'Retracer le parcours d’un lot du fournisseur à la sortie.',
    location: 'Rapports → Réglementaire → Traçabilité',
    audience: audReg,
    intro: 'L’onglet retrace lots, mouvements et sorties.',
    related: ['rapports-stock-mouvements'],
    keywords: ['traçabilité', 'lots'],
  }),
  makeArticle({
    id: 'rapports-reglementaires-pharmacovigilance',
    title: 'Pharmacovigilance',
    objective: 'Suivre les déclarations d’effets indésirables.',
    location: 'Rapports → Réglementaire → Pharmacovigilance',
    audience: audReg,
    intro: 'Le module suit les déclarations et leur statut.',
    keywords: ['pharmacovigilance', 'déclaration'],
  }),
  makeArticle({
    id: 'rapports-reglementaires-rapports-obligatoires',
    title: 'Rapports obligatoires',
    objective: 'Produire les états exigés par la réglementation.',
    location: 'Rapports → Réglementaire → Rapports',
    audience: audReg,
    intro: 'L’onglet centralise les rapports périodiques obligatoires.',
    keywords: ['obligatoire', 'rapport', 'réglementaire'],
  }),
  makeArticle({
    id: 'rapports-reglementaires-conformite',
    title: 'Score de conformité',
    objective: 'Évaluer la conformité réglementaire.',
    location: 'Rapports → Réglementaire → Conformité',
    audience: audReg,
    intro: 'Un score global et des contrôles ciblés guident les corrections.',
    keywords: ['conformité', 'score', 'contrôle'],
  }),
];

// ---------------------------------------------------------------------------
// H. Rapports Géospatial
// ---------------------------------------------------------------------------
const geospatial: GuideArticle[] = [
  makeArticle({
    id: 'rapports-geospatial-vue-ensemble',
    title: 'Vue d’ensemble Géospatial',
    objective: 'Visualiser géographiquement l’activité.',
    location: 'Rapports → Géospatial',
    audience: audPilotage,
    intro: 'Le module Géospatial cartographie clients, livraisons et zones.',
    related: ['rapports-geospatial-cartographie'],
    keywords: ['géospatial', 'carte'],
  }),
  makeArticle({
    id: 'rapports-geospatial-cartographie',
    title: 'Cartographie',
    objective: 'Localiser les points d’intérêt sur la carte.',
    location: 'Rapports → Géospatial → Cartographie',
    intro: 'La carte interactive affiche clients, livraisons et zones.',
    keywords: ['cartographie', 'géospatial'],
  }),
  makeArticle({
    id: 'rapports-geospatial-zones',
    title: 'Zones de chalandise',
    objective: 'Définir les zones d’influence commerciale.',
    location: 'Rapports → Géospatial → Zones',
    intro: 'Les zones permettent d’analyser l’attractivité.',
    keywords: ['zones', 'chalandise'],
  }),
  makeArticle({
    id: 'rapports-geospatial-routes',
    title: 'Routes et tournées',
    objective: 'Optimiser les déplacements et livraisons.',
    location: 'Rapports → Géospatial → Routes',
    intro: 'L’onglet Routes propose des itinéraires de tournée.',
    related: ['rapports-geospatial-optimisation'],
    keywords: ['routes', 'tournée'],
  }),
  makeArticle({
    id: 'rapports-geospatial-chalandise',
    title: 'Chalandise détaillée',
    objective: 'Analyser la performance par zone.',
    location: 'Rapports → Géospatial → Chalandise',
    intro: 'La chalandise détaille les ventes par zone géographique.',
    keywords: ['chalandise', 'zone', 'ventes'],
  }),
  makeArticle({
    id: 'rapports-geospatial-optimisation',
    title: 'Optimisation géospatiale',
    objective: 'Améliorer itinéraires et zones.',
    location: 'Rapports → Géospatial → Optimisation',
    intro: 'Suggestions d’optimisation pour zones et itinéraires.',
    keywords: ['optimisation', 'géospatial'],
  }),
];

// ---------------------------------------------------------------------------
// I. Rapports Mobile
// ---------------------------------------------------------------------------
const mobileCallout: GuideCallout = {
  type: 'info',
  text: 'La PWA priorise le module POS et utilise un cache de 30 Mo.',
};

const mobile: GuideArticle[] = [
  makeArticle({
    id: 'rapports-mobile-vue-ensemble',
    title: 'KPI Mobile',
    objective: 'Suivre l’usage mobile de l’application.',
    location: 'Rapports → Mobile',
    intro: 'Indicateurs : utilisateurs, sessions, consultations, notifications.',
    callouts: [mobileCallout],
    related: ['rapports-mobile-notifications'],
    keywords: ['mobile', 'PWA', 'KPI'],
  }),
  makeArticle({
    id: 'rapports-mobile-notifications',
    title: 'Notifications push',
    objective: 'Mesurer l’efficacité des notifications.',
    location: 'Rapports → Mobile → Notifications',
    intro: 'L’onglet expose les volumes et taux d’ouverture.',
    keywords: ['notifications', 'push', 'mobile'],
  }),
  makeArticle({
    id: 'rapports-mobile-synchronisation',
    title: 'Synchronisation online / offline',
    objective: 'Vérifier la santé de la synchronisation hors-ligne.',
    location: 'Rapports → Mobile → Synchronisation',
    intro: 'Les indicateurs montrent les sync réussies, en attente ou en erreur.',
    callouts: [mobileCallout],
    keywords: ['sync', 'offline', 'PWA'],
  }),
  makeArticle({
    id: 'rapports-mobile-configuration',
    title: 'Configuration PWA',
    objective: 'Régler notifications et mode hors-ligne.',
    location: 'Rapports → Mobile → Configuration',
    intro: 'Réglages PWA : notifications et cache.',
    keywords: ['configuration', 'PWA', 'mobile'],
  }),
];

// ---------------------------------------------------------------------------
// J. Rapports IA et Prédictif
// ---------------------------------------------------------------------------
const ia: GuideArticle[] = [
  makeArticle({
    id: 'rapports-ia-vue-ensemble',
    title: 'Vue d’ensemble Rapports IA',
    objective: 'Comprendre les rapports propulsés par l’IA.',
    location: 'Rapports → IA',
    audience: audBI,
    intro: 'Les rapports IA exploitent prédictions, métriques ML et insights.',
    related: ['rapports-ia-predictions'],
    keywords: ['IA', 'ML', 'prédictif'],
  }),
  makeArticle({
    id: 'rapports-ia-predictions',
    title: 'Prédictions',
    objective: 'Anticiper ventes, ruptures et besoins.',
    location: 'Rapports → IA → Prédictions',
    audience: audBI,
    intro: 'L’onglet Prédictions affiche les projections et leur fiabilité.',
    keywords: ['prédictions', 'IA'],
  }),
  makeArticle({
    id: 'rapports-ia-temps-reel',
    title: 'Suivi temps réel',
    objective: 'Visualiser l’activité en quasi temps réel.',
    location: 'Rapports → IA → Temps Réel',
    audience: audBI,
    intro: 'Indicateurs en temps réel pour réagir rapidement.',
    keywords: ['temps réel', 'IA'],
  }),
  makeArticle({
    id: 'rapports-ia-metriques-ml',
    title: 'Métriques ML',
    objective: 'Surveiller la performance des modèles.',
    location: 'Rapports → IA → Métriques ML',
    audience: audBI,
    intro: 'Précision, rappel, F1 et drift des modèles ML.',
    keywords: ['ML', 'métriques', 'modèle'],
  }),
  makeArticle({
    id: 'rapports-ia-modeles',
    title: 'Modèles déployés',
    objective: 'Lister et superviser les modèles en production.',
    location: 'Rapports → IA → Modèles',
    audience: audBI,
    intro: 'Le catalogue des modèles déployés avec version et statut.',
    keywords: ['modèles', 'IA', 'déploiement'],
  }),
  makeArticle({
    id: 'rapports-ia-insights',
    title: 'Insights stratégiques',
    objective: 'Exploiter les insights générés par l’IA.',
    location: 'Rapports → IA → Insights',
    audience: audBI,
    intro: 'Les insights mettent en avant des opportunités et risques.',
    keywords: ['insights', 'IA', 'stratégie'],
  }),
];

// ---------------------------------------------------------------------------
// K. Générateur de rapports
// ---------------------------------------------------------------------------
const generateur: GuideArticle[] = [
  makeArticle({
    id: 'rapports-generateur-vue-ensemble',
    title: 'Construire un rapport personnalisé',
    objective: 'Découvrir le Report Builder.',
    location: 'Rapports → Générateur',
    audience: audPilotage,
    intro: 'Le Report Builder permet de combiner sources, champs et graphiques.',
    related: ['rapports-generateur-source-donnees'],
    keywords: ['générateur', 'builder', 'rapport'],
  }),
  makeArticle({
    id: 'rapports-generateur-source-donnees',
    title: 'Choisir une source de données',
    objective: 'Sélectionner Ventes, Stock, Clients, Personnel ou Financier.',
    location: 'Rapports → Générateur → Source',
    audience: audPilotage,
    intro: 'La source détermine les champs disponibles.',
    callouts: [{ type: 'info', text: "Le générateur respecte la convention 'libelle_produit'." }],
    related: ['rapports-generateur-champs-graphiques'],
    keywords: ['source', 'données', 'générateur'],
  }),
  makeArticle({
    id: 'rapports-generateur-champs-graphiques',
    title: 'Champs et graphiques',
    objective: 'Configurer les colonnes et la visualisation.',
    location: 'Rapports → Générateur → Champs',
    audience: audPilotage,
    intro: 'Choisissez champs, type de graphique (bar, line, pie, table) et filtres.',
    related: ['rapports-generateur-prevoir-sauvegarder'],
    keywords: ['champs', 'graphiques', 'générateur'],
  }),
  makeArticle({
    id: 'rapports-generateur-prevoir-sauvegarder',
    title: 'Aperçu, sauvegarde et exécution',
    objective: 'Tester le rapport puis le sauvegarder.',
    location: 'Rapports → Générateur → Aperçu',
    audience: audPilotage,
    intro: 'L’aperçu valide la configuration avant exécution.',
    related: ['rapports-generateur-export'],
    keywords: ['aperçu', 'sauvegarde', 'exécution'],
  }),
  makeArticle({
    id: 'rapports-generateur-export',
    title: 'Export Manager',
    objective: 'Exporter ou planifier un rapport.',
    location: 'Rapports → Générateur → Export',
    audience: audPilotage,
    intro: 'Export PDF, Excel ou image, avec options de watermark et planification email.',
    keywords: ['export', 'planification', 'générateur'],
  }),
];

// ---------------------------------------------------------------------------
// L. Rapports Comparatifs
// ---------------------------------------------------------------------------
const comparatifs: GuideArticle[] = [
  makeArticle({
    id: 'rapports-comparatifs-vue-ensemble',
    title: 'Vue d’ensemble Comparatifs',
    objective: 'Comparer périodes et entités.',
    location: 'Rapports → Comparatifs',
    audience: audBI,
    intro: 'Les comparatifs facilitent l’analyse d’écarts.',
    related: ['rapports-comparatifs-temporel'],
    keywords: ['comparatif', 'analyse'],
  }),
  makeArticle({
    id: 'rapports-comparatifs-temporel',
    title: 'Comparaison temporelle',
    objective: 'Comparer deux périodes.',
    location: 'Rapports → Comparatifs → Temporel',
    audience: audBI,
    intro: 'L’onglet Temporel compare deux fenêtres de temps.',
    keywords: ['temporel', 'comparatif'],
  }),
  makeArticle({
    id: 'rapports-comparatifs-categories',
    title: 'Comparaison par catégories',
    objective: 'Comparer la performance par famille.',
    location: 'Rapports → Comparatifs → Catégories',
    audience: audBI,
    intro: 'L’onglet Catégories met en regard plusieurs familles.',
    keywords: ['catégories', 'comparatif'],
  }),
  makeArticle({
    id: 'rapports-comparatifs-agents',
    title: 'Comparaison par agents',
    objective: 'Comparer la performance individuelle.',
    location: 'Rapports → Comparatifs → Agents',
    audience: audBI,
    intro: 'L’onglet Agents compare les vendeurs entre eux.',
    related: ['rapports-ventes-equipe'],
    keywords: ['agents', 'comparatif'],
  }),
  makeArticle({
    id: 'rapports-comparatifs-variance',
    title: 'Analyse de variance',
    objective: 'Identifier les écarts significatifs.',
    location: 'Rapports → Comparatifs → Variance',
    audience: audBI,
    intro: 'L’onglet Variance met en lumière les écarts.',
    keywords: ['variance', 'écart', 'comparatif'],
  }),
];

// ---------------------------------------------------------------------------
// M. Configuration des rapports
// ---------------------------------------------------------------------------
const configuration: GuideArticle[] = [
  makeArticle({
    id: 'rapports-configuration-vue-ensemble',
    title: 'Vue d’ensemble Configuration',
    objective: 'Découvrir les options de configuration.',
    location: 'Rapports → Configuration',
    audience: audAdmin,
    intro: 'Le module configure paramètres généraux, permissions, planification, modèles, connecteurs, API et archivage.',
    related: ['rapports-configuration-general'],
    keywords: ['configuration', 'rapports'],
  }),
  makeArticle({
    id: 'rapports-configuration-general',
    title: 'Paramètres généraux',
    objective: 'Définir la plage par défaut, formats et notifications.',
    location: 'Rapports → Configuration → Général',
    audience: audAdmin,
    intro: 'Les paramètres généraux pilotent la majorité des comportements.',
    callouts: [{ type: 'info', text: 'Hook : useReportSettings.' }],
    related: ['rapports-configuration-permissions'],
    keywords: ['général', 'paramètres'],
  }),
  makeArticle({
    id: 'rapports-configuration-permissions',
    title: 'Droits d’accès aux rapports',
    objective: 'Contrôler qui voit quoi.',
    location: 'Rapports → Configuration → Droits d’accès',
    audience: audAdmin,
    intro: 'Les permissions s’appuient sur la table dédiée des rôles utilisateurs.',
    callouts: [
      { type: 'warning', text: "La modification des permissions impacte l'accès au module Rapports complet (reports.view)." },
      { type: 'info', text: 'Hook : useReportPermissions.' },
    ],
    related: ['rapports-configuration-archivage'],
    keywords: ['permissions', 'droits', 'rapports'],
  }),
  makeArticle({
    id: 'rapports-configuration-automatisation',
    title: 'Automatisation et planification',
    objective: 'Programmer l’exécution récurrente des rapports.',
    location: 'Rapports → Configuration → Automatisation',
    audience: audAdmin,
    intro: 'La planification envoie les rapports par email aux destinataires.',
    callouts: [{ type: 'info', text: 'Hook : useReportSchedules.' }],
    keywords: ['automatisation', 'planification'],
  }),
  makeArticle({
    id: 'rapports-configuration-modeles',
    title: 'Modèles réutilisables',
    objective: 'Capitaliser sur des modèles de rapports.',
    location: 'Rapports → Configuration → Modèles',
    audience: audAdmin,
    intro: 'Les modèles standardisent les rapports récurrents.',
    callouts: [{ type: 'info', text: 'Hook : useReportTemplates.' }],
    keywords: ['modèles', 'templates'],
  }),
  makeArticle({
    id: 'rapports-configuration-connecteurs-bi',
    title: 'Connecteurs BI',
    objective: 'Brancher des outils BI externes.',
    location: 'Rapports → Configuration → Connecteurs BI',
    audience: audAdmin,
    intro: 'Les connecteurs exposent les données aux outils tiers.',
    callouts: [{ type: 'info', text: 'Hook : useReportConnectors.' }],
    keywords: ['connecteurs', 'BI'],
  }),
  makeArticle({
    id: 'rapports-configuration-api',
    title: 'API Rapports',
    objective: 'Exposer les rapports via API.',
    location: 'Rapports → Configuration → API',
    audience: audAdmin,
    intro: 'L’API Rapports permet l’automatisation côté SI.',
    callouts: [{ type: 'info', text: 'Hook : useReportAPI.' }],
    keywords: ['API', 'rapports', 'intégration'],
  }),
  makeArticle({
    id: 'rapports-configuration-archivage',
    title: 'Archivage et rétention',
    objective: 'Définir la politique de conservation.',
    location: 'Rapports → Configuration → Archivage',
    audience: audAdmin,
    intro: 'L’archivage applique une rétention paramétrable.',
    callouts: [{ type: 'info', text: 'Hook : useReportArchiving.' }],
    keywords: ['archivage', 'rétention'],
  }),
];

// ---------------------------------------------------------------------------
// Module export
// ---------------------------------------------------------------------------
export const rapportsModule: GuideModule = {
  id: 'rapports',
  title: 'Rapports',
  tagline: 'Piloter ventes, stock, finance, conformité, BI et IA.',
  description:
    "Le centre de reporting PharmaSoft transforme les données opérationnelles en indicateurs de pilotage, états réglementaires, analyses prédictives et exports personnalisés.",
  icon: BarChart3,
  accent: 'info',
  sections: [
    { id: 'rapports-pilotage', title: 'Pilotage et accueil', icon: LayoutDashboard, articles: pilotage },
    { id: 'rapports-ventes', title: 'Rapports Ventes', icon: ShoppingCart, articles: ventes },
    { id: 'rapports-stock', title: 'Rapports Stock', icon: Boxes, articles: stock },
    { id: 'rapports-financiers', title: 'Rapports Financiers', icon: Landmark, articles: financier },
    { id: 'rapports-clients', title: 'Rapports Clients', icon: Users, articles: clients },
    { id: 'rapports-bi', title: 'Business Intelligence', icon: Brain, articles: bi },
    { id: 'rapports-reglementaires', title: 'Rapports Réglementaires', icon: ShieldCheck, articles: reglementaires },
    { id: 'rapports-geospatial', title: 'Rapports Géospatial', icon: MapPin, articles: geospatial },
    { id: 'rapports-mobile', title: 'Rapports Mobile', icon: Smartphone, articles: mobile },
    { id: 'rapports-ia', title: 'Rapports IA et Prédictif', icon: Sparkles, articles: ia },
    { id: 'rapports-generateur', title: 'Générateur de rapports', icon: Wrench, articles: generateur },
    { id: 'rapports-comparatifs', title: 'Rapports Comparatifs', icon: GitCompare, articles: comparatifs },
    { id: 'rapports-configuration', title: 'Configuration des rapports', icon: Settings2, articles: configuration },
  ],
};
