import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  CalendarClock,
  ClipboardCheck,
  CreditCard,
  FileArchive,
  FileCheck2,
  FileText,
  Landmark,
  Layers3,
  Link2,
  Lock,
  Network,
  Receipt,
  Settings2,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import type { GuideArticle, GuideModule } from '../types';

type ArticleSeed = {
  id: string;
  title: string;
  objective: string;
  location: string;
  audience?: string[];
  intro: string;
  steps: [string, string?][];
  callouts?: GuideArticle['callouts'];
  bestPractices?: string[];
  faq?: GuideArticle['faq'];
  related?: string[];
  keywords: string[];
};

const accountingAudience = ['Comptables', 'Administrateurs', 'Pharmacien Titulaire'];
const financeAudience = ['Comptables', 'Responsables financiers', 'Administrateurs'];
const auditAudience = ['Auditeurs', 'Administrateurs', 'Pharmacien Titulaire'];

const makeArticle = (seed: ArticleSeed): GuideArticle => ({
  id: seed.id,
  title: seed.title,
  objective: seed.objective,
  location: seed.location,
  audience: seed.audience ?? accountingAudience,
  intro: seed.intro,
  steps: seed.steps.map(([title, detail]) => ({ title, detail })),
  callouts: seed.callouts ?? [
    {
      type: 'info',
      text: 'Les données comptables sont filtrées par pharmacie afin de préserver l’isolation multi-tenant.',
    },
  ],
  bestPractices: seed.bestPractices ?? [
    'Contrôler la période et le tenant avant toute analyse comptable.',
    'Conserver les justificatifs liés aux écritures, exports et validations.',
  ],
  faq: seed.faq ?? [
    {
      q: 'Qui peut utiliser cette fonctionnalité ?',
      a: 'L’accès dépend des permissions comptables attribuées au rôle de l’utilisateur.',
    },
  ],
  related: seed.related ?? [],
  keywords: seed.keywords,
});

const pilotageArticles = [
  makeArticle({
    id: 'comptabilite-dashboard-vue-ensemble',
    title: 'Comprendre le tableau de bord comptable',
    objective: 'Lire les indicateurs comptables clés et repérer rapidement les priorités financières.',
    location: 'Comptabilité → Tableaux de bord',
    intro: 'Le tableau de bord comptable centralise recettes, dépenses, résultat, trésorerie, alertes et tâches sur une période donnée.',
    steps: [
      ['Choisir la période', 'Sélectionnez semaine, mois, trimestre ou année selon l’analyse recherchée.'],
      ['Lire les KPI', 'Comparez recettes, dépenses, résultat et trésorerie disponible.'],
      ['Identifier les alertes', 'Repérez les échéances fiscales, écarts et tâches en attente.'],
    ],
    callouts: [
      { type: 'info', text: 'Les indicateurs sont isolés par pharmacie/tenant.' },
      { type: 'warning', text: 'La visibilité du dashboard dépend des permissions comptables.' },
    ],
    related: ['comptabilite-dashboard-etats-financiers', 'comptabilite-rapports-bilan', 'comptabilite-audit-pistes'],
    keywords: ['dashboard', 'KPI', 'résultat', 'trésorerie'],
  }),
  makeArticle({
    id: 'comptabilite-dashboard-etats-financiers',
    title: 'Lire les états financiers depuis le dashboard',
    objective: 'Interpréter les aperçus financiers affichés avant d’ouvrir les rapports détaillés.',
    location: 'Comptabilité → Tableaux de bord → États financiers',
    intro: 'Les widgets financiers donnent une vue synthétique du bilan, du compte de résultat, de la trésorerie et des ratios.',
    steps: [
      ['Comparer les soldes', 'Analysez les montants d’actif, passif, produits et charges.'],
      ['Suivre les ratios', 'Repérez les signaux de rentabilité, liquidité ou solvabilité.'],
      ['Ouvrir le rapport détaillé', 'Basculez vers les états financiers pour contrôler les lignes.'],
    ],
    related: ['comptabilite-rapports-bilan', 'comptabilite-rapports-resultat', 'comptabilite-rapports-ratios'],
    keywords: ['bilan', 'résultat', 'ratios', 'états financiers'],
  }),
  makeArticle({
    id: 'comptabilite-dashboard-analyses',
    title: 'Exploiter les analyses comptables rapides',
    objective: 'Utiliser les analyses rapides pour détecter les tendances de charges, ventes et clients.',
    location: 'Comptabilité → Tableaux de bord → Analyses',
    intro: 'Les analyses rapides mettent en évidence l’évolution mensuelle, les charges, les top clients et les ratios financiers.',
    steps: [
      ['Consulter l’évolution', 'Comparez les variations mensuelles ou trimestrielles.'],
      ['Repérer les postes forts', 'Identifiez les clients, charges ou ventes les plus significatifs.'],
      ['Croiser avec les rapports', 'Validez les tendances dans les états financiers détaillés.'],
    ],
    related: ['comptabilite-dashboard-vue-ensemble', 'comptabilite-rapports-ratios'],
    keywords: ['analyse', 'charges', 'clients', 'tendances'],
  }),
  makeArticle({
    id: 'comptabilite-dashboard-taches-alertes',
    title: 'Suivre les tâches, échéances et alertes comptables',
    objective: 'Prioriser les actions comptables à traiter pour éviter les retards et anomalies.',
    location: 'Comptabilité → Tableaux de bord → Tâches',
    intro: 'Les tâches et alertes regroupent les échéances fiscales, contrôles à réaliser, écritures à valider et points de conformité.',
    steps: [
      ['Lire les priorités', 'Classez les tâches selon urgence, impact et échéance.'],
      ['Traiter les alertes', 'Ouvrez le module concerné pour corriger l’anomalie.'],
      ['Actualiser le suivi', 'Rafraîchissez les données après traitement.'],
    ],
    related: ['comptabilite-fiscal-obligations', 'comptabilite-audit-conformite'],
    keywords: ['tâches', 'alertes', 'échéances', 'conformité'],
  }),
];

