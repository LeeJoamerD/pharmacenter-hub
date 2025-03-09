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
    // Hero
    heroTitle: "Solution complète de gestion pharmaceutique",
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
    // Dashboard
    dashboard: "Tableau de bord",
    dailySales: "Ventes du jour",
    customerServices: "Services clients",
    productsToRenew: "Produits à renouveler",
    last7Days: "Ventes des 7 derniers jours",
    upcomingAppointments: "Prochains rendez-vous",
    help: "Aide",
    logout: "Déconnexion",
    // Sales module translations
    products: "Produits",
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
    // Hero
    heroTitle: "Complete Pharmaceutical Management Solution",
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
    // Dashboard
    dashboard: "Dashboard",
    dailySales: "Daily Sales",
    customerServices: "Customer Services",
    productsToRenew: "Products to Renew",
    last7Days: "Sales for the last 7 days",
    upcomingAppointments: "Upcoming Appointments",
    help: "Help",
    logout: "Logout",
    // Sales module translations
    products: "Products",
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
    // Hero
    heroTitle: "Solución Completa de Gestión Farmacéutica",
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
    cashDesc: "Multi-caises, seguimiento de pagos, cierres diarios, informes detallados.",
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
    quickLinks: "Enlaces Rápidos",
    contactUs: "Contáctenos",
    newsletter: "Suscripción al Boletín",
    newsletterDesc: "Reciba las últimas actualizaciones y ofertas especiales.",
    email: "Su email",
    subscribe: "Suscribirse",
    pricing: "Precios",
    blog: "Blog",
    termsOfUse: "Términos de Uso",
    privacyPolicy: "Politica de Privacidad",
    legalNotice: "Aviso Legal",
    allRightsReserved: "Todos los derechos reservados.",
    // Dashboard
    dashboard: "Panel de Control",
    dailySales: "Ventas Diarias",
    customerServices: "Servicios al Cliente",
    productsToRenew: "Productos para Renovar",
    last7Days: "Ventas de los últimos 7 días",
    upcomingAppointments: "Próximas Citas",
    help: "Ayuda",
    logout: "Cerrar Sesión",
    // Sales module translations
    products: "Productos",
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
    // Hero
    heroTitle: "Ndenge ya kobongisa Farmasi mobimba",
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
    // Dashboard
    dashboard: "Tableau ya Bobongisi",
    dailySales: "Boteki ya Mokolo",
    customerServices: "Bisaleli mpo na Basombi",
    productsToRenew: "Biloko ya Kotia Lisusu",
    last7Days: "Boteki ya mikolo 7 eleki",
    upcomingAppointments: "Rendez-vous Ekoya",
    help: "Lisalisi",
    logout: "Kobima",
    // Sales module translations
    products: "Biloko",
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
