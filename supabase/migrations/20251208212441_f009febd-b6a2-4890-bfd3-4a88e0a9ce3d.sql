-- Insertion des catégories principales du centre d'aide
INSERT INTO public.help_categories (tenant_id, name, icon, module_key, order_index, is_active, translations) VALUES
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8', 'Tableau de bord', 'Home', 'dashboard', 1, true, '{"en": "Dashboard", "es": "Panel de control"}'),
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8', 'Administration', 'Shield', 'administration', 2, true, '{"en": "Administration", "es": "Administración"}'),
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8', 'Stock', 'Package', 'stock', 3, true, '{"en": "Inventory", "es": "Inventario"}'),
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8', 'Ventes', 'ShoppingCart', 'ventes', 4, true, '{"en": "Sales", "es": "Ventas"}'),
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8', 'Comptabilité', 'Calculator', 'comptabilite', 5, true, '{"en": "Accounting", "es": "Contabilidad"}'),
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8', 'Caisse', 'Wallet', 'caisse', 6, true, '{"en": "Cash Register", "es": "Caja"}'),
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8', 'Rapports', 'BarChart3', 'rapports', 7, true, '{"en": "Reports", "es": "Informes"}'),
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8', 'Assistant IA', 'Bot', 'assistant-ia', 8, true, '{"en": "AI Assistant", "es": "Asistente IA"}'),
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8', 'Chat-PharmaSoft', 'MessageSquare', 'chat-pharmasoft', 9, true, '{"en": "Chat-PharmaSoft", "es": "Chat-PharmaSoft"}'),
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8', 'Paramètres', 'Settings', 'parametres', 10, true, '{"en": "Settings", "es": "Configuración"}');

-- Insertion des articles d'aide par module
-- Module: Tableau de bord
INSERT INTO public.help_articles (tenant_id, category_id, title, summary, content, keywords, steps, faq_items, is_featured, is_active) VALUES
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8', 
 (SELECT id FROM public.help_categories WHERE module_key = 'dashboard' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Vue d''ensemble du Dashboard',
 'Découvrez les indicateurs clés de performance (KPIs) et widgets disponibles sur votre tableau de bord.',
 '## Présentation du Dashboard

Le tableau de bord PharmaSoft vous offre une vue synthétique de l''activité de votre pharmacie.

### Indicateurs principaux

- **Chiffre d''affaires** : Ventes du jour, semaine, mois
- **Stock** : Valeur totale et alertes
- **Clients** : Nombre de transactions
- **Alertes** : Péremptions et ruptures

### Widgets disponibles

Chaque widget peut être personnalisé selon vos besoins.',
 ARRAY['dashboard', 'kpi', 'indicateurs', 'widgets', 'accueil'],
 '[{"step": 1, "title": "Accéder au Dashboard", "description": "Cliquez sur \"Tableau de bord\" dans le menu latéral"}, {"step": 2, "title": "Consulter les KPIs", "description": "Les indicateurs principaux sont affichés en haut de page"}, {"step": 3, "title": "Analyser les graphiques", "description": "Survolez les graphiques pour voir les détails"}]',
 '[{"question": "Comment actualiser les données ?", "answer": "Les données sont actualisées automatiquement. Vous pouvez aussi cliquer sur le bouton Rafraîchir."}, {"question": "Puis-je exporter les données ?", "answer": "Oui, utilisez le bouton Export en haut à droite pour télécharger en Excel ou PDF."}]',
 true, true),

('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'dashboard' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Comprendre les alertes',
 'Apprenez à interpréter et gérer les différentes alertes affichées sur votre tableau de bord.',
 '## Types d''alertes

PharmaSoft génère plusieurs types d''alertes pour vous aider à gérer votre pharmacie efficacement.

### Alertes de stock
- **Stock critique** : Quantité inférieure au seuil critique
- **Stock faible** : Quantité entre seuil critique et optimal
- **Rupture** : Stock à zéro

### Alertes de péremption
- **Péremption proche** : Produits expirant dans 30 jours
- **Péremption imminente** : Produits expirant dans 7 jours
- **Produits périmés** : À retirer immédiatement

### Actions recommandées
Chaque alerte propose une action à effectuer pour résoudre la situation.',
 ARRAY['alertes', 'stock', 'péremption', 'rupture', 'notifications'],
 '[{"step": 1, "title": "Consulter les alertes", "description": "Les alertes sont visibles dans le panneau latéral droit"}, {"step": 2, "title": "Cliquer sur une alerte", "description": "Accédez aux détails et actions recommandées"}, {"step": 3, "title": "Traiter l''alerte", "description": "Effectuez l''action proposée pour résoudre le problème"}]',
 '[{"question": "Comment désactiver une alerte ?", "answer": "Les alertes critiques ne peuvent pas être désactivées. Les alertes informatives peuvent être masquées dans Paramètres > Alertes."}]',
 true, true);