const planArticles = [
  makeArticle({
    id: 'comptabilite-plan-vue-ensemble',
    title: 'Comprendre le plan comptable SYSCOHADA',
    objective: 'Comprendre la structure OHADA utilisée pour classer les comptes de la pharmacie.',
    location: 'Comptabilité → Plan comptable',
    intro: 'Le plan comptable SYSCOHADA organise les comptes par classes, niveaux, soldes et statuts afin d’alimenter les écritures.',
    steps: [
      ['Parcourir les classes', 'Identifiez les classes de bilan, gestion et trésorerie.'],
      ['Contrôler les comptes actifs', 'Vérifiez les comptes utilisables dans les écritures.'],
      ['Analyser les soldes', 'Comparez soldes débiteurs et créditeurs.'],
    ],
    related: ['comptabilite-plan-classes-syscohada', 'comptabilite-plan-import-syscohada'],
    keywords: ['SYSCOHADA', 'OHADA', 'plan comptable', 'compte'],
  }),
  makeArticle({
    id: 'comptabilite-plan-arbre-comptes',
    title: 'Naviguer dans l’arbre des comptes',
    objective: 'Retrouver rapidement un compte dans la hiérarchie comptable.',
    location: 'Comptabilité → Plan comptable → Arbre des comptes',
    intro: 'L’arbre des comptes affiche la hiérarchie comptable avec recherche, filtres par classe et repères analytiques ou fiscaux.',
    steps: [
      ['Déplier les niveaux', 'Ouvrez les classes et sous-comptes nécessaires.'],
      ['Filtrer la liste', 'Utilisez classe, recherche texte ou type de compte.'],
      ['Ouvrir un compte', 'Consultez son libellé, statut, solde et paramètres.'],
    ],
    related: ['comptabilite-plan-creation-modification'],
    keywords: ['arbre', 'hiérarchie', 'classe', 'recherche'],
  }),
  makeArticle({
    id: 'comptabilite-plan-classes-syscohada',
    title: 'Consulter les classes SYSCOHADA',
    objective: 'Identifier le rôle des classes comptables OHADA dans les états financiers.',
    location: 'Comptabilité → Plan comptable → Classes SYSCOHADA',
    intro: 'Les classes SYSCOHADA regroupent les comptes de bilan, gestion, trésorerie et comptes spécifiques au contexte Congo.',
    steps: [
      ['Choisir une classe', 'Sélectionnez la classe à contrôler.'],
      ['Lire le regroupement', 'Vérifiez son usage dans le bilan, résultat ou trésorerie.'],
      ['Contrôler les comptes spécifiques', 'Repérez notamment les comptes liés aux cessions, fiscalité ou stocks.'],
    ],
    callouts: [{ type: 'info', text: 'Le plan suit le SYSCOHADA révisé 2025 adapté au Congo.' }],
    related: ['comptabilite-plan-import-syscohada'],
    keywords: ['classes', 'SYSCOHADA', 'OHADA', 'Congo'],
  }),
  makeArticle({
    id: 'comptabilite-plan-comptes-analytiques',
    title: 'Identifier les comptes analytiques',
    objective: 'Repérer les comptes utilisés pour les centres de coûts et la répartition analytique.',
    location: 'Comptabilité → Plan comptable → Comptes analytiques',
    intro: 'Les comptes analytiques permettent de rattacher charges et produits à des centres de coûts pour mesurer la rentabilité.',
    steps: [
      ['Filtrer les comptes analytiques', 'Affichez les comptes marqués comme analytiques.'],
      ['Vérifier les centres liés', 'Contrôlez le rattachement aux centres de coûts.'],
      ['Utiliser dans les répartitions', 'Sélectionnez ces comptes lors des allocations analytiques.'],
    ],
    related: ['comptabilite-analytique-centres-couts', 'comptabilite-analytique-repartition'],
    keywords: ['analytique', 'centre de coûts', 'répartition', 'compte'],
  }),
  makeArticle({
    id: 'comptabilite-plan-creation-modification',
    title: 'Créer ou modifier un compte comptable',
    objective: 'Ajouter ou ajuster un compte en respectant la structure comptable configurée.',
    location: 'Comptabilité → Plan comptable → Nouveau compte',
    intro: 'La création de compte précise le code, libellé, classe, type, parent, niveau et options analytiques ou de rapprochement.',
    steps: [
      ['Renseigner l’identification', 'Saisissez code, libellé, classe et type.'],
      ['Définir la hiérarchie', 'Choisissez le parent et le niveau de compte.'],
      ['Valider les options', 'Activez analytique, rapprochement ou statut selon l’usage.'],
    ],
    callouts: [{ type: 'warning', text: 'Évitez de modifier un compte déjà utilisé sans contrôle comptable.' }],
    related: ['comptabilite-plan-arbre-comptes', 'comptabilite-configuration-comptes-defaut'],
    keywords: ['création', 'modification', 'compte', 'hiérarchie'],
  }),
  makeArticle({
    id: 'comptabilite-plan-import-syscohada',
    title: 'Importer le plan comptable global SYSCOHADA',
    objective: 'Initialiser le plan comptable complet du tenant avec la structure SYSCOHADA Congo.',
    location: 'Comptabilité → Plan comptable → Import global',
    intro: 'L’import global charge la hiérarchie SYSCOHADA 2025 Congo avec les comptes nécessaires aux écritures automatiques.',
    steps: [
      ['Lancer l’import', 'Démarrez l’initialisation depuis l’action dédiée.'],
      ['Contrôler les comptes clés', 'Vérifiez les comptes 81/82, 572, 358 et les comptes fiscaux.'],
      ['Valider les comptes par défaut', 'Associez les comptes nécessaires aux automatismes.'],
    ],
    callouts: [
      { type: 'info', text: 'L’import utilise la configuration SYSCOHADA révisée adaptée au Congo.' },
      { type: 'warning', text: 'Vérifier les comptes par défaut avant génération automatique d’écritures.' },
    ],
    related: ['comptabilite-configuration-comptes-defaut', 'comptabilite-journal-generation-automatique'],
    keywords: ['import', 'SYSCOHADA', 'Congo', 'comptes 81 82'],
  }),
  makeArticle({
    id: 'comptabilite-plan-configuration-regionale',
    title: 'Configurer les paramètres régionaux du plan comptable',
    objective: 'Adapter le plan comptable à la devise, au pays et aux obligations locales.',
    location: 'Comptabilité → Plan comptable → Configuration régionale',
    intro: 'La configuration régionale précise pays, devise, système comptable, longueur de code et mentions de référence.',
    steps: [
      ['Vérifier le pays et la devise', 'Confirmez les paramètres Congo/FCFA selon le tenant.'],
      ['Contrôler le système comptable', 'Assurez-vous que SYSCOHADA est sélectionné.'],
      ['Enregistrer les mentions', 'Renseignez organisme et références légales utiles aux exports.'],
    ],
    related: ['comptabilite-configuration-devises', 'comptabilite-fiscal-parametres'],
    keywords: ['régionalisation', 'devise', 'FCFA', 'SYSCOHADA'],
  }),
];

const journalArticles = [
  makeArticle({
    id: 'comptabilite-journaux-ecritures',
    title: 'Journaux et écritures',
    objective: 'Comprendre comment les opérations métier et les saisies manuelles alimentent les journaux comptables.',
    location: 'Comptabilité → Journalisation → Écritures',
    intro: 'Les ventes, règlements, factures, paies et retours peuvent générer des écritures organisées par journaux, avec contrôle débit/crédit.',
    steps: [
      ['Consulter le journal', 'Filtrez par période, type d’opération, journal ou statut.'],
      ['Contrôler les pièces', 'Vérifiez la source métier, la référence et les comptes utilisés.'],
      ['Analyser les anomalies', 'Utilisez les alertes pour corriger les écarts ou comptes manquants.'],
    ],
    callouts: [{ type: 'success', text: 'Une écriture équilibrée facilite les clôtures et les déclarations.' }],
    bestPractices: ['Contrôler les comptes par défaut avant exploitation.', 'Réviser les journaux avant clôture mensuelle.'],
    faq: [{ q: 'Les écritures sont-elles toujours automatiques ?', a: 'Elles dépendent de la configuration comptable et des événements métier activés.' }],
    related: ['comptabilite-journal-creer-ecriture', 'comptabilite-journal-generation-automatique'],
    keywords: ['comptabilité', 'journaux', 'écritures', 'SYSCOHADA'],
  }),
  makeArticle({
    id: 'comptabilite-journal-journaux-types',
    title: 'Comprendre les journaux comptables',
    objective: 'Identifier le rôle des journaux Achats, Ventes, Caisse, Banque et Opérations diverses.',
    location: 'Comptabilité → Journalisation → Journaux',
    intro: 'Chaque journal regroupe des écritures de même nature afin de simplifier le contrôle, la recherche et les exports.',
    steps: [['Lire le code journal', 'Identifiez ACH, VT, CA, BQ ou OD.'], ['Associer l’usage métier', 'Reliez chaque journal aux flux achats, ventes, caisse ou banque.'], ['Contrôler l’activité', 'Vérifiez que seuls les journaux actifs sont utilisés.']],
    related: ['comptabilite-configuration-journaux'],
    keywords: ['journal', 'achats', 'ventes', 'banque'],
  }),
  makeArticle({
    id: 'comptabilite-journal-creer-ecriture',
    title: 'Créer une écriture manuelle équilibrée',
    objective: 'Saisir une écriture comptable manuelle avec un total débit égal au total crédit.',
    location: 'Comptabilité → Journalisation → Nouvelle écriture',
    intro: 'La saisie manuelle complète les automatismes pour les opérations diverses, corrections et ajustements contrôlés.',
    steps: [['Choisir le journal', 'Sélectionnez journal, date, référence et libellé.'], ['Ajouter les lignes', 'Renseignez comptes, débit, crédit et analytique si nécessaire.'], ['Valider l’équilibre', 'Confirmez que total débit et total crédit sont identiques.']],
    callouts: [{ type: 'warning', text: 'Une écriture déséquilibrée ne doit pas être validée.' }],
    related: ['comptabilite-journal-workflow-validation', 'comptabilite-audit-pistes'],
    keywords: ['écriture', 'débit', 'crédit', 'validation'],
  }),
  makeArticle({
    id: 'comptabilite-journal-workflow-validation',
    title: 'Valider et verrouiller les écritures',
    objective: 'Sécuriser le cycle brouillon, validation et verrouillage des écritures.',
    location: 'Comptabilité → Journalisation → Workflow',
    intro: 'Le workflow protège la piste comptable en distinguant les écritures modifiables des écritures validées ou verrouillées.',
    steps: [['Contrôler le brouillon', 'Vérifiez comptes, montants, pièces et libellé.'], ['Valider l’écriture', 'Passez au statut validé après contrôle.'], ['Verrouiller si nécessaire', 'Empêchez toute modification après clôture ou contrôle final.']],
    callouts: [{ type: 'warning', text: 'Une écriture verrouillée ne doit plus être modifiée hors procédure de correction.' }],
    related: ['comptabilite-journal-creer-ecriture', 'comptabilite-audit-pistes'],
    keywords: ['workflow', 'validation', 'verrouillage', 'audit'],
  }),
  makeArticle({
    id: 'comptabilite-journal-lettrage',
    title: 'Comprendre le lettrage comptable',
    objective: 'Associer factures, règlements et écritures de tiers pour suivre les soldes ouverts.',
    location: 'Comptabilité → Journalisation → Workflow',
    intro: 'Le lettrage rapproche les écritures liées à un même tiers afin d’identifier les montants réglés et les restes à payer.',
    steps: [['Identifier les écritures', 'Repérez factures, règlements ou avoirs du même tiers.'], ['Appliquer le lettrage', 'Lettrez automatiquement ou manuellement selon la configuration.'], ['Contrôler le solde', 'Vérifiez les montants non lettrés restants.']],
    related: ['comptabilite-paiements-liste', 'comptabilite-factures-clients'],
    keywords: ['lettrage', 'tiers', 'règlement', 'facture'],
  }),
  makeArticle({
    id: 'comptabilite-journal-generation-automatique',
    title: 'Comprendre la génération automatique des écritures',
    objective: 'Savoir quels événements métier produisent des écritures comptables automatiques.',
    location: 'Comptabilité → Journalisation',
    intro: 'Les ventes, règlements, factures, salaires et clôtures de caisse peuvent générer automatiquement des écritures SYSCOHADA.',
    steps: [['Configurer les prérequis', 'Vérifiez journaux, exercices et comptes par défaut.'], ['Déclencher l’événement métier', 'Validez vente, facture, règlement, bulletin ou clôture.'], ['Contrôler l’écriture créée', 'Ouvrez le journal pour vérifier débit, crédit et référence source.']],
    callouts: [{ type: 'info', text: 'Les transactions métier ne sont pas bloquées si la configuration comptable est incomplète.' }, { type: 'warning', text: 'Journaux, exercices et comptes par défaut doivent être configurés avant exploitation réelle.' }],
    related: ['comptabilite-configuration-comptes-defaut', 'comptabilite-plan-import-syscohada'],
    keywords: ['automatisation', 'écritures', 'SYSCOHADA', 'comptes par défaut'],
  }),
];

