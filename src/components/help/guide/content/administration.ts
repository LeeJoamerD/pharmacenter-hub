import { BarChart3, Compass, FileText, Package, Receipt, Settings2, ShieldCheck, ShoppingCart, Users } from 'lucide-react';
import type { GuideModule } from '../types';

export const administrationModule: GuideModule = {
  id: 'administration',
  title: 'Administration',
  tagline: 'Structurer le personnel, les partenaires, les clients et les référentiels.',
  description: 'Administration regroupe les fonctions de gouvernance opérationnelle : personnel, partenaires, référentiel produits, clients, documents, analytics et workflows.',
  icon: ShieldCheck,
  accent: 'info',
  sections: [
    {
      id: 'administration-pilotage',
      title: 'Pilotage administratif',
      icon: Compass,
      articles: [
        {
          id: 'administration-dashboard-vue-ensemble',
          title: 'Comprendre le Dashboard Administration',
          objective: 'Lire les indicateurs administratifs pour piloter rapidement les opérations transverses.',
          location: 'Administration',
          audience: ['Administrateurs', 'Pharmacien Titulaire', 'Responsables opérationnels'],
          intro: 'Le Dashboard Administration centralise les métriques de personnel, partenaires, référentiel, documents, clients, workflows et alertes. Il sert de point d’entrée pour contrôler l’état administratif de l’officine avant d’agir dans les sous-modules.',
          steps: [
            { title: 'Consulter les cartes de synthèse', detail: 'Vérifiez les volumes clés : collaborateurs, partenaires, produits référencés, documents, clients et automatisations.' },
            { title: 'Analyser les alertes système', detail: 'Repérez les points bloquants ou les éléments nécessitant une action administrative.' },
            { title: 'Suivre l’activité récente', detail: 'Contrôlez les dernières créations, modifications ou validations effectuées dans les sous-modules.' },
            { title: 'Utiliser les actions rapides', detail: 'Accédez directement aux écrans de gestion les plus courants lorsque les indicateurs révèlent une action à mener.' },
            { title: 'Actualiser après une opération', detail: 'Relancez le chargement des données pour confirmer que les compteurs reflètent les modifications récentes.' }
          ],
          callouts: [
            { type: 'info', title: 'Isolation des données', text: 'Les métriques affichées sont limitées au tenant/pharmacie courant grâce aux règles d’isolation multi-tenant.' },
            { type: 'tip', title: 'Bonne lecture', text: 'Commencez par les alertes puis les approbations avant de traiter les actions rapides.' }
          ],
          bestPractices: ['Contrôler le Dashboard au début de la journée administrative.', 'Documenter les anomalies avant de modifier les référentiels.', 'Vérifier les indicateurs après les imports ou suppressions importantes.'],
          faq: [{ q: 'Pourquoi certains compteurs changent-ils après synchronisation ?', a: 'Ils peuvent dépendre de données créées automatiquement dans d’autres modules, comme les comptes clients liés au personnel ou aux partenaires.' }],
          related: ['administration-dashboard-alertes-approbations', 'administration-workflows-historique'],
          keywords: ['dashboard', 'administration', 'alertes', 'indicateurs', 'pilotage']
        },
        {
          id: 'administration-dashboard-alertes-approbations',
          title: 'Suivre les alertes, activités et approbations',
          objective: 'Prioriser les éléments administratifs nécessitant une validation ou une correction.',
          location: 'Administration',
          audience: ['Administrateurs', 'Pharmacien Titulaire'],
          intro: 'Les alertes, activités et approbations permettent de détecter les opérations sensibles : demandes RH, documents à valider, anomalies de référentiel ou événements de sécurité.',
          steps: [
            { title: 'Identifier les alertes critiques', detail: 'Commencez par les éléments signalés comme urgents ou bloquants.' },
            { title: 'Contrôler l’origine de l’événement', detail: 'Ouvrez le module concerné pour comprendre si l’alerte vient du personnel, des documents, des workflows ou du référentiel.' },
            { title: 'Traiter les approbations', detail: 'Validez, rejetez ou complétez les informations selon les règles internes.' },
            { title: 'Vérifier la trace d’activité', detail: 'Assurez-vous que l’action effectuée est bien visible dans l’historique récent.' }
          ],
          callouts: [
            { type: 'warning', title: 'Priorité', text: 'Une alerte critique doit être traitée avant les opérations sensibles comme l’import produit, la validation RH ou l’activation de workflows.' },
            { type: 'info', title: 'Traçabilité', text: 'Les actions restent associées au contexte utilisateur et au tenant courant afin de préserver l’auditabilité.' }
          ],
          bestPractices: ['Ne pas ignorer les alertes répétées.', 'Documenter les décisions de rejet.', 'Limiter les validations aux utilisateurs autorisés.'],
          faq: [{ q: 'Une alerte disparaît-elle automatiquement ?', a: 'Elle disparaît généralement lorsque la cause est corrigée ou que l’élément associé est validé.' }],
          related: ['administration-dashboard-vue-ensemble', 'administration-workflows-configuration'],
          keywords: ['alertes', 'approbations', 'activité', 'audit', 'sécurité']
        }
      ]
    },
    {
      id: 'administration-personnel',
      title: 'Personnel',
      icon: Users,
      articles: [
        {
          id: 'administration-personnel-roles',
          title: 'Personnel et rôles',
          objective: 'Créer une organisation claire en associant chaque collaborateur à un rôle adapté.',
          location: 'Administration → Gestion du Personnel',
          audience: ['Administrateurs', 'Pharmacien Titulaire'],
          intro: 'Les fiches personnel constituent la base des accès et responsabilités. PharmaSoft sépare l’identité métier, les comptes utilisateurs et les permissions pour limiter les erreurs de privilèges.',
          steps: [
            { title: 'Créer ou vérifier la fiche personnel', detail: 'Renseignez les informations professionnelles avant d’activer les accès.' },
            { title: 'Associer le bon rôle', detail: 'Attribuez le rôle correspondant à la fonction réelle : pharmacien, caissier, gestionnaire stock, comptable ou administrateur.' },
            { title: 'Contrôler les accès', detail: 'Vérifiez les modules visibles après création afin de confirmer le périmètre autorisé.' }
          ],
          callouts: [{ type: 'warning', title: 'Sécurité', text: 'Ne partagez jamais un compte utilisateur entre plusieurs personnes ; chaque action doit rester traçable.' }],
          bestPractices: ['Réviser les rôles après tout changement de poste.', 'Désactiver les accès des utilisateurs sortants sans supprimer l’historique métier.'],
          faq: [{ q: 'Un utilisateur peut-il avoir plusieurs responsabilités ?', a: 'Oui, mais les rôles doivent rester cohérents avec la politique de sécurité de l’officine.' }],
          related: ['administration-personnel-employes'],
          keywords: ['personnel', 'rôles', 'permissions', 'administration']
        },
        {
          id: 'administration-personnel-employes',
          title: 'Gérer les fiches employés',
          objective: 'Maintenir des fiches RH fiables pour suivre les collaborateurs et leurs informations métier.',
          location: 'Administration → Personnel → Employés',
          audience: ['Administrateurs', 'Pharmacien Titulaire', 'Responsables RH'],
          intro: 'L’onglet Employés permet de rechercher, filtrer, créer et modifier les fiches du personnel. Il couvre les informations personnelles, contractuelles et opérationnelles sans remplacer la gestion sécurisée des comptes utilisateurs.',
          steps: [
            { title: 'Rechercher un collaborateur', detail: 'Utilisez la barre de recherche et les filtres RH pour retrouver rapidement une fiche.' },
            { title: 'Choisir la vue adaptée', detail: 'Passez de la vue tableau à la vue cartes selon le volume de fiches à contrôler.' },
            { title: 'Créer ou modifier la fiche', detail: 'Renseignez les informations d’identité, de contact, de fonction, de contrat et d’affectation.' },
            { title: 'Contrôler le compte client associé', detail: 'Vérifiez les données synchronisées lorsque la fiche personnel alimente aussi un compte client interne.' },
            { title: 'Archiver ou supprimer avec prudence', detail: 'Avant suppression, vérifiez l’impact sur l’historique RH et les opérations liées.' }
          ],
          callouts: [
            { type: 'warning', title: 'Rôles séparés', text: 'Le formulaire RH ne doit pas modifier directement les rôles utilisateur ; les accès sont gérés dans les paramètres de sécurité.' },
            { type: 'info', title: 'Synchronisation', text: 'La création du personnel peut alimenter un compte client associé selon les règles métier du tenant.' }
          ],
          bestPractices: ['Uniformiser les noms et contacts.', 'Mettre à jour les fiches après chaque changement de poste.', 'Éviter les doublons de collaborateurs.'],
          faq: [{ q: 'Où modifier les accès applicatifs ?', a: 'Les accès et rôles se gèrent dans Paramètres → Utilisateurs, pas dans la fiche RH.' }],
          related: ['administration-personnel-roles', 'administration-personnel-plannings', 'administration-personnel-conges', 'administration-clients-gestion'],
          keywords: ['employés', 'personnel', 'RH', 'fiche', 'accès']
        },
        {
          id: 'administration-personnel-plannings',
          title: 'Planifier les horaires du personnel',
          objective: 'Organiser les présences et les shifts afin d’assurer la continuité opérationnelle.',
          location: 'Administration → Personnel → Plannings',
          audience: ['Administrateurs', 'Responsables RH', 'Pharmacien Titulaire'],
          intro: 'Les plannings structurent les horaires de travail par collaborateur, date, plage horaire, type de shift et poste. Ils facilitent l’anticipation des besoins en caisse, comptoir, stock ou administration.',
          steps: [
            { title: 'Sélectionner le collaborateur', detail: 'Choisissez une fiche personnel active et correctement renseignée.' },
            { title: 'Définir la période', detail: 'Indiquez la date, l’heure de début et l’heure de fin du shift.' },
            { title: 'Préciser le type de shift', detail: 'Qualifiez la présence : matin, après-midi, garde, permanence ou autre organisation interne.' },
            { title: 'Affecter un poste', detail: 'Associez le planning au rôle opérationnel attendu pendant la plage horaire.' },
            { title: 'Suivre le statut', detail: 'Utilisez les statuts Planifié, Confirmé, En cours, Terminé ou Annulé pour refléter la réalité.' }
          ],
          callouts: [
            { type: 'tip', title: 'Prévention', text: 'Vérifiez les conflits de présence et les congés validés avant de confirmer un planning.' },
            { type: 'info', title: 'Dépendance', text: 'Les plannings s’appuient sur les fiches personnel existantes ; une fiche incomplète limite la qualité du suivi.' }
          ],
          bestPractices: ['Planifier à l’avance les périodes de forte affluence.', 'Conserver les annulations justifiées.', 'Contrôler les chevauchements horaires.'],
          faq: [{ q: 'Puis-je planifier un employé absent ?', a: 'Il est préférable de vérifier les congés et indisponibilités avant toute confirmation.' }],
          related: ['administration-personnel-employes', 'administration-personnel-conges'],
          keywords: ['planning', 'horaires', 'shift', 'présence', 'personnel']
        },
        {
          id: 'administration-personnel-conges',
          title: 'Gérer les demandes de congé',
          objective: 'Suivre les absences et sécuriser les validations de congés du personnel.',
          location: 'Administration → Personnel → Congés',
          audience: ['Administrateurs', 'Responsables RH', 'Pharmacien Titulaire'],
          intro: 'L’onglet Congés centralise les demandes d’absence, leurs motifs, leurs périodes et leurs statuts de validation. Il aide à préserver l’organisation opérationnelle de l’officine.',
          steps: [
            { title: 'Créer une demande', detail: 'Sélectionnez l’employé, le type de congé et les dates de début et de fin.' },
            { title: 'Documenter le motif', detail: 'Ajoutez un commentaire clair pour faciliter la décision.' },
            { title: 'Contrôler les impacts', detail: 'Comparez la demande avec les plannings et les périodes de forte activité.' },
            { title: 'Approuver ou rejeter', detail: 'Validez la demande si elle est compatible avec l’organisation, sinon indiquez le motif de rejet.' },
            { title: 'Suivre le statut', detail: 'Maintenez les statuts à jour afin que les plannings restent cohérents.' }
          ],
          callouts: [
            { type: 'warning', title: 'Impact opérationnel', text: 'Approuver un congé peut modifier la disponibilité au comptoir, en caisse ou au stock.' },
            { type: 'tip', title: 'Lisibilité RH', text: 'Un motif explicite facilite l’arbitrage et évite les échanges informels non tracés.' }
          ],
          bestPractices: ['Vérifier les plannings avant validation.', 'Traiter les demandes dans un délai régulier.', 'Conserver une justification claire pour les refus.'],
          faq: [{ q: 'Un congé validé influence-t-il les plannings ?', a: 'Il doit être pris en compte lors de la planification afin d’éviter les affectations impossibles.' }],
          related: ['administration-personnel-plannings', 'administration-personnel-employes'],
          keywords: ['congés', 'absence', 'validation', 'RH', 'planning']
        },
        {
          id: 'administration-personnel-formations',
          title: 'Suivre les formations du personnel',
          objective: 'Planifier et tracer les formations suivies par les collaborateurs.',
          location: 'Administration → Personnel → Formations',
          audience: ['Administrateurs', 'Responsables RH', 'Pharmacien Titulaire'],
          intro: 'Les formations permettent de suivre le développement des compétences, les organismes, les périodes, la durée, les coûts et les certificats requis pour les collaborateurs.',
          steps: [
            { title: 'Créer une formation', detail: 'Renseignez le thème, l’employé concerné et l’organisme.' },
            { title: 'Définir la période', detail: 'Indiquez les dates, la durée et le statut initial.' },
            { title: 'Ajouter les informations financières', detail: 'Saisissez le coût lorsque la formation doit être suivie budgétairement.' },
            { title: 'Marquer le certificat requis', detail: 'Signalez les formations nécessitant une preuve ou une attestation.' },
            { title: 'Mettre à jour le statut', detail: 'Passez la formation de Planifié à En cours, Terminé ou Annulé selon l’avancement.' }
          ],
          callouts: [
            { type: 'info', title: 'Compétences', text: 'Le suivi des formations aide à démontrer les compétences et obligations internes de l’équipe.' },
            { type: 'tip', title: 'Certificats', text: 'Renseignez le besoin de certificat dès la création pour éviter les oublis en fin de formation.' }
          ],
          bestPractices: ['Archiver les formations terminées.', 'Rattacher chaque formation à un employé existant.', 'Suivre les formations réglementaires en priorité.'],
          faq: [{ q: 'Pourquoi suivre le coût ?', a: 'Le coût permet d’évaluer l’effort de formation et d’alimenter les analyses internes.' }],
          related: ['administration-personnel-employes'],
          keywords: ['formations', 'certificat', 'compétences', 'RH', 'organisme']
        }
      ]
    },
    {
      id: 'administration-partenaires',
      title: 'Partenaires',
      icon: ShoppingCart,
      articles: [
        {
          id: 'administration-partenaires-vue-ensemble',
          title: 'Lire la vue d’ensemble des partenaires',
          objective: 'Comprendre la structure des partenaires et accéder rapidement aux familles de tiers.',
          location: 'Administration → Partenaires → Vue d’ensemble',
          audience: ['Administrateurs', 'Pharmacien Titulaire', 'Gestionnaires partenaires'],
          intro: 'La vue d’ensemble Partenaires synthétise les assureurs, sociétés, conventionnés, fournisseurs et laboratoires. Elle facilite le contrôle des volumes et l’accès rapide aux listes métier.',
          steps: [
            { title: 'Consulter les compteurs', detail: 'Vérifiez le nombre d’assureurs, sociétés, conventionnés, fournisseurs et laboratoires.' },
            { title: 'Identifier les partenaires récents', detail: 'Contrôlez les dernières créations ou mises à jour.' },
            { title: 'Utiliser les actions rapides', detail: 'Ouvrez directement l’onglet correspondant au partenaire à gérer.' },
            { title: 'Vérifier la cohérence globale', detail: 'Comparez les volumes avec l’activité réelle de l’officine.' }
          ],
          callouts: [{ type: 'info', title: 'Vue transversale', text: 'Cette page ne remplace pas le contrôle détaillé des fiches assureurs, sociétés, fournisseurs ou laboratoires.' }],
          bestPractices: ['Contrôler les partenaires récents après un import.', 'Traiter les fiches incomplètes avant les ventes ou commandes.', 'Maintenir les contacts à jour.'],
          faq: [{ q: 'Pourquoi distinguer sociétés et conventionnés ?', a: 'Les règles de couverture, de dette et de synchronisation client peuvent différer selon le type de partenaire.' }],
          related: ['administration-partenaires-assureurs', 'administration-partenaires-societes', 'administration-partenaires-fournisseurs'],
          keywords: ['partenaires', 'assureurs', 'fournisseurs', 'laboratoires', 'sociétés']
        },
        {
          id: 'administration-partenaires-assureurs',
          title: 'Gérer les assureurs',
          objective: 'Créer et maintenir les assureurs utilisés dans les ventes et conventions.',
          location: 'Administration → Partenaires → Assureurs',
          audience: ['Administrateurs', 'Gestionnaires partenaires', 'Comptabilité'],
          intro: 'Les assureurs structurent les couvertures, limites de dette et relations de remboursement. Une fiche assureur fiable évite les erreurs de prise en charge et de relance.',
          steps: [
            { title: 'Rechercher l’assureur', detail: 'Vérifiez l’existence de la fiche pour éviter les doublons.' },
            { title: 'Créer ou modifier la fiche', detail: 'Renseignez le nom, le NIU, les contacts, l’e-mail et les informations administratives.' },
            { title: 'Définir la limite de dette', detail: 'Saisissez une limite cohérente avec les conventions de l’assureur.' },
            { title: 'Contrôler les contacts', detail: 'Vérifiez téléphone d’appel, WhatsApp et e-mail pour les relances.' },
            { title: 'Supprimer avec contrôle', detail: 'Assurez-vous que l’assureur n’est plus utilisé par des sociétés ou conventionnés actifs.' }
          ],
          callouts: [
            { type: 'warning', title: 'Dette assurée', text: 'La limite de dette influence le contrôle des ventes assurées et le suivi des encours.' },
            { type: 'tip', title: 'Relances', text: 'Maintenez les contacts WhatsApp et appels à jour pour accélérer les échanges.' }
          ],
          bestPractices: ['Normaliser les noms d’assureurs.', 'Contrôler les NIU avant création.', 'Réviser les limites de dette périodiquement.'],
          faq: [{ q: 'Un assureur peut-il être lié à plusieurs sociétés ?', a: 'Oui, plusieurs sociétés ou conventionnés peuvent dépendre du même assureur.' }],
          related: ['administration-partenaires-societes', 'administration-partenaires-conventionnes'],
          keywords: ['assureurs', 'couverture', 'dette', 'NIU', 'relance']
        },
        {
          id: 'administration-partenaires-societes',
          title: 'Gérer les sociétés partenaires',
          objective: 'Configurer les sociétés prises en charge avec leurs règles de couverture et de facturation.',
          location: 'Administration → Partenaires → Sociétés',
          audience: ['Administrateurs', 'Gestionnaires partenaires', 'Comptabilité'],
          intro: 'Les sociétés partenaires définissent les conditions de couverture des agents et ayants droit : assureur associé, taux, remise, limites, bons, ticket modérateur et caution.',
          steps: [
            { title: 'Créer la société', detail: 'Renseignez l’identité, les contacts et les informations administratives.' },
            { title: 'Associer un assureur', detail: 'Sélectionnez l’assureur responsable lorsque la société dépend d’une couverture assurantielle.' },
            { title: 'Paramétrer les taux', detail: 'Définissez les taux agent et ayant droit ainsi que les remises automatiques.' },
            { title: 'Configurer les limites', detail: 'Indiquez limite de dette, bon autorisé, ticket modérateur et caution si applicable.' },
            { title: 'Contrôler la synchronisation client', detail: 'Vérifiez que le compte client associé reflète les informations de la société.' }
          ],
          callouts: [
            { type: 'info', title: 'Compte client', text: 'La création ou modification d’une société peut synchroniser automatiquement le compte client associé.' },
            { type: 'warning', title: 'Taux sensibles', text: 'Les taux de couverture doivent être validés avant les ventes, car ils influencent le reste à charge.' }
          ],
          bestPractices: ['Vérifier les taux avec la convention signée.', 'Éviter les sociétés dupliquées.', 'Contrôler les limites avant les ventes à crédit.'],
          faq: [{ q: 'Pourquoi paramétrer agent et ayant droit séparément ?', a: 'Ces deux profils peuvent avoir des niveaux de couverture différents au POS.' }],
          related: ['administration-partenaires-assureurs', 'administration-clients-gestion'],
          keywords: ['sociétés', 'couverture', 'agent', 'ayant droit', 'ticket modérateur']
        },
        {
          id: 'administration-partenaires-conventionnes',
          title: 'Gérer les clients conventionnés',
          objective: 'Administrer les conventions individuelles ou institutionnelles et leurs règles financières.',
          location: 'Administration → Partenaires → Conventionnés',
          audience: ['Administrateurs', 'Gestionnaires partenaires', 'Comptabilité'],
          intro: 'Les conventionnés représentent des établissements ou personnes bénéficiant de conditions spécifiques. Ils peuvent être rattachés à un assureur, disposer de limites financières, de bons, d’une caution et d’une couverture dédiée.',
          steps: [
            { title: 'Identifier le conventionné', detail: 'Renseignez le nom, le type et les coordonnées de l’établissement ou de la personne.' },
            { title: 'Associer les garanties', detail: 'Sélectionnez l’assureur et les taux de couverture applicables.' },
            { title: 'Définir les règles financières', detail: 'Configurez limite de dette, bons, caution et ticket modérateur.' },
            { title: 'Vérifier le compte client', detail: 'Contrôlez la synchronisation automatique du client lié.' },
            { title: 'Mettre à jour ou désactiver', detail: 'Modifiez les conditions lorsque la convention change et évitez les suppressions non contrôlées.' }
          ],
          callouts: [
            { type: 'info', title: 'Synchronisation', text: 'Les comptes clients conventionnés sont créés ou mis à jour automatiquement pour rester cohérents avec les ventes.' },
            { type: 'warning', title: 'Impact client', text: 'Supprimer ou modifier un conventionné peut impacter le suivi du compte client et des encours.' }
          ],
          bestPractices: ['Conserver les conditions contractuelles à jour.', 'Vérifier les limites avant les ventes.', 'Contrôler les doublons de conventionnés.'],
          faq: [{ q: 'Un conventionné peut-il avoir un assureur ?', a: 'Oui, lorsqu’une prise en charge externe est associée à la convention.' }],
          related: ['administration-partenaires-assureurs', 'administration-clients-gestion'],
          keywords: ['conventionnés', 'clients', 'couverture', 'caution', 'bons']
        },
        {
          id: 'administration-partenaires-fournisseurs',
          title: 'Gérer les fournisseurs',
          objective: 'Maintenir les fournisseurs utilisés pour les achats, commandes et automatisations d’approvisionnement.',
          location: 'Administration → Partenaires → Fournisseurs',
          audience: ['Administrateurs', 'Gestionnaires stock', 'Acheteurs'],
          intro: 'Les fournisseurs alimentent les processus d’approvisionnement. La fiche peut contenir contacts, NIU, URL d’import, identifiants fournisseur et indicateur de configuration d’automatisation.',
          steps: [
            { title: 'Vérifier l’existence du fournisseur', detail: 'Recherchez la fiche avant toute création.' },
            { title: 'Renseigner les informations de contact', detail: 'Ajoutez téléphone, e-mail, NIU et informations utiles aux commandes.' },
            { title: 'Configurer l’accès fournisseur', detail: 'Complétez URL fournisseur ou URL d’import lorsque l’approvisionnement automatisé est prévu.' },
            { title: 'Sécuriser les identifiants', detail: 'Saisissez les accès uniquement si la politique interne l’autorise.' },
            { title: 'Contrôler l’état Browse AI', detail: 'Vérifiez si le fournisseur est prêt pour les automatisations prévues.' }
          ],
          callouts: [
            { type: 'warning', title: 'Confidentialité', text: 'Les identifiants fournisseurs sont sensibles et ne doivent être accessibles qu’aux utilisateurs autorisés.' },
            { type: 'tip', title: 'Automatisation', text: 'Une URL d’import fiable prépare les futurs workflows d’approvisionnement et de comparaison.' }
          ],
          bestPractices: ['Tenir les contacts fournisseurs à jour.', 'Éviter les doublons avant les commandes.', 'Limiter l’accès aux identifiants sensibles.'],
          faq: [{ q: 'Pourquoi renseigner une URL fournisseur ?', a: 'Elle facilite les imports ou automatisations liés aux catalogues et commandes.' }],
          related: ['administration-workflows-configuration', 'administration-referentiel-catalogue'],
          keywords: ['fournisseurs', 'approvisionnement', 'import', 'Browse AI', 'NIU']
        },
        {
          id: 'administration-partenaires-laboratoires',
          title: 'Gérer les laboratoires pharmaceutiques',
          objective: 'Référencer les laboratoires et leurs contacts locaux ou internationaux.',
          location: 'Administration → Partenaires → Laboratoires',
          audience: ['Administrateurs', 'Pharmaciens', 'Gestionnaires stock'],
          intro: 'Les laboratoires permettent d’identifier les acteurs pharmaceutiques liés aux produits, contacts de délégation, pays du siège et moyens de communication.',
          steps: [
            { title: 'Rechercher le laboratoire', detail: 'Vérifiez s’il existe déjà dans la liste.' },
            { title: 'Créer ou modifier la fiche', detail: 'Renseignez le nom, le pays du siège et l’e-mail principal.' },
            { title: 'Ajouter la délégation locale', detail: 'Précisez les contacts locaux pour les échanges opérationnels.' },
            { title: 'Compléter les téléphones', detail: 'Indiquez les numéros d’appel et WhatsApp utiles.' },
            { title: 'Maintenir la liste', detail: 'Mettez à jour les fiches lorsque les délégations ou contacts changent.' }
          ],
          callouts: [{ type: 'info', title: 'Référentiel partenaire', text: 'Une base laboratoire propre facilite les échanges pharmaceutiques et la qualification des produits.' }],
          bestPractices: ['Uniformiser les noms de laboratoires.', 'Vérifier les contacts de délégation.', 'Archiver les fiches obsolètes avec prudence.'],
          faq: [{ q: 'Le laboratoire remplace-t-il le fournisseur ?', a: 'Non, le laboratoire est le fabricant ou détenteur pharmaceutique ; le fournisseur gère l’approvisionnement.' }],
          related: ['administration-referentiel-catalogue', 'administration-partenaires-fournisseurs'],
          keywords: ['laboratoires', 'pharmaceutique', 'délégation', 'contacts', 'fabricant']
        }
      ]
    },
    {
      id: 'administration-referentiel',
      title: 'Référentiel produits',
      icon: Package,
      articles: [
        {
          id: 'administration-referentiel-produits',
          title: 'Référentiel produits',
          objective: 'Maintenir une base produit cohérente pour fiabiliser les ventes, stocks et rapports.',
          location: 'Administration → Référentiel Produits',
          audience: ['Administrateurs', 'Gestionnaires stock', 'Pharmaciens'],
          intro: 'Le référentiel produit centralise les informations commerciales et pharmaceutiques utilisées par les modules Stock et Ventes.',
          steps: [
            { title: 'Rechercher avant de créer', detail: 'Vérifiez l’existence du produit pour éviter les doublons.' },
            { title: 'Contrôler les identifiants', detail: 'Renseignez code CIP, famille, catégorie et informations de prix selon les règles internes.' },
            { title: 'Valider les dépendances', detail: 'Avant toute modification importante, vérifiez l’usage du produit dans le stock et les transactions.' }
          ],
          callouts: [{ type: 'info', text: 'Un référentiel propre améliore la qualité des rapports et des recommandations IA.' }],
          bestPractices: ['Uniformiser les libellés produits.', 'Éviter les créations manuelles redondantes lorsque le catalogue global suffit.'],
          faq: [{ q: 'Pourquoi certains champs sont obligatoires ?', a: 'Ils alimentent les contrôles de stock, la facturation et les états réglementaires.' }],
          related: ['administration-referentiel-catalogue'],
          keywords: ['référentiel', 'produits', 'catalogue']
        },
        {
          id: 'administration-referentiel-vue-ensemble',
          title: 'Lire la vue d’ensemble du référentiel produits',
          objective: 'Contrôler la complétude des familles, formes, rayons, catégories, DCI et réglementations.',
          location: 'Administration → Référentiel Produits → Vue d’ensemble',
          audience: ['Administrateurs', 'Gestionnaires stock', 'Pharmaciens'],
          intro: 'La vue d’ensemble du référentiel produits donne une lecture rapide des volumes et des données récentes qui structurent le catalogue utilisé par les ventes, le stock et les rapports.',
          steps: [
            { title: 'Lire les compteurs', detail: 'Contrôlez produits, familles, formes, rayons, catégories, DCI, classes et réglementations.' },
            { title: 'Examiner les produits récents', detail: 'Vérifiez les dernières créations ou modifications du catalogue.' },
            { title: 'Accéder aux actions rapides', detail: 'Ouvrez l’onglet à corriger lorsque la vue d’ensemble montre une incohérence.' },
            { title: 'Prioriser les corrections', detail: 'Traitez d’abord les données qui impactent ventes, stock ou conformité.' }
          ],
          callouts: [{ type: 'info', title: 'Qualité référentielle', text: 'Des référentiels complets améliorent la recherche produit, les rapports et les automatisations.' }],
          bestPractices: ['Contrôler les compteurs après import.', 'Corriger les référentiels avant de créer des produits en masse.', 'Éviter les libellés ambigus.'],
          faq: [{ q: 'Pourquoi suivre les DCI et classes ?', a: 'Elles enrichissent l’identification pharmaceutique et les analyses par catégorie thérapeutique.' }],
          related: ['administration-referentiel-catalogue', 'administration-referentiel-dci'],
          keywords: ['référentiel', 'vue ensemble', 'catalogue', 'familles', 'DCI']
        },
        {
          id: 'administration-referentiel-catalogue',
          title: 'Gérer le catalogue produits',
          objective: 'Créer, importer et maintenir les produits avec des données fiables et traçables.',
          location: 'Administration → Référentiel Produits → Catalogue',
          audience: ['Administrateurs', 'Gestionnaires stock', 'Pharmaciens'],
          intro: 'Le catalogue produits est la base utilisée par le stock, les ventes, les factures et les rapports. Chaque fiche doit être cohérente, unique et suffisamment renseignée pour éviter les erreurs opérationnelles.',
          steps: [
            { title: 'Rechercher le produit', detail: 'Utilisez le libellé, le code CIP ou les filtres disponibles avant toute création.' },
            { title: 'Créer ou modifier la fiche', detail: 'Renseignez les informations commerciales, pharmaceutiques et de classification.' },
            { title: 'Importer avec contrôle', detail: 'Lors d’un import, vérifiez les correspondances pour éviter les doublons.' },
            { title: 'Contrôler les dépendances', detail: 'Avant désactivation, consultez les liens avec stock, lots, ventes ou documents.' },
            { title: 'Valider la cohérence', detail: 'Vérifiez prix, catégorie, famille, DCI et réglementation si applicable.' }
          ],
          callouts: [
            { type: 'warning', title: 'Nom de champ', text: 'Les références produit utilisent libelle_produit ; ne jamais raisonner avec une colonne nom inexistante.' },
            { type: 'info', title: 'Traçabilité', text: 'Le modal de dépendances aide à éviter la désactivation d’un produit encore utilisé.' }
          ],
          bestPractices: ['Rechercher avant de créer.', 'Normaliser les libellés.', 'Vérifier les dépendances avant désactivation.'],
          faq: [{ q: 'Pourquoi le code CIP est-il important ?', a: 'Il facilite l’identification produit, les imports et les rapprochements avec le stock.' }],
          related: ['administration-referentiel-dci', 'administration-referentiel-classes-therapeutiques', 'administration-referentiel-familles'],
          keywords: ['catalogue', 'libelle_produit', 'CIP', 'produits', 'import']
        },
        {
          id: 'administration-referentiel-formes',
          title: 'Maintenir les formes galéniques',
          objective: 'Classer les produits selon leur forme pour améliorer la recherche et la cohérence pharmaceutique.',
          location: 'Administration → Référentiel Produits → Formes',
          audience: ['Administrateurs', 'Pharmaciens', 'Gestionnaires stock'],
          intro: 'Les formes galéniques décrivent la présentation du médicament ou produit : comprimé, sirop, injectable, pommade, solution, etc. Elles améliorent la précision du catalogue.',
          steps: [
            { title: 'Rechercher la forme', detail: 'Vérifiez si la forme existe déjà avant de créer une nouvelle entrée.' },
            { title: 'Créer la forme', detail: 'Renseignez un libellé clair et une description si nécessaire.' },
            { title: 'Modifier les libellés ambigus', detail: 'Corrigez les formes trop générales ou mal orthographiées.' },
            { title: 'Supprimer avec prudence', detail: 'Contrôlez l’usage dans les produits avant suppression.' }
          ],
          callouts: [{ type: 'tip', title: 'Uniformisation', text: 'Préférez des libellés courts et standards pour faciliter la recherche.' }],
          bestPractices: ['Éviter les synonymes inutiles.', 'Conserver une nomenclature stable.', 'Renseigner une description pour les formes rares.'],
          faq: [{ q: 'Une forme peut-elle être partagée par plusieurs produits ?', a: 'Oui, elle sert de référentiel commun pour tout le catalogue.' }],
          related: ['administration-referentiel-catalogue'],
          keywords: ['formes', 'galénique', 'catalogue', 'produits', 'référentiel']
        },
        {
          id: 'administration-referentiel-familles',
          title: 'Organiser les familles de produits',
          objective: 'Structurer les produits par familles commerciales ou opérationnelles.',
          location: 'Administration → Référentiel Produits → Familles',
          audience: ['Administrateurs', 'Gestionnaires stock'],
          intro: 'Les familles de produits facilitent la classification commerciale, la recherche et les analyses. Elles doivent rester cohérentes pour éviter les segmentations contradictoires.',
          steps: [
            { title: 'Contrôler les familles existantes', detail: 'Recherchez les doublons ou libellés proches.' },
            { title: 'Créer une famille', detail: 'Renseignez le libellé et la description de la famille.' },
            { title: 'Rattacher les produits', detail: 'Utilisez la famille dans les fiches produit concernées.' },
            { title: 'Nettoyer les incohérences', detail: 'Fusionnez conceptuellement les libellés redondants avant de poursuivre les imports.' }
          ],
          callouts: [{ type: 'warning', title: 'Schéma', text: 'La table correcte est famille_produit, pas familles.' }],
          bestPractices: ['Limiter le nombre de familles trop proches.', 'Décrire les familles ambiguës.', 'Réviser la nomenclature avant import massif.'],
          faq: [{ q: 'Une famille est-elle une catégorie tarifaire ?', a: 'Non, la famille classe le produit ; la catégorie peut porter une logique tarifaire ou commerciale distincte.' }],
          related: ['administration-referentiel-catalogue', 'administration-referentiel-categories'],
          keywords: ['familles', 'famille_produit', 'classification', 'référentiel', 'produits']
        },
        {
          id: 'administration-referentiel-rayons',
          title: 'Organiser les rayons de produits',
          objective: 'Définir les rayons pour faciliter l’organisation physique ou logique de l’officine.',
          location: 'Administration → Référentiel Produits → Rayons',
          audience: ['Administrateurs', 'Gestionnaires stock', 'Responsables rayon'],
          intro: 'Les rayons décrivent l’emplacement ou la logique d’exposition des produits. Ils aident les équipes à retrouver les articles et peuvent soutenir les analyses par zone.',
          steps: [
            { title: 'Lister les rayons existants', detail: 'Vérifiez que la nomenclature correspond à l’organisation réelle.' },
            { title: 'Créer un rayon', detail: 'Renseignez un libellé clair et une description utile.' },
            { title: 'Associer les produits', detail: 'Mettez à jour les fiches produit pour refléter l’emplacement prévu.' },
            { title: 'Réviser après réaménagement', detail: 'Actualisez les rayons lorsque l’organisation physique change.' }
          ],
          callouts: [{ type: 'tip', title: 'Terrain', text: 'Alignez les libellés de rayons avec les habitudes de recherche de l’équipe au comptoir.' }],
          bestPractices: ['Éviter les rayons trop génériques.', 'Conserver une logique stable.', 'Former l’équipe aux libellés retenus.'],
          faq: [{ q: 'Le rayon est-il obligatoire ?', a: 'Il dépend de la politique interne, mais il améliore l’organisation et la recherche.' }],
          related: ['administration-referentiel-catalogue'],
          keywords: ['rayons', 'emplacement', 'stock', 'catalogue', 'organisation']
        },
        {
          id: 'administration-referentiel-categories',
          title: 'Configurer les catégories tarifaires',
          objective: 'Définir les catégories utilisées pour organiser les prix, les ventes et les rapports.',
          location: 'Administration → Référentiel Produits → Catégories',
          audience: ['Administrateurs', 'Gestionnaires stock', 'Comptabilité'],
          intro: 'Les catégories produits peuvent porter une logique commerciale, tarifaire ou analytique. Elles contribuent à la lisibilité des ventes et des rapports.',
          steps: [
            { title: 'Consulter les catégories', detail: 'Identifiez les catégories existantes et leur usage.' },
            { title: 'Créer une catégorie', detail: 'Renseignez un libellé cohérent avec la politique commerciale.' },
            { title: 'Associer les produits', detail: 'Rattachez les produits concernés dans le catalogue.' },
            { title: 'Contrôler les rapports', detail: 'Vérifiez que les analyses reflètent correctement les catégories retenues.' }
          ],
          callouts: [{ type: 'info', title: 'Analyse', text: 'Des catégories stables rendent les rapports de ventes et d’inventaire plus fiables.' }],
          bestPractices: ['Éviter les catégories redondantes.', 'Documenter les règles tarifaires internes.', 'Contrôler les impacts avant modification massive.'],
          faq: [{ q: 'Une catégorie modifie-t-elle automatiquement le prix ?', a: 'Elle peut soutenir une logique tarifaire, mais le prix final dépend des règles implémentées et de la fiche produit.' }],
          related: ['administration-referentiel-catalogue', 'administration-analytics-ventes'],
          keywords: ['catégories', 'tarif', 'ventes', 'rapports', 'produits']
        },
        {
          id: 'administration-referentiel-dci',
          title: 'Maintenir les DCI',
          objective: 'Référencer les dénominations communes internationales pour fiabiliser l’identification pharmaceutique.',
          location: 'Administration → Référentiel Produits → DCI',
          audience: ['Pharmaciens', 'Administrateurs', 'Gestionnaires stock'],
          intro: 'Les DCI décrivent les principes actifs et facilitent la recherche, le conseil, les substitutions et l’analyse pharmaceutique du catalogue.',
          steps: [
            { title: 'Rechercher la DCI', detail: 'Vérifiez l’existence du principe actif avant création.' },
            { title: 'Créer ou modifier', detail: 'Saisissez un libellé normalisé et une description si nécessaire.' },
            { title: 'Associer aux produits', detail: 'Rattachez les produits concernés dans le catalogue.' },
            { title: 'Corriger les doublons', detail: 'Évitez les variantes orthographiques non maîtrisées.' }
          ],
          callouts: [{ type: 'info', title: 'Pharmacie', text: 'Une DCI bien renseignée améliore la qualité du conseil et des recherches par principe actif.' }],
          bestPractices: ['Utiliser les libellés DCI officiels.', 'Éviter les abréviations internes.', 'Relire les imports de principes actifs.'],
          faq: [{ q: 'Une DCI peut-elle concerner plusieurs produits ?', a: 'Oui, plusieurs spécialités peuvent partager une même DCI.' }],
          related: ['administration-referentiel-catalogue', 'administration-referentiel-classes-therapeutiques'],
          keywords: ['DCI', 'principe actif', 'pharmacie', 'catalogue', 'recherche']
        },
        {
          id: 'administration-referentiel-classes-therapeutiques',
          title: 'Classer les produits par classes thérapeutiques',
          objective: 'Organiser les produits selon leur usage thérapeutique pour améliorer la recherche et l’analyse.',
          location: 'Administration → Référentiel Produits → Classes thérapeutiques',
          audience: ['Pharmaciens', 'Administrateurs', 'Gestionnaires stock'],
          intro: 'Les classes thérapeutiques regroupent les produits selon leur finalité médicale. Elles enrichissent le catalogue, les analyses et les recherches orientées conseil.',
          steps: [
            { title: 'Consulter les classes existantes', detail: 'Recherchez les libellés déjà disponibles.' },
            { title: 'Créer ou modifier la classe', detail: 'Renseignez le libellé et la description fonctionnelle.' },
            { title: 'Rattacher les produits', detail: 'Associez les produits à la classe thérapeutique pertinente.' },
            { title: 'Contrôler la cohérence', detail: 'Évitez les classes trop larges ou redondantes.' }
          ],
          callouts: [{ type: 'info', title: 'Schéma', text: 'La colonne correcte pour le libellé est libelle_classe.' }],
          bestPractices: ['Conserver une classification lisible.', 'Éviter les doublons thérapeutiques.', 'Faire valider les classes sensibles par un pharmacien.'],
          faq: [{ q: 'Classe thérapeutique et DCI sont-elles identiques ?', a: 'Non, la DCI décrit le principe actif ; la classe regroupe les produits par usage thérapeutique.' }],
          related: ['administration-referentiel-dci', 'administration-referentiel-catalogue'],
          keywords: ['classes', 'thérapeutiques', 'libelle_classe', 'DCI', 'analyse']
        },
        {
          id: 'administration-referentiel-reglementations',
          title: 'Suivre les réglementations produits',
          objective: 'Maintenir les informations réglementaires utiles aux produits sensibles ou encadrés.',
          location: 'Administration → Référentiel Produits → Réglementations',
          audience: ['Pharmaciens', 'Administrateurs', 'Responsables conformité'],
          intro: 'Les réglementations produits permettent de signaler les statuts, contraintes ou classifications nécessaires à la conformité et au suivi des produits sensibles.',
          steps: [
            { title: 'Consulter les statuts', detail: 'Identifiez les réglementations déjà enregistrées.' },
            { title: 'Créer une réglementation', detail: 'Renseignez le libellé, la description et la portée attendue.' },
            { title: 'Associer aux produits concernés', detail: 'Mettez à jour les fiches produit nécessitant ce statut.' },
            { title: 'Réviser périodiquement', detail: 'Actualisez les informations lorsque le cadre réglementaire évolue.' }
          ],
          callouts: [{ type: 'warning', title: 'Conformité', text: 'Une réglementation obsolète peut fausser le suivi des produits sensibles.' }],
          bestPractices: ['Faire valider les statuts par un pharmacien.', 'Documenter les changements réglementaires.', 'Contrôler les produits sensibles après modification.'],
          faq: [{ q: 'La réglementation bloque-t-elle automatiquement une vente ?', a: 'Elle fournit une information de suivi ; les blocages dépendent des règles fonctionnelles activées.' }],
          related: ['administration-referentiel-catalogue'],
          keywords: ['réglementations', 'conformité', 'produits sensibles', 'catalogue', 'statut']
        }
      ]
    },
    {
      id: 'administration-clients',
      title: 'Clients',
      icon: Receipt,
      articles: [
        {
          id: 'administration-clients-analytics',
          title: 'Analyser le fichier clients',
          objective: 'Comprendre la composition et l’activité du portefeuille clients.',
          location: 'Administration → Clients → Analytics',
          audience: ['Administrateurs', 'Pharmacien Titulaire', 'Comptabilité'],
          intro: 'L’onglet Analytics clients synthétise la répartition, les types de clients, les remises et l’activité afin de mieux suivre les comptes ordinaires, personnel, entreprises et conventionnés.',
          steps: [
            { title: 'Lire la synthèse', detail: 'Consultez les indicateurs globaux du fichier clients.' },
            { title: 'Analyser la répartition', detail: 'Comparez les types de clients et les volumes associés.' },
            { title: 'Contrôler les remises', detail: 'Vérifiez la cohérence des remises appliquées aux familles de clients.' },
            { title: 'Identifier les comptes actifs', detail: 'Repérez les clients ayant une activité récente ou stratégique.' }
          ],
          callouts: [{ type: 'info', title: 'Origine des comptes', text: 'Certains comptes clients sont créés automatiquement depuis Personnel, Sociétés ou Conventionnés.' }],
          bestPractices: ['Analyser les clients avant les campagnes commerciales.', 'Contrôler les remises atypiques.', 'Comparer analytics et ventes réelles.'],
          faq: [{ q: 'Pourquoi un client apparaît-il sans création manuelle ?', a: 'Il peut provenir d’une synchronisation automatique depuis un autre module.' }],
          related: ['administration-clients-gestion', 'administration-partenaires-societes'],
          keywords: ['clients', 'analytics', 'remises', 'activité', 'répartition']
        },
        {
          id: 'administration-clients-gestion',
          title: 'Consulter et gérer les clients',
          objective: 'Maintenir les comptes clients tout en respectant leur module d’origine.',
          location: 'Administration → Clients → Clients',
          audience: ['Administrateurs', 'Comptabilité', 'Responsables relation client'],
          intro: 'La liste Clients permet de rechercher, filtrer, afficher en tableau ou cartes et modifier les clients ordinaires. Les clients synchronisés depuis Personnel, Sociétés ou Conventionnés doivent rester pilotés par leur module source.',
          steps: [
            { title: 'Rechercher un client', detail: 'Utilisez les filtres par type, remise ou statut pour cibler le compte.' },
            { title: 'Choisir l’affichage', detail: 'Utilisez la vue tableau pour comparer et la vue cartes pour lire les détails.' },
            { title: 'Modifier un client ordinaire', detail: 'Mettez à jour les informations de contact et les paramètres autorisés.' },
            { title: 'Identifier l’origine', detail: 'Repérez les comptes issus du personnel, d’une société ou d’un conventionné.' },
            { title: 'Corriger au bon endroit', detail: 'Retournez dans le module source pour modifier les clients synchronisés.' }
          ],
          callouts: [
            { type: 'warning', title: 'Module source', text: 'Les clients Personnel, Entreprise et Conventionné doivent être modifiés depuis leur module d’origine pour éviter les désynchronisations.' },
            { type: 'info', title: 'Synchronisation', text: 'Les comptes clients peuvent être créés automatiquement depuis Personnel, Sociétés et Conventionnés.' }
          ],
          bestPractices: ['Vérifier le type de client avant modification.', 'Éviter les doublons de comptes.', 'Contrôler les remises et coordonnées sensibles.'],
          faq: [{ q: 'Pourquoi certains clients sont verrouillés ?', a: 'Ils peuvent être synchronisés depuis un module source qui reste responsable de leurs données principales.' }],
          related: ['administration-clients-analytics', 'administration-personnel-employes', 'administration-partenaires-conventionnes'],
          keywords: ['clients', 'gestion', 'synchronisation', 'remise', 'compte']
        }
      ]
    },
    {
      id: 'administration-documents',
      title: 'Documents et communications',
      icon: FileText,
      articles: [
        {
          id: 'administration-documents-bibliotheque',
          title: 'Utiliser la bibliothèque de documents',
          objective: 'Centraliser, retrouver et maintenir les documents administratifs de l’officine.',
          location: 'Administration → Documents → Vue Grille / Vue Liste',
          audience: ['Administrateurs', 'Personnel administratif', 'Pharmacien Titulaire'],
          intro: 'La bibliothèque documentaire propose la recherche, les filtres par catégorie, les vues grille/liste, l’upload, l’édition de métadonnées, la consultation, le téléchargement et la suppression contrôlée.',
          steps: [
            { title: 'Rechercher un document', detail: 'Utilisez la recherche et les catégories pour réduire la liste.' },
            { title: 'Changer de vue', detail: 'Utilisez la grille pour un aperçu visuel ou la liste pour comparer les métadonnées.' },
            { title: 'Importer un fichier', detail: 'Ajoutez le document avec un titre, une catégorie et les informations utiles.' },
            { title: 'Éditer les métadonnées', detail: 'Corrigez titre, catégorie ou description sans réimporter inutilement.' },
            { title: 'Consulter ou télécharger', detail: 'Ouvrez le document ou téléchargez-le selon le besoin opérationnel.' }
          ],
          callouts: [{ type: 'warning', title: 'Suppression', text: 'Supprimez uniquement les documents obsolètes et non nécessaires à l’audit interne.' }],
          bestPractices: ['Classer chaque document dès l’import.', 'Utiliser des titres explicites.', 'Éviter les versions non identifiées.'],
          faq: [{ q: 'Quelle vue choisir ?', a: 'La grille est utile pour parcourir ; la liste est préférable pour contrôler dates, catégories et métadonnées.' }],
          related: ['administration-documents-categories', 'administration-documents-templates'],
          keywords: ['documents', 'bibliothèque', 'upload', 'grille', 'liste']
        },
        {
          id: 'administration-documents-categories',
          title: 'Classer les documents par catégories',
          objective: 'Organiser les documents avec des catégories système ou personnalisées.',
          location: 'Administration → Documents → Catégories',
          audience: ['Administrateurs', 'Personnel administratif'],
          intro: 'Les catégories documentaires permettent de classer les fichiers, courriers, modèles et communications selon leur usage : RH, finance, conformité, partenaires ou exploitation.',
          steps: [
            { title: 'Consulter les catégories', detail: 'Identifiez les catégories système et personnalisées disponibles.' },
            { title: 'Créer une catégorie', detail: 'Renseignez le nom, la couleur et la description.' },
            { title: 'Classer les documents', detail: 'Appliquez la catégorie aux documents concernés.' },
            { title: 'Réviser la nomenclature', detail: 'Supprimez ou fusionnez les catégories inutiles selon les règles internes.' }
          ],
          callouts: [{ type: 'tip', title: 'Lisibilité', text: 'Une couleur cohérente par famille documentaire accélère le repérage visuel.' }],
          bestPractices: ['Limiter les catégories redondantes.', 'Décrire l’usage de chaque catégorie.', 'Conserver les catégories système nécessaires.'],
          faq: [{ q: 'Puis-je modifier une catégorie utilisée ?', a: 'Oui, mais vérifiez l’impact sur le classement des documents existants.' }],
          related: ['administration-documents-bibliotheque'],
          keywords: ['catégories', 'documents', 'classement', 'couleur', 'métadonnées']
        },
        {
          id: 'administration-documents-courriers',
          title: 'Gérer les courriers administratifs',
          objective: 'Créer et suivre les courriers nécessaires à l’activité administrative.',
          location: 'Administration → Documents → Courriers',
          audience: ['Administrateurs', 'Personnel administratif'],
          intro: 'L’onglet Courriers aide à préparer, organiser et suivre les correspondances administratives avec partenaires, autorités, personnel ou clients.',
          steps: [
            { title: 'Créer un courrier', detail: 'Renseignez l’objet, le destinataire et le contenu principal.' },
            { title: 'Utiliser un modèle si disponible', detail: 'Reprenez un template pour homogénéiser la présentation.' },
            { title: 'Compléter les informations de suivi', detail: 'Ajoutez statut, date ou notes internes selon le processus.' },
            { title: 'Archiver le courrier', detail: 'Classez le document final dans la bibliothèque ou la catégorie appropriée.' }
          ],
          callouts: [{ type: 'info', title: 'Traçabilité', text: 'Un courrier archivé et catégorisé facilite le suivi administratif et les recherches futures.' }],
          bestPractices: ['Utiliser des objets explicites.', 'Relire avant envoi.', 'Classer le courrier final dans la bonne catégorie.'],
          faq: [{ q: 'Les courriers remplacent-ils les documents ?', a: 'Non, ils produisent ou suivent des correspondances qui peuvent ensuite être archivées comme documents.' }],
          related: ['administration-documents-templates', 'administration-documents-bibliotheque'],
          keywords: ['courriers', 'administratif', 'correspondance', 'templates', 'documents']
        },
        {
          id: 'administration-documents-emails',
          title: 'Préparer et suivre les emails',
          objective: 'Structurer les communications par e-mail et garder une trace des échanges importants.',
          location: 'Administration → Documents → Emails',
          audience: ['Administrateurs', 'Personnel administratif', 'Support interne'],
          intro: 'L’onglet Emails permet de préparer des messages administratifs, renseigner les destinataires, organiser les contenus et suivre les communications importantes.',
          steps: [
            { title: 'Créer un email', detail: 'Renseignez le destinataire, l’objet et le contenu.' },
            { title: 'Utiliser un modèle', detail: 'Sélectionnez un template lorsque le message correspond à un cas récurrent.' },
            { title: 'Relire le contenu', detail: 'Vérifiez les informations sensibles, montants, dates et coordonnées.' },
            { title: 'Suivre l’échange', detail: 'Conservez les notes ou statuts nécessaires au suivi administratif.' }
          ],
          callouts: [{ type: 'warning', title: 'Données sensibles', text: 'Vérifiez les destinataires avant tout envoi contenant des informations clients, RH ou financières.' }],
          bestPractices: ['Utiliser des objets normalisés.', 'Relire les coordonnées.', 'Archiver les communications importantes.'],
          faq: [{ q: 'Quand utiliser un template ?', a: 'Pour les messages récurrents comme relances, demandes de pièces ou réponses administratives.' }],
          related: ['administration-documents-templates', 'administration-documents-courriers'],
          keywords: ['emails', 'communications', 'destinataire', 'templates', 'suivi']
        },
        {
          id: 'administration-documents-redaction-ia',
          title: 'Utiliser la rédaction IA documentaire',
          objective: 'Générer une première version de document tout en conservant une validation humaine.',
          location: 'Administration → Documents → Rédaction IA',
          audience: ['Administrateurs', 'Personnel administratif', 'Pharmacien Titulaire'],
          intro: 'La rédaction IA accélère la préparation de courriers, notes ou documents structurés. Elle doit être utilisée comme assistance rédactionnelle, avec relecture et validation par un utilisateur responsable.',
          steps: [
            { title: 'Choisir le contexte', detail: 'Indiquez le type de document et l’objectif attendu.' },
            { title: 'Fournir les informations utiles', detail: 'Ajoutez destinataire, contraintes, faits, dates et ton souhaité.' },
            { title: 'Générer la proposition', detail: 'Laissez l’IA produire une version de travail.' },
            { title: 'Relire et corriger', detail: 'Vérifiez exactitude, confidentialité, style et conformité.' },
            { title: 'Transformer en document exploitable', detail: 'Classez ou copiez la version validée dans le bon flux documentaire.' }
          ],
          callouts: [
            { type: 'warning', title: 'Validation humaine', text: 'Tout document généré par IA doit être relu avant utilisation officielle.' },
            { type: 'tip', title: 'Qualité', text: 'Un contexte précis produit une rédaction plus pertinente et plus facile à corriger.' }
          ],
          bestPractices: ['Ne pas inclure de secrets inutiles dans le prompt.', 'Relire les montants et références.', 'Conserver la version validée, pas seulement la génération brute.'],
          faq: [{ q: 'L’IA peut-elle envoyer le document directement ?', a: 'Non, la génération doit rester soumise à une relecture et à une décision humaine.' }],
          related: ['administration-documents-templates', 'administration-documents-bibliotheque'],
          keywords: ['rédaction IA', 'documents', 'génération', 'relecture', 'templates']
        },
        {
          id: 'administration-documents-templates',
          title: 'Gérer les templates de documents',
          objective: 'Standardiser les documents et communications répétitives.',
          location: 'Administration → Documents → Templates',
          audience: ['Administrateurs', 'Personnel administratif'],
          intro: 'Les templates servent de modèles réutilisables pour les courriers, emails et documents administratifs. Ils réduisent les erreurs et homogénéisent la communication.',
          steps: [
            { title: 'Lister les modèles', detail: 'Identifiez les templates disponibles et leur usage.' },
            { title: 'Créer un modèle', detail: 'Définissez le titre, la structure et les champs à adapter.' },
            { title: 'Utiliser dans un courrier ou email', detail: 'Reprenez le modèle puis personnalisez les éléments variables.' },
            { title: 'Mettre à jour périodiquement', detail: 'Révisez les modèles lorsque les procédures ou mentions changent.' }
          ],
          callouts: [{ type: 'tip', title: 'Standardisation', text: 'Un bon template contient la structure stable, mais laisse clairement les champs à personnaliser.' }],
          bestPractices: ['Nommer les templates par usage.', 'Retirer les modèles obsolètes.', 'Faire valider les modèles sensibles.'],
          faq: [{ q: 'Un template est-il un document final ?', a: 'Non, c’est une base réutilisable qui doit être adaptée au cas réel.' }],
          related: ['administration-documents-courriers', 'administration-documents-emails', 'administration-documents-redaction-ia'],
          keywords: ['templates', 'modèles', 'documents', 'courriers', 'emails']
        }
      ]
    },
    {
      id: 'administration-analytics',
      title: 'Analyses administratives',
      icon: BarChart3,
      articles: [
        {
          id: 'administration-analytics-vue-ensemble',
          title: 'Lire les analyses administratives',
          objective: 'Suivre les KPI globaux par période et préparer les exports de pilotage.',
          location: 'Administration → Analyses et Reporting → Vue d’ensemble',
          audience: ['Administrateurs', 'Pharmacien Titulaire', 'Comptabilité'],
          intro: 'La vue d’ensemble des analyses affiche les KPI de chiffre d’affaires, ventes, produits en stock, clients actifs, période sélectionnée, rafraîchissement et export global.',
          steps: [
            { title: 'Choisir la période', detail: 'Sélectionnez semaine, mois, trimestre ou année selon le niveau d’analyse.' },
            { title: 'Lire les KPI', detail: 'Comparez chiffre d’affaires, ventes, stock et clients actifs.' },
            { title: 'Rafraîchir les données', detail: 'Actualisez après une opération majeure ou un changement de période.' },
            { title: 'Exporter si nécessaire', detail: 'Générez un export global pour archivage ou partage interne.' }
          ],
          callouts: [{ type: 'info', title: 'Période', text: 'La pertinence des KPI dépend fortement de la période sélectionnée.' }],
          bestPractices: ['Comparer des périodes équivalentes.', 'Actualiser avant export.', 'Analyser les écarts avec les modules métier.'],
          faq: [{ q: 'Pourquoi les montants peuvent-ils différer de la comptabilité ?', a: 'Les analyses sont opérationnelles ; les états financiers doivent être rapprochés avec Comptabilité/SYSCOHADA.' }],
          related: ['administration-analytics-ventes', 'administration-analytics-rapports'],
          keywords: ['analytics', 'KPI', 'période', 'export', 'administration']
        },
        {
          id: 'administration-analytics-ventes',
          title: 'Analyser les ventes depuis l’administration',
          objective: 'Lire les tendances de ventes et identifier les produits ou segments importants.',
          location: 'Administration → Analyses et Reporting → Ventes',
          audience: ['Administrateurs', 'Pharmacien Titulaire', 'Comptabilité'],
          intro: 'L’analyse des ventes expose les évolutions, top produits, distributions et exports PDF. Elle donne une lecture administrative sans remplacer les écrans détaillés du module Ventes.',
          steps: [
            { title: 'Sélectionner la période', detail: 'Cadrez l’analyse avant de comparer les indicateurs.' },
            { title: 'Observer l’évolution', detail: 'Repérez les hausses, baisses ou ruptures de tendance.' },
            { title: 'Analyser les top produits', detail: 'Identifiez les produits qui contribuent le plus à l’activité.' },
            { title: 'Exporter le PDF ventes', detail: 'Générez un support de reporting si nécessaire.' }
          ],
          callouts: [{ type: 'info', title: 'Vue administrative', text: 'Cette analyse complète le module Ventes mais ne remplace pas le détail transactionnel.' }],
          bestPractices: ['Comparer les ventes avec les niveaux de stock.', 'Surveiller les variations atypiques.', 'Exporter après validation des données.'],
          faq: [{ q: 'Le top produit suffit-il à décider une commande ?', a: 'Non, il doit être croisé avec le stock, les seuils et les délais fournisseur.' }],
          related: ['administration-analytics-inventaire', 'administration-referentiel-catalogue'],
          keywords: ['ventes', 'analyse', 'top produits', 'PDF', 'reporting']
        },
        {
          id: 'administration-analytics-inventaire',
          title: 'Analyser l’inventaire administratif',
          objective: 'Suivre les niveaux de stock, alertes et produits sensibles depuis une vue administrative.',
          location: 'Administration → Analyses et Reporting → Inventaire',
          audience: ['Administrateurs', 'Gestionnaires stock', 'Pharmacien Titulaire'],
          intro: 'L’analyse inventaire présente les niveaux de stock, alertes, produits sensibles et exports. Elle aide l’administration à contrôler les risques sans entrer dans chaque écran stock.',
          steps: [
            { title: 'Consulter les niveaux', detail: 'Repérez les familles ou produits à surveiller.' },
            { title: 'Lire les alertes', detail: 'Identifiez les ruptures, surstocks ou produits sensibles.' },
            { title: 'Croiser avec les ventes', detail: 'Comparez les alertes avec la dynamique commerciale.' },
            { title: 'Exporter l’inventaire', detail: 'Générez le rapport lorsque le contrôle doit être partagé ou archivé.' }
          ],
          callouts: [{ type: 'warning', title: 'Stock opérationnel', text: 'Les décisions d’ajustement doivent être confirmées dans le module Stock avec les lots et mouvements réels.' }],
          bestPractices: ['Analyser les alertes avant commande.', 'Contrôler les produits sensibles régulièrement.', 'Rapprocher l’inventaire avec les sessions de stock.'],
          faq: [{ q: 'Puis-je corriger le stock ici ?', a: 'Non, les corrections opérationnelles se font dans le module Stock.' }],
          related: ['administration-analytics-ventes', 'administration-referentiel-catalogue'],
          keywords: ['inventaire', 'stock', 'alertes', 'produits sensibles', 'export']
        },
        {
          id: 'administration-analytics-rapports',
          title: 'Exporter les rapports administratifs',
          objective: 'Produire des rapports PDF ou Excel pour le pilotage et l’archivage.',
          location: 'Administration → Analyses et Reporting → Rapports',
          audience: ['Administrateurs', 'Pharmacien Titulaire', 'Comptabilité'],
          intro: 'L’onglet Rapports permet de générer des exports ventes, inventaire, clients, financier ou Excel global afin de partager les informations administratives de manière structurée.',
          steps: [
            { title: 'Choisir le type de rapport', detail: 'Sélectionnez ventes, inventaire, clients, financier ou Excel global.' },
            { title: 'Vérifier la période', detail: 'Assurez-vous que la période couvre le besoin demandé.' },
            { title: 'Générer l’export', detail: 'Lancez la production du PDF ou du fichier Excel.' },
            { title: 'Contrôler le fichier', detail: 'Relisez les totaux, dates, devise et périmètre avant diffusion.' },
            { title: 'Archiver si nécessaire', detail: 'Classez le rapport dans la bibliothèque documentaire ou selon la procédure interne.' }
          ],
          callouts: [
            { type: 'info', title: 'Format régional', text: 'Les montants doivent respecter la devise et le format régional configurés pour le tenant.' },
            { type: 'warning', title: 'Finance', text: 'Les rapports financiers doivent être rapprochés des modules Comptabilité et SYSCOHADA avant usage officiel.' }
          ],
          bestPractices: ['Exporter après rafraîchissement.', 'Nommer les fichiers avec période et type.', 'Conserver les rapports financiers validés.'],
          faq: [{ q: 'Quel export choisir pour un audit rapide ?', a: 'L’Excel global est utile pour l’analyse, tandis que les PDF sont plus adaptés au partage figé.' }],
          related: ['administration-documents-bibliotheque', 'administration-analytics-vue-ensemble'],
          keywords: ['rapports', 'PDF', 'Excel', 'financier', 'export']
        }
      ]
    },
    {
      id: 'administration-workflows',
      title: 'Workflows et automatisation',
      icon: Settings2,
      articles: [
        {
          id: 'administration-workflows-gestion',
          title: 'Créer et piloter les workflows',
          objective: 'Configurer des automatisations contrôlées pour standardiser les processus administratifs.',
          location: 'Administration → Workflows & Automatisation → Workflows',
          audience: ['Administrateurs', 'Pharmacien Titulaire', 'Responsables processus'],
          intro: 'Les workflows permettent de créer des processus automatisés avec catégorie, priorité, déclencheur, statut, lancement manuel et suppression contrôlée.',
          steps: [
            { title: 'Créer le workflow', detail: 'Définissez le nom, la catégorie et l’objectif métier.' },
            { title: 'Choisir le déclencheur', detail: 'Sélectionnez un déclenchement manuel, planifié ou lié à un événement selon le besoin.' },
            { title: 'Définir la priorité', detail: 'Classez le workflow pour faciliter l’arbitrage en cas de concurrence.' },
            { title: 'Activer progressivement', detail: 'Testez en brouillon puis passez à Actif lorsque le comportement est validé.' },
            { title: 'Piloter le cycle de vie', detail: 'Lancez manuellement, désactivez ou supprimez selon les règles internes.' }
          ],
          callouts: [{ type: 'warning', title: 'Contrôle', text: 'N’activez pas un workflow sensible sans test préalable et validation des droits d’accès.' }],
          bestPractices: ['Nommer les workflows clairement.', 'Documenter le déclencheur.', 'Désactiver plutôt que supprimer en cas de doute.'],
          faq: [{ q: 'Quand utiliser le statut Brouillon ?', a: 'Pendant la préparation ou les tests avant activation opérationnelle.' }],
          related: ['administration-workflows-templates', 'administration-workflows-historique', 'administration-workflows-configuration'],
          keywords: ['workflows', 'automatisation', 'déclencheur', 'priorité', 'actif']
        },
        {
          id: 'administration-workflows-templates',
          title: 'Utiliser les templates de workflows',
          objective: 'Accélérer la création d’automatisations à partir de modèles validés.',
          location: 'Administration → Workflows & Automatisation → Templates',
          audience: ['Administrateurs', 'Responsables processus'],
          intro: 'Les templates de workflows fournissent des modèles réutilisables pour standardiser les automatisations fréquentes et réduire les erreurs de configuration.',
          steps: [
            { title: 'Parcourir les templates', detail: 'Identifiez le modèle correspondant au processus recherché.' },
            { title: 'Créer depuis un modèle', detail: 'Utilisez le template comme base de workflow.' },
            { title: 'Adapter les paramètres', detail: 'Personnalisez catégorie, déclencheur, conditions et actions.' },
            { title: 'Valider avant activation', detail: 'Testez le workflow généré avant de l’activer.' }
          ],
          callouts: [{ type: 'tip', title: 'Standardisation', text: 'Les templates réduisent les écarts entre processus similaires dans une même officine.' }],
          bestPractices: ['Ne pas activer un template sans relecture.', 'Adapter les paramètres au tenant.', 'Documenter les modifications locales.'],
          faq: [{ q: 'Un template est-il directement actif ?', a: 'Non, il sert de base et doit être configuré puis activé.' }],
          related: ['administration-workflows-gestion', 'administration-workflows-configuration'],
          keywords: ['templates', 'workflows', 'modèles', 'automatisation', 'processus']
        },
        {
          id: 'administration-workflows-historique',
          title: 'Suivre l’historique des exécutions',
          objective: 'Contrôler les résultats, erreurs et logs des workflows exécutés.',
          location: 'Administration → Workflows & Automatisation → Historique',
          audience: ['Administrateurs', 'Responsables processus', 'Support interne'],
          intro: 'L’historique des exécutions affiche les workflows lancés, leurs statuts, progressions, logs, résultats et erreurs. Il permet d’auditer les automatisations.',
          steps: [
            { title: 'Filtrer les exécutions', detail: 'Repérez les statuts Terminé, Échec, En cours ou En pause.' },
            { title: 'Lire la progression', detail: 'Identifiez l’étape atteinte par le workflow.' },
            { title: 'Consulter les logs', detail: 'Analysez les messages pour comprendre le résultat ou l’erreur.' },
            { title: 'Corriger puis relancer', detail: 'Ajustez la configuration avant toute nouvelle exécution si une erreur est détectée.' }
          ],
          callouts: [{ type: 'info', title: 'Audit', text: 'L’historique constitue une trace utile pour comprendre les actions automatiques sensibles.' }],
          bestPractices: ['Surveiller les échecs récurrents.', 'Conserver les logs importants.', 'Ne pas relancer sans comprendre l’erreur.'],
          faq: [{ q: 'Que faire après un échec ?', a: 'Lire les logs, corriger la configuration ou les données, puis relancer seulement si la cause est maîtrisée.' }],
          related: ['administration-workflows-gestion', 'administration-dashboard-alertes-approbations'],
          keywords: ['historique', 'exécutions', 'logs', 'workflow', 'échec']
        },
        {
          id: 'administration-workflows-configuration',
          title: 'Configurer les règles d’automatisation',
          objective: 'Encadrer notifications, délais, concurrence, déclencheurs, audit et sécurité des workflows.',
          location: 'Administration → Workflows & Automatisation → Configuration',
          audience: ['Administrateurs', 'Pharmacien Titulaire', 'Responsables sécurité'],
          intro: 'La configuration des workflows fixe les règles globales : notifications, délais, concurrence, déclencheurs automatiques, surveillance stock, événements ventes, retry, audit, accès strict, chiffrement sensible et alertes sécurité.',
          steps: [
            { title: 'Définir les notifications', detail: 'Choisissez les événements qui doivent informer les responsables.' },
            { title: 'Paramétrer délais et concurrence', detail: 'Limitez les traitements simultanés et fixez les délais acceptables.' },
            { title: 'Activer les déclencheurs nécessaires', detail: 'Sélectionnez les événements stock, ventes ou administratifs pertinents.' },
            { title: 'Configurer le retry', detail: 'Définissez les relances automatiques en cas d’échec temporaire.' },
            { title: 'Renforcer audit et sécurité', detail: 'Activez la traçabilité, l’accès strict, le chiffrement sensible et les alertes sécurité.' }
          ],
          callouts: [
            { type: 'warning', title: 'RLS et droits', text: 'Les automatisations doivent respecter les droits d’accès et l’isolation RLS multi-tenant.' },
            { type: 'info', title: 'Audit', text: 'L’audit actif facilite la traçabilité des opérations sensibles et des traitements automatiques.' }
          ],
          bestPractices: ['Activer uniquement les déclencheurs utiles.', 'Tester les règles après modification.', 'Surveiller les alertes sécurité.'],
          faq: [{ q: 'Pourquoi limiter la concurrence ?', a: 'Pour éviter les traitements simultanés excessifs et réduire les risques d’erreurs ou de surcharge.' }],
          related: ['administration-workflows-gestion', 'administration-workflows-historique', 'administration-dashboard-alertes-approbations'],
          keywords: ['configuration', 'workflows', 'RLS', 'audit', 'sécurité']
        }
      ]
    }
  ]
};