-- Module: Stock
INSERT INTO public.help_articles (tenant_id, category_id, title, summary, content, keywords, steps, faq_items, is_featured, is_active) VALUES
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'stock' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Gestion des approvisionnements',
 'Créez et gérez vos commandes fournisseurs, de la commande à la réception.',
 '## Processus d''approvisionnement

### Créer une commande
1. Accédez à Stock > Approvisionnement
2. Cliquez sur "Nouvelle commande"
3. Sélectionnez le fournisseur
4. Ajoutez les produits et quantités
5. Validez la commande

### Réceptionner une commande
Lors de la réception, vérifiez :
- Les quantités livrées
- Les numéros de lot
- Les dates de péremption
- Les prix d''achat',
 ARRAY['approvisionnement', 'commande', 'fournisseur', 'réception', 'achat'],
 '[{"step": 1, "title": "Créer la commande", "description": "Stock > Approvisionnement > Nouvelle commande"}, {"step": 2, "title": "Sélectionner le fournisseur", "description": "Choisissez dans la liste ou créez un nouveau fournisseur"}, {"step": 3, "title": "Ajouter les produits", "description": "Recherchez et ajoutez les produits à commander"}, {"step": 4, "title": "Valider", "description": "Vérifiez et validez votre commande"}]',
 '[{"question": "Comment importer une commande Excel ?", "answer": "Utilisez le bouton Import Excel dans l''onglet Approvisionnement."}, {"question": "Puis-je modifier une commande envoyée ?", "answer": "Non, mais vous pouvez créer une commande complémentaire."}]',
 true, true),

('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'stock' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Suivi des lots et péremptions',
 'Maîtrisez la traçabilité de vos produits grâce au suivi des lots et dates de péremption.',
 '## Gestion des lots

### Informations d''un lot
- Numéro de lot unique
- Date de péremption
- Quantité initiale et restante
- Prix d''achat unitaire
- Emplacement de stockage

### Alertes automatiques
Le système génère automatiquement des alertes pour :
- Lots expirant dans 60 jours
- Lots expirant dans 30 jours
- Lots périmés

### Méthode FEFO
PharmaSoft applique la méthode First Expired First Out pour optimiser les ventes.',
 ARRAY['lot', 'péremption', 'traçabilité', 'expiration', 'FEFO'],
 '[{"step": 1, "title": "Accéder au suivi", "description": "Stock > Lots > Suivi"}, {"step": 2, "title": "Filtrer les lots", "description": "Utilisez les filtres pour afficher les lots par statut"}, {"step": 3, "title": "Exporter les données", "description": "Téléchargez la liste en Excel ou PDF"}]',
 '[{"question": "Comment corriger un numéro de lot ?", "answer": "Accédez au détail du lot et cliquez sur Modifier. Seuls les administrateurs peuvent modifier les lots."}, {"question": "Que faire des produits périmés ?", "answer": "Créez un mouvement de sortie avec le motif Destruction/Péremption."}]',
 false, true),

('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'stock' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Réaliser un inventaire',
 'Guide complet pour effectuer un inventaire physique de votre stock.',
 '## Types d''inventaire

### Inventaire complet
Comptage de tous les produits en stock.

### Inventaire partiel
Comptage d''une sélection de produits (par rayon, catégorie...).

### Inventaire cyclique
Comptage rotatif des produits non inventoriés récemment.

## Procédure

1. **Planification** : Créez une session d''inventaire
2. **Comptage** : Saisissez les quantités physiques
3. **Réconciliation** : Analysez les écarts
4. **Validation** : Ajustez le stock si nécessaire',
 ARRAY['inventaire', 'comptage', 'écart', 'stock', 'réconciliation'],
 '[{"step": 1, "title": "Créer la session", "description": "Stock > Inventaires > Nouvelle session"}, {"step": 2, "title": "Choisir le type", "description": "Complet, Partiel ou Cyclique"}, {"step": 3, "title": "Effectuer le comptage", "description": "Scannez ou saisissez les quantités"}, {"step": 4, "title": "Analyser les écarts", "description": "Consultez l''onglet Réconciliation"}, {"step": 5, "title": "Valider", "description": "Terminez l''inventaire pour appliquer les ajustements"}]',
 '[{"question": "Puis-je annuler un inventaire ?", "answer": "Oui, tant qu''il n''est pas terminé. Allez dans Sessions > Actions > Annuler."}, {"question": "Comment imprimer la liste de comptage ?", "answer": "Dans l''onglet Saisie, cliquez sur Exporter > PDF."}]',
 true, true);