const facturationArticles = [
  makeArticle({ id: 'comptabilite-factures-vue-ensemble', title: 'Comprendre la facturation comptable', objective: 'Piloter les factures par statut et par type de tiers.', location: 'Comptabilité → Factures', audience: financeAudience, intro: 'La facturation comptable regroupe les factures clients, assureurs, fournisseurs, avoirs et relances.', steps: [['Lire les statistiques', 'Contrôlez brouillons, émises, payées, impayées et en retard.'], ['Filtrer par type', 'Séparez clients, assureurs, fournisseurs et avoirs.'], ['Ouvrir les actions', 'Créez, relancez, payez ou exportez selon le statut.']], related: ['comptabilite-factures-clients', 'comptabilite-factures-fournisseurs'], keywords: ['facture', 'statut', 'tiers', 'relance'] }),
  makeArticle({ id: 'comptabilite-factures-clients', title: 'Gérer les factures clients', objective: 'Créer, suivre et régler les factures adressées aux clients.', location: 'Comptabilité → Factures → Factures Clients', audience: financeAudience, intro: 'Les factures clients peuvent provenir des ventes non facturées ou d’une saisie comptable dédiée.', steps: [['Créer la facture', 'Sélectionnez client, lignes, taxes et échéance.'], ['Suivre le paiement', 'Contrôlez statut, solde et règlements associés.'], ['Exporter le PDF', 'Téléchargez ou imprimez le document justificatif.']], callouts: [{ type: 'warning', text: 'La logique de facturation doit rester cohérente avec le module Ventes.' }], related: ['comptabilite-paiements-liste', 'comptabilite-journal-generation-automatique'], keywords: ['facture client', 'paiement', 'PDF', 'vente'] }),
  makeArticle({ id: 'comptabilite-factures-assureurs', title: 'Gérer les factures assureurs', objective: 'Regrouper les ventes assurées et suivre la part prise en charge par les organismes.', location: 'Comptabilité → Factures → Factures Assureurs', audience: financeAudience, intro: 'La facturation assureur consolide les ventes couvertes avec part assurance, assureur et suivi de règlement.', steps: [['Sélectionner les ventes assurées', 'Identifiez les ventes à facturer à l’organisme.'], ['Contrôler la part assurance', 'Vérifiez taux, montant couvert et reste patient.'], ['Suivre le règlement', 'Rapprochez le paiement assureur avec la facture.']], related: ['ventes-pos-assurance', 'comptabilite-paiements-liste'], keywords: ['assureur', 'assurance', 'facture', 'règlement'] }),
  makeArticle({ id: 'comptabilite-factures-fournisseurs', title: 'Gérer les factures fournisseurs', objective: 'Contrôler les factures fournisseurs issues des réceptions et achats.', location: 'Comptabilité → Factures → Factures Fournisseurs', audience: financeAudience, intro: 'Les factures fournisseurs suivent réceptions, TVA déductible, centime additionnel et échéances de règlement.', steps: [['Associer la réception', 'Reliez la facture aux réceptions non facturées.'], ['Contrôler les taxes', 'Vérifiez TVA déductible et centime additionnel.'], ['Planifier le paiement', 'Renseignez échéance, statut et mode de règlement.']], related: ['comptabilite-paiements-echeanciers', 'comptabilite-fiscalite-tva'], keywords: ['fournisseur', 'réception', 'TVA', 'échéance'] }),
  makeArticle({ id: 'comptabilite-factures-avoirs', title: 'Créer et suivre les avoirs', objective: 'Documenter une correction ou un retour via un avoir comptable.', location: 'Comptabilité → Factures → Avoirs', audience: financeAudience, intro: 'Les avoirs rattachent une correction à une facture d’origine avec motif, montant et impact comptable.', steps: [['Choisir la facture origine', 'Sélectionnez la facture à corriger.'], ['Renseigner le motif', 'Indiquez retour, remise, correction ou annulation partielle.'], ['Valider l’impact', 'Contrôlez HT, TVA, TTC et écriture associée.']], related: ['ventes-retours', 'comptabilite-journal-generation-automatique'], keywords: ['avoir', 'retour', 'correction', 'facture'] }),
  makeArticle({ id: 'comptabilite-factures-relances', title: 'Suivre les relances de factures', objective: 'Gérer les relances clients ou tiers pour les factures en retard.', location: 'Comptabilité → Factures → Relances', audience: financeAudience, intro: 'Les relances documentent la date, le type, le destinataire et le message envoyé pour une facture en retard.', steps: [['Identifier les retards', 'Filtrez les factures dépassant l’échéance.'], ['Créer la relance', 'Renseignez type, message et destinataire.'], ['Suivre l’historique', 'Consultez les relances déjà envoyées.']], related: ['comptabilite-factures-clients', 'comptabilite-paiements-echeanciers'], keywords: ['relance', 'retard', 'échéance', 'facture'] }),
  makeArticle({ id: 'comptabilite-factures-pdf', title: 'Télécharger et imprimer les factures PDF', objective: 'Produire les justificatifs PDF des factures et avoirs.', location: 'Comptabilité → Factures', audience: financeAudience, intro: 'Les exports PDF reprennent les lignes de facture, taxes, devise, informations tenant et paramètres régionaux.', steps: [['Ouvrir la facture', 'Sélectionnez le document à imprimer.'], ['Générer le PDF', 'Contrôlez les lignes, totaux et mentions.'], ['Télécharger ou imprimer', 'Conservez le justificatif dans le dossier comptable.']], callouts: [{ type: 'info', text: 'Les PDF suivent le standard jsPDF du projet.' }, { type: 'warning', text: 'Les montants doivent rester cohérents avec Ventes et Comptabilité.' }], related: ['comptabilite-factures-clients', 'comptabilite-factures-fournisseurs'], keywords: ['PDF', 'impression', 'facture', 'export'] }),
];

const paiementsArticles = [
  makeArticle({ id: 'comptabilite-paiements-vue-ensemble', title: 'Comprendre le suivi des paiements', objective: 'Piloter les encaissements et décaissements comptables.', location: 'Comptabilité → Paiements', audience: financeAudience, intro: 'Le suivi des paiements consolide montants encaissés, paiements en attente, modes de paiement et centimes additionnels.', steps: [['Lire les totaux', 'Comparez encaissé, attente et répartition par mode.'], ['Filtrer les flux', 'Séparez espèces, cartes, virements et mobile money.'], ['Contrôler les écarts', 'Repérez les paiements sans rapprochement ou référence.']], related: ['comptabilite-paiements-liste', 'comptabilite-bancaire-rapprochement'], keywords: ['paiement', 'encaissement', 'règlement', 'mode'] }),
  makeArticle({ id: 'comptabilite-paiements-liste', title: 'Consulter tous les paiements', objective: 'Rechercher et contrôler les paiements enregistrés.', location: 'Comptabilité → Paiements → Paiements', audience: financeAudience, intro: 'La liste des paiements affiche numéro de pièce, tiers, montant, mode, référence, statut et date.', steps: [['Rechercher un paiement', 'Utilisez numéro, tiers ou référence.'], ['Filtrer par statut', 'Isolez les paiements validés, en attente ou annulés.'], ['Ouvrir le détail', 'Contrôlez facture, écriture et référence bancaire.']], related: ['comptabilite-factures-clients', 'comptabilite-journal-lettrage'], keywords: ['liste paiements', 'tiers', 'référence', 'statut'] }),
  makeArticle({ id: 'comptabilite-paiements-rapprochement', title: 'Rapprocher les paiements bancaires', objective: 'Associer les paiements comptables aux transactions bancaires correspondantes.', location: 'Comptabilité → Paiements → Rapprochement bancaire', audience: financeAudience, intro: 'Le rapprochement classe les éléments rapprochés, suspects ou ignorés pour fiabiliser la trésorerie.', steps: [['Choisir le compte', 'Sélectionnez compte bancaire et période.'], ['Comparer les mouvements', 'Associez paiement comptable et transaction bancaire.'], ['Valider le rapprochement', 'Confirmez les correspondances et signalez les écarts.']], related: ['comptabilite-bancaire-rapprochement', 'comptabilite-audit-rapports'], keywords: ['rapprochement', 'banque', 'paiement', 'écart'] }),
  makeArticle({ id: 'comptabilite-paiements-echeanciers', title: 'Suivre les échéanciers de paiement', objective: 'Anticiper paiements à venir, retards et obligations de règlement.', location: 'Comptabilité → Paiements → Échéanciers', audience: financeAudience, intro: 'Les échéanciers regroupent périodicité, dates, statuts, montants et alertes associées.', steps: [['Consulter les échéances', 'Repérez prochaines dates et montants.'], ['Identifier les retards', 'Filtrez les paiements échus non réglés.'], ['Prioriser les actions', 'Relancez, payez ou ajustez selon le cas.']], related: ['comptabilite-factures-relances', 'comptabilite-credit-echeanciers'], keywords: ['échéancier', 'retard', 'paiement', 'alerte'] }),
  makeArticle({ id: 'comptabilite-paiements-modes', title: 'Configurer les modes de paiement', objective: 'Définir les moyens de paiement utilisables en comptabilité.', location: 'Comptabilité → Paiements → Modes de Paiement', audience: financeAudience, intro: 'Les modes incluent espèces, carte, virement, mobile money, chèque et moyens régionaux activés pour le tenant.', steps: [['Activer un mode', 'Définissez les moyens disponibles.'], ['Renseigner les références', 'Exigez une référence si nécessaire.'], ['Tester l’usage', 'Vérifiez l’apparition dans factures, ventes ou règlements.']], related: ['ventes-configuration-paiement', 'comptabilite-configuration-generale'], keywords: ['mode paiement', 'carte', 'mobile money', 'chèque'] }),
  makeArticle({ id: 'comptabilite-paiements-regionalisation', title: 'Comprendre les paiements régionalisés', objective: 'Appliquer devise, formats et règles locales aux paiements.', location: 'Comptabilité → Paiements', audience: financeAudience, intro: 'La régionalisation applique devise tenant, formats de montants, mobile money et centime additionnel selon le contexte local.', steps: [['Vérifier la devise', 'Confirmez la devise de base configurée.'], ['Contrôler les formats', 'Validez dates, montants et références locales.'], ['Suivre les taxes associées', 'Repérez centime additionnel ou charges liées.']], related: ['comptabilite-configuration-devises', 'comptabilite-fiscal-parametres'], keywords: ['régionalisation', 'devise', 'FCFA', 'centime additionnel'] }),
];

