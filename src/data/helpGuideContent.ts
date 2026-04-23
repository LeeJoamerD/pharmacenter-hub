export interface HelpGuideCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  articles: HelpGuideArticle[];
}

export interface HelpGuideArticle {
  id: string;
  title: string;
  content: string;
  steps?: string[];
  tips?: string[];
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  items: TrainingItem[];
}

export interface TrainingItem {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'article' | 'interactive';
}

export const helpGuideCategories: HelpGuideCategory[] = [
  {
    id: 'getting-started',
    title: 'Prise en main',
    icon: 'Rocket',
    description: 'Premiers pas avec PharmaSoft',
    articles: [
      {
        id: 'gs-1',
        title: 'Se connecter pour la première fois',
        content: 'Lors de votre première connexion, utilisez l\'email et le mot de passe temporaire fournis par votre administrateur. Vous serez invité à changer votre mot de passe.',
        steps: [
          'Accédez à l\'URL de votre pharmacie',
          'Saisissez votre adresse email professionnelle',
          'Entrez le mot de passe temporaire reçu',
          'Créez un nouveau mot de passe sécurisé (8 caractères minimum)',
          'Confirmez votre nouveau mot de passe',
        ],
        tips: [
          'Utilisez un mot de passe comportant des lettres, chiffres et caractères spéciaux',
          'Ne partagez jamais vos identifiants avec d\'autres personnes',
        ],
      },
      {
        id: 'gs-2',
        title: 'Naviguer dans l\'application',
        content: 'L\'interface de PharmaSoft est organisée autour d\'une barre latérale (sidebar) à gauche qui vous permet d\'accéder à tous les modules. Le contenu principal s\'affiche dans la zone centrale.',
        steps: [
          'La barre latérale gauche contient tous les modules disponibles',
          'Cliquez sur un module pour l\'ouvrir (ex : Stock, Ventes, Comptabilité)',
          'L\'en-tête affiche le nom du module actif, vos informations et le bouton d\'aide',
          'Utilisez le bouton ☰ pour réduire ou agrandir la barre latérale',
        ],
        tips: [
          'Raccourci clavier : Ctrl+H pour ouvrir l\'aide à tout moment',
          'Les modules sont regroupés par catégorie pour faciliter la navigation',
        ],
      },
      {
        id: 'gs-3',
        title: 'Comprendre le tableau de bord',
        content: 'Le tableau de bord est votre page d\'accueil. Il affiche un résumé de l\'activité de votre pharmacie : ventes du jour, état du stock, alertes et indicateurs clés de performance.',
        steps: [
          'Les widgets en haut montrent les chiffres clés (CA, nombre de ventes, marge)',
          'Les graphiques présentent l\'évolution des ventes et du stock',
          'Les alertes signalent les actions urgentes (ruptures de stock, ordonnances en attente)',
          'Cliquez sur un widget pour accéder au détail correspondant',
        ],
      },
    ],
  },
  {
    id: 'dashboard',
    title: 'Tableau de bord',
    icon: 'LayoutDashboard',
    description: 'Vue d\'ensemble et indicateurs clés',
    articles: [
      {
        id: 'db-1',
        title: 'Les indicateurs clés (KPI)',
        content: 'Le tableau de bord affiche vos indicateurs clés de performance en temps réel. Vous pouvez consulter le chiffre d\'affaires, le nombre de ventes, la marge brute et le panier moyen.',
        tips: [
          'Les données se mettent à jour automatiquement',
          'Survolez un indicateur pour voir le détail',
          'Les flèches vertes/rouges indiquent la tendance par rapport à la période précédente',
        ],
      },
      {
        id: 'db-2',
        title: 'Les graphiques et tendances',
        content: 'Les graphiques vous permettent de visualiser l\'évolution de votre activité sur différentes périodes (jour, semaine, mois). Vous pouvez comparer les performances et identifier les tendances.',
      },
      {
        id: 'db-3',
        title: 'Les alertes et notifications',
        content: 'Le système d\'alertes vous informe des événements importants : stocks bas, produits proches de la péremption, objectifs atteints ou non. Les alertes critiques apparaissent en rouge.',
      },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    icon: 'Settings2',
    description: 'Gestion du personnel, partenaires et référentiels',
    articles: [
      {
        id: 'admin-1',
        title: 'Gérer le personnel',
        content: 'Le module Personnel vous permet d\'ajouter, modifier et gérer les employés de votre pharmacie. Chaque membre du personnel dispose d\'un profil avec ses informations, son rôle et ses droits d\'accès.',
        steps: [
          'Accédez au module Administration > Personnel',
          'Cliquez sur "Ajouter un employé" pour créer un nouveau profil',
          'Renseignez les informations obligatoires (nom, prénom, email, rôle)',
          'Définissez les droits d\'accès selon le poste',
          'Enregistrez le profil — un email d\'invitation sera envoyé automatiquement',
        ],
      },
      {
        id: 'admin-2',
        title: 'Gérer les partenaires et fournisseurs',
        content: 'Enregistrez vos fournisseurs, laboratoires et autres partenaires commerciaux. Vous pourrez ensuite les associer aux commandes, réceptions et produits.',
        steps: [
          'Accédez à Administration > Partenaires',
          'Cliquez sur "Nouveau partenaire"',
          'Sélectionnez le type (fournisseur, laboratoire, grossiste)',
          'Renseignez les coordonnées et conditions commerciales',
          'Enregistrez',
        ],
      },
      {
        id: 'admin-3',
        title: 'Gérer les référentiels',
        content: 'Les référentiels contiennent les données de base de votre pharmacie : DCI (dénominations communes internationales), formes pharmaceutiques, classes thérapeutiques, familles de produits et rayons.',
        steps: [
          'Accédez à Administration > Référentiels',
          'Sélectionnez le référentiel à gérer (DCI, Formes, Classes, etc.)',
          'Utilisez les boutons Ajouter, Modifier, Supprimer selon vos besoins',
          'Les référentiels sont utilisés dans tout le système (produits, ventes, rapports)',
        ],
        tips: [
          'Les référentiels peuvent être clonés depuis un tenant source via la fonction dédiée',
          'Vérifiez la cohérence des données avant d\'importer un catalogue',
        ],
      },
      {
        id: 'admin-4',
        title: 'Gérer les clients',
        content: 'Le fichier clients vous permet de suivre vos patients et clients fidèles. Enregistrez leurs informations pour la fidélité, les ordonnances et le suivi personnalisé.',
        steps: [
          'Accédez à Administration > Clients',
          'Cliquez sur "Nouveau client" pour ajouter un patient',
          'Renseignez les informations (nom, téléphone, assurance, etc.)',
          'Le client sera disponible lors de la vente pour le suivi et la fidélité',
        ],
      },
    ],
  },
  {
    id: 'stock',
    title: 'Gestion du stock',
    icon: 'Package',
    description: 'Stock actuel, réceptions, inventaires et transferts',
    articles: [
      {
        id: 'stock-1',
        title: 'Consulter le stock actuel',
        content: 'La vue "Stock actuel" affiche l\'ensemble des produits en stock avec leurs quantités, prix, dates de péremption et niveaux d\'alerte. Vous pouvez filtrer, rechercher et exporter les données.',
        steps: [
          'Accédez au module Stock > Stock actuel',
          'Utilisez la barre de recherche pour trouver un produit',
          'Filtrez par famille, rayon, laboratoire ou état de stock',
          'Cliquez sur un produit pour voir ses détails (lots, mouvements, historique)',
        ],
        tips: [
          'Les produits en rupture apparaissent en rouge',
          'Les produits sous le seuil d\'alerte apparaissent en orange',
          'Exportez en Excel pour une analyse approfondie',
        ],
      },
      {
        id: 'stock-2',
        title: 'Réceptionner des produits',
        content: 'La réception permet d\'enregistrer l\'entrée de marchandises suite à une commande fournisseur. Chaque réception met à jour automatiquement les quantités en stock.',
        steps: [
          'Accédez à Stock > Réceptions',
          'Cliquez sur "Nouvelle réception"',
          'Sélectionnez le fournisseur et le bon de livraison',
          'Scannez ou ajoutez les produits reçus avec leurs quantités et lots',
          'Vérifiez les prix d\'achat et validez la réception',
        ],
      },
      {
        id: 'stock-3',
        title: 'Réaliser un inventaire',
        content: 'L\'inventaire permet de vérifier et ajuster les quantités physiques par rapport aux quantités théoriques du système. Il est recommandé de réaliser un inventaire régulièrement.',
        steps: [
          'Accédez à Stock > Inventaire',
          'Créez une nouvelle session d\'inventaire',
          'Sélectionnez les rayons ou familles à inventorier',
          'Saisissez les quantités comptées pour chaque produit',
          'Validez l\'inventaire pour appliquer les ajustements automatiquement',
        ],
      },
      {
        id: 'stock-4',
        title: 'Transférer des produits',
        content: 'Si vous gérez plusieurs points de vente ou dépôts, le transfert de stock permet de déplacer des produits d\'un emplacement à un autre avec traçabilité complète.',
      },
    ],
  },
  {
    id: 'sales',
    title: 'Ventes',
    icon: 'ShoppingCart',
    description: 'Point de vente, encaissement, ordonnances et fidélité',
    articles: [
      {
        id: 'sales-1',
        title: 'Réaliser une vente',
        content: 'Le module de vente (Point de Vente) est l\'interface principale pour enregistrer les transactions. Il est conçu pour être rapide et intuitif.',
        steps: [
          'Accédez à Ventes > Point de vente',
          'Scannez le code-barres du produit ou recherchez-le par nom',
          'Ajustez la quantité si nécessaire',
          'Sélectionnez le client (optionnel, pour la fidélité)',
          'Choisissez le mode de paiement (espèces, carte, mobile money)',
          'Validez la vente et imprimez le ticket si besoin',
        ],
        tips: [
          'Utilisez le scanner de code-barres pour accélérer la saisie',
          'Vous pouvez mettre une vente en attente et la reprendre plus tard',
          'Les remises peuvent être appliquées par ligne ou sur le total',
        ],
      },
      {
        id: 'sales-2',
        title: 'Gérer les ordonnances',
        content: 'Les ventes sur ordonnance permettent d\'associer une prescription médicale à la transaction. Le système vérifie les interactions médicamenteuses et calcule les prises en charge.',
        steps: [
          'Lors d\'une vente, activez le mode "Ordonnance"',
          'Saisissez les informations du prescripteur',
          'Ajoutez les produits prescrits avec les posologies',
          'Le système vérifie automatiquement les interactions',
          'Appliquez la prise en charge assurance si applicable',
        ],
      },
      {
        id: 'sales-3',
        title: 'Encaissement et modes de paiement',
        content: 'PharmaSoft supporte plusieurs modes de paiement : espèces, carte bancaire, mobile money, crédit client et paiement mixte.',
      },
      {
        id: 'sales-4',
        title: 'Retours et avoirs',
        content: 'En cas de retour de produit, vous pouvez créer un avoir qui sera déduit de la prochaine vente du client ou remboursé directement.',
        steps: [
          'Accédez à Ventes > Retours',
          'Recherchez la vente d\'origine par numéro de ticket ou date',
          'Sélectionnez les produits à retourner',
          'Choisissez le mode de remboursement (avoir ou espèces)',
          'Validez le retour — le stock est mis à jour automatiquement',
        ],
      },
      {
        id: 'sales-5',
        title: 'Programme de fidélité',
        content: 'Le programme de fidélité récompense vos clients réguliers. Les points sont accumulés à chaque achat et peuvent être convertis en réductions.',
      },
    ],
  },
  {
    id: 'accounting',
    title: 'Comptabilité',
    icon: 'Calculator',
    description: 'Journaux, plan comptable et salaires',
    articles: [
      {
        id: 'acct-1',
        title: 'Vue d\'ensemble de la comptabilité',
        content: 'Le module comptabilité vous offre une gestion complète de vos écritures comptables, journaux et plan comptable, conforme aux normes OHADA.',
      },
      {
        id: 'acct-2',
        title: 'Gérer les journaux comptables',
        content: 'Les journaux comptables regroupent les écritures par nature (achats, ventes, banque, caisse, opérations diverses). Chaque écriture est automatiquement associée au journal correspondant.',
        steps: [
          'Accédez à Comptabilité > Journaux',
          'Sélectionnez le journal souhaité',
          'Consultez les écritures ou ajoutez-en de nouvelles',
          'Les écritures de ventes et achats sont générées automatiquement',
        ],
      },
      {
        id: 'acct-3',
        title: 'Plan comptable',
        content: 'Le plan comptable liste tous les comptes utilisés par votre pharmacie. Il est pré-configuré selon les normes du pays et peut être personnalisé.',
      },
      {
        id: 'acct-4',
        title: 'Gestion des salaires',
        content: 'Le sous-module Salaires permet de gérer la paie de vos employés, les charges sociales et les déclarations associées.',
      },
    ],
  },
  {
    id: 'reports',
    title: 'Rapports',
    icon: 'BarChart3',
    description: 'Génération et export de rapports',
    articles: [
      {
        id: 'rpt-1',
        title: 'Générer un rapport',
        content: 'PharmaSoft propose de nombreux rapports prédéfinis : rapport de ventes, état du stock, marges, performances par employé, analyse ABC, etc.',
        steps: [
          'Accédez au module Rapports',
          'Sélectionnez le type de rapport souhaité',
          'Définissez la période et les filtres',
          'Cliquez sur "Générer" pour afficher le rapport',
          'Exportez en PDF ou Excel si nécessaire',
        ],
      },
      {
        id: 'rpt-2',
        title: 'Exporter des données',
        content: 'Tous les rapports et listes de données peuvent être exportés aux formats PDF et Excel. Utilisez le bouton d\'export disponible dans chaque vue.',
      },
    ],
  },
  {
    id: 'ai-assistant',
    title: 'Assistant IA',
    icon: 'Bot',
    description: 'Utilisation de l\'assistant intelligent',
    articles: [
      {
        id: 'ai-1',
        title: 'Poser une question à l\'assistant',
        content: 'L\'Assistant IA est un chatbot intelligent qui peut répondre à vos questions sur la gestion de la pharmacie, analyser vos données et vous fournir des recommandations.',
        steps: [
          'Accédez au module Assistant IA',
          'Tapez votre question dans la zone de saisie',
          'L\'assistant analyse le contexte et vous fournit une réponse détaillée',
          'Vous pouvez poser des questions de suivi pour approfondir',
        ],
        tips: [
          'Posez des questions précises pour obtenir de meilleures réponses',
          'L\'assistant peut analyser vos données de vente, stock et comptabilité',
          'Utilisez-le pour des recommandations de réapprovisionnement',
        ],
      },
      {
        id: 'ai-2',
        title: 'Diagnostic automatique',
        content: 'L\'IA peut réaliser un diagnostic complet de votre pharmacie en analysant les ventes, marges, stock et clients. Le résultat est un score global avec des recommandations d\'amélioration.',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Paramètres',
    icon: 'Cog',
    description: 'Configuration de l\'interface et du système',
    articles: [
      {
        id: 'set-1',
        title: 'Paramètres de l\'interface',
        content: 'Personnalisez l\'apparence de votre application : thème clair/sombre, langue, format de date, devise et affichage des notifications.',
        steps: [
          'Accédez à Paramètres > Interface',
          'Choisissez le thème (clair, sombre ou automatique)',
          'Sélectionnez la langue de l\'interface',
          'Configurez le format de date et la devise',
          'Enregistrez vos préférences',
        ],
      },
      {
        id: 'set-2',
        title: 'Paramètres du système',
        content: 'Les paramètres système concernent la configuration globale de votre pharmacie : informations légales, numérotation des documents, TVA, modes de paiement acceptés et politiques de stock.',
      },
    ],
  },
];

export const trainingModules: TrainingModule[] = [
  {
    id: 'basics',
    title: 'Découvrir PharmaSoft',
    description: 'Apprenez les bases de l\'application',
    items: [
      { id: 'tr-1', title: 'Qu\'est-ce que PharmaSoft ?', duration: '3 min', type: 'article' },
      { id: 'tr-2', title: 'Premiers pas après la connexion', duration: '5 min', type: 'article' },
      { id: 'tr-3', title: 'Comprendre l\'interface', duration: '4 min', type: 'article' },
      { id: 'tr-4', title: 'Les raccourcis clavier utiles', duration: '2 min', type: 'article' },
    ],
  },
  {
    id: 'sales-training',
    title: 'Maîtriser les ventes',
    description: 'Tout savoir sur le point de vente',
    items: [
      { id: 'tr-5', title: 'Créer une vente simple', duration: '5 min', type: 'interactive' },
      { id: 'tr-6', title: 'Gérer les ordonnances', duration: '7 min', type: 'article' },
      { id: 'tr-7', title: 'Appliquer des remises', duration: '3 min', type: 'article' },
      { id: 'tr-8', title: 'Encaisser un paiement mixte', duration: '4 min', type: 'article' },
      { id: 'tr-9', title: 'Gérer un retour produit', duration: '4 min', type: 'article' },
    ],
  },
  {
    id: 'stock-training',
    title: 'Gérer le stock efficacement',
    description: 'Réceptions, inventaires et alertes',
    items: [
      { id: 'tr-10', title: 'Réceptionner une commande', duration: '6 min', type: 'interactive' },
      { id: 'tr-11', title: 'Réaliser un inventaire', duration: '8 min', type: 'article' },
      { id: 'tr-12', title: 'Configurer les alertes de stock', duration: '3 min', type: 'article' },
      { id: 'tr-13', title: 'Analyser les mouvements de stock', duration: '5 min', type: 'article' },
    ],
  },
  {
    id: 'accounting-training',
    title: 'Comptabilité et rapports',
    description: 'Gérer vos comptes et générer des rapports',
    items: [
      { id: 'tr-14', title: 'Lire le tableau de bord comptable', duration: '5 min', type: 'article' },
      { id: 'tr-15', title: 'Créer une écriture comptable', duration: '6 min', type: 'article' },
      { id: 'tr-16', title: 'Générer un rapport de ventes', duration: '4 min', type: 'article' },
      { id: 'tr-17', title: 'Exporter des données en Excel', duration: '3 min', type: 'article' },
    ],
  },
  {
    id: 'admin-training',
    title: 'Administration avancée',
    description: 'Personnel, référentiels et paramètres',
    items: [
      { id: 'tr-18', title: 'Ajouter un nouvel employé', duration: '4 min', type: 'article' },
      { id: 'tr-19', title: 'Gérer les droits d\'accès', duration: '5 min', type: 'article' },
      { id: 'tr-20', title: 'Importer un catalogue de produits', duration: '7 min', type: 'article' },
      { id: 'tr-21', title: 'Configurer les paramètres système', duration: '6 min', type: 'article' },
    ],
  },
];