-- Module: Ventes
INSERT INTO public.help_articles (tenant_id, category_id, title, summary, content, keywords, steps, faq_items, is_featured, is_active) VALUES
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'ventes' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Interface Point de Vente',
 'Découvrez l''interface de vente et ses raccourcis pour une utilisation optimale.',
 '## Interface POS

### Zones principales
- **Recherche produits** : Barre de recherche avec suggestions
- **Panier** : Liste des produits sélectionnés
- **Client** : Informations et historique
- **Paiement** : Modes de règlement

### Raccourcis clavier
- `F2` : Nouvelle vente
- `F3` : Recherche produit
- `F4` : Valider paiement
- `F8` : Annuler vente
- `Entrée` : Ajouter au panier',
 ARRAY['POS', 'point de vente', 'interface', 'raccourcis', 'caisse'],
 '[{"step": 1, "title": "Ouvrir le POS", "description": "Ventes > Point de vente"}, {"step": 2, "title": "Rechercher un produit", "description": "Tapez le nom, code-barres ou DCI"}, {"step": 3, "title": "Ajouter au panier", "description": "Cliquez ou appuyez sur Entrée"}]',
 '[{"question": "Comment scanner un code-barres ?", "answer": "Placez le curseur dans la barre de recherche et scannez. Le produit s''ajoute automatiquement."}, {"question": "Puis-je modifier la quantité ?", "answer": "Oui, cliquez sur la quantité dans le panier ou utilisez les boutons +/-."}]',
 true, true),

('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'ventes' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Réaliser une vente',
 'Procédure complète pour effectuer une vente du début à la fin.',
 '## Étapes d''une vente

### 1. Sélection des produits
- Recherchez par nom, code-barres ou DCI
- Ajoutez au panier
- Ajustez les quantités si nécessaire

### 2. Identification du client (optionnel)
- Recherchez ou créez un client
- Appliquez les remises éventuelles

### 3. Paiement
- Sélectionnez le mode de paiement
- Espèces, carte, mobile money, crédit
- Validez la transaction

### 4. Ticket
- Impression automatique ou manuelle
- Envoi par email possible',
 ARRAY['vente', 'transaction', 'paiement', 'ticket', 'encaissement'],
 '[{"step": 1, "title": "Ajouter les produits", "description": "Recherchez et ajoutez les produits au panier"}, {"step": 2, "title": "Vérifier le panier", "description": "Contrôlez les quantités et prix"}, {"step": 3, "title": "Associer un client", "description": "Optionnel : sélectionnez ou créez un client"}, {"step": 4, "title": "Encaisser", "description": "Choisissez le mode de paiement et validez"}, {"step": 5, "title": "Imprimer le ticket", "description": "Le ticket s''imprime automatiquement si configuré"}]',
 '[{"question": "Comment appliquer une remise ?", "answer": "Cliquez sur le bouton Remise dans le panier et saisissez le pourcentage ou montant."}, {"question": "Que faire si le client n''a pas assez ?", "answer": "Proposez une vente à crédit si le client est enregistré."}]',
 true, true),

