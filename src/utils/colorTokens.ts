/**
 * Utilitaire centralisé pour les couleurs sémantiques
 * Utilisé par les composants IA pour garantir la cohérence des couleurs
 */

export type StatusType = 'active' | 'training' | 'inactive' | 'error' | 'pending';
export type ImpactType = 'critical' | 'high' | 'medium' | 'low';
export type TrendDirection = 'positive' | 'negative' | 'neutral';

/**
 * Retourne les classes Tailwind pour un statut donné
 */
export function getStatusColor(status: StatusType): { text: string; bg: string; badge: string } {
  switch (status) {
    case 'active':
      return {
        text: 'text-success',
        bg: 'bg-success/10',
        badge: 'bg-success/10 text-success'
      };
    case 'training':
      return {
        text: 'text-info',
        bg: 'bg-info/10',
        badge: 'bg-info/10 text-info'
      };
    case 'inactive':
      return {
        text: 'text-muted-foreground',
        bg: 'bg-muted',
        badge: 'bg-muted text-muted-foreground'
      };
    case 'error':
      return {
        text: 'text-destructive',
        bg: 'bg-destructive/10',
        badge: 'bg-destructive/10 text-destructive'
      };
    case 'pending':
      return {
        text: 'text-warning',
        bg: 'bg-warning/10',
        badge: 'bg-warning/10 text-warning'
      };
    default:
      return {
        text: 'text-muted-foreground',
        bg: 'bg-muted',
        badge: 'bg-muted text-muted-foreground'
      };
  }
}

/**
 * Retourne les classes Tailwind pour un niveau d'impact
 */
export function getImpactColor(impact: ImpactType): { text: string; bg: string; border: string; badge: string } {
  switch (impact) {
    case 'critical':
      return {
        text: 'text-destructive',
        bg: 'bg-destructive/10',
        border: 'border-destructive/20',
        badge: 'bg-destructive/10 text-destructive border-destructive/20'
      };
    case 'high':
      return {
        text: 'text-warning',
        bg: 'bg-warning/10',
        border: 'border-warning/20',
        badge: 'bg-warning/10 text-warning border-warning/20'
      };
    case 'medium':
      return {
        text: 'text-warning',
        bg: 'bg-warning/20',
        border: 'border-warning/30',
        badge: 'bg-warning/20 text-warning border-warning/30'
      };
    case 'low':
      return {
        text: 'text-info',
        bg: 'bg-info/10',
        border: 'border-info/20',
        badge: 'bg-info/10 text-info border-info/20'
      };
    default:
      return {
        text: 'text-muted-foreground',
        bg: 'bg-muted',
        border: 'border-border',
        badge: 'bg-muted text-muted-foreground'
      };
  }
}

/**
 * Détermine la direction d'une tendance à partir de sa chaîne
 */
export function getTrendDirection(trend: string): TrendDirection {
  if (trend.startsWith('+')) return 'positive';
  if (trend.startsWith('-')) return 'negative';
  return 'neutral';
}

/**
 * Retourne les classes Tailwind pour une tendance
 */
export function getTrendColor(trend: string): { text: string; bg: string } {
  const direction = getTrendDirection(trend);
  switch (direction) {
    case 'positive':
      return { text: 'text-success', bg: 'bg-success/10' };
    case 'negative':
      return { text: 'text-destructive', bg: 'bg-destructive/10' };
    default:
      return { text: 'text-muted-foreground', bg: 'bg-muted' };
  }
}

/**
 * Retourne les classes Tailwind pour une valeur de santé (0-100)
 */
export function getHealthColor(value: number): { text: string; bg: string; badge: string } {
  if (value >= 90) {
    return {
      text: 'text-success',
      bg: 'bg-success/10',
      badge: 'bg-success/10 text-success'
    };
  } else if (value >= 70) {
    return {
      text: 'text-info',
      bg: 'bg-info/10',
      badge: 'bg-info/10 text-info'
    };
  } else if (value >= 50) {
    return {
      text: 'text-warning',
      bg: 'bg-warning/10',
      badge: 'bg-warning/10 text-warning'
    };
  } else {
    return {
      text: 'text-destructive',
      bg: 'bg-destructive/10',
      badge: 'bg-destructive/10 text-destructive'
    };
  }
}

/**
 * Couleurs sémantiques pour les modèles IA
 */
export const MODEL_SEMANTIC_COLORS = [
  { color: 'text-info', bgColor: 'bg-info/10' },
  { color: 'text-destructive', bgColor: 'bg-destructive/10' },
  { color: 'text-success', bgColor: 'bg-success/10' },
  { color: 'text-primary', bgColor: 'bg-primary/10' },
  { color: 'text-warning', bgColor: 'bg-warning/10' },
  { color: 'text-accent-foreground', bgColor: 'bg-accent' },
];
