import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export type Language = {
  code: string;
  name: string;
  flag: string;
};

// Define our translation object type
export type Translations = {
  [key: string]: string;
};

// Define a type for our translations by language
export type AllTranslations = {
  [languageCode: string]: Translations;
};

// Default translations for the application
const translations: AllTranslations = {
  fr: {
    // Header
    features: "Fonctionnalités",
    modules: "Modules",
    ai: "Intelligence Artificielle",
    contact: "Contact",
    freeTrial: "Essai Gratuit",
    dashboard: "Tableau de bord",
    signOut: "Se déconnecter",
    connectPharmacy: "Connecter pharmacie",
    disconnectPharmacy: "Déconnecter pharmacie",
    pharmacy: "Pharmacie",
    // Hero
    heroTitle: "Solution complète de gestion pharmaceutique",
    heroTagline: "La solution complète pour votre pharmacie",
    heroTransformTitle1: "Transformez la gestion",
    heroTransformTitle2: "de votre officine",
    heroDescription: "PharmaSoft est une application complète de gestion d'officine pharmaceutique disponible en version web et mobile, conçue pour simplifier tous vos processus.",
    connectYourPharmacy: "Connecter votre Pharmacie",
    loading: "Chargement...",
    seeDemo: "Voir la Démo",
    pharmaciesUsing: "pharmacies utilisent déjà PharmaSoft",
    stocks: "Stocks",
    optimal: "Optimal",
    attention: "Attention",
    critical: "Critique",
    products: "produits",
    availability: "disponibilité",
    sales: "Ventes",
    activeSession: "Session active",
    // Features
    featuresTitle: "Toutes les fonctionnalités dans une seule solution",
    featuresSubtitle: "Pharmasoft révolutionne la gestion de votre pharmacie avec un ensemble complet d'outils intégrés et innovants.",
    salesManagement: "Gestion des ventes",
    salesDesc: "Point de vente tactile, gestion des ordonnances, remises et promotions automatisées.",
    stockManagement: "Gestion des stocks",
    stockDesc: "Inventaire en temps réel, alertes de seuil, commandes automatisées, suivi des péremptions.",
    clientManagement: "Gestion des clients",
    clientDesc: "Base de données clients, historique d'achats, programme de fidélité, segmentation.",
    cashManagement: "Gestion de caisse",
    cashDesc: "Multi-caisses, suivi des encaissements, clôtures journalières, rapports détaillés.",
    analytics: "Analyses & Rapports",
    analyticsDesc: "Tableaux de bord analytiques, rapports personnalisés, prévisions et tendances.",
    security: "Sécurité avancée",
    securityDesc: "Authentification multi-facteurs, gestion fine des droits d'accès, chiffrement des données.",
    webMobile: "Web & Mobile",
    webMobileDesc: "Application web responsive et applications mobiles natives (iOS et Android).",
    multilingual: "Multilingue",
    multilingualDesc: "Application disponible en 4 langues : Français, Anglais, Espagnol et Lingala.",
    voiceCommands: "Commandes vocales",
    voiceDesc: "Contrôlez l'application par la voix, dictée vocale et reconnaissance des médicaments.",
    // Footer
    footerDescription: "Une application complète de gestion d'officine pharmaceutique disponible en version web et mobile.",
    quickLinks: "Liens rapides",
    contactUs: "Contactez-nous",
    newsletter: "Inscription à la newsletter",
    newsletterDesc: "Recevez les dernières mises à jour et offres spéciales.",
    email: "Votre email",
    subscribe: "S'abonner",
    pricing: "Tarifs",
    blog: "Blog",
    termsOfUse: "Conditions d'utilisation",
    privacyPolicy: "Politique de confidentialité",
    legalNotice: "Mentions légales",
    allRightsReserved: "Tous droits réservés.",
    // Dashboard - Main
    dashboardTitle: "Tableau de Bord",
    refresh: "Actualiser",
    // Dashboard - Sales Metrics
    dailySalesTitle: "Ventes du Jour",
    monthlySalesTitle: "CA Mensuel",
    dailyTransactions: "Transactions Jour",
    averageBasket: "Panier Moyen",
    vsYesterday: "vs hier",
    thisMonth: "Ce mois",
    salesCompleted: "Ventes réalisées",
    perTransaction: "Par transaction",
    // Dashboard - Stock Metrics
    totalStockValue: "Valeur Stock Total",
    availableProducts: "Produits Disponibles",
    lowStockAlerts: "Alertes Stock Faible",
    outOfStock: "Produits en Rupture",
    totalInventory: "Inventaire total",
    sufficientStock: "En stock suffisant",
    toReorder: "À réapprovisionner",
    stockDepleted: "Stock épuisé",
    // Dashboard - Quick Actions
    quickActions: "Actions Rapides",
    newSale: "Nouvelle Vente",
    openRegister: "Ouvrir Caisse",
    payment: "Paiement",
    inventory: "Inventaire",
    reports: "Rapports",
    pos: "Point de vente",
    cashManagementAction: "Gestion caisses",
    collections: "Encaissements",
    stockManagementAction: "Gestion stock",
    // Dashboard - Critical Alerts
    criticalAlerts: "Alertes Critiques",
    noCriticalAlerts: "Aucune alerte critique",
    units: "unités",
    unknownDate: "Date inconnue",
    expiresOn: "Expire le",
    // Dashboard - Recent Activities
    recentActivities: "Activités Récentes",
    noRecentActivities: "Aucune activité récente",
    newSaleActivity: "Nouvelle vente",
    saleModified: "Vente modifiée",
    saleDeleted: "Vente supprimée",
    supplierReception: "Réception fournisseur",
    receptionUpdated: "Réception mise à jour",
    receptionDeleted: "Réception supprimée",
    inventoryCreated: "Inventaire créé",
    inventoryUpdated: "Inventaire mis à jour",
    inventoryDeleted: "Inventaire supprimé",
    registerOpened: "Session caisse ouverte",
    registerUpdated: "Session caisse mise à jour",
    registerDeleted: "Session caisse supprimée",
    // Dashboard - Top Products
    topProducts: "Produits les Plus Vendus",
    noTopProducts: "Aucun produit vendu",
    soldUnits: "vendus",
    // Dashboard - Active Sessions
    activeSessions: "Sessions Caisse Actives",
    noActiveSessions: "Aucune session active",
    openingBalance: "Fond de caisse",
    currentAmount: "Montant actuel",
    salesCount: "Ventes",
    // Dashboard - Credit & Promotions
    clientCredit: "Crédit Clients",
    totalOngoing: "Total en cours",
    activeAccounts: "Comptes actifs",
    paymentDelays: "Retards de paiement",
    utilizationRate: "Taux d'utilisation",
    promotions: "Promotions",
    active: "Actives",
    usages: "Utilisations",
    savingsToday: "Économies aujourd'hui",
    // Sidebar Menu
    mainMenu: "Principal",
    administration: "Administration",
    stock: "Stock",
    salesMenu: "Ventes",
    accounting: "Comptabilité",
    reportsMenu: "Rapports",
    aiAssistant: "Assistant IA",
    chatNetwork: "Chat-PharmaSoft",
    settings: "Paramètres",
    testsMenu: "Tests & Développement",
    testSuites: "Suites de Tests",
    signOutLabel: "Déconnexion",
    logoutSuccess: "Vous avez été déconnecté avec succès.",
    // General
    dailySales: "Ventes du jour",
    customerServices: "Services clients",
    productsToRenew: "Produits à renouveler",
    last7Days: "Ventes des 7 derniers jours",
    upcomingAppointments: "Prochains rendez-vous",
    help: "Aide",
    logout: "Déconnexion",
    // Help Center
    helpCenter: "Centre d'aide",
    searchHelp: "Rechercher dans l'aide...",
    recentlyViewed: "Récemment consulté",
    helpModules: "Modules",
    quickFAQ: "FAQ Rapide",
    videoTutorials: "Tutoriels Vidéo",
    wasHelpful: "Cet article vous a-t-il aidé ?",
    noResults: "Aucun résultat trouvé",
    searchTip: "Conseil : essayez des mots-clés différents",
    relatedArticles: "Articles liés",
    stepByStep: "Procédure pas-à-pas",
    viewAllTutorials: "Voir tous les tutoriels",
    // Sales module translations
    searchProducts: "Rechercher des produits par nom ou catégorie",
    searchPlaceholder: "Rechercher un médicament...",
    noProductsFound: "Aucun produit trouvé",
    inStock: "En stock",
    add: "Ajouter",
    cart: "Panier",
    emptyCart: "Votre panier est vide",
    itemsInCart: "articles dans le panier",
    itemInCart: "article dans le panier",
    cartEmpty: "Ajoutez des produits à votre panier",
    total: "Total",
    checkout: "Finaliser la vente",
  },
  en: {
    // Header
    features: "Features",
    modules: "Modules",
    ai: "Artificial Intelligence",
    contact: "Contact",
    freeTrial: "Free Trial",
    dashboard: "Dashboard",
    signOut: "Sign Out",
    connectPharmacy: "Connect pharmacy",
    disconnectPharmacy: "Disconnect pharmacy",
    pharmacy: "Pharmacy",
    // Hero
    heroTitle: "Complete Pharmaceutical Management Solution",
    heroTagline: "The complete solution for your pharmacy",
    heroTransformTitle1: "Transform the management",
    heroTransformTitle2: "of your pharmacy",
    heroDescription: "PharmaSoft is a complete pharmacy management application available in web and mobile versions, designed to simplify all your processes.",
    connectYourPharmacy: "Connect your Pharmacy",
    loading: "Loading...",
    seeDemo: "See Demo",
    pharmaciesUsing: "pharmacies already use PharmaSoft",
    stocks: "Stocks",
    optimal: "Optimal",
    attention: "Warning",
    critical: "Critical",
    products: "products",
    availability: "availability",
    sales: "Sales",
    activeSession: "Active session",
    // Features
    featuresTitle: "All features in one solution",
    featuresSubtitle: "Pharmasoft revolutionizes your pharmacy management with a complete set of integrated and innovative tools.",
    salesManagement: "Sales Management",
    salesDesc: "Touch POS, prescription management, automated discounts and promotions.",
    stockManagement: "Inventory Management",
    stockDesc: "Real-time inventory, threshold alerts, automated orders, expiration tracking.",
    clientManagement: "Customer Management",
    clientDesc: "Customer database, purchase history, loyalty program, segmentation.",
    cashManagement: "Cash Management",
    cashDesc: "Multi-registers, payment tracking, daily closings, detailed reports.",
    analytics: "Analytics & Reports",
    analyticsDesc: "Analytical dashboards, custom reports, forecasts and trends.",
    security: "Advanced Security",
    securityDesc: "Multi-factor authentication, fine access rights management, data encryption.",
    webMobile: "Web & Mobile",
    webMobileDesc: "Responsive web application and native mobile applications (iOS and Android).",
    multilingual: "Multilingual",
    multilingualDesc: "Application available in 4 languages: French, English, Spanish and Lingala.",
    voiceCommands: "Voice Commands",
    voiceDesc: "Control the application by voice, voice dictation and medication recognition.",
    // Footer
    footerDescription: "A complete pharmacy management application available in web and mobile versions.",
    quickLinks: "Quick Links",
    contactUs: "Contact Us",
    newsletter: "Newsletter Subscription",
    newsletterDesc: "Receive the latest updates and special offers.",
    email: "Your email",
    subscribe: "Subscribe",
    pricing: "Pricing",
    blog: "Blog",
    termsOfUse: "Terms of Use",
    privacyPolicy: "Privacy Policy",
    legalNotice: "Legal Notice",
    allRightsReserved: "All rights reserved.",
    // Dashboard - Main
    dashboardTitle: "Dashboard",
    refresh: "Refresh",
    // Dashboard - Sales Metrics
    dailySalesTitle: "Daily Sales",
    monthlySalesTitle: "Monthly Revenue",
    dailyTransactions: "Daily Transactions",
    averageBasket: "Average Basket",
    vsYesterday: "vs yesterday",
    thisMonth: "This month",
    salesCompleted: "Sales completed",
    perTransaction: "Per transaction",
    // Dashboard - Stock Metrics
    totalStockValue: "Total Stock Value",
    availableProducts: "Available Products",
    lowStockAlerts: "Low Stock Alerts",
    outOfStock: "Out of Stock",
    totalInventory: "Total inventory",
    sufficientStock: "Sufficient stock",
    toReorder: "To reorder",
    stockDepleted: "Stock depleted",
    // Dashboard - Quick Actions
    quickActions: "Quick Actions",
    newSale: "New Sale",
    openRegister: "Open Register",
    payment: "Payment",
    inventory: "Inventory",
    reports: "Reports",
    pos: "Point of Sale",
    cashManagementAction: "Cash Management",
    collections: "Collections",
    stockManagementAction: "Stock Management",
    // Dashboard - Critical Alerts
    criticalAlerts: "Critical Alerts",
    noCriticalAlerts: "No critical alerts",
    units: "units",
    unknownDate: "Unknown date",
    expiresOn: "Expires on",
    // Dashboard - Recent Activities
    recentActivities: "Recent Activities",
    noRecentActivities: "No recent activities",
    newSaleActivity: "New sale",
    saleModified: "Sale modified",
    saleDeleted: "Sale deleted",
    supplierReception: "Supplier reception",
    receptionUpdated: "Reception updated",
    receptionDeleted: "Reception deleted",
    inventoryCreated: "Inventory created",
    inventoryUpdated: "Inventory updated",
    inventoryDeleted: "Inventory deleted",
    registerOpened: "Register session opened",
    registerUpdated: "Register session updated",
    registerDeleted: "Register session deleted",
    // Dashboard - Top Products
    topProducts: "Top Selling Products",
    noTopProducts: "No products sold",
    soldUnits: "sold",
    // Dashboard - Active Sessions
    activeSessions: "Active Register Sessions",
    noActiveSessions: "No active sessions",
    openingBalance: "Opening balance",
    currentAmount: "Current amount",
    salesCount: "Sales",
    // Dashboard - Credit & Promotions
    clientCredit: "Client Credit",
    totalOngoing: "Total ongoing",
    activeAccounts: "Active accounts",
    paymentDelays: "Payment delays",
    utilizationRate: "Utilization rate",
    promotions: "Promotions",
    active: "Active",
    usages: "Usages",
    savingsToday: "Savings today",
    // Sidebar Menu
    mainMenu: "Main",
    administration: "Administration",
    stock: "Stock",
    salesMenu: "Sales",
    accounting: "Accounting",
    reportsMenu: "Reports",
    aiAssistant: "AI Assistant",
    chatNetwork: "Chat-PharmaSoft",
    settings: "Settings",
    testsMenu: "Tests & Development",
    testSuites: "Test Suites",
    signOutLabel: "Sign Out",
    logoutSuccess: "You have been successfully signed out.",
    // General
    dailySales: "Daily Sales",
    customerServices: "Customer Services",
    productsToRenew: "Products to Renew",
    last7Days: "Sales for the last 7 days",
    upcomingAppointments: "Upcoming Appointments",
    help: "Help",
    logout: "Logout",
    // Help Center
    helpCenter: "Help Center",
    searchHelp: "Search help...",
    recentlyViewed: "Recently Viewed",
    helpModules: "Modules",
    quickFAQ: "Quick FAQ",
    videoTutorials: "Video Tutorials",
    wasHelpful: "Was this article helpful?",
    noResults: "No results found",
    searchTip: "Tip: try different keywords",
    relatedArticles: "Related Articles",
    stepByStep: "Step by Step",
    viewAllTutorials: "View all tutorials",
    // Sales module translations
    searchProducts: "Search products by name or category",
    searchPlaceholder: "Search for a medication...",
    noProductsFound: "No products found",
    inStock: "In stock",
    add: "Add",
    cart: "Cart",
    emptyCart: "Your cart is empty",
    itemsInCart: "items in cart",
    itemInCart: "item in cart",
    cartEmpty: "Add products to your cart",
    total: "Total",
    checkout: "Checkout",
  },
  es: {
    // Header
    features: "Características",
    modules: "Módulos",
    ai: "Inteligencia Artificial",
    contact: "Contacto",
    freeTrial: "Prueba Gratuita",
    dashboard: "Panel de control",
    signOut: "Cerrar sesión",
    connectPharmacy: "Conectar farmacia",
    disconnectPharmacy: "Desconectar farmacia",
    pharmacy: "Farmacia",
    // Hero
    heroTitle: "Solución Completa de Gestión Farmacéutica",
    heroTagline: "La solución completa para su farmacia",
    heroTransformTitle1: "Transforme la gestión",
    heroTransformTitle2: "de su farmacia",
    heroDescription: "PharmaSoft es una aplicación completa de gestión de farmacias disponible en versión web y móvil, diseñada para simplificar todos sus procesos.",
    connectYourPharmacy: "Conectar su Farmacia",
    loading: "Cargando...",
    seeDemo: "Ver Demo",
    pharmaciesUsing: "farmacias ya usan PharmaSoft",
    stocks: "Inventario",
    optimal: "Óptimo",
    attention: "Atención",
    critical: "Crítico",
    products: "productos",
    availability: "disponibilidad",
    sales: "Ventas",
    activeSession: "Sesión activa",
    // Features
    featuresTitle: "Todas las funciones en una sola solución",
    featuresSubtitle: "Pharmasoft revoluciona la gestión de su farmacia con un conjunto completo de herramientas integradas e innovadoras.",
    salesManagement: "Gestión de Ventas",
    salesDesc: "Punto de venta táctil, gestión de recetas, descuentos y promociones automatizadas.",
    stockManagement: "Gestión de Inventario",
    stockDesc: "Inventario en tiempo real, alertas de umbral, pedidos automatizados, seguimiento de caducidad.",
    clientManagement: "Gestión de Clientes",
    clientDesc: "Base de datos de clientes, historial de compras, programa de fidelidad, segmentación.",
    cashManagement: "Gestión de Caja",
    cashDesc: "Multi-cajas, seguimiento de pagos, cierres diarios, informes detallados.",
    analytics: "Análisis e Informes",
    analyticsDesc: "Tableros analíticos, informes personalizados, previsiones y tendencias.",
    security: "Seguridad Avanzada",
    securityDesc: "Autenticación multifactor, gestión detallada de derechos de acceso, cifrado de datos.",
    webMobile: "Web y Móvil",
    webMobileDesc: "Aplicación web responsive y aplicaciones móviles nativas (iOS y Android).",
    multilingual: "Multilingüe",
    multilingualDesc: "Aplicación disponible en 4 idiomas: Francés, Inglés, Español y Lingala.",
    voiceCommands: "Comandos de Voz",
    voiceDesc: "Controle la aplicación por voz, dictado de voz y reconocimiento de medicamentos.",
    // Footer
    footerDescription: "Una aplicación completa de gestión de farmacias disponible en versión web y móvil.",
    quickLinks: "Enlaces Rápidos",
    contactUs: "Contáctenos",
    newsletter: "Suscripción al Boletín",
    newsletterDesc: "Reciba las últimas actualizaciones y ofertas especiales.",
    email: "Su email",
    subscribe: "Suscribirse",
    pricing: "Precios",
    blog: "Blog",
    termsOfUse: "Términos de Uso",
    privacyPolicy: "Política de Privacidad",
    legalNotice: "Aviso Legal",
    allRightsReserved: "Todos los derechos reservados.",
    // Dashboard - Main
    dashboardTitle: "Panel de Control",
    refresh: "Actualizar",
    // Dashboard - Sales Metrics
    dailySalesTitle: "Ventas del Día",
    monthlySalesTitle: "Ingresos Mensuales",
    dailyTransactions: "Transacciones Diarias",
    averageBasket: "Cesta Promedio",
    vsYesterday: "vs ayer",
    thisMonth: "Este mes",
    salesCompleted: "Ventas realizadas",
    perTransaction: "Por transacción",
    // Dashboard - Stock Metrics
    totalStockValue: "Valor Total del Stock",
    availableProducts: "Productos Disponibles",
    lowStockAlerts: "Alertas de Stock Bajo",
    outOfStock: "Sin Stock",
    totalInventory: "Inventario total",
    sufficientStock: "Stock suficiente",
    toReorder: "Para reabastecer",
    stockDepleted: "Stock agotado",
    // Dashboard - Quick Actions
    quickActions: "Acciones Rápidas",
    newSale: "Nueva Venta",
    openRegister: "Abrir Caja",
    payment: "Pago",
    inventory: "Inventario",
    reports: "Informes",
    pos: "Punto de Venta",
    cashManagementAction: "Gestión de Caja",
    collections: "Cobros",
    stockManagementAction: "Gestión de Stock",
    // Dashboard - Critical Alerts
    criticalAlerts: "Alertas Críticas",
    noCriticalAlerts: "Sin alertas críticas",
    units: "unidades",
    unknownDate: "Fecha desconocida",
    expiresOn: "Expira el",
    // Dashboard - Recent Activities
    recentActivities: "Actividades Recientes",
    noRecentActivities: "Sin actividades recientes",
    newSaleActivity: "Nueva venta",
    saleModified: "Venta modificada",
    saleDeleted: "Venta eliminada",
    supplierReception: "Recepción de proveedor",
    receptionUpdated: "Recepción actualizada",
    receptionDeleted: "Recepción eliminada",
    inventoryCreated: "Inventario creado",
    inventoryUpdated: "Inventario actualizado",
    inventoryDeleted: "Inventario eliminado",
    registerOpened: "Sesión de caja abierta",
    registerUpdated: "Sesión de caja actualizada",
    registerDeleted: "Sesión de caja eliminada",
    // Dashboard - Top Products
    topProducts: "Productos Más Vendidos",
    noTopProducts: "Sin productos vendidos",
    soldUnits: "vendidos",
    // Dashboard - Active Sessions
    activeSessions: "Sesiones de Caja Activas",
    noActiveSessions: "Sin sesiones activas",
    openingBalance: "Fondo de caja",
    currentAmount: "Monto actual",
    salesCount: "Ventas",
    // Dashboard - Credit & Promotions
    clientCredit: "Crédito de Clientes",
    totalOngoing: "Total en curso",
    activeAccounts: "Cuentas activas",
    paymentDelays: "Retrasos de pago",
    utilizationRate: "Tasa de utilización",
    promotions: "Promociones",
    active: "Activas",
    usages: "Usos",
    savingsToday: "Ahorros hoy",
    // Sidebar Menu
    mainMenu: "Principal",
    administration: "Administración",
    stock: "Stock",
    salesMenu: "Ventas",
    accounting: "Contabilidad",
    reportsMenu: "Informes",
    aiAssistant: "Asistente IA",
    chatNetwork: "Chat-PharmaSoft",
    settings: "Configuración",
    testsMenu: "Pruebas y Desarrollo",
    testSuites: "Suites de Pruebas",
    signOutLabel: "Cerrar Sesión",
    logoutSuccess: "Ha cerrado sesión correctamente.",
    // General
    dailySales: "Ventas Diarias",
    customerServices: "Servicios al Cliente",
    productsToRenew: "Productos para Renovar",
    last7Days: "Ventas de los últimos 7 días",
    upcomingAppointments: "Próximas Citas",
    help: "Ayuda",
    logout: "Cerrar Sesión",
    // Help Center
    helpCenter: "Centro de Ayuda",
    searchHelp: "Buscar en la ayuda...",
    recentlyViewed: "Visto Recientemente",
    helpModules: "Módulos",
    quickFAQ: "FAQ Rápida",
    videoTutorials: "Tutoriales en Video",
    wasHelpful: "¿Te fue útil este artículo?",
    noResults: "Sin resultados",
    searchTip: "Consejo: prueba palabras clave diferentes",
    relatedArticles: "Artículos Relacionados",
    stepByStep: "Paso a Paso",
    viewAllTutorials: "Ver todos los tutoriales",
    // Sales module translations
    searchProducts: "Buscar productos por nombre o categoría",
    searchPlaceholder: "Buscar un medicamento...",
    noProductsFound: "No se encontraron productos",
    inStock: "En stock",
    add: "Añadir",
    cart: "Carrito",
    emptyCart: "Tu carrito está vacío",
    itemsInCart: "artículos en el carrito",
    itemInCart: "artículo en el carrito",
    cartEmpty: "Añade productos a tu carrito",
    total: "Total",
    checkout: "Finalizar venta",
  },
  ln: {
    // Header
    features: "Bisaleli",
    modules: "Biteni",
    ai: "Mayele ya Masini",
    contact: "Kokutana",
    freeTrial: "Komeka ofele",
    dashboard: "Tableau ya Bobongisi",
    signOut: "Kobima",
    connectPharmacy: "Kokangisa farmasi",
    disconnectPharmacy: "Kolongola farmasi",
    pharmacy: "Farmasi",
    // Hero
    heroTitle: "Ndenge ya kobongisa Farmasi mobimba",
    heroTagline: "Solution mobimba mpo na farmasi na yo",
    heroTransformTitle1: "Bobongola ndenge",
    heroTransformTitle2: "ya kobongisa farmasi na yo",
    heroDescription: "PharmaSoft ezali application mobimba ya kobongisa farmasi ezali na version web pe mobile, esalemi mpo na kosalisa misala na yo nyonso.",
    connectYourPharmacy: "Kokangisa Farmasi na yo",
    loading: "Ezali kokota...",
    seeDemo: "Tala Demo",
    pharmaciesUsing: "ba farmasi basalelaka kala PharmaSoft",
    stocks: "Biloko",
    optimal: "Malamu",
    attention: "Bokebisi",
    critical: "Likama",
    products: "biloko",
    availability: "disponibilité",
    sales: "Boteki",
    activeSession: "Session ezali kosala",
    // Features
    featuresTitle: "Bisaleli nyonso na kati ya solution moko",
    featuresSubtitle: "Pharmasoft ezali kobongola ndenge ya kobongisa farmasi na yo na bisaleli ya sika pe ebongisami malamu.",
    salesManagement: "Bobongisi Boteki",
    salesDesc: "Point ya koteka ya touchscreen, bobongisi prescriptions, réductions pe promotions automatiques.",
    stockManagement: "Bobongisi Biloko",
    stockDesc: "Inventaire ya temps réel, koyebisa taux, commandes automatiques, kolanda biloko ekokufa.",
    clientManagement: "Bobongisi Basombi",
    clientDesc: "Database ya basombi, historique ya boteki, programme ya fidélité, kokabola.",
    cashManagement: "Bobongisi Mbongo",
    cashDesc: "Ba caisse ebele, kolanda bozwi, kokangi mokolo na mokolo, rapport détaillé.",
    analytics: "Analyse & Rapport",
    analyticsDesc: "Tableau de bord analytique, rapport personalisé, prévision pe tendance.",
    security: "Sécurité ya Niveau Likolo",
    securityDesc: "Autentication multifactor, bobongisi malamu ya droits d'accès, cryptage ya données.",
    webMobile: "Web & Mobile",
    webMobileDesc: "Application web responsive pe applications mobiles natif (iOS pe Android).",
    multilingual: "Minoko Ebele",
    multilingualDesc: "Application ezali na minoko 4 : Français, Anglais, Espagnol pe Lingala.",
    voiceCommands: "Mitindo ya Mongongo",
    voiceDesc: "Contrôle application na mongongo, dictée vocale pe reconnaissance ya médicaments.",
    // Footer
    footerDescription: "Application mobimba ya kobongisa farmasi ezali na version web pe mobile.",
    quickLinks: "Liens ya Mbangu",
    contactUs: "Kutana na Biso",
    newsletter: "Inscription na Newsletter",
    newsletterDesc: "Kozwa sango ya sika pe offres spéciales.",
    email: "Email ya yo",
    subscribe: "Inscription",
    pricing: "Ntalo",
    blog: "Blog",
    termsOfUse: "Mibeko ya Kosalela",
    privacyPolicy: "Politiki ya Confidentialité",
    legalNotice: "Mentions Légales",
    allRightsReserved: "Droits nyonso ebatelami.",
    // Dashboard - Main
    dashboardTitle: "Tableau ya Bobongisi",
    refresh: "Kosala Sika",
    // Dashboard - Sales Metrics
    dailySalesTitle: "Boteki ya Mokolo",
    monthlySalesTitle: "Mbongo ya Sanza",
    dailyTransactions: "Misala ya Mokolo",
    averageBasket: "Panier ya Kati",
    vsYesterday: "vs lobi",
    thisMonth: "Sanza oyo",
    salesCompleted: "Boteki esalemi",
    perTransaction: "Na mosala moko",
    // Dashboard - Stock Metrics
    totalStockValue: "Motuya ya Biloko Nyonso",
    availableProducts: "Biloko Ezali",
    lowStockAlerts: "Bokebisi Biloko Moke",
    outOfStock: "Biloko Esili",
    totalInventory: "Inventaire mobimba",
    sufficientStock: "Stock ekoki",
    toReorder: "Ya kotia lisusu",
    stockDepleted: "Stock esili",
    // Dashboard - Quick Actions
    quickActions: "Misala ya Mbangu",
    newSale: "Boteki ya Sika",
    openRegister: "Kofungola Caisse",
    payment: "Kofuta",
    inventory: "Inventaire",
    reports: "Rapports",
    pos: "Esika ya Koteka",
    cashManagementAction: "Bobongisi Caisse",
    collections: "Kozwa Mbongo",
    stockManagementAction: "Bobongisi Stock",
    // Dashboard - Critical Alerts
    criticalAlerts: "Bokebisi ya Likama",
    noCriticalAlerts: "Bokebisi moko te",
    units: "biteni",
    unknownDate: "Date eyebani te",
    expiresOn: "Ekosila na",
    // Dashboard - Recent Activities
    recentActivities: "Misala ya Sika",
    noRecentActivities: "Mosala moko te",
    newSaleActivity: "Boteki ya sika",
    saleModified: "Boteki ebongisami",
    saleDeleted: "Boteki elongwe",
    supplierReception: "Kozwa na fournisseur",
    receptionUpdated: "Réception ebongisami",
    receptionDeleted: "Réception elongwe",
    inventoryCreated: "Inventaire esalemi",
    inventoryUpdated: "Inventaire ebongisami",
    inventoryDeleted: "Inventaire elongwe",
    registerOpened: "Session caisse efungwami",
    registerUpdated: "Session caisse ebongisami",
    registerDeleted: "Session caisse elongwe",
    // Dashboard - Top Products
    topProducts: "Biloko Etekamaka Mingi",
    noTopProducts: "Eloko moko te etekamaki",
    soldUnits: "etekamaki",
    // Dashboard - Active Sessions
    activeSessions: "Sessions Caisse Ezali Kosala",
    noActiveSessions: "Session moko te",
    openingBalance: "Mbongo ya kobanda",
    currentAmount: "Mbongo ya lelo",
    salesCount: "Boteki",
    // Dashboard - Credit & Promotions
    clientCredit: "Crédit ya Basombi",
    totalOngoing: "Total ezali kokende",
    activeAccounts: "Compte ezali kosala",
    paymentDelays: "Kofuta na retard",
    utilizationRate: "Taux ya kosalela",
    promotions: "Promotions",
    active: "Ezali kosala",
    usages: "Kosalela",
    savingsToday: "Kobomba lelo",
    // Sidebar Menu
    mainMenu: "Principal",
    administration: "Administration",
    stock: "Stock",
    salesMenu: "Boteki",
    accounting: "Comptabilité",
    reportsMenu: "Rapports",
    aiAssistant: "Assistant IA",
    chatNetwork: "Chat-PharmaSoft",
    settings: "Paramètres",
    testsMenu: "Tests & Développement",
    testSuites: "Suites ya Tests",
    signOutLabel: "Kobima",
    logoutSuccess: "Obimi malamu.",
    // General
    dailySales: "Boteki ya Mokolo",
    customerServices: "Bisaleli mpo na Basombi",
    productsToRenew: "Biloko ya Kotia Lisusu",
    last7Days: "Boteki ya mikolo 7 eleki",
    upcomingAppointments: "Rendez-vous Ekoya",
    help: "Lisalisi",
    logout: "Kobima",
    // Help Center
    helpCenter: "Esika ya Lisalisi",
    searchHelp: "Koluka na lisalisi...",
    recentlyViewed: "Emonami Sika",
    helpModules: "Biteni",
    quickFAQ: "FAQ ya Mbangu",
    videoTutorials: "Ba Tuto ya Video",
    wasHelpful: "Lisolo oyo esalisaki yo?",
    noResults: "Eloko moko te",
    searchTip: "Toli: meka maloba mosusu",
    relatedArticles: "Masolo ya Bondeko",
    stepByStep: "Etape na Etape",
    viewAllTutorials: "Tala ba tuto nyonso",
    // Sales module translations
    searchProducts: "Koluka biloko na kombo to catégorie",
    searchPlaceholder: "Koluka monganga...",
    noProductsFound: "Eloko moko te emonani",
    inStock: "Ezali",
    add: "Kobakisa",
    cart: "Kitunga",
    emptyCart: "Kitunga na yo ezali mpamba",
    itemsInCart: "biloko na kitunga",
    itemInCart: "eloko na kitunga",
    cartEmpty: "Bakisa biloko na kitunga na yo",
    total: "Totalé",
    checkout: "Kosilisa koteka",
  }
};