('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'ventes' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Gestion des crédits clients',
 'Accordez et suivez les ventes à crédit pour vos clients fidèles.',
 '## Ventes à crédit

### Conditions
- Client enregistré obligatoirement
- Plafond de crédit défini
- Historique de paiement positif

### Accorder un crédit
1. Effectuez la vente normalement
2. Au paiement, sélectionnez "Crédit"
3. Définissez l''échéance
4. Le client signe numériquement

### Suivi des crédits
Consultez l''onglet Crédits pour voir :
- Montants dus par client
- Échéances dépassées
- Historique des remboursements',
 ARRAY['crédit', 'dette', 'client', 'échéance', 'remboursement'],
 '[{"step": 1, "title": "Créer la vente", "description": "Ajoutez les produits et sélectionnez le client"}, {"step": 2, "title": "Choisir Crédit", "description": "Dans les modes de paiement, sélectionnez Crédit"}, {"step": 3, "title": "Définir l''échéance", "description": "Indiquez la date de remboursement prévue"}, {"step": 4, "title": "Valider", "description": "Le crédit est enregistré et visible dans le suivi"}]',
 '[{"question": "Comment limiter le crédit d''un client ?", "answer": "Dans la fiche client, définissez un plafond de crédit maximum."}, {"question": "Puis-je refuser un crédit ?", "answer": "Oui, vous pouvez toujours refuser. Le système n''oblige pas à accorder de crédit."}]',
 false, true);

-- Module: Comptabilité
INSERT INTO public.help_articles (tenant_id, category_id, title, summary, content, keywords, steps, faq_items, is_featured, is_active) VALUES
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'comptabilite' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Plan comptable OHADA',
 'Comprenez la structure du plan comptable OHADA utilisé par PharmaSoft.',
 '## Plan Comptable OHADA

### Classes de comptes
- **Classe 1** : Comptes de capitaux
- **Classe 2** : Comptes d''immobilisations
- **Classe 3** : Comptes de stocks
- **Classe 4** : Comptes de tiers
- **Classe 5** : Comptes de trésorerie
- **Classe 6** : Comptes de charges
- **Classe 7** : Comptes de produits

### Comptes automatiques
PharmaSoft génère automatiquement les écritures pour :
- Ventes (classe 7)
- Achats (classe 6)
- Mouvements de caisse (classe 5)',
 ARRAY['OHADA', 'plan comptable', 'comptes', 'classes', 'écritures'],
 '[{"step": 1, "title": "Accéder au plan", "description": "Comptabilité > Plan comptable"}, {"step": 2, "title": "Naviguer par classe", "description": "Utilisez les onglets pour filtrer par classe"}, {"step": 3, "title": "Consulter un compte", "description": "Cliquez sur un compte pour voir son détail et ses mouvements"}]',
 '[{"question": "Puis-je créer mes propres comptes ?", "answer": "Oui, les administrateurs peuvent ajouter des comptes auxiliaires."}, {"question": "Les écritures sont-elles modifiables ?", "answer": "Non, les écritures validées sont immuables. Vous pouvez créer des écritures de correction."}]',
 true, true),

('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'comptabilite' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Journalisation automatique',
 'Découvrez comment PharmaSoft génère automatiquement les écritures comptables.',
 '## Écritures automatiques

### Événements générateurs
- **Vente** : Débit client/caisse, crédit ventes + TVA
- **Achat** : Débit achats + TVA, crédit fournisseur
- **Encaissement** : Débit caisse, crédit client
- **Décaissement** : Débit fournisseur, crédit caisse

### Journaux
- JV : Journal des ventes
- JA : Journal des achats
- JC : Journal de caisse
- JB : Journal de banque
- JOD : Journal des opérations diverses',
 ARRAY['journal', 'écriture', 'automatique', 'comptabilisation', 'débit crédit'],
 '[{"step": 1, "title": "Consulter les journaux", "description": "Comptabilité > Journaux"}, {"step": 2, "title": "Filtrer par période", "description": "Sélectionnez la plage de dates"}, {"step": 3, "title": "Exporter", "description": "Téléchargez en Excel pour votre expert-comptable"}]',
 '[{"question": "Comment corriger une écriture ?", "answer": "Créez une écriture de contrepassation dans le journal des opérations diverses."}, {"question": "Les écritures sont-elles en temps réel ?", "answer": "Oui, chaque transaction génère immédiatement son écriture."}]',
 false, true);

-- Module: Caisse
INSERT INTO public.help_articles (tenant_id, category_id, title, summary, content, keywords, steps, faq_items, is_featured, is_active) VALUES
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'caisse' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Ouverture de session caisse',
 'Procédure pour ouvrir une session de caisse avant de commencer les ventes.',
 '## Ouverture de caisse

### Prérequis
- Être connecté avec un compte autorisé
- Avoir les droits d''accès à la caisse