const paieArticles = [
  makeArticle({ id: 'comptabilite-paie-vue-ensemble', title: 'Comprendre la gestion de la paie', objective: 'Piloter les bulletins, paramètres sociaux et paiements salariés.', location: 'Comptabilité → Paie', audience: financeAudience, intro: 'La paie comptable couvre génération de bulletins, CNSS, IRPP, historique annuel et paiements du personnel.', steps: [['Lire le résumé', 'Contrôlez mois, masse salariale, net à payer et charges.'], ['Ouvrir les bulletins', 'Vérifiez les bulletins par salarié.'], ['Contrôler les paramètres', 'Validez CNSS, IRPP, SMIG et rubriques.']], related: ['comptabilite-paie-generer-bulletins', 'comptabilite-paie-parametres'], keywords: ['paie', 'bulletin', 'CNSS', 'IRPP'] }),
  makeArticle({ id: 'comptabilite-paie-generer-bulletins', title: 'Générer les bulletins de paie', objective: 'Créer les bulletins mensuels du personnel.', location: 'Comptabilité → Paie → Bulletins de paie', audience: financeAudience, intro: 'La génération des bulletins calcule salaire brut, retenues, primes et net à payer pour le mois choisi.', steps: [['Sélectionner la période', 'Choisissez mois et année.'], ['Choisir le personnel', 'Incluez les salariés concernés.'], ['Générer les brouillons', 'Contrôlez chaque bulletin avant validation.']], related: ['comptabilite-paie-modifier-rubriques', 'comptabilite-paie-valider-payer'], keywords: ['génération', 'bulletin', 'salaire', 'brouillon'] }),
  makeArticle({ id: 'comptabilite-paie-modifier-rubriques', title: 'Modifier les rubriques d’un bulletin', objective: 'Ajuster primes, retenues, TOL, avances ou acomptes avant validation.', location: 'Comptabilité → Paie → Bulletins de paie → Modifier', audience: financeAudience, intro: 'Les rubriques dynamiques permettent d’ajuster les composants du bulletin en respectant les règles de paie configurées.', steps: [['Ouvrir le bulletin', 'Sélectionnez un bulletin brouillon.'], ['Modifier les rubriques', 'Ajustez primes imposables, non imposables, retenues, TOL ou avances.'], ['Recalculer le net', 'Vérifiez brut, charges et net à payer.']], callouts: [{ type: 'info', text: 'Les rubriques dynamiques utilisent des colonnes JSONB.' }, { type: 'warning', text: 'Vérifier les rubriques avant validation du bulletin.' }], related: ['comptabilite-paie-parametres'], keywords: ['rubriques', 'primes', 'retenues', 'JSONB'] }),
  makeArticle({ id: 'comptabilite-paie-valider-payer', title: 'Valider et payer un bulletin', objective: 'Finaliser un bulletin et enregistrer le paiement salarié.', location: 'Comptabilité → Paie → Bulletins de paie', audience: financeAudience, intro: 'La validation bloque le bulletin contrôlé et son paiement peut produire une écriture comptable selon la configuration.', steps: [['Contrôler le bulletin', 'Vérifiez montants et rubriques.'], ['Valider le bulletin', 'Passez du statut brouillon au statut validé.'], ['Enregistrer le paiement', 'Choisissez mode, date et référence.']], related: ['comptabilite-journal-generation-automatique', 'comptabilite-paie-historique'], keywords: ['validation', 'paiement', 'bulletin', 'écriture'] }),
  makeArticle({ id: 'comptabilite-paie-parametres', title: 'Configurer CNSS, IRPP, SMIG et primes par défaut', objective: 'Définir les paramètres nécessaires au calcul des bulletins.', location: 'Comptabilité → Paie → Paramètres', audience: financeAudience, intro: 'Les paramètres de paie regroupent taux CNSS employé/patronal, IRPP, SMIG, congés payés, TOL et primes par défaut.', steps: [['Vérifier les taux', 'Contrôlez CNSS, IRPP et paramètres sociaux.'], ['Définir les bases', 'Renseignez SMIG, congés et rubriques standards.'], ['Enregistrer la configuration', 'Appliquez les paramètres avant génération.']], callouts: [{ type: 'warning', text: 'Un mauvais paramétrage de paie produit des bulletins et écritures erronés.' }], related: ['comptabilite-paie-generer-bulletins'], keywords: ['CNSS', 'IRPP', 'SMIG', 'paramètres'] }),
  makeArticle({ id: 'comptabilite-paie-historique', title: 'Exploiter l’historique annuel de la paie', objective: 'Analyser les salaires, charges et paiements sur l’année.', location: 'Comptabilité → Paie → Historique', audience: financeAudience, intro: 'L’historique annuel consolide masse brute, net versé, CNSS, IRPP et exports PDF/Excel.', steps: [['Choisir l’année', 'Sélectionnez l’exercice ou l’année civile.'], ['Lire la synthèse', 'Analysez brut, net, charges et évolutions.'], ['Exporter les données', 'Téléchargez PDF ou Excel pour contrôle.']], related: ['comptabilite-rapports-export'], keywords: ['historique', 'paie', 'annuel', 'export'] }),
];

const analytiqueArticles = [
  makeArticle({ id: 'comptabilite-analytique-centres-couts', title: 'Gérer les centres de coûts', objective: 'Créer et organiser les centres de coûts utilisés pour l’analyse de rentabilité.', location: 'Comptabilité → Analytique → Centres de Coûts', audience: financeAudience, intro: 'Les centres de coûts structurent les charges et produits par activité, responsable, parent et objectifs de performance.', steps: [['Créer le centre', 'Renseignez code, nom, type et responsable.'], ['Définir la hiérarchie', 'Associez un centre parent si nécessaire.'], ['Suivre les objectifs', 'Contrôlez marge, rotation et budget.']], related: ['comptabilite-analytique-repartition', 'comptabilite-plan-comptes-analytiques'], keywords: ['centre de coûts', 'analytique', 'marge', 'responsable'] }),
  makeArticle({ id: 'comptabilite-analytique-rentabilite', title: 'Analyser la rentabilité analytique', objective: 'Mesurer la performance par centre de coûts.', location: 'Comptabilité → Analytique → Rentabilité', audience: financeAudience, intro: 'La rentabilité analytique compare chiffre d’affaires, coûts, marge brute, taux de marge et taux de marque.', steps: [['Choisir les centres', 'Filtrez la période et les centres à analyser.'], ['Comparer les marges', 'Analysez taux de marge et taux de marque.'], ['Identifier les écarts', 'Repérez centres performants ou déficitaires.']], related: ['comptabilite-analytique-tableaux-bord'], keywords: ['rentabilité', 'marge', 'taux de marque', 'coûts'] }),
  makeArticle({ id: 'comptabilite-analytique-repartition', title: 'Répartir les charges analytiques', objective: 'Affecter les charges communes aux centres de coûts concernés.', location: 'Comptabilité → Analytique → Répartition', audience: financeAudience, intro: 'Les répartitions analytiques distribuent les charges selon des clés, coefficients et lignes de répartition validées.', steps: [['Sélectionner la charge', 'Choisissez l’écriture ou la charge à répartir.'], ['Appliquer les clés', 'Renseignez centres et coefficients.'], ['Valider la répartition', 'Contrôlez que le total réparti correspond au montant source.']], related: ['comptabilite-analytique-cles-repartition'], keywords: ['répartition', 'charges', 'coefficients', 'analytique'] }),
  makeArticle({ id: 'comptabilite-analytique-cles-repartition', title: 'Configurer les clés et coefficients de répartition', objective: 'Définir les règles utilisées pour répartir automatiquement les charges.', location: 'Comptabilité → Analytique → Répartition', audience: financeAudience, intro: 'Les clés de répartition standardisent l’allocation des charges entre centres de coûts.', steps: [['Créer la clé', 'Nommez la clé et décrivez son usage.'], ['Définir les coefficients', 'Répartissez les pourcentages entre centres.'], ['Contrôler le total', 'Vérifiez que la clé couvre 100 % si requis.']], related: ['comptabilite-analytique-repartition'], keywords: ['clé', 'coefficient', 'allocation', 'charges'] }),
  makeArticle({ id: 'comptabilite-analytique-budgets', title: 'Créer et suivre les budgets analytiques', objective: 'Comparer budgets prévus et réalisés par centre de coûts.', location: 'Comptabilité → Analytique → Budgets', audience: financeAudience, intro: 'Les budgets analytiques définissent montants prévus, montants réalisés, période, exercice et alertes d’écart.', steps: [['Créer le budget', 'Choisissez centre, exercice, période et montant prévu.'], ['Suivre le réalisé', 'Comparez les écritures affectées au budget.'], ['Analyser les écarts', 'Traitez les dépassements ou sous-consommations.']], related: ['comptabilite-analytique-tableaux-bord'], keywords: ['budget', 'prévu', 'réalisé', 'écart'] }),
  makeArticle({ id: 'comptabilite-analytique-tableaux-bord', title: 'Lire les tableaux de bord analytiques', objective: 'Piloter la performance analytique à partir de KPI et écarts.', location: 'Comptabilité → Analytique → Tableaux de Bord', audience: financeAudience, intro: 'Les tableaux de bord analytiques affichent KPI, performance des centres, écarts, meilleurs centres et points d’attention.', steps: [['Lire les KPI', 'Analysez marge, coûts et budget consommé.'], ['Comparer les centres', 'Repérez les meilleurs et les centres à surveiller.'], ['Ouvrir le détail', 'Accédez aux répartitions ou budgets concernés.']], related: ['comptabilite-analytique-rentabilite', 'comptabilite-analytique-budgets'], keywords: ['tableau de bord', 'KPI', 'écarts', 'performance'] }),
  makeArticle({ id: 'comptabilite-analytique-exports', title: 'Exporter les rapports analytiques', objective: 'Produire les exports PDF ou Excel pour l’analyse interne.', location: 'Comptabilité → Analytique', audience: financeAudience, intro: 'Les exports analytiques regroupent centres de coûts, rentabilité, budgets et répartitions selon les filtres appliqués.', steps: [['Appliquer les filtres', 'Choisissez période, centre et type d’analyse.'], ['Sélectionner le format', 'PDF pour présentation, Excel pour retraitement.'], ['Conserver l’export', 'Archivez le fichier avec les justificatifs.']], related: ['comptabilite-rapports-export'], keywords: ['export', 'PDF', 'Excel', 'analytique'] }),
];