type LanguageContextType = {
  currentLanguage: Language;
  changeLanguage: (lang: Language) => void;
  languages: Language[];
  t: (key: string) => string; // Translation function
};

const defaultLanguages: Language[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ln', name: 'Lingala', flag: '🇨🇬' },
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Try to get the stored language from localStorage, or default to French
  const getStoredLanguage = (): Language => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('preferredLanguage');
      if (storedLang) {
        try {
          const parsed = JSON.parse(storedLang);
          // Validate the parsed object has the right structure
          if (parsed && parsed.code && parsed.name && parsed.flag) {
            return parsed;
          }
        } catch (e) {
          console.error('Failed to parse stored language', e);
        }
      }
    }
    return defaultLanguages[0]; // Default to French
  };

  const [currentLanguage, setCurrentLanguage] = useState<Language>(getStoredLanguage);

  // Translation function
  const t = (key: string): string => {
    const langTranslations = translations[currentLanguage.code];
    return langTranslations && langTranslations[key] ? langTranslations[key] : key;
  };

  // Function to change the language
  const changeLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', JSON.stringify(lang));
      document.documentElement.lang = lang.code; // Update the HTML lang attribute
    }
  };

  // Set the initial language on first load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = currentLanguage.code;
    }
  }, [currentLanguage.code]);

  // Listen for system settings language change event
  useEffect(() => {
    const handleSystemLanguageChange = (event: CustomEvent<{ languageCode: string }>) => {
      const langCode = event.detail?.languageCode;
      if (langCode) {
        const matchedLang = defaultLanguages.find(l => l.code === langCode);
        if (matchedLang && matchedLang.code !== currentLanguage.code) {
          changeLanguage(matchedLang);
        }
      }
    };
    
    window.addEventListener('systemSettingsLanguageChanged', handleSystemLanguageChange as EventListener);
    return () => window.removeEventListener('systemSettingsLanguageChanged', handleSystemLanguageChange as EventListener);
  }, [currentLanguage.code]);

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, languages: defaultLanguages, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