### Procédure
1. Accédez à Ventes > Point de vente
2. Cliquez sur "Ouvrir la caisse"
3. Saisissez le fond de caisse initial
4. Confirmez l''ouverture

### Fond de caisse
Le fond de caisse est le montant en espèces présent au début de la session. Il sera utilisé pour calculer les écarts à la clôture.',
 ARRAY['caisse', 'ouverture', 'session', 'fond de caisse', 'démarrage'],
 '[{"step": 1, "title": "Accéder au POS", "description": "Ventes > Point de vente"}, {"step": 2, "title": "Ouvrir la caisse", "description": "Cliquez sur le bouton Ouvrir la caisse"}, {"step": 3, "title": "Saisir le fond", "description": "Indiquez le montant initial en espèces"}, {"step": 4, "title": "Confirmer", "description": "La session est maintenant active"}]',
 '[{"question": "Puis-je ouvrir plusieurs caisses ?", "answer": "Oui, si votre licence le permet et que plusieurs postes sont configurés."}, {"question": "Que faire si j''ai oublié le fond de caisse ?", "answer": "Vous pouvez modifier le fond de caisse tant qu''aucune transaction n''est effectuée."}]',
 true, true),

('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'caisse' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Clôture de caisse',
 'Terminez votre session de caisse en vérifiant les montants et en générant le rapport.',
 '## Clôture de caisse

### Vérifications
Avant de clôturer, assurez-vous que :
- Toutes les ventes sont encaissées
- Les ventes à crédit sont validées
- Le comptage physique est effectué

### Procédure
1. Cliquez sur "Clôturer la caisse"
2. Saisissez les montants comptés par mode de paiement
3. Consultez les écarts éventuels
4. Validez la clôture

### Rapport de caisse
Un rapport PDF est généré automatiquement avec :
- Total des ventes
- Détail par mode de paiement
- Écarts constatés',
 ARRAY['clôture', 'fermeture', 'caisse', 'rapport', 'écart'],
 '[{"step": 1, "title": "Initier la clôture", "description": "Cliquez sur Clôturer la caisse"}, {"step": 2, "title": "Compter l''argent", "description": "Comptez physiquement les espèces"}, {"step": 3, "title": "Saisir les montants", "description": "Indiquez le montant compté pour chaque mode"}, {"step": 4, "title": "Analyser les écarts", "description": "Vérifiez et justifiez les différences"}, {"step": 5, "title": "Valider", "description": "Confirmez la clôture et imprimez le rapport"}]',
 '[{"question": "Puis-je clôturer avec des ventes en attente ?", "answer": "Non, toutes les ventes doivent être finalisées ou annulées."}, {"question": "Comment expliquer un écart ?", "answer": "Lors de la clôture, un champ permet de saisir une justification pour chaque écart."}]',
 true, true);

-- Module: Administration
INSERT INTO public.help_articles (tenant_id, category_id, title, summary, content, keywords, steps, faq_items, is_featured, is_active) VALUES
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'administration' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Gestion du personnel',
 'Créez et gérez les comptes employés avec leurs rôles et permissions.',
 '## Gestion des employés

### Créer un employé
1. Administration > Personnel
2. Cliquez sur "Ajouter un employé"
3. Remplissez les informations
4. Attribuez un rôle

### Rôles disponibles
- **Admin** : Accès complet
- **Manager** : Gestion sans paramètres système
- **Caissier** : Ventes et encaissements uniquement
- **Vendeur** : Ventes sans encaissement

### Permissions
Chaque rôle a des permissions prédéfinies. Les admins peuvent personnaliser les accès.',
 ARRAY['personnel', 'employé', 'utilisateur', 'rôle', 'permission'],
 '[{"step": 1, "title": "Accéder au module", "description": "Administration > Personnel"}, {"step": 2, "title": "Ajouter un employé", "description": "Cliquez sur le bouton Ajouter"}, {"step": 3, "title": "Remplir le formulaire", "description": "Nom, email, téléphone, rôle..."}, {"step": 4, "title": "Enregistrer", "description": "L''employé reçoit ses identifiants par email"}]',
 '[{"question": "Comment réinitialiser un mot de passe ?", "answer": "Dans la fiche employé, cliquez sur Réinitialiser le mot de passe."}, {"question": "Puis-je désactiver un compte sans le supprimer ?", "answer": "Oui, utilisez le toggle Actif/Inactif dans la fiche employé."}]',
 true, true),