const fiscalArticles = [
  makeArticle({ id: 'comptabilite-fiscalite-tva', title: 'Fiscalité et TVA', objective: 'Préparer les informations utiles aux déclarations fiscales mensuelles.', location: 'Comptabilité → Fiscal → TVA', audience: financeAudience, intro: 'Le suivi fiscal consolide TVA collectée, TVA déductible, TVA à payer, taux moyen et centimes additionnels.', steps: [['Choisir la période', 'Sélectionnez le mois ou la plage à analyser.'], ['Contrôler les bases taxables', 'Comparez hors taxe, TVA et centimes additionnels.'], ['Préparer la déclaration', 'Utilisez les états disponibles pour justification.']], callouts: [{ type: 'warning', text: 'Un mauvais paramétrage fiscal peut produire des écarts déclaratifs.' }], bestPractices: ['Vérifier les taux avant la première vente du mois.', 'Conserver les justificatifs de correction.'], faq: [{ q: 'Le module couvre-t-il le SYSCOHADA ?', a: 'Oui, les guides et automatismes sont conçus autour des principes SYSCOHADA révisés.' }], related: ['comptabilite-fiscal-declaration-g10', 'comptabilite-journaux-ecritures'], keywords: ['TVA', 'fiscalité', 'déclaration', 'centime additionnel'] }),
  makeArticle({ id: 'comptabilite-fiscal-taux-tva', title: 'Configurer les taux de TVA', objective: 'Maintenir les taux de TVA applicables aux opérations comptables.', location: 'Comptabilité → Fiscal → TVA', audience: financeAudience, intro: 'Les taux de TVA précisent les valeurs normales ou réduites, leur période d’application et leur statut.', steps: [['Créer un taux', 'Renseignez nom, pourcentage et période.'], ['Modifier si nécessaire', 'Ajustez un taux avant utilisation active.'], ['Désactiver les anciens taux', 'Conservez l’historique sans supprimer les références utiles.']], related: ['comptabilite-fiscal-parametres'], keywords: ['TVA', 'taux', 'normal', 'réduit'] }),
  makeArticle({ id: 'comptabilite-fiscal-declarations', title: 'Créer et suivre les déclarations fiscales', objective: 'Gérer le cycle brouillon, dépôt, paiement et archivage des déclarations.', location: 'Comptabilité → Fiscal → Déclarations', audience: financeAudience, intro: 'Les déclarations fiscales regroupent période, statut, justificatifs, dépôt et paiement.', steps: [['Créer le brouillon', 'Sélectionnez période et type de déclaration.'], ['Contrôler les montants', 'Vérifiez TVA, taxes et pièces justificatives.'], ['Suivre le dépôt', 'Renseignez statut, date et paiement.']], related: ['comptabilite-fiscal-declaration-g10', 'comptabilite-fiscal-obligations'], keywords: ['déclaration', 'fiscal', 'dépôt', 'paiement'] }),
  makeArticle({ id: 'comptabilite-fiscal-obligations', title: 'Suivre les obligations fiscales', objective: 'Anticiper les échéances et obligations récurrentes.', location: 'Comptabilité → Fiscal → Obligations', audience: financeAudience, intro: 'Les obligations fiscales listent échéances, retards, récurrences et priorités de traitement.', steps: [['Consulter les échéances', 'Repérez dates limites et obligations ouvertes.'], ['Identifier les retards', 'Filtrez les obligations échues.'], ['Planifier les actions', 'Préparez déclaration, paiement ou justificatif.']], related: ['comptabilite-dashboard-taches-alertes'], keywords: ['obligations', 'échéances', 'retard', 'fiscalité'] }),
  makeArticle({ id: 'comptabilite-fiscal-conformite', title: 'Piloter la conformité fiscale', objective: 'Suivre le score de conformité et les points à corriger.', location: 'Comptabilité → Fiscal → Conformité', audience: financeAudience, intro: 'La conformité fiscale synthétise contrôles, statut, anomalies et corrections nécessaires.', steps: [['Lire le score', 'Évaluez le niveau de conformité global.'], ['Ouvrir les contrôles', 'Consultez les points non conformes.'], ['Corriger les écarts', 'Traitez paramétrage, déclaration ou justificatif manquant.']], related: ['comptabilite-audit-conformite'], keywords: ['conformité', 'contrôle', 'fiscal', 'score'] }),
  makeArticle({ id: 'comptabilite-fiscal-rapports', title: 'Générer les rapports fiscaux', objective: 'Exporter les documents fiscaux nécessaires aux contrôles et déclarations.', location: 'Comptabilité → Fiscal → Rapports', audience: financeAudience, intro: 'Les rapports fiscaux incluent journal TVA PDF, état TVA Excel, annexe fiscale et exports de synthèse.', steps: [['Choisir la période', 'Sélectionnez le mois ou l’exercice.'], ['Choisir le rapport', 'Journal TVA, état TVA ou annexe fiscale.'], ['Exporter le fichier', 'Téléchargez PDF ou Excel pour archivage.']], related: ['comptabilite-fiscalite-tva', 'comptabilite-rapports-annexes'], keywords: ['rapport fiscal', 'journal TVA', 'annexe', 'export'] }),
  makeArticle({ id: 'comptabilite-fiscal-declaration-g10', title: 'Préparer la déclaration mensuelle G n°10 Congo', objective: 'Préparer la déclaration mensuelle congolaise avec TVA, centimes additionnels et ASDI.', location: 'Comptabilité → Fiscal → Rapports', audience: financeAudience, intro: 'La déclaration G n°10 consolide TVA due, centimes additionnels, ASDI payé, déclaration néant et échéance du 20.', steps: [['Choisir le mois', 'Sélectionnez la période déclarative.'], ['Contrôler les montants stockés', 'Utilisez les montants réels de ventes et réceptions sans recalcul client.'], ['Calculer le net à payer', 'Appliquez TVA due + centimes additionnels - ASDI payé.']], callouts: [{ type: 'warning', text: 'La déclaration G10 doit utiliser les montants réels stockés, sans recalcul client.' }, { type: 'info', text: 'Net à payer = TVA due + centimes additionnels - ASDI payé.' }], related: ['comptabilite-fiscalite-tva', 'comptabilite-fiscal-declarations'], keywords: ['G10', 'Congo', 'TVA', 'ASDI'] }),
  makeArticle({ id: 'comptabilite-fiscal-parametres', title: 'Configurer les paramètres fiscaux', objective: 'Définir régime TVA, fréquence, règles locales et devise fiscale.', location: 'Comptabilité → Fiscal → Paramètres', audience: financeAudience, intro: 'Les paramètres fiscaux conditionnent les calculs, déclarations, archivages et exports fiscaux.', steps: [['Choisir le régime', 'Définissez régime et périodicité TVA.'], ['Renseigner les règles locales', 'Vérifiez centimes additionnels, ASDI et devise.'], ['Enregistrer avant exploitation', 'Validez les paramètres avant les premières opérations du mois.']], related: ['comptabilite-fiscal-taux-tva', 'comptabilite-configuration-generale'], keywords: ['paramètres fiscaux', 'régime TVA', 'ASDI', 'devise'] }),
];

