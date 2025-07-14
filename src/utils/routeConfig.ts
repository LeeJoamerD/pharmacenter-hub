import { PERMISSIONS } from '@/types/permissions';

export interface RoutePermission {
  path: string;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
  requireAuth?: boolean;
  description?: string;
  category?: string;
}

// Configuration des permissions par route
export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  // Pages publiques
  '/': {
    path: '/',
    requireAuth: false,
    description: 'Page d\'accueil publique'
  },
  '/auth': {
    path: '/auth',
    requireAuth: false,
    description: 'Page de connexion'
  },
  '/pharmacy-registration': {
    path: '/pharmacy-registration',
    requireAuth: false,
    description: 'Inscription de pharmacie'
  },

  // Dashboard principal
  '/tableau-de-bord': {
    path: '/tableau-de-bord',
    requireAuth: true,
    permissions: [PERMISSIONS.PHARMACY_VIEW],
    description: 'Tableau de bord principal',
    category: 'dashboard'
  },
  '/dashboard': {
    path: '/dashboard',
    requireAuth: true,
    permissions: [PERMISSIONS.PHARMACY_VIEW],
    description: 'Tableau de bord principal (alias)',
    category: 'dashboard'
  },

  // Gestion des stocks
  '/dashboard/stock': {
    path: '/dashboard/stock',
    requireAuth: true,
    permissions: [PERMISSIONS.STOCK_VIEW],
    description: 'Gestion des stocks',
    category: 'stock'
  },
  '/dashboard/stock/create': {
    path: '/dashboard/stock/create',
    requireAuth: true,
    permissions: [PERMISSIONS.STOCK_CREATE],
    description: 'Création de produits',
    category: 'stock'
  },
  '/dashboard/stock/edit': {
    path: '/dashboard/stock/edit',
    requireAuth: true,
    permissions: [PERMISSIONS.STOCK_EDIT],
    description: 'Modification de produits',
    category: 'stock'
  },
  '/dashboard/stock/audit': {
    path: '/dashboard/stock/audit',
    requireAuth: true,
    permissions: [PERMISSIONS.STOCK_AUDIT],
    description: 'Audit des stocks',
    category: 'stock'
  },

  // Gestion des ventes
  '/dashboard/sales': {
    path: '/dashboard/sales',
    requireAuth: true,
    permissions: [PERMISSIONS.SALES_VIEW],
    description: 'Gestion des ventes',
    category: 'sales'
  },
  '/dashboard/sales/create': {
    path: '/dashboard/sales/create',
    requireAuth: true,
    permissions: [PERMISSIONS.SALES_CREATE],
    description: 'Création de ventes',
    category: 'sales'
  },
  '/dashboard/sales/reports': {
    path: '/dashboard/sales/reports',
    requireAuth: true,
    permissions: [PERMISSIONS.SALES_REPORTS],
    description: 'Rapports de ventes',
    category: 'sales'
  },

  // Comptabilité
  '/dashboard/accounting': {
    path: '/dashboard/accounting',
    requireAuth: true,
    permissions: [PERMISSIONS.ACCOUNTING_VIEW],
    description: 'Module comptabilité',
    category: 'accounting'
  },
  '/dashboard/accounting/create': {
    path: '/dashboard/accounting/create',
    requireAuth: true,
    permissions: [PERMISSIONS.ACCOUNTING_CREATE],
    description: 'Création d\'écritures comptables',
    category: 'accounting'
  },
  '/dashboard/accounting/reports': {
    path: '/dashboard/accounting/reports',
    requireAuth: true,
    permissions: [PERMISSIONS.ACCOUNTING_REPORTS],
    description: 'Rapports comptables',
    category: 'accounting'
  },

  // Gestion des utilisateurs
  '/dashboard/users': {
    path: '/dashboard/users',
    requireAuth: true,
    permissions: [PERMISSIONS.USERS_VIEW],
    description: 'Gestion des utilisateurs',
    category: 'admin'
  },
  '/dashboard/users/create': {
    path: '/dashboard/users/create',
    requireAuth: true,
    permissions: [PERMISSIONS.USERS_CREATE],
    description: 'Création d\'utilisateurs',
    category: 'admin'
  },
  '/dashboard/users/edit': {
    path: '/dashboard/users/edit',
    requireAuth: true,
    permissions: [PERMISSIONS.USERS_EDIT],
    description: 'Modification d\'utilisateurs',
    category: 'admin'
  },

  // Administration système
  '/dashboard/admin': {
    path: '/dashboard/admin',
    requireAuth: true,
    permissions: [PERMISSIONS.ADMIN_SYSTEM],
    description: 'Administration système',
    category: 'admin'
  },
  '/dashboard/admin/audit': {
    path: '/dashboard/admin/audit',
    requireAuth: true,
    permissions: [PERMISSIONS.ADMIN_AUDIT],
    description: 'Audit système',
    category: 'admin'
  },

  // Rapports
  '/dashboard/reports': {
    path: '/dashboard/reports',
    requireAuth: true,
    permissions: [PERMISSIONS.REPORTS_VIEW],
    description: 'Module rapports',
    category: 'reports'
  },
  '/dashboard/reports/create': {
    path: '/dashboard/reports/create',
    requireAuth: true,
    permissions: [PERMISSIONS.REPORTS_CREATE],
    description: 'Création de rapports',
    category: 'reports'
  },
  '/dashboard/reports/export': {
    path: '/dashboard/reports/export',
    requireAuth: true,
    permissions: [PERMISSIONS.REPORTS_EXPORT],
    description: 'Export de rapports',
    category: 'reports'
  },

  // Configuration pharmacie
  '/dashboard/pharmacy/config': {
    path: '/dashboard/pharmacy/config',
    requireAuth: true,
    permissions: [PERMISSIONS.PHARMACY_CONFIG],
    description: 'Configuration pharmacie',
    category: 'config'
  }
};

// Fonction utilitaire pour obtenir les permissions d'une route
export const getRoutePermissions = (path: string): RoutePermission | null => {
  // Recherche exacte d'abord
  if (ROUTE_PERMISSIONS[path]) {
    return ROUTE_PERMISSIONS[path];
  }

  // Recherche par pattern (pour les routes dynamiques)
  const patterns = Object.keys(ROUTE_PERMISSIONS);
  for (const pattern of patterns) {
    if (path.startsWith(pattern)) {
      return ROUTE_PERMISSIONS[pattern];
    }
  }

  return null;
};

// Fonction pour vérifier si une route nécessite une permission spécifique
export const requiresPermission = (path: string, permission: string): boolean => {
  const routeConfig = getRoutePermissions(path);
  return routeConfig?.permissions?.includes(permission) || false;
};

// Fonction pour obtenir toutes les routes par catégorie
export const getRoutesByCategory = (category: string): RoutePermission[] => {
  return Object.values(ROUTE_PERMISSIONS).filter(
    route => route.category === category
  );
};