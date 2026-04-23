import { Package, LayoutDashboard, ShoppingCart, Boxes, Layers, ArrowLeftRight, ClipboardList, Bell, BarChart3, Tags, Settings2, Bot } from 'lucide-react';
import type { GuideArticle, GuideModule } from '../types';

const article = (data: GuideArticle): GuideArticle => data;

const stockAudience = ['Gestionnaires stock', 'Pharmaciens', 'Administrateurs'];

export const stockModule: GuideModule = {
  id: 'stock',
  title: 'Stock',
  tagline: 'Piloter les quantités, lots, réceptions, inventaires et étiquettes.',
  description: 'Le module Stock sécurise la disponibilité des produits, la traçabilité des lots et les opérations d’approvisionnement.',
  icon: Package,
  accent: 'success',
  sections: [
    {
      id: 'stock-pilotage',
      title: 'Pilotage du stock',
      description: 'Tableaux de bord, indicateurs, actions rapides et exports.',
      icon: LayoutDashboard,
      articles: [
        article({
          id: 'stock-dashboard-vue-ensemble',
          title: 'Comprendre la vue d’ensemble Stock',
          objective: 'Lire les indicateurs clés de stock et détecter rapidement les priorités opérationnelles.',
          location: 'Stock',
          audience: stockAudience,
          intro: 'La vue d’ensemble Stock consolide la valeur du stock, les produits disponibles, les ruptures, les alertes, les péremptions, les mouvements et la rotation pour piloter les décisions quotidiennes.',
          steps: [
            { title: 'Choisir la période', detail: 'Utilisez le filtre de période pour analyser les mouvements et la valorisation sur le bon intervalle.' },
            { title: 'Lire les KPI', detail: 'Contrôlez valeur stock, produits disponibles, ruptures, stock faible et alertes de péremption.' },
            { title: 'Analyser les graphiques', detail: 'Comparez la distribution, la valorisation par famille, les mouvements et la rotation.' },
            { title: 'Agir sur les priorités', detail: 'Ouvrez l’approvisionnement, l’inventaire ou les ajustements depuis les zones critiques.' },
            { title: 'Exporter si nécessaire', detail: 'Générez un export pour partager ou archiver les indicateurs.' }
          ],
          callouts: [
            { type: 'info', text: 'Les métriques sont filtrées par pharmacie et respectent l’isolation multi-tenant.' },
            { type: 'warning', text: 'La visibilité du dashboard dépend des permissions de l’utilisateur connecté.' }
          ],
          bestPractices: ['Traiter les ruptures avant les commandes non critiques.', 'Comparer la valorisation avec les analyses stock avant reporting financier.', 'Actualiser après une réception ou un inventaire important.'],
          related: ['stock-actuel-vue-temps-reel', 'stock-alertes-dashboard', 'stock-analyses-valorisation'],
          keywords: ['dashboard', 'KPI', 'valorisation', 'ruptures', 'stock']
        }),
        article({
          id: 'stock-dashboard-actions-rapides',
          title: 'Utiliser les actions rapides du stock',
          objective: 'Lancer rapidement les opérations fréquentes depuis la vue Stock.',
          location: 'Stock',
          audience: stockAudience,
          intro: 'Les actions rapides accélèrent les opérations urgentes : réapprovisionnement, inventaire, ajustement, consultation de rapports et actualisation des données.',
          steps: [
            { title: 'Identifier l’action utile', detail: 'Repérez si le besoin concerne une commande, un contrôle physique ou une correction.' },
            { title: 'Ouvrir le raccourci', detail: 'Sélectionnez l’action rapide correspondante dans le dashboard.' },
            { title: 'Compléter les informations', detail: 'Renseignez produit, fournisseur, quantité, motif ou session selon l’opération.' },
            { title: 'Valider et contrôler', detail: 'Revenez au dashboard pour vérifier l’impact sur les indicateurs.' }
          ],
          callouts: [{ type: 'tip', text: 'Utilisez ces raccourcis pour traiter immédiatement les produits critiques signalés par les alertes.' }],
          related: ['stock-approvisionnement-commandes', 'stock-inventaires-sessions', 'stock-mouvements-ajustements'],
          keywords: ['actions rapides', 'réapprovisionnement', 'inventaire', 'ajustement']
        }),
        article({
          id: 'stock-dashboard-export-rapports',
          title: 'Exporter les indicateurs du stock',
          objective: 'Produire un export fiable des indicateurs visibles dans le dashboard Stock.',
          location: 'Stock',
          audience: stockAudience,
          intro: 'L’export du dashboard rassemble les KPI, graphiques, mouvements et valorisations sur la période sélectionnée afin de faciliter le suivi interne.',
          steps: [
            { title: 'Définir la période', detail: 'Sélectionnez la période à communiquer ou archiver.' },
            { title: 'Contrôler les données visibles', detail: 'Vérifiez que les indicateurs affichés correspondent au périmètre attendu.' },
            { title: 'Lancer l’export', detail: 'Utilisez l’action d’export pour générer le fichier.' },
            { title: 'Comparer avec les analyses', detail: 'Rapprochez les montants des écrans Analyses lorsque le fichier sert au reporting.' }
          ],
          callouts: [{ type: 'info', text: 'Les montants suivent les paramètres régionaux et la devise configurés pour la pharmacie.' }],
          related: ['stock-analyses-valorisation', 'stock-analytics-rapports'],
          keywords: ['export', 'rapports', 'KPI', 'dashboard']
        })
      ]
    },
    {
      id: 'stock-approvisionnement',
      title: 'Approvisionnement',
      description: 'Commandes, réceptions, unités gratuites, fournisseurs et suivi logistique.',
      icon: ShoppingCart,
      articles: [
        article({
          id: 'stock-approvisionnement-liste-commandes',
          title: 'Suivre la liste des commandes fournisseurs',
          objective: 'Consulter et piloter les commandes fournisseurs en cours ou finalisées.',
          location: 'Stock → Approvisionnement → Liste des commandes',
          audience: stockAudience,
          intro: 'La liste des commandes présente les fournisseurs, statuts, dates, montants et nombre de produits réellement rattachés à chaque commande.',
          steps: [
            { title: 'Afficher les commandes', detail: 'Chargez la liste et vérifiez les statuts en attente, validés, reçus ou annulés.' },
            { title: 'Contrôler les lignes', detail: 'Consultez le nombre de produits et les informations de chaque commande.' },
            { title: 'Actualiser', detail: 'Rafraîchissez après création, modification ou réception.' },
            { title: 'Changer le statut si autorisé', detail: 'Appliquez les changements disponibles selon vos droits.' }
          ],
          callouts: [
            { type: 'info', text: 'Les compteurs de lignes doivent refléter les produits réellement liés à la commande.' },
            { type: 'warning', text: 'La suppression d’une commande peut perturber le suivi d’approvisionnement.' }
          ],
          related: ['stock-approvisionnement-commandes', 'stock-reception-fournisseur'],
          keywords: ['commandes', 'fournisseur', 'statut', 'approvisionnement']
        }),
        article({
          id: 'stock-approvisionnement-commandes',
          title: 'Créer une commande fournisseur',
          objective: 'Préparer une commande fournisseur à partir des besoins réels de stock.',
          location: 'Stock → Approvisionnement → Commandes',
          audience: stockAudience,
          intro: 'La création de commande permet de sélectionner un fournisseur, ajouter des produits, renseigner les quantités et utiliser les seuils pour proposer les besoins de réapprovisionnement.',
          steps: [
            { title: 'Choisir le fournisseur', detail: 'Sélectionnez un fournisseur actif et vérifiez ses informations.' },
            { title: 'Ajouter les produits', detail: 'Recherchez les produits par leur libelle_produit et ajoutez les lignes nécessaires.' },
            { title: 'Définir les quantités', detail: 'Renseignez manuellement les quantités ou utilisez la logique selon les seuils.' },
            { title: 'Contrôler les prix', detail: 'Vérifiez les prix d’achat proposés et les écarts éventuels.' },
            { title: 'Valider la commande', detail: 'Enregistrez la commande pour permettre son suivi puis sa réception.' }
          ],
          callouts: [
            { type: 'tip', text: 'Le switch “Quantité selon les Seuils” permet de proposer automatiquement les quantités à commander.' },
            { type: 'info', text: 'La quantité suggérée suit la logique max(1, stock_max - stock_actuel).' }
          ],
          bestPractices: ['Contrôler le stock visible avant validation.', 'Éviter les doublons de commande pour le même fournisseur.', 'Prioriser les ruptures et stocks faibles.'],
          related: ['stock-approvisionnement-liste-commandes', 'stock-reception-fournisseur', 'stock-approvisionnement-suivi-commandes'],
          keywords: ['commande', 'seuils', 'fournisseur', 'réapprovisionnement']
        }),
        article({
          id: 'stock-approvisionnement-modification-commandes',
          title: 'Modifier une commande fournisseur',
          objective: 'Corriger une commande avant réception ou clôture.',
          location: 'Stock → Approvisionnement → Modification',
          audience: stockAudience,
          intro: 'La modification de commande sert à ajuster fournisseur, lignes, quantités, prix ou statut avant que la commande n’impacte définitivement les opérations de réception.',
          steps: [
            { title: 'Rechercher la commande', detail: 'Sélectionnez la commande à corriger.' },
            { title: 'Modifier les lignes', detail: 'Ajoutez, retirez ou ajustez les produits et quantités.' },
            { title: 'Contrôler le statut', detail: 'Vérifiez que le statut reste cohérent avec l’avancement réel.' },
            { title: 'Valider les corrections', detail: 'Enregistrez puis contrôlez la liste des commandes.' }
          ],
          callouts: [{ type: 'warning', text: 'Ne modifiez pas une commande déjà rapprochée d’une réception sans contrôler l’impact opérationnel.' }],
          related: ['stock-approvisionnement-liste-commandes', 'stock-reception-fournisseur'],
          keywords: ['modification', 'commande', 'quantités', 'statut']
        }),
        article({
          id: 'stock-reception-fournisseur',
          title: 'Réceptionner une livraison fournisseur',
          objective: 'Intégrer une livraison au stock avec contrôle des quantités, prix, lots et dates de péremption.',
          location: 'Stock → Approvisionnement → Réceptions',
          audience: stockAudience,
          intro: 'La réception fournisseur transforme une livraison en mouvements de stock traçables, avec prix d’achat, prix de vente TTC, lots, dates de péremption, unités gratuites et mise à jour du stock.',
          steps: [
            { title: 'Sélectionner la commande ou créer une réception directe', detail: 'Démarrez depuis une commande existante lorsque possible.' },
            { title: 'Contrôler chaque ligne', detail: 'Comparez quantités livrées, quantités gratuites, prix d’achat et prix de vente TTC.' },
            { title: 'Renseigner les lots', detail: 'Saisissez numéro de lot, date de péremption et quantité par lot.' },
            { title: 'Saisir les unités gratuites', detail: 'Renseignez les UG sans modifier artificiellement le coût d’achat.' },
            { title: 'Valider la réception', detail: 'La validation met à jour le stock et conserve l’historique des entrées.' }
          ],
          callouts: [
            { type: 'warning', text: 'Ne validez qu’après rapprochement avec le bon de livraison.' },
            { type: 'tip', text: 'Les unités gratuites doivent refléter les bonus fournisseurs sans fausser le coût d’achat.' }
          ],
          bestPractices: ['Corriger les écarts avant validation finale.', 'Étiqueter les lots dès la réception.', 'Contrôler date_peremption et prix_vente_ttc.'],
          faq: [{ q: 'Puis-je supprimer une réception ?', a: 'Selon vos droits, l’historique permet une suppression intégrale contrôlée avec impact stock.' }],
          related: ['stock-etiquettes-receptions', 'stock-lots-suivi', 'stock-approvisionnement-historique-receptions'],
          keywords: ['réception', 'fournisseur', 'lots', 'prix_vente_ttc', 'UG']
        }),
        article({
          id: 'stock-approvisionnement-import-excel-reception',
          title: 'Importer une réception depuis Excel',
          objective: 'Créer ou compléter une réception fournisseur à partir d’un fichier Excel contrôlé.',
          location: 'Stock → Approvisionnement → Import Excel',
          audience: stockAudience,
          intro: 'L’import Excel accélère la saisie des réceptions volumineuses en rapprochant les produits, lots, prix et dates depuis un fichier structuré.',
          steps: [
            { title: 'Choisir le fournisseur', detail: 'Sélectionnez le fournisseur associé au fichier.' },
            { title: 'Importer le fichier', detail: 'Chargez le fichier Excel contenant produits, lots, prix et dates.' },
            { title: 'Vérifier le mapping', detail: 'Associez les colonnes attendues aux champs PharmaSoft.' },
            { title: 'Contrôler les erreurs', detail: 'Corrigez les lignes non rapprochées avant validation.' },
            { title: 'Valider l’intégration', detail: 'Intégrez les lignes en lots séquentiels pour sécuriser la mémoire.' }
          ],
          callouts: [
            { type: 'warning', text: 'Les imports volumineux doivent être traités par lots pour éviter les blocages mémoire.' },
            { type: 'info', text: 'Le rapprochement produit doit utiliser les champs corrects, notamment libelle_produit.' }
          ],
          related: ['stock-configuration-mapping-excel', 'stock-reception-fournisseur'],
          keywords: ['import Excel', 'réception', 'mapping', 'libelle_produit']
        }),
        article({
          id: 'stock-approvisionnement-unites-gratuites-saisie',
          title: 'Saisir les unités gratuites fournisseur',
          objective: 'Enregistrer les unités gratuites obtenues auprès d’un fournisseur.',
          location: 'Stock → Approvisionnement → Unités gratuites → Saisie des UG',
          audience: stockAudience,
          intro: 'La saisie des UG permet de documenter les avantages fournisseurs avec produit, fournisseur, quantités achetées, quantités gratuites et motif.',
          steps: [
            { title: 'Rechercher le produit', detail: 'Utilisez la recherche produit pour sélectionner la ligne concernée.' },
            { title: 'Choisir le fournisseur', detail: 'Associez l’UG au fournisseur réel.' },
            { title: 'Saisir les quantités', detail: 'Indiquez la quantité achetée et la quantité gratuite.' },
            { title: 'Renseigner le motif', detail: 'Documentez le contexte commercial.' },
            { title: 'Valider', detail: 'Enregistrez pour alimenter l’historique des UG.' }
          ],
          callouts: [
            { type: 'info', text: 'Les UG sont séparées de l’historique pour sécuriser le suivi.' },
            { type: 'tip', text: 'Un motif clair facilite l’analyse des avantages fournisseurs.' }
          ],
          related: ['stock-approvisionnement-unites-gratuites-historique', 'stock-reception-fournisseur'],
          keywords: ['UG', 'unités gratuites', 'fournisseur', 'avantage']
        }),
        article({
          id: 'stock-approvisionnement-unites-gratuites-historique',
          title: 'Consulter l’historique des unités gratuites',
          objective: 'Contrôler les unités gratuites enregistrées par produit, fournisseur et période.',
          location: 'Stock → Approvisionnement → Unités gratuites → Historique des UG',
          audience: stockAudience,
          intro: 'L’historique des UG centralise les avantages fournisseurs pour faciliter le contrôle commercial, la traçabilité et l’analyse des pratiques d’achat.',
          steps: [
            { title: 'Filtrer les UG', detail: 'Utilisez les filtres produit, fournisseur ou période.' },
            { title: 'Lire les quantités', detail: 'Comparez quantités achetées et gratuites.' },
            { title: 'Contrôler le motif', detail: 'Vérifiez la justification et la cohérence commerciale.' },
            { title: 'Exploiter les données', detail: 'Utilisez l’historique pour négocier ou analyser les fournisseurs.' }
          ],
          callouts: [{ type: 'info', text: 'L’historique permet de distinguer les avantages commerciaux des mouvements classiques de stock.' }],
          related: ['stock-approvisionnement-unites-gratuites-saisie', 'stock-approvisionnement-fournisseurs'],
          keywords: ['historique', 'UG', 'fournisseur', 'analyse']
        }),
        article({
          id: 'stock-approvisionnement-historique-receptions',
          title: 'Consulter l’historique des réceptions',
          objective: 'Retrouver les réceptions validées et leurs impacts sur les lots et le stock.',
          location: 'Stock → Approvisionnement → Historique',
          audience: stockAudience,
          intro: 'L’historique des réceptions liste les entrées de stock, les lots créés, les montants, les fournisseurs et les actions de consultation ou suppression contrôlée.',
          steps: [
            { title: 'Rechercher une réception', detail: 'Filtrez par fournisseur, date ou référence.' },
            { title: 'Ouvrir le détail', detail: 'Consultez les lignes, lots, prix et montants.' },
            { title: 'Contrôler les impacts', detail: 'Vérifiez les mouvements générés et les quantités intégrées.' },
            { title: 'Supprimer exceptionnellement', detail: 'Utilisez la suppression intégrale uniquement si elle est autorisée et justifiée.' }
          ],
          callouts: [
            { type: 'warning', text: 'La suppression d’une réception utilise une logique en cascade et doit rester exceptionnelle.' },
            { type: 'info', text: 'L’historique conserve la traçabilité des entrées de stock.' }
          ],
          related: ['stock-reception-fournisseur', 'stock-lots-suivi', 'stock-mouvements-journal'],
          keywords: ['historique', 'réceptions', 'cascade', 'lots']
        }),
        article({
          id: 'stock-approvisionnement-fournisseurs',
          title: 'Piloter les fournisseurs depuis le stock',
          objective: 'Suivre les fournisseurs actifs, leurs commandes et leurs paramètres stock.',
          location: 'Stock → Approvisionnement → Fournisseurs',
          audience: stockAudience,
          intro: 'La vue Fournisseurs du stock offre un suivi opérationnel des partenaires d’approvisionnement : statut, statistiques, délais, fiche détail et accès aux paramètres stock.',
          steps: [
            { title: 'Rechercher un fournisseur', detail: 'Filtrez par nom ou statut.' },
            { title: 'Lire les statistiques', detail: 'Consultez commandes, délais et activité récente.' },
            { title: 'Ouvrir la fiche', detail: 'Vérifiez les informations et paramètres utiles au stock.' },
            { title: 'Accéder aux paramètres', detail: 'Ouvrez les paramètres stock ou les intégrations si nécessaire.' }
          ],
          callouts: [{ type: 'info', text: 'La fiche administrative complète du fournisseur reste gérée dans Administration → Partenaires.' }],
          related: ['administration-partenaires-fournisseurs', 'stock-configuration-integrations'],
          keywords: ['fournisseurs', 'statut', 'délais', 'approvisionnement']
        }),
        article({
          id: 'stock-approvisionnement-suivi-commandes',
          title: 'Suivre l’acheminement des commandes',
          objective: 'Surveiller les commandes en cours et anticiper les retards de livraison.',
          location: 'Stock → Approvisionnement → Suivi',
          audience: stockAudience,
          intro: 'Le suivi logistique regroupe les commandes en cours, transporteurs, statuts de livraison et actions de relance pour réduire le risque de rupture.',
          steps: [
            { title: 'Consulter les commandes en cours', detail: 'Identifiez les commandes non reçues.' },
            { title: 'Lire le statut logistique', detail: 'Vérifiez transporteur, progression et dates prévues.' },
            { title: 'Prioriser les retards', detail: 'Repérez les commandes liées aux produits critiques.' },
            { title: 'Relancer', detail: 'Lancez les actions de suivi fournisseur si nécessaire.' }
          ],
          callouts: [{ type: 'tip', text: 'Associez le suivi aux alertes de rupture pour prioriser les relances.' }],
          related: ['stock-approvisionnement-commandes', 'stock-alertes-stock-faible'],
          keywords: ['suivi', 'livraison', 'transporteur', 'retard']
        }),
        article({
          id: 'stock-approvisionnement-parametres',
          title: 'Configurer les paramètres rapides d’approvisionnement',
          objective: 'Adapter les comportements d’achat depuis l’espace fournisseur du stock.',
          location: 'Stock → Approvisionnement → Fournisseurs → Paramètres Stock',
          audience: ['Administrateurs', 'Responsables stock'],
          intro: 'Les paramètres rapides d’approvisionnement permettent d’ajuster seuils, comportements d’achat et valeurs par défaut sans quitter le contexte fournisseur.',
          steps: [
            { title: 'Ouvrir les paramètres', detail: 'Depuis la zone Fournisseurs, accédez aux paramètres stock.' },
            { title: 'Contrôler les seuils', detail: 'Vérifiez stock minimum, maximum et point de commande.' },
            { title: 'Adapter les valeurs', detail: 'Modifiez les paramètres selon la politique d’achat.' },
            { title: 'Comparer avec la configuration globale', detail: 'Assurez la cohérence avec Stock → Configuration.' }
          ],
          callouts: [{ type: 'warning', text: 'Des paramètres incohérents peuvent générer des suggestions de commande inadaptées.' }],
          related: ['stock-configuration-generale', 'stock-configuration-alertes'],
          keywords: ['paramètres', 'seuils', 'achat', 'configuration']
        })
      ]
    },
    {
      id: 'stock-actuel',
      title: 'Stock actuel',
      description: 'Disponibilités, ruptures, stock faible, valorisation et vérification rapide.',
      icon: Boxes,
      articles: [
        article({
          id: 'stock-actuel-vue-temps-reel',
          title: 'Lire le stock actuel en temps réel',
          objective: 'Comprendre les disponibilités réelles et les alertes immédiates.',
          location: 'Stock → Stock Actuel',
          audience: stockAudience,
          intro: 'Le stock actuel synthétise les produits totaux, disponibilités, stocks faibles, ruptures, valorisation et options d’actualisation ou de vidage de cache.',
          steps: [
            { title: 'Lire les métriques rapides', detail: 'Contrôlez produits totaux, disponibles, faibles et ruptures.' },
            { title: 'Filtrer la liste', detail: 'Utilisez recherche, famille ou rayon pour isoler un produit.' },
            { title: 'Ouvrir le détail', detail: 'Consultez lots, quantités, seuils et mouvements associés.' },
            { title: 'Actualiser', detail: 'Rafraîchissez ou videz le cache après une opération importante.' }
          ],
          callouts: [{ type: 'info', text: 'Le stock affiché reflète ventes, réceptions, retours, inventaires et ajustements enregistrés.' }],
          related: ['stock-actuel-produits-disponibles', 'stock-lots-suivi'],
          keywords: ['stock actuel', 'temps réel', 'disponible', 'cache']
        }),
        article({
          id: 'stock-actuel-produits-disponibles',
          title: 'Consulter les produits disponibles',
          objective: 'Trouver rapidement les produits réellement vendables ou utilisables.',
          location: 'Stock → Stock Actuel → Disponible',
          audience: stockAudience,
          intro: 'La vue Disponible liste les produits avec stock positif, filtres, tri, pagination, export et accès au détail produit.',
          steps: [
            { title: 'Rechercher un produit', detail: 'Utilisez le libelle_produit ou un identifiant produit.' },
            { title: 'Filtrer', detail: 'Limitez par famille, rayon ou critère métier.' },
            { title: 'Trier', detail: 'Classez par nom, quantité, valorisation ou rotation.' },
            { title: 'Exporter ou ouvrir le détail', detail: 'Utilisez l’export ou la fiche produit pour poursuivre l’analyse.' }
          ],
          callouts: [
            { type: 'info', text: 'Le stock disponible résulte des mouvements, ventes, réceptions, retours et inventaires.' },
            { type: 'warning', text: 'Vérifiez toujours les lots pour les produits sensibles ou proches de péremption.' }
          ],
          related: ['stock-lots-suivi', 'stock-actuel-valorisation'],
          keywords: ['disponible', 'produits', 'libelle_produit', 'pagination']
        }),
        article({
          id: 'stock-actuel-stock-faible',
          title: 'Identifier les produits en stock faible',
          objective: 'Repérer les produits sous seuil avant rupture complète.',
          location: 'Stock → Stock Actuel → Stock faible',
          audience: stockAudience,
          intro: 'La vue Stock faible met en évidence les produits dont le niveau actuel est inférieur au seuil défini afin de déclencher une action de réapprovisionnement.',
          steps: [
            { title: 'Afficher les produits sous seuil', detail: 'Consultez le niveau actuel et le seuil limite.' },
            { title: 'Prioriser', detail: 'Classez les produits selon l’urgence, la rotation ou la criticité.' },
            { title: 'Créer une commande', detail: 'Envoyez les produits prioritaires vers l’approvisionnement.' },
            { title: 'Suivre la résolution', detail: 'Contrôlez la réception ou l’évolution du stock.' }
          ],
          callouts: [{ type: 'tip', text: 'Traitez les produits à forte rotation avant les références secondaires.' }],
          related: ['stock-approvisionnement-commandes', 'stock-alertes-stock-faible'],
          keywords: ['stock faible', 'seuil', 'réapprovisionnement', 'critique']
        }),
        article({
          id: 'stock-actuel-ruptures',
          title: 'Traiter les ruptures de stock',
          objective: 'Identifier les produits à stock nul et lancer les actions correctives.',
          location: 'Stock → Stock Actuel → Rupture',
          audience: stockAudience,
          intro: 'La vue Rupture liste les produits non disponibles afin de prioriser commandes, substitutions ou contrôles d’inventaire.',
          steps: [
            { title: 'Repérer les ruptures', detail: 'Consultez les produits à quantité nulle.' },
            { title: 'Évaluer l’impact', detail: 'Vérifiez fréquence de vente, criticité et alternatives.' },
            { title: 'Lancer une action', detail: 'Créez une commande ou planifiez un contrôle physique.' },
            { title: 'Suivre le retour en stock', detail: 'Contrôlez la réception et la mise à jour de disponibilité.' }
          ],
          callouts: [{ type: 'warning', text: 'Une rupture sur produit sensible doit être traitée avant les achats non prioritaires.' }],
          related: ['stock-approvisionnement-commandes', 'stock-inventaires-sessions'],
          keywords: ['rupture', 'stock nul', 'commande', 'substitution']
        }),
        article({
          id: 'stock-actuel-valorisation',
          title: 'Analyser la valorisation du stock actuel',
          objective: 'Comprendre la valeur financière du stock disponible.',
          location: 'Stock → Stock Actuel → Valorisation',
          audience: ['Gestionnaires stock', 'Comptables', 'Administrateurs'],
          intro: 'La valorisation du stock actuel présente la valeur d’achat, la valeur par produit, la valorisation globale et les exports nécessaires au contrôle financier.',
          steps: [
            { title: 'Lire la valeur globale', detail: 'Consultez la valeur estimée du stock.' },
            { title: 'Analyser par produit', detail: 'Repérez les produits qui portent le plus de valeur.' },
            { title: 'Exporter', detail: 'Générez un fichier de contrôle si nécessaire.' },
            { title: 'Rapprocher', detail: 'Comparez avec les rapports stock et comptables si utilisé en reporting.' }
          ],
          callouts: [
            { type: 'info', text: 'Les montants suivent la devise et les paramètres régionaux du tenant.' },
            { type: 'warning', text: 'La valorisation doit être rapprochée des données comptables pour un reporting financier.' }
          ],
          related: ['stock-analyses-valorisation', 'stock-dashboard-export-rapports'],
          keywords: ['valorisation', 'valeur achat', 'stock', 'finance']
        }),
        article({
          id: 'stock-actuel-verification-rapide',
          title: 'Faire une vérification rapide de stock',
          objective: 'Contrôler immédiatement la disponibilité d’un produit avant vente ou commande.',
          location: 'Stock → Stock Actuel → Vérification rapide',
          audience: stockAudience,
          intro: 'La vérification rapide permet de rechercher un produit et lire ses informations critiques sans parcourir toute la liste de stock.',
          steps: [
            { title: 'Saisir la recherche', detail: 'Recherchez le produit par libellé ou identifiant.' },
            { title: 'Lire la disponibilité', detail: 'Contrôlez quantité disponible, seuil et statut.' },
            { title: 'Vérifier les lots', detail: 'Consultez les dates d’expiration si le produit est sensible.' },
            { title: 'Décider', detail: 'Confirmez la vente, commande ou correction nécessaire.' }
          ],
          callouts: [{ type: 'tip', text: 'Utilisez cette vue avant une commande manuelle pour éviter un doublon d’achat.' }],
          related: ['stock-actuel-produits-disponibles', 'stock-lots-expirations'],
          keywords: ['vérification', 'rapide', 'disponibilité', 'produit']
        })
      ]
    },
    {
      id: 'stock-lots-tracabilite',
      title: 'Lots et traçabilité',
      description: 'Suivi, expirations, FIFO, intégration ventes et optimisation des lots.',
      icon: Layers,
      articles: [
        article({
          id: 'stock-actuel-lots',
          title: 'Stock actuel et lots',
          objective: 'Consulter les disponibilités réelles et contrôler la traçabilité par lot.',
          location: 'Stock → Stock actuel',
          audience: stockAudience,
          intro: 'Le stock actuel présente les produits disponibles, leurs seuils, leurs lots, leurs dates d’expiration et les informations nécessaires à la décision opérationnelle.',
          steps: [
            { title: 'Filtrer la liste', detail: 'Utilisez la recherche ou les filtres pour isoler un produit, une famille ou une alerte.' },
            { title: 'Ouvrir le détail', detail: 'Consultez lots, dates d’expiration, quantités et mouvements associés.' },
            { title: 'Contrôler la traçabilité', detail: 'Vérifiez que chaque lot est rattaché au produit et au tenant corrects.' },
            { title: 'Agir selon l’alerte', detail: 'Préparez une commande, corrigez un écart ou planifiez un inventaire ciblé.' }
          ],
          callouts: [{ type: 'warning', text: 'Les produits proches de péremption doivent être analysés avant toute nouvelle commande.' }],
          bestPractices: ['Contrôler les seuils régulièrement.', 'Traiter les ruptures et surstocks chaque jour.', 'Filtrer les lots par produit_id et tenant_id.'],
          faq: [{ q: 'Le stock affiché est-il en temps réel ?', a: 'Il reflète les mouvements enregistrés : ventes, réceptions, retours, inventaires et ajustements.' }],
          related: ['stock-reception-fournisseur', 'stock-lots-expirations'],
          keywords: ['stock', 'lots', 'péremption', 'seuils', 'traçabilité']
        }),
        article({
          id: 'stock-lots-suivi',
          title: 'Suivre les lots',
          objective: 'Tracer chaque lot par produit, numéro, quantité, date et mouvement.',
          location: 'Stock → Lots → Suivi des lots',
          audience: stockAudience,
          intro: 'Le suivi des lots centralise les informations de traçabilité nécessaires aux ventes, inventaires, réceptions et alertes de péremption.',
          steps: [
            { title: 'Rechercher un lot', detail: 'Filtrez par produit, numéro de lot ou statut.' },
            { title: 'Lire les quantités', detail: 'Contrôlez quantité initiale, restante et réservée.' },
            { title: 'Vérifier les dates', detail: 'Analysez les dates de péremption et alertes associées.' },
            { title: 'Consulter les mouvements', detail: 'Ouvrez l’historique lié au lot.' }
          ],
          callouts: [{ type: 'info', text: 'Pour éviter les erreurs de performance, les lots doivent toujours être ciblés par produit_id et tenant_id.' }],
          related: ['stock-lots-details', 'stock-mouvements-journal'],
          keywords: ['lots', 'suivi', 'produit_id', 'traçabilité']
        }),
        article({
          id: 'stock-lots-details',
          title: 'Consulter le détail d’un lot',
          objective: 'Comprendre l’origine, la quantité restante et l’historique d’un lot précis.',
          location: 'Stock → Lots → Détails des lots',
          audience: stockAudience,
          intro: 'Le détail de lot affiche la fiche complète : produit, numéro, origine, quantité initiale, quantité restante, expiration et mouvements associés.',
          steps: [
            { title: 'Ouvrir la fiche lot', detail: 'Sélectionnez un lot depuis la liste.' },
            { title: 'Contrôler l’origine', detail: 'Vérifiez la réception ou l’import ayant créé le lot.' },
            { title: 'Lire l’état actuel', detail: 'Consultez quantités et expiration.' },
            { title: 'Analyser l’historique', detail: 'Repérez ventes, ajustements ou inventaires liés.' }
          ],
          callouts: [{ type: 'tip', text: 'La fiche lot est le meilleur point d’entrée pour diagnostiquer un écart de traçabilité.' }],
          related: ['stock-lots-suivi', 'stock-lots-reconciliation-inventaire'],
          keywords: ['détail lot', 'origine', 'expiration', 'historique']
        }),
        article({
          id: 'stock-lots-expirations',
          title: 'Surveiller les expirations des lots',
          objective: 'Identifier et traiter les lots proches de péremption.',
          location: 'Stock → Lots → Expirations',
          audience: stockAudience,
          intro: 'La surveillance des expirations détecte les lots sensibles, classe l’urgence et aide à choisir retrait, écoulement prioritaire ou contrôle physique.',
          steps: [
            { title: 'Afficher les alertes', detail: 'Consultez les lots proches de péremption.' },
            { title: 'Filtrer l’urgence', detail: 'Triez par délai restant ou statut.' },
            { title: 'Décider l’action', detail: 'Retrait, écoulement prioritaire, inventaire ciblé ou commande différée.' },
            { title: 'Suivre la résolution', detail: 'Vérifiez la mise à jour des alertes.' }
          ],
          callouts: [
            { type: 'warning', text: 'Les produits proches de péremption doivent être contrôlés avant toute nouvelle commande.' },
            { type: 'tip', text: 'Priorisez les lots selon FEFO/FIFO selon la politique interne.' }
          ],
          related: ['stock-alertes-peremption', 'stock-lots-fifo'],
          keywords: ['péremption', 'expiration', 'FEFO', 'FIFO', 'lots']
        }),
        article({
          id: 'stock-lots-fifo',
          title: 'Configurer la logique FIFO',
          objective: 'Comprendre la règle premier entré, premier sorti appliquée aux lots.',
          location: 'Stock → Lots → Configuration FIFO',
          audience: ['Gestionnaires stock', 'Administrateurs'],
          intro: 'La configuration FIFO définit les règles d’écoulement des lots pour préserver la cohérence entre stock, POS et traçabilité.',
          steps: [
            { title: 'Lire la méthode active', detail: 'Vérifiez la politique de sortie des lots.' },
            { title: 'Contrôler les règles', detail: 'Analysez l’ordre d’écoulement et les exceptions.' },
            { title: 'Tester sur produit sensible', detail: 'Vérifiez que le POS déduit les lots attendus.' },
            { title: 'Surveiller les écarts', detail: 'Utilisez mouvements et inventaires pour confirmer la cohérence.' }
          ],
          callouts: [{ type: 'info', text: 'La logique FIFO/FEFO doit rester cohérente avec la politique interne de gestion des produits périssables.' }],
          related: ['stock-lots-integration-ventes', 'stock-lots-expirations'],
          keywords: ['FIFO', 'FEFO', 'lots', 'POS']
        }),
        article({
          id: 'stock-lots-integration-ventes',
          title: 'Comprendre l’intégration des lots avec les ventes',
          objective: 'Suivre comment les lots sont sélectionnés et déduits lors des ventes.',
          location: 'Stock → Lots → Intégration ventes',
          audience: stockAudience,
          intro: 'L’intégration ventes assure que les sorties au POS déduisent le stock tout en conservant la traçabilité du lot vendu.',
          steps: [
            { title: 'Vérifier le produit vendu', detail: 'Confirmez que le produit possède des lots disponibles.' },
            { title: 'Contrôler la sélection de lot', detail: 'Analysez la logique utilisée par le POS.' },
            { title: 'Lire le mouvement généré', detail: 'Vérifiez la sortie associée au lot.' },
            { title: 'Diagnostiquer les écarts', detail: 'Utilisez audit et réconciliation si une quantité diverge.' }
          ],
          callouts: [{ type: 'warning', text: 'Les mouvements de vente doivent préserver la traçabilité des lots.' }],
          related: ['stock-mouvements-journal', 'stock-lots-reconciliation-inventaire'],
          keywords: ['ventes', 'POS', 'lots', 'déduction']
        }),
        article({
          id: 'stock-lots-reconciliation-inventaire',
          title: 'Réconcilier les lots avec l’inventaire',
          objective: 'Comparer les quantités théoriques et physiques au niveau lot.',
          location: 'Stock → Lots → Réconciliation',
          audience: stockAudience,
          intro: 'La réconciliation des lots rapproche les quantités attendues des quantités comptées afin de corriger les écarts et sécuriser la traçabilité.',
          steps: [
            { title: 'Choisir le périmètre', detail: 'Sélectionnez produit, rayon ou session d’inventaire.' },
            { title: 'Comparer les quantités', detail: 'Analysez théorique, réel et écart.' },
            { title: 'Justifier', detail: 'Documentez la cause de l’écart.' },
            { title: 'Générer la correction', detail: 'Validez l’ajustement ou l’inventaire ciblé.' }
          ],
          callouts: [{ type: 'warning', text: 'Toute correction de lot doit être justifiée et traçable.' }],
          related: ['stock-inventaires-reconciliation', 'stock-mouvements-ajustements'],
          keywords: ['réconciliation', 'inventaire', 'écarts', 'lots']
        }),
        article({
          id: 'stock-lots-analytics',
          title: 'Analyser la performance des lots',
          objective: 'Identifier lots rapides, dormants ou sensibles pour optimiser l’écoulement.',
          location: 'Stock → Lots → Analytics',
          audience: stockAudience,
          intro: 'Les analytics lots étudient rotation, performance, lots dormants et risques pour améliorer la disponibilité et limiter les pertes.',
          steps: [
            { title: 'Choisir la période', detail: 'Définissez le périmètre d’analyse.' },
            { title: 'Lire la rotation', detail: 'Comparez lots rapides, normaux et lents.' },
            { title: 'Repérer les lots dormants', detail: 'Identifiez les lots sans mouvement significatif.' },
            { title: 'Décider l’action', detail: 'Planifiez écoulement, inventaire ou retrait.' }
          ],
          callouts: [{ type: 'tip', text: 'Les lots dormants doivent être rapprochés des expirations pour éviter les pertes.' }],
          related: ['stock-lots-optimisation', 'stock-analyses-rotation'],
          keywords: ['analytics', 'lots dormants', 'rotation', 'performance']
        }),
        article({
          id: 'stock-lots-optimisation',
          title: 'Optimiser la gestion des lots',
          objective: 'Exploiter les suggestions d’optimisation pour réduire les risques et pertes.',
          location: 'Stock → Lots → Optimisation',
          audience: stockAudience,
          intro: 'L’optimisation des lots propose des priorités et recommandations basées sur rotation, péremption, criticité et règles actives.',
          steps: [
            { title: 'Lancer l’optimisation', detail: 'Démarrez l’analyse sur le périmètre souhaité.' },
            { title: 'Lire les suggestions', detail: 'Classez les recommandations par priorité.' },
            { title: 'Accepter ou rejeter', detail: 'Appliquez uniquement les actions validées opérationnellement.' },
            { title: 'Suivre l’effet', detail: 'Contrôlez les indicateurs après application.' }
          ],
          callouts: [{ type: 'info', text: 'Les recommandations restent une aide à la décision et doivent être validées par un responsable.' }],
          related: ['stock-lots-analytics', 'stock-alertes-peremption'],
          keywords: ['optimisation', 'suggestions', 'lots', 'priorités']
        })
      ]
    },
    {
      id: 'stock-mouvements',
      title: 'Mouvements',
      description: 'Journal, ajustements, transferts et audit des opérations de stock.',
      icon: ArrowLeftRight,
      articles: [
        article({
          id: 'stock-mouvements-journal',
          title: 'Consulter le journal des mouvements',
          objective: 'Retrouver toutes les entrées, sorties, ajustements et retours de stock.',
          location: 'Stock → Mouvements → Journal',
          audience: stockAudience,
          intro: 'Le journal des mouvements constitue la piste de traçabilité centrale des opérations qui modifient les quantités de stock.',
          steps: [
            { title: 'Filtrer le journal', detail: 'Recherchez par produit, date, type ou origine.' },
            { title: 'Lire le mouvement', detail: 'Contrôlez sens, quantité, utilisateur et justification.' },
            { title: 'Ouvrir l’origine', detail: 'Rapprochez le mouvement de vente, réception, inventaire ou ajustement.' },
            { title: 'Exporter si besoin', detail: 'Utilisez les données pour audit ou contrôle interne.' }
          ],
          callouts: [{ type: 'info', text: 'Le journal aide à expliquer les écarts entre stock théorique et stock physique.' }],
          related: ['stock-mouvements-audit', 'stock-lots-integration-ventes'],
          keywords: ['mouvements', 'journal', 'entrées', 'sorties']
        }),
        article({
          id: 'stock-mouvements-ajustements',
          title: 'Enregistrer un ajustement de stock',
          objective: 'Corriger une quantité de stock avec justification et traçabilité.',
          location: 'Stock → Mouvements → Ajustements',
          audience: stockAudience,
          intro: 'L’ajustement permet de corriger un écart constaté en choisissant produit, sens de correction, quantité et motif.',
          steps: [
            { title: 'Sélectionner le produit', detail: 'Recherchez le produit concerné.' },
            { title: 'Choisir le sens', detail: 'Indiquez entrée corrective ou sortie corrective.' },
            { title: 'Renseigner la quantité', detail: 'Saisissez la quantité exacte à corriger.' },
            { title: 'Justifier', detail: 'Ajoutez un motif explicite.' },
            { title: 'Valider', detail: 'Enregistrez l’ajustement et vérifiez le journal.' }
          ],
          callouts: [
            { type: 'warning', text: 'Un ajustement modifie le stock réel et doit toujours être justifié.' },
            { type: 'info', text: 'Les ajustements doivent rester auditables.' }
          ],
          related: ['stock-mouvements-journal', 'stock-inventaires-reconciliation'],
          keywords: ['ajustement', 'correction', 'motif', 'audit']
        }),
        article({
          id: 'stock-mouvements-transferts',
          title: 'Gérer les transferts de stock',
          objective: 'Déplacer des quantités entre emplacements ou périmètres internes lorsque la fonction est disponible.',
          location: 'Stock → Mouvements → Transferts',
          audience: stockAudience,
          intro: 'Les transferts servent à déplacer un stock entre une source et une destination tout en conservant une trace de l’opération.',
          steps: [
            { title: 'Choisir le produit', detail: 'Sélectionnez le produit à transférer.' },
            { title: 'Indiquer source et destination', detail: 'Renseignez les emplacements ou périmètres concernés.' },
            { title: 'Saisir la quantité', detail: 'Contrôlez que la source dispose du stock nécessaire.' },
            { title: 'Valider', detail: 'Enregistrez le transfert et vérifiez le journal.' }
          ],
          callouts: [{ type: 'warning', text: 'Un transfert sans destination claire rend l’audit de stock difficile.' }],
          related: ['stock-mouvements-journal', 'stock-mouvements-audit'],
          keywords: ['transfert', 'source', 'destination', 'mouvement']
        }),
        article({
          id: 'stock-mouvements-audit',
          title: 'Auditer les mouvements de stock',
          objective: 'Contrôler les opérations sensibles et les corrections réalisées sur le stock.',
          location: 'Stock → Mouvements → Audit',
          audience: ['Administrateurs', 'Responsables stock'],
          intro: 'L’audit des mouvements permet de vérifier utilisateur, date, type de mouvement, origine et justification des changements.',
          steps: [
            { title: 'Définir le périmètre', detail: 'Filtrez par période, produit ou utilisateur.' },
            { title: 'Identifier les opérations sensibles', detail: 'Repérez ajustements, suppressions et corrections.' },
            { title: 'Contrôler les justificatifs', detail: 'Vérifiez motifs et pièces associées.' },
            { title: 'Escalader si nécessaire', detail: 'Transmettez les anomalies au responsable autorisé.' }
          ],
          callouts: [
            { type: 'info', text: 'L’audit contribue à la conformité et à la sécurité multi-tenant.' },
            { type: 'warning', text: 'Les corrections sensibles doivent être réservées aux profils autorisés.' }
          ],
          related: ['stock-mouvements-ajustements', 'stock-dashboard-vue-ensemble'],
          keywords: ['audit', 'mouvements', 'sécurité', 'traçabilité']
        })
      ]
    },
    {
      id: 'stock-inventaires',
      title: 'Inventaires',
      description: 'Sessions, saisie, import Excel, réconciliation et rapports.',
      icon: ClipboardList,
      articles: [
        article({
          id: 'stock-inventaires-sessions',
          title: 'Créer et gérer les sessions d’inventaire',
          objective: 'Organiser les inventaires complets, partiels ou cycliques.',
          location: 'Stock → Inventaires → Sessions',
          audience: stockAudience,
          intro: 'Les sessions d’inventaire structurent le comptage physique par type, périmètre, participants, statut et étapes de clôture.',
          steps: [
            { title: 'Créer la session', detail: 'Choisissez complet, partiel ou cyclique.' },
            { title: 'Définir le périmètre', detail: 'Sélectionnez rayons, fournisseurs, emplacements ou familles.' },
            { title: 'Affecter les participants', detail: 'Renseignez les personnes impliquées.' },
            { title: 'Démarrer puis suivre', detail: 'Pilotez démarrage, suspension, reprise et progression.' },
            { title: 'Clôturer', detail: 'Finalisez lorsque les écarts ont été contrôlés.' }
          ],
          callouts: [
            { type: 'info', text: 'PharmaSoft supporte trois types d’inventaire : complet, partiel et cyclique.' },
            { type: 'warning', text: 'Clôturer une session peut déclencher des écarts à valider.' }
          ],
          related: ['stock-inventaires-saisie', 'stock-inventaires-reconciliation', 'stock-mouvements-ajustements'],
          keywords: ['inventaire', 'sessions', 'complet', 'partiel', 'cyclique']
        }),
        article({
          id: 'stock-inventaires-saisie',
          title: 'Saisir les comptages d’inventaire',
          objective: 'Enregistrer les quantités physiques comptées pendant une session.',
          location: 'Stock → Inventaires → Saisie',
          audience: stockAudience,
          intro: 'La saisie d’inventaire permet de comparer quantités comptées et théoriques, puis suivre l’avancement de la session.',
          steps: [
            { title: 'Sélectionner la session', detail: 'Choisissez l’inventaire actif.' },
            { title: 'Rechercher les produits', detail: 'Filtrez les lignes à compter.' },
            { title: 'Saisir les quantités', detail: 'Indiquez les quantités physiques observées.' },
            { title: 'Comparer au théorique', detail: 'Analysez les écarts signalés.' },
            { title: 'Enregistrer', detail: 'Sauvegardez la progression.' }
          ],
          callouts: [{ type: 'tip', text: 'Saisissez les comptages dès la vérification physique pour limiter les erreurs de report.' }],
          related: ['stock-inventaires-reconciliation', 'stock-inventaires-rapports'],
          keywords: ['saisie', 'comptage', 'quantité', 'inventaire']
        }),
        article({
          id: 'stock-inventaires-import-excel',
          title: 'Importer un inventaire depuis Excel',
          objective: 'Charger des comptages d’inventaire depuis un fichier Excel structuré.',
          location: 'Stock → Inventaires → Import Excel',
          audience: stockAudience,
          intro: 'L’import Excel d’inventaire facilite le traitement de volumes importants en rapprochant produits, lots et quantités comptées.',
          steps: [
            { title: 'Préparer le fichier', detail: 'Vérifiez les colonnes attendues et les identifiants produits.' },
            { title: 'Importer', detail: 'Chargez le fichier dans la session cible.' },
            { title: 'Mapper les colonnes', detail: 'Associez code-barres, lot, nom produit, quantités et dates si disponibles.' },
            { title: 'Corriger les erreurs', detail: 'Traitez les lignes non reconnues.' },
            { title: 'Valider par lots', detail: 'Importez en traitement séquentiel pour éviter les erreurs mémoire.' }
          ],
          callouts: [
            { type: 'warning', text: 'Les gros fichiers doivent être importés en traitement séquentiel pour éviter les erreurs mémoire.' },
            { type: 'info', text: 'Le rapprochement produit doit respecter les identifiants du référentiel.' }
          ],
          related: ['stock-configuration-mapping-excel', 'stock-inventaires-reconciliation'],
          keywords: ['import Excel', 'inventaire', 'mapping', 'chunking']
        }),
        article({
          id: 'stock-inventaires-reconciliation',
          title: 'Réconcilier les écarts d’inventaire',
          objective: 'Valider les écarts et générer les ajustements nécessaires.',
          location: 'Stock → Inventaires → Réconciliation',
          audience: stockAudience,
          intro: 'La réconciliation transforme les écarts contrôlés en décisions : validation, justification, ajustement ou nouvelle vérification.',
          steps: [
            { title: 'Afficher les écarts', detail: 'Comparez théorique et compté.' },
            { title: 'Classer les écarts', detail: 'Identifiez positif, négatif, sensible ou mineur.' },
            { title: 'Justifier', detail: 'Renseignez la cause ou demandez une re-vérification.' },
            { title: 'Générer les ajustements', detail: 'Validez les corrections autorisées.' },
            { title: 'Clôturer', detail: 'Finalisez la session après contrôle.' }
          ],
          callouts: [{ type: 'warning', text: 'Un écart validé modifie le stock réel et doit rester auditables.' }],
          related: ['stock-mouvements-ajustements', 'stock-inventaires-rapports'],
          keywords: ['réconciliation', 'écarts', 'ajustements', 'clôture']
        }),
        article({
          id: 'stock-inventaires-rapports',
          title: 'Exploiter les rapports d’inventaire',
          objective: 'Analyser la synthèse, les écarts et l’historique des inventaires.',
          location: 'Stock → Inventaires → Rapports',
          audience: stockAudience,
          intro: 'Les rapports d’inventaire synthétisent l’avancement, les écarts, les corrections et les informations nécessaires au suivi historique.',
          steps: [
            { title: 'Choisir la session', detail: 'Sélectionnez l’inventaire à analyser.' },
            { title: 'Lire la synthèse', detail: 'Consultez avancement, lignes comptées et écarts.' },
            { title: 'Analyser les corrections', detail: 'Repérez les ajustements générés.' },
            { title: 'Exporter', detail: 'Produisez un rapport de contrôle ou d’archivage.' }
          ],
          callouts: [{ type: 'info', text: 'Les rapports facilitent l’audit interne après clôture de session.' }],
          related: ['stock-inventaires-sessions', 'stock-mouvements-audit'],
          keywords: ['rapports', 'inventaire', 'écarts', 'export']
        })
      ]
    },
    {
      id: 'stock-alertes',
      title: 'Alertes',
      description: 'Alertes actives, stock faible, péremptions et règles de notification.',
      icon: Bell,
      articles: [
        article({
          id: 'stock-alertes-dashboard',
          title: 'Piloter le dashboard des alertes stock',
          objective: 'Centraliser les alertes actives et prioriser les actions.',
          location: 'Stock → Alertes → Dashboard',
          audience: stockAudience,
          intro: 'Le dashboard Alertes regroupe criticité, stock faible, ruptures, péremptions et actions rapides pour traiter les risques stock.',
          steps: [
            { title: 'Lire les alertes actives', detail: 'Consultez volume et criticité.' },
            { title: 'Filtrer par type', detail: 'Séparez ruptures, stock faible et péremptions.' },
            { title: 'Prioriser', detail: 'Traitez les alertes critiques en premier.' },
            { title: 'Lancer l’action', detail: 'Ouvrez commande, lot ou inventaire selon le cas.' }
          ],
          callouts: [{ type: 'warning', text: 'Une alerte critique doit être traitée avant les opérations sensibles.' }],
          related: ['stock-alertes-stock-faible', 'stock-alertes-peremption'],
          keywords: ['alertes', 'dashboard', 'criticité', 'stock']
        }),
        article({
          id: 'stock-alertes-stock-faible',
          title: 'Traiter les alertes de stock faible',
          objective: 'Transformer les alertes sous seuil en actions de réapprovisionnement.',
          location: 'Stock → Alertes → Stock faible',
          audience: stockAudience,
          intro: 'Les alertes de stock faible identifient les produits sous seuil et facilitent le lancement d’une commande ou d’un contrôle.',
          steps: [
            { title: 'Afficher les produits concernés', detail: 'Consultez niveau actuel, seuil et urgence.' },
            { title: 'Prioriser', detail: 'Repérez les produits à forte rotation ou critiques.' },
            { title: 'Créer la commande', detail: 'Envoyez les lignes vers l’approvisionnement.' },
            { title: 'Suivre', detail: 'Contrôlez le statut jusqu’à réception.' }
          ],
          callouts: [{ type: 'tip', text: 'Associez ces alertes au suivi des commandes pour anticiper les ruptures.' }],
          related: ['stock-approvisionnement-commandes', 'stock-approvisionnement-suivi-commandes'],
          keywords: ['stock faible', 'seuil', 'alerte', 'commande']
        }),
        article({
          id: 'stock-alertes-peremption',
          title: 'Traiter les alertes de péremption',
          objective: 'Gérer les lots arrivant à expiration avant qu’ils ne deviennent invendables.',
          location: 'Stock → Alertes → Péremption',
          audience: stockAudience,
          intro: 'Les alertes de péremption signalent les lots à surveiller, retirer ou écouler rapidement selon leur délai restant.',
          steps: [
            { title: 'Lire les lots concernés', detail: 'Consultez produit, lot, date et urgence.' },
            { title: 'Décider l’action', detail: 'Choisissez retrait, écoulement prioritaire ou contrôle.' },
            { title: 'Éviter les commandes inutiles', detail: 'Vérifiez le besoin avant tout réapprovisionnement.' },
            { title: 'Clôturer l’alerte', detail: 'Confirmez la résolution après action.' }
          ],
          callouts: [{ type: 'warning', text: 'Un lot proche de péremption doit être traité avant toute nouvelle commande du même produit.' }],
          related: ['stock-lots-expirations', 'stock-lots-fifo', 'stock-approvisionnement-commandes'],
          keywords: ['péremption', 'expiration', 'alerte', 'lots']
        }),
        article({
          id: 'stock-alertes-configuration',
          title: 'Configurer les alertes stock',
          objective: 'Définir les seuils, règles et notifications d’alerte stock.',
          location: 'Stock → Alertes → Configuration',
          audience: ['Administrateurs', 'Responsables stock'],
          intro: 'La configuration des alertes permet d’ajuster seuils, règles de surveillance, notifications, criticité et activation des contrôles.',
          steps: [
            { title: 'Ouvrir la configuration', detail: 'Accédez aux règles d’alertes.' },
            { title: 'Définir les seuils', detail: 'Renseignez stock faible, rupture et péremption.' },
            { title: 'Configurer les notifications', detail: 'Choisissez les alertes à activer.' },
            { title: 'Tester', detail: 'Vérifiez les alertes générées sur quelques produits.' }
          ],
          callouts: [{ type: 'info', text: 'Une bonne configuration réduit les ruptures sans générer trop de bruit opérationnel.' }],
          related: ['stock-configuration-alertes', 'stock-alertes-dashboard'],
          keywords: ['configuration', 'alertes', 'notifications', 'seuils']
        })
      ]
    },
    {
      id: 'stock-analyses',
      title: 'Analyses stock',
      description: 'Valorisation, ABC, rotation, prévisions et conformité.',
      icon: BarChart3,
      articles: [
        article({
          id: 'stock-analyses-valorisation',
          title: 'Analyser la valorisation du stock',
          objective: 'Étudier la valeur du stock par méthode, famille et produit.',
          location: 'Stock → Analyses → Valorisation',
          audience: ['Gestionnaires stock', 'Comptables', 'Administrateurs'],
          intro: 'L’analyse de valorisation détaille la valeur globale, la contribution par famille, les méthodes de calcul et les écarts à interpréter.',
          steps: [
            { title: 'Choisir la période', detail: 'Définissez le périmètre d’analyse.' },
            { title: 'Lire la valorisation globale', detail: 'Contrôlez la valeur totale et son évolution.' },
            { title: 'Analyser par famille', detail: 'Repérez les familles qui concentrent la valeur.' },
            { title: 'Exporter', detail: 'Produisez un fichier de contrôle.' }
          ],
          callouts: [{ type: 'warning', text: 'Rapprochez la valorisation avec la comptabilité si elle sert au reporting financier.' }],
          related: ['stock-actuel-valorisation', 'stock-dashboard-export-rapports'],
          keywords: ['valorisation', 'famille', 'méthode', 'export']
        }),
        article({
          id: 'stock-analyses-abc',
          title: 'Utiliser l’analyse ABC',
          objective: 'Classer les produits par importance selon la méthode Pareto.',
          location: 'Stock → Analyses → Analyse ABC',
          audience: stockAudience,
          intro: 'L’analyse ABC classe les produits en A, B ou C pour concentrer le suivi sur les références qui génèrent le plus d’impact.',
          steps: [
            { title: 'Sélectionner la période', detail: 'Choisissez l’intervalle de ventes à analyser.' },
            { title: 'Lire les classes', detail: 'Identifiez produits A, B et C.' },
            { title: 'Filtrer les priorités', detail: 'Repérez les produits à fort impact.' },
            { title: 'Adapter le suivi', detail: 'Renforcez contrôle et seuils sur les classes A.' }
          ],
          callouts: [
            { type: 'tip', text: 'Les produits de classe A doivent être suivis plus fréquemment.' },
            { type: 'info', text: 'L’analyse ABC nécessite des données de ventes suffisantes.' }
          ],
          related: ['stock-analyses-rotation', 'stock-approvisionnement-commandes'],
          keywords: ['ABC', 'Pareto', 'classe A', 'priorités']
        }),
        article({
          id: 'stock-analyses-rotation',
          title: 'Analyser la rotation des stocks',
          objective: 'Identifier produits rapides, normaux, lents ou dormants.',
          location: 'Stock → Analyses → Rotation',
          audience: stockAudience,
          intro: 'L’analyse de rotation mesure la vitesse d’écoulement des produits pour ajuster les seuils et les décisions de réapprovisionnement.',
          steps: [
            { title: 'Définir la période', detail: 'Analysez une période significative.' },
            { title: 'Classer les produits', detail: 'Repérez rotation rapide, normale ou lente.' },
            { title: 'Identifier les dormants', detail: 'Listez les produits sans mouvement.' },
            { title: 'Adapter les commandes', detail: 'Réduisez les achats lents et sécurisez les rapides.' }
          ],
          callouts: [{ type: 'tip', text: 'Un produit dormant proche de péremption doit être traité rapidement.' }],
          related: ['stock-lots-analytics', 'stock-alertes-peremption'],
          keywords: ['rotation', 'dormants', 'réapprovisionnement', 'analyse']
        }),
        article({
          id: 'stock-analyses-previsions',
          title: 'Exploiter les prévisions de stock',
          objective: 'Anticiper les besoins et risques de rupture.',
          location: 'Stock → Analyses → Prévisions',
          audience: stockAudience,
          intro: 'Les prévisions utilisent les tendances et historiques pour estimer les besoins futurs et signaler les produits à surveiller.',
          steps: [
            { title: 'Choisir l’horizon', detail: 'Définissez la période de prévision.' },
            { title: 'Lire les tendances', detail: 'Analysez hausse, baisse ou stabilité.' },
            { title: 'Repérer les risques', detail: 'Identifiez les produits susceptibles de rompre.' },
            { title: 'Préparer les commandes', detail: 'Utilisez les prévisions pour planifier l’approvisionnement.' }
          ],
          callouts: [{ type: 'info', text: 'Les prévisions complètent le jugement métier et ne remplacent pas le contrôle terrain.' }],
          related: ['stock-approvisionnement-commandes', 'stock-alertes-stock-faible'],
          keywords: ['prévisions', 'tendances', 'besoins', 'ruptures']
        }),
        article({
          id: 'stock-analyses-conformite',
          title: 'Produire les rapports de conformité stock',
          objective: 'Contrôler la cohérence réglementaire et opérationnelle du stock.',
          location: 'Stock → Analyses → Conformité',
          audience: ['Pharmaciens', 'Administrateurs'],
          intro: 'Les rapports de conformité vérifient cohérence lots/stock, péremptions, produits sensibles et éléments nécessaires aux audits.',
          steps: [
            { title: 'Sélectionner le rapport', detail: 'Choisissez le périmètre conformité.' },
            { title: 'Contrôler les lots', detail: 'Vérifiez dates, quantités et traçabilité.' },
            { title: 'Analyser les produits sensibles', detail: 'Repérez les anomalies ou manques.' },
            { title: 'Exporter', detail: 'Générez le document d’audit.' }
          ],
          callouts: [{ type: 'warning', text: 'Les produits réglementés doivent conserver une traçabilité complète des mouvements.' }],
          related: ['stock-lots-suivi', 'stock-mouvements-audit'],
          keywords: ['conformité', 'audit', 'réglementaire', 'lots']
        })
      ]
    },
    {
      id: 'stock-etiquettes',
      title: 'Étiquettes',
      description: 'Impression par produit, lot ou réception.',
      icon: Tags,
      articles: [
        article({
          id: 'stock-etiquettes-produits',
          title: 'Imprimer des étiquettes produits',
          objective: 'Générer et imprimer des étiquettes pour les produits du catalogue.',
          location: 'Stock → Étiquettes → Produits',
          audience: stockAudience,
          intro: 'L’impression produit permet de rechercher un produit, générer un code si nécessaire, choisir les options affichées et lancer l’impression.',
          steps: [
            { title: 'Rechercher le produit', detail: 'Sélectionnez la référence à étiqueter.' },
            { title: 'Configurer l’étiquette', detail: 'Choisissez taille, code-barres, prix, DCI, lot ou expiration selon besoin.' },
            { title: 'Générer le code si absent', detail: 'Créez le code-barres quand la référence n’en possède pas.' },
            { title: 'Prévisualiser puis imprimer', detail: 'Contrôlez le rendu avant impression.' }
          ],
          callouts: [{ type: 'info', text: 'Le format standard du projet est 38 × 21,2 mm lorsque cette configuration est utilisée.' }],
          related: ['stock-etiquettes-lots', 'stock-configuration-generale'],
          keywords: ['étiquettes', 'produits', 'code-barres', 'impression']
        }),
        article({
          id: 'stock-etiquettes-lots',
          title: 'Imprimer des étiquettes de lots',
          objective: 'Produire des étiquettes traçables pour les lots de stock.',
          location: 'Stock → Étiquettes → Lots',
          audience: stockAudience,
          intro: 'Les étiquettes de lots affichent les informations nécessaires à la traçabilité : produit, lot, expiration, quantité et code-barres unique.',
          steps: [
            { title: 'Rechercher le lot', detail: 'Filtrez par produit ou numéro de lot.' },
            { title: 'Sélectionner les lots', detail: 'Cochez les lots à imprimer.' },
            { title: 'Contrôler les données', detail: 'Vérifiez lot, expiration et quantité.' },
            { title: 'Imprimer', detail: 'Lancez l’impression des étiquettes.' }
          ],
          callouts: [
            { type: 'info', text: 'Les codes-barres de lots suivent les règles contextuelles de génération du projet.' },
            { type: 'warning', text: 'Une étiquette lot incorrecte compromet la traçabilité POS.' }
          ],
          related: ['stock-lots-suivi', 'stock-lots-integration-ventes'],
          keywords: ['étiquettes', 'lots', 'code-barres', 'traçabilité']
        }),
        article({
          id: 'stock-etiquettes-receptions',
          title: 'Imprimer les étiquettes d’une réception',
          objective: 'Imprimer en groupe les étiquettes des lots créés par une réception.',
          location: 'Stock → Étiquettes → Par Réception',
          audience: stockAudience,
          intro: 'L’impression par réception permet de sélectionner une réception, retrouver tous ses lots associés et imprimer les étiquettes en une opération groupée.',
          steps: [
            { title: 'Rechercher la réception', detail: 'Sélectionnez la réception fournisseur concernée.' },
            { title: 'Afficher les lots', detail: 'Vérifiez les lots associés à la réception.' },
            { title: 'Sélectionner tout ou partie', detail: 'Cochez les lots à imprimer.' },
            { title: 'Imprimer', detail: 'Lancez l’impression groupée.' }
          ],
          callouts: [
            { type: 'tip', text: 'Imprimer les étiquettes immédiatement après réception facilite la traçabilité en rayon.' },
            { type: 'info', text: 'Le format standard du projet est 38 × 21,2 mm lorsque cette configuration est utilisée.' }
          ],
          related: ['stock-reception-fournisseur', 'stock-lots-suivi'],
          keywords: ['réception', 'étiquettes', 'lots', '38x21,2']
        })
      ]
    },
    {
      id: 'stock-configuration',
      title: 'Configuration stock',
      description: 'Paramètres généraux, alertes, tarification, Excel et intégrations fournisseurs.',
      icon: Settings2,
      articles: [
        article({
          id: 'stock-configuration-generale',
          title: 'Configurer les paramètres généraux du stock',
          objective: 'Définir les règles globales de gestion stock.',
          location: 'Stock → Configuration → Général',
          audience: ['Administrateurs', 'Responsables stock'],
          intro: 'La configuration générale regroupe unité par défaut, méthode de valorisation, précision d’arrondi, stock minimum, maximum, point de commande et stock de sécurité.',
          steps: [
            { title: 'Ouvrir Général', detail: 'Accédez aux paramètres de base du stock.' },
            { title: 'Définir les unités', detail: 'Choisissez l’unité par défaut.' },
            { title: 'Renseigner les seuils', detail: 'Paramétrez minimum, maximum, point de commande et sécurité.' },
            { title: 'Sauvegarder', detail: 'Enregistrez puis vérifiez les effets sur les alertes.' }
          ],
          callouts: [{ type: 'warning', text: 'Des seuils incohérents peuvent créer des alertes ou commandes inadaptées.' }],
          related: ['stock-configuration-alertes', 'stock-approvisionnement-parametres'],
          keywords: ['configuration', 'général', 'seuils', 'stock']
        }),
        article({
          id: 'stock-configuration-alertes',
          title: 'Configurer les seuils et alertes stock',
          objective: 'Paramétrer les déclencheurs d’alerte de stock et péremption.',
          location: 'Stock → Configuration → Alertes',
          audience: ['Administrateurs', 'Responsables stock'],
          intro: 'Les paramètres d’alertes déterminent les seuils, notifications, règles de surveillance des péremptions et criticités affichées dans le module Stock.',
          steps: [
            { title: 'Définir les seuils', detail: 'Renseignez rupture, stock faible et péremption.' },
            { title: 'Configurer les notifications', detail: 'Activez les alertes utiles.' },
            { title: 'Choisir la criticité', detail: 'Classez les alertes par niveau d’urgence.' },
            { title: 'Tester', detail: 'Vérifiez la remontée des alertes dans le dashboard.' }
          ],
          callouts: [{ type: 'info', text: 'Les alertes doivent rester actionnables pour éviter la fatigue opérationnelle.' }],
          related: ['stock-alertes-configuration', 'stock-alertes-dashboard'],
          keywords: ['alertes', 'seuils', 'péremption', 'notifications']
        }),
        article({
          id: 'stock-configuration-tarification',
          title: 'Configurer la tarification stock',
          objective: 'Définir les règles de prix et d’arrondi utilisées par le stock.',
          location: 'Stock → Configuration → Tarification',
          audience: ['Administrateurs', 'Responsables stock', 'Comptables'],
          intro: 'La tarification stock influence les prix d’achat, prix de vente, arrondis et valorisation des produits.',
          steps: [
            { title: 'Ouvrir Tarification', detail: 'Accédez aux paramètres de prix.' },
            { title: 'Contrôler achat/vente', detail: 'Vérifiez la cohérence des règles de prix.' },
            { title: 'Configurer les arrondis', detail: 'Adaptez les règles aux standards régionaux.' },
            { title: 'Valider', detail: 'Sauvegardez puis contrôlez une réception ou une valorisation.' }
          ],
          callouts: [
            { type: 'info', text: 'Les montants FCFA doivent respecter les règles d’arrondi du projet avec Math.round.' },
            { type: 'warning', text: 'Une mauvaise configuration tarifaire peut déséquilibrer ventes et comptabilité.' }
          ],
          related: ['stock-actuel-valorisation', 'stock-reception-fournisseur'],
          keywords: ['tarification', 'prix', 'arrondi', 'FCFA']
        }),
        article({
          id: 'stock-configuration-mapping-excel',
          title: 'Configurer le mapping Excel',
          objective: 'Définir les correspondances de colonnes pour les imports stock.',
          location: 'Stock → Configuration → Mapping Excel',
          audience: ['Administrateurs', 'Responsables stock'],
          intro: 'Le mapping Excel indique comment lire les colonnes de fichiers d’inventaire ou réception : produit, code-barres, lot, prix, dates et quantités.',
          steps: [
            { title: 'Lister les colonnes attendues', detail: 'Identifiez les champs obligatoires.' },
            { title: 'Associer les colonnes', detail: 'Mappez code-barres, numéro lot, libelle_produit, prix et date_peremption.' },
            { title: 'Tester sur un fichier', detail: 'Importez un petit échantillon.' },
            { title: 'Corriger les écarts', detail: 'Ajustez le mapping avant un gros import.' }
          ],
          callouts: [{ type: 'warning', text: 'Un mauvais mapping peut créer des erreurs de prix, lots ou rapprochement produit.' }],
          related: ['stock-approvisionnement-import-excel-reception', 'stock-inventaires-import-excel'],
          keywords: ['mapping Excel', 'import', 'colonnes', 'date_peremption']
        }),
        article({
          id: 'stock-configuration-integrations',
          title: 'Configurer les intégrations fournisseurs',
          objective: 'Activer et suivre les intégrations stock avec les fournisseurs.',
          location: 'Stock → Configuration → Intégrations',
          audience: ['Administrateurs', 'Responsables stock'],
          intro: 'Les intégrations fournisseurs permettent de préparer PharmaML, paramétrer les fournisseurs et consulter l’historique des transmissions.',
          steps: [
            { title: 'Sélectionner un fournisseur', detail: 'Choisissez le partenaire à configurer.' },
            { title: 'Activer l’intégration', detail: 'Activez PharmaML si disponible.' },
            { title: 'Renseigner les paramètres', detail: 'Complétez les informations techniques requises.' },
            { title: 'Contrôler l’historique', detail: 'Surveillez transmissions, réponses et erreurs.' }
          ],
          callouts: [{ type: 'warning', text: 'Les paramètres d’intégration fournisseur peuvent contenir des informations sensibles.' }],
          related: ['stock-configuration-pharmaml', 'stock-configuration-pharmaml-historique'],
          keywords: ['intégrations', 'fournisseur', 'PharmaML', 'transmission']
        }),
        article({
          id: 'stock-configuration-pharmaml',
          title: 'Configurer PharmaML pour un fournisseur',
          objective: 'Paramétrer une connexion PharmaML fournisseur de manière sécurisée.',
          location: 'Stock → Configuration → Intégrations → Configuration',
          audience: ['Administrateurs'],
          intro: 'La configuration PharmaML regroupe URL, code répartiteur, identifiants, clé secrète, identifiant officine, pays, test de connexion et sauvegarde.',
          steps: [
            { title: 'Ouvrir la configuration', detail: 'Sélectionnez le fournisseur à connecter.' },
            { title: 'Renseigner les identifiants', detail: 'Saisissez URL, code, identifiant, clé et officine.' },
            { title: 'Choisir le pays', detail: 'Adaptez les paramètres au fournisseur.' },
            { title: 'Tester la connexion', detail: 'Vérifiez la réponse avant sauvegarde.' },
            { title: 'Sauvegarder', detail: 'Enregistrez uniquement après test concluant.' }
          ],
          callouts: [
            { type: 'warning', text: 'Les identifiants PharmaML sont sensibles et doivent rester limités aux utilisateurs autorisés.' },
            { type: 'info', text: 'Les erreurs XML PharmaML/UBIPHARM doivent être diagnostiquées avec le fournisseur et le schéma attendu.' }
          ],
          related: ['stock-configuration-pharmaml-historique', 'stock-approvisionnement-fournisseurs'],
          keywords: ['PharmaML', 'UBIPHARM', 'identifiants', 'XML']
        }),
        article({
          id: 'stock-configuration-pharmaml-historique',
          title: 'Consulter l’historique PharmaML',
          objective: 'Auditer les transmissions PharmaML et diagnostiquer les erreurs fournisseur.',
          location: 'Stock → Configuration → Intégrations → Historique',
          audience: ['Administrateurs', 'Responsables stock'],
          intro: 'L’historique PharmaML liste transmissions, réponses fournisseur, erreurs, commandes liées et informations utiles au diagnostic d’intégration.',
          steps: [
            { title: 'Filtrer les transmissions', detail: 'Recherchez par fournisseur, période ou statut.' },
            { title: 'Lire la réponse', detail: 'Analysez succès, rejet ou erreur.' },
            { title: 'Diagnostiquer', detail: 'Comparez le message reçu au schéma attendu.' },
            { title: 'Relancer si nécessaire', detail: 'Corrigez la configuration avant toute nouvelle transmission.' }
          ],
          callouts: [{ type: 'info', text: 'L’historique facilite l’audit des échanges avec les fournisseurs intégrés.' }],
          related: ['stock-configuration-pharmaml', 'stock-configuration-integrations'],
          keywords: ['historique', 'PharmaML', 'erreurs', 'transmissions']
        })
      ]
    },
    {
      id: 'stock-integration-demo',
      title: 'Démonstration et intégration avancée',
      description: 'Notifications intelligentes, suggestions, valorisation et tests intégrés.',
      icon: Bot,
      articles: [
        article({
          id: 'stock-integration-demo-vue-ensemble',
          title: 'Comprendre la démonstration d’intégration stock',
          objective: 'Explorer les scénarios avancés d’intégration stock sans quitter le module.',
          location: 'Stock → Démonstration intégration',
          audience: ['Administrateurs', 'Responsables stock'],
          intro: 'La démonstration d’intégration stock illustre notifications intelligentes, réapprovisionnement, valorisation, test de mouvement et actualisation.',
          steps: [
            { title: 'Ouvrir la démonstration', detail: 'Accédez au sous-module d’intégration.' },
            { title: 'Lire les widgets', detail: 'Consultez notifications, suggestions et indicateurs.' },
            { title: 'Tester un mouvement', detail: 'Simulez un cas pour comprendre les impacts.' },
            { title: 'Actualiser', detail: 'Rafraîchissez les données après test.' }
          ],
          callouts: [{ type: 'info', text: 'Cette zone aide à comprendre les interactions avancées avant usage opérationnel.' }],
          related: ['stock-integration-demo-notifications', 'stock-integration-demo-reapprovisionnement'],
          keywords: ['démonstration', 'intégration', 'stock', 'test']
        }),
        article({
          id: 'stock-integration-demo-notifications',
          title: 'Lire les notifications stock intelligentes',
          objective: 'Comprendre les notifications générées par les paramètres stock.',
          location: 'Stock → Démonstration intégration → Notifications',
          audience: ['Administrateurs', 'Responsables stock'],
          intro: 'Les notifications intelligentes présentent priorités, produits concernés et actions suggérées selon les seuils et paramètres actifs.',
          steps: [
            { title: 'Lire la priorité', detail: 'Identifiez le niveau d’urgence.' },
            { title: 'Consulter le produit', detail: 'Ouvrez les détails de la référence concernée.' },
            { title: 'Analyser l’action suggérée', detail: 'Vérifiez la pertinence métier.' },
            { title: 'Agir ou ignorer', detail: 'Appliquez uniquement les notifications utiles.' }
          ],
          callouts: [{ type: 'tip', text: 'Les notifications sont plus pertinentes lorsque les seuils stock sont correctement configurés.' }],
          related: ['stock-configuration-alertes', 'stock-alertes-dashboard'],
          keywords: ['notifications', 'intelligentes', 'priorité', 'paramètres']
        }),
        article({
          id: 'stock-integration-demo-reapprovisionnement',
          title: 'Comprendre les suggestions de réapprovisionnement',
          objective: 'Interpréter les quantités recommandées à partir des seuils configurés.',
          location: 'Stock → Démonstration intégration → Réapprovisionnement',
          audience: ['Gestionnaires stock', 'Responsables stock'],
          intro: 'Les suggestions de réapprovisionnement s’appuient sur stock minimum, point de commande, stock maximum et disponibilité actuelle pour proposer des quantités.',
          steps: [
            { title: 'Lire les produits recommandés', detail: 'Identifiez les références à commander.' },
            { title: 'Comparer les seuils', detail: 'Contrôlez minimum, maximum et point de commande.' },
            { title: 'Valider la quantité', detail: 'Vérifiez que la suggestion correspond au besoin réel.' },
            { title: 'Créer une commande', detail: 'Transformez la suggestion en commande si elle est confirmée.' }
          ],
          callouts: [{ type: 'info', text: 'La suggestion doit être validée avec le contexte terrain et les commandes déjà en cours.' }],
          related: ['stock-approvisionnement-commandes', 'stock-configuration-generale'],
          keywords: ['suggestions', 'réapprovisionnement', 'seuils', 'quantité']
        }),
        article({
          id: 'stock-integration-demo-valorisation',
          title: 'Tester les calculs de valorisation intégrée',
          objective: 'Comprendre les calculs de valeur totale et de rotation moyenne.',
          location: 'Stock → Démonstration intégration → Valorisation',
          audience: ['Responsables stock', 'Comptables', 'Administrateurs'],
          intro: 'La démonstration de valorisation illustre le calcul produit, la méthode de valorisation, la valeur totale et la rotation moyenne.',
          steps: [
            { title: 'Sélectionner le scénario', detail: 'Choisissez le produit ou ensemble à tester.' },
            { title: 'Lire la méthode', detail: 'Vérifiez la méthode de valorisation appliquée.' },
            { title: 'Analyser les résultats', detail: 'Contrôlez valeur totale et rotation moyenne.' },
            { title: 'Comparer aux analyses', detail: 'Rapprochez les résultats des vues Stock → Analyses.' }
          ],
          callouts: [{ type: 'info', text: 'Les tests de valorisation aident à comprendre les chiffres avant reporting.' }],
          related: ['stock-analyses-valorisation', 'stock-actuel-valorisation'],
          keywords: ['valorisation', 'test', 'rotation', 'calcul']
        })
      ]
    }
  ]
};