('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'administration' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Catalogue produits',
 'Gérez votre catalogue de médicaments et produits parapharmaceutiques.',
 '## Gestion du catalogue

### Ajouter un produit
- Manuellement via le formulaire
- Import Excel en masse
- Scan de code-barres

### Informations produit
- Désignation et DCI
- Code CIP / Code-barres
- Prix d''achat et de vente
- Catégorie et famille
- Seuils de stock

### Tarification
Définissez les règles de tarification :
- Prix fixe
- Marge sur prix d''achat
- Coefficient multiplicateur',
 ARRAY['catalogue', 'produit', 'médicament', 'tarification', 'CIP'],
 '[{"step": 1, "title": "Accéder au catalogue", "description": "Administration > Catalogue"}, {"step": 2, "title": "Ajouter un produit", "description": "Cliquez sur Nouveau produit"}, {"step": 3, "title": "Remplir les informations", "description": "Saisissez tous les champs obligatoires"}, {"step": 4, "title": "Définir les prix", "description": "Indiquez le prix d''achat et de vente"}, {"step": 5, "title": "Enregistrer", "description": "Le produit est disponible immédiatement"}]',
 '[{"question": "Comment importer un catalogue Excel ?", "answer": "Utilisez le bouton Import et téléchargez le modèle Excel fourni."}, {"question": "Puis-je modifier les prix en masse ?", "answer": "Oui, via la fonction Mise à jour groupée dans le menu Actions."}]',
 false, true);

-- Module: Assistant IA
INSERT INTO public.help_articles (tenant_id, category_id, title, summary, content, keywords, steps, faq_items, is_featured, is_active) VALUES
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'assistant-ia' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Diagnostic intelligent',
 'L''IA analyse automatiquement votre activité et détecte les anomalies.',
 '## Diagnostic IA

### Analyses effectuées
- **Performance commerciale** : Tendances de ventes
- **Gestion des stocks** : Optimisation et alertes
- **Marges** : Analyse de rentabilité
- **Clients** : Segmentation et fidélité

### Scores
Chaque domaine reçoit un score de 0 à 100 :
- 80-100 : Excellent
- 60-79 : Bon
- 40-59 : À améliorer
- 0-39 : Critique

### Actions recommandées
L''IA propose des actions concrètes pour améliorer vos scores.',
 ARRAY['IA', 'diagnostic', 'analyse', 'intelligence artificielle', 'score'],
 '[{"step": 1, "title": "Lancer le diagnostic", "description": "Assistant IA > Diagnostic > Analyser"}, {"step": 2, "title": "Consulter les scores", "description": "Visualisez les scores par domaine"}, {"step": 3, "title": "Voir les recommandations", "description": "Cliquez sur chaque domaine pour les détails"}, {"step": 4, "title": "Appliquer les actions", "description": "Suivez les recommandations proposées"}]',
 '[{"question": "À quelle fréquence lancer le diagnostic ?", "answer": "L''IA peut analyser automatiquement chaque jour. Vous pouvez aussi lancer manuellement."}, {"question": "Les données sont-elles sécurisées ?", "answer": "Oui, l''analyse se fait localement. Aucune donnée n''est envoyée à l''extérieur."}]',
 true, true),

('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'assistant-ia' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Prévisions avancées',
 'Anticipez vos ventes et besoins en stock grâce aux prévisions IA.',
 '## Prévisions IA

### Types de prévisions
- **Ventes** : Prévisions à 7, 30 et 90 jours
- **Stock** : Besoins de réapprovisionnement
- **Trésorerie** : Flux de caisse prévisionnels

### Facteurs analysés
L''IA prend en compte :
- Historique des ventes
- Saisonnalité
- Tendances du marché
- Événements spéciaux

### Fiabilité
Chaque prévision affiche un score de confiance.',
 ARRAY['prévision', 'forecast', 'anticipation', 'stock', 'ventes'],
 '[{"step": 1, "title": "Accéder aux prévisions", "description": "Assistant IA > Prévisions"}, {"step": 2, "title": "Choisir le type", "description": "Ventes, Stock ou Trésorerie"}, {"step": 3, "title": "Définir la période", "description": "Sélectionnez l''horizon de prévision"}, {"step": 4, "title": "Analyser les résultats", "description": "Consultez les graphiques et tableaux"}]',
 '[{"question": "Les prévisions sont-elles fiables ?", "answer": "La fiabilité dépend de l''historique disponible. Plus vous avez de données, plus les prévisions sont précises."}, {"question": "Puis-je exporter les prévisions ?", "answer": "Oui, utilisez le bouton Export pour télécharger en Excel."}]',
 false, true);

