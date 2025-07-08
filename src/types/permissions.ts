export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  level: number; // Niveau hiérarchique (1 = Admin, 2 = Manager, 3 = User, etc.)
}

export interface UserPermissions {
  role: string;
  permissions: string[];
  canAccess: (permission: string) => boolean;
  canManage: (targetRole: string) => boolean;
}

// Définition des permissions système
export const PERMISSIONS = {
  // Gestion utilisateurs
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  
  // Gestion pharmacie
  PHARMACY_VIEW: 'pharmacy.view',
  PHARMACY_EDIT: 'pharmacy.edit',
  PHARMACY_CONFIG: 'pharmacy.config',
  
  // Gestion stock
  STOCK_VIEW: 'stock.view',
  STOCK_CREATE: 'stock.create',
  STOCK_EDIT: 'stock.edit',
  STOCK_DELETE: 'stock.delete',
  STOCK_AUDIT: 'stock.audit',
  
  // Gestion ventes
  SALES_VIEW: 'sales.view',
  SALES_CREATE: 'sales.create',
  SALES_EDIT: 'sales.edit',
  SALES_DELETE: 'sales.delete',
  SALES_REPORTS: 'sales.reports',
  
  // Gestion comptabilité
  ACCOUNTING_VIEW: 'accounting.view',
  ACCOUNTING_CREATE: 'accounting.create',
  ACCOUNTING_EDIT: 'accounting.edit',
  ACCOUNTING_REPORTS: 'accounting.reports',
  
  // Gestion rapports
  REPORTS_VIEW: 'reports.view',
  REPORTS_CREATE: 'reports.create',
  REPORTS_EXPORT: 'reports.export',
  
  // Administration système
  ADMIN_USERS: 'admin.users',
  ADMIN_SYSTEM: 'admin.system',
  ADMIN_AUDIT: 'admin.audit',
} as const;

// Définition des rôles avec leurs permissions
export const ROLES: Record<string, Role> = {
  Admin: {
    id: 'Admin',
    name: 'Administrateur',
    description: 'Accès complet à toutes les fonctionnalités',
    level: 1,
    permissions: Object.values(PERMISSIONS)
  },
  
  Pharmacien: {
    id: 'Pharmacien',
    name: 'Pharmacien',
    description: 'Gestion complète de la pharmacie sauf administration',
    level: 2,
    permissions: [
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_EDIT,
      PERMISSIONS.PHARMACY_VIEW,
      PERMISSIONS.PHARMACY_EDIT,
      PERMISSIONS.STOCK_VIEW,
      PERMISSIONS.STOCK_CREATE,
      PERMISSIONS.STOCK_EDIT,
      PERMISSIONS.STOCK_AUDIT,
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.SALES_CREATE,
      PERMISSIONS.SALES_EDIT,
      PERMISSIONS.SALES_REPORTS,
      PERMISSIONS.ACCOUNTING_VIEW,
      PERMISSIONS.ACCOUNTING_CREATE,
      PERMISSIONS.ACCOUNTING_EDIT,
      PERMISSIONS.ACCOUNTING_REPORTS,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_CREATE,
      PERMISSIONS.REPORTS_EXPORT,
    ]
  },
  
  Préparateur: {
    id: 'Préparateur',
    name: 'Préparateur',
    description: 'Gestion du stock et préparation des commandes',
    level: 3,
    permissions: [
      PERMISSIONS.PHARMACY_VIEW,
      PERMISSIONS.STOCK_VIEW,
      PERMISSIONS.STOCK_CREATE,
      PERMISSIONS.STOCK_EDIT,
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.SALES_CREATE,
      PERMISSIONS.REPORTS_VIEW,
    ]
  },
  
  Caissier: {
    id: 'Caissier',
    name: 'Caissier',
    description: 'Gestion des ventes et encaissements',
    level: 4,
    permissions: [
      PERMISSIONS.PHARMACY_VIEW,
      PERMISSIONS.STOCK_VIEW,
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.SALES_CREATE,
      PERMISSIONS.SALES_EDIT,
      PERMISSIONS.REPORTS_VIEW,
    ]
  },
  
  Vendeur: {
    id: 'Vendeur',
    name: 'Vendeur',
    description: 'Vente de produits et conseil client',
    level: 5,
    permissions: [
      PERMISSIONS.PHARMACY_VIEW,
      PERMISSIONS.STOCK_VIEW,
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.SALES_CREATE,
    ]
  },
  
  Comptable: {
    id: 'Comptable',
    name: 'Comptable',
    description: 'Gestion de la comptabilité et rapports financiers',
    level: 4,
    permissions: [
      PERMISSIONS.PHARMACY_VIEW,
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.SALES_REPORTS,
      PERMISSIONS.ACCOUNTING_VIEW,
      PERMISSIONS.ACCOUNTING_CREATE,
      PERMISSIONS.ACCOUNTING_EDIT,
      PERMISSIONS.ACCOUNTING_REPORTS,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_CREATE,
      PERMISSIONS.REPORTS_EXPORT,
    ]
  },
  
  'Gestionnaire de stock': {
    id: 'Gestionnaire de stock',
    name: 'Gestionnaire de stock',
    description: 'Gestion avancée du stock et inventaires',
    level: 3,
    permissions: [
      PERMISSIONS.PHARMACY_VIEW,
      PERMISSIONS.STOCK_VIEW,
      PERMISSIONS.STOCK_CREATE,
      PERMISSIONS.STOCK_EDIT,
      PERMISSIONS.STOCK_AUDIT,
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_CREATE,
    ]
  },
  
  Employé: {
    id: 'Employé',
    name: 'Employé',
    description: 'Accès de base aux fonctionnalités',
    level: 6,
    permissions: [
      PERMISSIONS.PHARMACY_VIEW,
      PERMISSIONS.STOCK_VIEW,
      PERMISSIONS.SALES_VIEW,
    ]
  }
};