const bancaireArticles = [
  makeArticle({ id: 'comptabilite-bancaire-comptes', title: 'Gérer les comptes bancaires', objective: 'Créer et suivre les comptes bancaires utilisés en comptabilité.', location: 'Comptabilité → Bancaire → Comptes', audience: financeAudience, intro: 'Les comptes bancaires regroupent banque, numéro de compte, solde, statut actif et options de synchronisation.', steps: [['Créer le compte', 'Renseignez banque, intitulé et informations de compte.'], ['Contrôler le solde', 'Comparez solde comptable et bancaire.'], ['Activer la synchronisation', 'Configurez les options si disponibles.']], related: ['comptabilite-bancaire-transactions'], keywords: ['banque', 'compte bancaire', 'solde', 'synchronisation'] }),
  makeArticle({ id: 'comptabilite-bancaire-transactions', title: 'Consulter les transactions bancaires', objective: 'Rechercher et contrôler les mouvements bancaires importés ou saisis.', location: 'Comptabilité → Bancaire → Transactions', audience: financeAudience, intro: 'La liste des transactions bancaires propose recherche, filtres compte/statut/date, pagination, tri et détail.', steps: [['Filtrer les mouvements', 'Utilisez compte, statut, date ou recherche.'], ['Lire le détail', 'Contrôlez libellé, montant et référence.'], ['Préparer le rapprochement', 'Identifiez les mouvements à associer.']], related: ['comptabilite-bancaire-rapprochement'], keywords: ['transaction bancaire', 'filtre', 'statut', 'mouvement'] }),
  makeArticle({ id: 'comptabilite-bancaire-import-releve', title: 'Importer un relevé bancaire', objective: 'Ajouter des transactions bancaires depuis un relevé externe.', location: 'Comptabilité → Bancaire → Transactions', audience: financeAudience, intro: 'L’import de relevé permet de mapper les colonnes, contrôler les lignes et préparer la catégorisation ou le rapprochement.', steps: [['Charger le fichier', 'Importez le relevé compatible.'], ['Mapper les colonnes', 'Associez date, libellé, débit, crédit et référence.'], ['Valider l’import', 'Contrôlez les doublons et anomalies avant intégration.']], related: ['comptabilite-bancaire-categorisation', 'comptabilite-bancaire-rapprochement'], keywords: ['import', 'relevé bancaire', 'mapping', 'doublon'] }),
  makeArticle({ id: 'comptabilite-bancaire-rapprochement', title: 'Réaliser un rapprochement bancaire', objective: 'Comparer banque et comptabilité pour valider les mouvements.', location: 'Comptabilité → Bancaire → Rapprochement bancaire', audience: financeAudience, intro: 'Le rapprochement bancaire suit transactions rapprochées, à rapprocher, écarts et historique de validation.', steps: [['Sélectionner la période', 'Choisissez compte et dates.'], ['Associer les lignes', 'Rapprochez transaction bancaire et écriture ou paiement.'], ['Valider le rapprochement', 'Confirmez l’écart total et archivez le contrôle.']], related: ['comptabilite-paiements-rapprochement', 'comptabilite-audit-rapports'], keywords: ['rapprochement bancaire', 'écart', 'validation', 'banque'] }),
  makeArticle({ id: 'comptabilite-bancaire-categorisation', title: 'Catégoriser les transactions bancaires', objective: 'Affecter les mouvements bancaires aux catégories et comptes adaptés.', location: 'Comptabilité → Bancaire → Transactions', audience: financeAudience, intro: 'La catégorisation associe catégorie, règle automatique et affectation comptable aux transactions bancaires.', steps: [['Choisir une transaction', 'Ouvrez le mouvement à catégoriser.'], ['Sélectionner la catégorie', 'Associez une nature ou un compte comptable.'], ['Enregistrer la règle', 'Créez une règle automatique si le libellé est récurrent.']], related: ['comptabilite-bancaire-configuration'], keywords: ['catégorisation', 'règle', 'compte', 'banque'] }),
  makeArticle({ id: 'comptabilite-bancaire-tresorerie', title: 'Suivre la trésorerie', objective: 'Analyser les entrées, sorties, flux net et solde total.', location: 'Comptabilité → Bancaire → Trésorerie', audience: financeAudience, intro: 'Le suivi de trésorerie synthétise solde total, entrées, sorties, flux net et graphique de cash-flow.', steps: [['Lire le solde total', 'Additionnez les comptes actifs.'], ['Comparer entrées et sorties', 'Repérez le flux net de la période.'], ['Analyser la tendance', 'Utilisez le graphique de cash-flow.']], related: ['comptabilite-dashboard-vue-ensemble', 'comptabilite-bancaire-previsions'], keywords: ['trésorerie', 'cash-flow', 'entrées', 'sorties'] }),
  makeArticle({ id: 'comptabilite-bancaire-previsions', title: 'Construire les prévisions de trésorerie', objective: 'Anticiper les besoins de trésorerie à partir des engagements et échéances.', location: 'Comptabilité → Bancaire → Prévisions', audience: financeAudience, intro: 'Les prévisions croisent scénarios, engagements, échéances et tendances pour anticiper les tensions de trésorerie.', steps: [['Choisir un scénario', 'Sélectionnez hypothèse prudente, normale ou optimiste.'], ['Intégrer les échéances', 'Ajoutez paiements à venir et recettes attendues.'], ['Lire la projection', 'Repérez les périodes de tension ou excédent.']], related: ['comptabilite-paiements-echeanciers', 'comptabilite-bancaire-tresorerie'], keywords: ['prévisions', 'trésorerie', 'scénario', 'échéances'] }),
  makeArticle({ id: 'comptabilite-bancaire-configuration', title: 'Configurer l’intégration bancaire', objective: 'Définir les règles de synchronisation, catégorisation et rapprochement bancaire.', location: 'Comptabilité → Bancaire → Configuration', audience: financeAudience, intro: 'La configuration bancaire contrôle paramètres, règles de rapprochement, catégorisation et synchronisation.', steps: [['Définir les paramètres', 'Choisissez fréquence, compte et options.'], ['Créer les règles', 'Configurez rapprochement et catégorisation.'], ['Tester la synchronisation', 'Vérifiez les statuts et erreurs éventuelles.']], related: ['comptabilite-integrations-externes'], keywords: ['configuration bancaire', 'synchronisation', 'règles', 'intégration'] }),
];

const rapportsArticles = [
  makeArticle({ id: 'comptabilite-rapports-bilan', title: 'Lire et exporter le bilan OHADA', objective: 'Contrôler actif, passif et équilibre du bilan.', location: 'Comptabilité → Rapports → Bilan', audience: financeAudience, intro: 'Le bilan OHADA présente actif, passif, synthèse, détails, exercice et export PDF/Excel.', steps: [['Choisir l’exercice', 'Sélectionnez l’exercice comptable.'], ['Lire actif et passif', 'Contrôlez les grandes masses et équilibres.'], ['Exporter le bilan', 'Téléchargez PDF ou Excel pour archivage.']], related: ['comptabilite-dashboard-etats-financiers', 'comptabilite-rapports-export'], keywords: ['bilan', 'OHADA', 'actif', 'passif'] }),
  makeArticle({ id: 'comptabilite-rapports-resultat', title: 'Lire le compte de résultat OHADA', objective: 'Analyser produits, charges et résultat net.', location: 'Comptabilité → Rapports → Compte de Résultat', audience: financeAudience, intro: 'Le compte de résultat présente produits, charges, résultat d’exploitation, résultat financier et résultat net.', steps: [['Choisir la période', 'Sélectionnez exercice ou période.'], ['Analyser les produits', 'Contrôlez ventes et autres produits.'], ['Analyser les charges', 'Comparez charges d’exploitation, financières et résultat net.']], related: ['comptabilite-rapports-ratios'], keywords: ['compte de résultat', 'produits', 'charges', 'résultat net'] }),
  makeArticle({ id: 'comptabilite-rapports-flux-tresorerie', title: 'Analyser les flux de trésorerie', objective: 'Comprendre les flux d’exploitation, investissement et financement.', location: 'Comptabilité → Rapports → Flux de Trésorerie', audience: financeAudience, intro: 'Le tableau des flux explique la variation de trésorerie par activité opérationnelle, investissement et financement.', steps: [['Lire l’exploitation', 'Analysez les flux liés à l’activité courante.'], ['Contrôler investissement et financement', 'Repérez achats d’actifs, emprunts ou remboursements.'], ['Comparer la variation', 'Validez l’évolution de trésorerie.']], related: ['comptabilite-bancaire-tresorerie'], keywords: ['flux de trésorerie', 'exploitation', 'financement', 'variation'] }),
  makeArticle({ id: 'comptabilite-rapports-ratios', title: 'Interpréter les ratios financiers', objective: 'Utiliser les ratios pour évaluer rentabilité, liquidité et solvabilité.', location: 'Comptabilité → Rapports → Ratios', audience: financeAudience, intro: 'Les ratios financiers donnent des indicateurs synthétiques de santé financière et de performance.', steps: [['Lire la rentabilité', 'Analysez marge et résultat.'], ['Lire la liquidité', 'Évaluez la capacité à couvrir les échéances.'], ['Lire la solvabilité', 'Contrôlez l’équilibre financier global.']], related: ['comptabilite-dashboard-analyses'], keywords: ['ratios', 'rentabilité', 'liquidité', 'solvabilité'] }),
  makeArticle({ id: 'comptabilite-rapports-annexes', title: 'Produire les états annexes', objective: 'Préparer les annexes nécessaires à la compréhension des états financiers.', location: 'Comptabilité → Rapports → États Annexes', audience: financeAudience, intro: 'Les états annexes documentent amortissements, provisions, créances, dettes et informations complémentaires.', steps: [['Choisir l’annexe', 'Sélectionnez le tableau à produire.'], ['Contrôler les données', 'Vérifiez montants et justificatifs.'], ['Exporter le document', 'Téléchargez le fichier pour dossier annuel.']], related: ['comptabilite-fiscal-rapports'], keywords: ['annexes', 'amortissements', 'provisions', 'dettes'] }),
  makeArticle({ id: 'comptabilite-rapports-tableaux-specialises', title: 'Utiliser les tableaux annexes spécialisés', objective: 'Exploiter les tableaux détaillés pour amortissements, provisions, créances et dettes.', location: 'Comptabilité → Rapports → États Annexes', audience: financeAudience, intro: 'Les tableaux spécialisés détaillent les postes sensibles et facilitent les contrôles internes ou fiscaux.', steps: [['Ouvrir le tableau', 'Choisissez amortissements, provisions, créances ou dettes.'], ['Contrôler les lignes', 'Vérifiez montants, dates et pièces.'], ['Joindre les justificatifs', 'Ajoutez les pièces au dossier comptable.']], related: ['comptabilite-rapports-annexes'], keywords: ['tableaux', 'créances', 'dettes', 'justificatifs'] }),
  makeArticle({ id: 'comptabilite-rapports-export', title: 'Exporter les états financiers', objective: 'Télécharger les rapports financiers au format PDF ou Excel.', location: 'Comptabilité → Rapports', audience: financeAudience, intro: 'Les exports d’états financiers utilisent l’exercice, la devise et le format SYSCOHADA configurés.', steps: [['Sélectionner le rapport', 'Choisissez bilan, résultat, flux ou annexes.'], ['Choisir le format', 'PDF pour impression, Excel pour analyse.'], ['Archiver l’export', 'Conservez le fichier avec la période et les filtres.']], callouts: [{ type: 'info', text: 'Les exports doivent respecter la devise et le format régional du tenant.' }], related: ['comptabilite-configuration-devises'], keywords: ['export', 'PDF', 'Excel', 'états financiers'] }),
];

