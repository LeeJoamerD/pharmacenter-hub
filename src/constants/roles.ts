/**
 * Liste unifiée des rôles PharmaSoft
 * Ce fichier est la source unique de vérité pour tous les rôles utilisateur.
 * Toute modification doit être synchronisée avec la contrainte CHECK de la table personnel.
 */

export const UNIFIED_ROLES = [
  'Admin',
  'Pharmacien Titulaire',
  'Pharmacien Adjoint',
  'Préparateur',
  'Technicien',
  'Caissier',
  'Vendeur',
  'Gestionnaire de stock',
  'Comptable',
  'Secrétaire',
  'Livreur',
  'Stagiaire',
  'Invité'
] as const;

export type UnifiedRole = typeof UNIFIED_ROLES[number];

/**
 * Rôles ayant des privilèges administratifs
 */
export const ADMIN_ROLES: UnifiedRole[] = ['Admin', 'Pharmacien Titulaire', 'Pharmacien Adjoint'];

/**
 * Rôles ayant accès à la gestion du personnel
 */
export const PERSONNEL_MANAGEMENT_ROLES: UnifiedRole[] = ['Admin', 'Pharmacien Titulaire'];

/**
 * Rôles ayant accès à la comptabilité
 */
export const ACCOUNTING_ROLES: UnifiedRole[] = ['Admin', 'Pharmacien Titulaire', 'Comptable'];

/**
 * Rôles ayant accès à la caisse
 */
export const CASH_REGISTER_ROLES: UnifiedRole[] = ['Admin', 'Pharmacien Titulaire', 'Pharmacien Adjoint', 'Caissier', 'Vendeur'];

/**
 * Mapping des anciens rôles vers les nouveaux
 */
export const ROLE_MIGRATION_MAP: Record<string, UnifiedRole> = {
  'Pharmacien': 'Pharmacien Titulaire',
  'Étudiant en pharmacie': 'Stagiaire',
  'Manager': 'Pharmacien Adjoint',
  'Gérant': 'Pharmacien Adjoint',
};

/**
 * Vérifie si un rôle a des privilèges administratifs
 */
export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role as UnifiedRole);
}

/**
 * Vérifie si un rôle peut gérer le personnel
 */
export function canManagePersonnel(role: string | null | undefined): boolean {
  return !!role && PERSONNEL_MANAGEMENT_ROLES.includes(role as UnifiedRole);
}