-- Module: Chat-PharmaSoft
INSERT INTO public.help_articles (tenant_id, category_id, title, summary, content, keywords, steps, faq_items, is_featured, is_active) VALUES
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'chat-pharmasoft' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Messagerie réseau',
 'Communiquez avec d''autres pharmacies du réseau PharmaSoft.',
 '## Messagerie inter-officines

### Fonctionnalités
- Messages instantanés
- Partage de fichiers
- Canaux thématiques
- Notifications en temps réel

### Types de canaux
- **Équipe** : Communication interne
- **Réseau** : Entre pharmacies
- **Fournisseurs** : Avec vos partenaires

### Confidentialité
Tous les messages sont chiffrés de bout en bout.',
 ARRAY['chat', 'messagerie', 'réseau', 'communication', 'pharmacie'],
 '[{"step": 1, "title": "Ouvrir la messagerie", "description": "Chat-PharmaSoft > Messagerie"}, {"step": 2, "title": "Sélectionner un canal", "description": "Choisissez le canal de discussion"}, {"step": 3, "title": "Envoyer un message", "description": "Tapez votre message et appuyez sur Entrée"}]',
 '[{"question": "Comment créer un nouveau canal ?", "answer": "Cliquez sur le + à côté de Canaux et remplissez les informations."}, {"question": "Puis-je supprimer un message ?", "answer": "Oui, cliquez sur les ... du message et sélectionnez Supprimer."}]',
 true, true);

-- Module: Paramètres
INSERT INTO public.help_articles (tenant_id, category_id, title, summary, content, keywords, steps, faq_items, is_featured, is_active) VALUES
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8',
 (SELECT id FROM public.help_categories WHERE module_key = 'parametres' AND tenant_id = '2f7365aa-eadd-4aa9-a5c8-330b97d55ea8'),
 'Configuration système',
 'Personnalisez PharmaSoft selon les besoins de votre pharmacie.',
 '## Paramètres système

### Informations pharmacie
- Nom et adresse
- Numéros de licence
- Logo et branding

### Paramètres de vente
- TVA applicable
- Modes de paiement
- Format des tickets

### Paramètres de stock
- Seuils d''alerte
- Méthode de valorisation
- Alertes péremption

### Sécurité
- Politique de mot de passe
- Sessions et déconnexion
- Journalisation des accès',
 ARRAY['paramètres', 'configuration', 'système', 'personnalisation', 'réglages'],
 '[{"step": 1, "title": "Accéder aux paramètres", "description": "Cliquez sur Paramètres dans le menu"}, {"step": 2, "title": "Choisir la section", "description": "Sélectionnez la catégorie à configurer"}, {"step": 3, "title": "Modifier les valeurs", "description": "Ajustez les paramètres selon vos besoins"}, {"step": 4, "title": "Enregistrer", "description": "Cliquez sur Enregistrer pour appliquer"}]',
 '[{"question": "Les modifications sont-elles immédiates ?", "answer": "Oui, la plupart des paramètres s''appliquent immédiatement. Certains nécessitent une reconnexion."}, {"question": "Puis-je restaurer les valeurs par défaut ?", "answer": "Oui, chaque section a un bouton Restaurer les valeurs par défaut."}]',
 true, true);

-- Insertion des paramètres d'aide
INSERT INTO public.help_settings (tenant_id, show_video_tutorials, enable_search_analytics, max_recent_items, default_language, ai_suggestions_enabled) VALUES
('2f7365aa-eadd-4aa9-a5c8-330b97d55ea8', true, true, 10, 'fr', true)
ON CONFLICT (tenant_id) DO UPDATE SET
  show_video_tutorials = EXCLUDED.show_video_tutorials,
  enable_search_analytics = EXCLUDED.enable_search_analytics,
  max_recent_items = EXCLUDED.max_recent_items,
  default_language = EXCLUDED.default_language,
  ai_suggestions_enabled = EXCLUDED.ai_suggestions_enabled;