const auditArticles = [
  makeArticle({ id: 'comptabilite-audit-pistes', title: 'Consulter les pistes d’audit', objective: 'Retrouver les actions sensibles réalisées sur les données comptables.', location: 'Comptabilité → Audit → Pistes d’Audit', audience: auditAudience, intro: 'Les pistes d’audit affichent utilisateur, action, table, enregistrement, IP, statut, filtres et export CSV.', steps: [['Filtrer les actions', 'Utilisez utilisateur, période, table ou statut.'], ['Ouvrir le détail', 'Contrôlez l’enregistrement concerné et l’adresse IP.'], ['Exporter si nécessaire', 'Téléchargez le CSV pour audit externe.']], related: ['comptabilite-journal-workflow-validation'], keywords: ['audit', 'piste', 'utilisateur', 'CSV'] }),
  makeArticle({ id: 'comptabilite-audit-securite', title: 'Suivre les alertes de sécurité comptable', objective: 'Identifier et résoudre les alertes de sécurité liées aux données financières.', location: 'Comptabilité → Audit → Sécurité', audience: auditAudience, intro: 'Les alertes de sécurité indiquent gravité, résolution, scan sécurité et contrôles à effectuer.', steps: [['Lire la gravité', 'Priorisez critique, élevée, moyenne ou faible.'], ['Analyser l’alerte', 'Identifiez action, utilisateur et impact.'], ['Marquer la résolution', 'Documentez la correction effectuée.']], related: ['comptabilite-audit-rapports'], keywords: ['sécurité', 'alerte', 'gravité', 'résolution'] }),
  makeArticle({ id: 'comptabilite-audit-permissions', title: 'Vérifier les permissions comptables', objective: 'Contrôler les accès et la séparation des responsabilités.', location: 'Comptabilité → Audit → Permissions', audience: auditAudience, intro: 'Le contrôle des permissions vérifie accès, sessions, utilisateurs et séparation des responsabilités comptables.', steps: [['Lister les accès', 'Contrôlez les utilisateurs ayant accès comptable.'], ['Vérifier les rôles', 'Assurez-vous que les rôles sont stockés dans une table dédiée.'], ['Corriger les écarts', 'Retirez les accès non justifiés.']], callouts: [{ type: 'warning', text: 'Les rôles ne doivent jamais être stockés sur les profils ou utilisateurs.' }], related: ['comptabilite-audit-securite'], keywords: ['permissions', 'rôles', 'séparation', 'accès'] }),
  makeArticle({ id: 'comptabilite-audit-conformite', title: 'Contrôler la conformité comptable', objective: 'Vérifier le respect des règles internes, fiscales et SYSCOHADA.', location: 'Comptabilité → Audit → Conformité', audience: auditAudience, intro: 'La conformité comptable regroupe contrôles, statuts, échéances et corrections attendues.', steps: [['Lancer le contrôle', 'Exécutez ou consultez les contrôles disponibles.'], ['Lire les statuts', 'Repérez conforme, avertissement ou non conforme.'], ['Traiter les corrections', 'Corrigez les points bloquants.']], related: ['comptabilite-fiscal-conformite'], keywords: ['conformité', 'SYSCOHADA', 'contrôle', 'correction'] }),
  makeArticle({ id: 'comptabilite-audit-sauvegarde', title: 'Suivre les sauvegardes comptables', objective: 'Contrôler l’existence et le statut des sauvegardes comptables.', location: 'Comptabilité → Audit → Sauvegarde', audience: auditAudience, intro: 'Le suivi des sauvegardes affiche historique, statut et possibilité de création manuelle.', steps: [['Lire l’historique', 'Contrôlez dates, statut et taille.'], ['Créer une sauvegarde', 'Lancez une sauvegarde manuelle si nécessaire.'], ['Documenter le contrôle', 'Conservez la preuve dans le dossier d’audit.']], related: ['comptabilite-audit-rapports'], keywords: ['sauvegarde', 'historique', 'statut', 'audit'] }),
  makeArticle({ id: 'comptabilite-audit-rapports', title: 'Générer les rapports d’audit', objective: 'Produire les rapports d’audit complet, connexions, conformité ou risques.', location: 'Comptabilité → Audit → Rapports', audience: auditAudience, intro: 'Les rapports d’audit consolident pistes, sécurité, connexions, conformité et risques au format exploitable.', steps: [['Choisir le rapport', 'Audit complet, connexions, conformité ou risques.'], ['Appliquer la période', 'Sélectionnez les dates et périmètres.'], ['Exporter le PDF', 'Conservez le rapport avec les justificatifs.']], related: ['comptabilite-audit-pistes', 'comptabilite-bancaire-rapprochement'], keywords: ['rapport audit', 'risques', 'PDF', 'conformité'] }),
];

const integrationsArticles = [
  makeArticle({ id: 'comptabilite-integrations-modules', title: 'Synchroniser les modules internes', objective: 'Comprendre la synchronisation entre Comptabilité, Stock, Ventes, Personnel et Partenaires.', location: 'Comptabilité → Intégrations → Modules Internes', audience: ['Administrateurs', 'Comptables'], intro: 'Les intégrations internes synchronisent ventes, stock, personnel et partenaires avec les écritures comptables.', steps: [['Consulter les modules', 'Vérifiez statut, auto-sync et dernière synchronisation.'], ['Lancer une synchronisation', 'Déclenchez une mise à jour si nécessaire.'], ['Analyser les erreurs', 'Ouvrez les logs en cas d’échec.']], related: ['comptabilite-journal-generation-automatique'], keywords: ['intégration', 'synchronisation', 'modules', 'auto-sync'] }),
  makeArticle({ id: 'comptabilite-integrations-externes', title: 'Configurer les intégrations externes', objective: 'Connecter les services externes utiles à la comptabilité.', location: 'Comptabilité → Intégrations → Intégrations Externes', audience: ['Administrateurs', 'Comptables'], intro: 'Les intégrations externes peuvent couvrir banque, comptabilité, taxe, social ou ERP avec test de connexion.', steps: [['Choisir le service', 'Sélectionnez banque, taxe, social ou ERP.'], ['Renseigner la configuration', 'Ajoutez paramètres et identifiants via un canal sécurisé.'], ['Tester la connexion', 'Vérifiez le statut avant activation.']], related: ['comptabilite-bancaire-configuration'], keywords: ['intégration externe', 'banque', 'ERP', 'test'] }),
  makeArticle({ id: 'comptabilite-integrations-fec', title: 'Générer l’export FEC', objective: 'Produire un fichier d’écritures comptables exploitable pour contrôle.', location: 'Comptabilité → Intégrations → Export FEC', audience: financeAudience, intro: 'L’export FEC sélectionne une période, un format TXT/XLSX/XML et peut inclure les informations analytiques.', steps: [['Choisir la période', 'Sélectionnez l’exercice ou les dates.'], ['Choisir le format', 'TXT, XLSX ou XML selon le besoin.'], ['Télécharger le fichier', 'Archivez ou supprimez selon la politique interne.']], related: ['comptabilite-journaux-ecritures', 'comptabilite-audit-pistes'], keywords: ['FEC', 'export', 'écritures', 'TXT'] }),
  makeArticle({ id: 'comptabilite-integrations-api-webhooks', title: 'Configurer API et webhooks comptables', objective: 'Définir les événements comptables envoyés à des systèmes externes.', location: 'Comptabilité → Intégrations → API & Webhooks', audience: ['Administrateurs'], intro: 'Les webhooks comptables définissent URL, événements, retry, timeout, test et paramètres de sécurité.', steps: [['Définir l’URL', 'Renseignez le point de terminaison sécurisé.'], ['Choisir les événements', 'Sélectionnez facture, paiement, écriture ou rapprochement.'], ['Tester le webhook', 'Validez réponse, retry et timeout.']], callouts: [{ type: 'warning', text: 'Ne stockez jamais de secret privé directement dans le code.' }], related: ['comptabilite-integrations-monitoring'], keywords: ['API', 'webhook', 'événement', 'sécurité'] }),
  makeArticle({ id: 'comptabilite-integrations-monitoring', title: 'Surveiller les synchronisations comptables', objective: 'Suivre statuts, erreurs, relances manuelles et logs d’intégration.', location: 'Comptabilité → Intégrations', audience: ['Administrateurs', 'Comptables'], intro: 'Le monitoring d’intégration permet de détecter les synchronisations en erreur et de relancer les flux comptables.', steps: [['Lire les statuts', 'Repérez succès, attente ou erreur.'], ['Ouvrir les logs', 'Identifiez message et module concerné.'], ['Relancer manuellement', 'Redémarrez le flux après correction.']], related: ['comptabilite-integrations-modules', 'comptabilite-integrations-api-webhooks'], keywords: ['monitoring', 'logs', 'erreur', 'synchronisation'] }),
];

const configurationArticles = [
  makeArticle({ id: 'comptabilite-configuration-generale', title: 'Configurer les paramètres généraux comptables', objective: 'Définir les options globales de la comptabilité.', location: 'Comptabilité → Configuration → Général', audience: ['Administrateurs', 'Comptables'], intro: 'Les paramètres généraux couvrent plan OHADA, lettrage automatique, TVA synchronisée et centime additionnel.', steps: [['Vérifier le plan', 'Confirmez SYSCOHADA/OHADA.'], ['Activer les automatismes', 'Configurez lettrage, TVA et contrôles.'], ['Enregistrer les paramètres', 'Appliquez avant production comptable.']], related: ['comptabilite-configuration-comptes-defaut'], keywords: ['configuration', 'général', 'OHADA', 'lettrage'] }),
  makeArticle({ id: 'comptabilite-configuration-exercices', title: 'Gérer les exercices comptables', objective: 'Créer et maintenir les exercices ouverts ou fermés.', location: 'Comptabilité → Configuration → Exercices', audience: ['Administrateurs', 'Comptables'], intro: 'Les exercices définissent dates, statut ouvert/fermé et règles de modification ou suppression.', steps: [['Créer l’exercice', 'Renseignez dates de début et fin.'], ['Contrôler le statut', 'Ouvrez ou fermez selon la période comptable.'], ['Protéger les périodes closes', 'Évitez toute modification hors procédure.']], related: ['comptabilite-journal-workflow-validation'], keywords: ['exercice', 'ouvert', 'fermé', 'période'] }),
  makeArticle({ id: 'comptabilite-configuration-entreprise', title: 'Renseigner les informations de l’entreprise', objective: 'Maintenir les informations légales reprises dans les exports.', location: 'Comptabilité → Configuration → Entreprise', audience: ['Administrateurs', 'Comptables'], intro: 'Les informations de l’entreprise alimentent rapports, factures, exports et documents officiels.', steps: [['Renseigner l’identité', 'Complétez nom, coordonnées et informations légales.'], ['Vérifier les identifiants', 'Contrôlez références fiscales ou administratives.'], ['Tester un export', 'Assurez-vous que les données apparaissent correctement.']], related: ['comptabilite-rapports-export'], keywords: ['entreprise', 'mentions légales', 'coordonnées', 'exports'] }),
  makeArticle({ id: 'comptabilite-configuration-journaux', title: 'Configurer les journaux comptables', objective: 'Créer et paramétrer les journaux utilisés par les écritures.', location: 'Comptabilité → Configuration → Journaux', audience: ['Administrateurs', 'Comptables'], intro: 'La configuration des journaux précise code, type, libellé, description, statut et génération automatique.', steps: [['Créer le journal', 'Renseignez code, type et libellé.'], ['Activer selon l’usage', 'Désactivez les journaux inutilisés.'], ['Associer aux automatismes', 'Vérifiez leur usage dans ventes, banque, caisse ou achats.']], related: ['comptabilite-journal-journaux-types', 'comptabilite-journal-generation-automatique'], keywords: ['journaux', 'configuration', 'code', 'automatique'] }),
  makeArticle({ id: 'comptabilite-configuration-numerotation', title: 'Configurer les règles de numérotation', objective: 'Définir les formats de numéros pour factures, avoirs et pièces comptables.', location: 'Comptabilité → Configuration → Numérotation', audience: ['Administrateurs', 'Comptables'], intro: 'Les règles de numérotation gèrent variables, format, remise à zéro et aperçu avant utilisation.', steps: [['Choisir le type', 'Facture, avoir ou pièce comptable.'], ['Définir le format', 'Ajoutez préfixe, année, séquence ou variables.'], ['Tester l’aperçu', 'Contrôlez le prochain numéro généré.']], related: ['comptabilite-factures-vue-ensemble'], keywords: ['numérotation', 'facture', 'avoir', 'séquence'] }),
  makeArticle({ id: 'comptabilite-configuration-devises', title: 'Gérer les devises et taux de change', objective: 'Configurer la devise de base et les taux utilisés dans les rapports.', location: 'Comptabilité → Configuration → Devises', audience: ['Administrateurs', 'Comptables'], intro: 'La gestion des devises contrôle devise de base, devises actives, taux, date et mise à jour automatique.', steps: [['Définir la devise de base', 'Sélectionnez la devise principale du tenant.'], ['Ajouter un taux', 'Renseignez devise, taux et date.'], ['Contrôler les exports', 'Vérifiez la devise affichée dans rapports et factures.']], related: ['comptabilite-plan-configuration-regionale'], keywords: ['devise', 'taux de change', 'FCFA', 'exports'] }),
  makeArticle({ id: 'comptabilite-configuration-comptes-defaut', title: 'Vérifier les comptes par défaut', objective: 'Associer les comptes nécessaires aux écritures automatiques.', location: 'Comptabilité → Configuration', audience: ['Administrateurs', 'Comptables'], intro: 'Les comptes par défaut alimentent ventes, achats, caisse, banque, salaires, CNSS et tiers lors des automatismes comptables.', steps: [['Lister les événements', 'Ventes, règlements, achats, salaires et clôtures.'], ['Associer débit/crédit', 'Renseignez compte débit, compte crédit et journal.'], ['Tester la génération', 'Validez une opération métier et contrôlez l’écriture.']], callouts: [{ type: 'warning', text: 'Une configuration manquante peut empêcher la génération automatique correcte des écritures.' }, { type: 'info', text: 'Les écritures métiers s’appuient sur accounting_default_accounts.' }], related: ['comptabilite-journal-generation-automatique', 'comptabilite-plan-import-syscohada'], keywords: ['comptes par défaut', 'automatisation', 'débit', 'crédit'] }),
];

export const comptabiliteModule: GuideModule = {
  id: 'comptabilite',
  title: 'Comptabilité',
  tagline: 'Suivre les journaux, factures, règlements, TVA et écritures SYSCOHADA.',
  description: 'La comptabilité PharmaSoft automatise les écritures métier tout en respectant les exigences SYSCOHADA adaptées au contexte Congo.',
  icon: Calculator,
  accent: 'warning',
  sections: [
    { id: 'comptabilite-pilotage', title: 'Pilotage comptable', icon: Activity, articles: pilotageArticles },
    { id: 'comptabilite-plan-comptable', title: 'Plan comptable SYSCOHADA', icon: BookOpen, articles: planArticles },
    { id: 'comptabilite-journalisation', title: 'Journalisation et écritures', icon: ClipboardCheck, articles: journalArticles },
    { id: 'comptabilite-facturation', title: 'Facturation comptable', icon: Receipt, articles: facturationArticles },
    { id: 'comptabilite-paiements', title: 'Paiements et règlements', icon: CreditCard, articles: paiementsArticles },
    { id: 'comptabilite-paie', title: 'Paie comptable', icon: Wallet, articles: paieArticles },
    { id: 'comptabilite-analytique', title: 'Comptabilité analytique', icon: Layers3, articles: analytiqueArticles },
    { id: 'comptabilite-fiscalite', title: 'Fiscalité et déclarations', icon: FileCheck2, articles: fiscalArticles },
    { id: 'comptabilite-banque', title: 'Banque et trésorerie', icon: Landmark, articles: bancaireArticles },
    { id: 'comptabilite-rapports', title: 'États financiers et rapports', icon: BarChart3, articles: rapportsArticles },
    { id: 'comptabilite-audit', title: 'Audit et sécurité', icon: ShieldCheck, articles: auditArticles },
    { id: 'comptabilite-integrations', title: 'Intégrations système', icon: Network, articles: integrationsArticles },
    { id: 'comptabilite-configuration', title: 'Configuration comptable', icon: Settings2, articles: configurationArticles },
  ],
};
